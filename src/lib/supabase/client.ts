// Client Supabase côté navigateur (composants "use client").
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !cle) {
    throw new Error("Supabase n'est pas configuré : renseigne .env.local (voir .env.example).");
  }
  return createBrowserClient(url, cle);
}
