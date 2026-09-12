import { describe, expect, it } from "vitest";
import { aplatirMatiere, compterCartes, validerMatiere, type MatiereJson } from "@/lib/import/schema";
import { calculerFusion, type CarteExistante } from "@/lib/import/fusionner";
import { MATIERES_LIVREES } from "@/data/matieres";

function matiereValide(): MatiereJson {
  return {
    id: "test",
    name: "Test",
    version: 1,
    modules: [
      {
        id: "m1",
        name: "Module",
        concepts: [
          {
            id: "c1",
            name: "Concept",
            cards: [
              { id: "k1", type: "flash", question: "Q ?", answer: "R", explanation: "Parce que." },
              {
                id: "k2",
                type: "qcm",
                question: "Q ?",
                options: ["A", "B", "C"],
                options_why: ["", "non", "non"],
                answer: "A",
                explanation: "Parce que.",
              },
              { id: "k3", type: "duel", question: "A ou B ?", options: ["A", "B"], answer: "B", explanation: "Parce que." },
            ],
          },
        ],
      },
    ],
  };
}

describe("validerMatiere", () => {
  it("accepte une matière correcte et toutes les matières livrées", () => {
    expect(validerMatiere(matiereValide())).toEqual([]);
    for (const m of MATIERES_LIVREES) expect(validerMatiere(m)).toEqual([]);
  });

  it("signale les problèmes en français : id en double, réponse hors options, type inconnu", () => {
    const m = matiereValide();
    m.modules[0].concepts[0].cards[1].answer = "Z";
    m.modules[0].concepts[0].cards[2].id = "k1";
    (m.modules[0].concepts[0].cards[0] as { type: string }).type = "inconnu";
    const erreurs = validerMatiere(m);
    expect(erreurs.some((e) => e.includes("en double"))).toBe(true);
    expect(erreurs.some((e) => e.includes("« answer »"))).toBe(true);
    expect(erreurs.some((e) => e.includes("inconnu"))).toBe(true);
  });

  it("refuse un fichier qui n'est pas une matière", () => {
    expect(validerMatiere(null).length).toBeGreaterThan(0);
    expect(validerMatiere({ id: "x" }).length).toBeGreaterThan(0);
  });
});

describe("aplatirMatiere", () => {
  it("préfixe les identifiants par la matière et remplit l'objectif par défaut", () => {
    const cartes = aplatirMatiere(matiereValide());
    expect(cartes).toHaveLength(compterCartes(matiereValide()));
    expect(cartes[0].id).toBe("test/k1");
    expect(cartes[0].concept_id).toBe("test/c1");
    expect(cartes[0].concept_nom).toBe("Concept");
    expect(cartes[0].retention_goal).toBe("1y");
  });
});

describe("calculerFusion (réimport d'une v2)", () => {
  it("classe les cartes en nouvelles / modifiées / inchangées / archivées", () => {
    const v1 = aplatirMatiere(matiereValide());
    const existantes: CarteExistante[] = v1.map((c) => ({ ...c, status: "active" }));

    const v2 = matiereValide();
    v2.version = 2;
    v2.modules[0].concepts[0].cards[0].question = "Question corrigée ?"; // k1 modifiée
    v2.modules[0].concepts[0].cards.splice(1, 1); // k2 supprimée → archivée
    v2.modules[0].concepts[0].cards.push({ id: "k4", type: "flash", question: "N ?", answer: "R", explanation: "." });

    const fusion = calculerFusion(existantes, v2);
    expect(fusion.modifiees.map((c) => c.id)).toEqual(["test/k1"]);
    expect(fusion.inchangees.map((c) => c.id)).toEqual(["test/k3"]);
    expect(fusion.nouvelles.map((c) => c.id)).toEqual(["test/k4"]);
    expect(fusion.archivees).toEqual(["test/k2"]);
  });

  it("fait revenir une carte archivée si elle réapparaît dans le fichier", () => {
    const existantes: CarteExistante[] = aplatirMatiere(matiereValide()).map((c) => ({ ...c, status: "archived" }));
    const fusion = calculerFusion(existantes, matiereValide());
    expect(fusion.modifiees).toHaveLength(3);
    expect(fusion.archivees).toEqual([]);
  });
});
