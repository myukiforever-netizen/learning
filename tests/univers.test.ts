import { describe, expect, it } from "vitest";
import {
  construireSecteur,
  etapeApresPhase,
  prochaineDestination,
  resumeSecteur,
  type ProgressionGalaxie,
  type ProgressionPlanete,
  type StructureSecteur,
} from "@/lib/odyssee/univers";
import { etoilesNotion, notionEnDetresse, signauxDetresse } from "@/lib/odyssee/maitrise";
import { carburantApresPatrouille, niveauPourXp, peutSauter, xpMission } from "@/lib/odyssee/recompenses";
import { CONFIG_REVISION } from "@/lib/revision/config";

const structure: StructureSecteur = {
  id: "psy",
  nom: "Psychologie",
  galaxies: [
    { id: "g1", nom: "Galaxie 1", planetes: [{ id: "p1", nom: "P1", nbCartes: 5 }, { id: "p2", nom: "P2", nbCartes: 5 }] },
    { id: "g2", nom: "Galaxie 2", planetes: [{ id: "p3", nom: "P3", nbCartes: 5 }] },
  ],
};

function prog(concept_id: string, stage: ProgressionPlanete["stage"], best_score = 0): ProgressionPlanete {
  return { concept_id, stage, best_score, attempts: 1, probe_passed: false, validated_at: stage === "validated" ? "2026-09-13" : null };
}

describe("construireSecteur : déblocage guidé", () => {
  it("au départ : galaxie 1 ouverte, planète 1 disponible, tout le reste verrouillé", () => {
    const s = construireSecteur(structure, [], []);
    expect(s.galaxies[0].statut).toBe("ouverte");
    expect(s.galaxies[0].planetes.map((p) => p.etape)).toEqual(["available", "locked"]);
    expect(s.galaxies[1].statut).toBe("verrouillee");
    expect(s.galaxies[1].planetes[0].etape).toBe("locked");
    expect(s.galaxies[0].soleilAccessible).toBe(false);
  });

  it("valider une planète ouvre la suivante ; toutes validées → soleil accessible", () => {
    const s = construireSecteur(structure, [prog("p1", "validated", 90)], []);
    expect(s.galaxies[0].planetes.map((p) => p.etape)).toEqual(["validated", "available"]);
    expect(s.galaxies[0].soleilAccessible).toBe(false);

    const s2 = construireSecteur(structure, [prog("p1", "validated", 90), prog("p2", "validated", 80)], []);
    expect(s2.galaxies[0].soleilAccessible).toBe(true);
    expect(s2.galaxies[1].statut).toBe("verrouillee");
  });

  it("franchir le soleil ouvre la galaxie suivante ; un saut hyperspatial aussi", () => {
    const franchie: ProgressionGalaxie = { module_id: "g1", sun_score: 85, attempts: 1, passed_at: "2026-09-13", jumped: false };
    const s = construireSecteur(structure, [prog("p1", "validated"), prog("p2", "validated")], [franchie]);
    expect(s.galaxies[0].statut).toBe("franchie");
    expect(s.galaxies[1].statut).toBe("ouverte");
    expect(s.galaxies[1].planetes[0].etape).toBe("available");

    const saut: ProgressionGalaxie = { module_id: "g2", sun_score: 0, attempts: 0, passed_at: null, jumped: true };
    const s2 = construireSecteur(structure, [], [saut]);
    expect(s2.galaxies[1].statut).toBe("ouverte");
    expect(s2.galaxies[0].statut).toBe("ouverte");
  });

  it("une planète verrouillée le reste même avec une progression enregistrée", () => {
    const s = construireSecteur(structure, [prog("p2", "discovered")], []);
    expect(s.galaxies[0].planetes[1].etape).toBe("locked");
  });
});

