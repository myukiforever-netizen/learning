// Catalogue des sons de l'Odyssée : de simples données, sans Web Audio ni React,
// donc lisibles et testables (tests/audio.test.ts). Le moteur (moteur.ts) les joue.
//
// Principes : aucun fichier audio (tout est synthétisé), sons courts et discrets,
// jamais deux sons en même temps pour la même action, célébrations réservées aux
// vrais actes d'apprentissage (règle produit 8).

export type NomSon =
  | "tap" // clic générique sur un bouton ou un lien
  | "choix" // sélection d'une option de QCM, d'une catégorie
  | "confiance" // choix d'un emoji de confiance
  | "reveler" // la réponse se dévoile
  | "bon" // bonne réponse
  | "pasEncore" // réponse ratée : signal clair, jamais punitif
  | "suivant" // passage à la carte suivante
  | "page" // écran de découverte suivant
  | "decollage" // voyage vers une planète ou un soleil
  | "arrivee" // fin d'une phase sans note (découverte, laboratoire)
  | "xp" // gain de points d'expérience
  | "niveau" // passage de niveau
  | "deblocage" // planète validée, planète suivante ouverte
  | "soleil" // soleil franchi : galaxie terminée
  | "echec" // mission ou soleil en dessous du seuil
  | "profil" // choix d'un profil
  | "alerte" // boîte « je croyais savoir » : trou noir
  | "fin"; // fin de patrouille

/** Une note : un oscillateur avec une enveloppe. `vers` fait glisser la hauteur. */
export interface NoteSon {
  hz: number;
  vers?: number;
  /** Décalage du départ, en secondes. */
  debut: number;
  duree: number;
  /** Volume de la note, 0 à 1 (volontairement bas : plusieurs notes se cumulent). */
  gain: number;
  forme: OscillatorType;
}

/** Un souffle : du bruit filtré, pour les fusées, les révélations, les scintillements. */
export interface BruitSon {
  debut: number;
  duree: number;
  gain: number;
  /** Fréquence de coupure du filtre, et son balayage éventuel. */
  coupure: number;
  vers?: number;
  type: "passe-bas" | "passe-haut";
}

export interface DefinitionSon {
  notes: NoteSon[];
  bruits?: BruitSon[];
}

// Quelques hauteurs utiles (gamme de do, en hertz).
const DO4 = 261.63;
const MI4 = 329.63;
const SOL4 = 392.0;
const DO5 = 523.25;
const RE5 = 587.33;
const MI5 = 659.25;
const SOL5 = 783.99;
const LA5 = 880.0;
const DO6 = 1046.5;
const MI6 = 1318.51;
const SOL6 = 1567.98;

