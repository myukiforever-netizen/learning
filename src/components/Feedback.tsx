import type { Carte } from "@/lib/types";

interface Props {
  carte: Carte;
  correct: boolean;
  /** « En savoir plus » déplié ou non (touche E). */
  plus: boolean;
  onTogglePlus: () => void;
  onSuivant: () => void;
}

/**
 * Le retour après une réponse. Bonne réponse : coche verte, on passe.
 * Mauvaise : « Pas encore » + le POURQUOI en 2 lignes + « en savoir plus ».
 */
export function Feedback({ carte, correct, plus, onTogglePlus, onSuivant }: Props) {
  return (
    <div className="mt-6 flex flex-col gap-4 anim-deplie">
      {correct ? (
        <div className="flex items-center gap-3">
          <CocheVerte />
          <span className="font-medium" style={{ color: "var(--ok)" }}>
            Bien vu.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="font-medium" style={{ color: "var(--effort)" }}>
            Pas encore. Regarde pourquoi :
          </span>
          <p>{carte.explanation}</p>
          {carte.explanation_more && (
            <>
              <button
                type="button"
                onClick={onTogglePlus}
                className="self-start underline underline-offset-4 texte-2 flex items-center gap-2"
              >
                {plus ? "Réduire" : "En savoir plus"}
                <span className="touche">E</span>
              </button>
              {plus && <p className="texte-2 anim-deplie">{carte.explanation_more}</p>}
            </>
          )}
        </div>
      )}

      <button type="button" onClick={onSuivant} className="bouton bouton-principal mt-2" autoFocus>
        Suivant
        <span className="touche">Entrée</span>
      </button>
    </div>
  );
}

function CocheVerte() {
  return (
    <svg
      className="anim-coche"
      width="32"
      height="32"
      viewBox="0 0 32 32"
      aria-hidden="true"
      fill="none"
      stroke="var(--ok)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="16" cy="16" r="14" />
      <path d="M9.5 16.5l4.5 4.5 8.5-9" />
    </svg>
  );
}
