"use client";

// Monte l'ambiance sonore d'un lieu : un drone très discret, propre à la teinte
// de la galaxie. S'arrête en quittant l'écran. N'affiche rien.
import { useEffect } from "react";
import { arreterAmbiance, demarrerAmbiance } from "@/lib/audio/moteur";

/** Teinte utilisée hors d'une galaxie (carte de l'univers, patrouille). */
export const TEINTE_ESPACE = 240;

export function Ambiance({ teinte = TEINTE_ESPACE }: { teinte?: number }) {
  useEffect(() => {
    demarrerAmbiance(teinte);
    return () => arreterAmbiance();
  }, [teinte]);
  return null;
}
