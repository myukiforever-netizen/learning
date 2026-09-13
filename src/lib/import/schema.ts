// Format d'une matière (fichier JSON versionné) : types, validation, aplatissement.
// Le format complet est documenté dans SCHEMA.md à la racine du projet.
import type { Carte, CarteData, ObjectifRetention, PhaseCarte, TypeCarte } from "@/lib/types";

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
  /** worked_example / faded_example : steps (+ hidden) ; sort : mode, categories, items. Voir SCHEMA.md. */
  data?: CarteData;
  /** Odyssée : phase (comprehension | entrainement) et niveau (1-3). Sinon déduits du type. */
  phase?: PhaseCarte;
  niveau?: 1 | 2 | 3;
}

/**
 * Odyssée : un écran de découverte. Une planète en enchaîne 3 à 8, un seul à la fois.
 * - histoire  : un titre et 1 à 3 courts paragraphes (une idée par paragraphe).
 * - analogie  : « c'est comme… » (image simple) puis « en vrai… » (la notion).
 * - exemple   : un cas concret en quelques lignes.
 * - predire   : une question, 2 à 4 choix, l'utilisateur devine AVANT d'apprendre, puis la réponse et le pourquoi.
 */
export type EcranDecouverte =
  | { type: "histoire"; titre: string; paragraphes: string[] }
  | { type: "analogie"; titre: string; comme: string; enVrai: string }
  | { type: "exemple"; titre: string; texte: string }
  | { type: "predire"; question: string; options: string[]; answer: string; explanation: string };

export function validerDecouverte(ecrans: unknown, ou: string): string[] {
  const erreurs: string[] = [];
  if (!Array.isArray(ecrans)) return [`${ou} : « decouverte » doit être une liste d'écrans.`];
  if (ecrans.length < 3 || ecrans.length > 8) erreurs.push(`${ou} : « decouverte » doit contenir 3 à 8 écrans (${ecrans.length} trouvés).`);
  ecrans.forEach((e, i) => {
    const ouE = `${ou}, écran de découverte ${i + 1}`;
    const ecran = e as Partial<Record<string, unknown>>;
    const texte = (v: unknown) => typeof v === "string" && v.trim() !== "";
    switch (ecran.type) {
      case "histoire":
        if (!texte(ecran.titre) || !Array.isArray(ecran.paragraphes) || ecran.paragraphes.length < 1 || ecran.paragraphes.length > 3 || !ecran.paragraphes.every(texte)) {
          erreurs.push(`${ouE} : une histoire a un « titre » et 1 à 3 « paragraphes ».`);
        }
        break;
      case "analogie":
        if (!texte(ecran.titre) || !texte(ecran.comme) || !texte(ecran.enVrai)) erreurs.push(`${ouE} : une analogie a « titre », « comme » et « enVrai ».`);
        break;
      case "exemple":
        if (!texte(ecran.titre) || !texte(ecran.texte)) erreurs.push(`${ouE} : un exemple a « titre » et « texte ».`);
        break;
      case "predire":
        if (!texte(ecran.question) || !Array.isArray(ecran.options) || ecran.options.length < 2 || ecran.options.length > 4 || !ecran.options.every(texte)) {
          erreurs.push(`${ouE} : une prédiction a « question » et 2 à 4 « options ».`);
        } else if (!texte(ecran.answer) || !(ecran.options as string[]).includes(ecran.answer as string)) {
          erreurs.push(`${ouE} : « answer » doit être l'une des « options ».`);
        }
        if (!texte(ecran.explanation)) erreurs.push(`${ouE} : « explanation » manquante.`);
        break;
      default:
        erreurs.push(`${ouE} : « type » doit être histoire, analogie, exemple ou predire.`);
    }
  });
  return erreurs;
}

export interface ConceptJson {
  id: string;
  name: string;
  cards: CarteJson[];
  /** Odyssée : écrans de découverte de la planète. */
  decouverte?: EcranDecouverte[];
  /** Odyssée : apparence de la planète (sinon dérivée de l’id). */
  planete?: { teinte?: number; relief?: "rocheuse" | "gazeuse" | "glacee" | "volcanique" | "oceanique" };
}

