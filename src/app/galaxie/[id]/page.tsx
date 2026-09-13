import Link from "next/link";
import { notFound } from "next/navigation";
import { CarteGalaxie } from "@/components/odyssee/CarteGalaxie";
import { depuisUrl, routes } from "@/lib/odyssee/urls";
import { chargerUnivers } from "@/lib/supabase/odyssee";

/** Vue d'une galaxie : ses planètes en orbite autour du soleil. */
export default async function PageGalaxie({ params }: PageProps<"/galaxie/[id]">) {
  const { id } = await params;
  const univers = await chargerUnivers();
  const galaxie = univers?.secteur.galaxies.find((g) => g.id === depuisUrl(id));
  if (!univers || !galaxie) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="texte-2 text-sm">Galaxie {galaxie.index + 1}</p>
          <h1 className="text-2xl font-semibold">{galaxie.nom}</h1>
        </div>
        <Link href={routes.univers()} className="texte-2 text-sm underline underline-offset-4 whitespace-nowrap">
          Univers
        </Link>
      </header>

      {galaxie.statut === "verrouillee" ? (
        <p className="panneau p-5 texte-2">Cette galaxie est verrouillée : franchis le soleil de la galaxie précédente.</p>
      ) : (
        <CarteGalaxie galaxie={galaxie} detresse={univers.detresse} />
      )}

      {galaxie.statut !== "verrouillee" && (
        <section className="panneau p-5 flex flex-col gap-3">
          <p className="texte-2 text-sm">Le soleil</p>
          {galaxie.statut === "franchie" ? (
            <>
              <p className="font-medium" style={{ color: "var(--ok)" }}>
                Franchi avec {galaxie.scoreSoleil} %. La galaxie suivante est ouverte.
              </p>
              <Link href={routes.soleil(galaxie.id)} className="bouton self-start">
                Refaire l&apos;épreuve
              </Link>
            </>
          ) : galaxie.soleilAccessible ? (
            <>
              <p className="font-medium">Toutes les planètes sont validées. L&apos;épreuve finale mélange tout le chapitre.</p>
              <Link href={routes.soleil(galaxie.id)} className="bouton bouton-principal self-start">
                Affronter le soleil
              </Link>
            </>
          ) : (
            <p className="texte-2">
              Valide toutes les planètes pour l&apos;atteindre ({galaxie.planetes.filter((pl) => pl.etape === "validated").length} /{" "}
              {galaxie.planetes.length}).
            </p>
          )}
        </section>
      )}
    </div>
  );
}
