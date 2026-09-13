// XP, niveaux, carburant. Toutes les valeurs viennent de config.ts (section odyssee).
// Logique pure, testée dans tests/recompenses.test.ts.
import { CONFIG_REVISION } from "@/lib/revision/config";

const { xp: BAREME, niveaux: NIVEAUX, carburant: CARBURANT } = CONFIG_REVISION.odyssee;

export type EvenementXp = keyof typeof BAREME;

export function xpPour(evenement: EvenementXp, fois = 1): number {
  return BAREME[evenement] * fois;
}

export interface Niveau {
  niveau: number;
  /** XP accumulé dans le niveau courant. */
  xpDansNiveau: number;
  /** XP nécessaire pour passer au niveau suivant (null = niveau maximal). */
  xpPourSuivant: number | null;
  /** 0 à 1, avancement vers le niveau suivant. */
  progression: number;
}

export function niveauPourXp(xp: number): Niveau {
  let index = 0;
  while (index + 1 < NIVEAUX.length && xp >= NIVEAUX[index + 1]) index += 1;
  const base = NIVEAUX[index];
  const suivant = index + 1 < NIVEAUX.length ? NIVEAUX[index + 1] : null;
  const xpDansNiveau = xp - base;
  const xpPourSuivant = suivant === null ? null : suivant - base;
  return {
    niveau: index + 1,
    xpDansNiveau,
    xpPourSuivant,
    progression: xpPourSuivant === null ? 1 : Math.min(1, xpDansNiveau / xpPourSuivant),
  };
}

/** XP gagné par une mission : base si réussie, bonus si parfaite. Rien si ratée (mais on garde les XP des cartes). */
export function xpMission(score: number, seuil: number, parfaite: boolean): number {
  if (score < seuil) return 0;
  return BAREME.missionReussie + (parfaite ? BAREME.bonusMissionParfaite : 0);
}

export function carburantApresPatrouille(carburant: number): number {
  return Math.min(CARBURANT.max, carburant + CARBURANT.parPatrouille);
}

export function peutSauter(carburant: number): boolean {
  return carburant >= CARBURANT.coutSaut;
}

export function carburantApresSaut(carburant: number): number {
  return Math.max(0, carburant - CARBURANT.coutSaut);
}
