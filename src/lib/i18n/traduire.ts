// Traductions du contenu : fichiers « jumeaux » (mêmes ids, même ordre) appliqués par-dessus le français.
// Logique pure, sans React ni Supabase : testée dans tests/i18n.test.ts.
import type { EcranDecouverte } from "@/lib/import/schema";
import type { Carte, CarteData } from "@/lib/types";

export interface TraductionCarte {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  explanation_more?: string;
  options?: string[];
  options_why?: string[];
  /** Seulement les clés à traduire (sort : mode, categories, items ; exemples : steps). Fusionné avec le français. */
  data?: Partial<CarteData>;
}

export interface TraductionConcept {
  id: string;
  name: string;
  decouverte?: EcranDecouverte[];
  cards: TraductionCarte[];
}

export interface TraductionModule {
  id: string;
  name: string;
  concepts: TraductionConcept[];
}

/** Les traductions d'une matière, indexées par id local (sans le préfixe « matiere/ »). */
export interface IndexTraductions {
  nomMatiere?: string;
  modules: Map<string, string>;
  concepts: Map<string, TraductionConcept>;
  cartes: Map<string, TraductionCarte>;
}

export function indexer(modules: TraductionModule[], nomMatiere?: string): IndexTraductions {
  const index: IndexTraductions = { nomMatiere, modules: new Map(), concepts: new Map(), cartes: new Map() };
  for (const mod of modules) {
    index.modules.set(mod.id, mod.name);
    for (const concept of mod.concepts) {
      index.concepts.set(concept.id, concept);
      for (const carte of concept.cards) index.cartes.set(carte.id, carte);
    }
  }
  return index;
}

/** « cissp/d1-confid » → « d1-confid ». */
export function idLocal(matiereId: string, idGlobal: string): string {
  return idGlobal.startsWith(`${matiereId}/`) ? idGlobal.slice(matiereId.length + 1) : idGlobal;
}

/** La carte dans l'autre langue ; la carte d'origine si aucune traduction n'existe. */
export function traduireCarte(carte: Carte, matiereId: string, index: IndexTraductions): Carte {
  const tr = index.cartes.get(idLocal(matiereId, carte.id));
  const nomConcept = index.concepts.get(idLocal(matiereId, carte.concept_id))?.name;
  if (!tr) return nomConcept ? { ...carte, concept_nom: nomConcept } : carte;
  return {
    ...carte,
    concept_nom: nomConcept ?? carte.concept_nom,
    question: tr.question,
    answer: tr.answer,
    explanation: tr.explanation,
    explanation_more: tr.explanation_more ?? carte.explanation_more,
    options: tr.options ?? carte.options,
    options_why: tr.options_why ?? carte.options_why,
    data: tr.data ? ({ ...(carte.data ?? {}), ...tr.data } as CarteData) : carte.data,
  };
}
