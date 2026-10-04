import { actionChoisirSecteur } from "@/app/actions-secteur";
import type { SecteurPropose } from "@/lib/supabase/odyssee";

/** Pastilles pour passer d'un secteur (matière) à l'autre. Affiché seulement s'il y en a plusieurs. */
export function SelecteurSecteur({ secteurs, courantId }: { secteurs: SecteurPropose[]; courantId: string }) {
  if (secteurs.length < 2) return null;
  return (
    <nav aria-label="Choisir un secteur" className="flex flex-wrap gap-2">
      {secteurs.map((s) => {
        const actif = s.id === courantId;
        return (
          <form key={s.id} action={actionChoisirSecteur}>
            <input type="hidden" name="secteur" value={s.id} />
            <button
              type="submit"
              className="bouton text-sm"
              aria-current={actif ? "true" : undefined}
              style={actif ? { borderColor: "var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent)" } : undefined}
            >
              {s.nom}
            </button>
          </form>
        );
      })}
    </nav>
  );
}
