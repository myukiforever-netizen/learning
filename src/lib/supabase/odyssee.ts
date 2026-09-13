// Lectures / écritures de l'Odyssée : structure du secteur, progression des planètes
// et galaxies, profil (XP, carburant). Côté serveur uniquement.
import { createClient } from "./server";
import { profilCourantId } from "@/lib/profils";
import { chargerCartesEtRevisions, type CarteAvecMatiere } from "./requetes";
import { aujourdhui } from "@/lib/dates";
import { CONFIG_REVISION } from "@/lib/revision/config";
import {
  construireSecteur,
  etapeApresPhase,
  type EtapePlanete,
  type ProgressionGalaxie,
  type ProgressionPlanete,
  type Secteur,
  type StructureSecteur,
} from "@/lib/odyssee/univers";
import { signauxDetresse } from "@/lib/odyssee/maitrise";
import { niveauPourXp, xpMission, type EvenementXp, type Niveau } from "@/lib/odyssee/recompenses";
import type { CarteAReviser } from "@/lib/types";

export interface Profil {
  xp: number;
  niveau: Niveau;
  carburant: number;
  badges: string[];
  vaisseau: Record<string, unknown>;
  audio: { music: boolean; effects: boolean; volume: number };
}

const PROFIL_VIDE: Profil = {
  xp: 0,
  niveau: niveauPourXp(0),
  carburant: CONFIG_REVISION.odyssee.carburant.initial,
  badges: [],
  vaisseau: {},
  audio: { music: true, effects: true, volume: 0.6 },
};

// ---------- Lecture ----------

/** Structure brute du secteur actif (la première matière active), avec le nombre de cartes par planète. */
async function structureSecteur(): Promise<{ structure: StructureSecteur; cartes: CarteAvecMatiere[] } | null> {
  const supabase = await createClient();
  const { data: subjects, error } = await supabase
    .from("subjects")
    .select("id, name, status")
    .eq("status", "active")
    .order("created_at")
    .limit(1);
  if (error) throw new Error(error.message);
  const subject = subjects?.[0];
  if (!subject) return null;

  const [modulesRes, conceptsRes, { cartes }] = await Promise.all([
    supabase.from("modules").select("id, name, position").eq("subject_id", subject.id).order("position"),
    supabase
      .from("concepts")
      .select("id, name, position, module_id, discovery, modules!inner(subject_id)")
      .eq("modules.subject_id", subject.id)
      .order("position"),
    chargerCartesEtRevisions(),
  ]);
  if (modulesRes.error) throw new Error(modulesRes.error.message);
  if (conceptsRes.error) throw new Error(conceptsRes.error.message);

  const nbCartes = new Map<string, number>();
  for (const c of cartes) nbCartes.set(c.carte.concept_id, (nbCartes.get(c.carte.concept_id) ?? 0) + 1);

  const concepts = (conceptsRes.data ?? []) as unknown as { id: string; name: string; module_id: string; discovery: unknown[] | null }[];
  return {
    structure: {
      id: subject.id,
      nom: subject.name,
      galaxies: (modulesRes.data ?? []).map((m) => ({
        id: m.id,
        nom: m.name,
        planetes: concepts.filter((c) => c.module_id === m.id).map((c) => ({ id: c.id, nom: c.name, nbCartes: nbCartes.get(c.id) ?? 0, decouverte: c.discovery })),
      })),
    },
    cartes,
  };
}

async function progressions(): Promise<{ planetes: ProgressionPlanete[]; galaxies: ProgressionGalaxie[] }> {
  const supabase = await createClient();
  const pid = await profilCourantId();
  const [p, g] = await Promise.all([
    supabase.from("planet_progress").select("concept_id, stage, best_score, attempts, probe_passed, validated_at").eq("profile_id", pid),
    supabase.from("galaxy_progress").select("module_id, sun_score, attempts, passed_at, jumped").eq("profile_id", pid),
  ]);
  if (p.error) throw new Error(p.error.message);
  if (g.error) throw new Error(g.error.message);
  return { planetes: (p.data ?? []) as ProgressionPlanete[], galaxies: (g.data ?? []) as ProgressionGalaxie[] };
}

