"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AVATARS, COOKIE_PROFIL, creerProfil, modifierProfil, supprimerProfil } from "@/lib/profils";

const UN_AN = 60 * 60 * 24 * 365;

function lireChamps(formData: FormData): { nom: string; avatar: string; teinte: number } {
  const nom = String(formData.get("nom") ?? "").trim().slice(0, 24);
  const avatar = String(formData.get("avatar") ?? AVATARS[0]);
  const teinte = Number(formData.get("teinte"));
  if (nom.length === 0) throw new Error("Le nom du profil est vide.");
  return {
    nom,
    avatar: (AVATARS as readonly string[]).includes(avatar) ? avatar : AVATARS[0],
    teinte: Number.isInteger(teinte) && teinte >= 0 && teinte < 360 ? teinte : 240,
  };
}

async function memoriser(id: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_PROFIL, id, { path: "/", maxAge: UN_AN, sameSite: "lax" });
}

/** Choisir un profil existant → cookie → carte de l'univers. */
export async function actionChoisirProfil(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Profil inconnu.");
  await memoriser(id);
  revalidatePath("/", "layout");
  redirect("/");
}

/** Créer un profil, puis le choisir. */
export async function actionCreerProfil(formData: FormData): Promise<void> {
  const { nom, avatar, teinte } = lireChamps(formData);
  const profil = await creerProfil(nom, avatar, teinte);
  await memoriser(profil.id);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function actionModifierProfil(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const { nom, avatar, teinte } = lireChamps(formData);
  await modifierProfil(id, nom, avatar, teinte);
  revalidatePath("/profils");
}

/** Supprimer un profil et toute sa progression. Si c'était le profil courant, on oublie le cookie. */
export async function actionSupprimerProfil(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  await supprimerProfil(id);
  const store = await cookies();
  if (store.get(COOKIE_PROFIL)?.value === id) store.delete(COOKIE_PROFIL);
  revalidatePath("/", "layout");
}

/** Quitter le profil courant (retour à l'écran de choix). */
export async function actionQuitterProfil(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_PROFIL);
  revalidatePath("/", "layout");
  redirect("/profils");
}
