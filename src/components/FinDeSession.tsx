"use client";

// Fin de session (règle 8) : page blanche → liste des concepts vus → tri des
// erreurs en 3 boîtes → récap en 3 lignes + « Ta vraie note, c'est dans 3 jours. »
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ajouterJours } from "@/lib/dates";
import type { BoiteErreur, Carte, ObjectifRetention, ReponseSession } from "@/lib/types";

type Phase = "rappel" | "concepts" | "tri" | "recap";

interface Tri {
  cardId: string;
  objectif: ObjectifRetention;
  boite: BoiteErreur;
}

interface Props {
  /** Toutes les cartes de la session (sans doublon). */
  cartes: Carte[];
  reponses: ReponseSession[];
  aujourdhui: string;
  onTerminer: (texteRappel: string, tri: Tri[]) => Promise<{ prochaineDue: string | null }>;
  erreurSauvegarde: string | null;
}

const BOITES: { boite: BoiteErreur; emoji: string; titre: string; detail: string; touche: string }[] = [
  { boite: "never_knew", emoji: "🕳️", titre: "Jamais vraiment su", detail: "Je la réapprends depuis le début.", touche: "1" },
  { boite: "not_retrieved", emoji: "🔒", titre: "Je savais, pas retrouvé", detail: "Elle reviendra plus vite.", touche: "2" },
  { boite: "thought_knew", emoji: "⚠️", titre: "Je croyais savoir", detail: "Priorité maximale : retour au début.", touche: "3" },
];

