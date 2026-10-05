import { notFound, redirect } from "next/navigation";
import { Session } from "@/app/session/Session";
import { Ambiance } from "@/components/audio/Ambiance";
import { apparenceGalaxie } from "@/lib/odyssee/planete";
import { aujourdhui } from "@/lib/dates";
import { composerMission, composerPhase } from "@/lib/odyssee/composer";
import { etapeAuMoins } from "@/lib/odyssee/univers";
import { depuisUrl, routes } from "@/lib/odyssee/urls";
import { optionsLangue } from "@/lib/supabase/alternatives";
import { cartesDePlanete, chargerUnivers } from "@/lib/supabase/odyssee";
import { creerSession } from "@/lib/supabase/requetes";

const PHASES = ["comprehension", "entrainement", "mission"] as const;
type Phase = (typeof PHASES)[number];

/** Les séances d'une planète : compréhension, entraînement, mission. */
export default async function PagePhase({ params }: PageProps<"/planete/[id]/[phase]">) {
  const { id, phase } = await params;
  if (!PHASES.includes(phase as Phase)) notFound();
  const univers = await chargerUnivers();
  const conceptId = depuisUrl(id);
  const galaxie = univers?.secteur.galaxies.find((g) => g.planetes.some((p) => p.id === conceptId));
  const planete = galaxie?.planetes.find((p) => p.id === conceptId);
  if (!univers || !galaxie || !planete || planete.etape === "locked") notFound();
  // Règle 1 : jamais interrogé sur une notion pas encore découverte.
  if (!etapeAuMoins(planete.etape, "discovered")) redirect(routes.phase(planete.id, "decouverte"));

  const toutes = cartesDePlanete(univers, planete.id);
  const parId = new Map(toutes.map((c) => [c.carte.id, c]));
  const cartes = toutes.map((c) => c.carte);
  const file =
    phase === "mission"
      ? composerMission(cartes, `${planete.id}:${planete.tentatives}`)
      : composerPhase(cartes, phase as "comprehension" | "entrainement");

  const cartesSeance = file.map((carte) => parId.get(carte.id)!);
  const sessionId = await creerSession(0);
  const { langue, cartesAlt } = await optionsLangue(cartesSeance);
  return (
    <>
    <Ambiance teinte={apparenceGalaxie(galaxie.id).teinte} />
    <Session
      mode={phase as Phase}
      sessionId={sessionId}
      cartes={cartesSeance}
      langue={langue}
      cartesAlt={cartesAlt}
      aujourdhui={aujourdhui()}
      cibleId={planete.id}
      retourHref={routes.planete(planete.id)}
      rejouerHref={routes.phase(planete.id, phase as Phase)}
    />
    </>
  );
}
