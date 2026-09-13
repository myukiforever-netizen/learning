import { notFound } from "next/navigation";
import { Decouverte, type EcranProvisoire } from "./Decouverte";
import { phaseDe } from "@/lib/odyssee/composer";
import { depuisUrl, routes } from "@/lib/odyssee/urls";
import { cartesDePlanete, chargerUnivers } from "@/lib/supabase/odyssee";

/**
 * Découverte (version provisoire du saut S1) : les notions de la planète présentées
 * comme des fiches à lire, à partir des réponses et explications existantes.
 * Le saut S2 remplace ceci par de vrais écrans de découverte (histoire, analogie, prédiction…).
 */
export default async function PageDecouverte({ params }: PageProps<"/planete/[id]/decouverte">) {
  const { id } = await params;
  const univers = await chargerUnivers();
  const conceptId = depuisUrl(id);
  const galaxie = univers?.secteur.galaxies.find((g) => g.planetes.some((p) => p.id === conceptId));
  const planete = galaxie?.planetes.find((p) => p.id === conceptId);
  if (!univers || !galaxie || !planete || planete.etape === "locked") notFound();

  const cartes = cartesDePlanete(univers, planete.id).map((c) => c.carte);
  // D'abord les notions d'entraînement (les faits à retenir), puis les cartes de compréhension.
  const ordonnees = [...cartes.filter((c) => phaseDe(c) === "entrainement"), ...cartes.filter((c) => phaseDe(c) === "comprehension")];
  const ecrans: EcranProvisoire[] = ordonnees.map((c) => ({
    titre: c.type === "cloze" ? "À retenir" : c.question,
    texte: c.type === "cloze" ? c.answer : c.answer,
    pourquoi: c.explanation,
    plus: c.explanation_more ?? null,
  }));

  return (
    <Decouverte
      conceptId={planete.id}
      nomPlanete={planete.nom}
      ecrans={ecrans}
      retourHref={routes.planete(planete.id)}
      suiteHref={routes.phase(planete.id, "comprehension")}
    />
  );
}
