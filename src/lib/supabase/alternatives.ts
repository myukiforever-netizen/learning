// Pour le bouton FR / EN d'une séance de cartes : les mêmes cartes dans l'AUTRE langue.
// La séance les garde côté navigateur et bascule sans recharger la page (l'ordre des cartes ne bouge pas).
import { createClient } from "./server";
import { CHAMPS_CARTE, versCarte, type LigneCarte } from "./requetes";
import { chargerTraductions } from "@/lib/i18n/charger";
import { traduireCarte } from "@/lib/i18n/traduire";
import { lireLangue } from "@/lib/langue";
import { MATIERES_TRADUITES, type Langue } from "@/lib/langue-types";
import type { Carte, CarteAReviser } from "@/lib/types";

const matiereDe = (idCarte: string) => idCarte.split("/")[0];

/** La langue choisie, et les cartes de la séance dans l'autre langue (null si aucune carte n'est traduite). */
export async function optionsLangue(cartes: CarteAReviser[]): Promise<{ langue: Langue; cartesAlt: Carte[] | null }> {
  const langue = await lireLangue();
  const traduisibles = cartes.map((c) => c.carte).filter((c) => MATIERES_TRADUITES.includes(matiereDe(c.id)));
  if (traduisibles.length === 0) return { langue, cartesAlt: null };

  const alt = new Map<string, Carte>();
  if (langue === "fr") {
    // L'autre langue = l'anglais : traductions appliquées sur les cartes françaises.
    for (const c of traduisibles) {
      const matiere = matiereDe(c.id);
      const index = await chargerTraductions(matiere, "en");
      if (index) alt.set(c.id, traduireCarte(c, matiere, index));
    }
  } else {
    // L'autre langue = le français : les cartes d'origine, lues dans la base.
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cards")
      .select(CHAMPS_CARTE)
      .in("id", traduisibles.map((c) => c.id));
    if (error) throw new Error(error.message);
    for (const ligne of (data ?? []) as unknown as LigneCarte[]) alt.set(ligne.id, versCarte(ligne));
  }
  return { langue, cartesAlt: cartes.map((c) => alt.get(c.carte.id) ?? c.carte) };
}
