// Contrôle de la matière « CISSP » (src/data/matieres/cissp/*.json) : format, structure des planètes,
// suites de définitions officielles, lisibilité. La vérification « mot pour mot » contre le manuel
// est faite à part (scripts/verifier-definitions.mjs), car les PDF ne sont pas dans le dépôt.
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

const estDef = (c: CarteJson) => /-def[1-4]$/.test(c.id);
const racineDef = (c: CarteJson) => c.id.replace(/-def[1-4]$/, "");
const phase = (c: CarteJson) => phaseDe(c as unknown as Carte);

const MOTS_MAX = 25;
const emoji = /\p{Extended_Pictographic}/u;

/** Tous les textes en français d'une planète (hors définitions officielles, qui sont en anglais). */
function textesFrancais(concept: ModuleJson["concepts"][number]): { ou: string; texte: string }[] {
  const out: { ou: string; texte: string }[] = [];
  const ajoute = (ou: string, t: unknown) => {
    if (typeof t === "string") out.push({ ou, texte: t });
  };
  (concept.decouverte ?? []).forEach((e, i) => {
    const ou = `${concept.id} écran ${i + 1}`;
    if (e.type === "histoire") e.paragraphes.forEach((p) => ajoute(ou, p));
    else if (e.type === "analogie") {
      ajoute(ou, e.comme);
      ajoute(ou, e.enVrai);
    } else if (e.type === "exemple") ajoute(ou, e.texte);
    else {
      ajoute(ou, e.question);
      ajoute(ou, e.explanation);
      e.options.forEach((o) => ajoute(ou, o));
    }
  });
  for (const c of concept.cards) {
    if (estDef(c)) {
      ajoute(c.id, c.explanation);
      continue;
    }
    const ou = c.id;
    ajoute(ou, c.question);
    ajoute(ou, c.explanation);
    ajoute(ou, c.explanation_more);
    if (c.type !== "cloze") ajoute(ou, c.answer);
    (c.options ?? []).forEach((o) => ajoute(ou, o));
    (c.options_why ?? []).forEach((o) => ajoute(ou, o));
  }
  return out;
}

