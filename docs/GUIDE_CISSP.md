# GUIDE_CISSP.md : écrire l'univers « CISSP » (v2, 08/10/2026)

Complète `docs/GUIDE_UNIVERS.md` (lire d'abord) et `SCHEMA.md`. Modèle de planète complète : `docs/cissp/exemple_planete.json` (la planète « confidentiality »).
**Copier son niveau de détail et son ton.**

## 1. Ce qui a changé en v2 (demande du 08/10/2026)

- **Tout le CISSP est en anglais seulement.** Plus de version française, plus de bouton FR/EN. L'interface de l'app autour des cartes reste en français.
- **Vocabulaire encore plus simple** (voir §3).
- **Deux types de cartes seulement : `qcm` (priorité absolue) et `flash` (« self memory » : on répond dans sa tête, on se corrige).** Plus de cloze, duel, sort, why, whatif, problem, exemples.
- **Les QCM imitent ceux de l'examen** (voir §5) : 4 choix, une seule meilleure réponse, scénarios, mots-clés BEST / FIRST / MOST / LEAST.

## 2. Le projet

- Source : les 8 domaines du manuel officiel (ISC)2 CISSP, en anglais, dans `Univers Informatique a Renommer/` (PDF ; **jamais publié** : dossier ignoré par git). Texte propre numéroté : `Univers Informatique a Renommer/_texte/domaine<N>.txt` (régénérer : `node scripts/extraire-source.mjs <N> <sortie>`).
- Public : un apprenant français, débutant complet, qui prépare l'examen CISSP **en anglais**. Priorité : **comprendre**, puis **réussir les QCM de l'examen**, puis **retenir mot pour mot les définitions officielles**.
- Les vraies questions passées de l'examen sont confidentielles (ISC2 interdit de les diffuser) : on n'en utilise **aucune**. Toutes les questions sont écrites par nous, dans le **style** officiel.
- Une matière unique `cissp`, un fichier JSON par galaxie dans `src/data/matieres/cissp/`.

## 3. L'anglais simple (très important)

- Niveau visé : **anglais facile (A2-B1)**, celui d'un élève de 13 ans qui apprend l'anglais.
- **Phrases courtes** : 12 mots en moyenne, **22 mots au maximum**. Une idée par phrase.
- **Mots courants** : `use` (pas `utilize`), `start` (pas `commence`), `help` (pas `facilitate`), `show` (pas `demonstrate`), `need` (pas `require`), `buy` (pas `purchase`), `end` (pas `terminate`), `about` (pas `approximately`). Interdits dans nos textes : `utilize, commence, subsequently, furthermore, moreover, whereas, thereby, albeit, ascertain, endeavor, facilitate, leverage, notwithstanding, henceforth`.
- **Pas d'expressions imagées** ni de verbes à particule difficiles (`carry out`, `figure out`) quand un mot simple existe ; pas de références culturelles (sport, séries…). Temps simples : présent, passé simple, `will`, `can`.
- **Les mots techniques de l'examen sont gardés** (confidentiality, least privilege, due care…) : ce sont les mots de l'examen. Chacun est **expliqué en mots très simples la première fois** (dans la découverte), avec un exemple. Un mot technique n'est jamais utilisé avant d'être expliqué.
- Les **définitions officielles du manuel** restent **telles quelles** (leur anglais est plus difficile) ; la carte qui les montre donne juste après **une explication en mots simples**.
- Ton calme et encourageant : jamais « wrong », « failed », « obviously », « simply ». On dit « not quite », « look at why ».
- Pas de gras, pas de balises, pas d'emoji. Guillemets : “ ” ; jamais de guillemet droit " dans un texte (sauf dans une phrase officielle qui en contient, écrit `\"` dans le JSON).

## 4. Structure

- **Module (galaxie)** : `id` = nom du fichier (`d1-mNN-slug`), `name` « D1.NN titre court » ; 4 à 9 planètes ; `galaxie: { teinte, ambiance }`.
- **Concept (planète)** : `id` `d1-<slug court>` unique dans toute la matière ; `name` = le terme anglais ; `planete: { relief }` ; `decouverte` (3 à 8 écrans).
- **Ids de cartes** : `<id planète>-def1|def2|def3` (définitions officielles), `<id planète>-<terme>-def1…` s'il y en a plusieurs, `<id planète>-q<n>` (QCM), `<id planète>-f<n>` (flash). **Les anciens ids du type `<planète>-<chiffre>` ne sont plus utilisés** (ils sont archivés à l'import) : ne jamais en réutiliser un.
- **Phase** (important) : un QCM est par défaut un exercice de « Laboratoire » (sans révision espacée). Pour qu'une carte entre dans la révision espacée, il faut `"phase": "entrainement"`. Règle : environ **1 QCM sur 3 en `comprehension`** (vérifier qu'on a compris, juste après la découverte), **les autres en `entrainement`** ; les flash sont en `entrainement` ; les `-def1` sont en `comprehension`.
- `retention_goal` : `life` pour les définitions officielles, `1y` par défaut, `3m` pour un chiffre précis ou une date.
- Par planète : **de 16 à 36 cartes** dont :
  - toutes les définitions officielles de la section (voir §6) ;
  - **au moins 9 QCM** hors définitions, dont **au moins 4 « style examen »** (scénario ou mot-clé BEST / FIRST / MOST / LEAST / NOT) ;
  - **au moins 3 QCM en `comprehension`** et **5 en `entrainement`** ;
  - **au moins 3 flash** (`self memory`).
