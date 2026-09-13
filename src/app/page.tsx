import Link from "next/link";
import { CarteUnivers } from "@/components/odyssee/CarteUnivers";
import { Hud } from "@/components/odyssee/Hud";
import { prochaineDestination, resumeSecteur } from "@/lib/odyssee/univers";
import { routes } from "@/lib/odyssee/urls";
import { chargerUnivers } from "@/lib/supabase/odyssee";
import { chiffresAccueil } from "@/lib/supabase/requetes";
import { profilCourant } from "@/lib/profils";
import { redirect } from "next/navigation";

/** La carte de l'univers : écran principal. */
export default async function PageUnivers() {
  const profil = await profilCourant();
  if (!profil) redirect("/profils"); // cookie orphelin (profil supprimé)
  const [univers, chiffres] = await Promise.all([chargerUnivers(), chiffresAccueil()]);

  if (!univers) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <h1 className="text-3xl font-semibold tracking-tight">Ancre</h1>
        <p className="texte-2">Aucun secteur chargé. Charge une matière pour faire apparaître ses galaxies.</p>
        <Link href="/secteurs" className="bouton bouton-principal text-lg px-8" style={{ minHeight: 56 }}>
          Charger un secteur
        </Link>
      </div>
    );
  }

  const { secteur, detresse } = univers;
  const destination = prochaineDestination(secteur);
  const resume = resumeSecteur(secteur);
  const signaux = [...detresse.values()].reduce((s, n) => s + n, 0);

  return (
    <div className="flex flex-col gap-6">
      <Hud profil={univers.profil} joueur={profil} serie={chiffres.serie} signaux={chiffres.dues} />

      <section className="flex flex-col gap-2">
        <p className="texte-2 text-sm">Secteur</p>
        <h1 className="text-2xl font-semibold">{secteur.nom}</h1>
        <p className="texte-2 text-sm">
          {resume.planetesValidees} / {resume.planetesTotal} planètes validées · {resume.galaxiesFranchies} / {secteur.galaxies.length} galaxies
          franchies{signaux > 0 ? ` · ${signaux} signal${signaux > 1 ? "aux" : ""} de détresse` : ""}
        </p>
      </section>

      <CarteUnivers secteur={secteur} detresse={detresse} />

      <section className="panneau p-5 flex flex-col gap-3">
        {destination.type === "planete" && (
          <>
            <p className="texte-2 text-sm">Prochaine destination</p>
            <p className="font-medium">
              {destination.planete.nom} <span className="texte-2">· {destination.galaxie.nom}</span>
            </p>
            <Link href={routes.planete(destination.planete.id)} className="bouton bouton-principal self-start">
              Décoller
            </Link>
          </>
        )}
        {destination.type === "soleil" && (
          <>
            <p className="texte-2 text-sm">Prochaine destination</p>
            <p className="font-medium">Le soleil de {destination.galaxie.nom} t&apos;attend.</p>
            <Link href={routes.soleil(destination.galaxie.id)} className="bouton bouton-principal self-start">
              Affronter le soleil
            </Link>
          </>
        )}
        {destination.type === "termine" && <p className="font-medium">Tout le secteur est exploré. Les patrouilles gardent tes notions vivantes.</p>}
      </section>

      <nav className="flex flex-wrap gap-4 texte-2 text-sm justify-center" aria-label="Autres écrans">
        <Link href="/secteurs" className="underline underline-offset-4">Secteurs</Link>
        <Link href="/cerveau" className="underline underline-offset-4">Mon cerveau</Link>
        <Link href="/reglages" className="underline underline-offset-4">Réglages</Link>
        <Link href="/profils" className="underline underline-offset-4">Changer de profil</Link>
      </nav>
    </div>
  );
}
