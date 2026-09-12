import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ancre",
  description: "Mon application personnelle d'apprentissage",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <main className="w-full mx-auto px-4 py-6 flex-1 flex flex-col" style={{ maxWidth: "var(--largeur-max)" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
