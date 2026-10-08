// Toutes les lectures / écritures en base passent par ici (côté serveur uniquement).
// La logique de révision reste dans src/lib/revision : ce fichier ne fait que
// lire, appeler cette logique, et écrire.
import { createClient } from "./server";
import { profilCourantId } from "@/lib/profils";
import { aujourdhui, dateLocale } from "@/lib/dates";
import { CONFIG_REVISION } from "@/lib/revision/config";
import { composerSession, nouvellesDisponibles } from "@/lib/revision/composer";
import { appliquerBoite, etatInitial, planifier, resultatDe } from "@/lib/revision/planifier";
import { calculerSerie } from "@/lib/revision/serie";
import {
  calibrationConfiance,
  messageCalibration,
  pourcentageMatiere,
  ratioProduction,
  topRatees,
  type Calibration,
  type CarteRatee,
  type ReponseStats,
  type StatMatiere,
} from "@/lib/stats/cerveau";
import { calculerFusion, type CarteExistante, type ResultatFusion } from "@/lib/import/fusionner";
import { aplatirMatiere, idGlobal, type MatiereJson } from "@/lib/import/schema";
import type {
  BoiteErreur,
  Carte,
  CarteAReviser,
  CarteData,
  Confiance,
  ContexteReponse,
  PhaseCarte,
  EtatRevision,
  ObjectifRetention,
  TypeCarte,
} from "@/lib/types";

// ---------- Lignes brutes renvoyées par Supabase ----------

export interface LigneCarte {
  id: string;
  concept_id: string;
  type: TypeCarte;
  question: string;
  answer: string;
  explanation: string;
  explanation_more: string | null;
  options: string[] | null;
  options_why: string[] | null;
  retention_goal: ObjectifRetention;
  data: CarteData | null;
  phase: PhaseCarte | null;
  level: 1 | 2 | 3 | null;
  concepts: { name: string; modules?: { subjects?: { id: string; name: string; color: string | null } } } | null;
}

export interface LigneRevision {
  card_id: string;
  due_date: string;
  interval_days: number;
  step: number;
  ease_state: EtatRevision["ease_state"];
  introduced_on: string;
  history?: unknown[];
}

export function versCarte(ligne: LigneCarte): Carte {
  return {
    id: ligne.id,
    concept_id: ligne.concept_id,
    concept_nom: ligne.concepts?.name ?? "",
    type: ligne.type,
    question: ligne.question,
    answer: ligne.answer,
    explanation: ligne.explanation,
    explanation_more: ligne.explanation_more,
    options: ligne.options,
    options_why: ligne.options_why,
    retention_goal: ligne.retention_goal,
    data: ligne.data ?? null,
    phase: ligne.phase ?? null,
    niveau: ligne.level ?? null,
  };
}

export function versEtat(r: LigneRevision): EtatRevision {
  return { step: r.step, interval_days: r.interval_days, due_date: r.due_date, ease_state: r.ease_state };
}

export const CHAMPS_CARTE =
  "id, concept_id, type, question, answer, explanation, explanation_more, options, options_why, retention_goal, data, phase, level, " +
  "concepts!inner(name, modules!inner(subjects!inner(id, name, color, status)))";

/** Cartes actives des matières actives, avec leur état de révision (null = nouvelle). */
export interface CarteAvecMatiere extends CarteAReviser {
  matiere: { id: string; name: string; color: string | null } | null;
}

export async function chargerCartesEtRevisions(): Promise<{ cartes: CarteAvecMatiere[]; revisions: LigneRevision[] }> {
  const supabase = await createClient();
  const pid = await profilCourantId();

  const [cartesRes, revisionsRes] = await Promise.all([
    supabase
      .from("cards")
      .select(CHAMPS_CARTE)
      .eq("status", "active")
      .eq("concepts.modules.subjects.status", "active")
      .order("position"),
    supabase.from("reviews").select("card_id, due_date, interval_days, step, ease_state, introduced_on").eq("profile_id", pid),
  ]);
  if (cartesRes.error) throw new Error(cartesRes.error.message);
  if (revisionsRes.error) throw new Error(revisionsRes.error.message);

  const revisions = (revisionsRes.data ?? []) as LigneRevision[];
  const parCarte = new Map(revisions.map((r) => [r.card_id, r]));

  const cartes = ((cartesRes.data ?? []) as unknown as LigneCarte[]).map((ligne) => {
    const r = parCarte.get(ligne.id);
    const m = ligne.concepts?.modules?.subjects;
    return { carte: versCarte(ligne), revision: r ? versEtat(r) : null, matiere: m ? { id: m.id, name: m.name, color: m.color } : null };
  });

  return { cartes, revisions };
}

