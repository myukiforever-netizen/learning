// Chargement des traductions d'une matière. Les fichiers anglais ne sont lus que si la personne a choisi
// l'anglais (import dynamique) : le français ne paie pas leur poids.
import type { Langue } from "@/lib/langue-types";
import type { Carte } from "@/lib/types";
import { indexer, traduireCarte, type IndexTraductions } from "./traduire";

const cache = new Map<string, IndexTraductions>();

export async function chargerTraductions(matiereId: string, langue: Langue): Promise<IndexTraductions | null> {
  if (langue !== "en") return null;
  const connu = cache.get(matiereId);
  if (connu) return connu;
  if (matiereId === "cissp") {
    const { NOM_CISSP_EN, TRADUCTIONS_CISSP_EN } = await import("@/data/matieres/cissp/en");
    const index = indexer(TRADUCTIONS_CISSP_EN, NOM_CISSP_EN);
    cache.set(matiereId, index);
    return index;
  }
  return null;
}

/** Traduit les cartes des matières qui existent dans la langue choisie (les autres restent en français). */
export async function traduireCartes<T extends { carte: Carte; matiere: { id: string } | null }>(cartes: T[], langue: Langue): Promise<T[]> {
  if (langue !== "en") return cartes;
  const indexes = new Map<string, IndexTraductions | null>();
  for (const c of cartes) {
    if (c.matiere && !indexes.has(c.matiere.id)) indexes.set(c.matiere.id, await chargerTraductions(c.matiere.id, langue));
  }
  return cartes.map((c) => {
    const index = c.matiere ? indexes.get(c.matiere.id) : null;
    return index && c.matiere ? { ...c, carte: traduireCarte(c.carte, c.matiere.id, index) } : c;
  });
}
