// ============================================================
// TOUTES les valeurs réglables du moteur de révision sont ici.
// Aucune de ces valeurs ne doit être écrite « en dur » ailleurs.
// ============================================================

import type { ObjectifRetention, TypeCarte } from "@/lib/types";

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

  /** Odyssée : parcours, missions, récompenses. */
  odyssee: {
    /** Score minimal (0 à 1) pour valider une mission de planète / franchir un soleil. */
    seuilMission: 0.8,
    seuilSoleil: 0.8,
    /** Nombre de cartes tirées pour une mission / un soleil. */
    cartesMission: { min: 6, max: 10 },
    cartesSoleil: { min: 12, max: 20 },
    /** Sonde : questions avant l'atterrissage, et pour un saut hyperspatial (réussites exigées). */
    sonde: { atterrissage: 3, saut: 5, reussitesSaut: 4 },
    /** Phase par défaut d'une carte selon son type (surchargeable dans le JSON). */
    phaseParType: {
      flash: "entrainement",
      qcm: "comprehension",
      duel: "comprehension",
      cloze: "entrainement",
      why: "entrainement",
      whatif: "entrainement",
      problem: "entrainement",
      worked_example: "comprehension",
      faded_example: "entrainement",
      sort: "comprehension",
    } as Record<TypeCarte, "comprehension" | "entrainement">,
    /** Niveau de difficulté par défaut selon le type : 1 reconnaissance, 2 rappel guidé, 3 production. */
    niveauParType: {
      duel: 1,
      qcm: 1,
      worked_example: 1,
      cloze: 2,
      sort: 2,
      faded_example: 2,
      flash: 3,
      why: 3,
      whatif: 3,
      problem: 3,
    } as Record<TypeCarte, 1 | 2 | 3>,
    /** Points d'expérience par acte d'apprentissage réel. */
    xp: {
      ecranDecouverte: 5,
      comprehensionBonne: 10,
      entrainementBonne: 10,
      bonusFacile: 5,
      missionReussie: 100,
      bonusMissionParfaite: 50,
      soleilFranchi: 300,
      patrouilleCarte: 8,
      journalDeBord: 20,
      serieJour: 15,
      comete: 60,
    },
    /** XP cumulé requis pour atteindre chaque niveau (index 0 = niveau 1). */
    niveaux: [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000, 6500, 8500, 11000, 14000, 18000],
    /** Carburant : gagné en patrouille, dépensé par les sauts hyperspatiaux. */
    carburant: { max: 100, parPatrouille: 25, coutSaut: 50, initial: 50 },
  },

  /**
   * Fuseau horaire qui définit « aujourd'hui » (dates dues, série de jours).
   * Le serveur peut tourner ailleurs (Vercel = UTC) : on fixe le fuseau de l'utilisateur.
   */
  fuseauHoraire: "Europe/Paris",
} as const;
