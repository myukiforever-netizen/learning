"use client";

// Interrupteur FR / EN animé : un curseur glisse d'une langue à l'autre, puis les écrans se rafraîchissent.
// Le choix est mémorisé dans un cookie (actions-langue.ts). Il change le contenu de l'univers CISSP.
import { useOptimistic, useTransition } from "react";
import { actionChoisirLangue } from "@/app/actions-langue";
import type { Langue } from "@/lib/langue-types";

export function BoutonLangue({ langue }: { langue: Langue }) {
  const [affichee, setAffichee] = useOptimistic<Langue, Langue>(langue, (_, suivante) => suivante);
  const [enCours, demarrer] = useTransition();
  const anglais = affichee === "en";

  function basculer() {
    const suivante: Langue = anglais ? "fr" : "en";
    demarrer(async () => {
      setAffichee(suivante);
      await actionChoisirLangue(suivante);
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={anglais}
      aria-label={anglais ? "Content language: English. Switch to French / Langue du contenu : anglais, passer en français" : "Langue du contenu : français. Passer en anglais / Content language: French, switch to English"}
      title={anglais ? "English · cliquer pour le français" : "Français · click for English"}
      className="bouton-langue"
      data-langue={affichee}
      data-attente={enCours ? "oui" : undefined}
      onClick={basculer}
    >
      <span className="bouton-langue-curseur" aria-hidden="true" />
      <span className="bouton-langue-label" data-actif={!anglais ? "oui" : undefined} aria-hidden="true">
        FR
      </span>
      <span className="bouton-langue-label" data-actif={anglais ? "oui" : undefined} aria-hidden="true">
        EN
      </span>
    </button>
  );
}
