// Contrôle des traductions anglaises du CISSP (src/data/matieres/cissp/en/<id du module>.json) :
// chaque galaxie française doit avoir son équivalent anglais, de même structure (mêmes ids, même ordre,
// mêmes nombres d'options, de trous, d'éléments…), et les définitions officielles doivent être identiques.
//
// CISSP_FICHIER=d1-m01-ethique-cia.json npx vitest run tests/cissp-en.test.ts  → ne teste que ce module.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CarteJson, ModuleJson } from "@/lib/import/schema";

const DOSSIER = join(process.cwd(), "src", "data", "matieres", "cissp");
const filtre = process.env.CISSP_FICHIER;

const nomsFichiers = readdirSync(DOSSIER)
  .filter((n) => /^d\d-m\d\d-.+\.json$/.test(n))
  .filter((n) => filtre === undefined || n === filtre)
  .sort();

const lire = (chemin: string) => JSON.parse(readFileSync(chemin, "utf8"));
const paires = nomsFichiers.map((nom) => {
  const cheminEn = join(DOSSIER, "en", nom);
  return { nom, fr: lire(join(DOSSIER, nom)) as ModuleJson, en: existsSync(cheminEn) ? (lire(cheminEn) as ModuleJson) : null };
});

const estDef = (c: { id: string }) => /-def[1-4]$/.test(c.id);
const MOTS_MAX = 25;
const accentsFrancais = /[éèêëàâçùûôîïœÉÈÀÇ]/;
const emoji = /\p{Extended_Pictographic}/u;
const remplirTrous = (q: string) => q.replace(/\[\[(.+?)\]\]/g, (_, t: string) => t.split("|")[0]);
const nbTrous = (q: string) => (q.match(/\[\[.+?\]\]/g) ?? []).length;
const motsDe = (p: string) => p.split(/\s+/).filter((m) => /[\p{L}\p{N}]/u.test(m)).length;
const phrases = (t: string) =>
  t
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

type Ecran = NonNullable<ModuleJson["concepts"][number]["decouverte"]>[number];

function comparerEcrans(ou: string, fr: Ecran[], en: Ecran[], erreurs: string[]) {
  if (fr.length !== en.length) return erreurs.push(`${ou} : ${en.length} écrans de découverte en anglais, ${fr.length} en français.`);
  fr.forEach((f, i) => {
    const e = en[i];
    const o = `${ou} écran ${i + 1}`;
    if (f.type !== e.type) return erreurs.push(`${o} : type « ${e.type} » au lieu de « ${f.type} ».`);
    const vide = (t: unknown) => typeof t !== "string" || t.trim() === "";
    if (f.type === "histoire" && e.type === "histoire") {
      if (vide(e.titre) || e.paragraphes.length !== f.paragraphes.length || e.paragraphes.some(vide)) erreurs.push(`${o} : histoire incomplète.`);
    } else if (f.type === "analogie" && e.type === "analogie") {
      if (vide(e.titre) || vide(e.comme) || vide(e.enVrai)) erreurs.push(`${o} : analogie incomplète.`);
    } else if (f.type === "exemple" && e.type === "exemple") {
      if (vide(e.titre) || vide(e.texte)) erreurs.push(`${o} : exemple incomplet.`);
    } else if (f.type === "predire" && e.type === "predire") {
      if (vide(e.question) || vide(e.explanation) || e.options.length !== f.options.length || e.options.some(vide)) erreurs.push(`${o} : prédiction incomplète.`);
      else if (e.options.indexOf(e.answer) !== f.options.indexOf(f.answer)) erreurs.push(`${o} : la bonne réponse doit être l'option n° ${f.options.indexOf(f.answer) + 1}, copiée exactement.`);
    }
  });
}

