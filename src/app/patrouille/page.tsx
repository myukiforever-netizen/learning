import Link from "next/link";
import { Session } from "@/app/session/Session";
import { aujourdhui } from "@/lib/dates";
import { CONFIG_REVISION } from "@/lib/revision/config";
import { composerSessionDepuisBase, creerSession } from "@/lib/supabase/requetes";

/** Lit la durée choisie (?duree=20), sinon la durée par défaut. */
function dureeChoisie(valeur: string | string[] | undefined): number {
  const n = Number(Array.isArray(valeur) ? valeur[0] : valeur);
  const durees: readonly number[] = CONFIG_REVISION.durees;
  return durees.includes(n) ? n : CONFIG_REVISION.dureeParDefaut;
}

/** La patrouille : la séance de révision espacée (notions dues et fragiles d'abord). */
export default async function PagePatrouille({ searchParams }: PageProps<"/patrouille">) {
  const { duree } = await searchParams;
  const minutes = dureeChoisie(duree);
  const cartes = await composerSessionDepuisBase(minutes);

  if (cartes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <h1 className="text-2xl font-semibold">Aucun signal à secourir</h1>
        <p className="texte-2">Rien n&apos;est dû aujourd&apos;hui. Explore une nouvelle planète, ou reviens demain.</p>
        <Link href="/" className="bouton">
          Retour à l&apos;univers
        </Link>
      </div>
    );
  }

  const sessionId = await creerSession(minutes);
  return <Session mode="patrouille" sessionId={sessionId} cartes={cartes} aujourdhui={aujourdhui()} retourHref="/" />;
}