- Une planète = **une idée**. Si elle a plus de 6 définitions, la couper en deux.

## 5. Les QCM : comme à l'examen (priorité absolue)

### Ce que l'on sait de l'examen
Examen ISC2 : 100 à 150 questions en 3 heures, test adaptatif (CAT), 700 points sur 1000 pour réussir. Question normale = **4 choix, une seule meilleure réponse**. Certaines sont des **scénarios** (une situation, puis une question). Quelques questions ont d'autres formes (glisser-déposer, zones à cliquer) : nous les remplaçons par des QCM. Les pièges viennent presque toujours de **réponses plausibles** : il faut choisir **la meilleure**, pas une réponse « pas fausse ».
Sources publiques : page ISC2 « Getting Ready for Your ISC2 Exam », guides de préparation (voir `docs/cissp/examen_notes.md`).

### Règles d'écriture
1. **Exactement 4 options**, une seule bonne. **La position de la bonne réponse varie** : l'app n'a pas de mélange, donc sur une galaxie la bonne réponse est en position 1, 2, 3 et 4 à peu près autant (le test refuse plus de 35 % pour une position). Pas plus de 2 bonnes réponses de suite à la même position.
2. **La bonne réponse n'est ni toujours ni jamais la plus longue** (le test exige entre 10 % et 45 % de bonnes réponses les plus longues par galaxie). Les 4 options ont une longueur et une forme proches.
3. **Question** : une situation courte (1 à 3 phrases), puis la question. Les mots-clés sont **en majuscules** comme à l'examen : `BEST`, `MOST`, `FIRST`, `LEAST`, `NOT`. Pas d'indice dans la formulation.
4. **Les mauvaises réponses sont de vraies erreurs de débutant ou de manager pressé**, jamais absurdes :
   - le **mauvais objectif de sécurité** (disponibilité à la place de confidentialité) ;
   - une réponse **trop technique** quand la question demande une décision de gestion ;
   - une réponse **extrême** (« remove all risk completely », « always », « never ») ;
   - une action **réactive** quand une action préventive existe ;
   - une réponse **hors sujet** (vraie, mais ne répond pas à la question) ;
   - **un terme voisin** de la même galaxie mal utilisé (seulement des termes déjà enseignés).
5. **Pas de « all of the above » ni de « none of the above »**, pas de double négation.
6. `answer` = copie exacte d'une option. **`options_why` : 4 éléments** ; `""` pour la bonne réponse, et pour chaque mauvaise une phrase simple qui dit **pourquoi elle est tentante et pourquoi elle ne va pas**.
7. `explanation` : pourquoi la bonne réponse est la meilleure (1 à 2 phrases). `explanation_more` (facultatif) : source du manuel (« Source: (ISC)2 manual, domain 1, section … ») ; ce qui vient d'ailleurs : « outside the manual ».
8. **L'état d'esprit du manager** (enseigné dans la galaxie « How the exam asks questions ») : réduire le risque pour l'organisation, politique et gouvernance avant la technique, évaluer avant d'agir, prévenir plutôt que réparer, protéger le plus de monde possible. Les QCM de scénario appliquent cette logique.
9. Types de QCM à mélanger dans chaque planète : (a) comprendre une idée (« which goal is lost? »), (b) **scénario** (« what is the BEST action? »), (c) **FIRST** (« what should the manager do FIRST? »), (d) **NOT / LEAST** (« which is NOT part of… »), (e) **comparer deux notions proches** (qui remplace les duels), (f) **ordre d'un processus** (« which step comes AFTER … ? », qui remplace les « ordonner »), (g) **ranger** (« which item belongs to category X ? », qui remplace les « classer »).

