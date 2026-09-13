import Link from "next/link";
import { PlaneteSvg } from "./PlaneteSvg";
import { apparenceGalaxie, palette } from "@/lib/odyssee/planete";
import type { Galaxie } from "@/lib/odyssee/univers";
import { routes } from "@/lib/odyssee/urls";

const LIBELLE_ETAPE = {
  locked: "Verrouillée",
  available: "À explorer",
  discovered: "Découverte",
  understood: "Comprise",
  trained: "Entraînée",
  validated: "Validée",
} as const;

interface Props {
  galaxie: Galaxie;
  detresse: Map<string, number>;
}

/** Étoiles de fond, déterministes (graine = id de la galaxie) : mêmes étoiles à chaque visite. */
function etoilesDeFond(graine: string, hauteur: number): { x: number; y: number; r: number; d: number }[] {
  let h = 2166136261;
  for (const c of graine) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const alea = () => ((h = (Math.imul(h, 1664525) + 1013904223) >>> 0) / 4294967296);
  return Array.from({ length: 70 }, (_, i) => ({ x: alea() * 100, y: alea() * hauteur, r: 0.6 + alea() * 1.4, d: (i % 7) * 0.6 }));
}

const HAUTEUR_RANG = 168;
const MARGE_HAUT = 40;
const HAUTEUR_SOLEIL = 220;

/**
 * La galaxie comme un chemin : la planète 1 en haut, puis on descend de planète en planète
 * jusqu'au soleil. Le vaisseau attend sur la prochaine destination.
 */
