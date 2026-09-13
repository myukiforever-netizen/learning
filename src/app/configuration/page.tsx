/** Écran affiché tant que Supabase n'est pas branché (clés absentes de .env.local). */
export default function PageConfiguration() {
  return (
    <div className="flex-1 flex flex-col justify-center gap-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold">Ancre a besoin de sa base</h1>
      <p className="texte-2">
        L&apos;Odyssée enregistre ta progression, tes révisions et ton profil dans Supabase. Sans clés, rien ne peut être
        joué.
      </p>
      <ol className="flex flex-col gap-3 list-decimal pl-5">
        <li>Crée un projet sur supabase.com, puis exécute dans « SQL Editor » les fichiers de <code>supabase/migrations/</code>, dans l&apos;ordre.</li>
        <li>Authentication → Users : ajoute ton email (« Auto confirm »).</li>
        <li>Authentication → URL Configuration : ajoute <code>http://localhost:3000/auth/callback</code>.</li>
        <li>Copie « Project URL » et la clé « anon public » dans <code>.env.local</code>, puis relance <code>npm run dev</code>.</li>
      </ol>
      <p className="texte-2 text-sm">Le pas à pas complet est dans UTILISATION.md, section 6.</p>
    </div>
  );
}