export const SONS: Record<NomSon, DefinitionSon> = {
  tap: {
    notes: [{ hz: LA5, debut: 0, duree: 0.045, gain: 0.035, forme: "sine" }],
  },
  choix: {
    notes: [{ hz: MI5, debut: 0, duree: 0.06, gain: 0.05, forme: "triangle" }],
  },
  confiance: {
    notes: [{ hz: DO5, vers: SOL5, debut: 0, duree: 0.11, gain: 0.05, forme: "sine" }],
  },
  reveler: {
    notes: [{ hz: 300, vers: 620, debut: 0, duree: 0.2, gain: 0.04, forme: "sine" }],
    bruits: [{ debut: 0, duree: 0.22, gain: 0.04, coupure: 500, vers: 2600, type: "passe-bas" }],
  },
  bon: {
    notes: [
      { hz: DO5, debut: 0, duree: 0.16, gain: 0.07, forme: "triangle" },
      { hz: MI5, debut: 0.07, duree: 0.16, gain: 0.07, forme: "triangle" },
      { hz: SOL5, debut: 0.14, duree: 0.2, gain: 0.07, forme: "triangle" },
      { hz: DO6, debut: 0.21, duree: 0.14, gain: 0.04, forme: "sine" },
    ],
  },
  pasEncore: {
    // Deux notes graves qui descendent doucement : on comprend sans être puni.
    notes: [
      { hz: 330, vers: 294, debut: 0, duree: 0.26, gain: 0.06, forme: "sine" },
      { hz: 165, debut: 0.03, duree: 0.28, gain: 0.045, forme: "triangle" },
    ],
  },
  suivant: {
    notes: [{ hz: SOL4, debut: 0, duree: 0.05, gain: 0.035, forme: "sine" }],
  },
  page: {
    bruits: [{ debut: 0, duree: 0.09, gain: 0.03, coupure: 1400, vers: 900, type: "passe-haut" }],
    notes: [{ hz: 700, debut: 0, duree: 0.05, gain: 0.02, forme: "sine" }],
  },
  decollage: {
    // Grondement de réacteur qui monte : on quitte l'orbite.
    notes: [
      { hz: 70, vers: 300, debut: 0, duree: 0.85, gain: 0.07, forme: "sine" },
      { hz: 140, vers: 600, debut: 0.05, duree: 0.7, gain: 0.03, forme: "triangle" },
    ],
    bruits: [{ debut: 0, duree: 0.9, gain: 0.07, coupure: 180, vers: 1100, type: "passe-bas" }],
  },
  arrivee: {
    notes: [
      { hz: SOL4, debut: 0, duree: 0.45, gain: 0.05, forme: "sine" },
      { hz: RE5, debut: 0.06, duree: 0.42, gain: 0.04, forme: "sine" },
    ],
  },
  xp: {
    notes: [
      { hz: DO6, debut: 0, duree: 0.08, gain: 0.045, forme: "sine" },
      { hz: MI6, debut: 0.06, duree: 0.08, gain: 0.04, forme: "sine" },
      { hz: SOL6, debut: 0.12, duree: 0.1, gain: 0.035, forme: "sine" },
    ],
  },
  niveau: {
    notes: [
      { hz: DO5, debut: 0, duree: 0.22, gain: 0.06, forme: "triangle" },
      { hz: MI5, debut: 0.12, duree: 0.22, gain: 0.06, forme: "triangle" },
      { hz: SOL5, debut: 0.24, duree: 0.24, gain: 0.06, forme: "triangle" },
      { hz: DO6, debut: 0.36, duree: 0.5, gain: 0.07, forme: "triangle" },
      { hz: SOL5, debut: 0.36, duree: 0.5, gain: 0.03, forme: "sine" },
    ],
  },
  deblocage: {
    // Sas qui s'ouvre : arpège montant et scintillement.
    notes: [
      { hz: SOL4, debut: 0, duree: 0.18, gain: 0.05, forme: "triangle" },
      { hz: DO5, debut: 0.09, duree: 0.18, gain: 0.05, forme: "triangle" },
      { hz: MI5, debut: 0.18, duree: 0.18, gain: 0.05, forme: "triangle" },
      { hz: SOL5, debut: 0.27, duree: 0.3, gain: 0.06, forme: "triangle" },
      { hz: DO6, debut: 0.36, duree: 0.4, gain: 0.04, forme: "sine" },
    ],
    bruits: [{ debut: 0.3, duree: 0.5, gain: 0.025, coupure: 2000, vers: 5000, type: "passe-haut" }],
  },
  soleil: {
    // La seule grande célébration : un accord qui s'ouvre.
    notes: [
      { hz: DO4, debut: 0, duree: 1.4, gain: 0.05, forme: "sine" },
      { hz: MI4, debut: 0.08, duree: 1.35, gain: 0.045, forme: "sine" },
      { hz: SOL4, debut: 0.16, duree: 1.3, gain: 0.045, forme: "sine" },
      { hz: DO5, debut: 0.24, duree: 1.25, gain: 0.05, forme: "triangle" },
      { hz: MI5, debut: 0.5, duree: 1.0, gain: 0.04, forme: "triangle" },
      { hz: SOL5, debut: 0.7, duree: 0.85, gain: 0.035, forme: "sine" },
      { hz: DO6, debut: 0.9, duree: 0.7, gain: 0.03, forme: "sine" },
    ],
    bruits: [{ debut: 0, duree: 1.2, gain: 0.03, coupure: 600, vers: 4000, type: "passe-bas" }],
  },
  echec: {
    // Descente douce : « pas encore », jamais « échec ».
    notes: [
      { hz: SOL4, debut: 0, duree: 0.24, gain: 0.05, forme: "triangle" },
      { hz: MI4, debut: 0.16, duree: 0.24, gain: 0.05, forme: "triangle" },
      { hz: DO4, debut: 0.32, duree: 0.4, gain: 0.05, forme: "triangle" },
    ],
  },
  profil: {
    notes: [
      { hz: DO5, debut: 0, duree: 0.14, gain: 0.05, forme: "sine" },
      { hz: SOL5, debut: 0.1, duree: 0.26, gain: 0.05, forme: "sine" },
    ],
  },
  alerte: {
    // Trou noir : une nappe grave, sobre, sans agressivité.
    notes: [
      { hz: 180, vers: 120, debut: 0, duree: 0.5, gain: 0.05, forme: "sine" },
      { hz: 90, debut: 0.05, duree: 0.5, gain: 0.04, forme: "triangle" },
    ],
  },
  fin: {
    notes: [
      { hz: DO5, debut: 0, duree: 0.3, gain: 0.055, forme: "sine" },
      { hz: MI5, debut: 0.18, duree: 0.3, gain: 0.05, forme: "sine" },
      { hz: SOL5, debut: 0.36, duree: 0.45, gain: 0.05, forme: "sine" },
      { hz: DO6, debut: 0.54, duree: 0.6, gain: 0.04, forme: "triangle" },
    ],
  },
};

