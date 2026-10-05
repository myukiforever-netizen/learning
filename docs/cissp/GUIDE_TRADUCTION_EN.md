# GUIDE_TRADUCTION_EN.md : traduire une galaxie CISSP en anglais

Chaque galaxie française (`src/data/matieres/cissp/<id>.json`) a un fichier jumeau anglais :
`src/data/matieres/cissp/en/<id>.json`. L'app l'affiche quand la personne passe le bouton FR/EN sur « EN ».
Le français ne change jamais ; les ids non plus (la progression est la même dans les deux langues).

## 1. Principe

- **On traduit le sens, pas les mots.** Anglais simple, comme pour un élève de 13 ans : phrases courtes (20 mots visés, 25 maximum), mots courants, « you », ton calme et encourageant. Jamais « wrong », « failed », « obviously », « simply ».
- **Rien n'est ajouté, rien n'est retiré** : mêmes écrans de découverte, mêmes cartes, mêmes options dans le même ordre, mêmes trous.
- Les analogies sont gardées, adaptées si l'image est trop française (collège → school, carnet de correspondance → school planner, délégué de classe → class representative). L'image reste vraie et la même idée est expliquée.
- Les termes techniques : le terme anglais standard du manuel (« confidentiality », « least privilege », « due care »). Là où le français écrit « le moindre privilège (least privilege) », l'anglais écrit simplement « least privilege » et l'explique la première fois.
- « le manuel » → « the official manual » ; « hors manuel » → « outside the manual » ; « Source : … » → « Source: … ». Les noms de lois, normes et sigles restent tels que dans le manuel.
- Une carte qui parle de la traduction ou de la différence français/anglais (« que veut dire X en français ? ») : l'adapter pour qu'elle garde du sens en anglais (demander le sens simple du terme), en gardant la même structure (même type, mêmes options).
- **Aucune lettre accentuée française** dans les textes anglais (le contrôle automatique la refuse : traduction oubliée). Guillemets : “ ” ou ‘ ’, jamais de guillemet droit " dans le JSON.
- Pas de gras, pas de balises, pas d'emoji.

## 2. Format du fichier `en/<id>.json`

```json
{
  "id": "d1-m01-ethique-cia",
  "name": "D1.1 Ethics and the three pillars (CIA)",
  "concepts": [
    {
      "id": "d1-confid",
      "name": "Confidentiality",
      "decouverte": [ ...mêmes écrans, mêmes `type`, textes traduits... ],
      "cards": [
        { "id": "d1-confid-def1", "question": "...", "answer": "...", "explanation": "...", "explanation_more": "..." }
      ]
    }
  ]
}
```

- Même `id` de galaxie, mêmes `id` de planètes et de cartes, **dans le même ordre**.
- Une carte anglaise contient seulement les champs à traduire : `id`, `question`, `answer`, `explanation`, `explanation_more` (seulement si le français l'a), `options` et `options_why` (seulement si le français les a ; même nombre, même ordre ; `options_why` vide `""` aux mêmes endroits), et `data` pour les types sort / exemples (voir 4). **Pas** de `type`, `phase`, `niveau`, `retention_goal`.
- Écrans de découverte : exactement les mêmes `type` dans le même ordre (`histoire`, `analogie`, `exemple`, `predire`) avec les mêmes champs (`titre`, `paragraphes`, `comme`, `enVrai`, `texte`, `question`, `options`, `answer`, `explanation`). Pour `predire`, `answer` est copiée exactement d'une option, **à la même position** que dans le français.

## 3. Règles par type de carte

- **qcm / duel** : `answer` copiée exactement d'une option, à la même position que dans le français. Mêmes pièges, `options_why` traduits.
- **cloze** (texte à trous) : même nombre de trous `[[...]]`, sur les mots-clés équivalents. Plusieurs réponses acceptées avec `|` (`[[limit|limiting]]`). `answer` = la phrase complète ; la question, trous remplis par la première réponse, doit redonner `answer` (lettres et chiffres identiques).
- **why / whatif / problem / flash** : traduire question, réponse modèle, explication.
- **worked_example / faded_example** : `data.steps` : mêmes étapes (même nombre), `prompt` et `text` traduits ; ne pas mettre `hidden`.
- **sort** : copier `data.mode` ; `classer` : `categories` traduites (même nombre, même ordre) et `items` `{ text, category }` dans le même ordre, avec la catégorie traduite correspondante ; `ordonner` : `items` (liste de textes) dans le même ordre.

## 4. Les définitions officielles (très important)

Les cartes dont l'id finit par `-def1`, `-def2`, `-def3`, `-def4` portent une phrase du manuel, **déjà en anglais**. Elle ne change pas d'un mot.
- `-def1` (flash) et `-def4` (problem) : `question` traduite (« Official definition: “integrity” » / « Write the official definition of “integrity” from memory. »). `answer` = **uniquement la phrase officielle** (celle qui précède « Traduction : » dans la carte française), **sans** traduction ni ligne en plus. Copier exactement.
- `-def2` et `-def3` (cloze) : `question` et `answer` **identiques au français** (copier-coller), seul `explanation` est traduit.
- `explanation` (et `explanation_more`) : traduits comme les autres textes.
- Le contrôle `node scripts/verifier-definitions.mjs 1 src/data/matieres/cissp/en/<id>.json` doit afficher « 0 erreur ».

## 5. Contrôles avant de rendre

1. Exporter le chemin de Node : `export PATH="$PATH:/c/Program Files/nodejs"`.
2. `CISSP_FICHIER=<id>.json npx vitest run tests/cissp-en.test.ts` : tout vert (structure identique, options, trous, éléments, définitions identiques, pas de français, phrases courtes).
3. `node scripts/verifier-definitions.mjs 1 src/data/matieres/cissp/en/<id>.json` : « 0 erreur ».
4. Relire quelques cartes : un élève anglophone de 13 ans comprend, sans mot français ni mot technique non expliqué.

Écrire les fichiers avec l'outil Write (pas de heredoc bash : les apostrophes et accents cassent). Un script Node (écrit avec Write) peut assembler des morceaux. Ne modifier aucun autre fichier, ne pas lancer git.