export interface ModuleJson {
  id: string;
  name: string;
  concepts: ConceptJson[];
  /** Odyssée : teinte et ambiance de la galaxie (sinon dérivées de l’id). */
  galaxie?: { teinte?: number; ambiance?: "calme" | "tendu" | "mysterieux" | "lumineux" };
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
export const TYPES_PRIS_EN_CHARGE: readonly TypeCarte[] = [
  "flash",
  "qcm",
  "duel",
  "cloze",
  "why",
  "whatif",
  "problem",
  "worked_example",
  "faded_example",
  "sort",
];

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
      if (concept.decouverte !== undefined) erreurs.push(...validerDecouverte(concept.decouverte, ouC));
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

        if (carte.phase !== undefined && carte.phase !== "comprehension" && carte.phase !== "entrainement") {
          erreurs.push(`${ouK} : « phase » doit être comprehension ou entrainement.`);
        }
        if (carte.niveau !== undefined && ![1, 2, 3].includes(carte.niveau)) erreurs.push(`${ouK} : « niveau » doit être 1, 2 ou 3.`);
        erreurs.push(...validerDonnees(carte, ouK));
      });
    });
  });

  return erreurs;
}

/** Vérifications propres à cloze, worked_example, faded_example et sort. */
function validerDonnees(carte: CarteJson, ou: string): string[] {
  const erreurs: string[] = [];
  const data = carte.data ?? {};

  if (carte.type === "cloze") {
    const trous = (carte.question.match(/\[\[.+?\]\]/g) ?? []).length;
    if (trous < 1 || trous > 3) {
      erreurs.push(`${ou} : une carte cloze doit contenir 1 à 3 trous [[...]] dans « question » (${trous} trouvés).`);
    }
  }

  if (carte.type === "worked_example" || carte.type === "faded_example") {
    const steps = data.steps;
    if (
      !Array.isArray(steps) ||
      steps.length < 2 ||
      steps.length > 8 ||
      steps.some((e) => typeof e?.text !== "string" || e.text.trim() === "")
    ) {
      erreurs.push(`${ou} : « data.steps » doit contenir 2 à 8 étapes avec un « text ».`);
    } else if (carte.type === "faded_example") {
      const hidden = data.hidden ?? 1;
      if (!Number.isInteger(hidden) || hidden < 1 || hidden >= steps.length) {
        erreurs.push(`${ou} : « data.hidden » doit être entre 1 et ${steps.length - 1}.`);
      }
    }
  }

  if (carte.type === "sort") {
    const items = data.items;
    if (data.mode !== "classer" && data.mode !== "ordonner") {
      erreurs.push(`${ou} : « data.mode » doit être « classer » ou « ordonner ».`);
    } else if (data.mode === "classer") {
      const categories = data.categories;
      if (
        !Array.isArray(categories) ||
        categories.length < 2 ||
        categories.length > 4 ||
        categories.some((c) => typeof c !== "string" || c.trim() === "")
      ) {
        erreurs.push(`${ou} : « data.categories » doit contenir 2 à 4 catégories.`);
      } else if (!Array.isArray(items) || items.length < 2 || items.length > 8) {
        erreurs.push(`${ou} : « data.items » doit contenir 2 à 8 éléments.`);
      } else {
        items.forEach((item, i) => {
          if (typeof item === "string" || typeof item.text !== "string" || !categories.includes(item.category)) {
            erreurs.push(`${ou} : élément ${i + 1} doit avoir un « text » et une « category » parmi les catégories.`);
          }
        });
      }
    } else if (
      !Array.isArray(items) ||
      items.length < 3 ||
      items.length > 8 ||
      items.some((item) => typeof item !== "string" || item.trim() === "")
    ) {
      erreurs.push(`${ou} : en mode « ordonner », « data.items » doit contenir 3 à 8 textes dans le bon ordre.`);
    }
  }

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
          data: carte.data ?? null,
          phase: carte.phase ?? null,
          niveau: carte.niveau ?? null,
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
