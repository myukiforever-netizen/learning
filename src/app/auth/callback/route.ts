// Point d'arrivée du lien magique envoyé par email.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/connexion?erreur=lien-invalide`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/connexion?erreur=lien-invalide`);
  }

  // Un seul utilisateur autorisé : tout autre email est déconnecté immédiatement.
  const autorise = process.env.ALLOWED_EMAIL?.trim().toLowerCase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();

  if (autorise && email !== autorise) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/connexion?erreur=non-autorise`);
  }

  return NextResponse.redirect(`${origin}/`);
}