describe("prochaineDestination et résumé", () => {
  it("pointe la première planète non validée, puis le soleil, puis « terminé »", () => {
    expect(prochaineDestination(construireSecteur(structure, [], []))).toMatchObject({ type: "planete", planete: { id: "p1" } });
    const toutes = [prog("p1", "validated"), prog("p2", "validated")];
    expect(prochaineDestination(construireSecteur(structure, toutes, []))).toMatchObject({ type: "soleil", galaxie: { id: "g1" } });
    const fin = [...toutes, prog("p3", "validated")];
    const galaxies: ProgressionGalaxie[] = [
      { module_id: "g1", sun_score: 90, attempts: 1, passed_at: "x", jumped: false },
      { module_id: "g2", sun_score: 90, attempts: 1, passed_at: "x", jumped: false },
    ];
    expect(prochaineDestination(construireSecteur(structure, fin, galaxies))).toEqual({ type: "termine" });
    expect(resumeSecteur(construireSecteur(structure, fin, galaxies))).toEqual({ planetesValidees: 3, planetesTotal: 3, galaxiesFranchies: 2 });
  });

  it("étape après une phase : jamais en arrière, mission réussie = validée", () => {
    expect(etapeApresPhase("available", "decouverte")).toBe("discovered");
    expect(etapeApresPhase("trained", "decouverte")).toBe("trained");
    expect(etapeApresPhase("understood", "mission", false)).toBe("trained");
    expect(etapeApresPhase("understood", "mission", true)).toBe("validated");
  });
});

describe("maîtrise et détresse", () => {
  it("étoiles selon l'état de révision", () => {
    expect(etoilesNotion(null)).toBe(0);
    expect(etoilesNotion({ step: 0, interval_days: 0, due_date: "2026-09-13", ease_state: "new" })).toBe(0);
    expect(etoilesNotion({ step: 1, interval_days: 2, due_date: "2026-09-15", ease_state: "ok" })).toBe(2);
    expect(etoilesNotion({ step: 3, interval_days: 30, due_date: "2026-10-13", ease_state: "ok" })).toBe(3);
    expect(etoilesNotion({ step: 1, interval_days: 1, due_date: "2026-09-13", ease_state: "failed" })).toBe(1);
  });

  it("détresse : due, ratée ou ⚠️ ; jamais pour une notion pas encore vue", () => {
    const jour = "2026-09-13";
    expect(notionEnDetresse(null, jour)).toBe(false);
    expect(notionEnDetresse({ step: 1, interval_days: 2, due_date: "2026-09-12", ease_state: "ok" }, jour)).toBe(true);
    expect(notionEnDetresse({ step: 1, interval_days: 2, due_date: "2026-09-20", ease_state: "ok" }, jour)).toBe(false);
    expect(signauxDetresse([null, { step: 0, interval_days: 2, due_date: jour, ease_state: "thought_knew" }], jour)).toBe(1);
  });
});

describe("récompenses", () => {
  it("niveaux : seuils de la config, progression entre 0 et 1", () => {
    expect(niveauPourXp(0)).toMatchObject({ niveau: 1, xpDansNiveau: 0 });
    expect(niveauPourXp(100)).toMatchObject({ niveau: 2, xpDansNiveau: 0 });
    expect(niveauPourXp(175)).toMatchObject({ niveau: 2, xpDansNiveau: 75, xpPourSuivant: 150, progression: 0.5 });
    const max = CONFIG_REVISION.odyssee.niveaux;
    expect(niveauPourXp(max[max.length - 1] + 999)).toMatchObject({ niveau: max.length, xpPourSuivant: null, progression: 1 });
  });

  it("mission : XP seulement si réussie, bonus si parfaite ; carburant borné", () => {
    const { seuilMission, xp, carburant } = CONFIG_REVISION.odyssee;
    expect(xpMission(0.7, seuilMission, false)).toBe(0);
    expect(xpMission(0.8, seuilMission, false)).toBe(xp.missionReussie);
    expect(xpMission(1, seuilMission, true)).toBe(xp.missionReussie + xp.bonusMissionParfaite);
    expect(carburantApresPatrouille(carburant.max - 5)).toBe(carburant.max);
    expect(peutSauter(carburant.coutSaut - 1)).toBe(false);
  });
});
