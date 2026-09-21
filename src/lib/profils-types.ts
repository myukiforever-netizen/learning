// Types, constantes et règles des profils, sans aucune dépendance serveur (utilisables côté client).

export interface Profil {
  id: string;
  nom: string;
  avatar: string;
  teinte: number;
}

/** Ce qu'un profil perdrait s'il était supprimé : affiché avant de confirmer. */
export interface StatsProfil {
  xp: number;
  planetesValidees: number;
}

/** Avatars proposés à la création (aucune image : des emojis, lisibles partout). */
export const AVATARS = ["🚀", "🛰️", "🪐", "🌙", "☄️", "🛸", "🌌", "⭐", "🔭", "👩‍🚀", "👨‍🚀", "🧑‍🚀"] as const;

export const COOKIE_PROFIL = "ancre.profil";

export const LONGUEUR_NOM_MAX = 24;

/**
 * Forme comparable d'un nom : sans accents, sans majuscules, espaces réduits.
 * « Sélmen  », « SELMEN » et « selmen » donnent tous « selmen ».
 */
export function normaliserNom(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Le profil qui porte déjà ce nom, ou null. `saufId` : le profil qu'on renomme
 * (il a le droit de garder son propre nom).
 */
export function profilAuMemeNom(nom: string, profils: Profil[], saufId?: string): Profil | null {
  const cible = normaliserNom(nom);
  if (cible === "") return null;
  return profils.find((p) => p.id !== saufId && normaliserNom(p.nom) === cible) ?? null;
}

export function messageNomPris(nom: string): string {
  return `Un profil s'appelle déjà « ${nom} ». Choisis un autre nom.`;
}

/** Fond dégradé d'un avatar, à partir de sa teinte. */
export function fondAvatar(teinte: number): string {
  return `linear-gradient(135deg, hsl(${teinte} 70% 55%), hsl(${(teinte + 40) % 360} 70% 40%))`;
}
