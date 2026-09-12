// Préférences d'affichage (taille du texte, mode sombre) : un cookie, lu côté serveur
// au premier rendu → pas de clignotement. Propres à l'appareil, pas à la base.
import { cookies } from "next/headers";
import { CONFIG_REVISION } from "@/lib/revision/config";

export const COOKIE_AFFICHAGE = "ancre.affichage";

export interface Affichage {
  tailleTexte: number;
  sombre: boolean;
}

export const AFFICHAGE_PAR_DEFAUT: Affichage = {
  tailleTexte: CONFIG_REVISION.reglages.tailleTexteParDefaut,
  sombre: false,
};

export function lireAffichageDepuis(valeur: string | undefined): Affichage {
  if (!valeur) return AFFICHAGE_PAR_DEFAUT;
  try {
    const json = JSON.parse(valeur) as Partial<Affichage>;
    const tailles: readonly number[] = CONFIG_REVISION.reglages.taillesTexte;
    return {
      tailleTexte: typeof json.tailleTexte === "number" && tailles.includes(json.tailleTexte) ? json.tailleTexte : AFFICHAGE_PAR_DEFAUT.tailleTexte,
      sombre: json.sombre === true,
    };
  } catch {
    return AFFICHAGE_PAR_DEFAUT;
  }
}

/** Côté serveur (layout, pages) : les préférences du navigateur courant. */
export async function lireAffichage(): Promise<Affichage> {
  const store = await cookies();
  return lireAffichageDepuis(store.get(COOKIE_AFFICHAGE)?.value);
}
