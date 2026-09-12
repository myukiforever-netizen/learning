# Plan — Partie 2 : UI, couleurs, identité visuelle, animations

*Complément du plan de développement. Objectif : chaque choix visuel doit servir la mémoire, ou disparaître. Sources vérifiées en septembre 2026.*

---

## PARTIE A — Ce que dit la science (à lire avant de dessiner quoi que ce soit)

### A.1 — Les 7 découvertes qui décident du design

| # | Découverte | Preuve | Conséquence pour l'app |
|---|---|---|---|
| 1 | **Enlever le décoratif fait apprendre plus.** Les images, sons et détails "sympa mais inutiles" (détails séduisants) réduisent l'apprentissage. | Méta-analyses (Rey 2012 ; confirmé dans la méta-méta-analyse de Noetel 2022 ✔︎) | Design minimaliste. Zéro illustration décorative sur les cartes. |
| 2 | **Guider l'œil fait apprendre plus (le "signalement").** Mettre en évidence LE mot ou LA zone qui compte (couleur, gras, flèche) améliore rétention ET transfert, et réduit la charge mentale. | Méta-analyse : 103 études, 12 201 participants (Schneider et al. 2018 ✔︎) | La couleur et le gras sont réservés à 1 seul élément important par écran. |
| 3 | **Découper en petits morceaux que l'utilisateur déclenche lui-même.** Avancer par petits blocs avec un bouton "suite" aide l'apprentissage (effet de segmentation). | Méta-analyse (Rey et al. 2019 ✔︎ citée dans Noetel 2022) | Une carte = une bouchée. C'est TA règle "jamais de pavés" — elle est validée par la science. |
| 4 | **Fond clair = meilleure lecture.** Texte sombre sur fond clair bat texte clair sur fond sombre (vitesse, précision, acuité), pour jeunes ET âgés, surtout en petit texte. | Séries d'études répliquées (Piepenbrock et al. 2013, 2014 ✔︎ ; Buchner 2007 ✔︎) | Mode clair par défaut. Mode sombre en option de confort, pas par défaut. |
| 5 | **Les polices "spéciales mémoire" ne marchent pas.** Sans Forgetica (police "difficile à lire pour mieux retenir") : plusieurs réplications = aucun bénéfice, parfois pire. Toute la piste "rendre le texte dur à lire" est morte (méta-analyse : effet nul). | 4+ études de réplication (Taylor et al. 2020 ✔︎ ; Geller et al. 2020 ✔︎ ; Huff et al. 2022 ✔︎) ; méta-analyse Xie et al. 2018 ✔︎ | Police ultra-lisible, point final. La difficulté doit venir de la QUESTION, jamais de la lecture. |
| 6 | **Les animations n'aident que si elles montrent un mouvement réel.** Une animation qui montre comment un mécanisme bouge : petit bénéfice. Une animation décorative : distraction pure. | Méta-analyse (Berney & Bétrancourt 2016 ✔︎) | Animations = uniquement pour le feedback et l'orientation. Jamais pendant que je lis ou réponds. |
| 7 | **Le "design émotionnel" léger aide un peu.** Couleurs chaudes + formes rondes et amicales → petit effet positif sur la motivation et l'apprentissage (résultats mitigés selon les études). | Méta-analyses (Brom et al. 2018 ; Wong & Adesope 2021 ✔︎) | Interface chaleureuse et ronde, oui. Mascotte envahissante, non. |

### A.2 — Et la gamification ?

- Méta-analyse : effet positif petit à moyen sur l'apprentissage (g ≈ 0,49) et la motivation (g ≈ 0,36) ✔︎ (Sailer & Homner 2020).
- **MAIS** : points et badges seuls = l'élément le plus faible ✔︎ ; l'effet s'use avec le temps (effet de nouveauté) ✔︎ ; les récompenses externes peuvent user la motivation interne (sur-justification).
- **Décision pour l'app** : gamification minimale et honnête. Une série de jours 🔥, une barre de progression, un récap de fin. Pas de points, pas de badges, pas de niveaux, pas de classement (tu es seul, de toute façon).

### A.3 — Et les couleurs qui "boostent la mémoire" ?

- L'idée "le rouge améliore la mémoire" ou "le bleu la créativité" vient d'une étude isolée, jamais solidement répliquée. 🔴 Non fiable.
- Ce qui est solide : la couleur aide quand elle **porte un sens stable** (signalement, catégorie) et gêne quand elle est décorative. Le contraste élevé texte/fond aide toujours.
- Donc : dans l'app, **chaque couleur a UN sens fixe, appris une fois, jamais changé.** La couleur devient elle-même un indice de récupération.

