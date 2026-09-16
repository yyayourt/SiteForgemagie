# Forgemagie DOFUS — Comportement probabiliste de l'EXO LÉGER (poids < 30)
## Rapport de recherche pour le simulateur SiteForgemagie (Yanis / DOFUS 3-Unity, client 3.6.10.11)

## TL;DR
- **Aucune source — ni officielle Ankama, ni dataset expérimental chiffré et vérifiable — ne fournit un taux SC/SN/EC précis pour l'exo léger (rune de poids 15, ex. % Dommages Distance/Mêlée/Sorts).** Le consensus communautaire le plus solide est *structurel*, non numérique : le régime « 1% fixe / uniquement en Succès Critique » ne concerne QUE PA/PM/PO/Invocation (poids ≥ 30), tandis que les exo légers (poids < 30) « passent comme des runes normales » — donc via la courbe de poids + reliquat, PAS via le plancher 1%.
- **Le code actuel de Yanis a donc raison sur le principe** (ne pas appliquer le 1% fixe aux exo légers) **mais très probablement tort sur l'amplitude** : retomber sur la formule FM normale telle quelle donne des SC trop optimistes (jusqu'à 50%) parce que cette formule ne modélise pas le fait qu'un exo léger est une stat *au-delà du maximum natif de l'objet* (le max natif d'une ligne absente est 0) et qu'il dépend massivement du reliquat/puits accumulé.
- **Recommandation** : modéliser l'exo léger comme une rune normale évaluée « au-delà du max » (taux SC de départ fortement dégradé, croissant avec le reliquat disponible et décroissant à mesure qu'on ajoute des points), et documenter explicitement l'absence de dataset chiffré fiable. Toute valeur numérique injectée dans `empirical_params.json` doit être étiquetée « approximation de simulation », jamais « fait confirmé ».

---

## Key Findings (classés par statut épistémique)

### A. FAITS CONFIRMÉS (source officielle Ankama)
1. **Le plancher 1% est présenté comme le plancher de l'exo *en général*, illustré par PA/PM — pas affirmé pour toutes les lignes.** Le tutoriel officiel FR « La forgemagie » (dofus.com/fr/mmorpg/tutorials) énonce deux bornes distinctes :
   - Plancher des runes *normales* : « le taux de Succès Critique le plus faible lors de l'utilisation d'une rune, **hors tentative "d'overmax" ou de "forgemagie exotique", est de 15 %** ».
   - Exo : « Le taux de réussite des forgemagies exotiques est en revanche automatiquement très faible et **peut descendre jusqu'à 1 % si l'on souhaite ajouter un PA ou un PM exotique, par exemple.** »
   → Le « 1% » est donc décrit comme un *plancher atteignable* pour l'exo, exemplifié par PA/PM, et non comme une constante universelle pour toute ligne absente. C'est cohérent avec la thèse « seul PA/PM/PO/Invo = vrai exo 1% ».
