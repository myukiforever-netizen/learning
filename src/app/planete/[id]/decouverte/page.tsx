import { notFound } from "next/navigation";
import { Decouverte, type Ecran } from "./Decouverte";
import type { EcranDecouverte } from "@/lib/import/schema";
import { phaseDe } from "@/lib/odyssee/composer";
import { depuisUrl, routes } from "@/lib/odyssee/urls";
import { cartesDePlanete, chargerUnivers } from "@/lib/supabase/odyssee";

/**
 * Découverte d'une planète : ses écrans écrits (histoire, analogie, exemple, prédiction) ;
 * sinon, des fiches provisoires construites à partir des notions existantes.
 */
export default async function PageDecouverte({ params }: PageProps<"/planete/[id]/decouverte">) {
  const { id } = await params;
  const univers = await chargerUnivers();
  const conceptId = depuisUrl(id);
  const galaxie = univers?.secteur.galaxies.find((g) => g.planetes.some((p) => p.id === conceptId));
  const planete = galaxie?.planetes.find((p) => p.id === conceptId);
  if (!univers || !galaxie || !planete || planete.etape === "locked") notFound();

  let ecrans: Ecran[];
  if (planete.decouverte && planete.decouverte.length > 0) {
    ecrans = planete.decouverte as EcranDecouverte[];
  } else {
    const cartes = cartesDePlanete(univers, planete.id).map((c) => c.carte);
    const ordonnees = [...cartes.filter((c) => phaseDe(c) === "entrainement"), ...cartes.filter((c) => phaseDe(c) === "comprehension")];
    ecrans = ordonnees.map((c) => ({
      type: "fiche",
      titre: c.type === "cloze" ? "À retenir" : c.question,
      texte: c.answer,
      pourquoi: c.explanation,
      plus: c.explanation_more ?? null,
    }));
  }

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
