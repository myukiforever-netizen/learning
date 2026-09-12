// Fusion d'une nouvelle version de matière avec ce qui existe déjà en base.
// Logique pure : on compare, on ne touche à rien. requetes.ts applique le résultat.
import { aplatirMatiere, type MatiereJson } from "./schema";
import type { Carte } from "@/lib/types";

/** Une carte telle qu'elle existe en base (id déjà préfixé par la matière). */
export interface CarteExistante extends Carte {
  status: "active" | "archived";
}

export interface ResultatFusion {
  /** Jamais vues : insérées, entrent dans le planning comme nouveautés. */
  nouvelles: Carte[];
  /** Même id, contenu différent (ou carte archivée qui revient) : texte mis à jour, historique conservé. */
  modifiees: Carte[];
  /** Même id, même contenu : rien à faire. */
  inchangees: Carte[];
  /** Présentes en base, absentes du fichier : archivées, jamais effacées. */
  archivees: string[];
}

const CHAMPS_COMPARES = [
  "concept_id",
  "concept_nom",
  "type",
  "question",
  "answer",
  "explanation",
  "explanation_more",
  "options",
  "options_why",
  "retention_goal",
  "data",
] as const;

function memeContenu(a: Carte, b: Carte): boolean {
  return CHAMPS_COMPARES.every((champ) => JSON.stringify(a[champ] ?? null) === JSON.stringify(b[champ] ?? null));
}

export function calculerFusion(existantes: CarteExistante[], nouvelle: MatiereJson): ResultatFusion {
  const cartesFichier = aplatirMatiere(nouvelle);
  const parId = new Map(existantes.map((c) => [c.id, c]));
  const idsFichier = new Set(cartesFichier.map((c) => c.id));

  const resultat: ResultatFusion = { nouvelles: [], modifiees: [], inchangees: [], archivees: [] };

  for (const carte of cartesFichier) {
    const avant = parId.get(carte.id);
    if (!avant) resultat.nouvelles.push(carte);
    else if (avant.status === "archived" || !memeContenu(avant, carte)) resultat.modifiees.push(carte);
    else resultat.inchangees.push(carte);
  }

  for (const avant of existantes) {
    if (avant.status === "active" && !idsFichier.has(avant.id)) resultat.archivees.push(avant.id);
  }

  return resultat;
}
