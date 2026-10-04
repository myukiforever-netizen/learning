// Vérifie que chaque « définition officielle » des cartes CISSP est copiée MOT POUR MOT du manuel.
//
// Usage :  node scripts/verifier-definitions.mjs <domaine> <fichier.json> [<fichier.json> ...]
//   <domaine>  1 à 8  (cherche « domain<N>.pdf » ou « domaine<N>.pdf » dans le dossier des sources)
//   fichiers   des modules (galaxies) JSON, ou un concept seul, ou une matière entière.
//
// Une carte est une « définition officielle » quand son id finit par -def1, -def2, -def3 ou -def4.
// Sa phrase officielle = son champ `answer` (avant « \n\nTraduction : »). Elle doit apparaître telle quelle
// dans le PDF. Seules les différences de casse, ponctuation, espaces, tirets et coupures de page sont ignorées.
// Pour les textes à trous, la question une fois les trous remplis doit aussi redonner la phrase exacte.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOSSIER_SOURCES = join(racine, "Univers Informatique a Renommer");

/** Que des lettres et des chiffres, en minuscules : insensible aux coupures de ligne, tirets, guillemets… */
function normaliser(texte) {
  return texte
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const TITRES_DOMAINES =
  /^(Security and Risk Management|Asset Security|Security Architecture and Engineering|Communication and Network Security|Identity and Access Management|Security Assessment and Testing|Security Operations|Software Development Security)$/;

/** Retire les en-têtes et pieds de page du manuel, qui s'intercalent au milieu des phrases. */
function nettoyerSource(brut, domaine) {
  const enTeteDomaine = new RegExp(`^\\d+ DOMAIN ${domaine} .*$`);
  return brut
    .split("\n")
    .filter((ligne) => {
      const l = ligne.trim();
      if (l === "") return false;
      if (/^\d+$/.test(l)) return false; // numéro de page seul
      if (enTeteDomaine.test(l)) return false; // « 4 DOMAIN 1 Security and Risk Management »
      if (TITRES_DOMAINES.test(l)) return false; // titre courant isolé : « Security and Risk Management »
      if (/^[A-Z][A-Za-z ,'’/&()-]{3,80} \d{1,3}$/.test(l) && !/[.:;]$/.test(l.slice(0, -4))) return false; // « Understand and Apply Security Concepts 5 »
      return true;
    })
    .join(" ");
}

function lireSource(domaine) {
  // Le numéro est lu dans l'en-tête du PDF (« domaine8.pdf » contient en réalité le domaine 7).
  for (const nom of readdirSync(DOSSIER_SOURCES).filter((n) => n.toLowerCase().endsWith(".pdf"))) {
    const brut = execFileSync("pdftotext", [join(DOSSIER_SOURCES, nom), "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    if (brut.match(/DOMAIN\s+(\d)/)?.[1] === String(domaine)) return nettoyerSource(brut, domaine);
  }
  throw new Error(`PDF du domaine ${domaine} introuvable dans « ${DOSSIER_SOURCES} ».`);
}

function* toutesLesCartes(noeud) {
  if (Array.isArray(noeud)) {
    for (const n of noeud) yield* toutesLesCartes(n);
  } else if (noeud && typeof noeud === "object") {
    if (typeof noeud.id === "string" && typeof noeud.type === "string" && "answer" in noeud) yield noeud;
    for (const valeur of Object.values(noeud)) yield* toutesLesCartes(valeur);
  }
}

const SEPARATEUR = /\n\s*\nTraduction\s*:/;
const phraseOfficielle = (answer) => answer.split(SEPARATEUR)[0].trim();
const remplirTrous = (question) => question.replace(/\[\[(.+?)\]\]/g, (_, t) => t.split("|")[0]);

const [domaineArg, ...fichiers] = process.argv.slice(2);
if (!domaineArg || fichiers.length === 0) {
  console.error("Usage : node scripts/verifier-definitions.mjs <domaine 1-8> <fichier.json> [...]");
  process.exit(2);
}

const source = normaliser(lireSource(Number(domaineArg)));
let total = 0;
let erreurs = 0;
const echec = (carte, message) => {
  erreurs += 1;
  console.error(`✗ ${carte.id} : ${message}`);
};

for (const fichier of fichiers) {
  const json = JSON.parse(readFileSync(fichier, "utf8"));
  for (const carte of toutesLesCartes(json)) {
    if (!/-def[1-4]$/.test(carte.id)) continue;
    total += 1;
    const phrase = phraseOfficielle(carte.answer);
    if (phrase.length < 25) echec(carte, "phrase officielle trop courte ou vide.");
    else if (!source.includes(normaliser(phrase))) echec(carte, `ne figure pas mot pour mot dans le manuel : « ${phrase.slice(0, 90)}… »`);

    if (carte.type === "cloze") {
      if (normaliser(remplirTrous(carte.question)) !== normaliser(carte.answer)) {
        echec(carte, "la question, une fois les trous remplis, ne redonne pas exactement la phrase de `answer`.");
      }
    } else if (/-def[14]$/.test(carte.id) && !SEPARATEUR.test(carte.answer)) {
      echec(carte, "il manque « \\n\\nTraduction : … » dans `answer`.");
    }
  }
}

console.log(`${total} cartes « définition officielle » contrôlées, ${erreurs} erreur${erreurs > 1 ? "s" : ""}.`);
process.exit(erreurs === 0 ? 0 : 1);
