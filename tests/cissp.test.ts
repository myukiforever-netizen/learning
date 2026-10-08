// Contrôle de la matière « CISSP » (src/data/matieres/cissp/*.json), règles de docs/GUIDE_CISSP.md (v2) :
// anglais simple, deux types de cartes (qcm, flash), QCM à 4 choix comme à l'examen, définitions officielles
// en 3 cartes. La vérification « mot pour mot » contre le manuel est faite à part
// (scripts/verifier-definitions.mjs), car les PDF ne sont pas dans le dépôt.
//
// CISSP_FICHIER=d1-m01-ethique-cia.json npx vitest run tests/cissp.test.ts  → ne teste que ce fichier.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validerMatiere, type CarteJson, type MatiereJson, type ModuleJson } from "@/lib/import/schema";
import { phaseDe } from "@/lib/odyssee/composer";
import type { Carte } from "@/lib/types";

const DOSSIER = join(process.cwd(), "src", "data", "matieres", "cissp");
const filtre = process.env.CISSP_FICHIER;
const fichiers = readdirSync(DOSSIER)
  .filter((nom) => /^d\d-m\d\d-.+\.json$/.test(nom))
  .filter((nom) => filtre === undefined || nom === filtre)
  .sort();
const modules = fichiers.map((nom) => JSON.parse(readFileSync(join(DOSSIER, nom), "utf8")) as ModuleJson);
const matiere: MatiereJson = { id: "cissp", name: "CISSP", version: 1, modules };

const estDef = (c: CarteJson) => /-def[1-3]$/.test(c.id);
const racineDef = (c: CarteJson) => c.id.replace(/-def[1-3]$/, "");
const phase = (c: CarteJson) => phaseDe(c as unknown as Carte);
const concepts = modules.flatMap((m) => m.concepts);

const MOTS_MAX = 22;
const MOTS_MOYENNE_MAX = 14;
const QUALIFICATIFS = /\b(BEST|MOST|FIRST|LEAST|NOT|EXCEPT)\b/;
const emoji = /\p{Extended_Pictographic}/u;
const accents = /[éèêëàâçùûôîïœÉÈÀÇ]/;
const MOTS_INTERDITS =
  /\b(utilize[sd]?|utilizing|commence[sd]?|subsequently|furthermore|moreover|whereas|thereby|albeit|ascertain|endeavou?r|facilitat(e|es|ed|ing)|leverag(e|es|ed|ing)|notwithstanding|henceforth)\b/i;

const motsDe = (p: string) => p.split(/\s+/).filter((m) => /[\p{L}\p{N}]/u.test(m)).length;
const phrases = (t: string) =>
  t
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

/** Les textes écrits par nous (hors phrases officielles du manuel), avec leur provenance. */
function textesNous(concept: ModuleJson["concepts"][number]): { ou: string; texte: string }[] {
  const out: { ou: string; texte: string }[] = [];
  const add = (ou: string, t: unknown) => {
    if (typeof t === "string") out.push({ ou, texte: t });
  };
  add(concept.id, concept.name);
  (concept.decouverte ?? []).forEach((e, i) => {
    const ou = `${concept.id} écran ${i + 1}`;
    if (e.type === "histoire") {
      add(ou, e.titre);
      e.paragraphes.forEach((p) => add(ou, p));
    } else if (e.type === "analogie") {
      add(ou, e.titre);
      add(ou, e.comme);
      add(ou, e.enVrai);
    } else if (e.type === "exemple") {
      add(ou, e.titre);
      add(ou, e.texte);
    } else {
      add(ou, e.question);
      add(ou, e.explanation);
      e.options.forEach((o) => add(ou, o));
    }
  });
  for (const c of concept.cards) {
    add(c.id, c.question);
    add(c.id, c.explanation);
    add(c.id, c.explanation_more);
    (c.options_why ?? []).forEach((o) => add(c.id, o));
    if (!estDef(c)) {
      add(c.id, c.answer);
      (c.options ?? []).forEach((o) => add(c.id, o));
    }
  }
  return out;
}