export interface Univers {
  secteur: Secteur;
  /** Toutes les cartes du secteur avec leur état de révision. */
  cartes: CarteAvecMatiere[];
  /** Signaux de détresse par planète (notions dues ou fragiles). */
  detresse: Map<string, number>;
  profil: Profil;
}

/** Tout ce qu'il faut pour la carte de l'univers, une galaxie ou une planète. Null = aucune matière chargée. */
export async function chargerUnivers(): Promise<Univers | null> {
  const [base, prog, profil] = await Promise.all([structureSecteur(), progressions(), lireProfil()]);
  if (!base) return null;
  const jour = aujourdhui();
  const secteur = construireSecteur(base.structure, prog.planetes, prog.galaxies);

  const detresse = new Map<string, number>();
  for (const galaxie of secteur.galaxies) {
    for (const planete of galaxie.planetes) {
      const revisions = base.cartes.filter((c) => c.carte.concept_id === planete.id).map((c) => c.revision);
      detresse.set(planete.id, signauxDetresse(revisions, jour));
    }
  }
  return { secteur, cartes: base.cartes, detresse, profil };
}

export function cartesDePlanete(univers: Univers, conceptId: string): CarteAReviser[] {
  return univers.cartes.filter((c) => c.carte.concept_id === conceptId).map(({ carte, revision }) => ({ carte, revision }));
}

export async function lireProfil(): Promise<Profil> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("progression").select("xp, fuel, badges, ship, audio").eq("profile_id", await profilCourantId()).maybeSingle();
  if (error || !data) return PROFIL_VIDE;
  return {
    xp: data.xp,
    niveau: niveauPourXp(data.xp),
    carburant: data.fuel,
    badges: (data.badges as string[]) ?? [],
    vaisseau: (data.ship as Record<string, unknown>) ?? {},
    audio: { ...PROFIL_VIDE.audio, ...((data.audio as Partial<Profil["audio"]>) ?? {}) },
  };
}

// ---------- Écriture ----------

/** Ajoute des XP au profil (crée la ligne si besoin) et journalise l'événement. Renvoie le nouveau total. */
export async function ajouterXp(evenement: EvenementXp | string, montant: number, refId?: string): Promise<number> {
  if (montant <= 0) return (await lireProfil()).xp;
  const supabase = await createClient();
  const pid = await profilCourantId();
  const profil = await lireProfil();
  const total = profil.xp + montant;
  const { error } = await supabase
    .from("progression")
    .upsert({ profile_id: pid, xp: total, fuel: profil.carburant, updated_at: new Date().toISOString() }, { onConflict: "profile_id" });
  if (error) throw new Error(error.message);
  const { error: e2 } = await supabase.from("xp_events").insert({ profile_id: pid, kind: evenement, amount: montant, ref_id: refId ?? null });
  if (e2) throw new Error(e2.message);
  return total;
}

export async function modifierCarburant(nouveau: number): Promise<void> {
  const supabase = await createClient();
  const profil = await lireProfil();
  const { error } = await supabase
    .from("progression")
    .upsert({ profile_id: await profilCourantId(), xp: profil.xp, fuel: Math.max(0, Math.min(CONFIG_REVISION.odyssee.carburant.max, nouveau)), updated_at: new Date().toISOString() }, { onConflict: "profile_id" });
  if (error) throw new Error(error.message);
}

export type PhasePlanete = "decouverte" | "comprehension" | "entrainement" | "mission";

export interface ResultatPhase {
  etape: EtapePlanete;
  xpGagne: number;
  xpTotal: number;
  niveauAvant: number;
  niveauApres: number;
  reussie: boolean;
}

/**
 * Enregistre la fin d'une phase de planète : avance l'étape (jamais en arrière),
 * garde le meilleur score de mission, distribue les XP.
 */
