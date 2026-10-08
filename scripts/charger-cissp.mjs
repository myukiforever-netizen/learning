// Charge (ou met à jour) la matière « cissp » dans la base Supabase, comme le bouton « Mettre à jour » de l'app :
// textes mis à jour, historique de révision conservé (la table `reviews` n'est jamais touchée),
// cartes disparues ARCHIVÉES (jamais effacées).
//
// Usage :  node scripts/charger-cissp.mjs            → simulation : dit ce qui serait fait
//          node scripts/charger-cissp.mjs --ecrire   → écrit vraiment dans la base
//
// Les galaxies, leur ordre, la version, le nom et la couleur sont lus dans src/data/matieres/cissp/index.ts.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ECRIRE = process.argv.includes("--ecrire");

// ---- Lecture de l'index (ordre des galaxies, version, nom, couleur) ----
const dossier = join("src", "data", "matieres", "cissp");
const index = readFileSync(join(dossier, "index.ts"), "utf8");
const fichiers = new Map([...index.matchAll(/import (\w+) from "\.\/([^"]+)\.json";/g)].map((m) => [m[1], m[2]]));
const tableau = index.match(/modules:\s*\[([\s\S]*?)\]\s*as ModuleJson/)?.[1] ?? "";
const ordre = [...tableau.matchAll(/\b(\w+)\b/g)].map((m) => m[1]).filter((id) => fichiers.has(id));
if (ordre.length === 0) throw new Error("Aucune galaxie trouvée dans index.ts");
const champ = (nom) => index.match(new RegExp(`${nom}:\\s*(?:"([^"]*)"|(\\d+))`))?.slice(1).find((v) => v !== undefined);
const matiere = { id: champ("id"), name: champ("name"), version: Number(champ("version")), color: champ("color") };
const modules = ordre.map((ident) => JSON.parse(readFileSync(join(dossier, `${fichiers.get(ident)}.json`), "utf8")));

// ---- Connexion ----
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]),
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

const gid = (id) => `${matiere.id}/${id}`;
const maintenant = new Date().toISOString();
const par = (liste, n) => Array.from({ length: Math.ceil(liste.length / n) }, (_, i) => liste.slice(i * n, i * n + n));
const verifier = (etape, error) => {
  if (error) throw new Error(`${etape} : ${error.message}`);
  console.log(`✓ ${etape}`);
};

// ---- Ce qui doit exister ----
const cartes = modules.flatMap((mod) => mod.concepts.flatMap((c) => c.cards.map((k) => ({ k, concept: c }))));
const idsNouveaux = new Set(cartes.map(({ k }) => gid(k.id)));

const existantes = [];
for (let debut = 0; ; debut += 1000) {
  // Supabase renvoie au plus 1000 lignes par requête : on lit page par page.
  const { data, error } = await supabase.from("cards").select("id, status").like("id", `${matiere.id}/%`).order("id").range(debut, debut + 999);
  if (error) throw new Error(`lecture de la base : ${error.message}`);
  existantes.push(...data);
  if (data.length < 1000) break;
}
console.log(`✓ lecture de la base (${existantes.length} cartes ${matiere.id}/ déjà présentes)`);
const actives = existantes.filter((c) => c.status === "active").map((c) => c.id);
const aArchiver = actives.filter((id) => !idsNouveaux.has(id));
const dejaLa = new Set(existantes.map((c) => c.id));
console.log(
  `${matiere.name} v${matiere.version} : ${modules.length} galaxies, ${modules.reduce((s, m) => s + m.concepts.length, 0)} planètes, ${cartes.length} cartes.\n` +
    `  nouvelles : ${cartes.filter(({ k }) => !dejaLa.has(gid(k.id))).length} · mises à jour : ${cartes.filter(({ k }) => dejaLa.has(gid(k.id))).length} · à archiver : ${aArchiver.length}`,
);
if (!ECRIRE) console.log("Simulation seulement. Ajoute --ecrire pour écrire dans la base.");
else await ecrire();

async function ecrire() {
// ---- Écriture ----
verifier("matière", (await supabase.from("subjects").upsert({ id: matiere.id, name: matiere.name, version: matiere.version, color: matiere.color, updated_at: maintenant })).error);
verifier(
  "galaxies",
  (
    await supabase.from("modules").upsert(
      modules.map((mod, i) => ({ id: gid(mod.id), subject_id: matiere.id, name: mod.name, position: i, galaxy: mod.galaxie ?? null })),
    )
  ).error,
);
const concepts = modules.flatMap((mod) =>
  mod.concepts.map((c, i) => ({ id: gid(c.id), module_id: gid(mod.id), name: c.name, position: i, discovery: c.decouverte ?? null, planet: c.planete ?? null })),
);
for (const lot of par(concepts, 100)) verifier(`planètes (${lot.length})`, (await supabase.from("concepts").upsert(lot)).error);

const lignes = cartes.map(({ k, concept }, position) => ({
  id: gid(k.id),
  concept_id: gid(concept.id),
  type: k.type,
  question: k.question,
  answer: k.answer,
  explanation: k.explanation,
  explanation_more: k.explanation_more ?? null,
  options: k.options ?? null,
  options_why: k.options_why ?? null,
  retention_goal: k.retention_goal ?? "1y",
  data: k.data ?? null,
  phase: k.phase ?? null,
  level: k.niveau ?? null,
  status: "active",
  position,
  updated_at: maintenant,
}));
for (const lot of par(lignes, 150)) verifier(`cartes (${lot.length})`, (await supabase.from("cards").upsert(lot)).error);
for (const lot of par(aArchiver, 100)) {
  verifier(`archivage (${lot.length})`, (await supabase.from("cards").update({ status: "archived", updated_at: maintenant }).in("id", lot)).error);
}

const { count } = await supabase.from("cards").select("id", { count: "exact", head: true }).like("id", `${matiere.id}/%`).eq("status", "active");
console.log(`Cartes actives en base : ${count} (attendu ${lignes.length})`);
}
