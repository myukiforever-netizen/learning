import { Confiance } from "@/components/Confiance";
import type { Carte, Confiance as NiveauConfiance } from "@/lib/types";

export type PhaseLibre = "repondre" | "confiance" | "revele";

interface Props {
  carte: Carte;
  phase: PhaseLibre;
  texte: string;
  confiance: NiveauConfiance | null;
  onSaisir: (texte: string) => void;
  /** Le texte est écrit : on passe à la confiance. */
  onPret: () => void;
  onConfiance: (valeur: NiveauConfiance) => void;
  onReveler: () => void;
  onAutoEvaluation: (correct: boolean) => void;
  termine: boolean;
  correct: boolean | null;
  /** Ce qu'on demande d'écrire (« Explique en une phrase… »). */
  consigne: string;
}

/**
 * Réponse libre auto-évaluée (Pourquoi ?, Et si ?, Problème) :
 * j'écris → confiance → je compare avec la réponse modèle → j'avais bon / pas encore.
 */
export function Libre({
  carte,
  phase,
  texte,
  confiance,
  onSaisir,
  onPret,
  onConfiance,
  onReveler,
  onAutoEvaluation,
  termine,
  correct,
  consigne,
}: Props) {
  const revele = phase === "revele";

  return (
    <div className="flex flex-col gap-6">
      <p className="question">{carte.question}</p>

      {!revele && (
        <>
          <textarea
            className="w-full rounded-xl border border-bordure bg-fond p-4 min-h-28 outline-none focus:border-accent"
            aria-label="Ta réponse"
            placeholder={consigne}
            value={texte}
            disabled={phase !== "repondre"}
            autoFocus={phase === "repondre"}
            onChange={(e) => onSaisir(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && texte.trim() !== "") {
                e.preventDefault();
                onPret();
              }
            }}
          />
          {phase === "repondre" && (
            <button type="button" className="bouton bouton-principal" disabled={texte.trim() === ""} onClick={onPret}>
              J&apos;ai écrit
              <span className="touche">Entrée</span>
            </button>
          )}
          {phase === "confiance" && (
            <div className="flex flex-col gap-4 anim-deplie">
              <Confiance valeur={confiance} onChoisir={onConfiance} />
              <button type="button" className="bouton bouton-principal" disabled={confiance === null} onClick={onReveler}>
                Comparer avec la réponse
                <span className="touche">Espace</span>
              </button>
            </div>
          )}
        </>
      )}

      {revele && (
        <div className="flex flex-col gap-5 anim-deplie">
          <div className="rounded-xl border border-bordure bg-fond p-4">
            <p className="texte-2 text-sm mb-1">Ta réponse</p>
            <p className="whitespace-pre-wrap">{texte}</p>
          </div>
          <div className="border-t border-bordure pt-5">
            <p className="texte-2 text-sm mb-1">Réponse modèle</p>
            <p className="question">{carte.answer}</p>
          </div>

          {!termine && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" className="bouton" onClick={() => onAutoEvaluation(true)}>
                <span className="touche">1</span>
                J&apos;avais l&apos;essentiel
              </button>
              <button type="button" className="bouton" onClick={() => onAutoEvaluation(false)}>
                <span className="touche">2</span>
                Pas encore
              </button>
            </div>
          )}
          {termine && correct === false && <p className="texte-2 text-sm">Tu as répondu : pas encore.</p>}
        </div>
      )}
    </div>
  );
}
