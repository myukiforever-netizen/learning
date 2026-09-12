// ============================================================
// TOUTES les valeurs réglables du moteur de révision sont ici.
// Aucune de ces valeurs ne doit être écrite « en dur » ailleurs.
// ============================================================

import type { ObjectifRetention } from "@/lib/types";

export const CONFIG_REVISION = {
  /** Calendrier de base : jours entre deux révisions, selon l'objectif de rétention. */
  calendriers: {
    "3m": [2, 7, 20, 45],
    "1y": [2, 10, 30, 90, 240],
    life: [2, 10, 30, 90, 240],
  } satisfies Record<ObjectifRetention, number[]>,

  /** « À vie » : une fois le calendrier épuisé, intervalle × ce facteur après chaque succès. */
  multiplicateurVie: 2,

  /** Réussi facilement (😎 + correct) : intervalle prévu × ce facteur. */
  facteurFacile: 2,

  /** Raté : prochain intervalle = précédent × ce facteur (et la carte revient aujourd'hui). */
  facteurRate: 0.5,

  /** Intervalle minimal en jours (jamais en dessous). */
  intervalleMinimum: 1,

  /** Nombre maximal de nouvelles cartes par jour (réglable dans les réglages). */
  nouvellesParJour: 15,

  /** Durées de session proposées à l'accueil, en minutes. */
  durees: [10, 20, 40, 60],

  /** Pour convertir une durée en nombre de cartes. */
  secondesParCarte: 30,
  /** Temps réservé à la page blanche + tri des erreurs, en secondes. */
  secondesFinDeSession: 180,

  /** Une carte ratée revient dans la même session, entre `min` et `max` cartes plus loin. */
  retourCarteRatee: {
    min: 5,
    max: 10,
    /** Au-delà, on arrête de la faire revenir dans cette session. */
    maxRetoursParSession: 2,
  },
} as const;
