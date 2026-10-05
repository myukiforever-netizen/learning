"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { COOKIE_LANGUE, lireLangueDepuis, type Langue } from "@/lib/langue-types";

const UN_AN = 60 * 60 * 24 * 365;

/** Mémorise la langue du contenu (par navigateur) et rafraîchit les écrans ouverts. */
export async function actionChoisirLangue(langue: Langue): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_LANGUE, lireLangueDepuis(langue), { path: "/", maxAge: UN_AN, sameSite: "lax" });
  revalidatePath("/", "layout");
}
