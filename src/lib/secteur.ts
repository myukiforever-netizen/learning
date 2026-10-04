// Le secteur (matière) affiché sur la carte de l'univers : choix mémorisé dans un cookie, par navigateur.
// Côté serveur uniquement (lit les cookies).
import { cookies } from "next/headers";

export const COOKIE_SECTEUR = "ancre.secteur";

/** Id de la matière choisie par la personne, ou undefined (alors : la dernière matière chargée). */
export async function lireSecteurChoisi(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE_SECTEUR)?.value || undefined;
}
