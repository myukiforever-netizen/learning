import Link from "next/link";
import { routes } from "@/lib/odyssee/urls";
import type { Profil } from "@/lib/supabase/odyssee";
import type { Profil as Joueur } from "@/lib/profils";

interface Props {
  profil: Profil;
  joueur: Joueur;
  serie: number;
  /** Cartes dues aujourd'hui (signaux à secourir en patrouille). */
  signaux: number;
}

/** Le tableau de bord du vaisseau : niveau, XP, série, carburant, patrouille. */
export function Hud({ profil, joueur, serie, signaux }: Props) {
  const { niveau } = profil;
  return (
    <div className="panneau p-4 flex flex-wrap items-center gap-x-6 gap-y-3">
      <Link href="/profils" className="flex items-center gap-2" title="Changer de profil">
        <span
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl"
          style={{ background: `linear-gradient(135deg, hsl(${joueur.teinte} 70% 55%), hsl(${(joueur.teinte + 40) % 360} 70% 40%))` }}
          aria-hidden="true"
        >
          {joueur.avatar}
        </span>
        <span className="font-medium">{joueur.nom}</span>
      </Link>
      <div className="flex flex-col gap-1 min-w-40 flex-1">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold">Niveau {niveau.niveau}</span>
          <span className="texte-2 text-sm">
            {niveau.xpPourSuivant === null ? `${profil.xp} XP` : `${niveau.xpDansNiveau} / ${niveau.xpPourSuivant} XP`}
          </span>
        </div>
        <div className="barre-xp" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(niveau.progression * 100)}>
          <div style={{ width: `${niveau.progression * 100}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-4 texte-2 text-sm">
        <span title="Jours d'affilée">
          <span aria-hidden="true">🔥</span> {serie}
        </span>
        <span title="Carburant">
          <span aria-hidden="true">⛽</span> {profil.carburant}
        </span>
      </div>
      <Link href={routes.patrouille()} className={`bouton text-sm ${signaux > 0 ? "bouton-principal" : ""}`}>
        Patrouille{signaux > 0 ? ` · ${signaux}` : ""}
      </Link>
    </div>
  );
}
