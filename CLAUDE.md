# Ancre — application personnelle d'apprentissage

## Le projet en 5 lignes

- Application web pour UN SEUL utilisateur (le product owner, qui n'est pas développeur : lui expliquer toujours en langage simple ce qui est fait et ce qu'il doit tester).
- Apprentissage par petites cartes interactives : on répond avant de voir la réponse, on note sa confiance, on trie ses erreurs.
- Moteur de révision espacée simple et lisible, entièrement paramétré dans `src/lib/revision/config.ts`.
- Les matières sont des paquets JSON versionnés, importables et réimportables sans perdre l'historique (schéma dans `SCHEMA.md`).
- Documents de référence (à lire en cas de doute) : `docs/plan_app_apprentissage.md` (produit) et `docs/plan_app_partie2_ui.md` (design). Contenu : vocabulaire simple, analogies concrètes, accessible dès 13 ans (demande du 13/09/2026).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS, code dans `src/`
- Supabase : base Postgres, **sans compte utilisateur** : profils à la Netflix (table `profiles`, cookie `ancre.profil`), progression rattachée à `profile_id`, contenu partagé. Clés dans `.env.local` (jamais dans le code), modèle dans `.env.example` ; `SUPABASE_SECRET_KEY` optionnelle, serveur uniquement
- Vercel pour le déploiement (jalon 6)
- Vitest pour les tests de la logique
- Aucune autre dépendance sans l'accord du product owner

## Commandes

```bash
npm run dev      # lance l'app sur http://localhost:3000
npm test         # lance les tests Vitest
npm run build    # vérifie que l'app compile pour la production
npm run lint     # vérifie le code
```

## Structure

```
src/app/            écrans : / (carte de l'univers), galaxie/[id] (+ /soleil), planete/[id] (+ /decouverte, /[phase]), patrouille, secteurs, cerveau, reglages, connexion, configuration
src/app/session/    Session.tsx (client : le moteur des séances, prop `mode`) ; actions.ts (actions serveur). Pas de page.
src/app/planete/actions.ts  fin de phase / de soleil (progression + XP)
src/lib/odyssee/    univers.ts (statuts, déblocage), maitrise.ts (étoiles, détresse), recompenses.ts (XP, niveaux, carburant), composer.ts (phases, mission, soleil), planete.ts (apparence procédurale), urls.ts (ids ↔ adresses, « / » ↔ « ~ »)
src/lib/supabase/odyssee.ts  lectures/écritures Odyssée (univers, progression, profil)
src/components/odyssee/  CarteUnivers, Hud, PlaneteSvg, FinDePhase
src/components/     composants d'interface ; cartes/ = un fichier par mécanique (Flash, Qcm, Cloze, Libre, Exemple, Sort) ; FinDeSession.tsx = page blanche → tri → récap
src/lib/cartes/     verifier.ts : comparaison tolérante, lecture des trous [[...]], vérification classer/ordonner
src/lib/revision/   config.ts (TOUTES les valeurs réglables), planifier.ts (dates dues, boîtes), composer.ts (composition de session), serie.ts (🔥)
src/lib/dates.ts    « aujourd'hui » dans le fuseau de l'utilisateur, ajout de jours
src/lib/import/     schema.ts (types + validation + aplatissement), fusionner.ts (v1 → v2 : nouvelles/modifiées/archivées)
src/lib/supabase/   client.ts / server.ts (clients) ; requetes.ts = TOUTES les lectures/écritures en base
src/data/matieres/  les matières livrées avec l'app (un JSON par matière, listées dans index.ts)
src/app/api/export  téléchargement JSON (une matière réimportable, ou toutes les tables)
supabase/migrations/ SQL de création des tables
tests/              tests Vitest de la logique pure
docs/               les 2 documents de référence
```

## Conventions

- Interface en français, tutoiement, ton calme et encourageant. Jamais « Faux ! » ou « Échec » : « Pas encore », « Regarde pourquoi ».
- Noms de fichiers et de variables en français pour la logique métier (planifier, composer, carte, confiance), en anglais pour les champs de base de données (alignés sur le prompt : `cards`, `reviews`, `answers`, `sessions`).
- Logique de révision en TypeScript pur, sans React ni Supabase, pour être testable.
- Variables CSS obligatoires partout (définies dans `src/app/globals.css`) : `--fond`, `--carte`, `--texte`, `--texte-2`, `--bordure`, `--accent`, `--ok`, `--effort`, `--alerte`, `--type-memoire`, `--type-comprendre`, `--type-procedure`, `--type-duel`, `--taille-question` (20px), `--taille-texte` (17px).
- Police Inter, une colonne centrée max 640px, boutons min 48px de haut, interligne 1.5, ligne max ~65 caractères.
- Animations CSS uniquement (transform + opacity), ease-out : 150ms micro-feedback, 250ms transitions, 600ms fin de session (seule célébration). Respecter `prefers-reduced-motion`.
- Raccourcis clavier : 1-4 = choix, Espace = révéler, Entrée = valider, E = en savoir plus.
- Simple avant élégant. Corriger la cause racine d'un bug, jamais une rustine.

