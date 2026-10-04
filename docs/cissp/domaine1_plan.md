# Domaine 1 : Security and Risk Management (plan des galaxies)

Source : `Univers Informatique a Renommer/_texte/domaine1.txt` (833 lignes, format `numéro<TAB>texte`). Les numéros ci-dessous sont ceux de ce fichier.
Règles : `docs/GUIDE_CISSP.md` (obligatoire), `docs/GUIDE_UNIVERS.md`, `SCHEMA.md`. Modèle : `docs/cissp/exemple_planete.json`.
Sortie : un fichier par galaxie dans `src/data/matieres/cissp/`, nommé `<id du module>.json`, contenant l'objet module `{ "id", "name", "galaxie", "concepts": [...] }`.

Les « planètes proposées » sont des suggestions de découpage : tu peux les ajuster (4 à 9 planètes par galaxie, une idée par planète, une planète par définition clé importante), tant que **toutes les définitions et listes officielles de la section sont couvertes**. L'ordre des planètes va du plus simple au plus précis.

| Module (id = nom du fichier) | Nom affiché | Lignes | Planètes proposées |
|---|---|---|---|
| `d1-m00-mots` | D1.0 Les mots de base de la cybersécurité | (hors manuel) | voir ci-dessous |
| `d1-m01-ethique-cia` | D1.1 Éthique et les trois piliers (CIA) | 6–60 | éthique (préambule + 4 canons + code de l'organisation + RFC 1087) ; la sécurité de l'information et la triade CIA ; **confidentialité = planète `docs/cissp/exemple_planete.json` recopiée telle quelle** ; intégrité (+ authenticity, nonrepudiation, signature numérique) ; disponibilité (+ accessibility, usability, timeliness, SLA) ; limites de la triade (NIST, Parkerian Hexad, vie privée) |
| `d1-m02-gouvernance` | D1.2 La gouvernance de la sécurité | 61–121 et 205–208 | gouvernance (security governance, business issue) ; alignement avec la stratégie (mission, strategy, goal, objective, enabler/blocker) ; objectifs SMART ; comités de gouvernance ; fusions, acquisitions et cessions (M&A, divestiture) ; rôles et responsabilités (CISO, CSO, analyste, manager, directeur, utilisateurs) ; due care et due diligence |
| `d1-m03-cadres` | D1.3 Les cadres de contrôle de sécurité | 122–204 | contrôles de sécurité (technique, opérationnel, de gestion ; top-down / bottom-up) ; cadre de contrôle (security control framework) et choix selon le secteur ; ISO/IEC 27001 ; ISO/IEC 27002 ; NIST 800-53 ; NIST Cybersecurity Framework ; CIS Critical Security Controls (+ HITRUST, COBIT) |
| `d1-m04-conformite` | D1.4 Conformité et normes de l'industrie | 209–260 | conformité (compliance) ; juridiction, lois, statutes et regulations, citations ; Computer Security Act 1987 et FISMA 2002 ; Sarbanes-Oxley ; SOC 1, 2, 3 ; PCI DSS ; vie privée et PII |
| `d1-m05-cyber-pi` | D1.5 Cybercriminalité et propriété intellectuelle | 261–379 | cybercrime (définition, 3 catégories, délit/crime) ; les lois américaines (CFAA, ECPA, Economic Espionage Act, …) ; lois du reste du monde (Convention de Budapest, Computer Misuse Act, …) ; licences ; brevets, marques, droit d'auteur, secret commercial ; import/export ; flux transfrontaliers |
| `d1-m06-vie-privee` | D1.6 Vie privée et protection des données | 380–448 | lois américaines (Privacy Act 1974, HIPAA, COPPA, GLBA, HITECH) ; directive et lois européennes (Data Protection Directive, Data Protection Act UK, Safe Harbor, Privacy Shield) ; GDPR (principes, droits, rôles) ; amendes du GDPR |
| `d1-m07-enquetes` | D1.7 Les types d'enquêtes | 449–502 | enquête administrative, pénale, civile, de régulation, selon les normes de l'industrie ; preuve, niveau de preuve, charge de la preuve |
| `d1-m08-politiques` | D1.8 Politiques, normes, procédures et conseils | 503–529 | policies, standards, procedures, guidelines : définition, différence (WHY / WHAT / HOW / FYI), exemples |
| `d1-m09-continuite` | D1.9 La continuité d'activité | 530–574 | business continuity ; analyse d'impact (BIA) ; MTD, RTO, RPO, WRT ; priorités et ressources critiques |
| `d1-m10-personnel` | D1.10 La sécurité du personnel | 575–609 | recrutement et vérifications ; accords et politiques d'emploi ; arrivée, mutation, départ ; fournisseurs et sous-traitants ; conformité |
| `d1-m11-risque-bases` | D1.11 Menaces, vulnérabilités et risque | 610–651 | actif, menace, vulnérabilité, risque (définitions) ; évaluation du risque (identification, analyse, évaluation, traitement) ; analyse qualitative ; analyse quantitative (AV, EF, SLE, ARO, ALE) |
| `d1-m12-risque-traiter` | D1.12 Traiter et suivre le risque | 652–698 | les quatre réponses (avoid, mitigate, transfer, accept) ; choix d'une contre-mesure (efficacité, coût, impact) ; types de contrôles ; évaluation des contrôles ; suivi, rapports, amélioration continue |
| `d1-m13-risque-cadres` | D1.13 Les cadres de gestion du risque | 699–746 | ISO 31000 ; ISO/IEC 27005 et autres normes ; NIST RMF (7 étapes) ; COBIT et RiskIT ; (selon le contenu des lignes) |
| `d1-m14-modelisation` | D1.14 La modélisation des menaces | 747–778 | menaces centrées attaquant / actif / logiciel ; STRIDE ; PASTA ; DREAD ; autres méthodes citées |
| `d1-m15-chaine-appro` | D1.15 Le risque de la chaîne d'approvisionnement | 779–809 | risques matériel / logiciel / services ; évaluation et suivi des tiers ; exigences minimales ; niveaux de service (SLR) |
| `d1-m16-sensibilisation` | D1.16 Sensibiliser et former | 810–832 | sensibilisation, éducation, formation (définitions et différences) ; techniques (ingénierie sociale, champions, gamification) ; revues de contenu ; mesure de l'efficacité |

## Galaxie D1.0 : les mots de base (pas de définitions du manuel)

Cette galaxie ne vient pas du manuel : c'est le vocabulaire que doit connaître un débutant complet pour lire tout le reste.
Pas de suites `-defN` ici (les définitions sont en français, simples, avec exemple). Une carte `flash` « C'est quoi, … ? » par mot important, `retention_goal: "life"`.
Planètes proposées (6 à 8) :
1. la cybersécurité et le CISSP (c'est quoi, à quoi ça sert, ce que contient ce cours) ;
2. données, ordinateur, logiciel, système d'exploitation, réseau, internet, serveur, cloud ;
3. l'identité : compte, mot de passe, authentification, droits d'accès ;
4. chiffrer et déchiffrer (clé) ;
5. les attaquants et leurs armes : pirate (hacker), attaque, malware, virus, ransomware, hameçonnage (phishing), ingénierie sociale, déni de service (DoS) ;
6. les défenses : pare-feu (firewall), antivirus, sauvegarde (backup), mise à jour (patch), journaux (logs) ;
7. faille, menace, attaque : trois mots à ne pas mélanger (intuition ; les définitions officielles viennent plus tard, galaxie D1.11) ;
8. l'entreprise et la loi : entreprise, employé, client, contrat, règle, norme, loi, audit.
Teinte : 160. Chaque mot est utilisé tel quel dans la suite du cours : donne le nom français et le nom anglais.

## Conventions communes à toutes les galaxies

- Teinte de la galaxie : `160 + 6 × NN` (NN = numéro du module). Ambiance variée. Reliefs de planètes variés.
- Premier fichier de la liste des planètes : la plus simple. La dernière planète peut être une synthèse (comparaison des notions de la galaxie).
- Les définitions du livre peuvent se trouver au milieu d'un paragraphe : prendre la phrase exacte, du début à la fin de la phrase.
- Les listes officielles (ex. les 14 domaines de l'ISO 27001) : cartes `sort`/`ordonner` par petits groupes (≤ 8 éléments) ou une carte flash par élément ; `retention_goal: "3m"` ou `"1y"` ; la liste elle-même n'est pas une « définition » à réciter, sauf si le livre la présente comme une définition (ex. les 4 canons, SMART, les 5 fonctions NIST CSF : ces éléments suivent la règle des définitions).
- À la fin : renvoyer **un court compte rendu** (fichiers écrits, liste des planètes avec leur id, nombre de cartes, nombre de définitions, et tout point incertain). Ne pas modifier d'autres fichiers que les siens ; ne pas lancer git.
