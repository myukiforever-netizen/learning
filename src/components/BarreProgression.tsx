interface Props {
  /** Nombre de cartes déjà traitées. */
  fait: number;
  /** Nombre total de cartes dans la file. */
  total: number;
}

/** Barre fine (4 px) en haut de la session. Jamais de score : juste « où j'en suis ». */
export function BarreProgression({ fait, total }: Props) {
  const pourcentage = total === 0 ? 0 : Math.round((fait / total) * 100);
  return (
    <div
      className="barre-progression w-full h-1 rounded-full bg-bordure overflow-hidden"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={fait}
      aria-label="Avancement de la session"
    >
      <div className="h-full bg-accent" style={{ width: `${pourcentage}%` }} />
    </div>
  );
}
