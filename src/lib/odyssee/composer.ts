// Composition des séances de l'Odyssée : compréhension, entraînement, mission, soleil.
// Logique pure (testée dans tests/odyssee-composer.test.ts). La patrouille reste
// dans src/lib/revision/composer.ts.
import { CONFIG_REVISION } from "@/lib/revision/config";
import { ordonnerSansRepetition } from "@/lib/revision/composer";
import type { Carte, PhaseCarte } from "@/lib/types";

const { phaseParType, niveauParType, cartesMission, cartesSoleil } = CONFIG_REVISION.odyssee;

/** Phase d'une carte : celle du JSON, sinon celle de son type. */
export function phaseDe(carte: Carte): PhaseCarte {
  return carte.phase ?? phaseParType[carte.type];
}

/** Niveau de difficulté d'une carte : celui du JSON, sinon celui de son type. */
export function niveauDe(carte: Carte): 1 | 2 | 3 {
  return carte.niveau ?? niveauParType[carte.type];
}

/** Mélange déterministe (graine = texte) : même séance pour une même graine, ordre différent d'une graine à l'autre. */
export function melangerAvecGraine<T>(liste: T[], graine: string): T[] {
  let h = 2166136261;
  for (const c of graine) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const suivant = () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 4294967296;
  };
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(suivant() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/**
 * Cartes d'une phase de planète, dans l'ordre du contenu, du plus simple au plus exigeant.
 * Si la phase demandée est vide (ex. un concept sans carte de compréhension), on prend l'autre phase.
 */
export function composerPhase(cartesPlanete: Carte[], phase: PhaseCarte): Carte[] {
  const dePhase = cartesPlanete.filter((c) => phaseDe(c) === phase);
  const base = dePhase.length > 0 ? dePhase : cartesPlanete;
  return [...base].sort((a, b) => niveauDe(a) - niveauDe(b));
}

/**
 * Mission de validation d'une planète : 6 à 10 cartes, tous niveaux mélangés,
 * en privilégiant l'entraînement (au moins 2 cartes de compréhension si possible).
 */
export function composerMission(cartesPlanete: Carte[], graine: string): Carte[] {
  const entrainement = melangerAvecGraine(cartesPlanete.filter((c) => phaseDe(c) === "entrainement"), graine + ":e");
  const comprehension = melangerAvecGraine(cartesPlanete.filter((c) => phaseDe(c) === "comprehension"), graine + ":c");
  const cible = Math.min(cartesMission.max, Math.max(cartesMission.min, cartesPlanete.length));
  const nbComprehension = Math.min(comprehension.length, Math.max(2, Math.floor(cible * 0.3)));
  const choisies = [...comprehension.slice(0, nbComprehension), ...entrainement];
  const manque = cible - choisies.length;
  if (manque > 0) choisies.push(...comprehension.slice(nbComprehension, nbComprehension + manque));
  return melangerAvecGraine(choisies.slice(0, cible), graine + ":m");
}

/**
 * Épreuve du soleil : 12 à 20 cartes prises dans toutes les planètes de la galaxie,
 * réparties équitablement, puis entrelacées (jamais deux cartes de la même planète à la suite).
 */
export function composerSoleil(cartesParPlanete: Carte[][], graine: string): Carte[] {
  const planetes = cartesParPlanete.filter((c) => c.length > 0);
  if (planetes.length === 0) return [];
  const total = planetes.reduce((n, c) => n + c.length, 0);
  const cible = Math.min(cartesSoleil.max, Math.max(cartesSoleil.min, total));
  const parPlanete = Math.max(1, Math.floor(cible / planetes.length));

  const choisies: Carte[] = [];
  const restes: Carte[] = [];
  planetes.forEach((cartes, i) => {
    const melangees = melangerAvecGraine(cartes, `${graine}:${i}`);
    choisies.push(...melangees.slice(0, parPlanete));
    restes.push(...melangees.slice(parPlanete));
  });
  const complement = melangerAvecGraine(restes, graine + ":r").slice(0, Math.max(0, cible - choisies.length));
  return ordonnerSansRepetition(melangerAvecGraine([...choisies, ...complement], graine + ":s"));
}

/** Score d'une séance : part de premières réponses correctes (0 à 1). */
export function scoreDe(reponses: { card_id: string; correct: boolean }[]): number {
  const premieres = new Map<string, boolean>();
  for (const r of reponses) if (!premieres.has(r.card_id)) premieres.set(r.card_id, r.correct);
  if (premieres.size === 0) return 0;
  return [...premieres.values()].filter(Boolean).length / premieres.size;
}