export function FinDeSession({ cartes, reponses, aujourdhui, onTerminer, erreurSauvegarde }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("rappel");
  const [texte, setTexte] = useState("");
  const [tri, setTri] = useState<Tri[]>([]);
  const [indexTri, setIndexTri] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const [prochaineDue, setProchaineDue] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  // Les cartes ratées = celles dont la PREMIÈRE réponse était fausse.
  const erreurs = useMemo(() => {
    const premieres = new Map<string, ReponseSession>();
    for (const r of reponses) if (!premieres.has(r.card_id)) premieres.set(r.card_id, r);
    return cartes.filter((c) => premieres.get(c.id)?.correct === false);
  }, [cartes, reponses]);

  const concepts = useMemo(() => [...new Set(cartes.map((c) => c.concept_nom))], [cartes]);
  const cartesTravaillees = new Set(reponses.map((r) => r.card_id)).size;
  const carteATrier = erreurs[indexTri];

  const cloturer = useCallback(
    async (triFinal: Tri[]) => {
      setEnCours(true);
      try {
        const resultat = await onTerminer(texte, triFinal);
        setProchaineDue(resultat.prochaineDue);
      } catch (e: unknown) {
        setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
      } finally {
        setEnCours(false);
        setPhase("recap");
      }
    },
    [onTerminer, texte],
  );

  const validerRappel = useCallback(() => {
    if (texte.trim().length === 0) return;
    setPhase("concepts");
  }, [texte]);

  const apresConcepts = useCallback(() => {
    if (erreurs.length === 0) void cloturer([]);
    else setPhase("tri");
  }, [erreurs.length, cloturer]);

  const choisirBoite = useCallback(
    (boite: BoiteErreur) => {
      if (!carteATrier || enCours) return;
      const nouveauTri = [...tri, { cardId: carteATrier.id, objectif: carteATrier.retention_goal, boite }];
      setTri(nouveauTri);
      if (indexTri + 1 >= erreurs.length) void cloturer(nouveauTri);
      else setIndexTri(indexTri + 1);
    },
    [carteATrier, enCours, tri, indexTri, erreurs.length, cloturer],
  );

  // ---- Raccourcis : Ctrl+Entrée valide le rappel, Entrée avance, 1-3 = boîtes
  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      const cible = e.target as HTMLElement | null;
      const dansTexte = cible?.tagName === "TEXTAREA";
      const touche = e.code === "Space" ? " " : e.key;

      if (phase === "rappel") {
        if (touche === "Enter" && (e.ctrlKey || e.metaKey || !dansTexte)) {
          e.preventDefault();
          validerRappel();
        }
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const surUnControle = !!cible && ["BUTTON", "A"].includes(cible.tagName);

      if (phase === "concepts" && touche === "Enter" && !surUnControle) {
        e.preventDefault();
        apresConcepts();
      } else if (phase === "tri" && /^[1-3]$/.test(touche)) {
        e.preventDefault();
        choisirBoite(BOITES[Number(touche) - 1].boite);
      } else if (phase === "recap" && touche === "Enter" && !surUnControle) {
        e.preventDefault();
        router.push("/");
      }
    }
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [phase, validerRappel, apresConcepts, choisirBoite, router]);

  // ---- Rendu ----------------------------------------------------------

  if (phase === "rappel") {
    return (
      <Cadre liseré="var(--type-page-blanche)">
        <p className="texte-2 text-sm mb-4">Page blanche</p>
        <h1 className="question mb-4">Écris tout ce que tu retiens de cette session.</h1>
        <p className="texte-2 mb-4">Sans regarder. Des mots, des bouts de phrases, ça suffit.</p>
        <textarea
          className="w-full rounded-xl border border-bordure bg-fond p-4 min-h-40 outline-none focus:border-accent"
          autoFocus
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          aria-label="Rappel libre"
        />
        <button
          type="button"
          onClick={validerRappel}
          disabled={texte.trim().length === 0}
          className="bouton bouton-principal mt-6 w-full"
        >
          J&apos;ai fini
          <span className="touche">Ctrl + Entrée</span>
        </button>
      </Cadre>
    );
  }

  if (phase === "concepts") {
    return (
      <Cadre liseré="var(--type-page-blanche)">
        <p className="texte-2 text-sm mb-4">Page blanche</p>
        <h1 className="question mb-4">Voici les concepts vus aujourd&apos;hui. Lesquels as-tu oubliés ?</h1>
        <ul className="flex flex-col gap-2 mb-6">
          {concepts.map((nom) => (
            <li key={nom} className="rounded-xl border border-bordure px-4 py-3">
              {nom}
            </li>
          ))}
        </ul>
        <button type="button" onClick={apresConcepts} disabled={enCours} className="bouton bouton-principal w-full">
          {erreurs.length === 0 ? "Voir le récap" : `Trier mes ${erreurs.length} erreur${erreurs.length > 1 ? "s" : ""}`}
          <span className="touche">Entrée</span>
        </button>
      </Cadre>
    );
  }

  if (phase === "tri" && carteATrier) {
    return (
      <Cadre liseré="var(--type-page-blanche)">
        <p className="texte-2 text-sm mb-4">
          Tri des erreurs · {indexTri + 1} / {erreurs.length}
        </p>
        <p className="question mb-2">{carteATrier.question}</p>
        <p className="mb-6">
          <span className="texte-2">Réponse : </span>
          {carteATrier.answer}
        </p>
        <p className="texte-2 mb-3">Pourquoi tu l&apos;as ratée ?</p>
        <div className="flex flex-col gap-3">
          {BOITES.map((b) => {
            const alerte = b.boite === "thought_knew";
            return (
              <button
                key={b.boite}
                type="button"
                onClick={() => choisirBoite(b.boite)}
                disabled={enCours}
                className="bouton bouton-choix"
                style={alerte ? { borderColor: "var(--alerte)" } : undefined}
              >
                <span className="touche">{b.touche}</span>
                <span aria-hidden="true">{b.emoji}</span>
                <span className="flex flex-col items-start">
                  <span className="font-medium" style={alerte ? { color: "var(--alerte)" } : undefined}>
                    {b.titre}
                  </span>
                  <span className="texte-2 text-sm font-normal">{b.detail}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Cadre>
    );
  }

  // ---- Récap : la seule célébration (600 ms)
  const nbAlerte = tri.filter((t) => t.boite === "thought_knew").length;
  return (
    <div className="flex-1 flex flex-col justify-center">
      <div className="anim-fin bg-carte rounded-2xl border border-bordure shadow-sm overflow-hidden">
        <div className="h-1.5" style={{ background: "var(--type-page-blanche)" }} aria-hidden="true" />
        <div className="p-8 flex flex-col items-center text-center gap-6">
          <svg
            width="56"
            height="56"
            viewBox="0 0 32 32"
            aria-hidden="true"
            fill="none"
            stroke="var(--ok)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="16" cy="16" r="14" />
            <path d="M9.5 16.5l4.5 4.5 8.5-9" />
          </svg>
          <h1 className="text-2xl font-semibold">Session terminée</h1>
          <div className="flex flex-col gap-1">
            <p>
              {cartesTravaillees} carte{cartesTravaillees > 1 ? "s" : ""} travaillée{cartesTravaillees > 1 ? "s" : ""}
            </p>
            <p>
              {erreurs.length === 0
                ? "Aucune erreur"
                : `${erreurs.length} erreur${erreurs.length > 1 ? "s" : ""} triée${erreurs.length > 1 ? "s" : ""}${
                    nbAlerte > 0 ? `, dont ${nbAlerte} ⚠️` : ""
                  }`}
            </p>
            <p>Prochaine révision : {libelleProchaine(prochaineDue, aujourdhui)}</p>
            <p className="question mt-4">Ta vraie note, c&apos;est dans 3 jours.</p>
          </div>
          {(erreur || erreurSauvegarde) && (
            <p className="texte-2 text-sm">Enregistrement impossible : {erreur ?? erreurSauvegarde}</p>
          )}
          <Link href="/" className="bouton bouton-principal mt-2">
            Retour à l&apos;accueil
            <span className="touche">Entrée</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function libelleProchaine(due: string | null, aujourdhui: string): string {
  if (!due) return "demain";
  if (due <= ajouterJours(aujourdhui, 1)) return "demain";
  const [a, m, j] = due.split("-").map(Number);
  return new Date(a, m - 1, j).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function Cadre({ liseré, children }: { liseré: string; children: React.ReactNode }) {
  return (
    <div className="anim-apparait bg-carte rounded-2xl border border-bordure shadow-sm overflow-hidden">
      <div className="h-1.5" style={{ background: liseré }} aria-hidden="true" />
      <div className="p-6 sm:p-8">{children}</div>
    </div>
  );
}
