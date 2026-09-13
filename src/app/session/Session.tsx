"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BarreProgression } from "@/components/BarreProgression";
import { Carte as CadreCarte } from "@/components/Carte";
import { Feedback } from "@/components/Feedback";
import { FinDeSession } from "@/components/FinDeSession";
import { FinDePhase } from "@/components/odyssee/FinDePhase";
import { Cloze } from "@/components/cartes/Cloze";
import { Exemple } from "@/components/cartes/Exemple";
import { Flash } from "@/components/cartes/Flash";
import { Libre } from "@/components/cartes/Libre";
import { Qcm } from "@/components/cartes/Qcm";
import { Sort } from "@/components/cartes/Sort";
import { lireTrous, verifierClassement, verifierOrdre, verifierTrous } from "@/lib/cartes/verifier";
import { CONFIG_REVISION } from "@/lib/revision/config";
import { reinsererCarteRatee } from "@/lib/revision/composer";
import type { TriErreur } from "@/lib/supabase/requetes";
import {
  FAMILLE_PAR_TYPE,
  type Carte,
  type CarteAReviser,
  type Confiance,
  type ReponseSession,
  type TypeCarte,
} from "@/lib/types";
import { actionEnregistrerReponse, actionTerminerSession } from "./actions";

// ---------------------------------------------------------------------------
// Les 10 types de cartes se rangent en 6 mécaniques. Toutes suivent le même fil :
// répondre → confiance → (vérification automatique | révélation + auto-évaluation) → feedback.
// ---------------------------------------------------------------------------

type Mecanique = "flash" | "choix" | "cloze" | "libre" | "exemple" | "sort";

const MECANIQUE_PAR_TYPE: Record<TypeCarte, Mecanique> = {
  flash: "flash",
  qcm: "choix",
  duel: "choix",
  cloze: "cloze",
  why: "libre",
  whatif: "libre",
  problem: "libre",
  worked_example: "exemple",
  faded_example: "exemple",
  sort: "sort",
};

/** Mécaniques où c'est l'utilisateur qui juge sa réponse (révélation puis « j'avais bon / pas encore »). */
const AUTO_EVALUEES: readonly Mecanique[] = ["flash", "libre", "exemple"];

const LIBELLE_TYPE: Record<TypeCarte, string> = {
  flash: "Flash",
  qcm: "QCM",
  duel: "Duel",
  cloze: "Texte à trous",
  why: "Pourquoi ?",
  whatif: "Et si ?",
  problem: "Problème",
  worked_example: "Exemple résolu",
  faded_example: "Exemple à compléter",
  sort: "Classer",
};

const CONSIGNE_LIBRE: Partial<Record<TypeCarte, string>> = {
  why: "Explique en une ou deux phrases, avec tes mots.",
  whatif: "Décris ce qui se passerait, avec tes mots.",
  problem: "Résous, étape par étape.",
};

type Etape = "repondre" | "confiance" | "revele" | "feedback";

/** Tout ce que l'utilisateur a saisi sur la carte en cours (un seul objet, remis à zéro à chaque carte). */
interface Saisie {
  choix: number | null;
  texte: string;
  trous: string[];
  classement: (string | null)[];
  ordre: number[];
  melange: number[];
  depliees: number;
}

interface EtatCarte {
  etape: Etape;
  confiance: Confiance | null;
  correct: boolean | null;
  plus: boolean;
  saisie: Saisie;
}

/**
 * Mélange déterministe à partir d'une graine (l'id de la carte) : même résultat côté
 * serveur et côté navigateur, donc pas d'écart au premier rendu. Jamais l'ordre initial.
 */
function melanger(n: number, graine: string): number[] {
  let h = 2166136261;
  for (const c of graine) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const suivant = () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 4294967296;
  };
  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(suivant() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  if (n > 1 && indices.every((v, i) => v === i)) [indices[0], indices[1]] = [indices[1], indices[0]];
  return indices;
}

function etatInitial(carte: Carte | undefined): EtatCarte {
  const mecanique = carte ? MECANIQUE_PAR_TYPE[carte.type] : "flash";
  const nbItems = carte?.data?.items?.length ?? 0;
  return {
    etape: mecanique === "flash" ? "confiance" : "repondre",
    confiance: null,
    correct: null,
    plus: false,
    saisie: {
      choix: null,
      texte: "",
      trous: carte?.type === "cloze" ? lireTrous(carte.question).reponses.map(() => "") : [],
      classement: Array.from({ length: nbItems }, () => null),
      ordre: [],
      melange: carte?.data?.mode === "ordonner" ? melanger(nbItems, carte.id) : [],
      depliees: 0,
    },
  };
}

