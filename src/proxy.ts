// Aiguillage avant chaque page : sans clés Supabase → /configuration ; sans profil choisi → /profils.
// (Next.js 16 : ce fichier remplace l'ancien middleware.ts.) Aucun appel réseau ici : un cookie suffit.
import { NextResponse, type NextRequest } from "next/server";

const COOKIE_PROFIL = "ancre.profil";

export function proxy(request: NextRequest) {
  const chemin = request.nextUrl.pathname;
  const configure = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!configure) {
    if (chemin.startsWith("/configuration")) return NextResponse.next();
    return rediriger(request, "/configuration");
  }
  if (chemin.startsWith("/configuration")) return rediriger(request, "/");

  const profilChoisi = Boolean(request.cookies.get(COOKIE_PROFIL)?.value);
  const pageProfils = chemin.startsWith("/profils");
  if (!profilChoisi && !pageProfils && !chemin.startsWith("/api/")) return rediriger(request, "/profils");

  return NextResponse.next();
}

function rediriger(request: NextRequest, chemin: string) {
  const destination = request.nextUrl.clone();
  destination.pathname = chemin;
  destination.search = "";
  return NextResponse.redirect(destination);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|favicon.ico).*)"],
};