---

## PARTIE B — Identité visuelle

### B.1 — La personnalité de l'app (3 mots)

**Calme. Précise. Encourageante.**
- *Calme* : rien ne bouge, rien ne clignote pendant l'effort mental.
- *Précise* : chaque couleur, chaque icône veut dire une seule chose.
- *Encourageante* : l'erreur est traitée comme une info utile, jamais comme une punition (pas de rouge agressif, pas de son d'échec).

### B.2 — Nom et logo (proposition)

- Nom de travail : **"Ancre"** (ce qui empêche la mémoire de dériver) — ou garde ton propre nom.
- Logo : une forme simple, géométrique, en une seule couleur (l'accent). Pas d'illustration complexe : il doit rester net en 24×24 px dans l'onglet du navigateur.

### B.3 — Le ton des textes de l'app

- Phrases courtes. Tutoiement. Zéro jargon.
- Jamais "Échec" ou "Faux !" → toujours "Pas encore" / "Regarde pourquoi".
- Le seul message insistant autorisé : "Ta vraie note, c'est dans 3 jours."

---

## PARTIE C — Le système de couleurs (avec les codes exacts)

### C.1 — La base (mode clair, par défaut — voir preuve A.1 n°4)

| Rôle | Couleur | Code | Note |
|---|---|---|---|
| Fond de page | Blanc cassé chaud | `#FAF9F6` | Blanc pur = trop dur pour de longues sessions ; le cassé garde le contraste sans éblouir |
| Fond de carte | Blanc | `#FFFFFF` | Avec une ombre très légère pour "détacher" la carte |
| Texte principal | Presque noir | `#1F2328` | Contraste ~15:1 (la norme demande 4,5:1 minimum — on est très large) |
| Texte secondaire | Gris | `#6B7280` | Uniquement pour les infos non essentielles (n° de carte, matière) |
| Bordures / séparations | Gris très clair | `#E7E5E0` | |

### C.2 — L'accent unique (l'identité)

| Rôle | Couleur | Code |
|---|---|---|
| Couleur de marque + boutons principaux + barre de progression | **Indigo profond** | `#4F46E5` |

Règle : **une seule couleur d'accent dans toute l'app.** C'est elle qui dit "c'est ici qu'on agit". (Choix esthétique — tu peux prendre un vert sapin `#0F766E` ou un bleu nuit `#1D4ED8` à la place ; ce qui compte c'est l'unicité, pas la teinte.)

### C.3 — Les couleurs qui portent un sens (jamais utilisées pour autre chose)

| Sens | Couleur | Code | Où |
|---|---|---|---|
| ✅ Bonne réponse | Vert doux | `#16A34A` | Feedback uniquement |
| 🟠 Réponse partielle / "avec effort" | Ambre | `#D97706` | Feedback uniquement |
| ⚠️ "Je croyais savoir, c'était faux" | Rose-rouge doux | `#E11D48` | Boîte d'erreur prioritaire uniquement — jamais ailleurs, pour garder sa force |
| 🔵 Mot-clé à retenir (signalement) | L'accent indigo, en gras | `#4F46E5` | 1 seul par carte, maximum |

### C.4 — Une teinte pastel par type de carte (repère instantané)

Un fin liseré coloré en haut de chaque carte indique son type. Au bout d'une semaine, ton cerveau sait avant de lire ce qu'on va lui demander — c'est un mini-indice de préparation, gratuit.

| Type de carte | Liseré | Code |
|---|---|---|
| Mémoriser (Flash, QCM, Trous) | Bleu pâle | `#DBEAFE` |
| Comprendre (Pourquoi ?, Et si ?) | Violet pâle | `#EDE9FE` |
| Procédure (Exemple résolu, À trous) | Vert pâle | `#D1FAE5` |
| Discriminer (Duel, Classer) | Jaune pâle | `#FEF3C7` |
| Page blanche | Gris pâle | `#F3F4F6` |

### C.5 — Mode sombre (option du soir)

Proposé, jamais imposé. Fond `#16181D` (pas noir pur), texte `#E5E7EB` (pas blanc pur), mêmes couleurs de sens légèrement adoucies. Un petit texte dans les réglages dira honnêtement : "La lecture est un peu plus précise en mode clair ; le sombre est là pour ton confort le soir."

---

## PARTIE D — Typographie

| Réglage | Choix | Pourquoi |
|---|---|---|
| Police | **Inter** (gratuite, Google Fonts) | Conçue pour les écrans, ultra-lisible, chiffres clairs. Alternatives : Source Sans 3, system-ui |
| Police "spéciale mémoire" | ❌ **Interdite** | Sans Forgetica et la piste "lecture difficile" = réfutées par réplications ✔︎ |
| Taille du texte des cartes | **20 px** (question), 17 px (reste) | Grand = moins d'effort de lecture = tout l'effort va à la réflexion |
| Longueur de ligne | **Max 60–70 caractères** | Au-delà, l'œil se perd en fin de ligne (recherche en lisibilité classique) |
| Interligne | 1,5 | Confort de lecture standard |
| Gras | 1 mot-clé max par carte | C'est du signalement (preuve n°2), pas de la décoration |
| Italique, MAJUSCULES, souligné | Quasi jamais | Le souligné = liens uniquement |
| Réglage utilisateur | Curseur de taille de texte (17 → 24 px) | Confort long terme |

---

## PARTIE E — La mise en page (layout)

- **Une seule colonne, centrée, largeur max 640 px.** Même sur grand écran : pas de barres latérales pendant la session (tout ce qui est à côté de la carte est une distraction — preuve n°1).
- **La carte occupe le centre**, boutons de réponse dessous, gros (min 48 px de haut — facile à viser, aussi au doigt sur téléphone).
- **En haut, une seule chose** : la barre de progression de session, fine (4 px), en indigo. Pas de score, pas de chrono visible (le stress à la récupération dégrade la performance — on s'entraîne sous pression seulement en "mode examen", volontaire).
- **Beaucoup de vide.** Le blanc autour de la carte n'est pas du gaspillage : c'est ce qui concentre l'attention sur l'unique tâche.
- **Raccourcis clavier** (session au clavier = plus rapide = plus de cartes) : `1–4` pour les choix, `Espace` pour révéler, `Entrée` pour valider, `E` pour "en savoir plus".

---

## PARTIE F — Le système d'animation

### F.1 — La règle d'or

> **Pendant que je lis ou que je réfléchis : RIEN ne bouge à l'écran. Zéro exception.**
> Les animations n'existent qu'ENTRE les moments de réflexion : transition de carte, feedback, fin de session.

### F.2 — Chaque animation a un métier

| Moment | Animation | Durée | Métier |
|---|---|---|---|
| Nouvelle carte | La carte glisse légèrement du bas + fondu | 250 ms | Dire "nouvelle tâche" sans réveiller tout l'écran |
| Révéler la réponse | La zone réponse se déplie doucement | 200 ms | Marquer la frontière "j'ai répondu → maintenant je vérifie" |
| ✅ Bonne réponse | Coche verte qui apparaît + liseré vert 1 s | 300 ms | Feedback net, puis on passe |
| ❌ Mauvaise réponse | Léger tremblement horizontal de la carte (2 mm) + passage en zone d'explication | 250 ms | Signal clair mais pas punitif (pas de rouge plein écran, pas de son) |
| Curseur de confiance 😕😐😎 | L'emoji choisi grossit légèrement | 150 ms | Confirmer le tap |
| Erreur ⚠️ (croyais savoir) | La carte se "marque" d'un coin rose | 300 ms | Gravité visible, sobre |
| Barre de progression | Avance en douceur | 400 ms | Sensation d'avancer |
| Fin de session | UNE seule célébration : la barre se remplit + petit rebond du récap | 600 ms | Récompense placée à la fin, jamais pendant (préserver la concentration + éviter l'usure de la nouveauté) |
| Exemple résolu | Chaque étape se déplie au tap | 200 ms | C'est la segmentation (preuve n°3) : l'utilisateur contrôle le rythme |

### F.3 — Les interdits

- ❌ Confettis, étoiles, sons de victoire à chaque bonne réponse (au bout de 3 jours c'est du bruit ; et récompenser chaque item use la motivation interne).
- ❌ Animations en boucle, éléments qui pulsent, dégradés animés en fond.
- ❌ Auto-défilement, cartes qui s'enchaînent toutes seules : **c'est toujours moi qui déclenche la suite** (segmentation).
- ❌ Compteurs qui tournent, chronos visibles par défaut.
- ✅ Respecter le réglage système "réduire les animations" (1 ligne de code : `prefers-reduced-motion`) : tout passe en fondu simple.

### F.4 — Réglages techniques (à donner à l'IA qui code)

- Courbe standard : `ease-out` (rapide au début, doux à la fin — sensation naturelle).
- Durées : 150 ms (micro-feedback) / 200–300 ms (transitions) / 600 ms (fin de session). Jamais plus.
- Tout en CSS (transform + opacity uniquement) : fluide même sur un vieux téléphone.

---

## PARTIE G — Les écrans, version visuelle

| Écran | Ambiance |
|---|---|
| **Accueil** | Presque vide : le bouton "Démarrer" en indigo, les 3 chiffres du jour en dessous, c'est tout. Aucune actu, aucune liste. L'app doit dire "viens faire ta session", pas "viens te promener". |
| **Session** | Fond `#FAF9F6`, carte blanche centrée, liseré de type, barre fine en haut. Rien d'autre. |
| **Fin de session** | Le seul écran chaleureux : grand ✅, récap en 3 lignes (fait / à retrier / prochaine révision), la phrase "Ta vraie note, c'est dans 3 jours." |
| **Mon cerveau** | Graphiques sobres, 2 couleurs max par graphique, gros chiffres. |
| **Matières** | Liste simple, une pastille de couleur par matière (choisie à l'import, réutilisée partout — encore un repère stable). |

---

## PARTIE H — Design tokens (à copier-coller dans le code)

```css
:root {
  /* Couleurs */
  --fond: #FAF9F6;        --carte: #FFFFFF;
  --texte: #1F2328;       --texte-2: #6B7280;
  --bordure: #E7E5E0;     --accent: #4F46E5;
  --ok: #16A34A;          --effort: #D97706;
  --alerte: #E11D48;
  --type-memoire: #DBEAFE;   --type-comprendre: #EDE9FE;
  --type-procedure: #D1FAE5; --type-duel: #FEF3C7;

  /* Texte */
  --police: 'Inter', system-ui, sans-serif;
  --taille-question: 20px; --taille-texte: 17px;
  --interligne: 1.5;       --largeur-max: 640px;

  /* Animations */
  --anim-micro: 150ms ease-out;
  --anim-transition: 250ms ease-out;
  --anim-fin: 600ms ease-out;

  /* Espacements (multiples de 8) */
  --e1: 8px; --e2: 16px; --e3: 24px; --e4: 40px;
}
```

---

## PARTIE I — Check-list finale avant de valider un écran

1. Est-ce qu'il y a plus d'UNE chose à faire sur cet écran ? → simplifier.
2. Est-ce qu'une couleur est là "pour faire joli" ? → la retirer ou lui donner un sens.
3. Est-ce que quelque chose bouge pendant la lecture ? → le figer.
4. Est-ce que le texte dépasse 3 lignes d'un coup ? → découper en cartes.
5. Est-ce qu'un élément décoratif s'est glissé (image, icône inutile) ? → supprimer (preuve n°1).
6. Est-ce que le contraste texte/fond est confortable en plein soleil sur téléphone ? → tester.
7. Est-ce que l'erreur est traitée avec douceur mais clarté ? → pas de rouge plein écran, mais une explication.

---

## PARTIE J — Sources principales de cette partie

- Noetel et al. (2022). *Multimedia design for learning: An overview of reviews with meta-meta-analysis.* Review of Educational Research. ✔︎ — le "chapeau" : signalement, cohérence, segmentation confirmés.
- Schneider, Beege, Nebel & Rey (2018). *A meta-analysis of how signaling affects learning with media.* Educational Research Review, 23, 1–24. ✔︎ (103 études, N = 12 201)
- Rey et al. (2019). *A meta-analysis of the segmenting effect.* Educational Psychology Review. ✔︎
- Taylor et al. (2020), *Memory* ✔︎ ; Geller et al. (2020) ✔︎ ; Huff et al. (2022), *Cognitive Research* ✔︎ — Sans Forgetica : aucun bénéfice.
- Xie, Zhou & Liu (2018). *Null effects of perceptual disfluency on learning outcomes.* Educational Psychology Review. ✔︎ — méta-analyse : la "lecture difficile" n'aide pas.
- Piepenbrock et al. (2013, 2014), *Ergonomics* ✔︎ ; Buchner & Baumgartner (2007) ✔︎ — avantage du fond clair, tous âges.
- Berney & Bétrancourt (2016). *Does animation enhance learning? A meta-analysis.* Computers & Education. ✔︎
- Brom et al. (2018) ; Wong & Adesope (2021), *Educational Psychology Review* ✔︎ — design émotionnel : petit effet, mitigé.
- Sailer & Homner (2020). *The gamification of learning: A meta-analysis.* Educational Psychology Review, 32, 77–112. ✔︎
