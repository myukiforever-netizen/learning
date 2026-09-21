// Profils à la Netflix : qui explore aujourd'hui ? Le profil choisi est mémorisé dans un cookie ;
// toute la progression (révisions, réponses, planètes, XP) est rattachée à ce profil.
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  AVATARS,
  COOKIE_PROFIL,
  messageNomPris,
  profilAuMemeNom,
  type Profil,
  type StatsProfil,
} from "@/lib/profils-types";

export { AVATARS, COOKIE_PROFIL, type Profil };

/** Le nom demandé est déjà utilisé par un autre profil. Le message est prêt à afficher. */
export class NomDejaPris extends Error {}

/** Code Postgres d'une violation de l'index d'unicité des noms (migration 0005). */
const VIOLATION_UNICITE = "23505";

export async function listerProfils(): Promise<Profil[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id, name, avatar, hue").order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({ id: p.id, nom: p.name, avatar: p.avatar, teinte: p.hue }));
}

/** XP et planètes validées de chaque profil, pour dire ce qu'une suppression effacerait. */
export async function statsProfils(): Promise<Record<string, StatsProfil>> {
  const supabase = await createClient();
  const [progression, planetes] = await Promise.all([
    supabase.from("progression").select("profile_id, xp"),
    supabase.from("planet_progress").select("profile_id").eq("stage", "validated"),
  ]);
  if (progression.error) throw new Error(progression.error.message);
  if (planetes.error) throw new Error(planetes.error.message);

  const stats: Record<string, StatsProfil> = {};
  const de = (id: string) => (stats[id] ??= { xp: 0, planetesValidees: 0 });
  for (const p of progression.data ?? []) de(p.profile_id).xp = p.xp;
  for (const p of planetes.data ?? []) de(p.profile_id).planetesValidees += 1;
  return stats;
}

/** L'identifiant du profil choisi (cookie). Lève une erreur claire s'il manque : proxy.ts redirige avant. */
export async function profilCourantId(): Promise<string> {
  const store = await cookies();
  const id = store.get(COOKIE_PROFIL)?.value;
  if (!id) throw new Error("Aucun profil choisi.");
  return id;
}

/** Le profil choisi, ou null si le cookie pointe vers un profil supprimé. */
export async function profilCourant(): Promise<Profil | null> {
  const store = await cookies();
  const id = store.get(COOKIE_PROFIL)?.value;
  if (!id) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, name, avatar, hue").eq("id", id).maybeSingle();
  return data ? { id: data.id, nom: data.name, avatar: data.avatar, teinte: data.hue } : null;
}

/** Refuse un nom déjà pris (majuscules, accents et espaces ignorés). */
async function verifierNomLibre(nom: string, saufId?: string): Promise<void> {
  const doublon = profilAuMemeNom(nom, await listerProfils(), saufId);
  if (doublon) throw new NomDejaPris(messageNomPris(doublon.nom));
}

export async function creerProfil(nom: string, avatar: string, teinte: number): Promise<Profil> {
  await verifierNomLibre(nom);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .insert({ name: nom, avatar, hue: teinte })
    .select("id, name, avatar, hue")
    .single();
  // Deux créations presque simultanées : la base tranche (index d'unicité), on le dit simplement.
  if (error?.code === VIOLATION_UNICITE) throw new NomDejaPris(messageNomPris(nom));
  if (error) throw new Error(error.message);
  return { id: data.id, nom: data.name, avatar: data.avatar, teinte: data.hue };
}

export async function modifierProfil(id: string, nom: string, avatar: string, teinte: number): Promise<void> {
  await verifierNomLibre(nom, id);
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ name: nom, avatar, hue: teinte }).eq("id", id);
  if (error?.code === VIOLATION_UNICITE) throw new NomDejaPris(messageNomPris(nom));
  if (error) throw new Error(error.message);
}

/** Supprime le profil et toute sa progression (cascade en base). Le contenu partagé reste. */
export async function supprimerProfil(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
