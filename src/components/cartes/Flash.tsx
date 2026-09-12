import { Confiance } from "@/components/Confiance";
import type { Carte, Confiance as NiveauConfiance } from "@/lib/types";

export type PhaseFlash = "confiance" | "revele";

interface Props {
  carte: Carte;
  phase: PhaseFlash;
  confiance: NiveauConfiance | null;
  onConfiance: (valeur: NiveauConfiance) => void;
  onReveler: () => void;
  onAutoEvaluation: (correct: boolean) => void;
  /** Vrai une fois la réponse auto-évaluée : on fige les boutons. */
  termine: boolean;
  correct: boolean | null;
}

/**
 * Carte Flash : je réponds dans ma tête → je note ma confiance → je révèle (Espace)
 * → je dis si j'avais bon (1) ou pas encore (2).
 */
export function Flash({
  carte,
  phase,
  confiance,
  onConfiance,
  onReveler,
  onAutoEvaluation,
  termine,
  correct,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <p className="question">{carte.question}</p>

      {phase === "confiance" && (
        <>
          <p className="texte-2">Réponds dans ta tête, puis indique ta confiance.</p>
          <Confiance valeur={confiance} onChoisir={onConfiance} />
          <button
            type="button"
            className="bouton bouton-principal"
            disabled={confiance === null}
            onClick={onReveler}
          >
            Révéler la réponse
            <span className="touche">Espace</span>
          </button>
        </>
      )}

      {phase === "revele" && (
        <div className="flex flex-col gap-5 anim-deplie">
          <div className="border-t border-bordure pt-5">
            <p className="texte-2 text-sm mb-1">Réponse</p>
            <p className="question">{carte.answer}</p>
          </div>

          {!termine && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" className="bouton" onClick={() => onAutoEvaluation(true)}>
                <span className="touche">1</span>
                J&apos;avais bon
              </button>
              <button type="button" className="bouton" onClick={() => onAutoEvaluation(false)}>
                <span className="touche">2</span>
                Pas encore
              </button>
            </div>
          )}

          {termine && correct === false && (
            <p className="texte-2 text-sm">Tu as répondu : pas encore.</p>
          )}
        </div>
      )}
    </div>
  );
}
