# Forgemagie : recherche du 23/09/2026 (potions d'armes 3.6/3.7 + données SC/SN/EC)

Légende de fiabilité :
- **[OFF]** : patch note ou devblog Ankama lu directement.
- **[OFF-2]** : chiffre officiel repris par un tiers, source primaire non relue.
- **[MES]** : relevé mesuré, avec un N connu.
- **[TEM]** : témoignage, N inconnu.
- **[HYP]** : hypothèse communautaire.

---

## 1. Potions de forgemagie d'armes (changement d'élément)

### 3.6 « Raid is not dead », patch note du 23/06/2026 [OFF]
Rubrique Craft / FM :
> « Il est à présent possible d'utiliser des potions et gravures de changement d'élément même après le passage d'une rune de transcendance. »

Les patchs mineurs 3.6.4 à 3.6.11 ne contiennent rien sur les potions ni sur la FM.

### 3.7, patch note bêta du 17/09/2026 [OFF], version bêta susceptible de changer
Rubrique Objets, « Liés à la forgemagie » :
- **Taux de conversion** : les potions à 85 % passent à **100 %**, celles à 50 % passent à **10 %**. Les armes déjà modifiées sont mises à jour rétroactivement.
- **8 nouveaux objets** : ils convertissent les **soins** Neutre vers un élément. 4 convertissent à 100 %, 4 à 10 %.
- **4 gemmes régénérantes** : elles annulent la conversion des dégâts, vols de vie et soins, et ramènent l'arme au Neutre.
- **Orbes régénérantes** : elles réinitialisent complètement un objet même s'il est **transcendé**. Elles retirent la transcendance et remettent à zéro caractéristiques et dégâts / vol / soin.
- **Faux et Épée maudite** : elles deviennent forgemageables.
- **Affichage** :
  - les effets de soin apparaissent dans la liste d'effets de l'interface FM ;
  - les effets des gravures et des potions de FM apparaissent dans l'infobulle des objets.
- **Co-FM** : un bouton « Transférer toutes les runes » est ajouté. Source : devblog 3.7 « Confort de jeu, lisibilité et ajustements ».

La 3.7.1 bêta du 22/09 ajoute un seul point : la recette des gemmes régénérantes inclut désormais des Métarias Triames.

À noter : les notes ne mentionnent **pas** de palier 68 %. Je n'ai pas vérifié si ce palier existe encore en 3.x.

**Impact simulateur** : modèle de conversion de dégâts à deux paliers seulement (10 % / 100 %). Ajouter la conversion des soins et un état « reset via gemme ». La transcendance n'est plus un verrou définitif, puisque l'orbe la retire.

---

## 2. Données SC / SN / EC

### 2.1 Relevés mesurés (les plus précieux)
| Source | Date / version | Expérience | Résultat |
|---|---|---|---|
| Dasech, forum dofus.com « Statistiques en forgemagie » | 25/11/2024, bêta Dofus 3 | 100 Gelano PA → exo PM | **8 949 runes pour 100 exos = 1,117 %** [MES] |
| idem | idem | Repassage de la rune PA après exo, 99 Gelano | **99 succès sur 177 runes = 56 %** [MES]. Distribution : environ 60 en 1 rune, le reste à ≤ 6 runes, et 2 cas où le PM a sauté |

- Le 1,117 % est cohérent avec p = 1 %. L'IC95 approximatif est de 0,9 à 1,3 %.
- Le 56 % de repassage PA porte sur un objet simple (Gelano) qui vient de perdre son PA, donc très en dessous de son poids max. C'est une ancre nouvelle, utile pour le cas « rune lourde sur objet allégé ».

### 2.2 Ancres officielles du devblog 1.27
- Référence : ta spec ALGORITHME.md, recalibrée le 10/09 sur le devblog original archivé.
- Les guides tiers recopient encore les ancres 66/34/0, 43/50/7, 15/50/35 et exo 1/0/99 [OFF-2]. Rappel de ta propre vérification :
  - le triplet 1/22/77 n'existe pas ;
  - il existe une 6ᵉ ancre, 32/50/18.
- **À vérifier** : je n'ai pas contrôlé que 15/50/35 (« minimum avec rune de puissance suffisante ») figure bien dans l'original. Compare-le à ton archive.

