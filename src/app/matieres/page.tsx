// Toujours rendu à la demande : l'état de la base et de la configuration change.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { ImportMatiere } from "./ImportMatiere";
import { actionBasculerPause, actionChargerMatiereLivree } from "./actions";
import { MATIERES_LIVREES } from "@/data/matieres";
import { compterCartes } from "@/lib/import/schema";
import { listerMatieres, type MatiereEnBase } from "@/lib/supabase/requetes";
import { supabaseConfigure } from "@/lib/supabase/server";

export default async function PageMatieres() {
  const configure = supabaseConfigure();
  const enBase: MatiereEnBase[] = configure ? await listerMatieres() : [];
  const versionEnBase = new Map(enBase.map((m) => [m.id, m.version]));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Matières</h1>
        <Link href="/" className="texte-2 text-sm underline underline-offset-4">
          Accueil
        </Link>
      </header>

      {!configure && (
        <p className="texte-2">
          Sans Supabase, les matières livrées ci-dessous sont utilisées telles quelles en mode découverte. L&apos;import et
          l&apos;export demandent une base configurée.
        </p>
      )}

      {configure && (
        <section className="flex flex-col gap-3">
          <h2 className="texte-2 text-sm uppercase tracking-wide">Mes matières</h2>
          {enBase.length === 0 && <p className="texte-2">Aucune matière chargée pour l&apos;instant.</p>}
          {enBase.map((m) => (
            <div key={m.id} className="bg-carte rounded-2xl border border-bordure shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="inline-block w-3 h-3 rounded-full shrink-0"
                  style={{ background: m.color ?? "var(--texte-2)" }}
                  aria-hidden="true"
                />
                <span className="font-medium">{m.name}</span>
                <span className="texte-2 text-sm">v{m.version}</span>
                {m.status === "paused" && <span className="texte-2 text-sm">· en pause</span>}
              </div>
              <p className="texte-2 text-sm">
                {m.nbCartes} carte{m.nbCartes > 1 ? "s" : ""}
                {m.nbArchivees > 0 ? `, ${m.nbArchivees} archivée${m.nbArchivees > 1 ? "s" : ""}` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <form action={actionBasculerPause}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="bouton text-sm">
                    {m.status === "active" ? "Mettre en pause" : "Reprendre"}
                  </button>
                </form>
                <a href={`/api/export?matiere=${encodeURIComponent(m.id)}`} className="bouton text-sm" download>
                  Exporter le JSON
                </a>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="texte-2 text-sm uppercase tracking-wide">Matières livrées avec l&apos;app</h2>
        {MATIERES_LIVREES.map((m) => {
          const version = versionEnBase.get(m.id);
          const aJour = version !== undefined && version >= m.version;
          return (
            <div key={m.id} className="bg-carte rounded-2xl border border-bordure shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="inline-block w-3 h-3 rounded-full shrink-0"
                  style={{ background: m.color ?? "var(--texte-2)" }}
                  aria-hidden="true"
                />
                <span className="font-medium">{m.name}</span>
                <span className="texte-2 text-sm">v{m.version}</span>
              </div>
              {m.description && <p className="texte-2 text-sm">{m.description}</p>}
              <p className="texte-2 text-sm">{compterCartes(m)} cartes</p>
              {configure && (
                <form action={actionChargerMatiereLivree}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className={`bouton text-sm ${aJour ? "" : "bouton-principal"}`} disabled={aJour}>
                    {aJour ? "Déjà chargée" : version !== undefined ? `Mettre à jour (v${version} → v${m.version})` : "Charger"}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </section>

      {configure && (
        <section className="flex flex-col gap-3">
          <h2 className="texte-2 text-sm uppercase tracking-wide">Importer un fichier JSON</h2>
          <p className="texte-2 text-sm">
            Format décrit dans <code>SCHEMA.md</code>. Réimporter une nouvelle version met à jour les textes sans effacer ton
            historique ; les cartes disparues sont archivées.
          </p>
          <ImportMatiere />
        </section>
      )}
    </div>
  );
}
