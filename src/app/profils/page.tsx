// Toujours rendu à la demande : la liste des profils change.
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { Profils } from "./Profils";
import { COOKIE_PROFIL, listerProfils, statsProfils } from "@/lib/profils";

/** « Qui explore aujourd'hui ? » : l'écran de choix de profil, à la Netflix. */
export default async function PageProfils() {
  const [profils, stats, store] = await Promise.all([listerProfils(), statsProfils(), cookies()]);
  return <Profils profils={profils} stats={stats} courantId={store.get(COOKIE_PROFIL)?.value ?? null} />;
}
