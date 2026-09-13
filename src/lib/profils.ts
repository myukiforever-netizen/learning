// Profils à la Netflix : qui explore aujourd'hui ? Le profil choisi est mémorisé dans un cookie ;
// toute la progression (révisions, réponses, planètes, XP) est rattachée à ce profil.
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { AVATARS, COOKIE_PROFIL, type Profil } from "@/lib/profils-types";

export { AVATARS, COOKIE_PROFIL, type Profil };

export async function listerProfils(): Promise<Profil[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id, name, avatar, hue").order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({ id: p.id, nom: p.name, avatar: p.avatar, teinte: p.hue }));
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

export async function creerProfil(nom: string, avatar: string, teinte: number): Promise<Profil> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .insert({ name: nom, avatar, hue: teinte })
    .select("id, name, avatar, hue")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, nom: data.name, avatar: data.avatar, teinte: data.hue };
}

export async function modifierProfil(id: string, nom: string, avatar: string, teinte: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ name: nom, avatar, hue: teinte }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Supprime le profil et toute sa progression (cascade en base). Le contenu partagé reste. */
export async function supprimerProfil(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
