import Link from "next/link";
import { deconnecter } from "@/app/auth/actions";
import { emailConnecte, supabaseConfigure } from "@/lib/supabase/server";

export default async function Accueil() {
  const configure = supabaseConfigure();
  const email = configure ? await emailConnecte() : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-8">
      <h1 className="text-3xl font-semibold tracking-tight">Ancre</h1>

      <Link href="/session" className="bouton bouton-principal text-lg px-8" style={{ minHeight: 56 }}>
        Démarrer ma session
      </Link>

      <p className="texte-2">10 cartes de démonstration · environ 5 minutes</p>

      {!configure && (
        <p className="texte-2 text-sm">Connexion désactivée : Supabase n&apos;est pas encore configuré.</p>
      )}

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
