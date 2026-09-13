"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { actionTerminerPhase } from "@/app/planete/actions";
import { BarreProgression } from "@/components/BarreProgression";
import type { ResultatPhase } from "@/lib/supabase/odyssee";

export interface EcranProvisoire {
  titre: string;
  texte: string;
  pourquoi: string;
  plus: string | null;
}

interface Props {
  conceptId: string;
  nomPlanete: string;
  ecrans: EcranProvisoire[];
  retourHref: string;
  suiteHref: string;
}

/** Lecteur de découverte : un écran à la fois, c'est toi qui avances (Espace / Entrée). */
export function Decouverte({ conceptId, nomPlanete, ecrans, retourHref, suiteHref }: Props) {
  const [index, setIndex] = useState(0);
  const [plus, setPlus] = useState(false);
  const [resultat, setResultat] = useState<ResultatPhase | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const termine = index >= ecrans.length;

  const suivant = useCallback(async () => {
    if (termine || enCours) return;
    setPlus(false);
    if (index + 1 < ecrans.length) {
      setIndex(index + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    setEnCours(true);
    try {
      setResultat(await actionTerminerPhase({ conceptId, phase: "decouverte", score: 1, bonnesReponses: 0, bonnesFaciles: 0, ecransVus: ecrans.length }));
    } catch (e: unknown) {
      setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setEnCours(false);
      setIndex(ecrans.length);
    }
  }, [termine, enCours, index, ecrans.length, conceptId]);

  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      const cible = e.target as HTMLElement | null;
      if (cible && ["BUTTON", "A", "INPUT", "TEXTAREA"].includes(cible.tagName)) return;
      const touche = e.code === "Space" ? " " : e.key;
      if (touche === " " || touche === "Enter") {
        e.preventDefault();
        void suivant();
      } else if ((touche === "e" || touche === "E") && !termine) {
        e.preventDefault();
        setPlus((p) => !p);
      }
    }
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [suivant, termine]);

  if (termine) {
    return (
      <div className="flex-1 flex flex-col justify-center">
        <div className="anim-fin panneau overflow-hidden">
          <div className="h-1.5" style={{ background: "var(--type-comprendre)" }} aria-hidden="true" />
          <div className="p-8 flex flex-col items-center text-center gap-6">
            <h1 className="text-2xl font-semibold">Observatoire terminé</h1>
            <p className="texte-2">
              Tu as parcouru les {ecrans.length} notions de {nomPlanete}. Prochaine étape : vérifier que tu as compris.
            </p>
            {resultat ? (
              <p className="font-semibold" style={{ color: "var(--accent)" }}>
                +{resultat.xpGagne} XP
              </p>
            ) : erreur ? (
              <p className="texte-2 text-sm">Enregistrement impossible : {erreur}</p>
            ) : null}
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href={suiteHref} className="bouton bouton-principal">
                Entrer au laboratoire
              </Link>
              <Link href={retourHref} className="bouton">
                Retour à la planète
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ecran = ecrans[index];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <BarreProgression fait={index} total={ecrans.length} />
        <Link href={retourHref} className="texte-2 text-sm whitespace-nowrap underline underline-offset-4">
          Quitter
        </Link>
      </div>

      <div key={index} className="anim-apparait panneau overflow-hidden">
        <div className="h-1.5" style={{ background: "var(--type-comprendre)" }} aria-hidden="true" />
        <div className="p-6 sm:p-8 flex flex-col gap-5">
          <p className="texte-2 text-sm">
            {nomPlanete} · Observatoire · {index + 1} / {ecrans.length}
          </p>
          <p className="texte-2">{ecran.titre}</p>
          <p className="question">{ecran.texte}</p>
          <p>{ecran.pourquoi}</p>
          {ecran.plus && (
            <>
              <button type="button" onClick={() => setPlus((p) => !p)} className="self-start underline underline-offset-4 texte-2 flex items-center gap-2">
                {plus ? "Réduire" : "En savoir plus"}
                <span className="touche">E</span>
              </button>
              {plus && <p className="texte-2 anim-deplie">{ecran.plus}</p>}
            </>
          )}
          <button type="button" onClick={() => void suivant()} disabled={enCours} className="bouton bouton-principal mt-2">
            {index + 1 < ecrans.length ? "Notion suivante" : "J'ai tout vu"}
            <span className="touche">Espace</span>
          </button>
        </div>
      </div>
    </div>
  );
}
