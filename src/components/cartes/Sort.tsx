import { Confiance } from "@/components/Confiance";
import { verifierClassement, verifierOrdre } from "@/lib/cartes/verifier";
import type { Carte, Confiance as NiveauConfiance } from "@/lib/types";

export type PhaseSort = "repondre" | "confiance" | "revele";

interface Props {
  carte: Carte;
  phase: PhaseSort;
  /** Mode classer : catégorie choisie pour chaque élément (null = pas encore). */
  classement: (string | null)[];
  /** Mode ordonner : index des éléments dans l'ordre choisi. */
  ordre: number[];
  /** Mode ordonner : ordre d'affichage mélangé des éléments (index dans items). */
  melange: number[];
  confiance: NiveauConfiance | null;
  onClasser: (index: number, categorie: string) => void;
  onPlacer: (index: number) => void;
  onRecommencer: () => void;
  onPret: () => void;
  onConfiance: (valeur: NiveauConfiance) => void;
  onValider: () => void;
}

function texteItem(item: { text: string; category: string } | string): string {
  return typeof item === "string" ? item : item.text;
}

/**
 * Classer : pour chaque élément, je choisis sa catégorie (touches 1-4).
 * Ordonner : je clique les éléments dans l'ordre (touches 1-8), « Recommencer » pour refaire.
 * Puis confiance → Valider → chaque élément passe en vert ou montre la bonne réponse.
 */
export function Sort(p: Props) {
  const { carte, phase, confiance, onConfiance, onValider, onPret } = p;
  const mode = carte.data?.mode ?? "classer";
  const items = carte.data?.items ?? [];
  const revele = phase === "revele";

  return (
    <div className="flex flex-col gap-6">
      <p className="question">{carte.question}</p>

      {mode === "classer" ? <Classer {...p} revele={revele} /> : <Ordonner {...p} revele={revele} />}

      {phase === "repondre" && (
        <button
          type="button"
          className="bouton bouton-principal"
          disabled={mode === "classer" ? p.classement.some((c) => c === null) || p.classement.length < items.length : p.ordre.length < items.length}
          onClick={onPret}
        >
          J&apos;ai fini
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

function Classer({ carte, phase, classement, onClasser, revele }: Props & { revele: boolean }) {
  const categories = carte.data?.categories ?? [];
  const items = carte.data?.items ?? [];
  const resultats = revele ? verifierClassement(carte, classement) : [];
  const enCours = classement.findIndex((c) => c === null);
  const indexActif = enCours === -1 ? (classement.length < items.length ? classement.length : -1) : enCours;

  return (
    <ol className="flex flex-col gap-3">
      {items.map((item, i) => {
        const choisi = classement[i] ?? null;
        const actif = phase === "repondre" && i === indexActif;
        const bon = typeof item === "string" ? "" : item.category;
        return (
          <li
            key={i}
            className="rounded-xl border p-4 flex flex-col gap-3"
            style={{
              borderColor: revele ? (resultats[i] ? "var(--ok)" : "var(--alerte)") : actif ? "var(--accent)" : "var(--bordure)",
            }}
          >
            <span>{texteItem(item)}</span>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat, k) => {
                const estChoisi = choisi === cat;
                let style: React.CSSProperties | undefined;
                if (revele && cat === bon) style = { borderColor: "var(--ok)", boxShadow: "inset 0 0 0 1px var(--ok)" };
                else if (estChoisi) style = { borderColor: revele ? "var(--alerte)" : "var(--accent)", boxShadow: `inset 0 0 0 1px ${revele ? "var(--alerte)" : "var(--accent)"}` };
                return (
                  <button
                    key={cat}
                    type="button"
                    className="bouton text-sm"
                    style={style}
                    disabled={phase !== "repondre"}
                    onClick={() => onClasser(i, cat)}
                    aria-pressed={estChoisi}
                  >
                    {actif && <span className="touche">{k + 1}</span>}
                    {cat}
                  </button>
                );
              })}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Ordonner({ carte, phase, ordre, melange, onPlacer, onRecommencer, revele }: Props & { revele: boolean }) {
  const items = carte.data?.items ?? [];
  const resultats = revele ? verifierOrdre(carte, ordre) : [];

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-2" aria-label="Ton ordre">
        {ordre.map((indexItem, position) => (
          <li
            key={indexItem}
            className="rounded-xl border p-3 flex items-center gap-3"
            style={{ borderColor: revele ? (resultats[position] ? "var(--ok)" : "var(--alerte)") : "var(--bordure)" }}
          >
            <span className="touche">{position + 1}</span>
            <span>{texteItem(items[indexItem])}</span>
            {revele && !resultats[position] && (
              <span className="texte-2 text-sm ml-auto">
                → {texteItem(items[position])}
              </span>
            )}
          </li>
        ))}
      </ol>

      {!revele && ordre.length < items.length && (
        <div className="flex flex-col gap-2">
          <p className="texte-2 text-sm">Clique dans l&apos;ordre :</p>
          <div className="flex flex-wrap gap-2">
            {melange
              .filter((i) => !ordre.includes(i))
              .map((i, k) => (
                <button
                  key={i}
                  type="button"
                  className="bouton text-sm"
                  disabled={phase !== "repondre"}
                  onClick={() => onPlacer(i)}
                >
                  <span className="touche">{k + 1}</span>
                  {texteItem(items[i])}
                </button>
              ))}
          </div>
        </div>
      )}

      {phase === "repondre" && ordre.length > 0 && (
        <button type="button" className="texte-2 text-sm underline underline-offset-4 self-start" onClick={onRecommencer}>
          Recommencer
        </button>
      )}
    </div>
  );
}
