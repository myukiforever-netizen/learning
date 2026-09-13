import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaneteSvg } from "@/components/odyssee/PlaneteSvg";
import { etoilesNotion } from "@/lib/odyssee/maitrise";
import { etapeAuMoins, type EtapePlanete } from "@/lib/odyssee/univers";
import { depuisUrl, routes } from "@/lib/odyssee/urls";
import { cartesDePlanete, chargerUnivers } from "@/lib/supabase/odyssee";

interface Station {
  phase: "decouverte" | "comprehension" | "entrainement" | "mission";
  nom: string;
  lieu: string;
  detail: string;
  /** Étape minimale pour y entrer. */
  requiert: EtapePlanete;
  /** Étape atteinte quand elle est faite. */
  faitDes: EtapePlanete;
}

const STATIONS: Station[] = [
  { phase: "decouverte", nom: "Découverte", lieu: "Observatoire", detail: "Les notions, présentées simplement. Rien à réussir.", requiert: "available", faitDes: "discovered" },
  { phase: "comprehension", nom: "Compréhension", lieu: "Laboratoire", detail: "Duels, classements, QCM guidés : vérifier qu'on a compris.", requiert: "discovered", faitDes: "understood" },
  { phase: "entrainement", nom: "Entraînement", lieu: "Champ d'entraînement", detail: "Cartes de rappel : les notions entrent dans ton planning de révision.", requiert: "understood", faitDes: "trained" },
  { phase: "mission", nom: "Mission de validation", lieu: "Tour de contrôle", detail: "Une épreuve mélangée. 80 % pour valider la planète.", requiert: "trained", faitDes: "validated" },
];

/** Vue d'une planète : ses 5 stations, ses notions et leur maîtrise. */
export default async function PagePlanete({ params }: PageProps<"/planete/[id]">) {
  const { id } = await params;
  const univers = await chargerUnivers();
  const conceptId = depuisUrl(id);
  const galaxie = univers?.secteur.galaxies.find((g) => g.planetes.some((p) => p.id === conceptId));
  const planete = galaxie?.planetes.find((p) => p.id === conceptId);
  if (!univers || !galaxie || !planete || planete.etape === "locked") notFound();

  const cartes = cartesDePlanete(univers, planete.id);
  const signaux = univers.detresse.get(planete.id) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="texte-2 text-sm">{galaxie.nom}</p>
          <h1 className="text-2xl font-semibold">{planete.nom}</h1>
        </div>
        <Link href={routes.galaxie(galaxie.id)} className="texte-2 text-sm underline underline-offset-4 whitespace-nowrap">
          Galaxie
        </Link>
      </header>

      <div className="flex items-center gap-4 sm:gap-6 panneau p-4 sm:p-5">
        <PlaneteSvg id={planete.id} taille={120} halo={planete.etape === "validated" ? "fort" : "doux"} />
        <div className="flex flex-col gap-1">
          <p className="font-medium">
            {planete.etape === "validated" ? `Planète validée · meilleure mission ${planete.meilleurScore} %` : "Planète en exploration"}
          </p>
          <p className="texte-2 text-sm">
            {cartes.length} notion{cartes.length > 1 ? "s" : ""}
            {signaux > 0 ? ` · ${signaux} signal${signaux > 1 ? "aux" : ""} de détresse` : ""}
          </p>
        </div>
      </div>

      <ol className="flex flex-col gap-3">
        {STATIONS.map((s, i) => {
          const ouverte = etapeAuMoins(planete.etape, s.requiert);
          const faite = etapeAuMoins(planete.etape, s.faitDes);
          const prochaine = ouverte && !faite;
          return (
            <li key={s.phase} className="panneau p-4 flex flex-wrap items-center gap-3 sm:gap-4" style={{ opacity: ouverte ? 1 : 0.5 }}>
              <span
                className="touche"
                style={faite ? { borderColor: "var(--ok)", color: "var(--ok)" } : prochaine ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
              >
                {faite ? "✓" : i + 1}
              </span>
              <div className="flex-1 min-w-[60%]">
                <p className="font-medium">
                  {s.nom} <span className="texte-2 font-normal">· {s.lieu}</span>
                </p>
                <p className="texte-2 text-sm">{s.detail}</p>
              </div>
              {ouverte ? (
                <Link href={routes.phase(planete.id, s.phase)} className={`bouton text-sm w-full sm:w-auto ${prochaine ? "bouton-principal" : ""}`}>
                  {faite ? "Rejouer" : "Entrer"}
                </Link>
              ) : (
                <span className="texte-2 text-sm">Bientôt</span>
              )}
            </li>
          );
        })}
        <li className="panneau p-4 flex flex-wrap items-center gap-3 sm:gap-4" style={{ opacity: planete.etape === "validated" ? 1 : 0.5 }}>
          <span className="touche">5</span>
          <div className="flex-1">
            <p className="font-medium">
              Révision <span className="texte-2 font-normal">· Balise</span>
            </p>
            <p className="texte-2 text-sm">
              {planete.etape === "validated"
                ? signaux > 0
                  ? `${signaux} notion${signaux > 1 ? "s" : ""} à secourir en patrouille.`
                  : "Tout est stable. La patrouille te rappellera au bon moment."
                : "Après la validation, tes notions reviennent au bon moment en patrouille."}
            </p>
          </div>
          {planete.etape === "validated" && signaux > 0 && (
            <Link href={routes.patrouille()} className="bouton text-sm bouton-principal">
              Patrouille
            </Link>
          )}
        </li>
      </ol>

      <section className="panneau p-5 flex flex-col gap-2">
        <p className="texte-2 text-sm">Notions de la planète et maîtrise</p>
        <ul className="flex flex-col gap-1">
          {cartes.map((c) => {
            const etoiles = etoilesNotion(c.revision);
            return (
              <li key={c.carte.id} className="flex items-center gap-3 text-sm">
                <span className="whitespace-nowrap" aria-label={`${etoiles} étoiles sur 3`}>
                  {"★".repeat(etoiles)}
                  <span className="texte-2">{"★".repeat(3 - etoiles)}</span>
                </span>
                <span className="texte-2 truncate">{c.carte.question}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
