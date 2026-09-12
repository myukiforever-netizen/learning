// Série de jours 🔥 : nombre de jours consécutifs (jusqu'à aujourd'hui ou hier)
// avec au moins une session terminée. Simple compteur, aucune punition.
import { ajouterJours } from "@/lib/dates";

/**
 * @param joursAvecSession  Dates AAAA-MM-JJ (doublons acceptés) des sessions terminées.
 * @param aujourdhui        Date du jour AAAA-MM-JJ.
 * La série reste vivante si la dernière session date d'hier (la journée n'est pas finie).
 */
export function calculerSerie(joursAvecSession: string[], aujourdhui: string): number {
  const jours = new Set(joursAvecSession);
  let curseur = jours.has(aujourdhui) ? aujourdhui : ajouterJours(aujourdhui, -1);
  let serie = 0;
  while (jours.has(curseur)) {
    serie += 1;
    curseur = ajouterJours(curseur, -1);
  }
  return serie;
}