// ---------- Réglages (table settings, une ligne par utilisateur) ----------

/** Quota de nouvelles cartes par jour : réglage utilisateur, sinon valeur de la config. */
export async function lireQuotaNouvelles(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("new_per_day").eq("profile_id", await profilCourantId()).maybeSingle();
  if (error || !data) return CONFIG_REVISION.nouvellesParJour; // table absente ou pas encore de ligne
  return data.new_per_day as number;
}

export async function enregistrerQuotaNouvelles(quota: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .upsert({ profile_id: await profilCourantId(), new_per_day: quota, updated_at: new Date().toISOString() }, { onConflict: "profile_id" });
  if (error) throw new Error(error.message);
}

// ---------- Accueil ----------

export interface ChiffresAccueil {
  dues: number;
  nouvelles: number;
  serie: number;
  totalCartes: number;
}

export async function chiffresAccueil(): Promise<ChiffresAccueil> {
  const jour = aujourdhui();
  const [{ cartes, revisions }, quota] = await Promise.all([chargerCartesEtRevisions(), lireQuotaNouvelles()]);

  const dues = cartes.filter((c) => c.revision && c.revision.due_date <= jour).length;
  const nouvellesTotal = cartes.filter((c) => c.revision === null).length;
  const dejaAujourdhui = revisions.filter((r) => r.introduced_on === jour).length;

  const supabase = await createClient();
  const { data: sessions, error } = await supabase.from("sessions").select("ended_at").eq("profile_id", await profilCourantId()).not("ended_at", "is", null);
  if (error) throw new Error(error.message);
  const jours = (sessions ?? []).map((s) => dateLocale(new Date(s.ended_at as string), CONFIG_REVISION.fuseauHoraire));

  return {
    dues,
    nouvelles: nouvellesDisponibles(nouvellesTotal, dejaAujourdhui, quota),
    serie: calculerSerie(jours, jour),
    totalCartes: cartes.length,
  };
}

// ---------- Session ----------

export async function composerSessionDepuisBase(minutes: number): Promise<CarteAReviser[]> {
  const jour = aujourdhui();
  const [{ cartes, revisions }, quota] = await Promise.all([chargerCartesEtRevisions(), lireQuotaNouvelles()]);
  return composerSession({
    dues: cartes.filter((c) => c.revision && c.revision.due_date <= jour),
    nouvelles: cartes.filter((c) => c.revision === null),
    minutes,
    nouvellesDejaAujourdhui: revisions.filter((r) => r.introduced_on === jour).length,
    quotaNouvelles: quota,
  });
}

export async function creerSession(minutes: number): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .insert({ duration_target: minutes, profile_id: await profilCourantId() })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

/**
 * Enregistre une réponse. Si c'est la première fois que la carte est vue dans
 * cette session, met aussi à jour son état de révision (les retours d'une carte
 * ratée dans la même session ne replanifient pas).
 * Retourne l'identifiant de la réponse (utile pour le tri des erreurs).
 */
