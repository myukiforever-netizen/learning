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
}

/** Une réponse donnée pendant la session, avant enregistrement en base. */
export interface ReponseSession {
  card_id: string;
  correct: boolean;
  confidence: Confiance;
  timestamp: string;
  error_box: BoiteErreur | null;
}
