"use server";

import { revalidatePath } from "next/cache";
import { terminerPhase, terminerSoleil, type PhasePlanete, type ResultatPhase } from "@/lib/supabase/odyssee";

export async function actionTerminerPhase(p: {
  conceptId: string;
  phase: PhasePlanete;
  score: number;
  bonnesReponses: number;
  bonnesFaciles: number;
  ecransVus?: number;
}): Promise<ResultatPhase> {
  const resultat = await terminerPhase(p);
  revalidatePath("/", "layout");
  return resultat;
}

export async function actionTerminerSoleil(p: { moduleId: string; score: number; bonnesReponses: number }): Promise<ResultatPhase> {
  const resultat = await terminerSoleil(p);
  revalidatePath("/", "layout");
  return resultat;
}
