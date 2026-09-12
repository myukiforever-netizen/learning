import { Confiance } from "@/components/Confiance";
import type { Carte, Confiance as NiveauConfiance } from "@/lib/types";

export type PhaseQcm = "repondre" | "confiance" | "revele";

interface Props {
  carte: Carte;
  phase: PhaseQcm;
  choix: number | null;
  confiance: NiveauConfiance | null;
  onChoisir: (index: number) => void;
  onConfiance: (valeur: NiveauConfiance) => void;
  onValider: () => void;
}

/**
 * QCM piège : je choisis (1-4) → je note ma confiance → je valide (Entrée)
 * → la bonne réponse s'affiche, et chaque piège dit pourquoi il est faux.
 */
export function Qcm({ carte, phase, choix, confiance, onChoisir, onConfiance, onValider }: Props) {
  const options = carte.options ?? [];
  const indexBon = options.indexOf(carte.answer);
  const revele = phase === "revele";

  return (
    <div className="flex flex-col gap-6">
      <p className="question">{carte.question}</p>

      <div className="flex flex-col gap-3" role="listbox" aria-label="Choix">
        {options.map((option, index) => {
          const estChoisi = choix === index;
          let classe = "bouton bouton-choix";
          if (revele) {
            if (index === indexBon) classe += " est-bon";
            else if (estChoisi) classe += " est-faux";
          } else if (estChoisi) {
            classe += " est-choisi";
          }
          const pourquoi = revele && index !== indexBon ? carte.options_why?.[index] : null;

          return (
            <div key={index} className="flex flex-col gap-1">
              <button
                type="button"
                role="option"
                aria-selected={estChoisi}
                className={classe}
                disabled={revele}
                onClick={() => onChoisir(index)}
              >
                <span className="touche">{index + 1}</span>
                <span>{option}</span>
              </button>
              {pourquoi && (
                <p className="texte-2 text-sm pl-3 anim-deplie">{pourquoi}</p>
              )}
            </div>
          );
        })}
      </div>

      {phase === "confiance" && (
        <div className="flex flex-col gap-4 anim-deplie">
          <Confiance valeur={confiance} onChoisir={onConfiance} />
          <button
            type="button"
            className="bouton bouton-principal"
            disabled={confiance === null}
            onClick={onValider}
          >
            Valider
            <span className="touche">Entrée</span>
          </button>
        </div>
      )}
    </div>
  );
}
