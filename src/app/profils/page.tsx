// Toujours rendu à la demande : la liste des profils change.
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { Profils } from "./Profils";
import { COOKIE_PROFIL, listerProfils } from "@/lib/profils";

/** « Qui explore aujourd'hui ? » : l'écran de choix de profil, à la Netflix. */
export default async function PageProfils() {
  const [profils, store] = await Promise.all([listerProfils(), cookies()]);
  return <Profils profils={profils} courantId={store.get(COOKIE_PROFIL)?.value ?? null} />;
}
