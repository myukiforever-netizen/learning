// Matière « CISSP » (v2, anglais) : un fichier JSON par galaxie, assemblés ici dans l'ordre du cours.
// Source : manuel officiel (ISC)2 CISSP. Règles d'écriture : docs/GUIDE_CISSP.md.
// Deux types de cartes seulement (qcm, flash). Les définitions officielles (ids finissant par -def1 à -def3)
// sont copiées mot pour mot du manuel : contrôle avec `node scripts/verifier-definitions.mjs <domaine> <fichier>`.
// Charger dans la base : `node scripts/charger-cissp.mjs --ecrire`.
import type { MatiereJson, ModuleJson } from "@/lib/import/schema";
import d1m00 from "./d1-m00-mots.json";
import d1m00e from "./d1-m00-examen.json";
import d1m01 from "./d1-m01-ethique-cia.json";
import d1m02 from "./d1-m02-gouvernance.json";
import d1m03 from "./d1-m03-cadres.json";
import d1m04 from "./d1-m04-conformite.json";
import d1m05 from "./d1-m05-cyber-pi.json";
import d1m06 from "./d1-m06-vie-privee.json";
import d1m07 from "./d1-m07-enquetes.json";
import d1m08 from "./d1-m08-politiques.json";
import d1m09 from "./d1-m09-continuite.json";
import d1m10 from "./d1-m10-personnel.json";
import d1m11 from "./d1-m11-risque-bases.json";
import d1m12 from "./d1-m12-risque-traiter.json";
import d1m13 from "./d1-m13-risque-cadres.json";
import d1m14 from "./d1-m14-modelisation.json";
import d1m15 from "./d1-m15-chaine-appro.json";
import d1m16 from "./d1-m16-sensibilisation.json";

export const CISSP: MatiereJson = {
  id: "cissp",
  name: "CISSP: cybersecurity for beginners",
  version: 2,
  color: "#2563EB",
  description:
    "The official CISSP manual explained in simple English: analogies first, then exam-style multiple-choice questions and memory cards.",
  modules: [
    d1m00, d1m00e, d1m01, d1m02, d1m03, d1m04, d1m05, d1m06, d1m07, d1m08,
    d1m09, d1m10, d1m11, d1m12, d1m13, d1m14, d1m15, d1m16,
  ] as ModuleJson[],
};
