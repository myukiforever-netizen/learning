"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { actionChoisirProfil, actionCreerProfil, actionModifierProfil } from "./actions";
import { ConfirmationSuppression } from "@/components/profils/ConfirmationSuppression";
import {
  AVATARS,
  LONGUEUR_NOM_MAX,
  fondAvatar,
  messageNomPris,
  profilAuMemeNom,
  type Profil,
  type StatsProfil,
} from "@/lib/profils-types";

interface Props {
  profils: Profil[];
  courantId: string | null;
  stats: Record<string, StatsProfil>;
}

const TEINTES = [240, 280, 320, 0, 30, 60, 150, 190];

export function Profils({ profils, courantId, stats }: Props) {
  const [mode, setMode] = useState<"choisir" | "gerer" | "creer">("choisir");
  const [enEditionId, setEnEditionId] = useState<string | null>(null);
  const [aSupprimerId, setASupprimerId] = useState<string | null>(null);

  // Tout est déduit de la liste à jour : un profil supprimé disparaît aussi des panneaux ouverts.
  const modeAffiche = profils.length === 0 ? "creer" : mode;
  const enEdition = profils.find((p) => p.id === enEditionId) ?? null;
  const aSupprimer = profils.find((p) => p.id === aSupprimerId) ?? null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-10 py-8">
      <h1 className="text-3xl font-semibold tracking-tight text-center">
        {modeAffiche === "creer"
          ? profils.length === 0
            ? "Crée ton premier profil"
            : "Nouveau profil"
          : modeAffiche === "gerer"
            ? "Gérer les profils"
            : "Qui explore aujourd'hui ?"}
      </h1>

      {modeAffiche !== "creer" && (
        <ul className="flex flex-wrap justify-center gap-6 sm:gap-8" aria-label="Profils">
          {profils.map((p) => (
            <li key={p.id} className="flex flex-col items-center gap-2">
              {modeAffiche === "choisir" ? (
                <form action={actionChoisirProfil}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" data-son="profil" className="tuile-profil" style={{ background: fondAvatar(p.teinte) }} aria-label={`Explorer avec ${p.nom}`}>
                    <span aria-hidden="true">{p.avatar}</span>
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setASupprimerId(null);
                    setEnEditionId(p.id);
                  }}
                  className="tuile-profil est-gerable"
                  style={{ background: fondAvatar(p.teinte) }}
                  aria-label={`Modifier ${p.nom}`}
                >
                  <span aria-hidden="true">{p.avatar}</span>
                  <span className="crayon" aria-hidden="true">
                    ✎
                  </span>
                </button>
              )}
              <span className={`text-sm ${p.id === courantId ? "font-semibold" : "texte-2"}`}>{p.nom}</span>
              {modeAffiche === "gerer" && (
                <button
                  type="button"
                  onClick={() => {
                    setEnEditionId(null);
                    setASupprimerId(p.id);
                  }}
                  className="text-sm underline underline-offset-4"
                  style={{ color: "var(--alerte)" }}
                  aria-label={`Supprimer le profil ${p.nom}`}
                >
                  Supprimer
                </button>
              )}
            </li>
          ))}
          {modeAffiche === "choisir" && (
            <li className="flex flex-col items-center gap-2">
              <button type="button" onClick={() => setMode("creer")} className="tuile-profil est-ajout" aria-label="Ajouter un profil">
                <span aria-hidden="true">+</span>
              </button>
              <span className="texte-2 text-sm">Ajouter</span>
            </li>
          )}
        </ul>
      )}

      {aSupprimer && <ConfirmationSuppression profil={aSupprimer} stats={stats[aSupprimer.id]} onAnnuler={() => setASupprimerId(null)} />}

      {modeAffiche === "choisir" && (
        <button type="button" onClick={() => setMode("gerer")} className="bouton text-sm">
          Gérer les profils
        </button>
      )}
      {modeAffiche === "gerer" && !enEdition && !aSupprimer && (
        <button type="button" onClick={() => setMode("choisir")} className="bouton bouton-principal text-sm">
          Terminé
        </button>
      )}

      {(modeAffiche === "creer" || enEdition) && (
        <FormulaireProfil
          key={enEdition?.id ?? "nouveau"}
          profil={enEdition}
          profils={profils}
          onFermer={() => {
            setEnEditionId(null);
            if (modeAffiche === "creer") setMode("choisir");
          }}
          onSupprimer={(p) => {
            setEnEditionId(null);
            setASupprimerId(p.id);
          }}
          peutAnnuler={profils.length > 0}
        />
      )}
    </div>
  );
}

