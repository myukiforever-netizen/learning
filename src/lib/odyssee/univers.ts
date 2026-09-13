// L'univers : un secteur (matière) → des galaxies (modules) → des planètes (concepts).
// Calcule le statut de chaque planète et galaxie à partir de la progression.
// Logique pure, testée dans tests/univers.test.ts.

export type EtapePlanete = "locked" | "available" | "discovered" | "understood" | "trained" | "validated";

export const ORDRE_ETAPES: readonly EtapePlanete[] = ["locked", "available", "discovered", "understood", "trained", "validated"];

/** Ligne de `planet_progress`. */
export interface ProgressionPlanete {
  concept_id: string;
  stage: Exclude<EtapePlanete, "locked">;
  best_score: number;
  attempts: number;
  probe_passed: boolean;
  validated_at: string | null;
}

/** Ligne de `galaxy_progress`. */
export interface ProgressionGalaxie {
  module_id: string;
  sun_score: number;
  attempts: number;
  passed_at: string | null;
  jumped: boolean;
}

/** La structure brute d'un secteur (ids déjà préfixés, comme en base). */
export interface StructureSecteur {
  id: string;
  nom: string;
  galaxies: { id: string; nom: string; planetes: { id: string; nom: string; nbCartes: number; decouverte?: unknown[] | null }[] }[];
}

export interface Planete {
  id: string;
  nom: string;
  index: number;
  nbCartes: number;
  etape: EtapePlanete;
  meilleurScore: number;
  tentatives: number;
  sondePassee: boolean;
  /** Écrans de découverte (JSON brut, validé à l'import) ; null = fiches provisoires. */
  decouverte: unknown[] | null;
}

export type StatutGalaxie = "verrouillee" | "ouverte" | "franchie";

export interface Galaxie {
  id: string;
  nom: string;
  index: number;
  statut: StatutGalaxie;
  /** Toutes les planètes validées : le soleil peut être tenté. */
  soleilAccessible: boolean;
  scoreSoleil: number;
  planetes: Planete[];
}

export interface Secteur {
  id: string;
  nom: string;
  galaxies: Galaxie[];
}

export function etapeAuMoins(etape: EtapePlanete, minimum: EtapePlanete): boolean {
  return ORDRE_ETAPES.indexOf(etape) >= ORDRE_ETAPES.indexOf(minimum);
}

/**
 * Règles de déblocage (« guidé avec passages ») :
 * - galaxie 1 ouverte ; galaxie N ouverte si la N-1 est franchie (soleil) ou si un saut hyperspatial a été fait ;
 * - dans une galaxie ouverte : planète 1 disponible ; planète N disponible si la N-1 est validée ;
 * - une planète garde son étape enregistrée si elle est disponible ; sinon elle est verrouillée ;
 * - le soleil est accessible quand toutes les planètes sont validées.
 */
export function construireSecteur(
  structure: StructureSecteur,
  progressionPlanetes: ProgressionPlanete[],
  progressionGalaxies: ProgressionGalaxie[],
): Secteur {
  const progP = new Map(progressionPlanetes.map((p) => [p.concept_id, p]));
  const progG = new Map(progressionGalaxies.map((g) => [g.module_id, g]));

  let precedenteFranchie = true; // la galaxie 1 est toujours ouverte
  const galaxies: Galaxie[] = structure.galaxies.map((g, index) => {
    const pg = progG.get(g.id);
    const franchie = Boolean(pg?.passed_at);
    const ouverte = precedenteFranchie || Boolean(pg?.jumped);
    precedenteFranchie = franchie;

    let precedenteValidee = true; // la planète 1 d'une galaxie ouverte est disponible
    const planetes: Planete[] = g.planetes.map((p, i) => {
      const pp = progP.get(p.id);
      const disponible = ouverte && precedenteValidee;
      const etape: EtapePlanete = disponible ? (pp?.stage ?? "available") : "locked";
      precedenteValidee = etape === "validated";
      return {
        id: p.id,
        nom: p.nom,
        index: i,
        nbCartes: p.nbCartes,
        etape,
        meilleurScore: pp?.best_score ?? 0,
        tentatives: pp?.attempts ?? 0,
        sondePassee: pp?.probe_passed ?? false,
        decouverte: p.decouverte ?? null,
      };
    });

    const toutesValidees = planetes.length > 0 && planetes.every((p) => p.etape === "validated");
    return {
      id: g.id,
      nom: g.nom,
      index,
      statut: franchie ? "franchie" : ouverte ? "ouverte" : "verrouillee",
      soleilAccessible: ouverte && toutesValidees,
      scoreSoleil: pg?.sun_score ?? 0,
      planetes,
    };
  });

  return { id: structure.id, nom: structure.nom, galaxies };
}

export type Destination =
  | { type: "planete"; galaxie: Galaxie; planete: Planete }
  | { type: "soleil"; galaxie: Galaxie }
  | { type: "termine" };

/** Où aller maintenant : la première planète non validée accessible, sinon un soleil accessible. */
export function prochaineDestination(secteur: Secteur): Destination {
  for (const galaxie of secteur.galaxies) {
    if (galaxie.statut === "verrouillee") continue;
    const planete = galaxie.planetes.find((p) => p.etape !== "locked" && p.etape !== "validated");
    if (planete) return { type: "planete", galaxie, planete };
    if (galaxie.soleilAccessible && galaxie.statut !== "franchie") return { type: "soleil", galaxie };
  }
  return { type: "termine" };
}

/** Résumé chiffré d'un secteur (pour le HUD). */
export function resumeSecteur(secteur: Secteur): { planetesValidees: number; planetesTotal: number; galaxiesFranchies: number } {
  const planetes = secteur.galaxies.flatMap((g) => g.planetes);
  return {
    planetesValidees: planetes.filter((p) => p.etape === "validated").length,
    planetesTotal: planetes.length,
    galaxiesFranchies: secteur.galaxies.filter((g) => g.statut === "franchie").length,
  };
}

/** L'étape suivante d'une planète après une phase terminée (jamais en arrière). */
export function etapeApresPhase(etape: EtapePlanete, phase: "decouverte" | "comprehension" | "entrainement" | "mission", missionReussie = false): EtapePlanete {
  const cible: EtapePlanete =
    phase === "decouverte" ? "discovered" : phase === "comprehension" ? "understood" : phase === "entrainement" ? "trained" : missionReussie ? "validated" : "trained";
  return etapeAuMoins(etape, cible) ? etape : cible;
}
