import { FormulaireConnexion } from "./Formulaire";

const MESSAGES: Record<string, string> = {
  "lien-invalide": "Ce lien ne fonctionne plus. Demande-en un nouveau.",
  "non-autorise": "Cet email n'est pas autorisé sur cette application.",
};

export default async function PageConnexion({ searchParams }: PageProps<"/connexion">) {
  const { erreur } = await searchParams;
  const message = typeof erreur === "string" ? MESSAGES[erreur] ?? null : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm bg-carte rounded-2xl border border-bordure shadow-sm p-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Ancre</h1>
          <p className="texte-2 mt-1">Entre ton email : tu recevras un lien de connexion.</p>
        </div>
        <FormulaireConnexion erreurInitiale={message} />
      </div>
    </div>
  );
}
