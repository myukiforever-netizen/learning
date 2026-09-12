// Matière « Psychologie de l'influence, marketing et vente » : un fichier par module,
// assemblés ici en une seule matière au format SCHEMA.md.
// Source : docs/sources/psychologie.md (rapport du 12 septembre 2026).
import type { MatiereJson, ModuleJson } from "@/lib/import/schema";
import m1 from "./m1-bases.json";
import m2 from "./m2-effondres.json";
import m3 from "./m3-conditionnels.json";
import m4 from "./m4-cialdini.json";
import m5 from "./m5-ventes.json";
import m6 from "./m6-marketing-preuves.json";
import m7 from "./m7-fraudes.json";
import m8 from "./m8-pratiques.json";

export const PSYCHOLOGIE: MatiereJson = {
  id: "psychologie",
  name: "Psychologie de l'influence, marketing et vente",
  version: 1,
  color: "#0F766E",
  description:
    "Ce qui tient, ce qui dépend du contexte, et ce qui relève du bullshit : la crise de la réplication, les effets effondrés, les mécanismes robustes, Cialdini, la mesure commerciale, les fraudes et les pratiques à tester.",
  modules: [m1, m2, m3, m4, m5, m6, m7, m8] as ModuleJson[],
};
