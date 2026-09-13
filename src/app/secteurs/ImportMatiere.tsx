"use client";

// Import d'un fichier JSON : choisir → validation → aperçu → confirmation.
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { validerMatiere, type MatiereJson } from "@/lib/import/schema";
import { actionApercuImport, actionImporterMatiere, type Apercu } from "./actions";

type Etat =
  | { etape: "choisir" }
  | { etape: "erreurs"; erreurs: string[] }
  | { etape: "apercu"; json: MatiereJson; apercu: Apercu }
  | { etape: "fait"; apercu: Apercu; nom: string };

export function ImportMatiere() {
  const router = useRouter();
  const [etat, setEtat] = useState<Etat>({ etape: "choisir" });
  const [enCours, setEnCours] = useState(false);
  const champ = useRef<HTMLInputElement>(null);

  async function lireFichier(fichier: File) {
    setEnCours(true);
    try {
      let json: unknown;
      try {
        json = JSON.parse(await fichier.text());
      } catch {
        setEtat({ etape: "erreurs", erreurs: ["Ce fichier n'est pas un JSON valide."] });
        return;
      }
      const erreursLocales = validerMatiere(json);
      if (erreursLocales.length > 0) {
        setEtat({ etape: "erreurs", erreurs: erreursLocales });
        return;
      }
      const { erreurs, apercu } = await actionApercuImport(json);
      if (erreurs.length > 0 || !apercu) setEtat({ etape: "erreurs", erreurs });
      else setEtat({ etape: "apercu", json: json as MatiereJson, apercu });
    } catch (e: unknown) {
      setEtat({ etape: "erreurs", erreurs: [e instanceof Error ? e.message : "Lecture impossible."] });
    } finally {
      setEnCours(false);
    }
  }

  async function confirmer() {
    if (etat.etape !== "apercu") return;
    setEnCours(true);
    try {
      const { erreurs, apercu } = await actionImporterMatiere(etat.json);
      if (erreurs.length > 0 || !apercu) setEtat({ etape: "erreurs", erreurs });
      else {
        setEtat({ etape: "fait", apercu, nom: etat.json.name });
        router.refresh();
      }
    } catch (e: unknown) {
      setEtat({ etape: "erreurs", erreurs: [e instanceof Error ? e.message : "Import impossible."] });
    } finally {
      setEnCours(false);
    }
  }

  function recommencer() {
    if (champ.current) champ.current.value = "";
    setEtat({ etape: "choisir" });
  }

  return (
    <div className="bg-carte rounded-2xl border border-bordure shadow-sm p-5 flex flex-col gap-4">
      <input
        ref={champ}
        type="file"
        accept="application/json,.json"
        aria-label="Fichier JSON de matière"
        disabled={enCours}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void lireFichier(f);
        }}
        className="text-sm"
      />

      {etat.etape === "erreurs" && (
        <div className="flex flex-col gap-2">
          <p className="font-medium" style={{ color: "var(--effort)" }}>
            Le fichier n&apos;est pas importable :
          </p>
          <ul className="texte-2 text-sm list-disc pl-5 flex flex-col gap-1">
            {etat.erreurs.slice(0, 10).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
            {etat.erreurs.length > 10 && <li>… et {etat.erreurs.length - 10} autres.</li>}
          </ul>
          <button type="button" onClick={recommencer} className="bouton self-start text-sm">
            Choisir un autre fichier
          </button>
        </div>
      )}

      {etat.etape === "apercu" && (
        <div className="flex flex-col gap-3">
          <p className="font-medium">
            {etat.json.name} · v{etat.json.version}
          </p>
          <Resume apercu={etat.apercu} />
          <div className="flex gap-2">
            <button type="button" onClick={confirmer} disabled={enCours} className="bouton bouton-principal">
              Confirmer l&apos;import
            </button>
            <button type="button" onClick={recommencer} disabled={enCours} className="bouton">
              Annuler
            </button>
          </div>
        </div>
      )}

      {etat.etape === "fait" && (
        <div className="flex flex-col gap-3">
          <p className="font-medium" style={{ color: "var(--ok)" }}>
            {etat.nom} importée.
          </p>
          <Resume apercu={etat.apercu} />
          <button type="button" onClick={recommencer} className="bouton self-start text-sm">
            Importer un autre fichier
          </button>
        </div>
      )}
    </div>
  );
}

function Resume({ apercu }: { apercu: Apercu }) {
  return (
    <ul className="texte-2 text-sm flex flex-col gap-1">
      <li>{apercu.nouvelles} nouvelle{apercu.nouvelles > 1 ? "s" : ""} carte{apercu.nouvelles > 1 ? "s" : ""}</li>
      <li>{apercu.modifiees} modifiée{apercu.modifiees > 1 ? "s" : ""} (historique conservé)</li>
      <li>{apercu.inchangees} inchangée{apercu.inchangees > 1 ? "s" : ""}</li>
      <li>{apercu.archivees} archivée{apercu.archivees > 1 ? "s" : ""} (jamais effacée{apercu.archivees > 1 ? "s" : ""})</li>
    </ul>
  );
}