export async function enregistrerReponse(p: {
  sessionId: string;
  cardId: string;
  correct: boolean;
  confiance: Confiance;
  objectif: ObjectifRetention;
  premiere: boolean;
  contexte?: ContexteReponse;
  /** false = réponse enregistrée sans replanifier (compréhension, sonde). */
  planifie?: boolean;
}): Promise<string> {
  const supabase = await createClient();
  const pid = await profilCourantId();
  const jour = aujourdhui();

  const { data, error } = await supabase
    .from("answers")
    .insert({ profile_id: pid, session_id: p.sessionId, card_id: p.cardId, correct: p.correct, confidence: p.confiance, context: p.contexte ?? "patrouille" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (p.premiere && p.planifie !== false) {
    const { data: existante } = await supabase
      .from("reviews")
      .select("card_id, due_date, interval_days, step, ease_state, introduced_on, history")
      .eq("profile_id", pid)
      .eq("card_id", p.cardId)
      .maybeSingle();

    const ligne = existante as LigneRevision | null;
    const avant = ligne ? versEtat(ligne) : etatInitial(jour);
    const apres = planifier(avant, resultatDe(p.correct, p.confiance), p.objectif, jour);
    const historique = [...(ligne?.history ?? []), { date: jour, correct: p.correct, confidence: p.confiance }];

    const { error: erreurRevision } = await supabase.from("reviews").upsert({
      profile_id: pid,
      card_id: p.cardId,
      ...apres,
      introduced_on: ligne?.introduced_on ?? jour,
      history: historique,
      updated_at: new Date().toISOString(),
    }, { onConflict: "profile_id,card_id" });
    if (erreurRevision) throw new Error(erreurRevision.message);
  }

  return data.id as string;
}

export interface TriErreur {
  answerId: string;
  cardId: string;
  objectif: ObjectifRetention;
  boite: BoiteErreur;
}

/** Clôture la session : texte du rappel libre, boîtes d'erreurs, et date de la prochaine révision. */
export async function terminerSession(
  sessionId: string,
  texteRappel: string,
  tri: TriErreur[],
): Promise<{ prochaineDue: string | null }> {
  const supabase = await createClient();
  const pid = await profilCourantId();
  const jour = aujourdhui();

  const { error } = await supabase
    .from("sessions")
    .update({ ended_at: new Date().toISOString(), free_recall_text: texteRappel })
    .eq("id", sessionId)
    .eq("profile_id", pid);
  if (error) throw new Error(error.message);

  for (const t of tri) {
    const { error: e1 } = await supabase.from("answers").update({ error_box: t.boite }).eq("id", t.answerId);
    if (e1) throw new Error(e1.message);

    const { data: existante } = await supabase
      .from("reviews")
      .select("card_id, due_date, interval_days, step, ease_state, introduced_on, history")
      .eq("profile_id", pid)
      .eq("card_id", t.cardId)
      .maybeSingle();
    const ligne = existante as LigneRevision | null;
    if (!ligne) continue;

    const apres = appliquerBoite(versEtat(ligne), t.boite, t.objectif, jour);
    const historique = [...(ligne.history ?? [])];
    const derniere = historique[historique.length - 1];
    if (derniere && typeof derniere === "object") {
      historique[historique.length - 1] = { ...(derniere as object), error_box: t.boite };
    }

    const { error: e2 } = await supabase
      .from("reviews")
      .update({ ...apres, history: historique, updated_at: new Date().toISOString() })
      .eq("profile_id", pid)
      .eq("card_id", t.cardId);
    if (e2) throw new Error(e2.message);
  }

  const { data: prochaine } = await supabase
    .from("reviews")
    .select("due_date")
    .eq("profile_id", pid)
    .gt("due_date", jour)
    .order("due_date")
    .limit(1)
    .maybeSingle();

  return { prochaineDue: (prochaine?.due_date as string | undefined) ?? null };
}

// ---------- Mon cerveau ----------

export interface DonneesCerveau {
  matieres: StatMatiere[];
  calibration: Calibration[];
  messageCalibration: string | null;
  listeRouge: CarteRatee[];
  production: { production: number; total: number };
  totalReponses: number;
}

export async function donneesCerveau(): Promise<DonneesCerveau> {
  const jour = aujourdhui();
  const supabase = await createClient();
  const [{ cartes }, reponsesRes] = await Promise.all([
    chargerCartesEtRevisions(),
    supabase.from("answers").select("card_id, correct, confidence, error_box").eq("profile_id", await profilCourantId()),
  ]);
  if (reponsesRes.error) throw new Error(reponsesRes.error.message);
  const reponses = (reponsesRes.data ?? []) as ReponseStats[];

  const parMatiere = new Map<string, { id: string; name: string; color: string | null; cartes: CarteAvecMatiere[] }>();
  for (const c of cartes) {
    if (!c.matiere) continue;
    const m = parMatiere.get(c.matiere.id) ?? { ...c.matiere, cartes: [] };
    m.cartes.push(c);
    parMatiere.set(c.matiere.id, m);
  }
  const matieres: StatMatiere[] = [...parMatiere.values()].map((m) => {
    const { pourcentage, cartesVues } = pourcentageMatiere(m.cartes, jour);
    return { id: m.id, name: m.name, color: m.color, pourcentage, cartesVues, cartesTotal: m.cartes.length };
  });

  const calibration = calibrationConfiance(reponses);
  const toutesCartes = cartes.map((c) => c.carte);
  return {
    matieres,
    calibration,
    messageCalibration: messageCalibration(calibration),
    listeRouge: topRatees(reponses, toutesCartes, CONFIG_REVISION.memoire.tailleListeRouge),
    production: ratioProduction(reponses, toutesCartes),
    totalReponses: reponses.length,
  };
}

// ---------- Matières : liste, import (fusion v1 → v2), pause, export ----------

export interface MatiereEnBase {
  id: string;
  name: string;
  version: number;
  color: string | null;
  status: "active" | "paused";
  nbCartes: number;
  nbArchivees: number;
}

export async function listerMatieres(): Promise<MatiereEnBase[]> {
  const supabase = await createClient();
  const [subjectsRes, cardsRes] = await Promise.all([
    supabase.from("subjects").select("id, name, version, color, status").order("created_at"),
    supabase.from("cards").select("id, status, concepts!inner(modules!inner(subject_id))"),
  ]);
  if (subjectsRes.error) throw new Error(subjectsRes.error.message);
  if (cardsRes.error) throw new Error(cardsRes.error.message);

  const compteurs = new Map<string, { actives: number; archivees: number }>();
  for (const ligne of (cardsRes.data ?? []) as unknown as { status: string; concepts: { modules: { subject_id: string } } }[]) {
    const sid = ligne.concepts.modules.subject_id;
    const c = compteurs.get(sid) ?? { actives: 0, archivees: 0 };
    if (ligne.status === "active") c.actives += 1;
    else c.archivees += 1;
    compteurs.set(sid, c);
  }

  return (subjectsRes.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    version: s.version,
    color: s.color,
    status: s.status,
    nbCartes: compteurs.get(s.id)?.actives ?? 0,
    nbArchivees: compteurs.get(s.id)?.archivees ?? 0,
  }));
}

