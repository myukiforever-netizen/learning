"use client";

// Écran de fin d'une phase de planète (compréhension, entraînement, mission) ou d'un soleil :
// enregistre le résultat, affiche le score (seulement maintenant), les XP, le déblocage.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { actionTerminerPhase, actionTerminerSoleil } from "@/app/planete/actions";
import { scoreDe } from "@/lib/odyssee/composer";
import { CONFIG_REVISION } from "@/lib/revision/config";
import type { ResultatPhase } from "@/lib/supabase/odyssee";
import type { Carte, ReponseSession } from "@/lib/types";

export type ModePhase = "comprehension" | "entrainement" | "mission" | "soleil";

interface Props {
  mode: ModePhase;
  /** Planète (phases) ou galaxie (soleil). */
  cibleId: string;
  cartes: Carte[];
  reponses: ReponseSession[];
  /** Où retourner (vue planète ou vue galaxie). */
  retourHref: string;
  rejouerHref: string;
  /** Attend que toutes les réponses soient en base avant d'enregistrer. */
  attendreEnregistrements: () => Promise<void>;
}

const TITRES: Record<ModePhase, { reussi: string; rate: string }> = {
  comprehension: { reussi: "Laboratoire terminé", rate: "Laboratoire terminé" },
  entrainement: { reussi: "Entraînement terminé", rate: "Entraînement terminé" },
  mission: { reussi: "Mission accomplie : planète validée", rate: "Mission à refaire" },
  soleil: { reussi: "Soleil franchi : galaxie terminée", rate: "Le soleil résiste encore" },
};

export function FinDePhase({ mode, cibleId, cartes, reponses, retourHref, rejouerHref, attendreEnregistrements }: Props) {
  const [resultat, setResultat] = useState<ResultatPhase | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const lance = useRef(false);

  const score = scoreDe(reponses);
  const premieres = new Map<string, ReponseSession>();
  for (const r of reponses) if (!premieres.has(r.card_id)) premieres.set(r.card_id, r);
  const bonnes = [...premieres.values()].filter((r) => r.correct);
  const bonnesFaciles = bonnes.filter((r) => r.confidence === 3).length;
  const ratees = cartes.filter((c) => premieres.get(c.id)?.correct === false);
  const seuil = mode === "soleil" ? CONFIG_REVISION.odyssee.seuilSoleil : CONFIG_REVISION.odyssee.seuilMission;

  useEffect(() => {
    if (lance.current) return;
    lance.current = true;
    (async () => {
      try {
        await attendreEnregistrements();
        const r =
          mode === "soleil"
            ? await actionTerminerSoleil({ moduleId: cibleId, score, bonnesReponses: bonnes.length })
            : await actionTerminerPhase({ conceptId: cibleId, phase: mode, score, bonnesReponses: bonnes.length, bonnesFaciles });
        setResultat(r);
      } catch (e: unknown) {
        setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
      }
    })();
  }, [mode, cibleId, score, bonnes.length, bonnesFaciles, attendreEnregistrements]);

  const evaluee = mode === "mission" || mode === "soleil";
  const reussi = resultat ? resultat.reussie : score >= seuil;
  const titre = TITRES[mode][reussi ? "reussi" : "rate"];

  return (
    <div className="flex-1 flex flex-col justify-center">
      <div className="anim-fin panneau overflow-hidden">
        <div className="h-1.5" style={{ background: reussi ? "var(--ok)" : "var(--effort)" }} aria-hidden="true" />
        <div className="p-8 flex flex-col items-center text-center gap-6">
          <h1 className="text-2xl font-semibold">{titre}</h1>

          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-semibold" style={{ color: reussi ? "var(--ok)" : "var(--effort)" }}>
              {Math.round(score * 100)} %
            </span>
            <span className="texte-2">
              {bonnes.length} / {premieres.size} au premier essai
            </span>
          </div>

          {evaluee && !reussi && (
            <p className="texte-2">
              Il faut {Math.round(seuil * 100)} % pour {mode === "soleil" ? "franchir le soleil" : "valider la planète"}. Les cartes ratées
              reviendront en patrouille, et tu peux retenter tout de suite.
            </p>
          )}

          {ratees.length > 0 && (
            <div className="w-full text-left">
              <p className="texte-2 text-sm mb-2">Ce qui vacille :</p>
              <ul className="flex flex-col gap-1">
                {ratees.slice(0, 5).map((c) => (
                  <li key={c.id} className="text-sm">
                    · {c.question}
                  </li>
                ))}
                {ratees.length > 5 && <li className="texte-2 text-sm">… et {ratees.length - 5} autres.</li>}
              </ul>
            </div>
          )}

          {resultat ? (
            <div className="flex flex-col gap-1">
              <p>
                <span className="font-semibold" style={{ color: "var(--accent)" }}>
                  +{resultat.xpGagne} XP
                </span>
                {resultat.niveauApres > resultat.niveauAvant && (
                  <span className="ml-2 font-medium" style={{ color: "var(--ok)" }}>
                    Niveau {resultat.niveauApres} atteint
                  </span>
                )}
              </p>
            </div>
          ) : erreur ? (
            <p className="texte-2 text-sm">Enregistrement impossible : {erreur}</p>
          ) : (
            <p className="texte-2 text-sm">Enregistrement…</p>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <Link href={retourHref} className="bouton bouton-principal">
              {mode === "soleil" ? "Retour à la galaxie" : "Retour à la planète"}
            </Link>
            <Link href={rejouerHref} className="bouton">
              {evaluee && !reussi ? "Retenter" : "Rejouer"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