### 2.3 Témoignages chiffrés sur le repassage PA/PM
Fil « taux d'échec anormal lors de repassage PA/PM », dofus.com, mars 2021, 2.x :
- « Sans exo/over on a minimum les 15 % théoriques de SC, mais avec un 3 % rez ça tombe facilement à 2-3 % » (Le-skimboarder, « 12 ans de FM ») [TEM]
- Objet « full perf + 3 % res » : taux de repassage « 20 % plus ou moins » (Pnapolin) [TEM]
- Remontée d'un PA/PM naturel : environ 30 % SC / 50 % SN / 20 % EC (Alterya, 2012) [TEM]
- Après exo res : plus de 15 tentatives, et un cas à 40 runes PM sans succès (ChargePump) [TEM]

### 2.4 Hypothèses mécaniques récurrentes, à rendre paramétrables
1. **Poids total / poids max de l'objet** : c'est le facteur n° 1 cité partout [HYP, consensus].
   - ChargePump propose une chute *exponentielle* des chances quand le poids de l'objet dépasse celui du jet parfait (exemple : Shokkoth à 99,4 % contre 101,4 % du poids perf).
   - Le-skimboarder pense que les stats **en dessous du minimum naturel ne comptent pas** dans le poids global.
2. **Ratio jet / max de la ligne** : les SN augmentent nettement au-delà d'environ 80 % de la fourchette [OFF-2, qualitatif].
3. **Règle « 20 × la valeur de la rune »** : au-delà, un malus s'applique [HYP].
4. **Niveau de l'objet** : effet mineur, plus haut = un peu plus dur [OFF-2, qualitatif].
5. **Puits** :
   - majoritairement « ne change pas les probabilités » [HYP] ;
   - témoignage contraire : « les autres runes passent mieux quand y'a du puits (cape Fulgu, c'est flagrant) » [TEM].
   - Ces deux positions sont compatibles si c'est le *poids actuel* plus faible, et non le puits lui-même, qui aide. Je te propose de tester les deux variantes dans le simulateur.
6. **Limite d'over / exo** : 101 de poids **par ligne** selon la majorité des sources. SigilOS (2026) parle de 101 **par objet**, un point à trancher en jeu. Une règle récente (dofusfashionista) dit qu'une ligne ≥ 30 de poids au-dessus du jet ne passe qu'en SC (≈ 1 %) [HYP].
7. **Ordre de retrait en SN / EC** : lignes over/exo, puis puits, puis lignes aléatoires de poids proche de celui de la rune. JOL 2017 donne une variante : le puits d'abord [HYP, consensus ancien]. Le SN consomme le puits avant les stats [HYP].
8. **Transcendance / corruption** : 100 % de réussite [OFF-2].

### 2.5 Ce qui n'existe pas publiquement (état au 23/09/2026)
- Aucune formule officielle.
- Aucun Google Sheet de relevés Dofus 3.
- Aucune décompilation : le tirage est côté serveur, le client ne reçoit que le résultat.
- Les outils 3.x (SigilOS, dofusfashionista, geneka, dafous) reposent tous sur des estimations non documentées.

### 2.6 Recommandation de collecte
Ton journal FM en jeu, avec la DENSITÉ et le reliquat affichés, suffit. Un protocole ciblé pour départager les hypothèses 1, 2 et 5 :
- même objet, même rune ;
- noter à chaque tentative : poids actuel de l'objet, jet / max de la ligne, puits, issue.
- Il faut environ 300 à 500 tentatives par condition pour distinguer des écarts de ±5 points.

---

## 3. Deuxième passe : balayage des forums officiels (23/09/2026)

### Méthode
- **Sections parcourues** : Artisanat (archive Dofus 2, 23 pages, environ 1 090 sujets), Artisanat et Élevage (1778, 6 pages) et Discussions générales Dofus 3 (198 pages, environ 4 000 sujets). Les titres ont été filtrés avec des mots-clés FM.
- **Contenu des sujets** : environ 230 sujets retenus ont été scannés à la recherche de liens de fichiers (Google Drive / Sheets, Excel, pastebin) et de gros nombres de tentatives. Une partie des requêtes a été bloquée par l'anti-bot du site, puis relancée plus lentement.

