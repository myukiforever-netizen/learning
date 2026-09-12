// Toujours rendu à la demande : l'état de la base et de la configuration change.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabaseConfigure } from "@/lib/supabase/server";

/** Réglages (version minimale du jalon 3 : export. Taille de texte, mode sombre et quota au jalon 5.) */
export default function PageReglages() {
  const configure = supabaseConfigure();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Réglages</h1>
        <Link href="/" className="texte-2 text-sm underline underline-offset-4">
          Accueil
        </Link>
      </header>

      <section className="bg-carte rounded-2xl border border-bordure shadow-sm p-5 flex flex-col gap-3">
        <h2 className="font-medium">Mes données</h2>
        <p className="texte-2 text-sm">
          Tout ce que l&apos;app sait de toi (matières, cartes, historique de révision, réponses, sessions) dans un seul
          fichier JSON.
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
