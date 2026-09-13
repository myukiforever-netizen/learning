# UTILISATION.md : le mini-guide d'Ancre

Ancre est ton application personnelle d'apprentissage. Une seule règle : **tu réponds avant de voir la réponse**, tous les jours, quelques minutes.

## 1. La session quotidienne (2 minutes pour comprendre, 10 à 60 pour la faire)

1. Ouvre l'app. L'accueil te montre trois chiffres : révisions dues 🔁, nouveautés 🆕, jours d'affilée 🔥.
2. Choisis une durée (10, 20, 40 ou 60 min) et clique **Démarrer ma session**.
3. Chaque carte te pose une question. Réponds (dans ta tête, au clavier, ou en cliquant), note ta confiance 😕 😐 😎, puis révèle ou valide.
   - Bonne réponse : coche verte, on passe.
   - Pas encore : le POURQUOI en deux lignes, « En savoir plus » pour le détail. La carte reviendra 5 à 10 cartes plus loin.
4. Fin de session, en trois temps :
   - **Page blanche** : écris tout ce que tu retiens, sans regarder. C'est la carte la plus rentable de toutes.
   - **Concepts vus** : compare avec ce que tu as écrit.
   - **Tri des erreurs** : pour chaque carte ratée, dis pourquoi : jamais su 🕳️ / su mais pas retrouvé 🔒 / je croyais savoir ⚠️ (priorité max : elle repart du début).
5. Le récap arrive, puis : **« Ta vraie note, c'est dans 3 jours. »** Reviens demain.

### Raccourcis clavier

| Touche | Effet |
|---|---|
| `1` à `4` | Choisir une option, une catégorie, un niveau de confiance |
| `Espace` | Révéler la réponse, déplier l'étape suivante |
| `Entrée` | Valider, passer à la carte suivante |
| `E` | En savoir plus |
| `Ctrl + Entrée` | Terminer la page blanche |

## 2. Les types de cartes, en une ligne chacun

- **Flash** : question → réponse dans ta tête → tu dis si tu avais bon.
- **QCM** : 4 choix, 3 pièges plausibles, chaque piège explique pourquoi il est faux.
- **Texte à trous** : tu tapes le mot manquant (casse et accents ne comptent pas).
- **Pourquoi ? / Et si ?** : tu écris ta réponse, tu compares avec la réponse modèle.
- **Exemple résolu** : une solution étape par étape, tu déplies chaque étape après y avoir réfléchi.
- **Exemple à compléter** : même chose, mais les dernières étapes, c'est toi qui les écris.
- **Problème** : tu résous seul.
- **Duel** : « ceci, c'est A ou B ? » pour deux notions que tu confonds.
- **Classer / Ordonner** : tu ranges des éléments dans des catégories ou dans le bon ordre.

## 3. Ajouter une matière

Une matière = un fichier JSON. Le format exact et un exemple complet sont dans `SCHEMA.md`.

**Le plus simple pour fabriquer un fichier** : ouvre une conversation avec Claude, colle-lui `SCHEMA.md` et ton cours (PDF, notes, sujet), et demande-lui :

> « Transforme ce cours en une matière au format SCHEMA.md : découpe en modules et concepts, 5 à 15 cartes par concept, types variés (au moins un Pourquoi ? et un QCM à pièges par concept, un Duel si deux notions se ressemblent), vocabulaire simple, explication du pourquoi en 2 lignes max. Jamais de carte qui demande de réciter un paragraphe. »

Puis **relis chaque carte** avant d'importer : garder / corriger / jeter. L'IA se trompe parfois, et relire est déjà un premier apprentissage.

**Importer** : écran **Matières** → « Importer un fichier JSON » → l'app vérifie le format, te montre ce qui va changer (nouvelles / modifiées / archivées), tu confirmes.

**Mettre à jour (v2)** : corrige ton fichier, augmente `version`, réimporte. Les textes sont mis à jour, ton historique de révision est conservé, les cartes supprimées sont archivées (jamais effacées).

**Mettre en pause** une matière : ses cartes sortent des sessions jusqu'à la reprise.

## 4. Mon cerveau et réglages

- **Mon cerveau** : % estimé encore en mémoire par matière, ta confiance contre tes vrais résultats, la liste rouge des cartes qui résistent, et ta part de production (objectif : au moins 50 %).
- **Réglages** : taille du texte, mode sombre (pour le soir), nombre de nouveautés par jour, et **Tout exporter** : tes données t'appartiennent, en un fichier JSON.

## 5. Installer et lancer sur ton ordinateur

Prérequis : Node.js (LTS) et Git.

```bash
npm install
```

Copie `.env.example` en `.env.local` et remplis les trois valeurs (voir section 6). Puis :

```bash
npm run dev
```

Ouvre http://localhost:3000. Sans clés Supabase, l'app tourne en **mode découverte** : les matières livrées sont utilisables, rien n'est enregistré.

Autres commandes : `npm test` (tests de l'algorithme), `npm run build` (vérifie la version de production), `npm run lint`.

## 6. Supabase : la base et la connexion (10 minutes, une seule fois)

1. Sur supabase.com, crée un projet (région Europe).
2. **SQL Editor** → nouvelle requête → colle `supabase/migrations/0001_schema.sql` → Run. Puis pareil avec `0002_settings.sql`, puis `0003_odyssee.sql`. Chaque fichier doit afficher « Success ».
3. **Authentication → Users → Add user** : ton email, coche « Auto confirm ». C'est le seul compte : l'app n'en crée jamais.
4. **Authentication → URL Configuration → Redirect URLs** : ajoute `http://localhost:3000/auth/callback` (et plus tard l'adresse Vercel, voir section 7).
5. **Project Settings → API** : copie « Project URL » et la clé « anon public ».
6. Dans `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=la_cle_anon
ALLOWED_EMAIL=ton@email.com
```

7. Relance `npm run dev`. L'app demande maintenant une connexion : entre ton email, clique le lien reçu.

## 7. Mettre en ligne sur Vercel (15 minutes, une seule fois)

Le code est sur GitHub (`myukiforever-netizen/learning`). Vercel le déploie à chaque `git push`.

1. Sur vercel.com, connecte-toi avec GitHub → **Add New → Project** → importe le dépôt `learning`.
2. Framework détecté : Next.js. Ne change rien.
3. **Environment Variables** : ajoute les trois mêmes variables que dans `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ALLOWED_EMAIL`).
4. **Deploy**. Une à deux minutes plus tard, Vercel te donne une adresse du type `https://learning-xxxx.vercel.app`.
5. Retourne dans Supabase → **Authentication → URL Configuration** :
   - **Site URL** : ton adresse Vercel ;
   - **Redirect URLs** : ajoute `https://learning-xxxx.vercel.app/auth/callback`.
6. Ouvre ton adresse Vercel sur ton téléphone, connecte-toi, ajoute-la à l'écran d'accueil. C'est ton app.

Ensuite : chaque `git push` sur `main` redéploie automatiquement. Les données restent dans Supabase, jamais dans Vercel.

## 8. Si quelque chose cloche

- « Cet email n'est pas autorisé » : vérifie `ALLOWED_EMAIL` (même orthographe que le compte Supabase).
- Le lien de connexion renvoie vers une erreur : vérifie les **Redirect URLs** dans Supabase.
- « Rien à réviser » : aucune carte due et quota de nouveautés atteint. Reviens demain ou monte le quota dans Réglages.
- Le fichier JSON est refusé : l'app liste les problèmes en français (id en double, réponse absente des options…). Corrige et réessaie.
- Les statistiques sont vides : elles se remplissent à partir de ta première session enregistrée.
