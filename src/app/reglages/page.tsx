// Toujours rendu à la demande : l'état de la base et de la configuration change.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { actionEnregistrerAffichage, actionEnregistrerQuota } from "./actions";
import { lireAffichage } from "@/lib/affichage";
import { CONFIG_REVISION } from "@/lib/revision/config";
import { lireQuotaNouvelles } from "@/lib/supabase/requetes";
import { supabaseConfigure } from "@/lib/supabase/server";

export default async function PageReglages() {
  const configure = supabaseConfigure();
  const [affichage, quota] = await Promise.all([
    lireAffichage(),
    configure ? lireQuotaNouvelles() : Promise.resolve(CONFIG_REVISION.nouvellesParJour),
  ]);
  const { taillesTexte, quotaNouvellesMin, quotaNouvellesMax } = CONFIG_REVISION.reglages;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Réglages</h1>
        <Link href="/" className="texte-2 text-sm underline underline-offset-4">
          Accueil
        </Link>
      </header>

      <form action={actionEnregistrerAffichage} className="bg-carte rounded-2xl border border-bordure shadow-sm p-5 flex flex-col gap-5">
        <h2 className="font-medium">Affichage</h2>

        <fieldset className="flex flex-col gap-3">
          <legend className="texte-2 text-sm mb-2">Taille du texte</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {taillesTexte.map((taille) => (
              <label
                key={taille}
                className="bouton text-sm cursor-pointer"
                style={
                  affichage.tailleTexte === taille
                    ? { borderColor: "var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent)" }
                    : undefined
                }
              >
                <input type="radio" name="tailleTexte" value={taille} defaultChecked={affichage.tailleTexte === taille} className="sr-only" />
                <span style={{ fontSize: taille }}>Aa</span> {taille} px
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="sombre" defaultChecked={affichage.sombre} className="mt-1 w-5 h-5 accent-[var(--accent)]" />
          <span>
            Mode sombre
            <span className="block texte-2 text-sm">
              La lecture est un peu plus précise en mode clair ; le sombre est là pour ton confort le soir.
            </span>
          </span>
        </label>

        <button type="submit" className="bouton bouton-principal self-start">
          Enregistrer l&apos;affichage
        </button>
      </form>

      <form action={actionEnregistrerQuota} className="bg-carte rounded-2xl border border-bordure shadow-sm p-5 flex flex-col gap-4">
        <h2 className="font-medium">Nouveautés par jour</h2>
        <p className="texte-2 text-sm">
          Nombre maximal de nouvelles cartes introduites chaque jour. Les révisions dues passent toujours avant.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            name="quota"
            min={quotaNouvellesMin}
            max={quotaNouvellesMax}
            defaultValue={quota}
            disabled={!configure}
            className="rounded-xl border border-bordure bg-fond px-4 py-3 w-28"
            aria-label="Nouvelles cartes par jour"
          />
          <button type="submit" className="bouton" disabled={!configure}>
            Enregistrer
          </button>
        </div>
        {!configure && <p className="texte-2 text-sm">Réglable une fois Supabase configuré (défaut : {quota}).</p>}
      </form>

      <section className="bg-carte rounded-2xl border border-bordure shadow-sm p-5 flex flex-col gap-3">
        <h2 className="font-medium">Mes données</h2>
        <p className="texte-2 text-sm">
          Tout ce que l&apos;app sait de toi (matières, cartes, historique de révision, réponses, sessions) dans un seul
          fichier JSON. Les matières s&apos;exportent une par une depuis l&apos;écran Matières.
        </p>
        {configure ? (
          <a href="/api/export?tout=1" className="bouton self-start" download>
            Tout exporter
          </a>
        ) : (
          <p className="texte-2 text-sm">Disponible une fois Supabase configuré.</p>
        )}
      </section>
    </div>
  );
}