/** Nombre d'étapes visibles d'un exemple (toutes, sauf les cachées d'un faded_example). */
function etapesVisibles(carte: Carte): number {
  const steps = carte.data?.steps?.length ?? 0;
  if (carte.type !== "faded_example") return steps;
  return steps - Math.min(Math.max(carte.data?.hidden ?? 1, 1), steps - 1);
}

/** La saisie est-elle complète (on peut passer à la confiance) ? */
function saisieComplete(carte: Carte, s: Saisie): boolean {
  switch (MECANIQUE_PAR_TYPE[carte.type]) {
    case "flash":
      return true;
    case "choix":
      return s.choix !== null;
    case "cloze":
      return s.trous.every((t) => t.trim() !== "");
    case "libre":
      return s.texte.trim() !== "";
    case "exemple":
      return s.depliees >= etapesVisibles(carte) && (carte.type === "worked_example" || s.texte.trim() !== "");
    case "sort": {
      const n = carte.data?.items?.length ?? 0;
      return carte.data?.mode === "ordonner"
        ? s.ordre.length === n
        : s.classement.length === n && s.classement.every((c) => c !== null);
    }
  }
}

/** Vérification automatique (choix, cloze, sort). */
function verifier(carte: Carte, s: Saisie): boolean {
  switch (MECANIQUE_PAR_TYPE[carte.type]) {
    case "choix":
      return s.choix !== null && carte.options?.[s.choix] === carte.answer;
    case "cloze":
      return verifierTrous(carte.question, s.trous).every(Boolean);
    case "sort":
      return (carte.data?.mode === "ordonner" ? verifierOrdre(carte, s.ordre) : verifierClassement(carte, s.classement)).every(Boolean);
    default:
      return false;
  }
}

/** Dans quel cadre la séance est jouée : décide de l'enregistrement, du retour des ratées et de l'écran de fin. */
export type ModeSession = "patrouille" | "comprehension" | "entrainement" | "mission" | "soleil";

interface Props {
  mode: ModeSession;
  sessionId: string;
  cartes: CarteAReviser[];
  /** Date du jour AAAA-MM-JJ (calculée côté serveur dans le fuseau de l'utilisateur). */
  aujourdhui: string;
  /** Planète (phases) ou galaxie (soleil) concernée ; inutile en patrouille. */
  cibleId?: string;
  retourHref?: string;
  rejouerHref?: string;
}

