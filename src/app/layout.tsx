import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { lireAffichage } from "@/lib/affichage";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ancre",
  description: "Mon application personnelle d'apprentissage",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B0E1A",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Taille de texte et mode sombre viennent d'un cookie : appliqués dès le premier rendu.
  const affichage = await lireAffichage();
  const style = { "--taille-texte": `${affichage.tailleTexte}px` } as CSSProperties;

  return (
    <html lang="fr" className={`${inter.variable} h-full`} data-theme={affichage.sombre ? "dark" : undefined} style={style}>
      <body className="min-h-full flex flex-col">
        <Navigation />
        <main className="page w-full mx-auto px-4 py-5 flex-1 flex flex-col" style={{ maxWidth: "var(--largeur-max)" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