export function CarteGalaxie({ galaxie, detresse }: Props) {
  const a = apparenceGalaxie(galaxie.id);
  const p = palette(a.teinte);
  const n = galaxie.planetes.length;
  const hauteur = MARGE_HAUT + n * HAUTEUR_RANG + HAUTEUR_SOLEIL;

  // Position (en %) de chaque étape : on zigzague, le soleil au centre en bas.
  const positions = galaxie.planetes.map((_, i) => ({
    x: i % 2 === 0 ? 28 : 72,
    y: MARGE_HAUT + i * HAUTEUR_RANG + 60,
  }));
  const soleil = { x: 50, y: MARGE_HAUT + n * HAUTEUR_RANG + 110 };
  const etapes = [...positions, soleil];
  const indexCourant = galaxie.planetes.findIndex((pl) => pl.etape !== "locked" && pl.etape !== "validated");
  const soleilCourant = indexCourant === -1 && galaxie.soleilAccessible && galaxie.statut !== "franchie";

  const etoiles = etoilesDeFond(galaxie.id, hauteur);

  return (
    <div className="carte-galaxie panneau" style={{ height: hauteur, "--teinte-galaxie": a.teinte } as React.CSSProperties}>
      {/* Fond : étoiles qui scintillent + chemin */}
      <svg className="carte-galaxie-fond" viewBox={`0 0 100 ${hauteur}`} preserveAspectRatio="none" aria-hidden="true">
        {etoiles.map((e, i) => (
          <circle key={i} cx={e.x} cy={e.y} r={e.r * 0.3} fill="#fff" className="etoile" style={{ animationDelay: `${e.d}s` }} vectorEffect="non-scaling-stroke" />
        ))}
        {etapes.slice(0, -1).map((de, i) => {
          const vers = etapes[i + 1];
          const my = (de.y + vers.y) / 2;
          const versCourant = i + 1 === indexCourant || (soleilCourant && i === n - 1);
          const fait = i < indexCourant || (indexCourant === -1 && (galaxie.statut === "franchie" || galaxie.soleilAccessible));
          return (
            <path
              key={i}
              d={`M ${de.x} ${de.y} C ${de.x} ${my}, ${vers.x} ${my}, ${vers.x} ${vers.y}`}
              fill="none"
              stroke={fait ? "var(--ok)" : versCourant ? "var(--accent)" : "var(--bordure)"}
              strokeWidth={fait || versCourant ? 3 : 2}
              strokeDasharray={fait ? "0" : "6 10"}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className={versCourant ? "chemin-courant" : undefined}
              opacity={fait || versCourant ? 0.9 : 0.5}
            />
          );
        })}
      </svg>

      {/* Les planètes */}
      {galaxie.planetes.map((pl, i) => {
        const pos = positions[i];
        const verrouillee = pl.etape === "locked";
        const validee = pl.etape === "validated";
        const courante = i === indexCourant;
        const signaux = detresse.get(pl.id) ?? 0;
        const taille = 88;
        const contenu = (
          <>
            <div className="planete-flotte" style={{ animationDelay: `${(i % 5) * 0.7}s` }}>
              {signaux > 0 && <span className="planete-signal detresse" aria-hidden="true" />}
              <PlaneteSvg id={pl.id} taille={taille} eteinte={verrouillee} halo={validee ? "fort" : courante ? "fort" : verrouillee ? "aucun" : "doux"} />
              {courante && (
                <span className="planete-vaisseau" aria-hidden="true">
                  🚀
                </span>
              )}
              {verrouillee && (
                <span className="planete-badge" aria-hidden="true">
                  🔒
                </span>
              )}
              {validee && (
                <span className="planete-badge est-validee" aria-hidden="true">
                  ✓
                </span>
              )}
            </div>
            <span className="planete-nom">
              {i + 1}. {pl.nom}
            </span>
            <span className="planete-etat" style={{ color: validee ? "var(--ok)" : courante ? "var(--accent)" : "var(--texte-2)" }}>
              {courante ? "Tu es ici" : LIBELLE_ETAPE[pl.etape]}
              {validee && pl.meilleurScore > 0 ? ` · ${pl.meilleurScore} %` : ""}
              {signaux > 0 ? ` · ${signaux} signal${signaux > 1 ? "aux" : ""}` : ""}
            </span>
          </>
        );
        const style = { left: `${pos.x}%`, top: pos.y } as React.CSSProperties;
        return verrouillee ? (
          <div key={pl.id} className="planete-etape est-verrouillee" style={style} aria-label={`${pl.nom}, verrouillée`}>
            {contenu}
          </div>
        ) : (
          <Link key={pl.id} href={routes.planete(pl.id)} className="planete-etape" style={style}>
            {contenu}
          </Link>
        );
      })}

      {/* Le soleil */}
      {(() => {
        const accessible = galaxie.soleilAccessible || galaxie.statut === "franchie";
        const style = { left: `${soleil.x}%`, top: soleil.y } as React.CSSProperties;
        const contenu = (
          <>
            <div className={`soleil ${accessible ? "est-actif" : ""}`} style={{ "--soleil-couleur": p.claire, "--soleil-halo": p.halo } as React.CSSProperties}>
              <span className="soleil-rayons" aria-hidden="true" />
              <span className="soleil-coeur" aria-hidden="true" />
              {soleilCourant && (
                <span className="planete-vaisseau" aria-hidden="true">
                  🚀
                </span>
              )}
            </div>
            <span className="planete-nom">Le soleil</span>
            <span className="planete-etat" style={{ color: galaxie.statut === "franchie" ? "var(--ok)" : accessible ? "var(--accent)" : "var(--texte-2)" }}>
              {galaxie.statut === "franchie"
                ? `Franchi · ${galaxie.scoreSoleil} %`
                : accessible
                  ? "Épreuve finale"
                  : `${galaxie.planetes.filter((pl) => pl.etape === "validated").length} / ${n} planètes validées`}
            </span>
          </>
        );
        return accessible ? (
          <Link href={routes.soleil(galaxie.id)} className="planete-etape" style={style}>
            {contenu}
          </Link>
        ) : (
          <div className="planete-etape est-verrouillee" style={style} aria-label="Soleil, pas encore accessible">
            {contenu}
          </div>
        );
      })()}
    </div>
  );
}