## Les 10 règles produit v2 « Odyssée » (13/09/2026, remplacent les règles v1)

1. On ne peut jamais être interrogé sur une notion qu'on n'a pas découverte. Chaque planète commence par la découverte.
2. Une planète = 5 phases dans l'ordre : découverte, compréhension, entraînement, mission, révision. On peut rejouer n'importe quelle phase.
3. On répond toujours avant de voir la réponse ; la confiance se note avant la révélation.
4. Chaque erreur explique le pourquoi en 2 lignes + « en savoir plus ». Ton encourageant : jamais « échec ».
5. Une carte ratée revient dans la même séance, 5 à 10 cartes plus loin (sauf mission et soleil).
6. Le score n'apparaît qu'à la fin d'une mission ou d'une séance ; pendant, seule la progression est visible.
7. Fin de patrouille obligatoire : journal de bord (page blanche) puis rapport d'incident (tri des erreurs en 3 boîtes).
8. Chaque récompense (XP, badge, objet) est déclenchée par un acte d'apprentissage réel, jamais par le temps passé ni les clics.
9. Animations et sons ne bloquent jamais une action ; `prefers-reduced-motion` respecté ; « silence radio » coupe tout.
10. Message de fin de patrouille : « Ta vraie note, c'est dans 3 jours. »

Les règles v1 « pas de sons, pas de badges, pas de décoration, rien ne bouge pendant la lecture » sont **levées** par le product owner (immersion partout). Les docs de design restent la référence pour la lisibilité (contraste, Inter, tailles).

## L'univers (vocabulaire)

Matière = **secteur** · module = **galaxie** · concept = **planète** · cartes = **notions / missions** · soleil = épreuve finale de la galaxie · patrouille = séance de révision espacée · signal de détresse = notion due ou fragile · trou noir = boîte ⚠️.
Déblocage : planètes dans l'ordre (mission ≥ 80 %), galaxie suivante après le soleil, saut hyperspatial optionnel (sonde). Plan détaillé : `~/.claude/plans/…` (jalons S1→S7).

## Décisions prises avec le product owner

