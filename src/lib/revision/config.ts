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

  /**
   * Une fois le calendrier épuisé :
   * - « à vie » : intervalle × multiplicateurVie après chaque succès ;
   * - 3 mois / 1 an : on répète le dernier intervalle du calendrier.
   */
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
  /** Durée proposée par défaut. */
  dureeParDefaut: 20,

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

  /** Écran « Mon cerveau ». */
  memoire: {
    /** Part estimée encore en mémoire quand une carte arrive à sa date due (puis ça baisse). */
    retentionALaDateDue: 0.9,
    /** Réponses minimum à un niveau de confiance avant d'oser une phrase sur ta calibration. */
    reponsesMinimumCalibration: 10,
    /** Taille de la liste rouge. */
    tailleListeRouge: 10,
  },

  /** Réglages utilisateur : valeurs par défaut et bornes. */
  reglages: {
    taillesTexte: [17, 19, 21, 24],
    tailleTexteParDefaut: 17,
    quotaNouvellesMin: 1,
    quotaNouvellesMax: 60,
  },

  /**
   * Fuseau horaire qui définit « aujourd'hui » (dates dues, série de jours).
   * Le serveur peut tourner ailleurs (Vercel = UTC) : on fixe le fuseau de l'utilisateur.
   */
  fuseauHoraire: "Europe/Paris",
} as const;
