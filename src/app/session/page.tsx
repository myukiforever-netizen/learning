import Link from "next/link";
import { Session } from "./Session";
import { CARTES_TEST } from "@/data/cartes-test";
import { aujourdhui } from "@/lib/dates";
import { CONFIG_REVISION } from "@/lib/revision/config";
import { ordonnerSansRepetition } from "@/lib/revision/composer";
import { composerSessionDepuisBase, creerSession } from "@/lib/supabase/requetes";
import { supabaseConfigure } from "@/lib/supabase/server";

/** Lit la durée choisie à l'accueil (?duree=20), sinon la durée par défaut. */
function dureeChoisie(valeur: string | string[] | undefined): number {
  const n = Number(Array.isArray(valeur) ? valeur[0] : valeur);
  const durees: readonly number[] = CONFIG_REVISION.durees;
  return durees.includes(n) ? n : CONFIG_REVISION.dureeParDefaut;
}

export default async function PageSession({ searchParams }: PageProps<"/session">) {
  const { duree } = await searchParams;
  const minutes = dureeChoisie(duree);
  const jour = aujourdhui();

  // Sans clés Supabase : mode découverte, 10 cartes en dur, rien n'est enregistré.
  if (!supabaseConfigure()) {
    const cartes = ordonnerSansRepetition(CARTES_TEST).map((carte) => ({ carte, revision: null }));
    return <Session mode="demo" sessionId={null} cartes={cartes} aujourdhui={jour} />;
  }

  const cartes = await composerSessionDepuisBase(minutes);
  if (cartes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <h1 className="text-2xl font-semibold">Rien à réviser pour l&apos;instant</h1>
        <p className="texte-2">Aucune carte due, et le quota de nouveautés du jour est atteint.</p>
        <Link href="/" className="bouton">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const sessionId = await creerSession(minutes);
  return <Session mode="base" sessionId={sessionId} cartes={cartes} aujourdhui={jour} />;
}