function phrases(texte: string): string[] {
  return texte
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

const motsDe = (p: string) => p.split(/\s+/).filter((m) => /[\p{L}\p{N}]/u.test(m)).length;

describe("matière CISSP", () => {
  it("contient au moins un fichier de galaxie", () => {
    expect(fichiers.length).toBeGreaterThan(0);
  });

  it("respecte le format (ids uniques, types, options, trous…)", () => {
    expect(validerMatiere(matiere)).toEqual([]);
  });

  it("nomme galaxies, planètes et cartes selon la convention d'ids", () => {
    const erreurs: string[] = [];
    fichiers.forEach((nom, i) => {
      const mod = modules[i];
      if (!new RegExp(`^${nom.replace(/\.json$/, "")}$`).test(mod.id)) erreurs.push(`${nom} : l'id du module doit être « ${nom.replace(/\.json$/, "")} » (trouvé « ${mod.id} »).`);
      const domaine = mod.id.match(/^d(\d)-/)?.[1];
      for (const concept of mod.concepts) {
        if (!concept.id.startsWith(`d${domaine}-`)) erreurs.push(`${concept.id} : doit commencer par « d${domaine}- ».`);
        for (const carte of concept.cards) {
          if (!carte.id.startsWith(`${concept.id}-`)) erreurs.push(`${carte.id} : doit commencer par l'id de sa planète « ${concept.id}- ».`);
        }
      }
    });
    expect(erreurs).toEqual([]);
  });

  it("donne à chaque planète une découverte, assez de cartes et un mélange de phases", () => {
    const erreurs: string[] = [];
    for (const mod of modules) {
      if (mod.concepts.length < 4 || mod.concepts.length > 9) erreurs.push(`${mod.id} : ${mod.concepts.length} planètes (attendu 4 à 9).`);
      for (const concept of mod.concepts) {
        const ecrans = concept.decouverte ?? [];
        if (ecrans.length < 3 || ecrans.length > 8) erreurs.push(`${concept.id} : ${ecrans.length} écrans de découverte (attendu 3 à 8).`);
        if (!ecrans.some((e) => e.type === "predire")) erreurs.push(`${concept.id} : il manque un écran « predire ».`);
        if (!ecrans.some((e) => e.type === "analogie")) erreurs.push(`${concept.id} : il manque une « analogie ».`);
        const normales = concept.cards.filter((c) => !estDef(c));
        const compr = normales.filter((c) => phase(c) === "comprehension").length;
        const entr = normales.filter((c) => phase(c) === "entrainement").length;
        if (compr < 2) erreurs.push(`${concept.id} : ${compr} carte(s) de compréhension hors définitions (attendu ≥ 2).`);
        if (entr < 3) erreurs.push(`${concept.id} : ${entr} carte(s) d'entraînement hors définitions (attendu ≥ 3).`);
        if (concept.cards.length < 12 || concept.cards.length > 40) erreurs.push(`${concept.id} : ${concept.cards.length} cartes (attendu 12 à 40).`);
        if (!normales.some((c) => c.type === "why" || c.type === "whatif" || c.type === "problem")) {
          erreurs.push(`${concept.id} : il manque une carte « pourquoi / et si / mise en situation » (why, whatif ou problem).`);
        }
        const defs = concept.cards.filter(estDef);
        const premiereDef = concept.cards.findIndex(estDef);
        const premiereNormale = concept.cards.findIndex((c) => !estDef(c));
        if (defs.length > 0 && premiereDef > premiereNormale + 2) erreurs.push(`${concept.id} : placer les définitions officielles avant les autres cartes.`);
      }
    }
    expect(erreurs).toEqual([]);
  });

  it("construit chaque définition officielle comme prévu (def1 flash, def2/def3 trous, def4 écrit)", () => {
    const erreurs: string[] = [];
    for (const mod of modules) {
      for (const concept of mod.concepts) {
        const groupes = new Map<string, CarteJson[]>();
        for (const c of concept.cards.filter(estDef)) groupes.set(racineDef(c), [...(groupes.get(racineDef(c)) ?? []), c]);
        for (const [racine, cartes] of groupes) {
          const par = (n: number) => cartes.find((c) => c.id === `${racine}-def${n}`);
          const [d1, d2, d3, d4] = [1, 2, 3, 4].map(par);
          if (!d1) erreurs.push(`${racine} : il manque -def1.`);
          if (!d3) erreurs.push(`${racine} : il manque -def3.`);
          if ((d2 && !d4) || (d4 && !d2)) erreurs.push(`${racine} : -def2 et -def4 vont ensemble (définition clé = les 4 cartes).`);
          if (d1 && (d1.type !== "flash" || phase(d1) !== "comprehension")) erreurs.push(`${d1.id} : doit être un flash de phase « comprehension ».`);
          for (const d of [d2, d3]) if (d && d.type !== "cloze") erreurs.push(`${d.id} : doit être un « cloze ».`);
          if (d4 && d4.type !== "problem") erreurs.push(`${d4.id} : doit être un « problem ».`);
          for (const d of [d2, d3]) {
            if (!d) continue;
            const trous = (d.question.match(/\[\[.+?\]\]/g) ?? []).length;
            const attendu = d === d2 ? 2 : 3;
            if (trous !== attendu) erreurs.push(`${d.id} : ${trous} trou(s), ${attendu} attendus.`);
          }
          for (const d of cartes) {
            if (d.retention_goal !== "life") erreurs.push(`${d.id} : « retention_goal » doit être « life ».`);
            if ((d.id.endsWith("-def1") || d.id.endsWith("-def4")) && !/\n\nTraduction : ./.test(d.answer)) erreurs.push(`${d.id} : « \\n\\nTraduction : … » manquant dans « answer ».`);
          }
          const phrases = new Set(cartes.map((c) => c.answer.split("\n\nTraduction :")[0].trim().toLowerCase()));
          if (phrases.size > 1) erreurs.push(`${racine} : les cartes de la suite n'ont pas toutes la même phrase officielle.`);
        }
      }
    }
    expect(erreurs).toEqual([]);
  });

  it("écrit en phrases courtes, sans balises ni emoji", () => {
    const erreurs: string[] = [];
    for (const mod of modules) {
      for (const concept of mod.concepts) {
        for (const { ou, texte } of textesFrancais(concept)) {
          if (/\*\*|<\/?[a-z]+>/i.test(texte)) erreurs.push(`${ou} : balise ou gras interdit : « ${texte.slice(0, 50)} »`);
          if (emoji.test(texte)) erreurs.push(`${ou} : emoji interdit.`);
          for (const p of phrases(texte)) {
            if (motsDe(p) > MOTS_MAX) erreurs.push(`${ou} : phrase de ${motsDe(p)} mots (max ${MOTS_MAX}) : « ${p.slice(0, 70)}… »`);
          }
        }
      }
    }
    expect(erreurs).toEqual([]);
  });
});
