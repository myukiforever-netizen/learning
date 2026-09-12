// Composition d'une session : logique pure, sans React ni base de données.
// Jalon 1 : ordre sans répétition de concept + retour des cartes ratées.
// Jalon 2 : ajout des cartes dues / nouvelles avec quota.

import { CONFIG_REVISION } from "./config";

interface AvecConcept {
  concept_id: string;
}

/**
 * Réordonne une liste pour ne jamais avoir deux cartes du même concept à la suite,
 * en gardant l'ordre initial autant que possible. Si c'est impossible
 * (ex. il ne reste que des cartes du même concept), on accepte la répétition.
 */
export function ordonnerSansRepetition<T extends AvecConcept>(cartes: T[]): T[] {
  const restantes = [...cartes];
  const resultat: T[] = [];

  while (restantes.length > 0) {
    const derniere = resultat[resultat.length - 1];
    let index = restantes.findIndex(
      (carte) => !derniere || carte.concept_id !== derniere.concept_id,
    );
    if (index === -1) index = 0;
    resultat.push(restantes.splice(index, 1)[0]);
  }

  return resultat;
}

/**
 * Réinsère une carte ratée plus loin dans la file : entre `min` et `max` cartes
 * après la position courante (config). Si la file est trop courte, la carte va
 * à la fin. On évite aussi de la coller à une carte du même concept.
 *
 * @param file          La file complète de la session.
 * @param indexCourant  Index de la carte qui vient d'être ratée.
 * @param carte         La carte à faire revenir.
 * @param alea          Générateur de nombre entre 0 et 1 (remplaçable pour les tests).
 */
export function reinsererCarteRatee<T extends AvecConcept>(
  file: T[],
  indexCourant: number,
  carte: T,
  alea: () => number = Math.random,
): T[] {
  const { min, max } = CONFIG_REVISION.retourCarteRatee;
  const nombreEntre = min + Math.floor(alea() * (max - min + 1));

  // position = indexCourant + 1 (carte suivante) + nombreEntre cartes intercalées
  let position = Math.min(indexCourant + 1 + nombreEntre, file.length);

  const precedente = file[position - 1];
  const suivante = file[position];
  if (precedente && precedente.concept_id === carte.concept_id && position < file.length) {
    position += 1;
  } else if (suivante && suivante.concept_id === carte.concept_id && position > indexCourant + 2) {
    position -= 1;
  }

  const nouvelleFile = [...file];
  nouvelleFile.splice(position, 0, carte);
  return nouvelleFile;
}

/** Combien de cartes tiennent dans une session d'une durée donnée (en minutes). */
export function nombreDeCartesPourDuree(minutes: number): number {
  const secondesDisponibles = minutes * 60 - CONFIG_REVISION.secondesFinDeSession;
  return Math.max(1, Math.floor(secondesDisponibles / CONFIG_REVISION.secondesParCarte));
}

// ---------------------------------------------------------------------------
// Jalon 2 : composition complète d'une session à partir des cartes de la base.
// ---------------------------------------------------------------------------

import type { CarteAReviser } from "@/lib/types";

export interface ParametresComposition {
  /** Cartes déjà vues dont la date due est passée ou aujourd'hui. */
  dues: CarteAReviser[];
  /** Cartes jamais vues (pas de ligne `reviews`), dans l'ordre du contenu. */
  nouvelles: CarteAReviser[];
  /** Durée choisie à l'accueil, en minutes. */
  minutes: number;
  /** Nouvelles cartes déjà introduites aujourd'hui (pour respecter le quota). */
  nouvellesDejaAujourdhui: number;
  /** Quota de nouvelles cartes par jour (réglable ; défaut dans config). */
  quotaNouvelles?: number;
}

/** Ordre de priorité des cartes dues : boîte ⚠️ d'abord, puis les plus en retard. */
export function trierDues(dues: CarteAReviser[]): CarteAReviser[] {
  return [...dues].sort((a, b) => {
    const pa = a.revision?.ease_state === "thought_knew" ? 0 : 1;
    const pb = b.revision?.ease_state === "thought_knew" ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return (a.revision?.due_date ?? "").localeCompare(b.revision?.due_date ?? "");
  });
}

/** Combien de nouvelles cartes on peut encore introduire aujourd'hui. */
export function nouvellesDisponibles(
  nouvellesTotal: number,
  nouvellesDejaAujourdhui: number,
  quota: number = CONFIG_REVISION.nouvellesParJour,
): number {
  return Math.max(0, Math.min(nouvellesTotal, quota - nouvellesDejaAujourdhui));
}

/**
 * Compose la file d'une session :
 * 1. les cartes dues (⚠️ puis les plus en retard), 2. les nouvelles (dans la limite
 * du quota du jour), 3. le tout sans deux cartes du même concept à la suite,
 * 4. coupé à la capacité de la durée choisie.
 */
export function composerSession(p: ParametresComposition): CarteAReviser[] {
  const capacite = nombreDeCartesPourDuree(p.minutes);
  const quota = p.quotaNouvelles ?? CONFIG_REVISION.nouvellesParJour;

  const dues = trierDues(p.dues).slice(0, capacite);
  const placesRestantes = Math.max(0, capacite - dues.length);
  const nombreNouvelles = Math.min(
    placesRestantes,
    nouvellesDisponibles(p.nouvelles.length, p.nouvellesDejaAujourdhui, quota),
  );
  const nouvelles = p.nouvelles.slice(0, nombreNouvelles);

  return ordonnerSansRepetition(
    [...dues, ...nouvelles].map((item) => ({ ...item, concept_id: item.carte.concept_id })),
  ).map(({ carte, revision }) => ({ carte, revision }));
}
