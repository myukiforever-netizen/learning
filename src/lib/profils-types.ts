// Types et constantes des profils, sans aucune dépendance serveur (utilisables côté client).

export interface Profil {
  id: string;
  nom: string;
  avatar: string;
  teinte: number;
}

/** Avatars proposés à la création (aucune image : des emojis, lisibles partout). */
export const AVATARS = ["🚀", "🛰️", "🪐", "🌙", "☄️", "🛸", "🌌", "⭐", "🔭", "👩‍🚀", "👨‍🚀", "🧑‍🚀"] as const;

export const COOKIE_PROFIL = "ancre.profil";
