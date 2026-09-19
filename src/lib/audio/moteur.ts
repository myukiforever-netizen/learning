// Le moteur audio : joue le catalogue de sons.ts avec Web Audio, sans aucun fichier.
// Côté navigateur uniquement. Un seul contexte audio pour toute l'app, créé au premier
// geste de l'utilisateur (les navigateurs interdisent le son avant).
import {
  SONS,
  dureeSon,
  frequenceGalaxie,
  gainSortie,
  REGLAGES_AUDIO_DEFAUT,
  type BruitSon,
  type NomSon,
  type NoteSon,
  type ReglagesAudio,
} from "./sons";

let ctx: AudioContext | null = null;
let sortieEffets: GainNode | null = null;
let sortieMusique: GainNode | null = null;
let bruitBlanc: AudioBuffer | null = null;
let reglages: ReglagesAudio = REGLAGES_AUDIO_DEFAUT;

/** Ambiance en cours et ambiance souhaitée (elle reprend si on rallume la musique). */
let ambiance: { teinte: number; arreter: () => void } | null = null;
let teinteSouhaitee: number | null = null;

function creerContexte(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Constructeur =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Constructeur) return null; // navigateur sans Web Audio : l'app marche sans son

  ctx = new Constructeur();
  sortieEffets = ctx.createGain();
  sortieMusique = ctx.createGain();
  sortieEffets.gain.value = gainSortie(reglages, "effets");
  sortieMusique.gain.value = gainSortie(reglages, "musique");
  sortieEffets.connect(ctx.destination);
  sortieMusique.connect(ctx.destination);
  return ctx;
}

/** À appeler au premier geste de l'utilisateur : crée ou réveille le contexte audio. */
export function demarrerAudio(): void {
  const contexte = creerContexte();
  if (contexte && contexte.state === "suspended") void contexte.resume();
  if (teinteSouhaitee !== null && !ambiance) demarrerAmbiance(teinteSouhaitee);
}

export function appliquerReglages(nouveaux: ReglagesAudio): void {
  reglages = nouveaux;
  if (!ctx || !sortieEffets || !sortieMusique) return;
  const maintenant = ctx.currentTime;
  sortieEffets.gain.setTargetAtTime(gainSortie(reglages, "effets"), maintenant, 0.05);
  sortieMusique.gain.setTargetAtTime(gainSortie(reglages, "musique"), maintenant, 0.3);

  if (!reglages.musique && ambiance) arreterAmbiance(true);
  else if (reglages.musique && !ambiance && teinteSouhaitee !== null) demarrerAmbiance(teinteSouhaitee);
}

function tampon(contexte: AudioContext): AudioBuffer {
  if (bruitBlanc) return bruitBlanc;
  const longueur = Math.floor(contexte.sampleRate * 2);
  const buffer = contexte.createBuffer(1, longueur, contexte.sampleRate);
  const donnees = buffer.getChannelData(0);
  for (let i = 0; i < longueur; i++) donnees[i] = Math.random() * 2 - 1;
  bruitBlanc = buffer;
  return buffer;
}

function jouerNote(contexte: AudioContext, sortie: GainNode, note: NoteSon, depart: number): void {
  const osc = contexte.createOscillator();
  const enveloppe = contexte.createGain();
  osc.type = note.forme;
  const t = depart + note.debut;
  osc.frequency.setValueAtTime(note.hz, t);
  if (note.vers !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, note.vers), t + note.duree);

  // Attaque courte puis extinction douce : aucun « clic » parasite.
  const attaque = Math.min(0.02, note.duree * 0.3);
  enveloppe.gain.setValueAtTime(0.0001, t);
  enveloppe.gain.exponentialRampToValueAtTime(note.gain, t + attaque);
  enveloppe.gain.exponentialRampToValueAtTime(0.0001, t + note.duree);

  osc.connect(enveloppe).connect(sortie);
  osc.start(t);
  osc.stop(t + note.duree + 0.05);
}

