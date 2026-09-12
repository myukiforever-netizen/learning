# Plan complet — Mon application d'apprentissage personnelle

**Résumé du projet en 5 lignes :**
- Une application web, pour moi seul.
- Tout est interactif : jamais de gros pavés de texte à lire. Chaque écran = une seule petite action.
- Basée sur ce qui marche vraiment (preuves scientifiques) : se tester, espacer les révisions, expliquer, corriger ses erreurs.
- Extensible : je peux ajouter des matières par mises à jour (Maj 1 : Psychologie → Maj 2 : Marketing → etc.).
- Codée avec l'aide de l'IA. Budget : 5 000 €. Délai : 3 mois.

---

## PARTIE 1 — Les règles d'or de l'application

Ces 10 règles viennent directement de la revue scientifique. Elles décident de TOUT le reste. Si une fonctionnalité contredit une règle, on supprime la fonctionnalité.

| # | Règle | Pourquoi (preuve) |
|---|---|---|
| 1 | **On ne lit jamais longtemps. On répond.** Le texte arrive en petites bouchées, toujours suivies d'une question. | Se tester bat relire (effet fort, g ≈ 0,5–0,6) |
| 2 | **Chaque info revient plus tard.** L'app décide quand, pas moi. | Espacer bat masser (effet fort) |
| 3 | **L'intervalle = 10 à 20 % du temps où je veux retenir.** Retenir 1 an → revoir vers 1 mois. | Cepeda 2008 |
| 4 | **Je réponds AVANT de voir la réponse.** Jamais l'inverse. | Génération > réception |
| 5 | **Après chaque erreur : une explication du POURQUOI**, pas juste "faux". | Feedback riche > feedback juste/faux |
| 6 | **Des questions "pourquoi" et "et si"**, pas seulement des définitions. | Auto-explication (g = 0,55), meilleur transfert |
| 7 | **Pour les procédures : exemple résolu → exemple à trous → tout seul.** | Effet des exemples résolus (novices) |
| 8 | **Quand je confonds 2 notions proches : l'app les mélange dans le même quiz.** | Entrelacement (g = 0,42, fort pour discriminer) |
| 9 | **Je note ma confiance avant de voir si j'ai bon.** L'app compare confiance et résultat. | Corrige l'illusion de savoir |
| 10 | **Mes erreurs sont triées en 3 boîtes** : "jamais su" / "su mais pas retrouvé" / "cru savoir mais faux". Chaque boîte a son remède. | Diagnostic → bon remède |

**Règle d'interface (ta demande) :** un écran = une carte = une action (répondre, glisser, choisir, taper un mot). Zéro paragraphe. Si un concept a besoin de 10 phrases, il devient 5 cartes interactives.

---

## PARTIE 2 — Ce que l'utilisateur voit (les écrans)

### 2.1 — L'écran d'accueil ("Aujourd'hui")

Un seul gros bouton : **"Démarrer ma session"**.
En dessous, 3 petits chiffres :
- 🔁 X révisions à faire aujourd'hui
- 🆕 X nouveautés disponibles
- 🔥 Série de jours d'affilée (simple compteur, pas de punition)

Choix de la durée avant de lancer : **10 / 20 / 40 / 60 min**. L'app remplit la session toute seule.

### 2.2 — La session (le cœur de l'app)

Une session = une pile de cartes qui défilent. Une carte = un seul type d'interaction parmi :

| Type de carte | À quoi ça ressemble | Sert à |
|---|---|---|
| **Flash** | Question → je réponds dans ma tête ou au clavier → je révèle → "j'avais bon / pas bon" | Mémoriser |
| **QCM piège** | 4 choix dont 3 pièges plausibles → après réponse, 1 ligne qui explique pourquoi chaque piège est faux | Mémoriser + comprendre |
| **Texte à trous** | Une phrase avec 1–2 mots masqués, je tape | Mémoriser |
| **Pourquoi ?** | "Explique en 1 phrase pourquoi X" → je tape → je compare avec la réponse modèle → je m'auto-note | Comprendre |
| **Et si ?** | "Que se passe-t-il si on enlève X ?" | Comprendre + transfert |
| **Exemple résolu** | Une solution étape par étape, je tape sur chaque étape pour la déplier, avec une mini-question par étape | Apprendre une procédure |
| **À trous progressif** | Le même exemple, mais les dernières étapes sont cachées : à moi de les faire | Procédure (niveau 2) |
| **Problème complet** | Je fais tout seul | Procédure (niveau 3) |
| **Duel de jumeaux** | 2 notions que je confonds, présentées en vrac : "ceci est A ou B ?" | Discriminer (entrelacement) |
| **Classer / relier** | Glisser des éléments dans le bon ordre ou la bonne catégorie | Organiser |
| **Page blanche** (fin de session) | "Écris tout ce que tu retiens sur le thème du jour" → puis l'app affiche ce que j'ai oublié | Rappel libre |