### Ce qui existe comme « gros jeux de données »
| Source | Version | N | Résultat | Fichier ? |
|---|---|---|---|---|
| **Vidéo YouTube de Fek**, « Combien d'exo en 10 000 tentas ? », 19/01/2023 | Dofus 2 | 10 000 runes PM sur Gelano | 111 exos → **1,11 %** (IC95 0,91 à 1,32 %) [MES] | Non, résultats dans la vidéo |
| **Dasech**, forum, 25/11/2024 | bêta Dofus 3 | 8 949 runes PM | 100 exos → **1,117 %** ; repasser le PA : **56 %** (99/177) [MES] | Non |
| **Waveformer**, forum « FM 2% so/dist », 16-17/06/2026 | **bêta 3.6** | **10 000 à 15 000 runes Do Per So**, objet remis à zéro par orbes | 2ᵉ % Do Per So en exo : **3,4 %**, « presque 4 % » (et non 1 %) ; **aucun SN** sur toute la série [MES] | Non (il propose de centraliser les stats d'autres joueurs) |
| idem, confirmations | 3.x | albert-deux : 1 000 tentatives sur jet parfait à 1 % → 8 bottes à 2 % (**0,8 %**) ; Dividixx : « une centaine » d'objets à 2 %, estime 2 à 4 % [MES/TEM] | | Non |
| **Karias (LPBA)**, « Optimisation exo +1PM Gelano », 23/02/2021 | Dofus 2 | — | Document PDF d'analyse **théorique** (loi géométrique, rentabilité), pas de données brutes | **Oui** : [Google Drive](https://drive.google.com/file/d/1uK1L4H2_GLToVXONsyhWzZ2QEtpgJUKZ/view) |
| **Vidéo YouTube d'Akaheif**, « 1000 tentatives de Gelano PA/PM », 18/02/2026 | Dofus 3 | 1 000 | Résultat seulement dans la vidéo, non extrait | Non |

**Constats du balayage** :
- Je n'ai trouvé **aucun Google Sheet ni fichier de relevés bruts** sur le forum officiel.
- Le seul fichier partagé est le PDF théorique de Karias.
- Les « milliers d'essais » dont tu te souviens correspondent très probablement à Fek (10 000), Dasech (8 949) ou Waveformer (10 000 à 15 000, le plus récent et le plus utile pour Dofus 3).
- Un seul fichier cité ailleurs (un « tableau excel ») n'a pas pu être retrouvé.

### Nouvelles règles mécaniques relevées (Dofus 3, témoignages d'experts)
Sources : DekaPhobia, « Tutoriel de forgemagie [avancé] », 04/05/2025, et les réponses de Banjore.

**Densité et choix de la ligne qui saute**
- En SN / EC, **les lignes de densité proche de celle de la rune ont plus de chances de sauter**. Exemple : une Pa Tac fait plus sauter le PA qu'une rune Tac [TEM, convergent].
- Pour retirer un over vita, une rune de densité 1 non fractionnelle (Cha / Fo / Ine / Age) touche presque toujours l'over. Une rune Ini ou Vi « puise ailleurs » beaucoup plus souvent (Banjore) [TEM].
- Des runes Do Per So ne passent pas si l'objet n'a presque plus de puits, sauf en SC (Waveformer) [TEM].

**Montant retiré**
- Une rune de densité 1 qui fait baisser la vita retire **aléatoirement 5 ou 6** Vi. Le même arrondi aléatoire vaut pour les autres stats : exemple Fuite −21 puis −20 [TEM].
- Une rune Pod retire **toujours exactement 13** Vi [TEM].

**Stats négatives**
- Leur densité est **divisée par 2**. Elle redevient normale à partir de −1 : de −1 à 0, la rune coûte sa densité pleine [TEM].
- Un jet négatif ne diminue qu'« extrêmement rarement », sauf si on passe d'abord la ligne en over [TEM].

**Reliquat**
- Le **reliquat fractionnel** (Vi / Ini / Pods) est effacé quand on équipe l'objet. Ça sert de technique pour aligner les jets de Vi sur 0/5 [TEM].
- Réduction du puits des runes **Ré Dis / Ré Mel de 15 à 10** au passage à Dofus 3 (amsdeni, 22/12/2024) [TEM, non vérifié en patch note].

**Limites**
- La limite absolue de **101** est citée comme plafond par ligne : une Ra Cha à 92 → 102 est impossible [TEM].
- Le poids max d'un objet ignore peut-être les stats sous le minimum naturel (Le-skimboarder, 2021) [HYP].

**Types de résultat**
- Il existe un « **échec sans perte** » en plus de SC / SN / EC. Un SN où la stat visée saute elle-même, ou un EC sans assez de stats à retirer, s'affiche comme échec neutre (kankhun, 2023) [TEM].
- « Les runes de plus de 50 de poids ont 0 % de SN » (JohnButlerBlood, 2023) [HYP]. C'est cohérent avec exo PA = 1/0/99.
- Le SC ne descendrait jamais sous 1 % [HYP].

**Hypothèse réfutée** : « SC exo = 1/poids de la rune ». Selon kankhun et Le-skimboarder, le SC reste autour de 1 % pour les runes légères aussi, mais le **taux de SN augmente** quand la rune est légère ou le jet bas.

**Formule de brisage** (bonus, trouvée par « Enpreur ») : `(1 + 3 × jet × densité_stat × niv/200) × coef / densité_rune`. La partie décimale donne la probabilité d'obtenir une rune de plus. En focus, les jets des autres stats sont divisés par 2.

### Valeurs aberrantes à écarter
- « 5 500 tentatives pour 3 exos » (Kallsh, 24/03/2026) : c'est statistiquement impossible à 1 %. Les réponses soupçonnent une erreur de comptage ou de type de rune [TEM douteux].
- Nombreux fils « 300 à 1 000 tentas sans exo » : un biais de sélection classique, on poste quand on est malchanceux.

### Impact direct pour le simulateur
1. L'**exo sur rune légère n'est pas à 1 % fixe**. Pour Do Per So sur un objet à 1 %, le 2ᵉ % mesuré est d'environ 3,4 % (N ≈ 10-15 k). C'est une **nouvelle ancre** pour calibrer la dépendance au poids et au puits.
2. La **pondération par proximité de densité** doit entrer dans le choix de la ligne retirée en SN / EC.
3. Ajouter : l'**arrondi aléatoire** de la perte (5 ou 6 Vi), la **densité divisée par 2 pour les stats négatives**, et l'état « échec sans perte ».

---

## Sources
- Patch notes 3.6 « Raid is not dead » : https://www.dofus.com/fr/forum/2158-3-6-raid-not-dead/2455524-raid-not-dead
- Patch notes Bêta 3.7 (17/09/2026) : https://www.dofus.com/fr/forum/2030-notes-mise-jour-patch-notes-beta-3-7/2458232-patch-notes-beta-3-7-17-09-2026
- Patch notes Bêta 3.7.1 (22/09/2026) : https://www.dofus.com/fr/forum/2030-notes-mise-jour-patch-notes-beta-3-7/2458491-patch-notes-beta-3-7-1-22-09-2026
- Devblog MàJ 3.7 Confort de jeu : https://www.dofus.com/fr/forum/1971-devblog/2458194-maj-3-7-confort-jeu-lisibilite-ajustements
- Statistiques en forgemagie (Dasech, 2024) : https://www.dofus.com/fr/forum/1782-dofus/2424190-statistiques-forgemagie
- Repassage PA/PM (2021) : https://www.dofus.com/fr/forum/1069-dofus/2353788-forgemagie-proposition-explication-taux-echec-anormal-lors-repassage-pa-pm
- Chance d'exo 1/100 vraiment ? : https://www.dofus.com/fr/forum/1067-artisanat/2278893-chance-exo-pa-pm-1-100-vraiment
- Ankama, avez-vous changé les taux ? : https://www.dofus.com/fr/forum/1782-dofus/2315861-ankama-avez-change-taux-reussite-forgemagie
- FM 2.0 → 3.0 (UI) : https://www.dofus.com/fr/forum/1069-dofus/2426168-forgemagie-2-3-bugs-modifications
- Alterya 2012 : https://alterya.over-blog.com/article-la-forgemagie-103398969.html
- Sacri-Flex 2016 : https://sacriflex.wordpress.com/2016/08/21/forgemagie/
- JOL : https://dofus.jeuxonline.info/article/3736/forgemagie
- tofus : https://www.tofus.fr/fiches/forgemagie
- wiki-dofus.eu : https://wiki-dofus.eu/w/Forgemagie
- dofusfashionista : https://dofusfashionista.gg/forgemagie/
- SigilOS : https://beta.sigilos.fr/guides/poids-runes-forgemagie-dofus
- dafous : https://dafous.app/guides/poids-runes-fm.html
- huzounet : https://huzounet.fr/guides/forgemagie
- inkybot : https://github.com/kpolicar/inkybot
