# GUIDE_CISSP.md : écrire l'univers « CISSP » (cybersécurité pour débutants)

Complète `docs/GUIDE_UNIVERS.md` (lire d'abord) et `SCHEMA.md`. Ce guide ne répète pas : il ajoute ce qui est propre au CISSP.
Modèle de planète complète : `docs/cissp/exemple_planete.json` (la planète « confidentialité »). **Copier son niveau de détail et son ton.**

## 1. Le projet

- Source : les 8 domaines du manuel officiel (ISC)2 CISSP, en anglais, dans `Univers Informatique a Renommer/` (PDF ; **jamais publié** : dossier ignoré par git).
- Texte propre, une ligne numérotée par paragraphe : `Univers Informatique a Renommer/_texte/domaine<N>.txt` (format `numéro<TAB>texte`). Régénérer : `node scripts/extraire-source.mjs <N> <sortie>`.
- Public : **débutant complet, dès 13 ans.** Priorité absolue : **la compréhension.** Puis la mémorisation mot pour mot des définitions officielles.
- Un domaine = plusieurs galaxies (une par grande section du livre). Une matière unique : `cissp`, un fichier JSON par galaxie dans `src/data/matieres/cissp/`.

## 2. Les deux règles d'or

### Règle 1 : comprendre d'abord
- Chaque planète commence par une **découverte** (3 à 8 écrans) avec une **analogie** du quotidien (collège, cuisine, sport, jeux, maison, magasin) et un écran **predire**.
- Tutoiement, **phrases de 20 mots maximum**, une idée par phrase, mots simples. Jamais « évidemment », « simplement », « faux », « échec ».
- **Chaque mot technique est défini au moment où il apparaît** (dans la phrase, avec un exemple), ou il a déjà été défini dans une planète précédente de la matière. Un mot technique n'est **jamais** utilisé avant sa définition. Les mots du quotidien informatique (réseau, serveur, mot de passe, chiffrer, pirate, malware…) sont définis dans la galaxie « mots de base » (`d1-m00-mots`) : on peut les utiliser partout.
- Premier emploi d'un terme dans une planète : **nom français (nom anglais)**, ex. « le moindre privilège (least privilege) ». Ensuite on peut garder le français.
- Chaque idée a au moins une carte **« pourquoi »** ou **« mise en situation »** (un petit scénario concret à analyser). On ne teste pas seulement des mots.
- Les pièges de l'examen (deux notions qu'on confond) deviennent des **duels**, avec l'explication de la différence.

### Règle 2 : les définitions officielles sont apprises TELLES QUELLES, en anglais
Le livre définit des notions avec des phrases précises. Elles sont à connaître **mot pour mot**.

**Ce qui compte comme « définition officielle »** : toute phrase du livre qui définit un terme (« X is… », « X refers to… », « (ISC)2 defines X as… », « NIST defines the purpose of … as follows »), et chaque élément d'une liste à retenir (les 4 canons, les lettres de SMART, les 5 fonctions du NIST CSF…).

**Chaque définition** est une suite de cartes dont l'id finit par `-def1`, `-def2`, `-def3`, `-def4`. Toutes contiennent la phrase du livre **sans changer un seul mot** (seules la casse, la ponctuation et les coupures de page peuvent différer). Interdit : résumer, reformuler, couper au milieu d'une proposition, corriger la grammaire du livre.

| Carte | Type | Phase | Contenu |
|---|---|---|---|
| `…-def1` | `flash` | `comprehension` | question : « Définition officielle (en anglais) : « terme » ». `answer` = phrase EN exacte + `\n\nTraduction : ` + traduction française fidèle. |
| `…-def2` | `cloze` | entraînement (défaut) | La phrase EN avec **2 trous** sur des mots-clés (un seul mot par trou). |
| `…-def3` | `cloze` | entraînement | La phrase EN avec **3 trous** sur des groupes de 2 à 4 mots (environ la moitié de la phrase). |
| `…-def4` | `problem` | entraînement | « Écris de mémoire la définition officielle de « terme » (en anglais). » `answer` = phrase EN exacte + `\n\nTraduction : …`. |

