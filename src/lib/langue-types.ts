// Langue du contenu (français / anglais). Types et règles pures, utilisables côté serveur et côté client.
// Pour l'instant seul l'univers CISSP existe en deux langues : les autres matières restent en français.

export type Langue = "fr" | "en";

export const COOKIE_LANGUE = "ancre.langue";

/** Matières dont le contenu (cartes, découvertes, noms) existe en anglais. */
export const MATIERES_TRADUITES: readonly string[] = ["cissp"];

export function estMatiereTraduite(matiereId: string | undefined): boolean {
  return matiereId !== undefined && MATIERES_TRADUITES.includes(matiereId);
}

export function lireLangueDepuis(valeur: string | undefined): Langue {
  return valeur === "en" ? "en" : "fr";
}
