// Maîtrise d'une notion (0 à 3 étoiles) à partir de son état de révision,
// agrégation par planète, et signaux de détresse. Logique pure.
import type { EtatRevision } from "@/lib/types";

export type Etoiles = 0 | 1 | 2 | 3;

/**
 * 0 : jamais vue · 1 : vue mais fragile (ratée, ⚠️, ou juste découverte)
 * 2 : réussie au moins une fois · 3 : stable (au moins 2 succès, état ok).
 */
export function etoilesNotion(revision: EtatRevision | null): Etoiles {
  if (!revision || revision.ease_state === "new") return 0;
  if (revision.ease_state === "failed" || revision.ease_state === "thought_knew") return 1;
  return revision.step >= 2 ? 3 : 2;
}

/** Moyenne des étoiles, arrondie au dixième. */
export function etoilesMoyenne(revisions: (EtatRevision | null)[]): number {
  if (revisions.length === 0) return 0;
  const somme = revisions.reduce((s, r) => s + etoilesNotion(r), 0);
  return Math.round((somme / revisions.length) * 10) / 10;
}

/** Une notion est en détresse si elle est due (ou en retard), ratée, ou ⚠️. */
export function notionEnDetresse(revision: EtatRevision | null, aujourdhui: string): boolean {
  if (!revision || revision.ease_state === "new") return false;
  if (revision.ease_state === "failed" || revision.ease_state === "thought_knew") return true;
  return revision.due_date <= aujourdhui;
}

/** Nombre de notions en détresse sur une planète. */
export function signauxDetresse(revisions: (EtatRevision | null)[], aujourdhui: string): number {
  return revisions.filter((r) => notionEnDetresse(r, aujourdhui)).length;
}

/** Un trou noir s'ouvre quand une notion est classée « je croyais savoir ». */
export function trousNoirs(revisions: (EtatRevision | null)[]): number {
  return revisions.filter((r) => r?.ease_state === "thought_knew").length;
}