- Pipeline IA de génération de cartes : hors périmètre J1→J6 (les JSON sont produits hors de l'app).
- Carte Flash : réponse dans la tête → confiance → révélation → auto-évaluation « j'avais bon / pas encore ».
- Boîte « je croyais savoir » : intervalle quasi remis à zéro + marqueur ⚠️ sur la carte. Pas de carte « Pourquoi ? » auto-générée.
- Page blanche : après écriture, l'app affiche la liste des concepts vus dans la session (auto-comparaison).
- Plus de connexion : profils à la Netflix (13/09/2026). L'app est personnelle ; la sécurité repose sur la discrétion de l'adresse et, en option, la clé secrète côté serveur.

## Méthode de travail

- Jalon par jalon (J1→J6), jamais deux à la fois. Fin de jalon = app qui tourne + checklist de test manuel de 2 minutes + commit git clair + push GitHub.
- Ce fichier est mis à jour à chaque jalon.

## Notes techniques

- Next.js 16 : l'aiguillage se fait dans `src/proxy.ts` (remplace `middleware.ts`) : sans clés → /configuration ; sans cookie de profil → /profils. Aucun appel réseau dans le proxy.
- Profils (13/09/2026, demande du product owner) : plus d'auth par email. `src/lib/profils.ts` (cookie, CRUD), écran `/profils`. Toute requête sur reviews / answers / sessions / settings / planet_progress / galaxy_progress / progression / xp_events DOIT filtrer ou renseigner `profile_id` (via `profilCourantId()`). Le client serveur (`server.ts`) est un singleton supabase-js avec la clé secrète si présente. Migration `0004_profils.sql` (RLS ouvert à anon : l'app est personnelle).
- Le navigateur automatisé de Claude envoie Espace/Entrée avec `e.key` vide : tester ces raccourcis en envoyant de vrais `KeyboardEvent` via JavaScript.
- Tables : `subjects → modules → concepts → cards`, `reviews` (1 ligne par carte déjà vue ; pas de ligne = nouvelle), `answers`, `sessions`. SQL dans `supabase/migrations/0001_schema.sql`, à coller dans l'éditeur SQL de Supabase. Identifiants texte stables (clé de fusion des JSON).
- « Aujourd'hui » = date dans `CONFIG_REVISION.fuseauHoraire` (Europe/Paris), jamais la date du serveur (Vercel = UTC).
- Modèle de révision : `step` (position dans le calendrier), `interval_days` (dernier intervalle appliqué), `ease_state` (`new`/`ok`/`failed`/`thought_knew`). Après un raté ou une boîte, le succès suivant utilise `interval_days` au lieu du calendrier.
- Dans une session, seule la PREMIÈRE réponse à une carte replanifie ; les retours d'une carte ratée sont enregistrés dans `answers` sans replanifier.
- Les écritures pendant la session sont asynchrones (la carte suivante n'attend pas) ; la fin de session attend toutes les écritures avant de clôturer.
- Mode sombre PAR DÉFAUT (demande du product owner du 13/09/2026, qui prime sur le « clair par défaut » des docs). Préférences d'affichage (taille de texte, mode sombre) : cookie `ancre.affichage` lu dans `src/app/layout.tsx` → `data-theme="dark"` et `--taille-texte` sur `<html>`. Le mode sombre = mêmes tokens, valeurs redéfinies sous `:root[data-theme="dark"]` dans `globals.css`. Jamais de couleur en dur dans les composants.
- Quota de nouveautés : table `settings` (`lireQuotaNouvelles`, repli sur la config si la table ou la ligne manque).

## Avancement

- J1 (projet + auth + mini-session en dur) : terminé, poussé sur GitHub (myukiforever-netizen/learning).
- J2 (base + algorithme + accueil + fin de session) : code terminé, 21 tests verts, vérifié dans le navigateur en mode démo. Reste côté product owner : créer le projet Supabase, exécuter le SQL, remplir `.env.local`, puis tester avec enregistrement réel.
- J3 (import/export JSON + écran Matières + SCHEMA.md) : terminé. Format dans `SCHEMA.md`, validation/fusion dans `src/lib/import/`, matières livrées dans `src/data/matieres/` (`demo_v1.json`), écran Matières (charger, importer avec aperçu, pause, export), export complet dans Réglages, type « duel » affiché via la mécanique QCM. 27 tests verts.
- Contenu « Psychologie de l'influence » (source : `docs/sources/psychologie.md`) : terminé, v1. Un fichier JSON par module dans `src/data/matieres/psychologie/` (m1 bases → m8 pratiques), assemblés par `psychologie/index.ts` en une matière `psychologie` (8 modules, 43 concepts, 180 cartes, les 10 types). Livrée avec l'app, chargeable depuis l'écran Matières. Pour corriger une carte : éditer le JSON du module, garder l'id, passer `version` à 2 dans `index.ts`, puis « Mettre à jour » dans Matières.
- J4 (types de cartes restants) : terminé. 10 types → 6 mécaniques dans `Session.tsx` (flash, choix = qcm/duel, cloze, libre = why/whatif/problem, exemple = worked/faded, sort = classer/ordonner). Vérification automatique pure dans `src/lib/cartes/verifier.ts` (tolérante casse/accents). Démo passée en v2 avec un exemple de chaque type. 32 tests verts.
- J5 (Mon cerveau + réglages + mode sombre) : terminé. Stats pures dans `src/lib/stats/cerveau.ts` (% en mémoire = 0,9^(jours écoulés / intervalle), calibration confiance, liste rouge, ratio production). Affichage (taille, sombre) dans un cookie lu par le layout ; quota nouveautés dans la table `settings` (migration `0002_settings.sql`). 39 tests verts.
- J6 (polissage mobile, raccourcis, reduced-motion, Vercel, UTILISATION.md) : terminé. Passe mobile vérifiée en 375 px (aucun débordement, boutons 48 px), icône SVG géométrique (`src/app/icon.svg`), `UTILISATION.md` (session, matières, Supabase, Vercel, dépannage), `README.md`.
- **Refonte « Odyssée » (13/09/2026)** : plan en 7 sauts S1→S7 validé.
  - S1 (univers et navigation) : code terminé. Migration `0003_odyssee.sql` (planet_progress, galaxy_progress, profile, xp_events, colonnes phase/level/discovery/galaxy/planet, answers.context). Écrans univers / galaxie / planète / découverte provisoire / phases / soleil / patrouille. Mode découverte sans clés supprimé (redirection vers /configuration). 54 tests. **À vérifier dans le navigateur dès que le product owner a exécuté les 3 SQL.**
  - S1 vérifié dans le navigateur avec le profil du product owner (13/09/2026).
  - S2 (découverte) : lecteur et schéma d'écrans faits (`histoire`, `analogie`, `exemple`, `predire` ; validés dans schema.ts ; colonne `concepts.discovery`). Contenu écrit avec analogies pour la galaxie 0 « mots de base » (nouveau module m0, 6 planètes, 33 cartes, niveau 13 ans) et la galaxie 1 (réécrite en mots simples). Matière en v2 (9 galaxies, 49 planètes, 216 cartes), importée dans la base du product owner. **Reste : découvertes des galaxies 2 à 8** (fiches provisoires en attendant), sonde pré-atterrissage.
  - Menu global (`src/components/Navigation.tsx`) : barre en bas sur téléphone, en haut sur ordinateur, caché pendant les séances. Écran galaxie = chemin de planètes jusqu'au soleil (`CarteGalaxie.tsx`, étoiles, vaisseau, soleil animé). Carte de l'univers en 1 colonne sur mobile.
  - Résumé complet de la matière pour le product owner : `docs/psychologie_resume.md`.
  - S3 direction artistique (fond canvas, transitions), S4 motivation, S5 son, S6 adaptation, S7 polissage : à faire.
- Clés Supabase : en place dans `.env.local` depuis le 13/09/2026 (URL + anon). Tables 0001→0003 exécutées par le product owner ; **0004_profils.sql à exécuter** pour activer les profils.
