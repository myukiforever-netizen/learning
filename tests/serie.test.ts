import { describe, expect, it } from "vitest";
import { calculerSerie } from "@/lib/revision/serie";

describe("calculerSerie", () => {
  it("compte les jours consécutifs jusqu'à aujourd'hui", () => {
    expect(calculerSerie(["2026-09-10", "2026-09-11", "2026-09-12"], "2026-09-12")).toBe(3);
  });

  it("garde la série vivante si la dernière session date d'hier", () => {
    expect(calculerSerie(["2026-09-10", "2026-09-11"], "2026-09-12")).toBe(2);
  });

  it("retombe à zéro après un jour sauté, ignore les doublons", () => {
    expect(calculerSerie(["2026-09-09", "2026-09-09", "2026-09-10"], "2026-09-12")).toBe(0);
    expect(calculerSerie([], "2026-09-12")).toBe(0);
  });
});
