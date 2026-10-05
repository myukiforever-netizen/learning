"use client";

// Apparence de l'interrupteur FR / EN : un curseur glisse d'une langue à l'autre. Style : .bouton-langue (globals.css).
// Réutilisé par BoutonLangue (pages : choix mémorisé côté serveur) et par la séance de cartes (bascule sans recharger).
import type { Langue } from "@/lib/langue-types";

interface Props {
  langue: Langue;
  onBasculer: () => void;
  enAttente?: boolean;
}

export function InterrupteurLangue({ langue, onBasculer, enAttente = false }: Props) {
  const anglais = langue === "en";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={anglais}
      aria-label={
        anglais
          ? "Content language: English. Switch to French / Langue du contenu : anglais, passer en français"
          : "Langue du contenu : français. Passer en anglais / Content language: French, switch to English"
      }
      title={anglais ? "English · cliquer pour le français" : "Français · click for English"}
      className="bouton-langue"
      data-langue={langue}
      data-attente={enAttente ? "oui" : undefined}
      onClick={onBasculer}
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
