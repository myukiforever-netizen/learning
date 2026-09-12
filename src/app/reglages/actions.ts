"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { COOKIE_AFFICHAGE, lireAffichageDepuis, type Affichage } from "@/lib/affichage";
import { CONFIG_REVISION } from "@/lib/revision/config";
import { enregistrerQuotaNouvelles } from "@/lib/supabase/requetes";

/** Taille de texte + mode sombre → cookie (un an), propre à cet appareil. */
export async function actionEnregistrerAffichage(formData: FormData): Promise<void> {
  const affichage: Affichage = lireAffichageDepuis(
    JSON.stringify({ tailleTexte: Number(formData.get("tailleTexte")), sombre: formData.get("sombre") === "on" }),
  );
  const store = await cookies();
  store.set(COOKIE_AFFICHAGE, JSON.stringify(affichage), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

/** Quota de nouvelles cartes par jour → base (table settings). */
export async function actionEnregistrerQuota(formData: FormData): Promise<void> {
  const { quotaNouvellesMin, quotaNouvellesMax } = CONFIG_REVISION.reglages;
  const quota = Number(formData.get("quota"));
  if (!Number.isInteger(quota) || quota < quotaNouvellesMin || quota > quotaNouvellesMax) {
    throw new Error(`Le quota doit être un entier entre ${quotaNouvellesMin} et ${quotaNouvellesMax}.`);
  }
  await enregistrerQuotaNouvelles(quota);
  revalidatePath("/");
  revalidatePath("/reglages");
}
