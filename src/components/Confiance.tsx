import type { Confiance as NiveauConfiance } from "@/lib/types";

const NIVEAUX: { valeur: NiveauConfiance; emoji: string; libelle: string }[] = [
  { valeur: 1, emoji: "😕", libelle: "Pas sûr" },
  { valeur: 2, emoji: "😐", libelle: "Moyen" },
  { valeur: 3, emoji: "😎", libelle: "Sûr" },
];

interface Props {
  valeur: NiveauConfiance | null;
  onChoisir: (valeur: NiveauConfiance) => void;
}

/** Le mini-sélecteur de confiance : 1 tap avant chaque révélation (règle 4). */
export function Confiance({ valeur, onChoisir }: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="texte-2">Sûr de toi ?</span>
      <div className="flex gap-2" role="radiogroup" aria-label="Niveau de confiance">
        {NIVEAUX.map((niveau) => {
          const choisi = valeur === niveau.valeur;
          return (
            <button
              key={niveau.valeur}
              type="button"
              role="radio"
              aria-checked={choisi}
              aria-label={niveau.libelle}
              onClick={() => onChoisir(niveau.valeur)}
              className={`bouton emoji-confiance px-3 text-2xl ${choisi ? "est-choisi" : ""}`}
              style={choisi ? { borderColor: "var(--accent)" } : undefined}
            >
              <span aria-hidden="true">{niveau.emoji}</span>
              <span className="touche">{niveau.valeur}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
