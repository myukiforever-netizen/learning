# Ancre — application personnelle d'apprentissage

## Le projet en 5 lignes

- Application web pour UN SEUL utilisateur (le product owner, qui n'est pas développeur : lui expliquer toujours en langage simple ce qui est fait et ce qu'il doit tester).
- Apprentissage par petites cartes interactives : on répond avant de voir la réponse, on note sa confiance, on trie ses erreurs.
- Moteur de révision espacée simple et lisible, entièrement paramétré dans `src/lib/revision/config.ts`.
- Les matières sont des paquets JSON versionnés, importables et réimportables sans perdre l'historique (schéma dans `SCHEMA.md`).
- Documents de référence (à lire en cas de doute) : `docs/plan_app_apprentissage.md` (produit) et `docs/plan_app_partie2_ui.md` (design).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS, code dans `src/`
- Supabase : base Postgres + auth par magic link (email). Clés dans `.env.local` (jamais dans le code), modèle dans `.env.example`
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
src/app/            écrans (accueil, session, session/fin, matieres, cerveau, reglages, connexion)
src/components/     composants d'interface ; src/components/cartes/ = un fichier par type de carte
src/lib/revision/   config.ts (TOUTES les valeurs réglables), planifier.ts (dates dues), composer.ts (composition de session)
src/lib/import/     schéma, validation et fusion des JSON de matières
src/lib/supabase/   clients Supabase (navigateur / serveur) et requêtes
src/data/           cartes de test en dur (jalon 1)
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

## Les 10 règles produit (non négociables)

1. Jamais de longs textes à lire : tout le contenu arrive en petites cartes interactives, une action par écran.
2. L'utilisateur répond TOUJOURS avant de voir la réponse.
3. Chaque erreur affiche une explication courte du POURQUOI (2 lignes max + bouton « en savoir plus »).
4. Avant chaque révélation de réponse : mini-sélecteur de confiance (3 emojis : 😕 😐 😎), 1 tap.
5. Une carte ratée revient dans la même session, 5 à 10 cartes plus loin.
6. Jamais de score affiché pendant la session. Le récap arrive uniquement à la fin.
7. Rien ne bouge à l'écran pendant que l'utilisateur lit ou réfléchit. Animations uniquement aux transitions et feedbacks.
8. Fin de session obligatoire : rappel libre (« écris tout ce que tu retiens ») puis tri des erreurs en 3 boîtes : « jamais su » / « su mais pas retrouvé » / « je croyais savoir » (cette dernière = priorité max).
9. La couleur porte du sens, jamais de la décoration. Aucune image décorative.
10. Message de fin de session : « Ta vraie note, c'est dans 3 jours. »

## Décisions prises avec le product owner

- Pipeline IA de génération de cartes : hors périmètre J1→J6 (les JSON sont produits hors de l'app).
- Carte Flash : réponse dans la tête → confiance → révélation → auto-évaluation « j'avais bon / pas encore ».
- Boîte « je croyais savoir » : intervalle quasi remis à zéro + marqueur ⚠️ sur la carte. Pas de carte « Pourquoi ? » auto-générée.
- Page blanche : après écriture, l'app affiche la liste des concepts vus dans la session (auto-comparaison).
- Un seul utilisateur : inscriptions désactivées côté Supabase + `ALLOWED_EMAIL` vérifié + RLS.

## Méthode de travail

- Jalon par jalon (J1→J6), jamais deux à la fois. Fin de jalon = app qui tourne + checklist de test manuel de 2 minutes + commit git clair + push GitHub.
- Ce fichier est mis à jour à chaque jalon.

## Notes techniques

- Next.js 16 : la protection des pages se fait dans `src/proxy.ts` (remplace `middleware.ts`).
- Tant que les clés Supabase sont vides dans `.env.local`, l'app tourne sans connexion (mode découverte du J1).
- Le compte utilisateur n'est jamais créé depuis l'app (`shouldCreateUser: false`) : il est créé une fois dans le tableau de bord Supabase.
- Le navigateur automatisé de Claude envoie Espace/Entrée avec `e.key` vide : tester ces raccourcis en envoyant de vrais `KeyboardEvent` via JavaScript.

## Avancement

- J1 (projet + auth + mini-session en dur) : code terminé, 6 tests verts. Reste côté product owner : créer le projet Supabase et le dépôt GitHub (guides fournis en fin de jalon).
- J2 (base + algorithme + accueil + fin de session) : à faire
