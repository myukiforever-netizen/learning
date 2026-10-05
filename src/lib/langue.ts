// Langue choisie (cookie, par navigateur). Côté serveur uniquement (lit les cookies).
import { cookies } from "next/headers";
import { COOKIE_LANGUE, lireLangueDepuis, type Langue } from "./langue-types";

export { COOKIE_LANGUE, type Langue };

export async function lireLangue(): Promise<Langue> {
  const store = await cookies();
  return lireLangueDepuis(store.get(COOKIE_LANGUE)?.value);
}
