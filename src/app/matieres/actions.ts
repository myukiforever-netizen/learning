"use server";

import { revalidatePath } from "next/cache";
import { MATIERES_LIVREES } from "@/data/matieres";
import { type ResultatFusion } from "@/lib/import/fusionner";
import { validerMatiere, type MatiereJson } from "@/lib/import/schema";
import { apercuImport, basculerPause, importerMatiere } from "@/lib/supabase/requetes";

export interface Apercu {
  nouvelles: number;
  modifiees: number;
  inchangees: number;
  archivees: number;
}

function resumer(f: ResultatFusion): Apercu {
  return {
    nouvelles: f.nouvelles.length,
    modifiees: f.modifiees.length,
    inchangees: f.inchangees.length,
    archivees: f.archivees.length,
  };
}

/** Étape 2 de l'import : le fichier est valide, on montre ce qui changerait. */
export async function actionApercuImport(json: unknown): Promise<{ erreurs: string[]; apercu: Apercu | null }> {
  const erreurs = validerMatiere(json);
  if (erreurs.length > 0) return { erreurs, apercu: null };
  return { erreurs: [], apercu: resumer(await apercuImport(json as MatiereJson)) };
}

/** Étape 3 : confirmation → import réel. */
export async function actionImporterMatiere(json: unknown): Promise<{ erreurs: string[]; apercu: Apercu | null }> {
  const erreurs = validerMatiere(json);
  if (erreurs.length > 0) return { erreurs, apercu: null };
  const fusion = await importerMatiere(json as MatiereJson);
  revalidatePath("/");
  revalidatePath("/matieres");
  return { erreurs: [], apercu: resumer(fusion) };
}

/** Charge une matière livrée avec l'app (formulaire serveur). */
export async function actionChargerMatiereLivree(formData: FormData): Promise<void> {
  const id = formData.get("id");
  const matiere = MATIERES_LIVREES.find((m) => m.id === id);
  if (!matiere) throw new Error("Matière inconnue.");
  await importerMatiere(matiere);
  revalidatePath("/");
  revalidatePath("/matieres");
}

export async function actionBasculerPause(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string") throw new Error("Matière inconnue.");
  await basculerPause(id);
  revalidatePath("/");
  revalidatePath("/matieres");
}