**Détails qui comptent (ne pas négliger) :**
- Avant chaque révélation de réponse : mini-curseur **"Sûr ? 😕 😐 😎"** (1 tap, 1 seconde).
- Le feedback d'erreur tient en **2 lignes max** + un bouton "en savoir plus" si je veux.
- Après une erreur, la carte revient **dans la même session**, 5–10 cartes plus loin (pas juste après : trop facile).
- Nouvelle matière et anciennes matières sont **mélangées** dans la même session (l'ordre : révisions dues d'abord, nouveautés ensuite).
- Jamais deux cartes du même concept à la suite.
- Barre de progression de session visible, mais **jamais** de note affichée pendant la session (juger trop tôt = se tromper).

### 2.3 — La fin de session (5 min, automatique)

1. **Page blanche** : rappel libre du thème du jour.
2. **Tri des erreurs** : l'app me montre mes erreurs une par une, je tape sur une des 3 boîtes :
   - 🕳️ "Jamais vraiment su" → l'app me redonnera la carte d'apprentissage.
   - 🔒 "Je savais mais pas retrouvé" → révisions plus rapprochées.
   - ⚠️ "Je croyais savoir, c'était faux" → priorité max : carte "Pourquoi ?" créée automatiquement.
3. **Message de fin** : "Ta vraie note, ce sera dans 3 jours. Reviens." (rappel que la performance du jour ne veut rien dire).

### 2.4 — L'écran "Mon cerveau" (statistiques)

Volontairement minimaliste :
- Par matière : % estimé "encore en mémoire aujourd'hui".
- Un graphique : **ma confiance vs mes vrais résultats** (suis-je trop confiant ?).
- Ma liste rouge : les 10 notions qui résistent le plus.
- Temps passé en "production" (répondre) vs "consommation" (lire) — objectif : au moins 50 % production.

### 2.5 — L'écran "Matières"

- Liste de mes matières (Psychologie, puis Marketing…).
- Bouton **"+ Ajouter une matière"** → voir Partie 4 (les mises à jour).
- Chaque matière : activer / mettre en pause / voir le contenu.

---

## PARTIE 3 — Comment le contenu est fabriqué (l'usine à cartes)

C'est LE point qui décide si l'app marche ou pas. Une app parfaite avec de mauvaises cartes ne sert à rien.

### 3.1 — La structure d'une matière

```
Matière (ex: Psychologie)
 └── Modules (ex: Mémoire, Biais cognitifs, ...)
      └── Concepts (ex: La courbe de l'oubli)
           └── Cartes (5 à 15 par concept, de types variés)
```

### 3.2 — Le pipeline (comment j'ajoute du contenu)

**Étape 1 — Je fournis une source** : un PDF de cours, un chapitre, mes notes, ou juste un sujet.

**Étape 2 — L'IA découpe et propose** (via l'API d'un modèle de langage, intégrée dans l'app) :
- Elle découpe en concepts.
- Pour chaque concept, elle génère un lot de cartes en respectant des **recettes obligatoires** :
  - au moins 1 carte "Pourquoi ?" par concept ;
  - au moins 1 QCM avec pièges plausibles ;
  - une carte "Duel" si deux concepts se ressemblent ;
  - la séquence exemple résolu → à trous → complet si c'est une procédure ;
  - **interdiction** de cartes qui demandent de réciter un paragraphe.

