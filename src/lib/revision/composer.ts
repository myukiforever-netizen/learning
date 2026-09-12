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
