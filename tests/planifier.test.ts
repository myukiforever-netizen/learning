import { describe, expect, it } from "vitest";
import { appliquerBoite, etatInitial, planifier, resultatDe } from "@/lib/revision/planifier";
import { CONFIG_REVISION } from "@/lib/revision/config";
import { ajouterJours, joursEntre } from "@/lib/dates";
import type { EtatRevision } from "@/lib/types";

const JOUR = "2026-09-12";

describe("resultatDe", () => {
  it("😎 + correct = facile, autre confiance correcte = effort, incorrect = raté", () => {
    expect(resultatDe(true, 3)).toBe("facile");
    expect(resultatDe(true, 2)).toBe("effort");
    expect(resultatDe(true, 1)).toBe("effort");
    expect(resultatDe(false, 3)).toBe("rate");
  });
});

describe("planifier — calendrier de base", () => {
  it("suit le calendrier de l'objectif quand on réussit avec effort", () => {
    for (const objectif of ["3m", "1y", "life"] as const) {
      const calendrier = CONFIG_REVISION.calendriers[objectif];
      let etat = etatInitial(JOUR);
      let jour = JOUR;
      for (const intervalleAttendu of calendrier) {
        etat = planifier(etat, "effort", objectif, jour);
        expect(joursEntre(jour, etat.due_date)).toBe(intervalleAttendu);
        expect(etat.ease_state).toBe("ok");
        jour = etat.due_date;
      }
    }
  });

  it("« à vie » double après la fin du calendrier, 1 an répète le dernier intervalle", () => {
    const fin: EtatRevision = { step: 5, interval_days: 240, due_date: JOUR, ease_state: "ok" };
    expect(planifier(fin, "effort", "life", JOUR).interval_days).toBe(480);
    expect(planifier(fin, "effort", "1y", JOUR).interval_days).toBe(240);
  });
});

describe("planifier — ajustements", () => {
  it("réussi facile (😎) double l'intervalle prévu", () => {
    const etat = planifier(etatInitial(JOUR), "facile", "1y", JOUR);
    expect(etat.interval_days).toBe(CONFIG_REVISION.calendriers["1y"][0] * CONFIG_REVISION.facteurFacile);
    expect(etat.due_date).toBe(ajouterJours(JOUR, etat.interval_days));
  });

  it("raté : intervalle divisé par 2, carte due aujourd'hui, puis le succès suivant utilise l'intervalle réduit", () => {
    const avant: EtatRevision = { step: 3, interval_days: 30, due_date: JOUR, ease_state: "ok" };
    const rate = planifier(avant, "rate", "1y", JOUR);
    expect(rate.interval_days).toBe(15);
    expect(rate.due_date).toBe(JOUR);
    expect(rate.ease_state).toBe("failed");

    const rattrape = planifier(rate, "effort", "1y", JOUR);
    expect(rattrape.interval_days).toBe(15);
    expect(rattrape.due_date).toBe(ajouterJours(JOUR, 15));
    expect(rattrape.ease_state).toBe("ok");
  });

  it("ne descend jamais sous l'intervalle minimum", () => {
    const petit: EtatRevision = { step: 1, interval_days: 1, due_date: JOUR, ease_state: "ok" };
    expect(planifier(petit, "rate", "3m", JOUR).interval_days).toBe(CONFIG_REVISION.intervalleMinimum);
  });
});

describe("appliquerBoite — tri des erreurs", () => {
  const ratee: EtatRevision = { step: 2, interval_days: 45, due_date: JOUR, ease_state: "failed" };

  it("« je croyais savoir » ramène quasi au début avec le marqueur ⚠️", () => {
    const etat = appliquerBoite(ratee, "thought_knew", "1y", JOUR);
    expect(etat.step).toBe(0);
    expect(etat.interval_days).toBe(CONFIG_REVISION.calendriers["1y"][0]);
    expect(etat.due_date).toBe(JOUR);
    expect(etat.ease_state).toBe("thought_knew");
    // le succès suivant repart du premier intervalle et efface le marqueur
    const suite = planifier(etat, "effort", "1y", JOUR);
    expect(suite.interval_days).toBe(CONFIG_REVISION.calendriers["1y"][0]);
    expect(suite.ease_state).toBe("ok");
  });

  it("« jamais su » repart du début, « pas retrouvé » ne change rien de plus", () => {
    expect(appliquerBoite(ratee, "never_knew", "1y", JOUR)).toMatchObject({ step: 0, ease_state: "failed" });
    expect(appliquerBoite(ratee, "not_retrieved", "1y", JOUR)).toEqual(ratee);
  });
});