export function Session({ mode, sessionId, cartes, aujourdhui, cibleId, retourHref = "/", rejouerHref = "/" }: Props) {
  const [file, setFile] = useState<Carte[]>(() => cartes.map((c) => c.carte));
  const [index, setIndex] = useState(0);
  const [etat, setEtat] = useState<EtatCarte>(() => etatInitial(file[0]));
  const [reponses, setReponses] = useState<ReponseSession[]>([]);
  const [retours, setRetours] = useState<Record<string, number>>({});
  const [erreurSauvegarde, setErreurSauvegarde] = useState<string | null>(null);

  // Identifiant en base de la PREMIÈRE réponse de chaque carte (pour le tri des erreurs).
  const idsReponses = useRef<Record<string, string>>({});
  const enregistrements = useRef<Promise<unknown>[]>([]);

  const carte = file[index];
  const terminee = index >= file.length;
  const mecanique = carte ? MECANIQUE_PAR_TYPE[carte.type] : "flash";
  const autoEvaluee = AUTO_EVALUEES.includes(mecanique);

  // ---- Saisie ----------------------------------------------------------

  const modifierSaisie = useCallback((patch: Partial<Saisie> | ((s: Saisie) => Partial<Saisie>)) => {
    setEtat((e) => {
      if (e.etape !== "repondre") return e;
      const p = typeof patch === "function" ? patch(e.saisie) : patch;
      return { ...e, saisie: { ...e.saisie, ...p } };
    });
  }, []);

  const choisirOption = useCallback(
    (i: number) => {
      if (!carte || mecanique !== "choix") return;
      if (etat.etape !== "repondre" && etat.etape !== "confiance") return;
      if (i < 0 || i >= (carte.options?.length ?? 0)) return;
      setEtat((e) => ({ ...e, etape: "confiance", saisie: { ...e.saisie, choix: i } }));
    },
    [carte, mecanique, etat.etape],
  );

  const pret = useCallback(() => {
    if (!carte || etat.etape !== "repondre" || !saisieComplete(carte, etat.saisie)) return;
    setEtat((e) => ({ ...e, etape: "confiance" }));
  }, [carte, etat.etape, etat.saisie]);

  const choisirConfiance = useCallback(
    (valeur: Confiance) => {
      if (etat.etape !== "confiance") return;
      setEtat((e) => ({ ...e, confiance: valeur }));
    },
    [etat.etape],
  );

  // ---- Enregistrement ---------------------------------------------------

  const enregistrer = useCallback(
    (correct: boolean) => {
      if (!carte || etat.confiance === null) return;
      const premiere = !reponses.some((r) => r.card_id === carte.id);
      const reponse: ReponseSession = {
        card_id: carte.id,
        correct,
        confidence: etat.confiance,
        timestamp: new Date().toISOString(),
        error_box: null,
      };
      setReponses((r) => [...r, reponse]);
      setEtat((e) => ({ ...e, etape: "feedback", correct }));

      {
        const promesse = actionEnregistrerReponse({
          sessionId,
          cardId: carte.id,
          correct,
          confiance: etat.confiance,
          objectif: carte.retention_goal,
          premiere,
          contexte: mode,
          // La compréhension est un premier contact guidé : elle n'entre pas dans le planning de révision.
          planifie: mode !== "comprehension",
        })
          .then((id) => {
            if (premiere) idsReponses.current[carte.id] = id;
          })
          .catch((e: unknown) => {
            setErreurSauvegarde(e instanceof Error ? e.message : "Enregistrement impossible.");
          });
        enregistrements.current.push(promesse);
      }

      // Règle 5 : une carte ratée revient dans la même séance, 5 à 10 cartes plus loin
      // (sauf en mission et au soleil : une épreuve ne se rallonge pas).
      if (!correct && mode !== "mission" && mode !== "soleil") {
        const dejaRevenue = retours[carte.id] ?? 0;
        if (dejaRevenue < CONFIG_REVISION.retourCarteRatee.maxRetoursParSession) {
          setFile((f) => reinsererCarteRatee(f, index, carte));
          setRetours((r) => ({ ...r, [carte.id]: dejaRevenue + 1 }));
        }
      }
    },
    [carte, etat.confiance, index, retours, reponses, mode, sessionId],
  );

  /** Vérification automatique (QCM, duel, trous, classer). */
  const valider = useCallback(() => {
    if (!carte || autoEvaluee) return;
    if (etat.etape !== "confiance" || etat.confiance === null) return;
    enregistrer(verifier(carte, etat.saisie));
  }, [carte, autoEvaluee, etat.etape, etat.confiance, etat.saisie, enregistrer]);

  /** Révélation (flash, réponse libre, exemple) : la réponse s'affiche, l'utilisateur juge ensuite. */
  const reveler = useCallback(() => {
    if (!carte || !autoEvaluee) return;
    if (etat.etape !== "confiance" || etat.confiance === null) return;
    setEtat((e) => ({ ...e, etape: "revele" }));
  }, [carte, autoEvaluee, etat.etape, etat.confiance]);

  const autoEvaluer = useCallback(
    (correct: boolean) => {
      if (!carte || !autoEvaluee || etat.etape !== "revele") return;
      enregistrer(correct);
    },
    [carte, autoEvaluee, etat.etape, enregistrer],
  );

  const suivant = useCallback(() => {
    if (etat.etape !== "feedback") return;
    const prochain = index + 1;
    setIndex(prochain);
    setEtat(etatInitial(file[prochain]));
    window.scrollTo({ top: 0 });
  }, [etat.etape, index, file]);

  const togglePlus = useCallback(() => {
    if (etat.etape !== "feedback") return;
    setEtat((e) => ({ ...e, plus: !e.plus }));
  }, [etat.etape]);

  const attendreEnregistrements = useCallback(async () => {
    await Promise.all(enregistrements.current);
  }, []);

  /** Fin de patrouille : attend que toutes les réponses soient en base, puis clôture. */
  const terminer = useCallback(
    async (texteRappel: string, tri: Omit<TriErreur, "answerId">[]): Promise<{ prochaineDue: string | null }> => {
      await Promise.all(enregistrements.current);
      const triComplet: TriErreur[] = tri
        .filter((t) => idsReponses.current[t.cardId])
        .map((t) => ({ ...t, answerId: idsReponses.current[t.cardId] }));
      return actionTerminerSession(sessionId, texteRappel, triComplet);
    },
    [sessionId],
  );

  // ---- Raccourcis clavier : 1-4 choix, Espace révéler, Entrée valider, E en savoir plus

  useEffect(() => {
    if (terminee || !carte) return;
    const carteCourante = carte;

    function surTouche(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const cible = e.target as HTMLElement | null;
      const dansChamp = !!cible && ["INPUT", "TEXTAREA"].includes(cible.tagName);
      const surUnControle = dansChamp || (!!cible && ["BUTTON", "A"].includes(cible.tagName));
      // e.code est plus fiable que e.key pour la barre d'espace.
      const touche = e.code === "Space" ? " " : e.key;
      const chiffre = /^[1-8]$/.test(touche) ? Number(touche) : null;
      const validation = touche === " " || touche === "Enter";

      switch (etat.etape) {
        case "repondre": {
          if (dansChamp) return; // les champs gèrent Entrée eux-mêmes
          const s = etat.saisie;
          if (mecanique === "choix" && chiffre !== null && chiffre <= 4) {
            e.preventDefault();
            choisirOption(chiffre - 1);
          } else if (mecanique === "sort" && chiffre !== null) {
            const data = carteCourante.data;
            if (data?.mode === "ordonner") {
              const restants = s.melange.filter((i) => !s.ordre.includes(i));
              const choisi = restants[chiffre - 1];
              if (choisi !== undefined) {
                e.preventDefault();
                modifierSaisie((prev) => ({ ordre: [...prev.ordre, choisi] }));
              }
            } else {
              const categorie = data?.categories?.[chiffre - 1];
              const indexActif = s.classement.findIndex((c) => c === null);
              if (categorie && indexActif !== -1) {
                e.preventDefault();
                modifierSaisie((prev) => ({
                  classement: prev.classement.map((c, i) => (i === indexActif ? categorie : c)),
                }));
              }
            }
          } else if (mecanique === "exemple" && validation && s.depliees < etapesVisibles(carteCourante)) {
            e.preventDefault();
            modifierSaisie((prev) => ({ depliees: prev.depliees + 1 }));
          } else if (validation && !surUnControle) {
            e.preventDefault();
            pret();
          }
          break;
        }
        case "confiance":
          if (chiffre !== null && chiffre <= 3) {
            e.preventDefault();
            choisirConfiance(chiffre as Confiance);
          } else if (validation && !surUnControle) {
            e.preventDefault();
            if (autoEvaluee) reveler();
            else valider();
          }
          break;
        case "revele":
          if ((touche === "1" || touche === "Enter") && !surUnControle) {
            e.preventDefault();
            autoEvaluer(true);
          } else if (touche === "2") {
            e.preventDefault();
            autoEvaluer(false);
          }
          break;
        case "feedback":
          if (validation && !surUnControle) {
            e.preventDefault();
            suivant();
          } else if (touche === "e" || touche === "E") {
            e.preventDefault();
            togglePlus();
          }
          break;
      }
    }
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [
    terminee,
    carte,
    mecanique,
    autoEvaluee,
    etat.etape,
    etat.saisie,
    choisirOption,
    modifierSaisie,
    pret,
    choisirConfiance,
    reveler,
    valider,
    autoEvaluer,
    suivant,
    togglePlus,
  ]);

  // ---- Rendu ----------------------------------------------------------

  if (terminee && mode !== "patrouille" && cibleId) {
    return (
      <FinDePhase
        mode={mode}
        cibleId={cibleId}
        cartes={cartes.map((c) => c.carte)}
        reponses={reponses}
        retourHref={retourHref}
        rejouerHref={rejouerHref}
        attendreEnregistrements={attendreEnregistrements}
      />
    );
  }

  if (terminee) {
    return (
      <FinDeSession
        cartes={cartes.map((c) => c.carte)}
        reponses={reponses}
        aujourdhui={aujourdhui}
        onTerminer={terminer}
        erreurSauvegarde={erreurSauvegarde}
      />
    );
  }

  if (!carte) return null;

  const famille = FAMILLE_PAR_TYPE[carte.type];
  const enFeedback = etat.etape === "feedback";
  const s = etat.saisie;
  /** Phase vue par les composants : après enregistrement, tout est « révélé ». */
  const phase: "repondre" | "confiance" | "revele" =
    enFeedback || etat.etape === "revele" ? "revele" : etat.etape === "confiance" ? "confiance" : "repondre";
  const libelle = carte.type === "sort" && carte.data?.mode === "ordonner" ? "Ordonner" : LIBELLE_TYPE[carte.type];

  return (
    <div
      className="flex flex-col gap-6"
      // Un clic à la souris ne garde pas le focus sur le bouton : les raccourcis restent cohérents.
      onMouseDownCapture={(e) => {
        if ((e.target as HTMLElement).closest("button")) e.preventDefault();
      }}
    >
      <div className="flex items-center gap-4">
        <BarreProgression fait={index} total={file.length} />
        <Link href={retourHref} className="texte-2 text-sm whitespace-nowrap underline underline-offset-4">
          Quitter
        </Link>
      </div>

      <div key={`${carte.id}-${index}`} className="anim-apparait">
        <CadreCarte famille={famille} tremble={enFeedback && etat.correct === false}>
          <p className="texte-2 text-sm mb-4">
            {carte.concept_nom} · {libelle}
          </p>

          {mecanique === "flash" && (
            <Flash
              carte={carte}
              phase={etat.etape === "confiance" ? "confiance" : "revele"}
              confiance={etat.confiance}
              onConfiance={choisirConfiance}
              onReveler={reveler}
              onAutoEvaluation={autoEvaluer}
              termine={enFeedback}
              correct={etat.correct}
            />
          )}

          {mecanique === "choix" && (
            <Qcm
              carte={carte}
              phase={phase}
              choix={s.choix}
              confiance={etat.confiance}
              onChoisir={choisirOption}
              onConfiance={choisirConfiance}
              onValider={valider}
            />
          )}

          {mecanique === "cloze" && (
            <form onSubmit={(e) => e.preventDefault()}>
              <Cloze
                carte={carte}
                phase={phase}
                trous={s.trous}
                confiance={etat.confiance}
                onSaisir={(i, v) => modifierSaisie((prev) => ({ trous: prev.trous.map((t, k) => (k === i ? v : t)) }))}
                onPret={pret}
                onConfiance={choisirConfiance}
                onValider={valider}
              />
            </form>
          )}

          {mecanique === "libre" && (
            <Libre
              carte={carte}
              phase={phase}
              texte={s.texte}
              confiance={etat.confiance}
              onSaisir={(texte) => modifierSaisie({ texte })}
              onPret={pret}
              onConfiance={choisirConfiance}
              onReveler={reveler}
              onAutoEvaluation={autoEvaluer}
              termine={enFeedback}
              correct={etat.correct}
              consigne={CONSIGNE_LIBRE[carte.type] ?? "Écris ta réponse."}
            />
          )}

          {mecanique === "exemple" && (
            <Exemple
              carte={carte}
              phase={phase}
              depliees={s.depliees}
              texte={s.texte}
              confiance={etat.confiance}
              onDeplier={() => modifierSaisie((prev) => ({ depliees: prev.depliees + 1 }))}
              onSaisir={(texte) => modifierSaisie({ texte })}
              onPret={pret}
              onConfiance={choisirConfiance}
              onReveler={reveler}
              onAutoEvaluation={autoEvaluer}
              termine={enFeedback}
              correct={etat.correct}
            />
          )}

          {mecanique === "sort" && (
            <Sort
              carte={carte}
              phase={phase}
              classement={s.classement}
              ordre={s.ordre}
              melange={s.melange}
              confiance={etat.confiance}
              onClasser={(i, cat) =>
                modifierSaisie((prev) => ({ classement: prev.classement.map((c, k) => (k === i ? cat : c)) }))
              }
              onPlacer={(i) => modifierSaisie((prev) => (prev.ordre.includes(i) ? {} : { ordre: [...prev.ordre, i] }))}
              onRecommencer={() => modifierSaisie({ ordre: [] })}
              onPret={pret}
              onConfiance={choisirConfiance}
              onValider={valider}
            />
          )}

          {enFeedback && etat.correct !== null && (
            <Feedback
              carte={carte}
              correct={etat.correct}
              plus={etat.plus}
              onTogglePlus={togglePlus}
              onSuivant={suivant}
            />
          )}
        </CadreCarte>
      </div>

      {erreurSauvegarde && (
        <p className="texte-2 text-sm text-center">Enregistrement impossible : {erreurSauvegarde}</p>
      )}
    </div>
  );
}
