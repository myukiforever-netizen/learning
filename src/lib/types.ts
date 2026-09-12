// Types partagés de l'application. Les noms de champs suivent le modèle de données
// du prompt (anglais côté base : cards, reviews, answers, sessions).

export type TypeCarte =
  | "flash"
  | "qcm"
  | "cloze"
  | "why"
  | "whatif"
  | "worked_example"
  | "faded_example"
  | "problem"
  | "duel"
  | "sort";

export type ObjectifRetention = "3m" | "1y" | "life";

/** 1 = 😕 pas sûr, 2 = 😐 moyen, 3 = 😎 sûr */
export type Confiance = 1 | 2 | 3;

export type BoiteErreur = "never_knew" | "not_retrieved" | "thought_knew";

/** Famille d'une carte : décide la couleur du liseré (une couleur = un sens). */
export type FamilleCarte = "memoire" | "comprendre" | "procedure" | "duel";

export const FAMILLE_PAR_TYPE: Record<TypeCarte, FamilleCarte> = {
  flash: "memoire",
  qcm: "memoire",
  cloze: "memoire",
  why: "comprendre",
  whatif: "comprendre",
  worked_example: "procedure",
  faded_example: "procedure",
  problem: "procedure",
  duel: "duel",
  sort: "duel",
};

/** Une étape d’exemple résolu : le texte de l’étape, et une mini-question posée avant de la déplier. */
export interface EtapeExemple {
  text: string;
  prompt?: string;
}

/** Données propres à certains types de cartes (colonne `data`). */
export interface CarteData {
  /** worked_example / faded_example : les étapes, dans l’ordre. */
  steps?: EtapeExemple[];
  /** faded_example : nombre d’étapes finales cachées (à produire soi-même). Défaut : 1. */
  hidden?: number;
  /** sort : classer des éléments dans des catégories, ou les remettre dans l’ordre. */
  mode?: "classer" | "ordonner";
  /** sort/classer : les catégories (2 à 4). */
  categories?: string[];
  /** sort/classer : les éléments avec leur bonne catégorie ; sort/ordonner : les éléments dans le bon ordre. */
  items?: ({ text: string; category: string } | string)[];
}

export interface Carte {
  id: string;
  concept_id: string;
  /** Nom du concept, affiché en petit au-dessus de la question. */
  concept_nom: string;
  type: TypeCarte;
  question: string;
  answer: string;
  /** Le POURQUOI, 2 lignes max. */
  explanation: string;
  /** Texte plus long derrière « en savoir plus ». */
  explanation_more?: string | null;
  /** QCM : les choix proposés (la bonne réponse = `answer`, qui doit être l'un d'eux). */
  options?: string[] | null;
  /** QCM : pourquoi chaque piège est faux, dans le même ordre que `options` ("" pour la bonne). */
  options_why?: string[] | null;
  retention_goal: ObjectifRetention;
  /** Données propres au type (étapes, éléments à classer…). */
  data?: CarteData | null;
}

/** Une réponse donnée pendant la session, avant enregistrement en base. */
export interface ReponseSession {
  card_id: string;
  correct: boolean;
  confidence: Confiance;
  timestamp: string;
  error_box: BoiteErreur | null;
}

/** État de révision d'une carte (table `reviews`). Pas de ligne en base = carte nouvelle. */
export interface EtatRevision {
  /** Position dans le calendrier de l'objectif (0 = début). */
  step: number;
  /** Dernier intervalle appliqué, en jours (après un raté : l'intervalle réduit à appliquer). */
  interval_days: number;
  /** Date à laquelle la carte redevient due, AAAA-MM-JJ. */
  due_date: string;
  /** new = jamais vue ; ok = en cours ; failed = ratée ; thought_knew = boîte ⚠️ (priorité max). */
  ease_state: "new" | "ok" | "failed" | "thought_knew";
}

/** Une carte accompagnée de son état de révision (null = nouvelle). */
export interface CarteAReviser {
  carte: Carte;
  revision: EtatRevision | null;
}