### Les cartes `flash` (« self memory »)
Question courte → on répond dans sa tête → on révèle → on se corrige (« I knew it / not yet »). À utiliser pour : un sigle (« What does SLE stand for? »), un chiffre ou une date clé, **un élément d'une liste** (une carte par élément, jamais « récite la liste »), une idée à dire avec ses mots. `answer` en 1 à 3 phrases simples.

## 6. Les définitions officielles (apprises TELLES QUELLES)

Les phrases qui **définissent un terme** dans le manuel (« X is… », « X refers to… », « (ISC)2 defines X as… ») et chaque élément d'une liste à retenir (les 4 canons, les lettres de SMART, les 5 fonctions du NIST CSF…) suivent cette règle. La phrase est copiée du manuel **sans changer un mot** (seules la casse, la ponctuation et les coupures de page peuvent différer).

| Carte | Type | Phase | Contenu |
|---|---|---|---|
| `…-def1` | `flash` | `comprehension` | question : « Official definition: “term” ». `answer` = la phrase exacte du manuel. `explanation` = **la même idée en mots très simples** (1 à 2 phrases). |
| `…-def2` | `qcm` | `entrainement` | « Which sentence is the official definition of “term”? » : **4 phrases**, dont la phrase exacte du manuel (réponse) et **3 variantes proches** (un ou deux mots clés changés : un mot opposé, un objectif de sécurité voisin, un « only » ajouté…). Les 3 variantes ne sont pas du manuel. |
| `…-def3` | `flash` | `entrainement` | « Say the official definition of “term” from memory. » `answer` = la phrase exacte. Auto-évaluation. |

- **Définition clé** (3 par planète au maximum, ce que l'examen demande vraiment) : `def1`, `def2`, `def3`. **Définition secondaire** : `def1` et `def3` seulement.
- `retention_goal: "life"` pour toutes. `explanation_more` de `def1` : « Source: (ISC)2 manual, domain N, section … ».
- Une définition qui contient un guillemet droit : l'écrire `\"` dans le JSON.
- **Contrôle automatique** : `node scripts/verifier-definitions.mjs <domaine> <fichier>` échoue si la phrase de `answer` d'une carte `-def1/2/3` n'est pas exactement dans le manuel, ou si les 3 variantes d'un `-def2` sont aussi dans le manuel. À lancer avant de rendre.

## 7. Découverte (3 à 8 écrans, 4 à 6 conseillés)

`histoire` (une situation de la vie, sans la réponse), `analogie` (« comme » / « en vrai » ; dire où l'image s'arrête si elle peut tromper), `predire` (2 à 4 options plausibles, `answer` copiée exactement d'une option), `exemple` concret (une entreprise, un bureau). Analogies de la vie d'un adolescent (école, maison, jeux, téléphone, cuisine, magasin) ; elles ne contredisent jamais la notion. Les textes de découverte suivent aussi l'anglais simple du §3.

## 8. Liste rouge

- Reformuler une définition officielle ; un mot technique non expliqué ou utilisé avant son explication.
- Un type de carte autre que `qcm` ou `flash`.
- Un QCM : à 3 ou 5 options, avec « all of the above », avec une bonne réponse devinable (la plus longue, la plus précise), avec une mauvaise réponse absurde, ou dont l'`options_why` est incomplet.
- Une phrase de plus de 22 mots, ou un des mots interdits du §3.
- Une carte « récite la liste » ; deux idées dans une carte.
- Inventer un chiffre, une date, un nom de loi absents du manuel (une information venue d'ailleurs va en `explanation_more` avec « outside the manual »).
- Réutiliser un ancien id `<planète>-<chiffre>`.

## 9. Contrôles avant de rendre un fichier

1. JSON valide ; `node scripts/verifier-definitions.mjs <N> <fichier>` : « 0 erreur ».
2. `CISSP_FICHIER=<fichier>.json npx vitest run tests/cissp.test.ts` : tout vert (types, QCM à 4 options, positions des bonnes réponses, longueurs, phases, définitions, anglais simple).
3. Relecture : un élève de 13 ans qui apprend l'anglais comprend chaque écran et chaque question ; chaque QCM a une seule meilleure réponse que le manuel justifie.
