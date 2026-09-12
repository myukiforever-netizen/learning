// Petites fonctions de dates, sans dépendance. Format des dates du jour : "AAAA-MM-JJ".
import { CONFIG_REVISION } from "@/lib/revision/config";

/** La date du jour dans le fuseau de l'utilisateur (config), au format AAAA-MM-JJ. */
export function aujourdhui(maintenant: Date = new Date()): string {
  return dateLocale(maintenant, CONFIG_REVISION.fuseauHoraire);
}

/** Date d'un instant donné, dans un fuseau donné, au format AAAA-MM-JJ. */
export function dateLocale(instant: Date, fuseau: string): string {
  // "en-CA" donne directement AAAA-MM-JJ.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: fuseau,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** Ajoute (ou retire) des jours à une date AAAA-MM-JJ. Calcul en UTC : pas de piège d'heure d'été. */
export function ajouterJours(date: string, jours: number): string {
  const [a, m, j] = date.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1, j + jours));
  return d.toISOString().slice(0, 10);
}

/** Nombre de jours entre deux dates AAAA-MM-JJ (positif si `b` est après `a`). */
export function joursEntre(a: string, b: string): number {
  const [aa, am, aj] = a.split("-").map(Number);
  const [ba, bm, bj] = b.split("-").map(Number);
  return Math.round((Date.UTC(ba, bm - 1, bj) - Date.UTC(aa, am - 1, aj)) / 86_400_000);
}
