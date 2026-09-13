// Client Supabase côté serveur (composants serveur, routes, actions). Sans compte utilisateur :
// le serveur parle à la base avec la clé secrète si elle est fournie (SUPABASE_SECRET_KEY,
// jamais envoyée au navigateur), sinon avec la clé publique.
import { createClient as creerClientSupabase, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLE_PUBLIQUE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CLE_SECRETE = process.env.SUPABASE_SECRET_KEY;

/** Vrai quand l'URL et la clé publique sont présentes dans .env.local. */
export function supabaseConfigure(): boolean {
  return Boolean(URL && CLE_PUBLIQUE);
}

let client: SupabaseClient | null = null;

export async function createClient(): Promise<SupabaseClient> {
  if (!URL || !CLE_PUBLIQUE) {
    throw new Error("Supabase n'est pas configuré : renseigne .env.local (voir .env.example).");
  }
  if (!client) {
    client = creerClientSupabase(URL, CLE_SECRETE || CLE_PUBLIQUE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
