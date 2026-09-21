import { describe, expect, it } from "vitest";
import { messageNomPris, normaliserNom, profilAuMemeNom, type Profil } from "@/lib/profils-types";

const profils: Profil[] = [
  { id: "a", nom: "Ilyes", avatar: "🔭", teinte: 60 },
  { id: "b", nom: "selmen", avatar: "👨‍🚀", teinte: 240 },
  { id: "c", nom: "Rayan", avatar: "🚀", teinte: 0 },
];

describe("normaliserNom", () => {
  it("ignore majuscules, accents et espaces en trop", () => {
    expect(normaliserNom("  Sélmen  ")).toBe("selmen");
    expect(normaliserNom("SELMEN")).toBe("selmen");
    expect(normaliserNom("Jean   Pierre")).toBe("jean pierre");
    expect(normaliserNom("Élodie")).toBe(normaliserNom("elodie"));
  });

  it("garde les différences qui comptent", () => {
    expect(normaliserNom("selmen")).not.toBe(normaliserNom("selma"));
    expect(normaliserNom("Jean-Pierre")).not.toBe(normaliserNom("Jean Pierre"));
  });
});

describe("profilAuMemeNom", () => {
  it("trouve un doublon quelle que soit l'écriture", () => {
    expect(profilAuMemeNom("selmen", profils)?.id).toBe("b");
    expect(profilAuMemeNom("  SÉLMEN ", profils)?.id).toBe("b");
    expect(profilAuMemeNom("ilyes", profils)?.id).toBe("a");
  });

  it("laisse passer un nom nouveau, et un nom vide (géré ailleurs)", () => {
    expect(profilAuMemeNom("Nadia", profils)).toBeNull();
    expect(profilAuMemeNom("   ", profils)).toBeNull();
  });

  it("un profil qu'on renomme peut garder son propre nom, pas prendre celui d'un autre", () => {
    expect(profilAuMemeNom("Selmen", profils, "b")).toBeNull();
    expect(profilAuMemeNom("Rayan", profils, "b")?.id).toBe("c");
  });

  it("le message cite le nom existant tel qu'il est écrit", () => {
    expect(messageNomPris("selmen")).toContain("« selmen »");
  });
});
