import { describe, expect, it } from "vitest";
import {
  lireTrous,
  memeTexte,
  normaliser,
  phraseComplete,
  verifierClassement,
  verifierOrdre,
  verifierTrous,
} from "@/lib/cartes/verifier";
import type { Carte } from "@/lib/types";

describe("normaliser / memeTexte", () => {
  it("ignore casse, accents, ponctuation et espaces", () => {
    expect(normaliser("  Ébbinghaus, 1885 !  ")).toBe("ebbinghaus 1885");
    expect(memeTexte("l'effet de test", "L’EFFET DE TEST.")).toBe(true);
    expect(memeTexte("Ebbinghaus", "Ebbinghouse")).toBe(false);
  });
});

describe("texte à trous", () => {
  const question = "[[Ebbinghaus]] a décrit la courbe de l'oubli en [[1885|mille huit cent quatre-vingt-cinq]].";

  it("lit les trous et les réponses acceptées", () => {
    const { segments, reponses } = lireTrous(question);
    expect(segments).toEqual(["", " a décrit la courbe de l'oubli en ", "."]);
    expect(reponses).toEqual([["Ebbinghaus"], ["1885", "mille huit cent quatre-vingt-cinq"]]);
    expect(phraseComplete(question)).toBe("Ebbinghaus a décrit la courbe de l'oubli en 1885.");
  });

  it("vérifie chaque trou avec tolérance", () => {
    expect(verifierTrous(question, ["ebbinghaus", "1885"])).toEqual([true, true]);
    expect(verifierTrous(question, ["Ebbinghaus", "Mille huit cent quatre-vingt-cinq"])).toEqual([true, true]);
    expect(verifierTrous(question, ["Pavlov", ""])).toEqual([false, false]);
  });
});

describe("classer / ordonner", () => {
  const base = { id: "x", concept_id: "c", concept_nom: "C", question: "?", answer: "!", explanation: "", retention_goal: "1y" as const };

  it("vérifie un classement élément par élément", () => {
    const carte: Carte = {
      ...base,
      type: "sort",
      data: {
        mode: "classer",
        categories: ["Robuste", "Effondré"],
        items: [
          { text: "Options par défaut", category: "Robuste" },
          { text: "Ego depletion", category: "Effondré" },
        ],
      },
    };
    expect(verifierClassement(carte, ["Robuste", "Robuste"])).toEqual([true, false]);
    expect(verifierClassement(carte, [null, "Effondré"])).toEqual([false, true]);
  });

  it("vérifie un ordre position par position", () => {
    const carte: Carte = { ...base, type: "sort", data: { mode: "ordonner", items: ["Hypothèse", "Test", "Décision"] } };
    expect(verifierOrdre(carte, [0, 1, 2])).toEqual([true, true, true]);
    expect(verifierOrdre(carte, [1, 0, 2])).toEqual([false, false, true]);
  });
});
