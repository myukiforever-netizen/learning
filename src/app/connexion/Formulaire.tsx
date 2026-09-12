"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  erreurInitiale: string | null;
}

type Etat = "saisie" | "envoi" | "envoye";

export function FormulaireConnexion({ erreurInitiale }: Props) {
  const [email, setEmail] = useState("");
  const [etat, setEtat] = useState<Etat>("saisie");
  const [erreur, setErreur] = useState<string | null>(erreurInitiale);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEtat("envoi");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        // Aucun compte n'est créé depuis l'app : le seul compte existe déjà côté Supabase.
        shouldCreateUser: false,
      },
    });

    if (error) {
      setErreur(
        error.message.toLowerCase().includes("signups not allowed")
          ? "Cet email n'est pas autorisé sur cette application."
          : "Impossible d'envoyer le lien. Réessaie dans un instant.",
      );
      setEtat("saisie");
      return;
    }
    setEtat("envoye");
  }

  if (etat === "envoye") {
    return (
      <div className="anim-deplie flex flex-col gap-2">
        <p className="font-medium">Regarde ta boîte mail.</p>
        <p className="texte-2">Un lien de connexion t&apos;attend à l&apos;adresse {email}. Il est valable quelques minutes.</p>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="texte-2 text-sm">Email</span>
        <input
          type="email"
          required
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-12 rounded-xl border border-bordure bg-carte px-4 outline-none focus:border-accent"
          placeholder="toi@exemple.com"
        />
      </label>
      {erreur && (
        <p className="text-sm" style={{ color: "var(--alerte)" }}>
          {erreur}
        </p>
      )}
      <button type="submit" className="bouton bouton-principal" disabled={etat === "envoi"}>
        {etat === "envoi" ? "Envoi…" : "Recevoir mon lien"}
      </button>
    </form>
  );
}
