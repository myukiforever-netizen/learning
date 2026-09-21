"use client";

// Le dernier mot avant d'effacer un profil : ce qui sera perdu, et un choix clair.
// « Annuler » a le focus par défaut : un appui trop rapide sur Entrée ne supprime rien.
import { useFormStatus } from "react-dom";
import { actionSupprimerProfil } from "@/app/profils/actions";
import type { Profil, StatsProfil } from "@/lib/profils-types";

interface Props {
  profil: Profil;
  stats?: StatsProfil;
  onAnnuler: () => void;
}

function resumePerte(stats?: StatsProfil): string {
  if (!stats || (stats.xp === 0 && stats.planetesValidees === 0)) return "Ce profil n'a pas encore de progression.";
  const planetes = `${stats.planetesValidees} planète${stats.planetesValidees > 1 ? "s" : ""} validée${stats.planetesValidees > 1 ? "s" : ""}`;
  return `Toute sa progression sera effacée : ${stats.xp} XP et ${planetes}.`;
}

export function ConfirmationSuppression({ profil, stats, onAnnuler }: Props) {
  const titreId = `suppression-titre-${profil.id}`;
  const detailId = `suppression-detail-${profil.id}`;

  return (
    <div
      role="alertdialog"
      aria-labelledby={titreId}
      aria-describedby={detailId}
      className="panneau anim-deplie p-5 w-full max-w-md flex flex-col gap-4"
      style={{ borderColor: "var(--alerte)" }}
    >
      <p id={titreId} className="font-medium">
        Supprimer le profil « {profil.nom} » ?
      </p>
      <p id={detailId} className="texte-2 text-sm">
        {resumePerte(stats)} Les matières et leurs cartes restent pour les autres profils. C&apos;est définitif.
      </p>
      <form action={actionSupprimerProfil} className="flex flex-wrap gap-3">
        <input type="hidden" name="id" value={profil.id} />
        <BoutonConfirmer />
        <button type="button" onClick={onAnnuler} className="bouton" autoFocus>
          Annuler
        </button>
      </form>
    </div>
  );
}

function BoutonConfirmer() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-son="alerte"
      className="bouton"
      style={{ borderColor: "var(--alerte)", color: "var(--alerte)" }}
    >
      {pending ? "Suppression…" : "Supprimer définitivement"}
    </button>
  );
}