**Étape 3 — Je valide** : écran de relecture rapide, carte par carte : ✅ garder / ✏️ modifier / 🗑️ jeter. (Étape non négociable : l'IA se trompe, et valider est déjà un premier apprentissage.)

**Étape 4 — Publication** : les cartes validées entrent dans le planning de révision.

### 3.3 — Les règles de qualité d'une carte (l'IA les reçoit comme consignes)

- Une carte = une seule idée.
- La question doit être impossible à deviner sans savoir (pas d'indice dans la formulation).
- Les mauvaises réponses d'un QCM = de vraies erreurs que quelqu'un ferait.
- Chaque carte porte des étiquettes : matière, module, concept, type, "à retenir jusqu'à : 3 mois / 1 an / à vie".
- Chaque carte "fait" a si possible une carte "pourquoi" jumelle.

---

## PARTIE 4 — Les mises à jour de matières (Maj 1, Maj 2, …)

Ta demande : ajouter Psychologie, puis plus tard Marketing, sans rien casser.

### 4.1 — Le principe : une matière = un paquet

Chaque matière est un **fichier paquet** (format JSON) qui contient tout : modules, concepts, cartes, étiquettes, version.

```
psychologie_v1.json   ← Maj 1
marketing_v1.json     ← Maj 2
psychologie_v2.json   ← correction/enrichissement plus tard
```

### 4.2 — Ce qui se passe quand j'importe un paquet

1. L'app lit le fichier et vérifie qu'il est bien formé.
2. **Nouvelles cartes** → ajoutées au planning, en commençant doucement (max 15 nouvelles cartes/jour par défaut, réglable) pour ne pas noyer les révisions existantes.
3. **Cartes modifiées** (v2 d'une matière) → le texte est mis à jour MAIS mon historique de révision est conservé (je ne repars pas de zéro).
4. **Cartes supprimées** → archivées, jamais effacées (je peux annuler).
5. Rien ne touche aux autres matières.

### 4.3 — Règles de cohabitation entre matières

- Le planning de révision est **commun** : une seule file "à revoir aujourd'hui", toutes matières mélangées (c'est un plus : variété = mieux).
- Je peux mettre une matière **en pause** : ses cartes gèlent, les intervalles sont recalculés à la reprise.
- Chaque matière peut avoir ses réglages : objectif de rétention (6 mois ? à vie ?), rythme de nouveautés.

---

## PARTIE 5 — Le moteur de révision (l'algorithme, expliqué simplement)

### 5.1 — Le calendrier de base

Chaque carte a un objectif de rétention. Le premier calendrier :

| Objectif | Révisions |
|---|---|
| 3 mois | J+2, J+7, J+20, J+45 |
| 1 an | J+2, J+10, J+30, J+90, J+240 |
| À vie | pareil que 1 an, puis ×2 après chaque succès |

### 5.2 — Les ajustements

- ✅ Réussi facilement → intervalle suivant ×2.
- 😐 Réussi avec effort → intervalle prévu, sans bonus.
- ❌ Raté → prochain intervalle = moitié du précédent + la carte repasse dans la session du jour.
- ⚠️ "Je croyais savoir, c'était faux" → retour quasi au début + carte "Pourquoi ?" ajoutée.

**Honnêteté :** la science prouve qu'espacer marche, pas que CETTE courbe précise est la meilleure. Donc l'algorithme reste simple, lisible, et modifiable dans un seul fichier de réglages.

### 5.3 — La composition d'une session (ex : 20 min)

1. D'abord : toutes les révisions **dues** (priorité aux plus en retard et aux boîtes ⚠️).
2. Ensuite : les nouveautés (si le quota du jour n'est pas atteint).
3. En saupoudrage : 2–3 cartes "Duel" sur mes confusions connues.
4. Toujours en dernier : la page blanche.
5. Ratio surveillé : jamais plus de 25 % du temps en cartes de découverte "à lire".

---

## PARTIE 6 — La technique (comment c'est construit)

Choisie pour : codage avec l'IA, une seule personne, budget mini, solidité.

| Brique | Choix | Pourquoi |
|---|---|---|
| Interface | **Next.js (React) + Tailwind** | L'IA code très bien ce duo ; énormément d'exemples existent |
| Base de données + connexion | **Supabase** (gratuit à mon échelle) | Base, sauvegarde, connexion sécurisée, sans serveur à gérer |
| Hébergement | **Vercel** (gratuit → ~20 €/mois max) | Mise en ligne en 1 clic depuis le code |
| Génération de cartes | **API d'un modèle de langage** (ex : API Claude) | Le pipeline de la Partie 3 |
| Sauvegarde du code | **GitHub** (privé, gratuit) | Historique, retour arrière possible |
| App "ouverte" | Le code m'appartient, les données exportables en 1 clic (JSON), aucun abonnement obligatoire pour que l'app tourne | Ta demande : l'app reste ouverte |

**Tables principales de la base :** matières / modules / concepts / cartes / historique_de_réponses / planning / erreurs (avec la boîte choisie) / confusions détectées / sessions.

---

## PARTIE 7 — Le planning sur 3 mois

### Mois 1 — Le moteur (le minimum qui marche)
- Semaine 1 : maquette des écrans (avec l'IA), création du projet, base de données.
- Semaine 2 : les 4 types de cartes de base (Flash, QCM, Trous, Pourquoi) + la session.
- Semaine 3 : le calendrier de révision + le tri des erreurs en 3 boîtes.
- Semaine 4 : import d'un paquet JSON fait à la main (20 cartes tests). **Je commence à l'utiliser TOUS les jours dès ici.**

### Mois 2 — L'usine à contenu + Maj 1
- Semaine 5–6 : pipeline IA (source → cartes proposées → écran de validation).
- Semaine 7 : types de cartes avancés (Exemple résolu, À trous progressif, Duel, Classer).
- Semaine 8 : **Maj 1 : matière Psychologie complète** générée, validée, importée.

### Mois 3 — Finitions + preuve que ça marche
- Semaine 9 : écran "Mon cerveau", graphique confiance vs résultats, liste rouge.
- Semaine 10 : gestion des versions de paquets (v2, pause de matière, export).
- Semaine 11 : polissage, vitesse, mobile-friendly (le site doit être agréable sur téléphone).
- Semaine 12 : **le test final** — comparer ce que je retiens à J+7 : chapitre appris dans l'app vs chapitre appris en lisant. Si l'app ne gagne pas, on ajuste les cartes, pas les couleurs.

**Ensuite : Maj 2 = Marketing**, en réutilisant le pipeline (ça devrait prendre quelques jours, pas des semaines).

### Répartition du budget (5 000 €)

| Poste | Estimation |
|---|---|
| Outil de codage IA (abonnement 3 mois, type Claude Code) | ~150–400 € |
| API pour générer les cartes | ~100–300 € |
| Hébergement + base + nom de domaine (1 an) | ~50–250 € |
| Design : kit d'icônes/thème pro (optionnel) | ~0–100 € |
| **Total dépensé** | **~300–1 000 €** |
| **Réserve** (imprévus, aide ponctuelle d'un freelance si blocage, année 2 d'hébergement) | **~4 000 €** |

Oui : ton vrai coût, c'est ton temps. Le budget sert surtout de filet de sécurité — c'est une bonne position.

---

## PARTIE 8 — Les pièges à éviter (liste de contrôle)

- ❌ **Le piège n°1 : passer plus de temps à fabriquer des cartes qu'à réviser.** Limite : la validation de cartes ne compte pas comme une session.
- ❌ Transformer l'app en app de lecture (revenir aux pavés de texte "pour aller plus vite").
- ❌ Mémoriser avant de comprendre : une carte "fait" ne doit jamais exister sans que le concept ait été vu.
- ❌ Ajouter des gadgets (badges, sons, animations) avant que le test J+7 soit gagné.
- ❌ Faire confiance à l'IA sans valider les cartes (elle invente parfois).
- ❌ Se juger le soir même ("j'ai tout bon !") — l'app doit le rappeler.
- ❌ Laisser gonfler la pile de révisions : si > 100 cartes dues, l'app propose de fusionner ou d'élaguer.
- ❌ Sauter le rappel libre de fin de session : c'est la carte la plus rentable de toutes.

---

## PARTIE 9 — Par quoi commencer demain matin

1. Ouvrir un compte GitHub, Vercel, Supabase (30 min, gratuit).
2. Demander à l'IA de coder l'écran "session" avec 5 cartes Flash en dur (pas de base de données au début).
3. L'utiliser 10 minutes le soir même.
4. Chaque jour : une petite amélioration + une vraie session.

La règle du projet : **l'app doit être utilisée tous les jours dès la semaine 1, même moche.** C'est ton usage réel qui dira quoi construire ensuite — pas le plan.