export async function terminerPhase(p: {
  conceptId: string;
  phase: PhasePlanete;
  /** Score 0 à 1 (mission) ou part de bonnes réponses (compréhension / entraînement). */
  score: number;
  /** Nombre de bonnes premières réponses (pour les XP de compréhension / entraînement). */
  bonnesReponses: number;
  /** Nombre de bonnes réponses données avec 😎 (bonus). */
  bonnesFaciles: number;
  /** Découverte : nombre d'écrans vus. */
  ecransVus?: number;
}): Promise<ResultatPhase> {
  const supabase = await createClient();
  const pid = await profilCourantId();
  const { xp, seuilMission } = CONFIG_REVISION.odyssee;
  const profilAvant = await lireProfil();

  const { data: existante } = await supabase
    .from("planet_progress")
    .select("stage, best_score, attempts, probe_passed")
    .eq("profile_id", pid)
    .eq("concept_id", p.conceptId)
    .maybeSingle();
  const etapeAvant: EtapePlanete = (existante?.stage as EtapePlanete | undefined) ?? "available";

  const reussie = p.phase === "mission" ? p.score >= seuilMission : true;
  const etape = etapeApresPhase(etapeAvant, p.phase, reussie);
  const scorePourcent = Math.round(p.score * 100);

  const { error } = await supabase.from("planet_progress").upsert(
    {
      profile_id: pid,
      concept_id: p.conceptId,
      stage: etape,
      best_score: p.phase === "mission" ? Math.max(existante?.best_score ?? 0, scorePourcent) : (existante?.best_score ?? 0),
      attempts: (existante?.attempts ?? 0) + (p.phase === "mission" ? 1 : 0),
      probe_passed: existante?.probe_passed ?? false,
      validated_at: etape === "validated" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id,concept_id" },
  );
  if (error) throw new Error(error.message);

  let gain = 0;
  switch (p.phase) {
    case "decouverte":
      gain = xp.ecranDecouverte * (p.ecransVus ?? 0);
      break;
    case "comprehension":
      gain = xp.comprehensionBonne * p.bonnesReponses;
      break;
    case "entrainement":
      gain = xp.entrainementBonne * p.bonnesReponses + xp.bonusFacile * p.bonnesFaciles;
      break;
    case "mission":
      gain = xp.entrainementBonne * p.bonnesReponses + xpMission(p.score, seuilMission, p.score >= 1);
      break;
  }
  const xpTotal = gain > 0 ? await ajouterXp(p.phase, gain, p.conceptId) : profilAvant.xp;

  return {
    etape,
    xpGagne: gain,
    xpTotal,
    niveauAvant: profilAvant.niveau.niveau,
    niveauApres: niveauPourXp(xpTotal).niveau,
    reussie,
  };
}

/** Enregistre une tentative de soleil : score, franchissement si ≥ seuil, XP. */
export async function terminerSoleil(p: { moduleId: string; score: number; bonnesReponses: number }): Promise<ResultatPhase> {
  const supabase = await createClient();
  const pid = await profilCourantId();
  const { xp, seuilSoleil } = CONFIG_REVISION.odyssee;
  const profilAvant = await lireProfil();

  const { data: existante } = await supabase
    .from("galaxy_progress")
    .select("sun_score, attempts, passed_at, jumped")
    .eq("profile_id", pid)
    .eq("module_id", p.moduleId)
    .maybeSingle();
  const dejaFranchie = Boolean(existante?.passed_at);
  const reussie = p.score >= seuilSoleil;
  const scorePourcent = Math.round(p.score * 100);

  const { error } = await supabase.from("galaxy_progress").upsert(
    {
      profile_id: pid,
      module_id: p.moduleId,
      sun_score: Math.max(existante?.sun_score ?? 0, scorePourcent),
      attempts: (existante?.attempts ?? 0) + 1,
      passed_at: existante?.passed_at ?? (reussie ? new Date().toISOString() : null),
      jumped: existante?.jumped ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id,module_id" },
  );
  if (error) throw new Error(error.message);

  const gain = xp.entrainementBonne * p.bonnesReponses + (reussie && !dejaFranchie ? xp.soleilFranchi : 0);
  const xpTotal = gain > 0 ? await ajouterXp("soleil", gain, p.moduleId) : profilAvant.xp;

  return {
    etape: "validated",
    xpGagne: gain,
    xpTotal,
    niveauAvant: profilAvant.niveau.niveau,
    niveauApres: niveauPourXp(xpTotal).niveau,
    reussie,
  };
}
