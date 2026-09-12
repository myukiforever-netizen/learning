import { describe, expect, it } from "vitest";
import {
  nombreDeCartesPourDuree,
  ordonnerSansRepetition,
  reinsererCarteRatee,
} from "@/lib/revision/composer";
import { CONFIG_REVISION } from "@/lib/revision/config";

interface CarteMinimale {
  id: string;
  concept_id: string;
}

function carte(id: string, concept: string): CarteMinimale {
  return { id, concept_id: concept };
}

function aDeuxConceptsConsecutifs(cartes: CarteMinimale[]): boolean {
  return cartes.some((c, i) => i > 0 && cartes[i - 1].concept_id === c.concept_id);
}

describe("ordonnerSansRepetition", () => {
  it("ne met jamais deux cartes du même concept à la suite quand c'est possible", () => {
    const entree = [
      carte("a1", "A"),
      carte("a2", "A"),
      carte("b1", "B"),
      carte("b2", "B"),
      carte("c1", "C"),
    ];
    const sortie = ordonnerSansRepetition(entree);

    expect(sortie).toHaveLength(entree.length);
    expect(sortie.map((c) => c.id).sort()).toEqual(entree.map((c) => c.id).sort());
    expect(aDeuxConceptsConsecutifs(sortie)).toBe(false);
  });

  it("accepte la répétition seulement quand il ne reste que des cartes du même concept", () => {
    const sortie = ordonnerSansRepetition([carte("a1", "A"), carte("a2", "A"), carte("a3", "A")]);
    expect(sortie.map((c) => c.id)).toEqual(["a1", "a2", "a3"]);
  });
});

describe("reinsererCarteRatee", () => {
  const file = Array.from({ length: 20 }, (_, i) => carte(`c${i}`, `concept${i}`));
  const { min, max } = CONFIG_REVISION.retourCarteRatee;

  it("fait revenir la carte entre 5 et 10 cartes plus loin", () => {
    const ratee = carte("ratee", "conceptX");

    const avecMin = reinsererCarteRatee(file, 3, ratee, () => 0);
    const avecMax = reinsererCarteRatee(file, 3, ratee, () => 0.999);

    // nombre de cartes intercalées entre la carte courante (index 3) et le retour
    const entreMin = avecMin.findIndex((c) => c.id === "ratee") - 3 - 1;
    const entreMax = avecMax.findIndex((c) => c.id === "ratee") - 3 - 1;

    expect(entreMin).toBe(min);
    expect(entreMax).toBe(max);
    expect(avecMin).toHaveLength(file.length + 1);
  });

  it("va en fin de file quand il ne reste pas assez de cartes", () => {
    const ratee = carte("ratee", "conceptX");
    const resultat = reinsererCarteRatee(file, 17, ratee, () => 0.999);
    expect(resultat[resultat.length - 1].id).toBe("ratee");
    expect(resultat).toHaveLength(file.length + 1);
  });

  it("évite de coller la carte à une carte du même concept", () => {
    const fileAvecDoublon = file.map((c, i) => (i === 9 ? carte("c9", "conceptX") : c));
    const ratee = carte("ratee", "conceptX");
    const resultat = reinsererCarteRatee(fileAvecDoublon, 3, ratee, () => 0); // viserait l'index 9
    expect(aDeuxConceptsConsecutifs(resultat)).toBe(false);
  });
});

describe("nombreDeCartesPourDuree", () => {
  it("convertit la durée en cartes en réservant le temps de fin de session", () => {
    // 10 min = 600 s - 180 s de fin = 420 s / 30 s par carte = 14 cartes
    expect(nombreDeCartesPourDuree(10)).toBe(14);
    expect(nombreDeCartesPourDuree(20)).toBe(34);
  });
});

// ---------------------------------------------------------------------------
// Jalon 2 : composition complète
// ---------------------------------------------------------------------------
import { composerSession, trierDues } from "@/lib/revision/composer";
import type { Carte, CarteAReviser, EtatRevision } from "@/lib/types";

function carteComplete(id: string, concept: string): Carte {
  return {
    id,
    concept_id: concept,
    concept_nom: concept,
    type: "flash",
    question: "?",
    answer: "!",
    explanation: "",
    retention_goal: "1y",
  };
}

function due(id: string, concept: string, due_date: string, ease: EtatRevision["ease_state"] = "ok"): CarteAReviser {
  return { carte: carteComplete(id, concept), revision: { step: 1, interval_days: 2, due_date, ease_state: ease } };
}

function nouvelle(id: string, concept: string): CarteAReviser {
  return { carte: carteComplete(id, concept), revision: null };
}

describe("trierDues", () => {
  it("met les boîtes ⚠️ en premier, puis les plus en retard", () => {
    const ordre = trierDues([
      due("a", "A", "2026-09-10"),
      due("b", "B", "2026-09-01"),
      due("c", "C", "2026-09-11", "thought_knew"),
    ]).map((c) => c.carte.id);
    expect(ordre).toEqual(["c", "b", "a"]);
  });
});

describe("composerSession", () => {
  it("place les dues avant les nouvelles et respecte le quota du jour", () => {
    const dues = [due("d1", "A", "2026-09-01"), due("d2", "B", "2026-09-02")];
    const nouvelles = Array.from({ length: 30 }, (_, i) => nouvelle(`n${i}`, `N${i}`));
    const file = composerSession({ dues, nouvelles, minutes: 60, nouvellesDejaAujourdhui: 10 });

    const ids = file.map((c) => c.carte.id);
    expect(ids.slice(0, 2)).toEqual(["d1", "d2"]);
    // quota 15 − 10 déjà vues = 5 nouvelles au maximum
    expect(file.filter((c) => c.revision === null)).toHaveLength(CONFIG_REVISION.nouvellesParJour - 10);
  });

  it("coupe la file à la capacité de la durée choisie", () => {
    const dues = Array.from({ length: 40 }, (_, i) => due(`d${i}`, `C${i}`, "2026-09-01"));
    const file = composerSession({ dues, nouvelles: [], minutes: 10, nouvellesDejaAujourdhui: 0 });
    expect(file).toHaveLength(nombreDeCartesPourDuree(10));
  });

  it("ne met jamais deux cartes du même concept à la suite quand un mélange est possible", () => {
    const dues = [
      ...Array.from({ length: 6 }, (_, i) => due(`a${i}`, "A", "2026-09-01")),
      ...Array.from({ length: 6 }, (_, i) => due(`b${i}`, "B", "2026-09-05")),
    ];
    const file = composerSession({ dues, nouvelles: [], minutes: 60, nouvellesDejaAujourdhui: 0 });
    expect(file).toHaveLength(12);
    const repetitions = file.filter((c, i) => i > 0 && file[i - 1].carte.concept_id === c.carte.concept_id);
    expect(repetitions).toHaveLength(0);
  });
});