function jouerBruit(contexte: AudioContext, sortie: GainNode, bruit: BruitSon, depart: number): void {
  const source = contexte.createBufferSource();
  source.buffer = tampon(contexte);
  const filtre = contexte.createBiquadFilter();
  filtre.type = bruit.type === "passe-bas" ? "lowpass" : "highpass";
  const enveloppe = contexte.createGain();
  const t = depart + bruit.debut;

  filtre.frequency.setValueAtTime(bruit.coupure, t);
  if (bruit.vers !== undefined) filtre.frequency.exponentialRampToValueAtTime(Math.max(40, bruit.vers), t + bruit.duree);

  enveloppe.gain.setValueAtTime(0.0001, t);
  enveloppe.gain.exponentialRampToValueAtTime(bruit.gain, t + Math.min(0.03, bruit.duree * 0.3));
  enveloppe.gain.exponentialRampToValueAtTime(0.0001, t + bruit.duree);

  source.connect(filtre).connect(enveloppe).connect(sortie);
  source.start(t);
  source.stop(t + bruit.duree + 0.05);
}

/** Joue un son du catalogue. Ne fait rien si les effets sont coupés ou le son indisponible. */
export function jouer(nom: NomSon): void {
  if (!reglages.effets || reglages.volume === 0) return;
  const contexte = creerContexte();
  if (!contexte || !sortieEffets) return;
  if (contexte.state === "suspended") void contexte.resume();

  const def = SONS[nom];
  if (!def || dureeSon(def) === 0) return;
  const depart = contexte.currentTime + 0.01;
  for (const note of def.notes) jouerNote(contexte, sortieEffets, note, depart);
  for (const bruit of def.bruits ?? []) jouerBruit(contexte, sortieEffets, bruit, depart);
}

/**
 * Ambiance d'une galaxie : deux ou trois oscillateurs légèrement désaccordés, filtrés,
 * avec une respiration très lente. Aucun rythme, rien qui attire l'attention.
 */
export function demarrerAmbiance(teinte: number): void {
  teinteSouhaitee = teinte;
  if (ambiance?.teinte === teinte) return;
  if (ambiance) arreterAmbiance(true);
  if (!reglages.musique || reglages.volume === 0) return;

  const contexte = creerContexte();
  if (!contexte || !sortieMusique) return;

  const base = frequenceGalaxie(teinte);
  const filtre = contexte.createBiquadFilter();
  filtre.type = "lowpass";
  filtre.frequency.value = 700;
  filtre.Q.value = 0.7;

  const volume = contexte.createGain();
  volume.gain.setValueAtTime(0.0001, contexte.currentTime);
  volume.gain.exponentialRampToValueAtTime(0.6, contexte.currentTime + 2.5); // fondu d'entrée lent
  filtre.connect(volume).connect(sortieMusique);

  // Respiration du filtre : une oscillation toutes les vingt secondes environ.
  const lfo = contexte.createOscillator();
  const profondeur = contexte.createGain();
  lfo.frequency.value = 0.05;
  profondeur.gain.value = 260;
  lfo.connect(profondeur).connect(filtre.frequency);
  lfo.start();

  const oscillateurs = [base, base * 1.5, base * 2.01].map((hz, i) => {
    const osc = contexte.createOscillator();
    osc.type = i === 1 ? "triangle" : "sine";
    osc.frequency.value = hz * (1 + (i - 1) * 0.002); // désaccord minuscule : ça respire
    const g = contexte.createGain();
    g.gain.value = i === 0 ? 0.09 : 0.045;
    osc.connect(g).connect(filtre);
    osc.start();
    return osc;
  });

  ambiance = {
    teinte,
    arreter: () => {
      const fin = contexte.currentTime + 1.2;
      volume.gain.cancelScheduledValues(contexte.currentTime);
      volume.gain.setValueAtTime(Math.max(volume.gain.value, 0.0001), contexte.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.0001, fin);
      for (const osc of oscillateurs) osc.stop(fin + 0.1);
      lfo.stop(fin + 0.1);
    },
  };
}

/** Arrête l'ambiance. `garderSouhait` sert quand on coupe la musique sans quitter l'écran. */
export function arreterAmbiance(garderSouhait = false): void {
  ambiance?.arreter();
  ambiance = null;
  if (!garderSouhait) teinteSouhaitee = null;
}
