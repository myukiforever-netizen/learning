"use client";

// Le gros bouton « Démarrer ma session » + le choix de la durée (10/20/40/60 min).
import { useState } from "react";
import Link from "next/link";
import { CONFIG_REVISION } from "@/lib/revision/config";

export function ChoixDuree() {
  const [duree, setDuree] = useState<number>(CONFIG_REVISION.dureeParDefaut);

  return (
    <div className="flex flex-col items-center gap-5">
      <Link
        href={`/session?duree=${duree}`}
        className="bouton bouton-principal text-lg px-8"
        style={{ minHeight: 56 }}
      >
        Démarrer ma session
      </Link>
      <div className="flex items-center gap-2" role="radiogroup" aria-label="Durée de la session">
        {CONFIG_REVISION.durees.map((valeur) => {
          const choisi = valeur === duree;
          return (
            <button
              key={valeur}
              type="button"
              role="radio"
              aria-checked={choisi}
              onClick={() => setDuree(valeur)}
              className="bouton px-4 text-sm"
              style={choisi ? { borderColor: "var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent)" } : undefined}
            >
              {valeur} min
            </button>
          );
        })}
      </div>
    </div>
  );
}
