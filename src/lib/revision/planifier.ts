// Le moteur de révision : quand revoir une carte, selon le résultat, la confiance
// et la boîte d'erreur. Logique pure, sans React ni base de données.
// Toutes les valeurs (calendriers, facteurs) viennent de config.ts.

import { CONFIG_REVISION } from "./config";
import { ajouterJours } from "@/lib/dates";
import type { BoiteErreur, Confiance, EtatRevision, ObjectifRetention } from "@/lib/types";

/** Ce qu'on retient d'une réponse pour planifier : facile, avec effort, ou ratée. */
export type Resultat = "facile" | "effort" | "rate";

/** Traduit (correct, confiance) en résultat : 😎 + correct = facile ; correct autrement = effort. */
export function resultatDe(correct: boolean, confiance: Confiance): Resultat {
  if (!correct) return "rate";
  return confiance === 3 ? "facile" : "effort";
}

/** État d'une carte jamais vue : due aujourd'hui, au début du calendrier. */
export function etatInitial(aujourdhui: string): EtatRevision {
  return { step: 0, interval_days: 0, due_date: aujourdhui, ease_state: "new" };
}

/**
 * Calcule le nouvel état après une réponse.
 *
 * - Réussi facile  → intervalle prévu × facteurFacile.
 * - Réussi effort  → intervalle prévu.
 * - Raté           → prochain intervalle = moitié du précédent, carte due aujourd'hui.
 * Après un raté (ou une boîte ⚠️), le prochain succès utilise l'intervalle réduit
 * plutôt que le calendrier, puis le calendrier reprend.
 */
export function planifier(
  etat: EtatRevision,
  resultat: Resultat,
  objectif: ObjectifRetention,
  aujourdhui: string,
): EtatRevision {
  const { calendriers, facteurFacile, facteurRate, intervalleMinimum, multiplicateurVie } = CONFIG_REVISION;
  const calendrier = calendriers[objectif];

  if (resultat === "rate") {
    return {
      step: Math.max(0, etat.step - 1),
      interval_days: Math.max(intervalleMinimum, Math.floor(etat.interval_days * facteurRate)),
      due_date: aujourdhui,
      ease_state: "failed",
    };
  }

  let base: number;
  if (etat.ease_state === "failed" || etat.ease_state === "thought_knew") {
    base = etat.interval_days;
  } else if (etat.step < calendrier.length) {
    base = calendrier[etat.step];
  } else if (objectif === "life") {
    base = etat.interval_days * multiplicateurVie;
  } else {
    base = calendrier[calendrier.length - 1];
  }

  const applique = Math.max(intervalleMinimum, resultat === "facile" ? base * facteurFacile : base);

  return {
    step: etat.step + 1,
    interval_days: applique,
    due_date: ajouterJours(aujourdhui, applique),
    ease_state: "ok",
  };
}

/**
 * Applique la boîte choisie au tri des erreurs (fin de session), sur une carte déjà ratée.
 *
 * - « jamais su »            → on repart du début du calendrier (réapprentissage).
 * - « su mais pas retrouvé » → rien de plus : la règle « raté » (intervalle ÷ 2) suffit.
 * - « je croyais savoir »    → retour quasi au début + marqueur ⚠️ (priorité max).
 */
export function appliquerBoite(
  etat: EtatRevision,
  boite: BoiteErreur,
  objectif: ObjectifRetention,
  aujourdhui: string,
): EtatRevision {
  const premierIntervalle = CONFIG_REVISION.calendriers[objectif][0];

  switch (boite) {
    case "never_knew":
      return { step: 0, interval_days: premierIntervalle, due_date: aujourdhui, ease_state: "failed" };
    case "thought_knew":
      return { step: 0, interval_days: premierIntervalle, due_date: aujourdhui, ease_state: "thought_knew" };
    case "not_retrieved":
      return etat;
  }
}
