"use client";

// Le menu : discret mais toujours au même endroit. Barre en bas sur téléphone,
// barre fine en haut sur ordinateur. Caché pendant une séance (rien ne doit distraire).
import Link from "next/link";
import { usePathname } from "next/navigation";

const ENTREES = [
  { href: "/", icone: "🪐", libelle: "Univers" },
  { href: "/patrouille", icone: "🛰️", libelle: "Patrouille" },
  { href: "/cerveau", icone: "🧠", libelle: "Cerveau" },
  { href: "/secteurs", icone: "📚", libelle: "Secteurs" },
  { href: "/reglages", icone: "⚙️", libelle: "Réglages" },
] as const;

/** Pages où l'on est en pleine concentration : le menu disparaît, « Quitter » suffit. */
const SANS_MENU = [/^\/patrouille/, /^\/planete\/[^/]+\/(decouverte|comprehension|entrainement|mission)/, /^\/galaxie\/[^/]+\/soleil/, /^\/profils/, /^\/configuration/];

export function Navigation() {
  const chemin = usePathname();
  if (SANS_MENU.some((r) => r.test(chemin))) return null;

  return (
    <nav className="navigation" aria-label="Menu principal">
      {ENTREES.map((e) => {
        const actif = e.href === "/" ? chemin === "/" || chemin.startsWith("/galaxie") || chemin.startsWith("/planete") : chemin.startsWith(e.href);
        return (
          <Link key={e.href} href={e.href} className={`navigation-lien ${actif ? "est-actif" : ""}`} aria-current={actif ? "page" : undefined}>
            <span className="navigation-icone" aria-hidden="true">
              {e.icone}
            </span>
            <span className="navigation-libelle">{e.libelle}</span>
          </Link>
        );
      })}
    </nav>
  );
}
