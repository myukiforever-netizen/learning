// Les matières livrées avec l'app (chargées depuis l'écran « Matières »).
import type { MatiereJson } from "@/lib/import/schema";
import demo from "./demo_v2.json";
import { PSYCHOLOGIE } from "./psychologie";

export const MATIERES_LIVREES: MatiereJson[] = [demo as MatiereJson, PSYCHOLOGIE];
