// Protection des pages : sans connexion, tout redirige vers /connexion.
// (Next.js 16 : ce fichier remplace l'ancien middleware.ts.)
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase pas encore configuré : tout mène à l'écran d'explication.
  if (!url || !cle) {
    if (request.nextUrl.pathname.startsWith("/configuration")) return NextResponse.next();
    const destination = request.nextUrl.clone();
    destination.pathname = "/configuration";
    destination.search = "";
    return NextResponse.redirect(destination);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, cle, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Rafraîchit la session si besoin et vérifie l'utilisateur auprès de Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const chemin = request.nextUrl.pathname;
  const pagePublique = chemin.startsWith("/connexion") || chemin.startsWith("/auth/");

  if (!user && !pagePublique) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/connexion";
    destination.search = "";
    return NextResponse.redirect(destination);
  }

  if (user && chemin.startsWith("/connexion")) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/";
    destination.search = "";
    return NextResponse.redirect(destination);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
