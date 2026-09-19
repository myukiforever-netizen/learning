"use client";

// Réglages du son, dans l'écran Réglages. Propres à cet appareil, comme la taille
// du texte : on n'écoute pas pareil au casque et sur un téléphone.
import { useSon } from "./AudioProvider";

export function ReglagesAudio() {
  const { reglages, majReglages, jouer } = useSon();

  return (
    <section className="panneau p-5 flex flex-col gap-5">
      <div>
        <h2 className="font-medium">Son</h2>
        <p className="texte-2 text-sm">
          Tout est fabriqué par l&apos;app, sans aucun fichier. Ces réglages ne valent que pour cet appareil.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={reglages.effets}
          data-son="aucun"
          onChange={(e) => {
            majReglages({ effets: e.target.checked });
            if (e.target.checked) setTimeout(() => jouer("bon"), 60);
          }}
          className="mt-1 w-5 h-5 accent-[var(--accent)]"
        />
        <span>
          Effets sonores
          <span className="block texte-2 text-sm">Bonnes réponses, déblocages, décollages, clics.</span>
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={reglages.musique}
          data-son="aucun"
          onChange={(e) => majReglages({ musique: e.target.checked })}
          className="mt-1 w-5 h-5 accent-[var(--accent)]"
        />
        <span>
          Ambiance des galaxies
          <span className="block texte-2 text-sm">Un fond très discret, différent dans chaque galaxie.</span>
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="texte-2 text-sm">Volume : {Math.round(reglages.volume * 100)} %</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(reglages.volume * 100)}
          data-son="aucun"
          onChange={(e) => majReglages({ volume: Number(e.target.value) / 100 })}
          onPointerUp={() => jouer("confiance")}
          className="w-full accent-[var(--accent)]"
          aria-label="Volume"
        />
      </label>

      <button type="button" data-son="aucun" onClick={() => jouer("deblocage")} className="bouton self-start text-sm">
        Écouter un exemple
      </button>
    </section>
  );
}
