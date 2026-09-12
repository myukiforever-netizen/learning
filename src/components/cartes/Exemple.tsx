import { Confiance } from "@/components/Confiance";
import type { Carte, Confiance as NiveauConfiance } from "@/lib/types";

export type PhaseExemple = "repondre" | "confiance" | "revele";

interface Props {
  carte: Carte;
  phase: PhaseExemple;
  /** Nombre d'étapes déjà dépliées. */
  depliees: number;
  /** faded_example : ce que l'utilisateur écrit pour les étapes cachées. */
  texte: string;
  confiance: NiveauConfiance | null;
  onDeplier: () => void;
  onSaisir: (texte: string) => void;
  onPret: () => void;
  onConfiance: (valeur: NiveauConfiance) => void;
  onReveler: () => void;
  onAutoEvaluation: (correct: boolean) => void;
  termine: boolean;
  correct: boolean | null;
}

/**
 * Exemple résolu : chaque étape se déplie au tap (Espace), après une mini-question.
 * Exemple à trous (faded_example) : les dernières étapes sont cachées, je les écris moi-même,
 * puis je compare avec la solution.
 * Dans les deux cas : confiance → je révèle → j'avais bon / pas encore.
 */
export function Exemple({
  carte,
  phase,
  depliees,
  texte,
  confiance,
  onDeplier,
  onSaisir,
  onPret,
  onConfiance,
  onReveler,
  onAutoEvaluation,
  termine,
  correct,
}: Props) {
  const steps = carte.data?.steps ?? [];
  const cachees = carte.type === "faded_example" ? Math.min(Math.max(carte.data?.hidden ?? 1, 1), steps.length - 1) : 0;
  const visibles = steps.length - cachees;
  const revele = phase === "revele";
  const toutDeplie = depliees >= visibles;

  return (
    <div className="flex flex-col gap-6">
      <p className="question">{carte.question}</p>

      <ol className="flex flex-col gap-3">
        {steps.map((etape, i) => {
          const estCachee = i >= visibles;
          const estDepliee = i < depliees;
          const estProchaine = i === depliees && !estCachee && phase === "repondre";

          if (estCachee && !revele) {
            return (
              <li key={i} className="rounded-xl border border-dashed border-bordure p-4 texte-2">
                <span className="touche mr-2">{i + 1}</span>À toi : cette étape est cachée.
              </li>
            );
          }
          if (estDepliee || revele) {
            return (
              <li key={i} className={`rounded-xl border border-bordure p-4 ${estCachee ? "bg-fond" : ""} anim-deplie`}>
                <span className="touche mr-2">{i + 1}</span>
                {etape.text}
              </li>
            );
          }
          if (estProchaine) {
            return (
              <li key={i} className="rounded-xl border border-bordure p-4 flex flex-col gap-3">
                <p className="texte-2">{etape.prompt ?? "Que faut-il faire ensuite ? Réponds dans ta tête."}</p>
                <button type="button" className="bouton self-start" onClick={onDeplier}>
                  Voir l&apos;étape {i + 1}
                  <span className="touche">Espace</span>
                </button>
              </li>
            );
          }
          return (
            <li key={i} className="rounded-xl border border-bordure p-4 texte-2" aria-hidden="true">
              <span className="touche mr-2">{i + 1}</span>…
            </li>
          );
        })}
      </ol>

      {cachees > 0 && !revele && toutDeplie && (
        <textarea
          className="w-full rounded-xl border border-bordure bg-fond p-4 min-h-28 outline-none focus:border-accent"
          aria-label="Les étapes cachées, écrites par toi"
          placeholder={`Écris ${cachees > 1 ? `les ${cachees} dernières étapes` : "la dernière étape"}.`}
          value={texte}
          disabled={phase !== "repondre"}
          autoFocus
          onChange={(e) => onSaisir(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && texte.trim() !== "") {
              e.preventDefault();
              onPret();
            }
          }}
        />
      )}

      {phase === "repondre" && toutDeplie && (
        <button
          type="button"
          className="bouton bouton-principal"
          disabled={cachees > 0 && texte.trim() === ""}
          onClick={onPret}
        >
          {cachees > 0 ? "J'ai écrit" : "J'ai tout suivi"}
          <span className="touche">Entrée</span>
        </button>
      )}

      {phase === "confiance" && (
        <div className="flex flex-col gap-4 anim-deplie">
          <Confiance valeur={confiance} onChoisir={onConfiance} />
          <button type="button" className="bouton bouton-principal" disabled={confiance === null} onClick={onReveler}>
            {cachees > 0 ? "Comparer avec la solution" : "Vérifier"}
            <span className="touche">Espace</span>
          </button>
        </div>
      )}

      {revele && (
        <div className="flex flex-col gap-5 anim-deplie">
          {cachees > 0 && (
            <div className="rounded-xl border border-bordure bg-fond p-4">
              <p className="texte-2 text-sm mb-1">Ce que tu as écrit</p>
              <p className="whitespace-pre-wrap">{texte}</p>
            </div>
          )}
          <div className="border-t border-bordure pt-5">
            <p className="texte-2 text-sm mb-1">{cachees > 0 ? "À retenir" : "Sans regarder, peux-tu refaire ?"}</p>
            <p className="question">{carte.answer}</p>
          </div>
          {!termine && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" className="bouton" onClick={() => onAutoEvaluation(true)}>
                <span className="touche">1</span>
                {cachees > 0 ? "J'avais l'essentiel" : "Oui, je saurais refaire"}
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
