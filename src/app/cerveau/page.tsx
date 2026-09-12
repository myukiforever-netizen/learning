// Toujours rendu à la demande : les statistiques changent à chaque session.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { donneesCerveau } from "@/lib/supabase/requetes";
import { supabaseConfigure } from "@/lib/supabase/server";

const EMOJI_CONFIANCE: Record<number, string> = { 1: "😕", 2: "😐", 3: "😎" };

/** Mon cerveau : sobre, gros chiffres, 2 couleurs max par graphique. */
export default async function PageCerveau() {
  if (!supabaseConfigure()) {
    return (
      <div className="flex flex-col gap-6">
        <Entete />
        <p className="texte-2">Les statistiques demandent une base configurée : en mode découverte, rien n&apos;est enregistré.</p>
      </div>
    );
  }

  const d = await donneesCerveau();

  return (
    <div className="flex flex-col gap-8">
      <Entete />

      {d.totalReponses === 0 && <p className="texte-2">Fais une première session : les chiffres apparaîtront ici.</p>}

      <section className="bg-carte rounded-2xl border border-bordure shadow-sm p-5 flex flex-col gap-4">
        <h2 className="font-medium">Encore en mémoire aujourd&apos;hui</h2>
        {d.matieres.length === 0 && <p className="texte-2 text-sm">Aucune matière active.</p>}
        {d.matieres.map((m) => (
          <div key={m.id} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-4">
              <span className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: m.color ?? "var(--texte-2)" }} aria-hidden="true" />
                {m.name}
              </span>
              <span className="text-2xl font-semibold">{m.pourcentage} %</span>
            </div>
            <Barre valeur={m.pourcentage} />
            <p className="texte-2 text-sm">
              {m.cartesVues} carte{m.cartesVues > 1 ? "s" : ""} vue{m.cartesVues > 1 ? "s" : ""} sur {m.cartesTotal}. Les cartes jamais vues comptent pour 0.
            </p>
          </div>
        ))}
      </section>

      <section className="bg-carte rounded-2xl border border-bordure shadow-sm p-5 flex flex-col gap-4">
        <h2 className="font-medium">Ta confiance contre tes vrais résultats</h2>
        <p className="texte-2 text-sm">Pour chaque niveau de confiance annoncé, la part de réponses réellement justes.</p>
        <div className="flex flex-col gap-3">
          {d.calibration.map((c) => (
            <div key={c.confiance} className="flex items-center gap-3">
              <span className="text-2xl w-9" aria-label={`Confiance ${c.confiance}`}>
                {EMOJI_CONFIANCE[c.confiance]}
              </span>
              <div className="flex-1">
                <Barre valeur={c.taux ?? 0} />
              </div>
              <span className="w-28 text-right">
                {c.taux === null ? <span className="texte-2 text-sm">aucune</span> : <><span className="font-semibold">{c.taux} %</span> <span className="texte-2 text-sm">({c.total})</span></>}
              </span>
            </div>
          ))}
        </div>
        {d.messageCalibration && <p>{d.messageCalibration}</p>}
      </section>

      <section className="bg-carte rounded-2xl border border-bordure shadow-sm p-5 flex flex-col gap-4">
        <h2 className="font-medium">Liste rouge : ce qui résiste</h2>
        {d.listeRouge.length === 0 ? (
          <p className="texte-2 text-sm">Aucune carte ratée pour l&apos;instant.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {d.listeRouge.map((r, i) => (
              <li key={r.carte.id} className="flex items-start gap-3 border-t border-bordure pt-2 first:border-t-0 first:pt-0">
                <span className="touche">{i + 1}</span>
                <span className="flex-1">
                  {r.carte.question}
                  <span className="block texte-2 text-sm">
                    {r.carte.concept_nom} · ratée {r.rates} fois sur {r.total}
                  </span>
                </span>
                {r.alertes > 0 && (
                  <span className="text-sm font-medium whitespace-nowrap" style={{ color: "var(--alerte)" }}>
                    ⚠️ ×{r.alertes}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="bg-carte rounded-2xl border border-bordure shadow-sm p-5 flex flex-col gap-3">
        <h2 className="font-medium">Produire plutôt que lire</h2>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold">{d.production.production} %</span>
          <span className="texte-2">de cartes où tu as produit une réponse</span>
        </div>
        <Barre valeur={d.production.production} />
        <p className="texte-2 text-sm">
          Objectif : au moins 50 %. Estimé par nombre de cartes (les exemples résolus comptent comme de la lecture).
        </p>
      </section>
    </div>
  );
}

function Entete() {
  return (
    <header className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">Mon cerveau</h1>
      <Link href="/" className="texte-2 text-sm underline underline-offset-4">
        Accueil
      </Link>
    </header>
  );
}

/** Barre horizontale : accent sur fond bordure, deux couleurs, rien d'autre. */
function Barre({ valeur }: { valeur: number }) {
  const v = Math.max(0, Math.min(100, valeur));
  return (
    <div className="w-full h-2 rounded-full bg-bordure overflow-hidden" role="img" aria-label={`${v} %`}>
      <div className="h-full bg-accent" style={{ width: `${v}%` }} />
    </div>
  );
}