function comparerCarte(f: CarteJson, e: CarteJson, erreurs: string[]) {
  const o = f.id;
  const vide = (t: unknown) => typeof t !== "string" || t.trim() === "";
  if (vide(e.question) || vide(e.answer) || vide(e.explanation)) return erreurs.push(`${o} : question, answer ou explanation manquant.`);
  if ((f.explanation_more === undefined) !== (e.explanation_more === undefined)) erreurs.push(`${o} : « explanation_more » présent d'un seul côté.`);
  if (f.options !== undefined) {
    if (!e.options || e.options.length !== f.options.length || e.options.some(vide)) return erreurs.push(`${o} : « options » différentes du français.`);
    if (e.options.indexOf(e.answer) !== f.options.indexOf(f.answer)) erreurs.push(`${o} : « answer » doit être l'option n° ${f.options.indexOf(f.answer) + 1}, copiée exactement.`);
    if (f.options_why !== undefined) {
      if (!e.options_why || e.options_why.length !== f.options_why.length) erreurs.push(`${o} : « options_why » différent du français.`);
      else {
        f.options_why.forEach((w, i) => {
          if ((w === "") !== (e.options_why![i] === "")) erreurs.push(`${o} : « options_why » n° ${i + 1} doit être ${w === "" ? "vide" : "rempli"}.`);
        });
      }
    }
  } else if (e.options !== undefined) erreurs.push(`${o} : « options » en trop.`);

  if (f.type === "cloze") {
    if (nbTrous(e.question) !== nbTrous(f.question)) erreurs.push(`${o} : ${nbTrous(e.question)} trous au lieu de ${nbTrous(f.question)}.`);
    const net = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (net(remplirTrous(e.question)) !== net(e.answer)) erreurs.push(`${o} : la question, trous remplis, doit redonner « answer ».`);
  }
  const df = f.data as Record<string, unknown> | undefined;
  const de = e.data as Record<string, unknown> | undefined;
  if (f.type === "sort" && df) {
    if (!de || de.mode !== df.mode) return erreurs.push(`${o} : « data.mode » différent.`);
    const itf = df.items as { text?: string; category?: string }[] | string[];
    const ite = de.items as { text?: string; category?: string }[] | string[];
    if (!Array.isArray(ite) || ite.length !== itf.length) return erreurs.push(`${o} : nombre d'éléments différent.`);
    if (df.mode === "classer") {
      const cf = df.categories as string[];
      const ce = de.categories as string[];
      if (!Array.isArray(ce) || ce.length !== cf.length) return erreurs.push(`${o} : nombre de catégories différent.`);
      (itf as { category: string }[]).forEach((it, i) => {
        if (ce.indexOf((ite as { category: string }[])[i].category) !== cf.indexOf(it.category)) erreurs.push(`${o} : élément ${i + 1} dans la mauvaise catégorie.`);
      });
    }
  }
  if ((f.type === "worked_example" || f.type === "faded_example") && df) {
    const sf = df.steps as { prompt?: string; text: string }[];
    const se = (de?.steps ?? []) as { prompt?: string; text: string }[];
    if (se.length !== sf.length) erreurs.push(`${o} : ${se.length} étapes au lieu de ${sf.length}.`);
    else {
      sf.forEach((s, i) => {
        if ((s.prompt === undefined) !== (se[i].prompt === undefined)) erreurs.push(`${o} : « prompt » de l'étape ${i + 1} présent d'un seul côté.`);
      });
    }
  }

  if (estDef(f)) {
    const phraseFr = f.answer.split(/\n\s*\nTraduction\s*:/)[0].trim();
    if (f.type === "cloze") {
      if (e.question !== f.question || e.answer !== f.answer) erreurs.push(`${o} : une définition à trous doit rester IDENTIQUE à la version française (phrase officielle).`);
    } else if (e.answer.trim() !== phraseFr) erreurs.push(`${o} : « answer » doit être exactement la phrase officielle, sans traduction.`);
  }
}

