// Apparence procédurale et déterministe d'une planète ou d'une galaxie (graine = id).
// Même id → même planète partout (carte, vue galaxie, HUD). Logique pure.

export type Relief = "rocheuse" | "gazeuse" | "glacee" | "volcanique" | "oceanique";
const RELIEFS: Relief[] = ["rocheuse", "gazeuse", "glacee", "volcanique", "oceanique"];

export interface ApparencePlanete {
  teinte: number;
  relief: Relief;
  anneau: boolean;
  lunes: number;
  /** Rayon relatif, 0.8 à 1.2. */
  taille: number;
  /** Angle de départ des bandes / de l'anneau, en degrés. */
  inclinaison: number;
}

export interface ApparenceGalaxie {
  teinte: number;
  /** Nombre de bras de la spirale. */
  bras: 2 | 3 | 4;
  inclinaison: number;
}

function graine(texte: string): () => number {
  let h = 2166136261;
  for (const c of texte) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 4294967296;
  };
}

export function apparencePlanete(id: string, surcharge?: { teinte?: number; relief?: Relief }): ApparencePlanete {
  const alea = graine("planete:" + id);
  const teinte = surcharge?.teinte ?? Math.floor(alea() * 360);
  const relief = surcharge?.relief ?? RELIEFS[Math.floor(alea() * RELIEFS.length)];
  return {
    teinte,
    relief,
    anneau: alea() < 0.3,
    lunes: alea() < 0.5 ? 0 : alea() < 0.7 ? 1 : 2,
    taille: 0.8 + alea() * 0.4,
    inclinaison: Math.floor(alea() * 60) - 30,
  };
}

export function apparenceGalaxie(id: string, surcharge?: { teinte?: number }): ApparenceGalaxie {
  const alea = graine("galaxie:" + id);
  return {
    teinte: surcharge?.teinte ?? Math.floor(alea() * 360),
    bras: ([2, 3, 4] as const)[Math.floor(alea() * 3)],
    inclinaison: Math.floor(alea() * 360),
  };
}

/** Couleurs CSS (hsl) d'une teinte : claire, moyenne, sombre. */
export function palette(teinte: number): { claire: string; moyenne: string; sombre: string; halo: string } {
  return {
    claire: `hsl(${teinte} 70% 72%)`,
    moyenne: `hsl(${teinte} 60% 50%)`,
    sombre: `hsl(${teinte} 55% 22%)`,
    halo: `hsl(${teinte} 80% 60% / 0.35)`,
  };
}
