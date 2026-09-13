import { apparencePlanete, palette, type Relief } from "@/lib/odyssee/planete";

interface Props {
  id: string;
  /** Diamètre en pixels. */
  taille: number;
  surcharge?: { teinte?: number; relief?: Relief };
  /** Grisée (verrouillée). */
  eteinte?: boolean;
  /** Halo lumineux (disponible / validée). */
  halo?: "aucun" | "doux" | "fort";
  className?: string;
}

/** Une planète dessinée par le code : même id, même planète partout. */
export function PlaneteSvg({ id, taille, surcharge, eteinte = false, halo = "aucun", className }: Props) {
  const a = apparencePlanete(id, surcharge);
  const p = palette(a.teinte);
  const r = 40 * a.taille;
  const uid = id.replace(/[^a-z0-9]/gi, "");

  return (
    <svg
      viewBox="-60 -60 120 120"
      width={taille}
      height={taille}
      className={className}
      aria-hidden="true"
      style={eteinte ? { filter: "grayscale(1) brightness(0.55)" } : undefined}
    >
      <defs>
        <radialGradient id={`g-${uid}`} cx="35%" cy="32%" r="75%">
          <stop offset="0%" stopColor={p.claire} />
          <stop offset="55%" stopColor={p.moyenne} />
          <stop offset="100%" stopColor={p.sombre} />
        </radialGradient>
        <clipPath id={`c-${uid}`}>
          <circle r={r} />
        </clipPath>
      </defs>

      {halo !== "aucun" && <circle r={r + (halo === "fort" ? 14 : 8)} fill={p.halo} opacity={halo === "fort" ? 1 : 0.6} />}

      {a.anneau && (
        <ellipse rx={r * 1.7} ry={r * 0.45} fill="none" stroke={p.claire} strokeOpacity="0.5" strokeWidth="4" transform={`rotate(${a.inclinaison})`} />
      )}

      <circle r={r} fill={`url(#g-${uid})`} />

      <g clipPath={`url(#c-${uid})`} transform={`rotate(${a.inclinaison})`} opacity="0.35">
        {a.relief === "gazeuse" && (
          <>
            <rect x={-r} y={-r * 0.5} width={r * 2} height={r * 0.18} fill={p.claire} />
            <rect x={-r} y={-r * 0.1} width={r * 2} height={r * 0.12} fill={p.sombre} />
            <rect x={-r} y={r * 0.3} width={r * 2} height={r * 0.2} fill={p.claire} />
          </>
        )}
        {a.relief === "rocheuse" && (
          <>
            <circle cx={-r * 0.3} cy={-r * 0.2} r={r * 0.16} fill={p.sombre} />
            <circle cx={r * 0.35} cy={r * 0.25} r={r * 0.22} fill={p.sombre} />
            <circle cx={r * 0.1} cy={-r * 0.55} r={r * 0.1} fill={p.sombre} />
          </>
        )}
        {a.relief === "glacee" && (
          <>
            <ellipse cy={-r * 0.85} rx={r * 0.8} ry={r * 0.3} fill="#ffffff" />
            <ellipse cy={r * 0.85} rx={r * 0.7} ry={r * 0.25} fill="#ffffff" />
          </>
        )}
        {a.relief === "volcanique" && (
          <>
            <path d={`M ${-r * 0.6} ${r * 0.1} q ${r * 0.3} ${-r * 0.4} ${r * 0.7} ${-r * 0.1} t ${r * 0.5} ${r * 0.2}`} stroke="#ffb347" strokeWidth={r * 0.06} fill="none" />
            <circle cx={r * 0.2} cy={r * 0.4} r={r * 0.12} fill="#ff6b3d" />
          </>
        )}
        {a.relief === "oceanique" && (
          <>
            <path d={`M ${-r * 0.7} ${-r * 0.3} q ${r * 0.4} ${r * 0.5} ${r * 0.2} ${r * 0.7}`} fill={p.claire} />
            <ellipse cx={r * 0.45} cy={-r * 0.35} rx={r * 0.22} ry={r * 0.14} fill={p.claire} />
          </>
        )}
      </g>

      {a.anneau && (
        <path
          d={`M ${-r * 1.7} 0 A ${r * 1.7} ${r * 0.45} 0 0 0 ${r * 1.7} 0`}
          fill="none"
          stroke={p.claire}
          strokeOpacity="0.7"
          strokeWidth="4"
          transform={`rotate(${a.inclinaison})`}
        />
      )}

      {Array.from({ length: a.lunes }, (_, i) => (
        <circle key={i} cx={r * 1.35 + i * 10} cy={-r * 0.9 + i * 22} r={4 - i} fill={p.claire} opacity="0.9" />
      ))}
    </svg>
  );
}