interface PropsFormulaire {
  profil: Profil | null;
  profils: Profil[];
  onFermer: () => void;
  onSupprimer: (profil: Profil) => void;
  peutAnnuler: boolean;
}

function FormulaireProfil({ profil, profils, onFermer, onSupprimer, peutAnnuler }: PropsFormulaire) {
  const [avatar, setAvatar] = useState<string>(profil?.avatar ?? AVATARS[0]);
  const [teinte, setTeinte] = useState<number>(profil?.teinte ?? TEINTES[0]);
  const [nom, setNom] = useState(profil?.nom ?? "");
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);

  // Vérification immédiate pendant la frappe ; le serveur revérifie de toute façon.
  const doublon = profilAuMemeNom(nom, profils, profil?.id);
  const erreur = doublon ? messageNomPris(doublon.nom) : erreurServeur;
  const nomVide = nom.trim() === "";

  async function soumettre(formData: FormData) {
    setErreurServeur(null);
    const resultat = profil ? await actionModifierProfil(formData) : await actionCreerProfil(formData);
    // Une création réussie redirige vers l'univers : on n'arrive ici qu'en cas de refus ou après un renommage.
    if (resultat?.erreur) {
      setErreurServeur(resultat.erreur);
      return;
    }
    onFermer();
  }

  return (
    <div className="panneau p-6 w-full max-w-md flex flex-col gap-6">
      <form action={soumettre} className="flex flex-col gap-5">
        {profil && <input type="hidden" name="id" value={profil.id} />}
        <input type="hidden" name="avatar" value={avatar} />
        <input type="hidden" name="teinte" value={teinte} />

        <div className="flex items-center gap-4">
          <div className="tuile-profil" style={{ background: fondAvatar(teinte), width: 72, height: 72, fontSize: 36 }} aria-hidden="true">
            {avatar}
          </div>
          <label className="flex-1 flex flex-col gap-1">
            <span className="texte-2 text-sm">Nom</span>
            <input
              name="nom"
              required
              maxLength={LONGUEUR_NOM_MAX}
              value={nom}
              onChange={(e) => {
                setNom(e.target.value);
                setErreurServeur(null);
              }}
              autoFocus
              autoComplete="off"
              aria-invalid={Boolean(erreur)}
              aria-describedby={erreur ? "erreur-nom-profil" : undefined}
              className="min-h-12 rounded-xl border bg-fond px-4 outline-none focus:border-accent"
              style={{ borderColor: erreur ? "var(--effort)" : "var(--bordure)" }}
              placeholder="Ton prénom"
            />
          </label>
        </div>
        {erreur && (
          <p id="erreur-nom-profil" role="alert" className="text-sm -mt-2" style={{ color: "var(--effort)" }}>
            {erreur}
          </p>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="texte-2 text-sm mb-1">Avatar</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={avatar === a}
                onClick={() => setAvatar(a)}
                className="bouton px-3 text-2xl"
                style={avatar === a ? { borderColor: "var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent)" } : undefined}
              >
                <span aria-hidden="true">{a}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="texte-2 text-sm mb-1">Couleur</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {TEINTES.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={teinte === t}
                aria-label={`Teinte ${t}`}
                onClick={() => setTeinte(t)}
                className="w-10 h-10 rounded-full border-2"
                style={{ background: fondAvatar(t), borderColor: teinte === t ? "var(--texte)" : "transparent" }}
              />
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-3">
          <BoutonEnvoyer libelle={profil ? "Enregistrer" : "Créer et explorer"} bloque={Boolean(doublon) || nomVide} />
          {peutAnnuler && (
            <button type="button" onClick={onFermer} className="bouton">
              Annuler
            </button>
          )}
        </div>
      </form>

      {profil && (
        <div className="border-t border-bordure pt-4">
          <button
            type="button"
            onClick={() => onSupprimer(profil)}
            className="texte-2 text-sm underline underline-offset-4"
            style={{ color: "var(--alerte)" }}
          >
            Supprimer ce profil
          </button>
        </div>
      )}
    </div>
  );
}

/** Désactivé pendant l'envoi : un double clic ne crée plus deux profils. */
function BoutonEnvoyer({ libelle, bloque }: { libelle: string; bloque: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || bloque} className="bouton bouton-principal">
      {pending ? "Un instant…" : libelle}
    </button>
  );
}
