import { describe, expect, it } from "vitest";
import {
  REGLAGES_AUDIO_DEFAUT,
  SONS,
  dureeSon,
  estSilencieux,
  frequenceGalaxie,
  gainSortie,
  lireReglagesAudio,
  type NomSon,
} from "@/lib/audio/sons";

const NOMS = Object.keys(SONS) as NomSon[];

describe("catalogue de sons", () => {
  it("chaque son produit quelque chose d'audible et de court", () => {
    for (const nom of NOMS) {
      const def = SONS[nom];
      const morceaux = def.notes.length + (def.bruits?.length ?? 0);
      expect(morceaux, nom).toBeGreaterThan(0);
      const duree = dureeSon(def);
      expect(duree, nom).toBeGreaterThanOrEqual(0.04);
      // Célébrations comprises : rien ne dépasse deux secondes (règle produit 9).
      expect(duree, nom).toBeLessThanOrEqual(2);
    }
  });

  it("aucun son n'est trop fort ni hors de portée d'oreille", () => {
    for (const nom of NOMS) {
      for (const note of SONS[nom].notes) {
        expect(note.gain, `${nom} gain`).toBeGreaterThan(0);
        expect(note.gain, `${nom} gain`).toBeLessThanOrEqual(0.1);
        expect(note.hz, `${nom} hz`).toBeGreaterThanOrEqual(40);
        expect(note.hz, `${nom} hz`).toBeLessThanOrEqual(4000);
        expect(note.duree, `${nom} durée`).toBeGreaterThan(0);
      }
      for (const bruit of SONS[nom].bruits ?? []) {
        expect(bruit.gain, `${nom} bruit`).toBeLessThanOrEqual(0.1);
        expect(bruit.duree, `${nom} bruit`).toBeGreaterThan(0);
      }
    }
  });

  it("le total des gains simultanés reste raisonnable", () => {
    for (const nom of NOMS) {
      const def = SONS[nom];
      // Somme des gains qui se chevauchent au départ de chaque note.
      const pires = def.notes.map((n) =>
        def.notes.filter((a) => a.debut <= n.debut && a.debut + a.duree > n.debut).reduce((s, a) => s + a.gain, 0),
      );
      expect(Math.max(0, ...pires), nom).toBeLessThanOrEqual(0.3);
    }
  });

  it("les sons de feedback immédiat sont plus courts que les célébrations", () => {
    for (const rapide of ["tap", "choix", "confiance", "suivant", "page"] as NomSon[]) {
      expect(dureeSon(SONS[rapide]), rapide).toBeLessThanOrEqual(0.15);
    }
    expect(dureeSon(SONS.soleil)).toBeGreaterThan(dureeSon(SONS.deblocage));
    expect(dureeSon(SONS.deblocage)).toBeGreaterThan(dureeSon(SONS.bon));
  });
});

describe("réglages audio", () => {
  it("valeur absente ou abîmée : réglages par défaut", () => {
    expect(lireReglagesAudio(null)).toEqual(REGLAGES_AUDIO_DEFAUT);
    expect(lireReglagesAudio("pas du json")).toEqual(REGLAGES_AUDIO_DEFAUT);
    expect(lireReglagesAudio("{}")).toEqual(REGLAGES_AUDIO_DEFAUT);
  });

  it("lit ce qui est valide, borne le volume entre 0 et 1", () => {
    expect(lireReglagesAudio('{"musique":false,"effets":true,"volume":0.3}')).toEqual({ musique: false, effets: true, volume: 0.3 });
    expect(lireReglagesAudio('{"volume":9}').volume).toBe(1);
    expect(lireReglagesAudio('{"volume":-2}').volume).toBe(0);
    expect(lireReglagesAudio('{"volume":"fort"}').volume).toBe(REGLAGES_AUDIO_DEFAUT.volume);
  });

  it("une sortie coupée est vraiment à zéro, l'ambiance reste en retrait", () => {
    const tout = { musique: true, effets: true, volume: 1 };
    expect(gainSortie(tout, "effets")).toBe(1);
    expect(gainSortie(tout, "musique")).toBeLessThan(gainSortie(tout, "effets"));
    expect(gainSortie({ ...tout, effets: false }, "effets")).toBe(0);
    expect(gainSortie({ ...tout, musique: false }, "musique")).toBe(0);
  });

  it("silence radio : les deux sorties coupées, ou le volume à zéro", () => {
    expect(estSilencieux({ musique: false, effets: false, volume: 0.8 })).toBe(true);
    expect(estSilencieux({ musique: true, effets: true, volume: 0 })).toBe(true);
    expect(estSilencieux(REGLAGES_AUDIO_DEFAUT)).toBe(false);
  });
});

describe("ambiance des galaxies", () => {
  it("même teinte, même note ; teintes éloignées, notes différentes", () => {
    expect(frequenceGalaxie(120)).toBe(frequenceGalaxie(120));
    expect(frequenceGalaxie(10)).not.toBe(frequenceGalaxie(200));
  });

  it("reste dans les graves, quelle que soit la teinte", () => {
    for (let teinte = -400; teinte <= 400; teinte += 17) {
      const hz = frequenceGalaxie(teinte);
      expect(Number.isFinite(hz)).toBe(true);
      expect(hz).toBeGreaterThanOrEqual(50);
      expect(hz).toBeLessThanOrEqual(220);
    }
  });
});
