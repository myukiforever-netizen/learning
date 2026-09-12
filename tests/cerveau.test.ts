import { describe, expect, it } from "vitest";
import {
  calibrationConfiance,
  messageCalibration,
  pourcentageMatiere,
  ratioProduction,
  retentionCarte,
  topRatees,
  type ReponseStats,
} from "@/lib/stats/cerveau";
import { CONFIG_REVISION } from "@/lib/revision/config";
import type { Carte, EtatRevision } from "@/lib/types";

const JOUR = "2026-09-12";

function carte(id: string, type: Carte["type"] = "flash"): Carte {
  return { id, concept_id: "c", concept_nom: "C", type, question: `Q ${id}`, answer: "R", explanation: "", retention_goal: "1y" };
}

describe("retentionCarte", () => {
  it("vaut 0 pour une carte jamais vue, ratée ou ⚠️", () => {
    expect(retentionCarte(null, JOUR)).toBe(0);
    expect(retentionCarte({ step: 1, interval_days: 2, due_date: JOUR, ease_state: "failed" }, JOUR)).toBe(0);
    expect(retentionCarte({ step: 0, interval_days: 2, due_date: JOUR, ease_state: "thought_knew" }, JOUR)).toBe(0);
  });

  it("vaut 100 % juste après la révision, retentionALaDateDue à la date due, et baisse ensuite", () => {
    const rev: EtatRevision = { step: 2, interval_days: 10, due_date: "2026-09-22", ease_state: "ok" }; // revue aujourd'hui
    expect(retentionCarte(rev, JOUR)).toBeCloseTo(1, 5);
    expect(retentionCarte(rev, "2026-09-22")).toBeCloseTo(CONFIG_REVISION.memoire.retentionALaDateDue, 5);
    expect(retentionCarte(rev, "2026-10-02")).toBeLessThan(CONFIG_REVISION.memoire.retentionALaDateDue);
  });

  it("moyenne par matière, les cartes nouvelles comptant pour 0", () => {
    const ok: EtatRevision = { step: 2, interval_days: 10, due_date: "2026-09-22", ease_state: "ok" };
    const { pourcentage, cartesVues } = pourcentageMatiere([{ revision: ok }, { revision: null }], JOUR);
    expect(pourcentage).toBe(50);
    expect(cartesVues).toBe(1);
  });
});

describe("calibrationConfiance", () => {
  const reponses: ReponseStats[] = [
    { card_id: "a", correct: true, confidence: 3, error_box: null },
    { card_id: "b", correct: false, confidence: 3, error_box: "thought_knew" },
    { card_id: "c", correct: true, confidence: 1, error_box: null },
  ];

  it("compte par niveau de confiance", () => {
    const cal = calibrationConfiance(reponses);
    expect(cal.find((c) => c.confiance === 3)).toMatchObject({ total: 2, correctes: 1, taux: 50 });
    expect(cal.find((c) => c.confiance === 2)).toMatchObject({ total: 0, taux: null });
  });

  it("ne conclut rien sans assez de réponses", () => {
    expect(messageCalibration(calibrationConfiance(reponses))).toBeNull();
    const beaucoup = Array.from({ length: 20 }, (_, i) => ({ card_id: `x${i}`, correct: i % 2 === 0, confidence: 3 as const, error_box: null }));
    expect(messageCalibration(calibrationConfiance(beaucoup))).toContain("Méfie-toi");
  });
});

describe("topRatees et ratioProduction", () => {
  const cartes = [carte("a"), carte("b"), carte("c", "worked_example")];
  const reponses: ReponseStats[] = [
    { card_id: "a", correct: false, confidence: 2, error_box: "not_retrieved" },
    { card_id: "a", correct: false, confidence: 2, error_box: null },
    { card_id: "b", correct: false, confidence: 3, error_box: "thought_knew" },
    { card_id: "b", correct: true, confidence: 3, error_box: null },
    { card_id: "c", correct: true, confidence: 2, error_box: null },
  ];

  it("met les ⚠️ en premier, puis les plus ratées, et ignore les cartes jamais ratées", () => {
    const top = topRatees(reponses, cartes);
    expect(top.map((t) => t.carte.id)).toEqual(["b", "a"]);
    expect(top[0]).toMatchObject({ alertes: 1, rates: 1, total: 2 });
  });

  it("estime la part de production par nombre de cartes", () => {
    expect(ratioProduction(reponses, cartes)).toEqual({ production: 80, total: 5 });
    expect(ratioProduction([], cartes)).toEqual({ production: 0, total: 0 });
  });
});