describe("matière CISSP (v2 : anglais, QCM et cartes à retenir)", () => {
  it("contient au moins un fichier de galaxie", () => {
    expect(fichiers.length).toBeGreaterThan(0);
  });

  it("respecte le format (ids uniques, options, réponses…)", () => {
    expect(validerMatiere(matiere)).toEqual([]);
  });

  it("nomme galaxies, planètes et cartes selon la convention d'ids", () => {
    const erreurs: string[] = [];
    fichiers.forEach((nom, i) => {
      const mod = modules[i];
      const attendu = nom.replace(/\.json$/, "");
      if (mod.id !== attendu) erreurs.push(`${nom} : l'id du module doit être « ${attendu} » (trouvé « ${mod.id} »).`);
      const domaine = mod.id.match(/^d(\d)-/)?.[1];
      for (const concept of mod.concepts) {
        if (!concept.id.startsWith(`d${domaine}-`)) erreurs.push(`${concept.id} : doit commencer par « d${domaine}- ».`);
        for (const carte of concept.cards) {
          if (!carte.id.startsWith(`${concept.id}-`)) erreurs.push(`${carte.id} : doit commencer par « ${concept.id}- ».`);
          else if (!/-(def[1-3]|q\d+|f\d+)$/.test(carte.id)) erreurs.push(`${carte.id} : l'id doit finir par -def1/-def2/-def3, -q<n> (QCM) ou -f<n> (flash).`);
        }
      }
    });
    expect(erreurs).toEqual([]);
  });

  it("n'utilise que des QCM et des cartes flash ; chaque QCM a 4 choix et ses explications", () => {
    const erreurs: string[] = [];
    for (const concept of concepts) {
      for (const c of concept.cards) {
        if (c.type !== "qcm" && c.type !== "flash") erreurs.push(`${c.id} : type « ${c.type} » interdit (seulement qcm ou flash).`);
        if (c.type !== "qcm") continue;
        const options = c.options ?? [];
        if (options.length !== 4) erreurs.push(`${c.id} : ${options.length} choix (exactement 4 attendus).`);
        if (new Set(options).size !== options.length) erreurs.push(`${c.id} : deux choix identiques.`);
        if (options.some((o) => /\b(all|none) of the above\b/i.test(o))) erreurs.push(`${c.id} : « all/none of the above » interdit.`);
        const why = c.options_why ?? [];
        if (why.length !== options.length) erreurs.push(`${c.id} : « options_why » doit avoir 4 éléments.`);
        const bon = options.indexOf(c.answer);
        why.forEach((w, i) => {
          if (i === bon && w !== "") erreurs.push(`${c.id} : « options_why » de la bonne réponse doit être vide.`);
          if (i !== bon && w.trim() === "") erreurs.push(`${c.id} : « options_why » n° ${i + 1} (mauvaise réponse) doit expliquer pourquoi.`);
        });
      }
    }
    expect(erreurs).toEqual([]);
  });

  it("donne à chaque planète une découverte, des QCM style examen, des flash et un bon mélange de phases", () => {
    const erreurs: string[] = [];
    for (const mod of modules) {
      if (mod.concepts.length < 4 || mod.concepts.length > 9) erreurs.push(`${mod.id} : ${mod.concepts.length} planètes (attendu 4 à 9).`);
      for (const concept of mod.concepts) {
        const ecrans = concept.decouverte ?? [];
        if (ecrans.length < 3 || ecrans.length > 8) erreurs.push(`${concept.id} : ${ecrans.length} écrans de découverte (attendu 3 à 8).`);
        if (!ecrans.some((e) => e.type === "predire")) erreurs.push(`${concept.id} : il manque un écran « predire ».`);
        if (!ecrans.some((e) => e.type === "analogie")) erreurs.push(`${concept.id} : il manque une « analogie ».`);
        const normales = concept.cards.filter((c) => !estDef(c));
        const qcm = normales.filter((c) => c.type === "qcm");
        const flash = normales.filter((c) => c.type === "flash");
        if (qcm.length < 9) erreurs.push(`${concept.id} : ${qcm.length} QCM hors définitions (attendu ≥ 9).`);
        if (flash.length < 3) erreurs.push(`${concept.id} : ${flash.length} flash hors définitions (attendu ≥ 3).`);
        const examen = qcm.filter((c) => QUALIFICATIFS.test(c.question)).length;
        if (examen < 4) erreurs.push(`${concept.id} : ${examen} QCM « style examen » avec BEST / MOST / FIRST / LEAST / NOT (attendu ≥ 4).`);
        const compr = qcm.filter((c) => phase(c) === "comprehension").length;
        const entr = qcm.filter((c) => phase(c) === "entrainement").length;
        if (compr < 3) erreurs.push(`${concept.id} : ${compr} QCM en « comprehension » (attendu ≥ 3).`);
        if (entr < 5) erreurs.push(`${concept.id} : ${entr} QCM en « entrainement » (attendu ≥ 5).`);
        if (flash.some((c) => phase(c) !== "entrainement")) erreurs.push(`${concept.id} : les flash (hors -def1) doivent être en « entrainement ».`);
        if (concept.cards.length < 16 || concept.cards.length > 40) erreurs.push(`${concept.id} : ${concept.cards.length} cartes (attendu 16 à 40).`);
        const premiereNormale = concept.cards.findIndex((c) => !estDef(c));
        const derniereDef = concept.cards.map((c) => estDef(c)).lastIndexOf(true);
        if (derniereDef > premiereNormale && premiereNormale !== -1) erreurs.push(`${concept.id} : placer les définitions officielles avant les autres cartes.`);
      }
    }
    expect(erreurs).toEqual([]);
  });

  it("construit chaque définition officielle comme prévu (def1 lecture, def2 QCM de la phrase exacte, def3 de mémoire)", () => {
    const erreurs: string[] = [];
    for (const concept of concepts) {
      const groupes = new Map<string, CarteJson[]>();
      for (const c of concept.cards.filter(estDef)) groupes.set(racineDef(c), [...(groupes.get(racineDef(c)) ?? []), c]);
      for (const [racine, cartes] of groupes) {
        const par = (n: number) => cartes.find((c) => c.id === `${racine}-def${n}`);
        const [d1, d2, d3] = [1, 2, 3].map(par);
        if (!d1) erreurs.push(`${racine} : il manque -def1.`);
        if (!d3) erreurs.push(`${racine} : il manque -def3.`);
        if (d1 && (d1.type !== "flash" || phase(d1) !== "comprehension")) erreurs.push(`${d1.id} : doit être un flash de phase « comprehension ».`);
        if (d3 && (d3.type !== "flash" || phase(d3) !== "entrainement")) erreurs.push(`${d3.id} : doit être un flash de phase « entrainement ».`);
        if (d2) {
          if (d2.type !== "qcm" || phase(d2) !== "entrainement") erreurs.push(`${d2.id} : doit être un QCM de phase « entrainement ».`);
          if (!(d2.options ?? []).includes(d2.answer)) erreurs.push(`${d2.id} : « answer » doit être l'une des 4 phrases.`);
        }
        const phrasesDef = new Set(cartes.map((c) => c.answer.trim()));
        if (phrasesDef.size > 1) erreurs.push(`${racine} : les cartes de la suite n'ont pas toutes la même phrase officielle.`);
        for (const c of cartes) if (c.retention_goal !== "life") erreurs.push(`${c.id} : « retention_goal » doit être « life ».`);
        if (d1 && !d1.question.startsWith("Official definition:")) erreurs.push(`${d1.id} : la question doit commencer par « Official definition: ».`);
      }
    }
    expect(erreurs).toEqual([]);
  });

  it("varie la position de la bonne réponse et ne la rend pas devinable par sa longueur", () => {
    const erreurs: string[] = [];
    for (const mod of modules) {
      const qcm = mod.concepts.flatMap((c) => c.cards.filter((k) => k.type === "qcm"));
      const nonDef = qcm.filter((k) => !estDef(k));
      if (qcm.length >= 40) {
        const positions = [0, 0, 0, 0];
        for (const k of qcm) positions[(k.options ?? []).indexOf(k.answer)] += 1;
        positions.forEach((n, i) => {
          const part = n / qcm.length;
          if (part < 0.15 || part > 0.35) erreurs.push(`${mod.id} : la bonne réponse est en position ${i + 1} dans ${Math.round(part * 100)} % des QCM (attendu 15 à 35 %).`);
        });
      }
      if (nonDef.length >= 30) {
        const plusLongue = nonDef.filter((k) => {
          const longueurs = (k.options ?? []).map((o) => o.length);
          return k.answer.length === Math.max(...longueurs);
        }).length;
        const part = plusLongue / nonDef.length;
        if (part > 0.45 || part < 0.1) erreurs.push(`${mod.id} : la bonne réponse est la plus longue dans ${Math.round(100 * part)} % des QCM (attendu 10 à 45 % : ni toujours, ni jamais).`);
      }
      for (const concept of mod.concepts) {
        let serie = 0;
        let derniere = -1;
        for (const k of concept.cards.filter((c) => c.type === "qcm")) {
          const pos = (k.options ?? []).indexOf(k.answer);
          serie = pos === derniere ? serie + 1 : 1;
          derniere = pos;
          if (serie > 3) {
            erreurs.push(`${k.id} : plus de 3 bonnes réponses de suite en position ${pos + 1}.`);
            break;
          }
        }
      }
    }
    expect(erreurs).toEqual([]);
  });

  it("est écrit en anglais simple : phrases courtes, mots courants, pas de français, pas de balises", () => {
    const erreurs: string[] = [];
    for (const concept of concepts) {
      const longueurs: number[] = [];
      for (const { ou, texte } of textesNous(concept)) {
        if (accents.test(texte)) erreurs.push(`${ou} : lettre accentuée (français ?) : « ${texte.slice(0, 60)} »`);
        if (/\*\*|<\/?[a-z]+>/i.test(texte)) erreurs.push(`${ou} : balise ou gras interdit.`);
        if (emoji.test(texte)) erreurs.push(`${ou} : emoji interdit.`);
        const m = texte.match(MOTS_INTERDITS);
        if (m) erreurs.push(`${ou} : mot trop compliqué « ${m[0]} » (voir la liste du guide).`);
        for (const p of phrases(texte)) {
          const n = motsDe(p);
          longueurs.push(n);
          if (n > MOTS_MAX) erreurs.push(`${ou} : phrase de ${n} mots (max ${MOTS_MAX}) : « ${p.slice(0, 70)}… »`);
        }
      }
      const moyenne = longueurs.reduce((s, n) => s + n, 0) / Math.max(1, longueurs.length);
      if (moyenne > MOTS_MOYENNE_MAX) erreurs.push(`${concept.id} : phrases trop longues en moyenne (${moyenne.toFixed(1)} mots, max ${MOTS_MOYENNE_MAX}).`);
    }
    expect(erreurs).toEqual([]);
  });
});
