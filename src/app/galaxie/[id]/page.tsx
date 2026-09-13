import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaneteSvg } from "@/components/odyssee/PlaneteSvg";
import { apparenceGalaxie, palette } from "@/lib/odyssee/planete";
import { depuisUrl, routes } from "@/lib/odyssee/urls";
import { chargerUnivers } from "@/lib/supabase/odyssee";

const LIBELLE_ETAPE = {
  locked: "Verrouillée",
  available: "À explorer",
  discovered: "Découverte",
  understood: "Comprise",
  trained: "Entraînée",
  validated: "Validée",
} as const;

/** Vue d'une galaxie : ses planètes en orbite autour du soleil. */
export default async function PageGalaxie({ params }: PageProps<"/galaxie/[id]">) {
  const { id } = await params;
  const univers = await chargerUnivers();
  const galaxie = univers?.secteur.galaxies.find((g) => g.id === depuisUrl(id));
  if (!univers || !galaxie) notFound();

  const a = apparenceGalaxie(galaxie.id);
  const p = palette(a.teinte);
  const n = galaxie.planetes.length;
  const taille = 640;
  const centre = taille / 2;

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
        <div className="panneau p-2">
          <svg viewBox={`0 0 ${taille} ${taille}`} className="w-full h-auto" aria-label="Planètes de la galaxie">
            {galaxie.planetes.map((_, i) => {
              const rayon = 90 + i * ((centre - 110) / Math.max(1, n - 1));
              return <circle key={i} cx={centre} cy={centre} r={rayon} fill="none" stroke="var(--bordure)" strokeWidth="1" />;
            })}

            {/* Le soleil */}
            <g transform={`translate(${centre} ${centre})`}>
              <circle r="46" fill={p.halo} />
              <circle r="30" fill={galaxie.soleilAccessible || galaxie.statut === "franchie" ? p.claire : "var(--bordure)"} />
              {galaxie.statut === "franchie" && <circle r="52" fill="none" stroke="var(--ok)" strokeWidth="2" />}
            </g>

            {galaxie.planetes.map((pl, i) => {
              const rayon = 90 + i * ((centre - 110) / Math.max(1, n - 1));
              const angle = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(n, 3);
              const x = centre + rayon * Math.cos(angle);
              const y = centre + rayon * Math.sin(angle);
              const verrouillee = pl.etape === "locked";
              const signaux = univers.detresse.get(pl.id) ?? 0;
              const contenu = (
                <g transform={`translate(${x} ${y})`}>
                  {signaux > 0 && <circle r="34" fill="none" stroke="var(--effort)" strokeWidth="2" className="detresse" />}
                  <foreignObject x="-30" y="-30" width="60" height="60">
                    <PlaneteSvg id={pl.id} taille={60} eteinte={verrouillee} halo={pl.etape === "validated" ? "fort" : verrouillee ? "aucun" : "doux"} />
                  </foreignObject>
                  <text y="44" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--texte)">
                    {pl.nom.length > 26 ? pl.nom.slice(0, 25) + "…" : pl.nom}
                  </text>
                  <text y="59" textAnchor="middle" fontSize="10" fill={pl.etape === "validated" ? "var(--ok)" : "var(--texte-2)"}>
                    {LIBELLE_ETAPE[pl.etape]}
                    {pl.etape === "validated" && pl.meilleurScore > 0 ? ` · ${pl.meilleurScore} %` : ""}
                  </text>
                </g>
              );
              return <g key={pl.id}>{verrouillee ? contenu : <Link href={routes.planete(pl.id)}>{contenu}</Link>}</g>;
            })}
          </svg>
        </div>
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
