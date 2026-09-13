import { notFound, redirect } from "next/navigation";
import { Session } from "@/app/session/Session";
import { aujourdhui } from "@/lib/dates";
import { composerSoleil } from "@/lib/odyssee/composer";
import { depuisUrl, routes } from "@/lib/odyssee/urls";
import { cartesDePlanete, chargerUnivers } from "@/lib/supabase/odyssee";
import { creerSession } from "@/lib/supabase/requetes";

/** L'épreuve du soleil : toutes les planètes de la galaxie, entrelacées. */
export default async function PageSoleil({ params }: PageProps<"/galaxie/[id]/soleil">) {
  const { id } = await params;
  const univers = await chargerUnivers();
  const galaxie = univers?.secteur.galaxies.find((g) => g.id === depuisUrl(id));
  if (!univers || !galaxie) notFound();
  if (!galaxie.soleilAccessible && galaxie.statut !== "franchie") redirect(routes.galaxie(galaxie.id));

  const cartesParPlanete = galaxie.planetes.map((pl) => cartesDePlanete(univers, pl.id));
  const parId = new Map(cartesParPlanete.flat().map((c) => [c.carte.id, c]));
  // La graine du tirage = l'identifiant de la séance : chaque tentative est différente, mais reproductible.
  const sessionId = await creerSession(0);
  const file = composerSoleil(
    cartesParPlanete.map((liste) => liste.map((c) => c.carte)),
    `${galaxie.id}:${sessionId}`,
  ).map((carte) => parId.get(carte.id)!);

  return (
    <Session
      mode="soleil"
      sessionId={sessionId}
      cartes={file}
      aujourdhui={aujourdhui()}
      cibleId={galaxie.id}
      retourHref={routes.galaxie(galaxie.id)}
      rejouerHref={routes.soleil(galaxie.id)}
    />
  );
}
