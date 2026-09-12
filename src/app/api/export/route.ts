// Téléchargement JSON : ?matiere=<id> (fichier réimportable) ou ?tout=1 (toutes les tables).
import { NextResponse } from "next/server";
import { exporterMatiere, exporterTout } from "@/lib/supabase/requetes";
import { supabaseConfigure } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!supabaseConfigure()) {
    return NextResponse.json({ erreur: "Supabase n'est pas configuré." }, { status: 400 });
  }
  const { searchParams } = new URL(request.url);
  const matiereId = searchParams.get("matiere");
  const date = new Date().toISOString().slice(0, 10);

  if (matiereId) {
    const matiere = await exporterMatiere(matiereId);
    if (!matiere) return NextResponse.json({ erreur: "Matière introuvable." }, { status: 404 });
    return reponseJson(matiere, `${matiere.id}_v${matiere.version}.json`);
  }

  return reponseJson(await exporterTout(), `ancre_export_${date}.json`);
}

function reponseJson(contenu: unknown, nomFichier: string) {
  return new NextResponse(JSON.stringify(contenu, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomFichier}"`,
    },
  });
}
