import { describe, expect, it } from "vitest";
import { composerMission, composerPhase, composerSoleil, melangerAvecGraine, niveauDe, phaseDe, scoreDe } from "@/lib/odyssee/composer";
import { CONFIG_REVISION } from "@/lib/revision/config";
import type { Carte } from "@/lib/types";

function carte(id: string, type: Carte["type"], concept = "c", extra: Partial<Carte> = {}): Carte {
  return { id, concept_id: concept, concept_nom: concept, type, question: "?", answer: "!", explanation: "", retention_goal: "1y", ...extra };
}

const planete = [
  carte("d1", "duel"),
  carte("q1", "qcm"),
  carte("s1", "sort"),
  carte("f1", "flash"),
  carte("f2", "flash"),
  carte("c1", "cloze"),
  carte("w1", "why"),
  carte("p1", "problem"),
];

describe("phase et niveau", () => {
  it("déduits du type, surchargeables par le JSON", () => {
    expect(phaseDe(carte("x", "duel"))).toBe("comprehension");
    expect(phaseDe(carte("x", "flash"))).toBe("entrainement");
    expect(phaseDe(carte("x", "flash", "c", { phase: "comprehension" }))).toBe("comprehension");
    expect(niveauDe(carte("x", "why"))).toBe(3);
    expect(niveauDe(carte("x", "why", "c", { niveau: 1 }))).toBe(1);
  });

  it("composerPhase : cartes de la phase du plus simple au plus exigeant, repli sur l'autre phase", () => {
    expect(composerPhase(planete, "comprehension").map((c) => c.id)).toEqual(["d1", "q1", "s1"]);
    const entrainement = composerPhase(planete, "entrainement");
    expect(entrainement.map(niveauDe)).toEqual([...entrainement.map(niveauDe)].sort());
    expect(composerPhase([carte("f", "flash")], "comprehension").map((c) => c.id)).toEqual(["f"]);
  });
});

describe("mission et soleil", () => {
  it("mission : entre min et max cartes, déterministe pour une graine, mélange des phases", () => {
    const { min, max } = CONFIG_REVISION.odyssee.cartesMission;
    const m = composerMission(planete, "essai-1");
    expect(m.length).toBeGreaterThanOrEqual(min);
    expect(m.length).toBeLessThanOrEqual(max);
    expect(m.map((c) => c.id)).toEqual(composerMission(planete, "essai-1").map((c) => c.id));
    expect(m.some((c) => phaseDe(c) === "comprehension")).toBe(true);
    expect(m.some((c) => phaseDe(c) === "entrainement")).toBe(true);
    expect(new Set(m.map((c) => c.id)).size).toBe(m.length);
  });

  it("soleil : prend dans chaque planète et n'enchaîne jamais deux cartes de la même planète", () => {
    const g = [
      Array.from({ length: 6 }, (_, i) => carte(`a${i}`, "flash", "A")),
      Array.from({ length: 6 }, (_, i) => carte(`b${i}`, "qcm", "B")),
      Array.from({ length: 6 }, (_, i) => carte(`c${i}`, "cloze", "C")),
    ];
    const s = composerSoleil(g, "soleil-1");
    expect(s.length).toBeGreaterThanOrEqual(CONFIG_REVISION.odyssee.cartesSoleil.min);
    expect(s.length).toBeLessThanOrEqual(CONFIG_REVISION.odyssee.cartesSoleil.max);
    for (const concept of ["A", "B", "C"]) expect(s.some((c) => c.concept_id === concept)).toBe(true);
    expect(s.some((c, i) => i > 0 && s[i - 1].concept_id === c.concept_id)).toBe(false);
  });

  it("melangerAvecGraine change l'ordre selon la graine, scoreDe ne compte que la première réponse", () => {
    const liste = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(melangerAvecGraine(liste, "a")).not.toEqual(melangerAvecGraine(liste, "b"));
    expect(melangerAvecGraine(liste, "a")).toEqual(melangerAvecGraine(liste, "a"));
    expect(scoreDe([{ card_id: "x", correct: false }, { card_id: "x", correct: true }, { card_id: "y", correct: true }])).toBe(0.5);
  });
});