function textesAnglais(m: ModuleJson): { ou: string; texte: string }[] {
  const out: { ou: string; texte: string }[] = [{ ou: m.id, texte: m.name }];
  const add = (ou: string, t: unknown) => {
    if (typeof t === "string") out.push({ ou, texte: t });
  };
  for (const c of m.concepts) {
    add(c.id, c.name);
    (c.decouverte ?? []).forEach((e, i) => {
      const ou = `${c.id} écran ${i + 1}`;
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
        e.options.forEach((x) => add(ou, x));
      }
    });
    for (const k of c.cards) {
      add(k.id, k.question);
      add(k.id, k.explanation);
      add(k.id, k.explanation_more);
      add(k.id, k.answer);
      (k.options ?? []).forEach((x) => add(k.id, x));
      (k.options_why ?? []).forEach((x) => add(k.id, x));
      const d = k.data as { categories?: string[]; items?: (string | { text: string })[]; steps?: { prompt?: string; text: string }[] } | undefined;
      (d?.categories ?? []).forEach((x) => add(k.id, x));
      (d?.items ?? []).forEach((x) => add(k.id, typeof x === "string" ? x : x.text));
      (d?.steps ?? []).forEach((s) => {
        add(k.id, s.prompt);
        add(k.id, s.text);
      });
    }
  }
  return out;
}

describe("traductions anglaises du CISSP", () => {
  it("existent pour chaque galaxie, avec le même id", () => {
    const erreurs: string[] = [];
    for (const { nom, fr, en } of paires) {
      if (!en) erreurs.push(`${nom} : fichier « en/${nom} » manquant.`);
      else if (en.id !== fr.id) erreurs.push(`${nom} : id « ${en.id} » au lieu de « ${fr.id} ».`);
      else if (typeof en.name !== "string" || en.name.trim() === "") erreurs.push(`${nom} : « name » manquant.`);
    }
    expect(erreurs).toEqual([]);
  });

  it("ont la même structure que le français (planètes, écrans, cartes, options, trous, éléments)", () => {
    const erreurs: string[] = [];
    for (const { fr, en } of paires) {
      if (!en) continue;
      if (en.concepts.length !== fr.concepts.length) {
        erreurs.push(`${fr.id} : ${en.concepts.length} planètes en anglais, ${fr.concepts.length} en français.`);
        continue;
      }
      fr.concepts.forEach((cf, i) => {
        const ce = en.concepts[i];
        if (ce.id !== cf.id) return erreurs.push(`${fr.id} : planète n° ${i + 1} « ${ce.id} » au lieu de « ${cf.id} ».`);
        if (typeof ce.name !== "string" || ce.name.trim() === "") erreurs.push(`${cf.id} : « name » manquant.`);
        comparerEcrans(cf.id, cf.decouverte ?? [], ce.decouverte ?? [], erreurs);
        if (ce.cards.length !== cf.cards.length) return erreurs.push(`${cf.id} : ${ce.cards.length} cartes en anglais, ${cf.cards.length} en français.`);
        cf.cards.forEach((kf, j) => {
          const ke = ce.cards[j];
          if (ke.id !== kf.id) return erreurs.push(`${cf.id} : carte n° ${j + 1} « ${ke.id} » au lieu de « ${kf.id} ».`);
          comparerCarte(kf, ke, erreurs);
        });
      });
    }
    expect(erreurs).toEqual([]);
  });

  it("sont écrites en anglais simple : pas de français, pas de balises, phrases courtes", () => {
    const erreurs: string[] = [];
    for (const { en } of paires) {
      if (!en) continue;
      for (const { ou, texte } of textesAnglais(en)) {
        if (accentsFrancais.test(texte)) erreurs.push(`${ou} : lettre accentuée française (traduction oubliée ?) : « ${texte.slice(0, 60)} »`);
        if (/\*\*|<\/?[a-z]+>/i.test(texte)) erreurs.push(`${ou} : balise ou gras interdit.`);
        if (emoji.test(texte)) erreurs.push(`${ou} : emoji interdit.`);
        if (/-def[1-4]$/.test(ou)) continue; // phrases officielles du manuel : exemptées de la limite de longueur
        for (const p of phrases(texte)) if (motsDe(p) > MOTS_MAX) erreurs.push(`${ou} : phrase de ${motsDe(p)} mots (max ${MOTS_MAX}) : « ${p.slice(0, 70)}… »`);
      }
    }
    expect(erreurs).toEqual([]);
  });
});
