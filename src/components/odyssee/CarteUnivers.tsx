import Link from "next/link";
import { apparenceGalaxie, palette } from "@/lib/odyssee/planete";
import type { Secteur } from "@/lib/odyssee/univers";
import { routes } from "@/lib/odyssee/urls";

interface Props {
  secteur: Secteur;
  detresse: Map<string, number>;
}

/** La carte du secteur : ses galaxies, en spirales SVG, sur une route qui serpente. */
export function CarteUnivers({ secteur, detresse }: Props) {
  const n = secteur.galaxies.length;
  const largeur = 640;
  const hauteurLigne = 170;
  const hauteur = Math.max(1, Math.ceil(n / 2)) * hauteurLigne + 40;

  return (
    <div className="panneau p-2 overflow-x-auto">
      <svg viewBox={`0 0 ${largeur} ${hauteur}`} className="w-full h-auto" role="list" aria-label="Galaxies du secteur">
        {secteur.galaxies.map((g, i) => {
          const rangee = Math.floor(i / 2);
          const gauche = i % 2 === 0;
          const cx = gauche ? 170 : 470;
          const cy = 90 + rangee * hauteurLigne;
          const a = apparenceGalaxie(g.id);
          const p = palette(a.teinte);
          const verrouillee = g.statut === "verrouillee";
          const validees = g.planetes.filter((pl) => pl.etape === "validated").length;
          const signaux = g.planetes.reduce((s, pl) => s + (detresse.get(pl.id) ?? 0), 0);
          const contenu = (
            <g transform={`translate(${cx} ${cy})`} opacity={verrouillee ? 0.45 : 1} role="listitem">
              {signaux > 0 && <circle r="44" fill="none" stroke="var(--effort)" strokeWidth="2" className="detresse" />}
              <circle r="40" fill={p.halo} />
              <g transform={`rotate(${a.inclinaison})`} fill="none" stroke={verrouillee ? "var(--texte-2)" : p.claire} strokeWidth="3" strokeLinecap="round">
                {Array.from({ length: a.bras }, (_, b) => (
                  <path key={b} d="M0 0 C 10 -8, 26 -6, 34 8 S 30 34, 12 30" transform={`rotate(${(360 / a.bras) * b})`} />
                ))}
              </g>
              <circle r="7" fill={verrouillee ? "var(--texte-2)" : p.claire} />
              {g.statut === "franchie" && <circle r="46" fill="none" stroke="var(--ok)" strokeWidth="2" />}
              <text y="66" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--texte)">
                {g.nom.length > 34 ? g.nom.slice(0, 33) + "…" : g.nom}
              </text>
              <text y="84" textAnchor="middle" fontSize="11" fill="var(--texte-2)">
                {verrouillee ? "Verrouillée" : `${validees} / ${g.planetes.length} planètes${g.statut === "franchie" ? " · soleil franchi" : ""}`}
              </text>
            </g>
          );
          if (i < n - 1) {
            const cx2 = (i + 1) % 2 === 0 ? 170 : 470;
            const cy2 = 90 + Math.floor((i + 1) / 2) * hauteurLigne;
            return (
              <g key={g.id}>
                <path d={`M ${cx} ${cy} C ${cx} ${cy + 80}, ${cx2} ${cy2 - 80}, ${cx2} ${cy2}`} fill="none" stroke="var(--bordure)" strokeWidth="2" strokeDasharray="4 8" />
                {verrouillee ? contenu : <Link href={routes.galaxie(g.id)}>{contenu}</Link>}
              </g>
            );
          }
          return <g key={g.id}>{verrouillee ? contenu : <Link href={routes.galaxie(g.id)}>{contenu}</Link>}</g>;
        })}
      </svg>
    </div>
  );
}
