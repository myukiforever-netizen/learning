"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SECTEUR } from "@/lib/secteur";

const UN_AN = 60 * 60 * 24 * 365;

/** Change le secteur (matière) affiché sur la carte de l'univers, puis revient à l'accueil. */
export async function actionChoisirSecteur(formData: FormData): Promise<void> {
  const id = String(formData.get("secteur") ?? "");
  if (id) {
    const store = await cookies();
    store.set(COOKIE_SECTEUR, id, { path: "/", maxAge: UN_AN, sameSite: "lax" });
  }
  redirect("/");
}
