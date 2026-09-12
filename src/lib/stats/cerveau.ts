// Statistiques de l'écran « Mon cerveau ». Logique pure, testée dans tests/cerveau.test.ts.
import { CONFIG_REVISION } from "@/lib/revision/config";
import { joursEntre } from "@/lib/dates";
import type { BoiteErreur, Carte, Confiance, EtatRevision, TypeCarte } from "@/lib/types";

/** Une réponse enregistrée (sous-ensemble de la table `answers`). */
export interface ReponseStats {
  card_id: string;
  correct: boolean;
  confidence: Confiance;
  error_box: BoiteErreur | null;
}

/**
 * Part estimée d'une carte encore en mémoire aujourd'hui (0 à 1).
 * - jamais vue, ratée ou « je croyais savoir » → 0 ;
 * - sinon, `retentionALaDateDue` à la date due, et ça baisse ensuite (courbe géométrique).
 */
export function retentionCarte(revision: EtatRevision | null, aujourdhui: string): number {
  if (!revision || revision.ease_state === "new" || revision.ease_state === "failed" || revision.ease_state === "thought_knew") {
    return 0;
  }
  const intervalle = Math.max(1, revision.interval_days);
  const derniereRevision = joursEntre(aujourdhui, revision.due_date) * -1 + intervalle; // jours écoulés depuis la dernière révision
  const ecoules = Math.max(0, derniereRevision);
  return Math.pow(CONFIG_REVISION.memoire.retentionALaDateDue, ecoules / intervalle);
}

export interface StatMatiere {
  id: string;
  name: string;
  color: string | null;
  /** 0 à 100. */
  pourcentage: number;
  cartesVues: number;
  cartesTotal: number;
}

export function pourcentageMatiere(
  cartes: { revision: EtatRevision | null }[],
  aujourdhui: string,
): { pourcentage: number; cartesVues: number } {
  if (cartes.length === 0) return { pourcentage: 0, cartesVues: 0 };
  const somme = cartes.reduce((s, c) => s + retentionCarte(c.revision, aujourdhui), 0);
  return {
    pourcentage: Math.round((somme / cartes.length) * 100),
    cartesVues: cartes.filter((c) => c.revision !== null).length,
  };
}

export interface Calibration {
  confiance: Confiance;
  total: number;
  correctes: number;
  /** 0 à 100, ou null si aucune réponse à ce niveau. */
  taux: number | null;
}

/** Pour chaque niveau de confiance : combien de réponses, combien de justes. */
export function calibrationConfiance(reponses: ReponseStats[]): Calibration[] {
  return ([1, 2, 3] as Confiance[]).map((confiance) => {
    const du = reponses.filter((r) => r.confidence === confiance);
    const correctes = du.filter((r) => r.correct).length;
    return { confiance, total: du.length, correctes, taux: du.length === 0 ? null : Math.round((correctes / du.length) * 100) };
  });
}

/** Une phrase honnête sur la calibration, ou null s'il n'y a pas assez de données. */
export function messageCalibration(calibration: Calibration[]): string | null {
  const sur = calibration.find((c) => c.confiance === 3);
  const pasSur = calibration.find((c) => c.confiance === 1);
  const seuil = CONFIG_REVISION.memoire.reponsesMinimumCalibration;
  if (sur && sur.total >= seuil && sur.taux !== null && sur.taux < 80) {
    return `Quand tu te dis sûr 😎, tu as raison ${sur.taux} % du temps. Méfie-toi de ta confiance.`;
  }
  if (pasSur && pasSur.total >= seuil && pasSur.taux !== null && pasSur.taux > 70) {
    return `Quand tu te dis pas sûr 😕, tu as pourtant raison ${pasSur.taux} % du temps. Tu en sais plus que tu ne crois.`;
  }
  if (sur && sur.total >= seuil) return "Ta confiance colle bien à tes résultats.";
  return null;
}

export interface CarteRatee {
  carte: Carte;
  rates: number;
  total: number;
  /** Nombre de fois classée « je croyais savoir ». */
  alertes: number;
}

/** Les cartes les plus ratées (⚠️ d'abord, puis nombre de ratés), au plus `limite`. */
export function topRatees(reponses: ReponseStats[], cartes: Carte[], limite = 10): CarteRatee[] {
  const parCarte = new Map(cartes.map((c) => [c.id, c]));
  const stats = new Map<string, CarteRatee>();
  for (const r of reponses) {
    const carte = parCarte.get(r.card_id);
    if (!carte) continue;
    const s = stats.get(r.card_id) ?? { carte, rates: 0, total: 0, alertes: 0 };
    s.total += 1;
    if (!r.correct) s.rates += 1;
    if (r.error_box === "thought_knew") s.alertes += 1;
    stats.set(r.card_id, s);
  }
  return [...stats.values()]
    .filter((s) => s.rates > 0)
    .sort((a, b) => b.alertes - a.alertes || b.rates - a.rates || a.total - b.total)
    .slice(0, limite);
}

/** Types où l'utilisateur lit plus qu'il ne produit. */
const TYPES_CONSOMMATION: readonly TypeCarte[] = ["worked_example"];

/**
 * Part des cartes où tu as PRODUIT une réponse (0 à 100), par opposition à celles
 * où tu as surtout lu (exemple résolu). Estimation par nombre de cartes, pas par temps.
 */
export function ratioProduction(reponses: ReponseStats[], cartes: Carte[]): { production: number; total: number } {
  const typeDe = new Map(cartes.map((c) => [c.id, c.type]));
  const total = reponses.filter((r) => typeDe.has(r.card_id)).length;
  const consommation = reponses.filter((r) => TYPES_CONSOMMATION.includes(typeDe.get(r.card_id) as TypeCarte)).length;
  return { production: total === 0 ? 0 : Math.round(((total - consommation) / total) * 100), total };
}