/** Durée totale d'un son, en secondes. */
export function dureeSon(def: DefinitionSon): number {
  const fins = [...def.notes.map((n) => n.debut + n.duree), ...(def.bruits ?? []).map((b) => b.debut + b.duree)];
  return fins.length === 0 ? 0 : Math.max(...fins);
}

// ---------------------------------------------------------------------------
// Réglages (par appareil, comme la taille de texte : casque ou haut-parleurs)
// ---------------------------------------------------------------------------

export interface ReglagesAudio {
  /** Ambiance de fond (le drone de la galaxie). */
  musique: boolean;
  /** Sons de retour (clics, bonnes réponses, déblocages). */
  effets: boolean;
  /** Volume général, 0 à 1. */
  volume: number;
}

export const CLE_AUDIO = "ancre.audio";

export const REGLAGES_AUDIO_DEFAUT: ReglagesAudio = { musique: true, effets: true, volume: 0.7 };

/** Lit les réglages stockés dans le navigateur. Valeur absente ou abîmée : réglages par défaut. */
export function lireReglagesAudio(valeur: string | null | undefined): ReglagesAudio {
  if (!valeur) return REGLAGES_AUDIO_DEFAUT;
  try {
    const json = JSON.parse(valeur) as Partial<ReglagesAudio>;
    return {
      musique: typeof json.musique === "boolean" ? json.musique : REGLAGES_AUDIO_DEFAUT.musique,
      effets: typeof json.effets === "boolean" ? json.effets : REGLAGES_AUDIO_DEFAUT.effets,
      volume: typeof json.volume === "number" && Number.isFinite(json.volume) ? Math.min(1, Math.max(0, json.volume)) : REGLAGES_AUDIO_DEFAUT.volume,
    };
  } catch {
    return REGLAGES_AUDIO_DEFAUT;
  }
}

/** Volume effectif d'une sortie : 0 si elle est coupée. L'ambiance reste en retrait. */
export function gainSortie(reglages: ReglagesAudio, sortie: "effets" | "musique"): number {
  if (sortie === "effets") return reglages.effets ? reglages.volume : 0;
  return reglages.musique ? reglages.volume * 0.35 : 0;
}

/** Silence radio : plus aucun son, ni ambiance ni effets. */
export function estSilencieux(reglages: ReglagesAudio): boolean {
  return (!reglages.musique && !reglages.effets) || reglages.volume === 0;
}

/**
 * Note de base de l'ambiance d'une galaxie : la teinte choisit un degré d'une
 * gamme pentatonique, donc deux galaxies sonnent différemment mais jamais faux.
 */
export function frequenceGalaxie(teinte: number): number {
  const degres = [0, 2, 4, 7, 9]; // pentatonique majeure, en demi-tons
  const t = ((Math.round(teinte) % 360) + 360) % 360;
  const index = Math.floor((t / 360) * degres.length) % degres.length;
  const octave = t < 180 ? 0 : -12; // les teintes froides descendent d'une octave
  return 110 * Math.pow(2, (degres[index] + octave) / 12); // autour de La2
}
