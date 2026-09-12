// Vérification automatique des réponses (texte à trous, classer/ordonner) et
// lecture des trous d'une carte cloze. Logique pure, testée dans tests/verifier.test.ts.
import type { Carte } from "@/lib/types";

/** Compare deux textes en ignorant casse, accents, espaces multiples et ponctuation. */
export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function memeTexte(a: string, b: string): boolean {
  return normaliser(a) === normaliser(b);
}

/**
 * Découpe une phrase à trous : « Ebbinghaus a publié en [[1885]]. »
 * → segments = ["Ebbinghaus a publié en ", "."], reponses = ["1885"].
 * Plusieurs bonnes réponses possibles pour un trou : [[1885|mille huit cent quatre-vingt-cinq]].
 */
export function lireTrous(question: string): { segments: string[]; reponses: string[][] } {
  const segments: string[] = [];
  const reponses: string[][] = [];
  const regex = /\[\[(.+?)\]\]/g;
  let dernier = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(question)) !== null) {
    segments.push(question.slice(dernier, m.index));
    reponses.push(m[1].split("|").map((r) => r.trim()).filter(Boolean));
    dernier = m.index + m[0].length;
  }
  segments.push(question.slice(dernier));
  return { segments, reponses };
}

/** La phrase complète, trous remplis par la première bonne réponse. */
export function phraseComplete(question: string): string {
  return question.replace(/\[\[(.+?)\]\]/g, (_, r: string) => r.split("|")[0].trim());
}

/** Un booléen par trou : la saisie correspond-elle à l'une des réponses acceptées ? */
export function verifierTrous(question: string, saisies: string[]): boolean[] {
  const { reponses } = lireTrous(question);
  return reponses.map((acceptees, i) => acceptees.some((r) => memeTexte(r, saisies[i] ?? "")));
}

/** Un booléen par élément : chaque élément est-il dans la bonne catégorie ? */
export function verifierClassement(carte: Carte, classement: (string | null)[]): boolean[] {
  const items = carte.data?.items ?? [];
  return items.map((item, i) => typeof item !== "string" && classement[i] === item.category);
}

/**
 * Un booléen par position : l'élément placé en position i est-il le bon ?
 * `ordre` contient les index (dans `items`) dans l'ordre choisi par l'utilisateur.
 */
export function verifierOrdre(carte: Carte, ordre: number[]): boolean[] {
  const items = carte.data?.items ?? [];
  return items.map((_, position) => ordre[position] === position);
}
