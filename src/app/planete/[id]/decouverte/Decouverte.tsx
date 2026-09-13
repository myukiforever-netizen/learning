"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { actionTerminerPhase } from "@/app/planete/actions";
import { BarreProgression } from "@/components/BarreProgression";
import type { EcranDecouverte } from "@/lib/import/schema";
import type { ResultatPhase } from "@/lib/supabase/odyssee";

/** Fiche provisoire (planète sans écrans de découverte écrits) : la notion, expliquée. */
export interface EcranFiche {
  type: "fiche";
  titre: string;
  texte: string;
  pourquoi: string;
  plus: string | null;
}

export type Ecran = EcranDecouverte | EcranFiche;

interface Props {
  conceptId: string;
  nomPlanete: string;
  ecrans: Ecran[];
  retourHref: string;
  suiteHref: string;
}

/** Lecteur de découverte : un écran à la fois, c'est toi qui avances (Espace / Entrée). */
export function Decouverte({ conceptId, nomPlanete, ecrans, retourHref, suiteHref }: Props) {
  const [index, setIndex] = useState(0);
  const [plus, setPlus] = useState(false);
  const [devine, setDevine] = useState<string | null>(null);
  const [paragraphesVus, setParagraphesVus] = useState(1);
  const [resultat, setResultat] = useState<ResultatPhase | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const termine = index >= ecrans.length;
  const ecran = ecrans[index];

  // Un écran est « prêt à passer » quand on a tout lu (histoire) ou deviné (prédiction).
  const pret =
    !ecran || ecran.type === "predire" ? devine !== null : ecran.type === "histoire" ? paragraphesVus >= ecran.paragraphes.length : true;

  const avancer = useCallback(async () => {
    if (termine || enCours || !ecran) return;
    if (ecran.type === "histoire" && paragraphesVus < ecran.paragraphes.length) {
      setParagraphesVus((n) => n + 1);
      return;
    }
    if (!pret) return;
    setPlus(false);
    setDevine(null);
    setParagraphesVus(1);
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
  }, [termine, enCours, ecran, paragraphesVus, pret, index, ecrans.length, conceptId]);

  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      const cible = e.target as HTMLElement | null;
      if (cible && ["BUTTON", "A", "INPUT", "TEXTAREA"].includes(cible.tagName)) return;
      const touche = e.code === "Space" ? " " : e.key;
      if (touche === " " || touche === "Enter") {
        e.preventDefault();
        void avancer();
      } else if (ecran?.type === "predire" && devine === null && /^[1-4]$/.test(touche)) {
        const option = ecran.options[Number(touche) - 1];
        if (option) {
          e.preventDefault();
          setDevine(option);
        }
      } else if ((touche === "e" || touche === "E") && !termine) {
        e.preventDefault();
        setPlus((p) => !p);
      }
    }
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [avancer, termine, ecran, devine]);

  if (termine) {
    return (
      <div className="flex-1 flex flex-col justify-center">
        <div className="anim-fin panneau overflow-hidden">
          <div className="h-1.5" style={{ background: "var(--type-comprendre)" }} aria-hidden="true" />
          <div className="p-8 flex flex-col items-center text-center gap-6">
            <h1 className="text-2xl font-semibold">Observatoire terminé</h1>
            <p className="texte-2">Tu as découvert {nomPlanete}. Prochaine étape : vérifier que tu as compris, sans pression.</p>
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

  if (!ecran) return null;
  const dernier = index + 1 >= ecrans.length;
  const libelleBouton =
    ecran.type === "histoire" && paragraphesVus < ecran.paragraphes.length ? "La suite" : dernier ? "J'ai tout vu" : "Écran suivant";

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

          {ecran.type === "histoire" && (
            <>
              <h2 className="question">{ecran.titre}</h2>
              {ecran.paragraphes.slice(0, paragraphesVus).map((texte, i) => (
                <p key={i} className={i === paragraphesVus - 1 && i > 0 ? "anim-deplie" : undefined}>
                  {texte}
                </p>
              ))}
            </>
          )}

          {ecran.type === "analogie" && (
            <>
              <h2 className="question">{ecran.titre}</h2>
              <div className="rounded-xl border border-bordure bg-fond p-4 flex flex-col gap-1">
                <span className="texte-2 text-sm">C&apos;est comme…</span>
                <p>{ecran.comme}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="texte-2 text-sm">En vrai…</span>
                <p>{ecran.enVrai}</p>
              </div>
            </>
          )}

          {ecran.type === "exemple" && (
            <>
              <h2 className="question">{ecran.titre}</h2>
              <p className="texte-2 text-sm">Un exemple concret</p>
              <p>{ecran.texte}</p>
            </>
          )}

          {ecran.type === "predire" && (
            <>
              <p className="texte-2 text-sm">Devine avant de savoir : même en te trompant, tu retiendras mieux.</p>
              <h2 className="question">{ecran.question}</h2>
              <div className="flex flex-col gap-3">
                {ecran.options.map((option, i) => {
                  const revele = devine !== null;
                  let classe = "bouton bouton-choix";
                  if (revele && option === ecran.answer) classe += " est-bon";
                  else if (revele && option === devine) classe += " est-faux";
                  return (
                    <button key={option} type="button" className={classe} disabled={revele} onClick={() => setDevine(option)}>
                      <span className="touche">{i + 1}</span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
              {devine !== null && (
                <div className="anim-deplie flex flex-col gap-2">
                  <p className="font-medium" style={{ color: devine === ecran.answer ? "var(--ok)" : "var(--effort)" }}>
                    {devine === ecran.answer ? "Bien deviné." : "Pas grave : maintenant tu sais."}
                  </p>
                  <p>{ecran.explanation}</p>
                </div>
              )}
            </>
          )}

          {ecran.type === "fiche" && (
            <>
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
            </>
          )}

          <button type="button" onClick={() => void avancer()} disabled={enCours || !pret && ecran.type === "predire"} className="bouton bouton-principal mt-2">
            {libelleBouton}
            <span className="touche">Espace</span>
          </button>
        </div>
      </div>
    </div>
  );
}
