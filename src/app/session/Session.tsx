"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BarreProgression } from "@/components/BarreProgression";
import { Carte as CadreCarte } from "@/components/Carte";
import { Feedback } from "@/components/Feedback";
import { FinDeSession } from "@/components/FinDeSession";
import { Flash } from "@/components/cartes/Flash";
import { Qcm } from "@/components/cartes/Qcm";
import { CONFIG_REVISION } from "@/lib/revision/config";
import { reinsererCarteRatee } from "@/lib/revision/composer";
import type { TriErreur } from "@/lib/supabase/requetes";
import { FAMILLE_PAR_TYPE, type Carte, type CarteAReviser, type Confiance, type ReponseSession } from "@/lib/types";
import { actionEnregistrerReponse, actionTerminerSession } from "./actions";

/** Les étapes d'une carte. Flash commence à « confiance », QCM à « repondre ». */
type Etape = "repondre" | "confiance" | "revele" | "feedback";

interface EtatCarte {
  etape: Etape;
  choix: number | null;
  confiance: Confiance | null;
  correct: boolean | null;
  plus: boolean;
}

const LIBELLE_TYPE: Record<string, string> = { flash: "Flash", qcm: "QCM" };

function etatInitial(carte: Carte | undefined): EtatCarte {
  return {
    etape: carte?.type === "qcm" ? "repondre" : "confiance",
    choix: null,
    confiance: null,
    correct: null,
    plus: false,
  };
}

interface Props {
  /** demo = cartes en dur, rien n'est enregistré ; base = tout est enregistré dans Supabase. */
  mode: "demo" | "base";
  sessionId: string | null;
  cartes: CarteAReviser[];
  /** Date du jour AAAA-MM-JJ (calculée côté serveur dans le fuseau de l'utilisateur). */
  aujourdhui: string;
}

export function Session({ mode, sessionId, cartes, aujourdhui }: Props) {
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

  // ---- Actions ---------------------------------------------------------

  const choisirOption = useCallback(
    (i: number) => {
      if (!carte || carte.type !== "qcm") return;
      if (etat.etape !== "repondre" && etat.etape !== "confiance") return;
      if (i < 0 || i >= (carte.options?.length ?? 0)) return;
      setEtat((e) => ({ ...e, choix: i, etape: "confiance" }));
    },
    [carte, etat.etape],
  );

  const choisirConfiance = useCallback(
    (valeur: Confiance) => {
      if (etat.etape !== "confiance") return;
      setEtat((e) => ({ ...e, confiance: valeur }));
    },
    [etat.etape],
  );

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

      if (mode === "base" && sessionId) {
        const promesse = actionEnregistrerReponse({
          sessionId,
          cardId: carte.id,
          correct,
          confiance: etat.confiance,
          objectif: carte.retention_goal,
          premiere,
        })
          .then((id) => {
            if (premiere) idsReponses.current[carte.id] = id;
          })
          .catch((e: unknown) => {
            setErreurSauvegarde(e instanceof Error ? e.message : "Enregistrement impossible.");
          });
        enregistrements.current.push(promesse);
      }

      // Règle 5 : une carte ratée revient dans la même session, 5 à 10 cartes plus loin.
      if (!correct) {
        const dejaRevenue = retours[carte.id] ?? 0;
        if (dejaRevenue < CONFIG_REVISION.retourCarteRatee.maxRetoursParSession) {
          setFile((f) => reinsererCarteRatee(f, index, carte));
          setRetours((r) => ({ ...r, [carte.id]: dejaRevenue + 1 }));
        }
      }
    },
    [carte, etat.confiance, index, retours, reponses, mode, sessionId],
  );

  const reveler = useCallback(() => {
    if (!carte || carte.type !== "flash") return;
    if (etat.etape !== "confiance" || etat.confiance === null) return;
    setEtat((e) => ({ ...e, etape: "revele" }));
  }, [carte, etat.etape, etat.confiance]);

  const valider = useCallback(() => {
    if (!carte || carte.type !== "qcm") return;
    if (etat.etape !== "confiance" || etat.confiance === null || etat.choix === null) return;
    const correct = carte.options?.[etat.choix] === carte.answer;
    enregistrer(correct);
  }, [carte, etat.etape, etat.confiance, etat.choix, enregistrer]);

  const autoEvaluer = useCallback(
    (correct: boolean) => {
      if (!carte || carte.type !== "flash" || etat.etape !== "revele") return;
      enregistrer(correct);
    },
    [carte, etat.etape, enregistrer],
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

  /** Fin de session : attend que toutes les réponses soient en base, puis clôture. */
  const terminer = useCallback(
    async (texteRappel: string, tri: Omit<TriErreur, "answerId">[]): Promise<{ prochaineDue: string | null }> => {
      if (mode !== "base" || !sessionId) return { prochaineDue: null };
      await Promise.all(enregistrements.current);
      const triComplet: TriErreur[] = tri
        .filter((t) => idsReponses.current[t.cardId])
        .map((t) => ({ ...t, answerId: idsReponses.current[t.cardId] }));
      return actionTerminerSession(sessionId, texteRappel, triComplet);
    },
    [mode, sessionId],
  );

  // ---- Raccourcis clavier : 1-4 choix, Espace révéler, Entrée valider, E en savoir plus

  useEffect(() => {
    if (terminee) return;

    function surTouche(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const cible = e.target as HTMLElement | null;
      const surUnControle = !!cible && ["BUTTON", "A", "INPUT", "TEXTAREA"].includes(cible.tagName);
      // e.code est plus fiable que e.key pour la barre d'espace.
      const touche = e.code === "Space" ? " " : e.key;
      const chiffre = /^[1-4]$/.test(touche) ? Number(touche) : null;

      switch (etat.etape) {
        case "repondre":
          if (chiffre !== null) {
            e.preventDefault();
            choisirOption(chiffre - 1);
          }
          break;
        case "confiance":
          if (chiffre !== null && chiffre <= 3) {
            e.preventDefault();
            choisirConfiance(chiffre as Confiance);
          } else if ((touche === " " || touche === "Enter") && !surUnControle) {
            e.preventDefault();
            if (carte?.type === "flash") reveler();
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
          if ((touche === "Enter" || touche === " ") && !surUnControle) {
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
  }, [terminee, etat.etape, carte, choisirOption, choisirConfiance, reveler, valider, autoEvaluer, suivant, togglePlus]);

  // ---- Rendu ----------------------------------------------------------

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
        <Link href="/" className="texte-2 text-sm whitespace-nowrap underline underline-offset-4">
          Quitter
        </Link>
      </div>

      <div key={`${carte.id}-${index}`} className="anim-apparait">
        <CadreCarte famille={famille} tremble={enFeedback && etat.correct === false}>
          <p className="texte-2 text-sm mb-4">
            {carte.concept_nom} · {LIBELLE_TYPE[carte.type] ?? carte.type}
          </p>

          {carte.type === "flash" && (
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

          {carte.type === "qcm" && (
            <Qcm
              carte={carte}
              phase={enFeedback ? "revele" : etat.etape === "confiance" ? "confiance" : "repondre"}
              choix={etat.choix}
              confiance={etat.confiance}
              onChoisir={choisirOption}
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
