import type { ReactNode } from "react";
import type { FamilleCarte } from "@/lib/types";

interface Props {
  famille: FamilleCarte;
  /** Déclenche le léger tremblement (mauvaise réponse). */
  tremble?: boolean;
  children: ReactNode;
}

/** La carte blanche avec son fin liseré coloré en haut (une couleur = une famille). */
export function Carte({ famille, tremble = false, children }: Props) {
  return (
    <div
      className={`bg-carte rounded-2xl border border-bordure shadow-sm overflow-hidden ${tremble ? "anim-tremble" : ""}`}
    >
      <div className="h-1.5" style={{ background: `var(--type-${famille})` }} aria-hidden="true" />
      <div className="p-6 sm:p-8">{children}</div>
    </div>
  );
}
