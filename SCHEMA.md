# SCHEMA.md : le format d'une matière

Une matière = **un fichier JSON** (ex. `psychologie_v1.json`). Il contient des modules, qui contiennent des concepts, qui contiennent des cartes.

```
Matière
 └── Modules (les grandes parties)
      └── Concepts (une idée = un concept, 4 à 15 cartes)
           └── Cartes (une question = une carte)
```

Les matières livrées avec l'app sont dans `src/data/matieres/`. Au jalon 3, on pourra aussi importer un fichier depuis l'écran « Matières ».

## Règles d'or pour écrire des cartes

- Une carte = une seule idée. Jamais de paragraphe à réciter.
- La question doit être impossible à deviner sans savoir.
- Les mauvaises réponses d'un QCM = de vraies erreurs que quelqu'un ferait.
- `explanation` = le POURQUOI, 2 lignes max. Les détails vont dans `explanation_more`.
- Vocabulaire simple, tutoiement, ton calme.

## Les champs

### Matière (racine du fichier)

| Champ | Obligatoire | Description |
|---|---|---|
| `id` | oui | Identifiant stable, en minuscules : lettres, chiffres, `-`, `_`. Ex. `psychologie`. **Ne change jamais entre deux versions.** |
| `name` | oui | Nom affiché. |
| `version` | oui | Entier ≥ 1. À augmenter à chaque réimport (v1 → v2). |
| `color` | non | Couleur de la pastille, ex. `#4F46E5`. |
| `description` | non | Une phrase. |
| `modules` | oui | Liste non vide de modules. |

### Module

| Champ | Obligatoire | Description |
|---|---|---|
| `id` | oui | Identifiant stable (mêmes règles). Unique dans le fichier. |
| `name` | oui | Nom affiché. |
| `concepts` | oui | Liste non vide de concepts. |

### Concept

| Champ | Obligatoire | Description |
|---|---|---|
| `id` | oui | Identifiant stable, unique dans le fichier. |
| `name` | oui | Nom affiché en petit au-dessus de chaque carte. |
| `cards` | oui | Liste non vide de cartes. |

### Carte

| Champ | Obligatoire | Description |
|---|---|---|
| `id` | oui | Identifiant stable, unique dans le fichier. **C'est la clé qui conserve ton historique de révision quand tu réimportes une v2.** |
| `type` | oui | `flash`, `qcm` ou `duel` (les autres types arrivent au jalon 4 : `cloze`, `why`, `whatif`, `worked_example`, `faded_example`, `problem`, `sort`). |
| `question` | oui | La question, courte. |
| `answer` | oui | La réponse. Pour `qcm` et `duel`, doit être exactement l'un des `options`. |
| `explanation` | oui | Le pourquoi, 2 lignes max. Affiché après une erreur. |
| `explanation_more` | non | Détails, sources, chiffres. Derrière « en savoir plus ». |
| `options` | qcm, duel | Les choix. QCM : 2 à 6. Duel : exactement 2. |
| `options_why` | non | Pourquoi chaque piège est faux, même ordre que `options`, `""` pour la bonne réponse. |
| `retention_goal` | non | `3m`, `1y` (défaut) ou `life`. Décide le calendrier de révision. |

### Les types de cartes

- **flash** : question → tu réponds dans ta tête → tu révèles → tu dis si tu avais bon.
- **qcm** : 2 à 6 choix dont des pièges plausibles ; après réponse, chaque piège explique pourquoi il est faux.
- **duel** : deux notions que tu confonds, « ceci est A ou B ? ». Deux choix, même mécanique que le QCM.

## Ce qui se passe à l'import

- Les identifiants sont préfixés par l'id de la matière dans la base (`psychologie/ego-1`) : deux matières ne peuvent pas se marcher dessus.
- Nouvelle carte → ajoutée, entre dans le planning comme « nouveauté » (quota par jour).
- Carte existante (même `id`) → textes mis à jour, **historique de révision conservé**.
- Carte absente de la nouvelle version → archivée, jamais effacée.

## Exemple complet

```json
{
  "id": "exemple",
  "name": "Matière d'exemple",
  "version": 1,
  "color": "#0F766E",
  "description": "Une matière minimale avec les trois types de cartes.",
  "modules": [
    {
      "id": "module-1",
      "name": "Premier module",
      "concepts": [
        {
          "id": "oubli",
          "name": "La courbe de l'oubli",
          "cards": [
            {
              "id": "oubli-1",
              "type": "flash",
              "question": "Qui a décrit le premier la courbe de l'oubli ?",
              "answer": "Hermann Ebbinghaus, en 1885.",
              "explanation": "Il s'est testé lui-même sur des syllabes sans sens, à des délais différents.",
              "explanation_more": "Sa courbe a été répliquée en 2015 par Murre et Dros.",
              "retention_goal": "1y"
            },
            {
              "id": "oubli-2",
              "type": "qcm",
              "question": "Quand perd-on le plus d'information ?",
              "options": ["Dans les premières heures", "Après une semaine", "Après un mois"],
              "options_why": ["", "À une semaine, la chute a déjà eu lieu.", "À un mois, ce qui reste est stable."],
              "answer": "Dans les premières heures",
              "explanation": "L'oubli est brutal au début puis ralentit."
            },
            {
              "id": "oubli-3",
              "type": "duel",
              "question": "« Se tester bat relire. » C'est l'effet de test ou l'effet d'espacement ?",
              "options": ["Effet de test", "Effet d'espacement"],
              "answer": "Effet de test",
              "explanation": "L'effet de test parle de la façon de réviser (se tester). L'espacement parle du moment (répartir dans le temps)."
            }
          ]
        }
      ]
    }
  ]
}
```

## Vérifier un fichier avant de l'importer

L'app valide le fichier et liste les problèmes en français (id manquant, doublon, réponse absente des options…). La logique est dans `src/lib/import/schema.ts`, testée dans `tests/schema.test.ts`.
