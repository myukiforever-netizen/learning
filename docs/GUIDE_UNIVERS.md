# GUIDE_UNIVERS.md : comment bien ajouter un univers

Référence obligatoire avant d'écrire ou de modifier du contenu. Le format technique exact est dans `SCHEMA.md` ; ce guide dit **comment faire du bon contenu** et **ce qu'il ne faut pas faire**.

## 1. Le vocabulaire et la structure

| Dans l'app | Dans le JSON | Rôle |
|---|---|---|
| Secteur | matière (`id`, `name`, `version`, `modules`) | Un cours complet |
| Galaxie | module | Un chapitre : 4 à 9 planètes, terminé par un soleil (épreuve mélangée) |
| Planète | concept | Une idée : 4 à 6 cartes + 3 à 8 écrans de découverte |
| Notion / mission | carte | Une seule question, une seule idée |
| Observatoire | `decouverte` | Ce qu'on lit avant d'être interrogé |
| Laboratoire | cartes `phase: comprehension` (duel, qcm, sort, worked_example) | Vérifier qu'on a compris, sans pression |
| Champ d'entraînement | cartes `phase: entrainement` (flash, cloze, why, whatif, problem, faded_example) | Rappel : entre dans la révision espacée |

Organisation des fichiers d'une matière livrée : un fichier JSON par module dans `src/data/matieres/<matiere>/`, assemblés par `index.ts` (id, nom, version, description, couleur, liste des modules dans l'ordre). Une matière importée depuis l'écran Secteurs est un seul fichier JSON.

## 2. Pour qui on écrit

- **Un débutant complet, dès 13 ans.** S'il faut un mot savant, on le définit dans la même phrase, avec un exemple.
- **Tutoiement**, phrases courtes, une idée par phrase. Ton calme et encourageant : jamais « faux », « échec », « évidemment ».
- **Rien à réciter.** Si un concept demande dix phrases, il devient plusieurs cartes.
- Chaque chiffre a une source (dans `explanation_more`), jamais dans la question.

## 3. La galaxie : comment découper

