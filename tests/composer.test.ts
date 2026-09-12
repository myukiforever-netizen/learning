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
