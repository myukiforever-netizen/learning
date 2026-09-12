"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarreProgression } from "@/components/BarreProgression";
import { Carte as CadreCarte } from "@/components/Carte";
import { Feedback } from "@/components/Feedback";
import { Flash } from "@/components/cartes/Flash";
import { Qcm } from "@/components/cartes/Qcm";
import { CARTES_TEST } from "@/data/cartes-test";
import { CONFIG_REVISION } from "@/lib/revision/config";
import { ordonnerSansRepetition, reinsererCarteRatee } from "@/lib/revision/composer";
import { FAMILLE_PAR_TYPE, type Carte, type Confiance, type ReponseSession } from "@/lib/types";

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

export default function PageSession() {
  const router = useRouter();
  const [file, setFile] = useState<Carte[]>(() => ordonnerSansRepetition(CARTES_TEST));
  const [index, setIndex] = useState(0);
  const [etat, setEtat] = useState<EtatCarte>(() => etatInitial(file[0]));
  const [reponses, setReponses] = useState<ReponseSession[]>([]);
  const [retours, setRetours] = useState<Record<string, number>>({});

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
      const reponse: ReponseSession = {
        card_id: carte.id,
        correct,
        confidence: etat.confiance,
        timestamp: new Date().toISOString(),
        error_box: null,
      };
      setReponses((r) => [...r, reponse]);
      setEtat((e) => ({ ...e, etape: "feedback", correct }));

      // Règle 5 : une carte ratée revient dans la même session, 5 à 10 cartes plus loin.
      if (!correct) {
        const dejaRevenue = retours[carte.id] ?? 0;
        if (dejaRevenue < CONFIG_REVISION.retourCarteRatee.maxRetoursParSession) {
          setFile((f) => reinsererCarteRatee(f, index, carte));
          setRetours((r) => ({ ...r, [carte.id]: dejaRevenue + 1 }));
        }
      }
    },
    [carte, etat.confiance, index, retours],
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

  // ---- Raccourcis clavier : 1-4 choix, Espace révéler, Entrée valider, E en savoir plus

  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const cible = e.target as HTMLElement | null;
      const surUnControle = !!cible && ["BUTTON", "A", "INPUT", "TEXTAREA"].includes(cible.tagName);
      // e.code est plus fiable que e.key pour la barre d'espace.
      const touche = e.code === "Space" ? " " : e.key;

      if (terminee) {
        if (touche === "Enter" && !surUnControle) {
          e.preventDefault();
          router.push("/");
        }
        return;
      }

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
  }, [
    terminee,
    etat.etape,
    carte,
    choisirOption,
    choisirConfiance,
    reveler,
    valider,
    autoEvaluer,
    suivant,
    togglePlus,
    router,
  ]);

  // ---- Rendu ----------------------------------------------------------

  if (terminee) {
    return <EcranFin reponses={reponses} />;
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
    </div>
  );
}

/** Fin de session (version minimale du jalon 1 ; page blanche et tri des erreurs au jalon 2). */
function EcranFin({ reponses }: { reponses: ReponseSession[] }) {
  const vues = new Set(reponses.map((r) => r.card_id)).size;
  const aRetravailler = new Set(reponses.filter((r) => !r.correct).map((r) => r.card_id)).size;

  return (
    <div className="flex-1 flex flex-col justify-center">
      <div className="anim-fin bg-carte rounded-2xl border border-bordure shadow-sm overflow-hidden">
        <div className="h-1.5" style={{ background: "var(--type-page-blanche)" }} aria-hidden="true" />
        <div className="p-8 flex flex-col items-center text-center gap-6">
          <svg
            width="56"
            height="56"
            viewBox="0 0 32 32"
            aria-hidden="true"
            fill="none"
            stroke="var(--ok)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="16" cy="16" r="14" />
            <path d="M9.5 16.5l4.5 4.5 8.5-9" />
          </svg>
          <h1 className="text-2xl font-semibold">Session terminée</h1>
          <div className="flex flex-col gap-1">
            <p>{vues} cartes vues</p>
            <p>{aRetravailler === 0 ? "Aucune carte à retravailler" : `${aRetravailler} à retravailler`}</p>
            <p className="question mt-2">Ta vraie note, c&apos;est dans 3 jours.</p>
          </div>
          <Link href="/" className="bouton bouton-principal mt-2">
            Retour à l&apos;accueil
            <span className="touche">Entrée</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