/** Toutes les cartes (actives et archivées) d'une matière, pour calculer la fusion. */
export async function cartesExistantes(matiereId: string): Promise<CarteExistante[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .select(
      "id, concept_id, type, question, answer, explanation, explanation_more, options, options_why, retention_goal, data, phase, level, status, " +
        "concepts!inner(name, modules!inner(subject_id))",
    )
    .eq("concepts.modules.subject_id", matiereId);
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as (LigneCarte & { status: "active" | "archived" })[]).map((ligne) => ({
    ...versCarte(ligne),
    status: ligne.status,
  }));
}

/** Aperçu avant import : ce qui changerait. */
export async function apercuImport(matiere: MatiereJson): Promise<ResultatFusion> {
  return calculerFusion(await cartesExistantes(matiere.id), matiere);
}

/**
 * Importe (ou réimporte) une matière : textes mis à jour, historique de révision
 * conservé (la table `reviews` n'est jamais touchée), cartes disparues archivées.
 */
export async function importerMatiere(matiere: MatiereJson): Promise<ResultatFusion> {
  const supabase = await createClient();
  const fusion = await apercuImport(matiere);
  const maintenant = new Date().toISOString();

  const { error: e1 } = await supabase.from("subjects").upsert({
    id: matiere.id,
    name: matiere.name,
    version: matiere.version,
    color: matiere.color ?? null,
    updated_at: maintenant,
  });
  if (e1) throw new Error(e1.message);

  const { error: e2 } = await supabase.from("modules").upsert(
    matiere.modules.map((mod, i) => ({ id: idGlobal(matiere.id, mod.id), subject_id: matiere.id, name: mod.name, position: i, galaxy: mod.galaxie ?? null })),
  );
  if (e2) throw new Error(e2.message);

  const concepts = matiere.modules.flatMap((mod) =>
    mod.concepts.map((c, i) => ({
      id: idGlobal(matiere.id, c.id),
      module_id: idGlobal(matiere.id, mod.id),
      name: c.name,
      position: i,
      discovery: c.decouverte ?? null,
      planet: c.planete ?? null,
    })),
  );
  const { error: e3 } = await supabase.from("concepts").upsert(concepts);
  if (e3) throw new Error(e3.message);

  const positions = new Map(aplatirMatiere(matiere).map((c, i) => [c.id, i]));
  const aEcrire = [...fusion.nouvelles, ...fusion.modifiees];
  if (aEcrire.length > 0) {
    const { error: e4 } = await supabase.from("cards").upsert(
      aEcrire.map((c) => ({
        id: c.id,
        concept_id: c.concept_id,
        type: c.type,
        question: c.question,
        answer: c.answer,
        explanation: c.explanation,
        explanation_more: c.explanation_more ?? null,
        options: c.options ?? null,
        options_why: c.options_why ?? null,
        retention_goal: c.retention_goal,
        data: c.data ?? null,
        phase: c.phase ?? null,
        level: c.niveau ?? null,
        status: "active",
        position: positions.get(c.id) ?? 0,
        updated_at: maintenant,
      })),
    );
    if (e4) throw new Error(e4.message);
  }

  if (fusion.archivees.length > 0) {
    const { error: e5 } = await supabase
      .from("cards")
      .update({ status: "archived", updated_at: maintenant })
      .in("id", fusion.archivees);
    if (e5) throw new Error(e5.message);
  }

  return fusion;
}