2. **Poids officiels des runes concernées** (changelog Ankama relayé sur le forum officiel « Poids des nouvelles runes ? ») : « Les poids des effets suivants sont réduits (30 => 15) : % Dommages mêlée, % Dommages distance, % Dommages sorts, % Dommages armes, % Résistance mêlée, % Résistance Distance. » La **% Résistance neutre pèse 6** (tableau Millenium : « Résistance %neutre · Poids normal : 6 » ; « %Dommages Distance · Poids normal : 15 »). Ces poids valent pour DOFUS 2.x/3.
3. **Plafond d'over/exo par ligne** : le max théorique atteignable en over/exo sur les % dommages est **+6** (tableau Dafous, MàJ 09/02/2026, Unity 2026 : « Do Per Ar / Di / Me / So | poids 15 | Over max théorique : 6 »). D'où la « limite pratique ~3% » évoquée par les joueurs vu la difficulté croissante.
4. **Limite structurelle des 101 de poids** : « Sur un item il ne peut y avoir plus de 101 de Poids d'exotique et d'overmax additionné. Ainsi on ne peut pas mettre deux PA sur un item puisque 100 + 100 > 101. » (tofus.fr, cohérent avec l'officiel).
5. **Ordre des pertes (puits/over/exo)** : « Les jets exotiques ou overmax seront donc retirés avant le puit contrairement à de la forgemagie classique : la rune qui passe en exotique ou en over doit donc être la dernière rune à poser sur l'item. » (tofus.fr) ; et côté reliquat : « Le puits est toujours consommé en priorité avant que l'item ne perde des statistiques. » (Dafous). **Nuance importante à coder correctement** : le reliquat/puits est consommé en priorité lors d'un SN/EC ordinaire, MAIS quand on cherche à *conserver* un exo/over, une nouvelle rune fera tomber l'exo/over avant de puiser dans le puits d'une grosse rune — d'où la règle « l'exo doit être la dernière rune posée ».

### B. INFORMATION COMMUNAUTAIRE STRUCTURELLE (convergente, sources d'origines indépendantes) — la conclusion la plus fiable du rapport
6. **Distinction « vrai exo » (PA/PM/PO/Invo) vs exo léger.** Trois sources d'origines distinctes convergent sur un **seuil de poids ~30** :
   - **Papycha** (guide FR de référence, DOFUS 2.x) : « il est communément admis que seule la forgemagie exotique concernant un PA, un PM, un PO ou une invocation est réellement de la forgemagie exotique […] ces runes […] n'ont qu'1 % de chances de passer ! En revanche, lorsqu'elles passent dans ce cas précis, c'est **toujours en succès critique**. »
   - **Tutoriel Dofus Touch « La forgemagie de F à E »** (dofus-touch.com/fr/forum/57-tutoriels/20917, piste #3 du projet) : même thèse — seul l'exo PA/PM/PO/Invocation est « réellement » exotique (1% fixe) ; les autres lignes absentes suivent la courbe de poids normale/over.
   - **The Dofus Fashionista — Smithmagic Lab** (dofusfashionista.gg/forgemagie/, à jour « DOFUS 3 update 3.6.10.10 ») : « A line that stands **30 weight or more** past the item's own roll only passes on a critical success, commonly estimated at 1% per attempt: AP, MP, Range, Summon. **Lighter exos pass like normal runes but count against the 101 cap.** »
   → Guide FR + tuto Touch + outil anglophone Unity, indépendants, disent la même chose : **sous ~30 de poids, l'exo n'est PAS régi par le plancher 1% ; il passe via la mécanique normale (poids + reliquat).**
7. **Nuance d'incertitude assumée (Helleria, blog FR)** : l'exotisation « autre que PA/PM/PO, **et peut-être que CC/dommage ?** » — l'auteur lui-même marque son doute quant au comportement exact des % dommages. À traiter comme hypothèse, pas comme fait.

### C. DONNÉE COMMUNAUTAIRE SPÉCULATIVE (généalogie unique, NON corroborée)
8. **Table « décroissante par poids » du fil officiel « Les overs avec du puits »** (piste #2). Le snippet récupéré confirme le **ton ouvertement spéculatif** de l'auteur (« Retiens les valeurs suivantes je pense : les over réalisables sont entre 6 et 30 de poids »). En revanche, **le tableau numérique exact (poids 6→60%, 12→40%, 18→20%, 24→10%, 30-101→1%) n'a PAS pu être re-vérifié** : dofus.com bloque le fetch automatisé et seuls des extraits partiels sont accessibles. Deux réserves majeures : (a) cette table concerne explicitement les **OVERS**, pas nécessairement les **EXO légers** ; (b) c'est une **source unique auto-qualifiée de spéculation**. → À conserver comme « pure spéculation, source unique, non corroborée » et NE PAS coder comme vérité.
9. **Blog Alterya (« Des exos, des exos… », DOFUS 2.x, 2012)** — point de vue chiffré divergent et éclairant : « Les exos d'un poids supérieur ou égal à 20 passent automatiquement en SC (EDIT : possible qu'un exo de poids 20-50 passe en succès neutre) » et surtout « **Pour faire un exo d'un poids inférieur à 20, avoir un bon reliquat est obligatoire** ». → Pour l'exo léger (poids 15 < 20), le passage dépend crucialement du reliquat ; sans reliquat il est très difficile. Cela affine (et nuance) le « passe comme une rune normale » : ce n'est « facile » qu'en présence d'un reliquat suffisant.

### D. DONNÉES EXPÉRIMENTALES (datasets vidéo — identifiés mais NON extractibles)
10. **Chaîne Akaheif (DOFUS 3/Unity, 2025)** — identifiée comme autrice des shorts « Coiffe padgref 2% DO distance » (youtube.com/shorts/id4i1mk6fvE et GDDvv6Hnt0c), description : « 🔥 La version longue du concept est dispo sur la chaîne les amis : 100 tentatives EXO par vidéo 🔥 ». La coiffe Padgref est un item bas niveau (idéal pour isoler le comportement de l'exo léger car item peu lourd). **Les chiffres bruts SC/SN/EC de la version longue n'ont PAS pu être extraits** : YouTube renvoie 429/login-wall sur les descriptions, commentaires épinglés et transcriptions. Donnée potentiellement la plus précieuse du corpus, mais actuellement inaccessible par outil automatisé.
11. **Chaîne Gryfox / GryfoxGaming (DOFUS 2.x, 2022)** — vidéos confirmées : « ITEM DIFFICILE - SOLERETS KRITUR EXO % DOMMAGES DISTANCE » (11/08/2022, youtube.com/watch?v=We4ou4WiDTg) et « BOTTES DU KAMASTERISK EXO % DOMMAGES DISTANCE » (01/10/2022, youtube.com/watch?v=yZnDRusX4ds). Le préfixe « ITEM DIFFICILE » suggère un run long/pénible (cohérent avec un exo léger dur à passer), mais **aucun chiffre brut extractible**.

### E. INCONNUES / ZONES D'INCERTITUDE
- **Aucun taux SC/SN/EC chiffré, vérifié et reproductible** pour l'exo léger n'existe dans les sources publiques consultables.
- **Ankama n'a jamais publié la formule exacte** — confirmé par de multiples fils forum (« la formule est belle et bien secrète »).
- On ignore si le comportement de l'exo léger a *changé* entre DOFUS 2.x, Touch et 3/Unity (bien que Fashionista traite 2 et 3 sous la même mécanique).
- La table spéculative « overs avec du puits » n'a pu être ni confirmée ni infirmée par recoupement.

---

## Details

### Mécanisme de forgemagie (rappel, DOFUS 2.x/3, confirmé officiel)
Trois issues : **SC** (« La stat monte, rien ne bouge »), **SN** (« La stat monte, une autre baisse » → crée du puits/reliquat), **EC** (« Rune perdue + stats cassées », pertes proportionnelles au poids). Le taux dépend du poids de la rune et de la proximité de l'item à son maximum : plus l'item est proche du perfect/lourd, plus les runes échouent. Officiellement, les runes normales ne descendent jamais sous **15% de SC** — sauf en overmax et en exo, deux régimes explicitement exclus de ce plancher.

### Pourquoi l'exo léger est un cas *intermédiaire* (le cœur du problème de Yanis)
Une ligne absente du patron est, par construction, « au-delà du maximum » de l'objet (max natif = 0). C'est ce qui rapproche l'exo léger de l'**over**, PAS de la FM normale. Mais son poids (15) reste bien sous le seuil ~30 qui déclenche le régime « 1% fixe / uniquement SC » réservé à PA/PM/PO/Invo (poids 100/90/51/30). Les sources convergent : sous ~30, la mécanique bascule sur la courbe normale de poids + reliquat. Cela explique parfaitement le témoignage de la piste #1 (fil « Exo 2% dommage, faisable ? ») : le **1er point** de % Dommages passerait « nettement au-dessus de 1% », le **2e** plus dur, le **3e** proche du plancher — signature typique d'une stat qui monte vers son plafond d'over/exo (max +6), et non d'un tirage 1% constant.

### Le rôle décisif du reliquat (réconciliation B + C)
Alterya (« poids < 20 → reliquat obligatoire ») et Fashionista (« passe comme une rune normale ») ne se contredisent qu'en apparence. La synthèse cohérente : l'exo léger se comporte comme une rune normale **évaluée au-delà du max**, donc à SC faible sans reliquat, mais nettement meilleur avec un gros reliquat qui absorbe les SN/EC. **C'est précisément ce que le modèle générique FM de Yanis ne capture pas** : s'il applique la formule normale sans (a) pénalité « stat au-delà du max natif » ni (b) dépendance au reliquat, il produit des SC ~50% irréalistes. La correction ne consiste pas à forcer 1%, mais à dégrader fortement le SC de base ET à le faire remonter en fonction du reliquat.

### Versionnage (à ne jamais mélanger)
- **DOFUS 3/Unity (client 3.6.x)** : Fashionista couvre explicitement jusqu'à update 3.6.10.10 ; Ankama a maintenu que « les calculs restent identiques » à DOFUS 2, seule l'interface changeant (Dafous, Unity 2026). Les poids (15 / 6 / 30 / 51 / 90 / 100) sont ceux en vigueur.
- **DOFUS 2.x/Retro** : Papycha, tofus, Alterya (2012), Gryfox (2022). Mécanique identique revendiquée.
- **DOFUS Touch** : tuto « F à E » et tuto officiel Touch. Attention : certains poids/valeurs peuvent différer légèrement sur Touch ; ne pas transférer aveuglément à Unity. Le témoignage Touch structurel (seul PA/PM/PO/Invo = vrai exo) est néanmoins cohérent avec les sources PC.

---

## Recommendations
1. **Correctif immédiat de `computeOutcomeProbabilities`** : cesser de faire retomber l'exo léger sur la formule FM normale non modifiée. Introduire une branche « exo léger » (poids < 30, hors PA/PM/PO/Invo) qui traite la ligne comme un **over au-delà du max natif 0**, avec un SC de base bas et une dépendance explicite au reliquat disponible.
2. **Paramétrage `empirical_params.json`** : encoder une courbe SC **décroissante avec le nombre de points déjà posés** (1er point > 2e > 3e ≈ plancher), et **croissante avec le reliquat**. Étiqueter cette courbe « approximation de simulation, calibrée sur témoignages qualitatifs (Papycha / Fashionista / fil "Exo 2% faisable" / Alterya), NON chiffrée ». **Ne PAS** coder la table poids→% du fil « overs avec du puits » comme vérité : la stocker séparément, marquée « spéculation, source unique, non corroborée, concerne les OVERS ».
3. **Bornes de sécurité du modèle** : plafonner l'over/exo % dommages à **+6** (fait confirmé) ; respecter le cap **101** de poids over+exo cumulé (fait confirmé) ; ne jamais laisser le SC de l'exo léger atteindre les valeurs de la FM normale (15–50%) sur un item déjà remonté.
4. **Seuils qui déclencheraient une recalibration** : si un dataset chiffré devient accessible — priorité à la **version longue « 100 tentatives EXO » d'Akaheif** (DOFUS 3, item bas niveau = signal propre) ou à tout run communautaire **≥ 100 tentatives avec comptage explicite SC/SN/EC** sur % Dommages Distance — recalibrer immédiatement `empirical_params.json`. Cible idéale : ≥ 200 tentatives sur % Dommages Distance sur coiffe Padgref, reliquat contrôlé, pour estimer séparément le SC du 1er, 2e et 3e point.
5. **Extraction manuelle recommandée** : les chiffres Akaheif/Gryfox nécessitent un accès YouTube authentifié (API Data ou transcription) que le fetch automatisé ne permet pas ici ; Yanis devrait les visionner et relever les tallies à la main, puis les verser dans `docs/knowledge/` avec le label « donnée expérimentale, 1 échantillon, non contrôlé ».
6. **Documentation `docs/knowledge/`** : reprendre la taxonomie A/B/C/D/E ci-dessus avec les URLs, afin que chaque affirmation conserve son label de confiance dans la doc du projet.

## Sources (URLs)
- Tutoriel officiel FR « La forgemagie » : https://www.dofus.com/fr/mmorpg/tutorials/420190-forgemagie
- Tutoriel officiel EN « Smithmagic » : https://www.dofus.com/en/mmorpg/tutorials/443518-smithmagic
- Forum officiel « Poids des nouvelles runes ? » : https://www.dofus.com/fr/forum/1069-dofus/2223596-poids-nouvelles-runes
- Forum officiel « Forgemagie : Exo 2% dommage, faisable ? » : https://www.dofus.com/fr/forum/1067-artisanat/2246621
- Forum officiel « Les overs avec du puits » : https://www.dofus.com/fr/forum/1003-divers/2260968
- Forum officiel « Exo de malade… impossible à réaliser ? » (rune %do mêlée « 15 de puits », plafond pratique ~3%) : https://www.dofus.com/fr/forum/1003-divers/2306685
- Forum officiel « [Forgemagie][Maths] Loi de probabilité du passage de runes » : https://www.dofus.com/fr/forum/1067-artisanat/2214849
- Forum officiel « Proposition d'explication sur le taux d'échec anormal lors de repassage PA/PM » : https://www.dofus.com/fr/forum/1069-dofus/2353788
- Forum officiel « probabilité exo rés/passage PA/PM » : https://www.dofus.com/fr/forum/1069-dofus/2361711
- Guide Papycha « [Métier] La forgemagie » : https://papycha.fr/guide-la-forgemagie/
- Tuto Dofus Touch « La forgemagie de F à E » : https://www.dofus-touch.com/fr/forum/57-tutoriels/20917
- The Dofus Fashionista — Smithmagic Lab (DOFUS 3, update 3.6.10.10) : https://dofusfashionista.gg/forgemagie/
- Blog Helleria — Overmax et Exotique : https://helleria.wordpress.com/about/forgemagie/overmax-et-exotique/
- Blog Alterya — « Des exos, des exos et encore des exos » : https://alterya.over-blog.com/article-des-exos-des-exos-et-encore-des-exos-107438476.html
- Guide Millenium (tableau des poids) : https://www.millenium.org/guide/282643.html
- Guide Dafous — « Forgemagie 2026 : poids des runes » : https://dafous.app/guides/poids-runes-fm.html
- Fiche tofus.fr — La forgemagie : https://www.tofus.fr/fiches/forgemagie
- JeuxOnLine — La forgemagie : https://dofus.jeuxonline.info/article/3736/forgemagie
- Dofus Wiki Fandom — Mage : https://dofuswiki.fandom.com/wiki/Mage
- Shorts Akaheif : https://www.youtube.com/shorts/id4i1mk6fvE • https://www.youtube.com/shorts/GDDvv6Hnt0c (chaîne : https://www.youtube.com/@Akaheif/videos)
- Vidéos Gryfox : https://www.youtube.com/watch?v=We4ou4WiDTg • https://www.youtube.com/watch?v=yZnDRusX4ds

*Note de méthodologie : dofus.com bloque le fetch automatisé (robots) et YouTube renvoie des erreurs 429/login sur les pages vidéo ; plusieurs fils forum et toutes les vidéos n'ont donc été lus qu'en extraits (snippets de recherche). Aucun taux numérique n'a été inventé : toute valeur citée est attribuée à une source précise avec son statut épistémique.*