// Extrait le texte propre d'un domaine du manuel CISSP, une ligne numérotée par paragraphe.
// Sert à LIRE le manuel pour écrire les cartes (la vérification mot pour mot est dans verifier-definitions.mjs).
//
// Usage :  node scripts/extraire-source.mjs <domaine 1-8> <fichier de sortie>
import { execFileSync } from "node:child_process";
import { readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOSSIER_SOURCES = join(racine, "Univers Informatique a Renommer");

const [domaine, sortie] = process.argv.slice(2);
if (!domaine || !sortie) {
  console.error("Usage : node scripts/extraire-source.mjs <domaine 1-8> <fichier de sortie>");
  process.exit(2);
}

let brut = null;
// Le numéro est lu dans l'en-tête du PDF (« domaine8.pdf » contient en réalité le domaine 7).
for (const nom of readdirSync(DOSSIER_SOURCES).filter((n) => n.toLowerCase().endsWith(".pdf"))) {
  const texte = execFileSync("pdftotext", [join(DOSSIER_SOURCES, nom), "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (texte.match(/DOMAIN\s+(\d)/)?.[1] === String(domaine)) {
    brut = texte;
    break;
  }
}
if (brut === null) throw new Error(`PDF du domaine ${domaine} introuvable dans « ${DOSSIER_SOURCES} ».`);

const enTeteDomaine = new RegExp(`^\\d+ DOMAIN ${domaine} .*$`);
const lignes = brut
  .split("\n")
  .map((l) => l.replace(/-�/g, "-").replace(/­|�/g, "-").trim())
  .filter((l) => {
    if (l === "") return false;
    if (/^\d+$/.test(l)) return false; // numéro de page seul
    if (enTeteDomaine.test(l)) return false; // « 22 DOMAIN 1 Security and Risk Management »
    if (/^[A-Z][A-Za-z ,'’/&()-]{3,80} \d{1,3}$/.test(l)) return false; // « Understand and Apply Security Concepts 5 »
    if (/^(Security and Risk Management|Asset Security|Security Architecture and Engineering)$/.test(l)) return false;
    return true;
  });

// Recolle les paragraphes coupés par un saut de page.
const sortieLignes = [];
for (const l of lignes) {
  const precedente = sortieLignes[sortieLignes.length - 1];
  if (precedente !== undefined && /^[a-z]/.test(l) && !/[.:;?!]$/.test(precedente) && precedente.length > 60) {
    sortieLignes[sortieLignes.length - 1] = precedente + (precedente.endsWith("-") ? "" : " ") + l;
  } else {
    sortieLignes.push(l);
  }
}

const propre = sortieLignes.map((l) => l.replace(/(\w)-{2,}(\w)/g, "$1-$2").replace(/ ?-{2,} ?/g, " — "));
writeFileSync(sortie, propre.map((l, i) => `${i + 1}\t${l}`).join("\n"), "utf8");
console.log(`${propre.length} lignes écrites dans ${sortie}`);
