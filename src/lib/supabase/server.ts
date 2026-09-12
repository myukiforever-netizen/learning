// Client Supabase côté serveur (composants serveur, routes, actions).
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Vrai quand les deux clés sont présentes dans .env.local. */
export function supabaseConfigure(): boolean {
  return Boolean(URL && CLE);
}

export async function createClient() {
  if (!URL || !CLE) {
    throw new Error("Supabase n'est pas configuré : renseigne .env.local (voir .env.example).");
  }
  const cookieStore = await cookies();

  return createServerClient(URL, CLE, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un composant serveur : les cookies sont rafraîchis par proxy.ts.
        }
      },
    },
  });
}

/** L'email de l'utilisateur connecté, ou null. */
export async function emailConnecte(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}
