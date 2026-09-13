"use client";

import { useState } from "react";
import { actionChoisirProfil, actionCreerProfil, actionModifierProfil, actionSupprimerProfil } from "./actions";
import { AVATARS, type Profil } from "@/lib/profils-types";

interface Props {
  profils: Profil[];
  courantId: string | null;
}

const TEINTES = [240, 280, 320, 0, 30, 60, 150, 190];

function fondAvatar(teinte: number): string {
  return `linear-gradient(135deg, hsl(${teinte} 70% 55%), hsl(${(teinte + 40) % 360} 70% 40%))`;
}

export function Profils({ profils, courantId }: Props) {
  const [mode, setMode] = useState<"choisir" | "gerer" | "creer">(profils.length === 0 ? "creer" : "choisir");
  const [enEdition, setEnEdition] = useState<Profil | null>(null);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-10 py-8">
      <h1 className="text-3xl font-semibold tracking-tight text-center">
        {mode === "creer" ? (profils.length === 0 ? "Crée ton premier profil" : "Nouveau profil") : mode === "gerer" ? "Gérer les profils" : "Qui explore aujourd'hui ?"}
      </h1>

      {mode !== "creer" && (
        <ul className="flex flex-wrap justify-center gap-6 sm:gap-8" aria-label="Profils">
          {profils.map((p) => (
            <li key={p.id} className="flex flex-col items-center gap-3">
              {mode === "choisir" ? (
                <form action={actionChoisirProfil}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className="tuile-profil" style={{ background: fondAvatar(p.teinte) }} aria-label={`Explorer avec ${p.nom}`}>
                    <span aria-hidden="true">{p.avatar}</span>
                  </button>
                </form>
              ) : (
                <button type="button" onClick={() => setEnEdition(p)} className="tuile-profil est-gerable" style={{ background: fondAvatar(p.teinte) }} aria-label={`Modifier ${p.nom}`}>
                  <span aria-hidden="true">{p.avatar}</span>
                  <span className="crayon" aria-hidden="true">✎</span>
                </button>
              )}
              <span className={`text-sm ${p.id === courantId ? "font-semibold" : "texte-2"}`}>{p.nom}</span>
            </li>
          ))}
          {mode === "choisir" && (
            <li className="flex flex-col items-center gap-3">
              <button type="button" onClick={() => setMode("creer")} className="tuile-profil est-ajout" aria-label="Ajouter un profil">
                <span aria-hidden="true">+</span>
              </button>
              <span className="texte-2 text-sm">Ajouter</span>
            </li>
          )}
        </ul>
      )}

      {mode === "choisir" && profils.length > 0 && (
        <button type="button" onClick={() => setMode("gerer")} className="bouton text-sm">
          Gérer les profils
        </button>
      )}
      {mode === "gerer" && !enEdition && (
        <button type="button" onClick={() => setMode("choisir")} className="bouton bouton-principal text-sm">
          Terminé
        </button>
      )}

      {(mode === "creer" || enEdition) && (
        <FormulaireProfil
          profil={enEdition}
          onFermer={() => {
            setEnEdition(null);
            if (mode === "creer" && profils.length > 0) setMode("choisir");
          }}
          peutAnnuler={profils.length > 0}
        />
      )}
    </div>
  );
}

function FormulaireProfil({ profil, onFermer, peutAnnuler }: { profil: Profil | null; onFermer: () => void; peutAnnuler: boolean }) {
  const [avatar, setAvatar] = useState<string>(profil?.avatar ?? AVATARS[0]);
  const [teinte, setTeinte] = useState<number>(profil?.teinte ?? TEINTES[0]);

  return (
    <div className="panneau p-6 w-full max-w-md flex flex-col gap-6">
      <form action={profil ? actionModifierProfil : actionCreerProfil} className="flex flex-col gap-5">
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
              maxLength={24}
              defaultValue={profil?.nom ?? ""}
              autoFocus
              className="min-h-12 rounded-xl border border-bordure bg-fond px-4 outline-none focus:border-accent"
              placeholder="Ton prénom"
            />
          </label>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="texte-2 text-sm mb-1">Avatar</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {AVATARS.map((a) => (
              <button key={a} type="button" role="radio" aria-checked={avatar === a} onClick={() => setAvatar(a)} className="bouton px-3 text-2xl" style={avatar === a ? { borderColor: "var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent)" } : undefined}>
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
          <button type="submit" className="bouton bouton-principal">
            {profil ? "Enregistrer" : "Créer et explorer"}
          </button>
          {peutAnnuler && (
            <button type="button" onClick={onFermer} className="bouton">
              Annuler
            </button>
          )}
        </div>
      </form>

      {profil && (
        <form
          action={actionSupprimerProfil}
          onSubmit={(e) => {
            if (!window.confirm(`Supprimer le profil « ${profil.nom} » et toute sa progression ? C'est définitif.`)) e.preventDefault();
          }}
          className="border-t border-bordure pt-4"
        >
          <input type="hidden" name="id" value={profil.id} />
          <button type="submit" className="texte-2 text-sm underline underline-offset-4" style={{ color: "var(--alerte)" }}>
            Supprimer ce profil
          </button>
        </form>
      )}
    </div>
  );
}