- Pour les `cloze` : `answer` = la phrase complète EN exacte ; la question, trous remplis, doit redonner exactement `answer`.
- **Définition clé** (3 par planète au maximum, ce que l'examen demande vraiment, souvent le titre de la planète) : les 4 cartes. **Définition secondaire** : seulement `-def1` et `-def3`.
- `retention_goal: "life"` pour toutes ces cartes. `explanation` : une phrase qui aide à comprendre ou à retenir (image, mot-clé), jamais une répétition.
- Pour une définition qui contient un guillemet droit, l'écrire `\"` dans le JSON.
- **Le contrôle est automatique** : `node scripts/verifier-definitions.mjs <domaine> <fichier.json>` échoue si une phrase n'est pas exactement dans le manuel. Il doit afficher « 0 erreur » avant de rendre le travail.
- Id des définitions : `<id du concept>-def1` ou `<id du concept>-<terme>-def1` s'il y a plusieurs définitions dans la planète (ex. `d1-confid-lp-def1`).
- La traduction française est fidèle et simple, mais n'a pas besoin d'être mot pour mot.

## 3. Structure

- **Module (galaxie)** : `id` `d1-mNN-slug` (NN = numéro à 2 chiffres, ex. `d1-m01-ethique-cia`), `name` « D1.NN titre court » ; 4 à 9 planètes ; `galaxie: { "teinte": 0-360, "ambiance": "calme|tendu|mysterieux|lumineux" }` (teinte distincte d'une galaxie à l'autre : domaine 1 = teintes 180 à 260).
- **Concept (planète)** : `id` `d1-<slug court>` (ex. `d1-confid`) unique dans toute la matière, et préfixe de tous les ids de ses cartes ; `name` en français avec le terme anglais entre parenthèses quand il y en a un ; `decouverte` (3 à 8 écrans) ; `planete: { "relief": … }` (varier).
- **Cartes** : `id` = `<id concept>-<n>` pour les cartes normales (`d1-confid-1`), `-defN` pour les définitions. Les ids sont uniques et ne changent jamais.
- Une planète = **une idée**. Si elle a plus de 6 définitions, la couper en deux planètes.
- Par planète : de **12 à 28 cartes** au total, dont :
  - toutes les définitions officielles de la section (voir règle 2) ;
  - au moins **2 cartes de compréhension** (duel, qcm, sort, worked_example) hors définitions ;
  - au moins **3 cartes d'entraînement** (flash, cloze, why, whatif, problem) hors définitions ;
  - au moins **1 mise en situation** (qcm ou why avec un petit scénario) ;
  - types variés : pas plus de 2 cartes du même type d'affilée (hors suites de définitions).
- Chaque planète est autonome : une planète doit pouvoir être faite après la précédente de la galaxie, sans rien d'autre.

## 4. Que mettre dans une planète (et quoi laisser de côté)

Le livre est long et technique. On **garde tout ce qui peut tomber à l'examen** : définitions, listes officielles (même longues : les découper en plusieurs cartes ou un `sort`/`ordonner`), noms de lois, de normes et de cadres, dates et chiffres clés, différences entre notions.
On **explique en simple** tout le reste, par une analogie ou un exemple. On ne supprime pas une notion parce qu'elle est difficile : on la découpe en petits morceaux.
- Les noms de lois, sigles et chiffres : cartes `flash`/`cloze`/`duel` avec `retention_goal: "3m"` (chiffre précis) ou `"1y"`. La source (domaine, section) dans `explanation_more`.
- Les longues listes (les 18 familles du NIST 800-53…) : un `sort` ou `ordonner` par petits groupes, ou une carte flash par élément, jamais une carte « récite la liste ».
- Les sigles : toujours donner l'écriture complète (en anglais) et le sens en français.

## 5. Découverte : consignes en plus

- 4 à 6 écrans : `histoire` (une situation de la vie, pas la réponse), `analogie` (« comme » / « en vrai », dire où l'image s'arrête si elle peut tromper), `predire` (2 à 4 options plausibles, `answer` copiée exactement d'une option), `exemple` concret (une entreprise, un site, une situation réelle de bureau).
- Les analogies viennent de la vie d'un adolescent ou d'un foyer (collège, famille, sport, jeux vidéo, téléphone, magasin, cuisine). Elles ne contredisent jamais la notion.
- **Pas de gras ni de balises** dans les textes (`**`, `_`, HTML) : le rendu les afficherait tels quels.
- Pas d'emoji dans le contenu.

## 6. Liste rouge (en plus de celle du GUIDE_UNIVERS)

- Reformuler ou « améliorer » une définition officielle.
- Un mot technique non défini (anglais ou français), ou utilisé avant sa définition.
- Une phrase de plus de 22 mots dans les textes en français (les définitions officielles en anglais sont exemptées).
- Une carte qui demande de réciter une liste entière.
- Une réponse de QCM devinable par sa forme (la plus longue, la plus précise…).
- Un piège de QCM absurde : chaque piège doit être une erreur qu'un vrai débutant ferait, et `options_why` dit pourquoi.
- Inventer un chiffre, une date, un nom de loi qui ne sont pas dans le manuel (si une information vient d'ailleurs, elle va dans `explanation_more` avec « hors manuel »).
- Un simple vrai/faux à rallonge ; une carte qui contient deux idées.

## 7. Contrôles avant de rendre un fichier

1. JSON valide ; `node scripts/verifier-definitions.mjs <N> <fichier>` : « 0 erreur ».
2. `npx vitest run tests/cissp.test.ts` (avec `CISSP_FICHIER=<nom du fichier>` pour ne tester que le sien) : tout vert (format, nombre d'écrans et de cartes par planète, ids uniques, cohérence des suites de définitions, longueur des phrases).
3. Relecture : un adolescent de 13 ans comprend chaque écran de découverte sans aide ; aucun mot technique n'est utilisé avant sa définition ; chaque définition du livre de la section est couverte.
