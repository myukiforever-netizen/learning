"use client";

// « Silence radio » : coupe ou rallume tout le son d'un seul geste, depuis le tableau de bord.
import { useSon } from "./AudioProvider";

export function BoutonSilence() {
  const { silence, basculerSilence } = useSon();
  return (
    <button
      type="button"
      onClick={basculerSilence}
      data-son="aucun"
      className="bouton px-3 text-sm"
      aria-pressed={silence}
      title={silence ? "Rallumer le son" : "Silence radio"}
    >
      <span aria-hidden="true">{silence ? "🔇" : "🔊"}</span>
      <span className="sr-only">{silence ? "Rallumer le son" : "Couper le son"}</span>
    </button>
  );
}