export async function basculerPause(matiereId: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("subjects").select("status").eq("id", matiereId).single();
  if (error) throw new Error(error.message);
  const { error: e2 } = await supabase
    .from("subjects")
    .update({ status: data.status === "active" ? "paused" : "active", updated_at: new Date().toISOString() })
    .eq("id", matiereId);
  if (e2) throw new Error(e2.message);
}

/** Reconstruit le fichier JSON d'une matière (cartes actives) à partir de la base. */
export async function exporterMatiere(matiereId: string): Promise<MatiereJson | null> {
  const supabase = await createClient();
  const { data: subject, error } = await supabase
    .from("subjects")
    .select("id, name, version, color")
    .eq("id", matiereId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!subject) return null;

  const [modulesRes, conceptsRes, cardsRes] = await Promise.all([
    supabase.from("modules").select("id, name, position").eq("subject_id", matiereId).order("position"),
    supabase.from("concepts").select("id, module_id, name, position, modules!inner(subject_id)").eq("modules.subject_id", matiereId).order("position"),
    supabase
      .from("cards")
      .select("id, concept_id, type, question, answer, explanation, explanation_more, options, options_why, retention_goal, data, phase, level, position, concepts!inner(modules!inner(subject_id))")
      .eq("concepts.modules.subject_id", matiereId)
      .eq("status", "active")
      .order("position"),
  ]);
  if (modulesRes.error) throw new Error(modulesRes.error.message);
  if (conceptsRes.error) throw new Error(conceptsRes.error.message);
  if (cardsRes.error) throw new Error(cardsRes.error.message);

  const prefixe = `${matiereId}/`;
  const sansPrefixe = (id: string) => (id.startsWith(prefixe) ? id.slice(prefixe.length) : id);
  const cartes = (cardsRes.data ?? []) as unknown as (LigneCarte & { position: number })[];
  const concepts = (conceptsRes.data ?? []) as unknown as { id: string; module_id: string; name: string }[];

  return {
    id: subject.id,
    name: subject.name,
    version: subject.version,
    color: subject.color ?? undefined,
    modules: (modulesRes.data ?? []).map((mod) => ({
      id: sansPrefixe(mod.id),
      name: mod.name,
      concepts: concepts
        .filter((c) => c.module_id === mod.id)
        .map((c) => ({
          id: sansPrefixe(c.id),
          name: c.name,
          cards: cartes
            .filter((k) => k.concept_id === c.id)
            .map((k) => ({
              id: sansPrefixe(k.id),
              type: k.type,
              question: k.question,
              answer: k.answer,
              explanation: k.explanation,
              ...(k.explanation_more ? { explanation_more: k.explanation_more } : {}),
              ...(k.options ? { options: k.options } : {}),
              ...(k.options_why ? { options_why: k.options_why } : {}),
              retention_goal: k.retention_goal,
              ...(k.data ? { data: k.data } : {}),
            })),
        })),
    })),
  };
}

/** Tout exporter : les tables brutes (les données appartiennent à l'utilisateur). */
export async function exporterTout(): Promise<Record<string, unknown[]>> {
  const supabase = await createClient();
  const tables = ["subjects", "modules", "concepts", "cards", "reviews", "sessions", "answers"] as const;
  const resultat: Record<string, unknown[]> = {};
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw new Error(error.message);
    resultat[table] = data ?? [];
  }
  return resultat;
}
