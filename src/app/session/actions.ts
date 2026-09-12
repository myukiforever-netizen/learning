"use server";

// Actions serveur appelées depuis les composants clients de la session.
import { revalidatePath } from "next/cache";
import { CARTES_TEST } from "@/data/cartes-test";
import {
  enregistrerReponse,
  importerCartesDemo,
  terminerSession,
  type TriErreur,
} from "@/lib/supabase/requetes";
import type { Confiance, ObjectifRetention } from "@/lib/types";

export async function actionEnregistrerReponse(p: {
  sessionId: string;
  cardId: string;
  correct: boolean;
  confiance: Confiance;
  objectif: ObjectifRetention;
  premiere: boolean;
}): Promise<string> {
  return enregistrerReponse(p);
}

export async function actionTerminerSession(
  sessionId: string,
  texteRappel: string,
  tri: TriErreur[],
): Promise<{ prochaineDue: string | null }> {
  const resultat = await terminerSession(sessionId, texteRappel, tri);
  revalidatePath("/");
  return resultat;
}

export async function actionImporterDemo(): Promise<void> {
  await importerCartesDemo(CARTES_TEST);
  revalidatePath("/");
}
