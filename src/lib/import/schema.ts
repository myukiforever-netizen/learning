// Format d'une matière (fichier JSON versionné) : types, validation, aplatissement.
// Le format complet est documenté dans SCHEMA.md à la racine du projet.
import type { Carte, ObjectifRetention, TypeCarte } from "@/lib/types";

export interface CarteJson {
  id: string;
  type: TypeCarte;
  question: string;
  answer: string;
  explanation: string;
  explanation_more?: string;
  /** QCM : les choix (la bonne réponse = `answer`, qui doit être l'un d'eux). Duel : exactement 2 choix. */
  options?: string[];
  /** QCM : pourquoi chaque piège est faux, même ordre que `options` ("" pour la bonne réponse). */
  options_why?: string[];
  retention_goal?: ObjectifRetention;
}

export interface ConceptJson {
  id: string;
  name: string;
  cards: CarteJson[];
}

export interface ModuleJson {
  id: string;
  name: string;
  concepts: ConceptJson[];
}

export interface MatiereJson {
  id: string;
  name: string;
  version: number;
  color?: string;
  description?: string;
  modules: ModuleJson[];
}

/** Types de cartes que l'écran de session sait afficher aujourd'hui. */
export const TYPES_PRIS_EN_CHARGE: readonly TypeCarte[] = ["flash", "qcm", "duel"];

const OBJECTIFS: readonly string[] = ["3m", "1y", "life"];
const ID_VALIDE = /^[a-z0-9][a-z0-9_-]*$/;

/** Vérifie un objet JSON. Renvoie la liste des problèmes (vide = fichier valide). */
export function validerMatiere(json: unknown): string[] {
  const erreurs: string[] = [];
  const m = json as Partial<MatiereJson> | null;

  if (!m || typeof m !== "object") return ["Le fichier ne contient pas un objet JSON."];
  if (typeof m.id !== "string" || !ID_VALIDE.test(m.id)) erreurs.push("« id » de la matière manquant ou invalide (lettres minuscules, chiffres, - et _).");
  if (typeof m.name !== "string" || m.name.trim() === "") erreurs.push("« name » de la matière manquant.");
  if (typeof m.version !== "number" || !Number.isInteger(m.version) || m.version < 1) erreurs.push("« version » doit être un entier ≥ 1.");
  if (!Array.isArray(m.modules) || m.modules.length === 0) {
    erreurs.push("« modules » doit être une liste non vide.");
    return erreurs;
  }

  const idsModules = new Set<string>();
  const idsConcepts = new Set<string>();
  const idsCartes = new Set<string>();

  m.modules.forEach((mod, im) => {
    const ou = `module ${im + 1}`;
    if (typeof mod.id !== "string" || !ID_VALIDE.test(mod.id)) erreurs.push(`${ou} : « id » manquant ou invalide.`);
    else if (idsModules.has(mod.id)) erreurs.push(`${ou} : id « ${mod.id} » en double.`);
    else idsModules.add(mod.id);
    if (typeof mod.name !== "string" || mod.name.trim() === "") erreurs.push(`${ou} : « name » manquant.`);
    if (!Array.isArray(mod.concepts) || mod.concepts.length === 0) {
      erreurs.push(`${ou} : « concepts » doit être une liste non vide.`);
      return;
    }

    mod.concepts.forEach((concept, ic) => {
      const ouC = `${ou}, concept ${ic + 1}`;
      if (typeof concept.id !== "string" || !ID_VALIDE.test(concept.id)) erreurs.push(`${ouC} : « id » manquant ou invalide.`);
      else if (idsConcepts.has(concept.id)) erreurs.push(`${ouC} : id « ${concept.id} » en double.`);
      else idsConcepts.add(concept.id);
      if (typeof concept.name !== "string" || concept.name.trim() === "") erreurs.push(`${ouC} : « name » manquant.`);
      if (!Array.isArray(concept.cards) || concept.cards.length === 0) {
        erreurs.push(`${ouC} : « cards » doit être une liste non vide.`);
        return;
      }

      concept.cards.forEach((carte, ik) => {
        const ouK = `${ouC}, carte ${ik + 1}`;
        if (typeof carte.id !== "string" || !ID_VALIDE.test(carte.id)) erreurs.push(`${ouK} : « id » manquant ou invalide.`);
        else if (idsCartes.has(carte.id)) erreurs.push(`${ouK} : id « ${carte.id} » en double.`);
        else idsCartes.add(carte.id);

        if (!TYPES_PRIS_EN_CHARGE.includes(carte.type)) erreurs.push(`${ouK} : type « ${carte.type} » inconnu ou pas encore pris en charge.`);
        for (const champ of ["question", "answer", "explanation"] as const) {
          if (typeof carte[champ] !== "string" || carte[champ].trim() === "") erreurs.push(`${ouK} : « ${champ} » manquant.`);
        }
        if (carte.retention_goal !== undefined && !OBJECTIFS.includes(carte.retention_goal)) {
          erreurs.push(`${ouK} : « retention_goal » doit être 3m, 1y ou life.`);
        }

        if (carte.type === "qcm" || carte.type === "duel") {
          const options = carte.options;
          const attendu = carte.type === "duel" ? "exactement 2" : "entre 2 et 6";
          if (!Array.isArray(options) || options.some((o) => typeof o !== "string" || o.trim() === "")) {
            erreurs.push(`${ouK} : « options » doit être une liste de textes (${attendu}).`);
          } else {
            if (carte.type === "duel" ? options.length !== 2 : options.length < 2 || options.length > 6) {
              erreurs.push(`${ouK} : ${attendu} options attendues, ${options.length} trouvées.`);
            }
            if (!options.includes(carte.answer)) erreurs.push(`${ouK} : « answer » doit être l'une des « options ».`);
            if (carte.options_why !== undefined && (!Array.isArray(carte.options_why) || carte.options_why.length !== options.length)) {
              erreurs.push(`${ouK} : « options_why » doit avoir autant d'éléments que « options ».`);
            }
          }
        }
      });
    });
  });

  return erreurs;
}

/** Identifiant global d'un élément : préfixé par l'id de la matière (unique dans toute la base). */
export function idGlobal(matiereId: string, id: string): string {
  return `${matiereId}/${id}`;
}

/** Transforme une matière validée en liste plate de cartes prêtes pour la session. */
export function aplatirMatiere(m: MatiereJson): Carte[] {
  const cartes: Carte[] = [];
  for (const mod of m.modules) {
    for (const concept of mod.concepts) {
      for (const carte of concept.cards) {
        cartes.push({
          id: idGlobal(m.id, carte.id),
          concept_id: idGlobal(m.id, concept.id),
          concept_nom: concept.name,
          type: carte.type,
          question: carte.question,
          answer: carte.answer,
          explanation: carte.explanation,
          explanation_more: carte.explanation_more ?? null,
          options: carte.options ?? null,
          options_why: carte.options_why ?? null,
          retention_goal: carte.retention_goal ?? "1y",
        });
      }
    }
  }
  return cartes;
}

/** Nombre de cartes d'une matière. */
export function compterCartes(m: MatiereJson): number {
  return m.modules.reduce((n, mod) => n + mod.concepts.reduce((k, c) => k + c.cards.length, 0), 0);
}
