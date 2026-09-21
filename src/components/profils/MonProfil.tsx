"use client";

// Section « Mon profil » des Réglages : qui est connecté, changer de profil, ou le supprimer.
import { useState } from "react";
import Link from "next/link";
import { ConfirmationSuppression } from "./ConfirmationSuppression";
import { fondAvatar, type Profil, type StatsProfil } from "@/lib/profils-types";

export function MonProfil({ profil, stats }: { profil: Profil; stats?: StatsProfil }) {
  const [confirmer, setConfirmer] = useState(false);

  return (
    <section className="panneau p-5 flex flex-col gap-4">
      <h2 className="font-medium">Mon profil</h2>

      <div className="flex items-center gap-3">
        <span
          className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl shrink-0"
          style={{ background: fondAvatar(profil.teinte) }}
          aria-hidden="true"
        >
          {profil.avatar}
        </span>
        <div>
          <p className="font-medium">{profil.nom}</p>
          <p className="texte-2 text-sm">
            {stats?.xp ?? 0} XP · {stats?.planetesValidees ?? 0} planète{(stats?.planetesValidees ?? 0) > 1 ? "s" : ""} validée
            {(stats?.planetesValidees ?? 0) > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/profils" className="bouton text-sm">
          Changer de profil
        </Link>
        {!confirmer && (
          <button
            type="button"
            onClick={() => setConfirmer(true)}
            className="bouton text-sm"
            style={{ borderColor: "var(--alerte)", color: "var(--alerte)" }}
          >
            Supprimer ce profil
          </button>
        )}
      </div>

      {confirmer && <ConfirmationSuppression profil={profil} stats={stats} onAnnuler={() => setConfirmer(false)} />}
    </section>
  );
}