1. Commencer par une **galaxie « mots de base »** si le domaine a du vocabulaire : chaque mot important devient une planète ou une carte flash (« C'est quoi, … ? »).
2. Ordonner du plus simple au plus précis. La première planète d'une galaxie doit être faisable sans rien connaître d'autre.
3. **4 à 9 planètes** par galaxie. Au-delà, couper en deux galaxies.
4. Une planète = **une idée**. Si le nom de la planète contient « et », c'est souvent deux planètes.
5. Le soleil tire ses cartes dans toutes les planètes : chaque planète doit donc avoir au moins 3 cartes d'entraînement.

## 4. La découverte : la recette

3 à 8 écrans, dans cet ordre, adaptable :

1. **`histoire`** (1 à 3 paragraphes) : commencer par une situation vécue ou une question qui pique la curiosité. Le premier paragraphe ne doit pas donner la réponse. Le dernier paragraphe nomme la notion.
2. **`analogie`** (1 ou 2) : « c'est comme… » avec un objet du quotidien (une balance, une plante, une pièce de monnaie), puis « en vrai… » qui relie chaque élément de l'image à la notion. Une analogie = une seule idée.
3. **`predire`** : une question où l'on devine avant d'apprendre. 2 à 4 options plausibles, `answer` copiée exactement d'une option, `explanation` qui dit pourquoi même la mauvaise réponse était tentante. Se tromper ici est utile : on retient mieux après avoir deviné.
4. **`exemple`** : un cas concret en 3 à 5 lignes, avec des détails réels (un site, un prix, une situation).

Règles des analogies :
- L'image doit être connue de tout le monde (cuisine, école, sport, météo, jeux). Pas de référence culturelle datée.
- Dire où l'analogie s'arrête si elle peut tromper (« la météo n'annonce pas ce que TU feras »).
- Ne jamais utiliser une analogie qui contredit la notion (exemple à éviter : « la mémoire est un disque dur », faux et trompeur).
- Une bonne analogie se teste : si un enfant peut réexpliquer la notion avec l'image, elle est bonne.

## 5. Les cartes : normes

- **Question** : 1 à 2 lignes, impossible à deviner sans savoir, sans indice dans la formulation.
- **`answer`** : la réponse complète en 1 à 3 lignes. Pour `qcm` et `duel`, exactement égale à l'une des `options` (même accent, même majuscule, même ponctuation).
- **`explanation`** : le POURQUOI, 2 lignes maximum. Pas une répétition de la réponse.
- **`explanation_more`** : détails, sources, chiffres, nuances. Facultatif mais recommandé dès qu'il y a un chiffre ou un nom.
- **QCM** : 3 à 4 options ; les pièges sont des erreurs qu'une vraie personne ferait ; `options_why` explique chaque piège (chaîne vide `""` pour la bonne réponse).
- **Duel** : deux notions qu'on confond vraiment, exactement 2 options.
- **Cloze** : 1 à 3 trous `[[…]]` sur des mots-clés, pas sur des mots de liaison ; plusieurs réponses acceptées avec `|` (`[[1885|mille huit cent quatre-vingt-cinq]]`).
- **Sort / classer** : 2 à 4 catégories, 2 à 8 éléments ; chaque élément va sans ambiguïté dans une seule catégorie. **Sort / ordonner** : 3 à 8 textes dans le bon ordre.
- **worked_example** : 2 à 8 étapes, chacune avec un `prompt` (mini-question posée avant de déplier). **faded_example** : `hidden` (1 à n-1) dernières étapes cachées.
- **`retention_goal`** : `life` pour une définition ou une règle centrale, `1y` par défaut, `3m` pour un chiffre précis ou une date.
- Mix par planète : au moins 2 cartes de compréhension (duel, qcm, sort) et 3 d'entraînement (flash, cloze, why…). Pas plus de 2 cartes du même type d'affilée dans le fichier.

## 6. Les identifiants : la règle d'or

- Minuscules, chiffres, `-` et `_` seulement : `crise-replication`, `replication-1`.
- **Uniques dans tout le fichier** (cartes, concepts, modules). L'app les préfixe par l'id de la matière en base (`psychologie/replication-1`).
- **Un id ne change jamais** : c'est la clé qui conserve l'historique de révision et la progression. Renommer un id = perdre la progression de cette carte ou de cette planète.
- **Ne jamais réutiliser un id** pour un contenu différent : la personne qui avait « validé » l'ancienne notion aurait validé la nouvelle sans l'avoir vue.
- Pour corriger un texte : garder l'id, changer le texte, augmenter `version`. Pour supprimer : retirer la carte du fichier, elle sera archivée (jamais effacée).

## 7. Mettre à jour une matière déjà jouée

- **Augmenter `version`** à chaque changement (v1 → v2). Sinon l'écran Secteurs affiche « Déjà chargée ».
- **Ajouter un module en fin de liste** de préférence. Un module inséré en tête décale les galaxies : celles d'après redeviennent verrouillées jusqu'au soleil de la nouvelle (la progression des planètes est conservée, mais l'ordre de passage change). À faire seulement en connaissance de cause.
- Changer l'ordre des planètes dans une galaxie change le chemin, pas la progression.
- Après modification d'une matière livrée : `npm test` (le test valide chaque carte), puis « Mettre à jour » dans Secteurs.

## 8. Ce qu'il ne faut pas faire (liste rouge)

- Une carte qui demande de réciter un paragraphe.
- Une question devinable par la forme (« la bonne réponse est la plus longue »).
- Des pièges absurdes dans un QCM (personne ne les choisirait).
- Deux idées dans une carte ; un « et » dans une question est souvent le signe.
- Un mot savant sans définition ni exemple.
- Un chiffre sans source, ou un chiffre arrondi qui change le sens.
- Une `explanation` qui répète la réponse au lieu d'expliquer pourquoi.
- Interroger avant de découvrir : chaque planète doit avoir de quoi apprendre AVANT ses cartes (découverte écrite, ou au minimum des réponses assez complètes pour les fiches provisoires).
- Une analogie jolie mais fausse.
- Plus de 8 écrans de découverte, ou une histoire de 4 paragraphes.
- Des guillemets droits `"` à l'intérieur d'un texte JSON (utiliser « » ou ’).
- Des images, GIF ou emojis décoratifs dans le contenu (le rendu est fait par le code).
- Changer ou réutiliser un id, oublier d'augmenter `version`.
- Insérer un module en tête de liste sans l'avoir décidé.

## 9. Checklist avant d'importer

1. `npm test` est vert (validation de toutes les cartes et découvertes).
2. Chaque planète : 3 à 8 écrans de découverte, ≥ 2 cartes de compréhension, ≥ 3 d'entraînement.
3. Chaque `answer` de qcm/duel est copiée d'une option ; chaque `options_why` a la bonne longueur.
4. Chaque chiffre a sa source dans `explanation_more`.
5. Relu à voix haute par quelqu'un qui ne connaît pas le sujet : il comprend chaque écran de découverte sans aide.
6. `version` augmentée, `index.ts` à jour (matières livrées), ou fichier JSON unique prêt (import).

## 10. Modèle minimal d'une planète

```json
{
  "id": "groupe-temoin",
  "name": "C'est quoi, un groupe témoin ?",
  "decouverte": [
    { "type": "histoire", "titre": "L'engrais miracle", "paragraphes": ["Tu mets de l'engrais sur ta plante. Elle pousse. L'engrais marche ?", "Peut-être. Ou c'est le soleil de cette semaine-là. Comment savoir ?"] },
    { "type": "analogie", "titre": "C'est comme deux plantes côte à côte", "comme": "Même pot, même fenêtre, même eau. Une seule reçoit l'engrais.", "enVrai": "La plante sans engrais est le groupe témoin : celui à qui on ne fait rien de spécial, pour comparer." },
    { "type": "predire", "question": "Sans la deuxième plante, peut-on conclure ?", "options": ["Oui, elle a poussé", "Non, on ne sait pas si c'est l'engrais"], "answer": "Non, on ne sait pas si c'est l'engrais", "explanation": "Sans comparaison, tout peut expliquer la pousse : le soleil, la pluie, la saison." },
    { "type": "exemple", "titre": "Sur un site web", "texte": "La moitié des visiteurs voit un bouton rouge, l'autre le bouton habituel. Le bouton habituel, c'est le groupe témoin." }
  ],
  "cards": [
    { "id": "temoin-1", "type": "flash", "question": "C'est quoi, un groupe témoin ?", "answer": "Le groupe à qui l'on ne fait rien de spécial, pour comparer avec celui à qui l'on fait quelque chose.", "explanation": "Sans comparaison, impossible de savoir si c'est ta modification qui a agi.", "retention_goal": "life" },
    { "id": "temoin-2", "type": "duel", "question": "« Tous les clients ont vu la nouvelle pub. » Y a-t-il un groupe témoin ?", "options": ["Non", "Oui"], "answer": "Non", "explanation": "Personne n'a été laissé sans la pub : rien à comparer." },
    { "id": "temoin-3", "type": "qcm", "question": "Pourquoi tirer au sort qui va dans le groupe témoin ?", "options": ["Pour que les deux groupes se ressemblent", "Pour aller plus vite", "Parce que c'est plus juste pour les clients"], "options_why": ["", "Ça ne va pas plus vite.", "La justice n'est pas le but : la comparaison l'est."], "answer": "Pour que les deux groupes se ressemblent", "explanation": "Le hasard mélange les gens motivés et les autres dans les deux groupes." },
    { "id": "temoin-4", "type": "cloze", "question": "Le groupe [[témoin|contrôle]] est celui à qui l'on ne fait rien de spécial.", "answer": "Le groupe témoin est celui à qui l'on ne fait rien de spécial.", "explanation": "Deux noms pour la même chose : témoin ou contrôle.", "retention_goal": "3m" },
    { "id": "temoin-5", "type": "why", "question": "Pourquoi une expérience sans groupe témoin ne prouve-t-elle rien ?", "answer": "Parce qu'on ne peut pas séparer l'effet de ce qu'on a changé de tout ce qui a changé en même temps.", "explanation": "Le témoin subit tout sauf ta modification : la différence entre les deux, c'est ton effet." }
  ]
}
```
