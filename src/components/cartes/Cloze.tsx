import { Confiance } from "@/components/Confiance";
import { lireTrous, verifierTrous } from "@/lib/cartes/verifier";
import type { Carte, Confiance as NiveauConfiance } from "@/lib/types";

export type PhaseCloze = "repondre" | "confiance" | "revele";

interface Props {
  carte: Carte;
  phase: PhaseCloze;
  trous: string[];
  confiance: NiveauConfiance | null;
  onSaisir: (index: number, valeur: string) => void;
  /** Toutes les cases sont remplies : on passe à la confiance. */
  onPret: () => void;
  onConfiance: (valeur: NiveauConfiance) => void;
  onValider: () => void;
}

/**
 * Texte à trous : je tape dans chaque case (Entrée = case suivante) → confiance → Valider.
 * Après validation, chaque case devient verte ou montre la bonne réponse.
 */
export function Cloze({ carte, phase, trous, confiance, onSaisir, onPret, onConfiance, onValider }: Props) {
  const { segments, reponses } = lireTrous(carte.question);
  const revele = phase === "revele";
  const resultats = revele ? verifierTrous(carte.question, trous) : [];
  const toutRempli = reponses.every((_, i) => (trous[i] ?? "").trim() !== "");

  return (
    <div className="flex flex-col gap-6">
      <p className="question leading-loose">
        {segments.map((segment, i) => (
          <span key={i}>
            {segment}
            {i < reponses.length && (
              <span className="inline-flex flex-col align-baseline mx-1">
                <input
                  type="text"
                  aria-label={`Trou ${i + 1}`}
                  value={trous[i] ?? ""}
                  disabled={phase !== "repondre"}
                  autoFocus={i === 0 && phase === "repondre"}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => onSaisir(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const suivante = (e.currentTarget.form?.elements ?? [])[i + 1] as HTMLElement | undefined;
                    if (i + 1 < reponses.length && suivante) suivante.focus();
                    else if (toutRempli) onPret();
                  }}
                  className="trou"
                  style={
                    revele
                      ? { borderColor: resultats[i] ? "var(--ok)" : "var(--alerte)", color: resultats[i] ? "var(--ok)" : "var(--alerte)" }
                      : undefined
                  }
                  size={Math.max(6, Math.min(24, reponses[i][0].length + 2))}
                />
                {revele && !resultats[i] && (
                  <span className="text-sm font-medium" style={{ color: "var(--ok)" }}>
                    {reponses[i][0]}
                  </span>
                )}
              </span>
            )}
          </span>
        ))}
      </p>

      {phase === "repondre" && (
        <button type="button" className="bouton bouton-principal" disabled={!toutRempli} onClick={onPret}>
          J&apos;ai rempli
          <span className="touche">Entrée</span>
        </button>
      )}

      {phase === "confiance" && (
        <div className="flex flex-col gap-4 anim-deplie">
          <Confiance valeur={confiance} onChoisir={onConfiance} />
          <button type="button" className="bouton bouton-principal" disabled={confiance === null} onClick={onValider}>
            Valider
            <span className="touche">Entrée</span>
          </button>
        </div>
      )}
    </div>
  );
}
