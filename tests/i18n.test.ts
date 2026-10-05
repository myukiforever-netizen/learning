import { describe, expect, it } from "vitest";
import { estMatiereTraduite, lireLangueDepuis } from "@/lib/langue-types";
import { idLocal, indexer, traduireCarte, type TraductionModule } from "@/lib/i18n/traduire";
import { traduireCartes } from "@/lib/i18n/charger";
import type { Carte } from "@/lib/types";

const carte: Carte = {
  id: "cissp/d1-x-1",
  concept_id: "cissp/d1-x",
  concept_nom: "La confidentialité",
  type: "sort",
  question: "Dans quelle boîte ?",
  answer: "Confidentialité : le mail.",
  explanation: "Pose-toi la question.",
  explanation_more: "Source : manuel.",
  options: null,
  options_why: null,
  retention_goal: "1y",
  data: { mode: "classer", categories: ["Confidentialité", "Intégrité"], items: [{ text: "Un mail", category: "Confidentialité" }] },
  phase: null,
  niveau: null,
};

const modules: TraductionModule[] = [
  {
    id: "d1-m01",
    name: "D1.1 Ethics",
    concepts: [
      {
        id: "d1-x",
        name: "Confidentiality",
        cards: [
          {
            id: "d1-x-1",
            question: "Which box?",
            answer: "Confidentiality: the email.",
            explanation: "Ask yourself.",
            data: { mode: "classer", categories: ["Confidentiality", "Integrity"], items: [{ text: "An email", category: "Confidentiality" }] },
          },
        ],
      },
    ],
  },
];

describe("langue", () => {
  it("lit la langue du cookie, français par défaut", () => {
    expect(lireLangueDepuis("en")).toBe("en");
    expect(lireLangueDepuis("fr")).toBe("fr");
    expect(lireLangueDepuis(undefined)).toBe("fr");
    expect(lireLangueDepuis("de")).toBe("fr");
  });

  it("ne propose la traduction que pour le CISSP", () => {
    expect(estMatiereTraduite("cissp")).toBe(true);
    expect(estMatiereTraduite("psychologie")).toBe(false);
    expect(estMatiereTraduite(undefined)).toBe(false);
  });
});

describe("traduireCarte", () => {
  const index = indexer(modules, "CISSP: cybersecurity for beginners");

  it("enlève le préfixe de la matière", () => {
    expect(idLocal("cissp", "cissp/d1-x-1")).toBe("d1-x-1");
    expect(idLocal("cissp", "autre/d1-x-1")).toBe("autre/d1-x-1");
  });

  it("remplace les textes, le nom de la planète et les catégories, sans toucher au reste", () => {
    const en = traduireCarte(carte, "cissp", index);
    expect(en.question).toBe("Which box?");
    expect(en.answer).toBe("Confidentiality: the email.");
    expect(en.concept_nom).toBe("Confidentiality");
    expect(en.data?.categories).toEqual(["Confidentiality", "Integrity"]);
    expect(en.id).toBe(carte.id);
    expect(en.type).toBe("sort");
    expect(en.retention_goal).toBe("1y");
  });

  it("garde le texte français quand le français a un champ que l'anglais n'a pas", () => {
    expect(traduireCarte(carte, "cissp", index).explanation_more).toBe("Source : manuel.");
  });

  it("laisse la carte telle quelle si elle n'a pas de traduction", () => {
    const autre: Carte = { ...carte, id: "cissp/d1-inconnue-1", concept_id: "cissp/d1-inconnue" };
    expect(traduireCarte(autre, "cissp", index)).toBe(autre);
  });

  it("garde l'ancienne data si la traduction n'en a pas", () => {
    const sansData = indexer([{ ...modules[0], concepts: [{ ...modules[0].concepts[0], cards: [{ ...modules[0].concepts[0].cards[0], data: undefined }] }] }]);
    expect(traduireCarte(carte, "cissp", sansData).data).toEqual(carte.data);
  });
});

describe("traduireCartes", () => {
  it("ne change rien en français", async () => {
    const liste = [{ carte, matiere: { id: "cissp" } }];
    expect(await traduireCartes(liste, "fr")).toBe(liste);
  });

  it("ne traduit pas une matière sans traduction, même en anglais", async () => {
    const liste = [{ carte, matiere: { id: "psychologie" } }];
    const res = await traduireCartes(liste, "en");
    expect(res[0].carte).toBe(carte);
  });
});
