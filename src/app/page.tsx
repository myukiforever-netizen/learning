import { deconnecter } from "@/app/auth/actions";
import { actionImporterDemo } from "@/app/session/actions";
import { ChoixDuree } from "@/components/ChoixDuree";
import { chiffresAccueil } from "@/lib/supabase/requetes";
import { emailConnecte, supabaseConfigure } from "@/lib/supabase/server";

export default async function Accueil() {
  const configure = supabaseConfigure();

  // Sans clés Supabase : mode découverte avec les cartes en dur.
  if (!configure) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-8">
        <h1 className="text-3xl font-semibold tracking-tight">Ancre</h1>
        <ChoixDuree />
        <p className="texte-2">10 cartes de démonstration, rien n&apos;est enregistré.</p>
        <p className="texte-2 text-sm">Connexion désactivée : Supabase n&apos;est pas encore configuré.</p>
      </div>
    );
  }

  const [email, chiffres] = await Promise.all([emailConnecte(), chiffresAccueil()]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-8">
      <h1 className="text-3xl font-semibold tracking-tight">Ancre</h1>

      {chiffres.totalCartes === 0 ? (
        <form action={actionImporterDemo} className="flex flex-col items-center gap-3">
          <p className="texte-2">Aucune carte pour l&apos;instant.</p>
          <button type="submit" className="bouton bouton-principal text-lg px-8" style={{ minHeight: 56 }}>
            Charger les 10 cartes de démonstration
          </button>
        </form>
      ) : (
        <ChoixDuree />
      )}

      <dl className="flex gap-8 sm:gap-12">
        <Chiffre valeur={chiffres.dues} libelle="révisions dues" emoji="🔁" />
        <Chiffre valeur={chiffres.nouvelles} libelle="nouveautés" emoji="🆕" />
        <Chiffre valeur={chiffres.serie} libelle="jours d'affilée" emoji="🔥" />
      </dl>

      {email && (
        <form action={deconnecter}>
          <button type="submit" className="texte-2 text-sm underline underline-offset-4">
            Se déconnecter ({email})
          </button>
        </form>
      )}
    </div>
  );
}

function Chiffre({ valeur, libelle, emoji }: { valeur: number; libelle: string; emoji: string }) {
  return (
    <div className="flex flex-col items-center">
      <dt className="texte-2 text-sm order-2">
        <span aria-hidden="true">{emoji}</span> {libelle}
      </dt>
      <dd className="text-3xl font-semibold order-1">{valeur}</dd>
    </div>
  );
}
