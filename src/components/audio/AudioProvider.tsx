"use client";

// Le son de toute l'app : réglages mémorisés dans le navigateur, démarrage au premier
// geste, et un seul écouteur de clic qui sonorise tous les boutons et liens.
//
// Un élément peut choisir son son avec `data-son="decollage"`, ou se taire avec
// `data-son="aucun"`. Une zone entière peut gérer ses propres sons avec `data-sans-son`.
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { appliquerReglages, demarrerAudio, jouer as jouerSon } from "@/lib/audio/moteur";
import {
  CLE_AUDIO,
  REGLAGES_AUDIO_DEFAUT,
  SONS,
  estSilencieux,
  lireReglagesAudio,
  type NomSon,
  type ReglagesAudio,
} from "@/lib/audio/sons";

const EVENEMENT = "ancre:audio";

interface ValeurContexte {
  jouer: (nom: NomSon) => void;
  reglages: ReglagesAudio;
  majReglages: (patch: Partial<ReglagesAudio>) => void;
  silence: boolean;
  basculerSilence: () => void;
}

const Contexte = createContext<ValeurContexte | null>(null);

function souscrire(rappel: () => void): () => void {
  window.addEventListener("storage", rappel);
  window.addEventListener(EVENEMENT, rappel);
  return () => {
    window.removeEventListener("storage", rappel);
    window.removeEventListener(EVENEMENT, rappel);
  };
}

function lireStockage(): string | null {
  try {
    return window.localStorage.getItem(CLE_AUDIO);
  } catch {
    return null; // navigation privée ou stockage bloqué : réglages par défaut
  }
}

export function AudioProvider({ children }: { children: ReactNode }) {
  // useSyncExternalStore : on lit le stockage sans setState dans un effet.
  const brut = useSyncExternalStore(souscrire, lireStockage, () => null);
  const reglages = useMemo(() => lireReglagesAudio(brut), [brut]);

  useEffect(() => {
    appliquerReglages(reglages);
  }, [reglages]);

  // Premier geste : les navigateurs n'autorisent le son qu'après une interaction.
  // Même écouteur pour sonoriser les clics de toute l'app.
  useEffect(() => {
    const reveiller = () => demarrerAudio();
    const surClic = (e: MouseEvent) => {
      const cible = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-son], button, a");
      if (!cible) return;
      const demande = cible.dataset.son;
      if (demande === "aucun") return;
      if (demande && demande in SONS) {
        jouerSon(demande as NomSon);
        return;
      }
      if (cible.closest("[data-sans-son]")) return; // la zone joue ses propres sons
      if (cible.tagName === "BUTTON" || cible.tagName === "A") jouerSon("tap");
    };

    window.addEventListener("pointerdown", reveiller, true);
    window.addEventListener("keydown", reveiller, true);
    document.addEventListener("click", surClic, true);
    return () => {
      window.removeEventListener("pointerdown", reveiller, true);
      window.removeEventListener("keydown", reveiller, true);
      document.removeEventListener("click", surClic, true);
    };
  }, []);

  const majReglages = useCallback(
    (patch: Partial<ReglagesAudio>) => {
      const nouveaux = { ...reglages, ...patch };
      try {
        window.localStorage.setItem(CLE_AUDIO, JSON.stringify(nouveaux));
      } catch {
        appliquerReglages(nouveaux); // stockage indisponible : au moins la session courante
      }
      window.dispatchEvent(new Event(EVENEMENT));
    },
    [reglages],
  );

  const silence = estSilencieux(reglages);

  const valeur = useMemo<ValeurContexte>(
    () => ({
      jouer: jouerSon,
      reglages,
      majReglages,
      silence,
      basculerSilence: () => majReglages(silence ? { musique: true, effets: true } : { musique: false, effets: false }),
    }),
    [reglages, majReglages, silence],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

/** Le son, depuis n'importe quel composant client. Hors provider : tout est silencieux. */
export function useSon(): ValeurContexte {
  return (
    useContext(Contexte) ?? {
      jouer: () => {},
      reglages: REGLAGES_AUDIO_DEFAUT,
      majReglages: () => {},
      silence: false,
      basculerSilence: () => {},
    }
  );
}
