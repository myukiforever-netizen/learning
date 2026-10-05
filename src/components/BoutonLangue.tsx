"use client";

// Interrupteur FR / EN des pages (accueil, galaxie, planète) : le choix est mémorisé dans un cookie
// (actions-langue.ts), puis les écrans se rafraîchissent. Il change le contenu de l'univers CISSP.
import { useOptimistic, useTransition } from "react";
import { actionChoisirLangue } from "@/app/actions-langue";
import { InterrupteurLangue } from "@/components/InterrupteurLangue";
import type { Langue } from "@/lib/langue-types";

export function BoutonLangue({ langue }: { langue: Langue }) {
  const [affichee, setAffichee] = useOptimistic<Langue, Langue>(langue, (_, suivante) => suivante);
  const [enCours, demarrer] = useTransition();

  function basculer() {
    const suivante: Langue = affichee === "en" ? "fr" : "en";
    demarrer(async () => {
      setAffichee(suivante);
      await actionChoisirLangue(suivante);
    });
  }

  return <InterrupteurLangue langue={affichee} onBasculer={basculer} enAttente={enCours} />;
}
