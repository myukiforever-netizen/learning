"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AVATARS, COOKIE_PROFIL, NomDejaPris, creerProfil, modifierProfil, supprimerProfil, type Profil } from "@/lib/profils";
import { LONGUEUR_NOM_MAX } from "@/lib/profils-types";

const UN_AN = 60 * 60 * 24 * 365;

/** Réponse des formulaires de profil : un message à afficher, ou rien si tout va bien. */
export interface ResultatProfil {
  erreur: string | null;
}

interface Champs {
  nom: string;
  avatar: string;
  teinte: number;
}

/** Lit et nettoie le formulaire. Renvoie un message d'erreur si le nom est vide. */
function lireChamps(formData: FormData): Champs | string {
  const nom = String(formData.get("nom") ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LONGUEUR_NOM_MAX);
  if (nom.length === 0) return "Donne un nom au profil.";
  const avatar = String(formData.get("avatar") ?? AVATARS[0]);
  const teinte = Number(formData.get("teinte"));
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

/** Créer un profil, puis le choisir. Un nom déjà pris est refusé avec un message clair. */
export async function actionCreerProfil(formData: FormData): Promise<ResultatProfil> {
  const champs = lireChamps(formData);
  if (typeof champs === "string") return { erreur: champs };

  let profil: Profil;
  try {
    profil = await creerProfil(champs.nom, champs.avatar, champs.teinte);
  } catch (e: unknown) {
    if (e instanceof NomDejaPris) return { erreur: e.message };
    throw e;
  }
  await memoriser(profil.id);
  revalidatePath("/", "layout");
  redirect("/");
}

/** Renommer ou changer l'avatar d'un profil. Un nom déjà pris est refusé avec un message clair. */
export async function actionModifierProfil(formData: FormData): Promise<ResultatProfil> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { erreur: "Profil inconnu." };
  const champs = lireChamps(formData);
  if (typeof champs === "string") return { erreur: champs };

  try {
    await modifierProfil(id, champs.nom, champs.avatar, champs.teinte);
  } catch (e: unknown) {
    if (e instanceof NomDejaPris) return { erreur: e.message };
    throw e;
  }
  revalidatePath("/", "layout");
  return { erreur: null };
}

/**
 * Supprimer un profil et toute sa progression. Si c'était le profil en cours sur cet
 * appareil, on oublie le cookie et on revient à l'écran de choix.
 */
export async function actionSupprimerProfil(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Profil inconnu.");
  await supprimerProfil(id);

  const store = await cookies();
  const etaitCourant = store.get(COOKIE_PROFIL)?.value === id;
  if (etaitCourant) store.delete(COOKIE_PROFIL);
  revalidatePath("/", "layout");
  if (etaitCourant) redirect("/profils");
}
