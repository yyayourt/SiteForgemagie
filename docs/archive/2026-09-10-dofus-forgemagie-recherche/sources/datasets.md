# Forgemagie DOFUS — Inventaire des jeux de données et relevés statistiques communautaires

Recherche menée le 2026-09-09. Objectif : trouver des DONNÉES BRUTES (relevés de tentatives comptées)
utilisables pour calibrer un simulateur FM local.

## VERDICT GÉNÉRAL (à lire en premier)

**Il n'existe, à ma connaissance après ~35 requêtes et le dépouillement des fils historiques, AUCUN
jeu de données brut public (Google Sheet, CSV, Excel) de relevés de tentatives de forgemagie.**

La communauté DOFUS n'a jamais produit l'équivalent d'un « recensement runes » exploitable. Ce qui
existe se répartit en 4 catégories :
1. **Une seule expérience à grand échantillon** : 10 000 tentatives filmées (voir §1). C'est LA donnée.
2. **Les probabilités officielles Ankama** publiées en DevBlog 1.27, relayées par des guides (§2).
   C'est la source la plus solide pour un simulateur — ce sont les vrais paramètres du jeu.
3. **Des tables de poids de runes**, dont une extraite automatiquement des serveurs Dofus (§3).
4. **Des anecdotes chiffrées** dispersées sur les forums (§5), inexploitables statistiquement mais
   utiles comme ordre de grandeur / test de cohérence.

Un projet explicite de constitution de dataset (machine learning, ~30 000 entrées) a été lancé en
2020 sur le forum officiel et **n'a jamais abouti** (§6).

### Limites d'accès rencontrées
- `web.archive.org` : **inaccessible** depuis cet environnement (bloqué côté WebFetch *et* côté proxy
  curl). Les sites morts type `dofus-forgemagie.com` n'ont donc **pas** pu être vérifiés en archive.
  → **À refaire manuellement depuis un navigateur normal**, c'est la piste non explorée la plus large.
- `dofus.com` : bloqué pour WebFetch (robots.txt) et pour curl (proxy). Contourné via le navigateur
  Chrome de l'utilisateur — les contenus ci-dessous sont donc des relevés directs, vérifiés.
- Discord : contenu non indexable, non consultable sans rejoindre. Liens d'invitation en §7.

---

## §1 — LE SEUL GROS ÉCHANTILLON : 10 000 tentatives d'exo PM (Fek)

| | |
|---|---|
| **URL** | https://www.youtube.com/watch?v=n1r8-DIPQQg |
| **Titre** | « COMBIEN D'EXO EN 10 000 TENTAS ? » |
| **Auteur** | chaîne YouTube **Fek** (219 abonnés) |
| **Nature** | Expérience filmée, comptage manuel de tentatives d'exo +1 PM sur Gelano |
| **Échantillon** | **10 000 tentatives** |
| **Accessibilité** | **En ligne** (vérifié 2026-09-09) |

### CHIFFRES BRUTS
- **10 000 tentatives → 111 exos PM obtenus**
- Taux observé : **1,11 %** (soit 1/90,09)

### Analyse statistique de ce résultat (par `kankhun#3768`, forum officiel, 04/04/2023)
Recopié mot pour mot :
> « Il n'y a pas assez d'essais pour affirmer un taux aussi precis en fait. Il a fait 10000 tentas et
> a obtenu 111 gelano. En calculant l'intervalle de confiance a 95% [...] :
> p = 1.11% +/- 1.96 * (1.11% * (1 - 1.11%) / 10000) ^0.5 = 1.11% +/- 0.2053% = [0.905, 1.315] % »

> « Bref loin de pouvoir affirmer avec conviction que c'est 1.11% avec trois chiffres significatifs.
> D'autant que les dev ont rabache la valeur de 1%, qui ne reste pas deconnant au vu du resultat. »

Réponse de `LPBA#1394` (06/04/2023) :
> « Il faudrait environ **40 000 tentas** pour écarter l'hypothèse du 1%. [...] A voir si quelqu'un
> veut faire **50 000 tentas** pour savoir une bonne fois pour toutes. »

**→ CONCLUSION POUR LE SIMULATEUR : 1 % est statistiquement compatible avec la seule mesure sérieuse
existante. Ne pas coder 1,11 % : l'écart n'est pas significatif.**

### Vidéo antérieure du même auteur (échantillon 10× plus petit)
- **URL** : https://www.youtube.com/watch?v=gs0FnGupFQY — « 1000 TENTATIVES de GELANO PA/PM... »
- Échantillon : **1 000 tentatives**. Chiffres détaillés non extraits (à visionner).
- Description de la vidéo 10 000 : « Après la video qui vous a bcp plus des 1000 tentas exo sur
  gelano aujourd'hui 10 fois plus avec 10 000 tentas, afin de verifier la théorie/expérience
  de 1/100 exos pour 100 tentas ! »

---

## §2 — PROBABILITÉS OFFICIELLES ANKAMA (DevBlog 1.27) — LA MEILLEURE SOURCE POUR UN SIMULATEUR

Ankama a publié en version 1.27 des triplets (Succès Critique / Neutre / Échec Critique). Le DevBlog
d'origine n'est plus accessible, mais deux relais indépendants concordent.

### Source A — Alterya (Shatofu ft. Fipop)
- **URL** : https://alterya.over-blog.com/article-la-forgemagie-103398969.html — **en ligne**
- Chiffres recopiés, cités comme « Selon le DevBlog Dofus » :
  - « Meilleures probabilités (bonus simples) = **SC : 66% N : 34% EC : 0%** »
  - « Jet parfait (bonus simples sur objets simples) = **SC : 43% N : 50% EC : 7%** »
  - « Proba mini (Création D'effet exo) = **SC : 1% N : 0% EC : 99%** »
  - « Probabilités Minimum = **SC : 15% N : 50% EC : 35%** »
- Autres chiffres : « Une ligne de bonus over ou exo ne peut PAS dépasser un poids de **101** » ;
  « Vous aurez TOUJOURS **1%** de réussite en SC » ; « En moyenne **100 runes PA** pour fm exo un item ».
- Formule du puits recopiée : « Le puits est le poids du bonus qui vient de partir, moins le poids de
  la rune qu'on vient de passer. Exemple : Une rune pa ine fait partir 1PA : **100-3 = 97 puits** ».

### Source B — Blog Guilde Yin-Yang (« Dofus 1.27 : la forgemagie, précisions et tests »)
- **URL** : https://yin-yang.over-blog.com/article-29549211.html — **en ligne**
- Triplets recopiés :
  - Meilleur cas : « **SC: 66% N: 34% EC: 0%** »
  - Tentatives sur jet parfait : « **SC: 34% N: 50% EC: 16%** »
  - Probabilités minimales : « **SC: 1% N: 0% EC: 99%** »
- **ATTENTION — DIVERGENCE** entre les deux relais sur le cas « jet parfait » :
  Alterya donne 43/50/7, Yin-Yang donne 34/50/16. Le total fait 100 dans les deux cas.
  Impossible de trancher sans le DevBlog original. À traiter comme une incertitude du modèle.
- Aucun relevé chiffré propre de l'auteur (« près de 400 runes de rési et do » consommées, sans
  comptage succès/échec).

### Corroboration : forgemage expérimenté sur le forum officiel
`kankhun#3768` (20/03/2023, fil « Loi de probabilité du passage de runes ») :
> « Mon ressenti, c'est que la valeur minimum est bien autour des **(SC/SN/EC) = 1/0/99%**, et les
> gros exo (PA/PM/PO) sont tous au seuil mini. »
> « pour des cas ou c'est petit over sur une stat elevee (genre un 101 intel pour une ligne a 100 max)
> c'est pas super dur. Comparativement, tenter un exo PA, bah c'est **99% EC**. »

---

## §3 — TABLES DE POIDS DES RUNES

### 3.1 ★ MEILLEURE SOURCE : extraction automatique depuis les serveurs Dofus (lilgallon/dofus-tools)
- **URL dépôt** : https://github.com/lilgallon/dofus-tools
- **Fichier** : https://raw.githubusercontent.com/lilgallon/dofus-tools/master/js/runes.js
- **Accessibilité** : **en ligne**, TÉLÉCHARGÉ (voir §8)
- **Nature** : liste de **92 runes** avec poids, générée par script. En-tête du fichier recopié :
  > « This file contains the rune list. Check the script "py/download_all_runes" to download all the
  > runes from the Dofus servers. Check the script "py/retrieve_runes_list" to generate the javascript
  > rune list. »
  → **C'est la seule table de poids qui ne soit pas une saisie manuelle de joueur.** À privilégier.
- Extrait des valeurs notables : `Rune Ga Pa = 100`, `Rune Ga Pme = 90`, `Rune Po = 51`,
  `Rune Invo = 30`, `Rune Ra Sa = 30`, `Rune Pa So = 30`, `Rune Do = 20`, `Rune Ra Pui = 20`,
  `Rune Ra Pi Per = 20`, `Rune Do Per Ar/Di/Mé/So = 15`, `Rune Ré Per Di/Mé = 15`,
  `Rune Pa Do * = 15`, `Rune Pa Pi = 15`, `Rune Pa Fui = 12`, `Rune Pa Tac = 12`,
  `Rune Cri = 10`, `Rune So = 10`, `Rune Do Ren = 10`, `Rune Ra Age/Cha/Fo/Ine/Ini/Vi = 10`,
  `Rune Pa Ret Pa/Ret Pme/Ré Pa/Ré Pme = 21`, `Rune Ret Pa/Ret Pme/Ré Pa/Ré Pme = 7`,
  `Rune Ré Per Air/Eau/Feu/Terre/Neutre = 6`, `Rune Pa Sa = 9`, `Rune Pa Prospe = 9`,
  `Rune Do * (élément) = 5`, `Rune Pi = 5`, `Rune Fui = 4`, `Rune Tac = 4`, `Rune Sa = 3`,
  `Rune Prospe = 3`, `Rune Pa Age/Cha/Fo/Ine/Ini/Vi = 3`, `Rune Ré * (fixe) = 2`, `Rune Pui = 2`,
  `Rune Pi Per = 2`, `Rune Age/Cha/Fo/Ine/Ini/Vi = 1`, **`Rune de chasse = -1`** (poids négatif !).
- Table complète : `data/runes_weights_lilgallon.csv` (92 lignes) et `.txt` (groupé par catégorie).

### 3.2 Millenium — table manuelle la plus complète (52 lignes, colonnes normal/Pa/Ra)
- **URL** : https://www.millenium.org/guide/282643.html?page=2 — **en ligne**
- Chiffres : Age/Cha/Fo/Ine/Ini/Vi **1 / 3 / 10** ; Pod **2,5 / 7,5 / 25** ; Pi per **2 / 6 / 20** ;
  Pui **2 / 6 / 20** ; Sa **3 / 9 / 30** ; Prospe **3 / 9 / —** ; Ré fixes (air/eau/terre/feu/neutre/
  pou/cri) **2 / 6 / —** ; Do élémentaires + Do cri + Do pou **5 / 15 / —** ; Do **20** ;
  Do ren **10** ; Fui **4 / 12** ; Tac **4 / 12** ; Ret pa / Ret PM **7 / 21** ;
  Ré per (air/feu/eau/terre/neutre) **6** ; Ré pa / Ré pme **7 / 21** ; Pi **5 / 15** ;
  Do per ar/di/me/so **15** ; Ré per me / Ré per dis **15** ; So **10 / 30** ; Cri **10** ;
  Chasse **5** ; Invo **30** ; Po **51** ; Ga pme **90** ; **Ga pa 90** ← *erreur probable, tous les
  autres relevés donnent 100*.
- **Divergences vs 3.1** : Vitalité (1 chez lilgallon vs 0,75–0,2 ailleurs), Chasse (+5 vs −1),
  Ga Pa (90 vs 100).

### 3.3 Xixou.io — Dofus RÉTRO 1.49 (attention : version différente !)
- **URL** : https://xixou.io/guides/poids-des-runes/ — **en ligne**
- PA **100**, PM **90**, PO **51**, CC **30**, Invocation **30**, Renvoi de sort **30**,
  Dommages **20**, Soins **15**, Fuite **5**, Tacle **5**, Sagesse **3**, Prospection **3**,
  Force/Chance/Intelligence/Agilité **1**, **Vitalité 0,2**, **Initiative 0,1**.
- Mentionne « **1 % de succès critique (SC)** » pour les exos PA/PM.
- ⚠ Les poids Vi/Ini de Rétro (0,2 / 0,1) sont **incompatibles** avec Dofus 2/3 (1 / 1).

### 3.4 Helleria (WordPress) — poids + plafonds d'over
- **URL** : https://helleria.wordpress.com/about/forgemagie/les-bases/ et `/overmax-et-exotique/`
  — **en ligne**
- Poids : Vitalité **0,75 / 2,5 / 7,5** ; élémentaires+ini **1 / 3 / 10** ; Sagesse/Prospection
  **3 / 9 / 30** ; Puissance **2 / 6 / 20** ; Tacle/Fuite **4 / 12** ; Esquive/Retrait **7 / 21** ;
  Rési élémentaire **5 / 15** ; Rési fixes **2 / 6** ; Rési % **6** ; Soin/Dommage **20** ;
  CC/Invocation **30** ; PO **51** ; PM **90** ; PA **100**.
- **Tableau des maxima d'over** (précieux pour borner un simulateur) :
  Vitalité **404** ; Force/Agilité/Intelligence/Chance **101** ; Sagesse/Prospection **33** ;
  Coup Critique **3** ; PA/PM/PO **1** ; Initiative **1010** ; Résistance % **16** ;
  Dommage élémentaire **20** ; Puissance **50**.
- Exo : « **1/100** quel que soit l'état de l'item ou du puits » ; « **100 remontages** en moyenne » ;
  « Succès neutre lors d'un passage exo PA/PM/PO : **0 %** ».

### 3.5 dofuspourlesnoobs — poids + max over (valeurs partiellement divergentes)
- **URL** : https://www.dofuspourlesnoobs.com/guide-forgemagie.html — **en ligne**
- Vi poids **2**, max over **505** (≠ 404 ailleurs) ; Sa **3** / max **33** ;
  Age/Cha/Fo/Ine **1** / max **101** ; Pui & Pi Per **2** / max **50** ; Do **20** / max **5** ;
  Do Ren **5** / max **20** ; Do élém/cri/pou **5** / max **20** ; Do Per **15** / max **6** ;
  Ré élém/cri/pou **2** / max **50** ; Ré Per **6** / max **16** ; Ré Pa/Pme **7** / max **14** ;
  Ré Per Di/Mé **15** / max **6** ; **Ga Pa 100 / max 1** ; **Ga Pme 90 / max 1** ; **PO 51 / max 1** ;
  Ini **1** / max **1010** ; Pod **2,5** / max **404**.

### 3.6 JeuxOnLine (JOL) — table + courbe de rendement de brisage
- **URL** : https://dofus.jeuxonline.info/article/235/forgemagie — **en ligne**
- Poids : Vi **1/3/10** ; Sa **3/9/30** ; Age/Fo/Cha/Ine **1/3/10** ; Prospection **3/9** ;
  Résistance fixe **4** ; Résistance % **5** ; Initiative **1/3/10** ; Dommage **20** ;
  Dommage % **2/6/20** ; Dommage pièges **15/45** ; Renvoi dommage **30** ; Soin **20** ;
  Créature invocable **30** ; Coup critique **30** ; Portée **50** ; PM **90** ; PA **100**.
- ★ **Table de probabilité d'obtention de rune Ra selon le jet** (rare, exploitable directement) :
  > « 23- : **0%** | 24 : **8%** | 25 : **20%** | 26 : **31%** | 27 : **41%** | 28 : **50%** |
  > 29 : **59%** | 30 : **67%** | 31 : **74%** | 32 : **81%** | 33 : **88%** | 34 : **94%** |
  > 35+ : **100%** »
  (⚠ concerne le **brisage**, pas le passage de rune — utile si le simulateur couvre le brisage.)
- Gains XP métier : de **1 à 1000 XP** selon niveau objet (1–200) et poids de rune (1–100).

### 3.7 Autres tables (redondantes, saisie manuelle, qualité moindre)
- Huzounet — https://huzounet.fr/guides/forgemagie — **en ligne**. Densités 1/3/10 ; « 1 RA = 3 PA »,
  « 1 PA = 3 runes mineures » ; **over max 101**, **exo max 101** ; taux exo « densité > 20/stat sur
  item sans cette stat → **taux de succès critique 1 %** » ; taux de brisage item **1 à 4000 %** ;
  formule densité de brisage focus : « (Densité stat focus + (Densité totalité autres stats / 2)) ».
- Tofus — https://www.tofus.fr/fiches/forgemagie — **en ligne**. Vi **0,75/2,5/7,5** ;
  PA/PM/PO **100/90/51** ; « une rune passe globalement bien jusqu'à **20 fois** sa puissance » ;
  exo PA/PM **1 %** ; over+exo max **101**. ⚠ Affirme « 10 petites runes pour une Pa » (faux, c'est 3).
- Dofastuces — https://www.dofastuces.fr/pages/dossiers/tableau-poids-des-runes.html — **en ligne**
  mais la table est une **image JPG** (non extractible). Les commentaires signalent des erreurs :
  « Runes de Chasse (poids 5) », « Pa So/Soin (poids 30) », « Ré Crit/Ré Pou poids 2, pas 5 ».
  C'est pourtant la source citée par l'étude PDF du §4 (Figure 1).
- Alterya 1.29 (Dofus Rétro) — https://alterya.over-blog.com/2017/11/tout-sur-la-forgemagie-en-1.29.html
  — **en ligne**. Runes critiques **poids 30 en 1.29 contre 10 en 2.0** (⚠ écart de version majeur).
  Maxima : Vitalité **404** (101÷0,25), Sagesse **33** (101÷3), Intelligence **101**,
  Initiative **1010** (101÷0,10). Règle empirique : « multipliez la stat de votre rune par **20** environ ».

---

## §4 — ÉTUDE PROBABILISTE FORMELLE (PDF, 5 pages) — Karias / LPBA#1394

| | |
|---|---|
| **URL PDF** | https://drive.google.com/file/d/1uK1L4H2_GLToVXONsyhWzZ2QEtpgJUKZ/view |
| **Fil de discussion** | https://www.dofus.com/fr/forum/1067-artisanat-elevage/2352725-optimisation-forgemagie-exotique-1pm-gelano |
| **Titre** | « Optimisation de la forgemagie exotique +1 PM d'un Gelano », Karias, 23 février 2021 |
| **Nature** | **Analyse théorique** (loi géométrique), PAS un relevé expérimental |
| **Accessibilité** | **En ligne**, lisible ; téléchargement direct bloqué depuis cet environnement |

### CHIFFRES RECOPIÉS
- Hypothèse de base : p = **1/90** (= 1/poids de la rune PM). L'auteur admet que c'est un postulat.
- Loi géométrique P(X=x) = p(1−p)^(x−1).
- **⟨X⟩ = poids de la rune = 90** tentatives en moyenne (équation 3)
- **σ_X ≈ 88,52** (équation 4)
- Conclusion recopiée : « Il faudra donc, le plus souvent, **90 ± 88,52 runes** pour pouvoir passer
  une forgemagie exotique. A noter que ce résultat s'applique à n'importe quel objet sur lequel on
  tente une forgemagie exotique à autres bonus fixes. »
- Prix marché utilisés (serveur **Ilyzaelle, 22/02/21**) :
  **π_Gelano = 100 000 k**, **π_PA/PM = 1 500 000 k**
- Gain moyen : **⟨γ⟩ = −400 000 k** (équation 11) ; écart-type **σ_γ ≈ 1 770 000 k** (équation 12)
- Conclusion recopiée : « La moyenne des gains étant négative, la forgemagie exotique +1 PM d'un
  Gelano est donc **perdante sur le long terme**, pour les valeurs considérées des prix. »
- Figure 1 = « Tableau du poids des runes (**Source : Dofastuces**) » : Invo 30, Po 51, GaPM 90, GaPa 100.
- Section 3 « Forgemagie à PA variable » : **« Bientôt »** → jamais écrite.

### Discussion associée (chiffres utiles)
- `SXD#8177` (21/03/2022) : « Le prix du gelano PA/PM sur **Jahash** est actuellement de
  **1 200 000 kamas**, des runes PM de **20 000 kamas**. » ; recalcul : « Si je reprends ton
  approximation 1/90 = 0.011 et que je calcule P(X<=70) alors j'obtiens **0.5389** et pas **0.537** » ;
  simplification proposée : **P(X<=n) = 1 − q^n**.
- `Le-skimboarder#7558` (09/04/2021), 10 ans de FM, contredit le 1/90 :
  « C'est **1/100** pour PA PM PO. [...] La formule "proba = 1/poids de la rune" c'est une idée reçue
  qui est fausse à mon avis. Sinon toutes les runes de poids 1 passeraient en SC à chaque coup. »
  Observations chiffrées de sa part : « Pour le premier %rési par exemple, même avec du puits on est
  **en-dessous de 1 chance sur 6** » ; en over « j'suis déjà monté à **10 %** sur une amu torquistik
  (7% feu) sans l'aide du puits PA ».
- `LPBA` sur ce qu'il faudrait pour valider : « il faudrait plusieurs **dizaines de réussites** [...]
  Si un richou veut faire l'expérience et me transmettre les résultats sur **30 à 50 exo PM de
  Gelano**, qu'il me fasse signe. » → **jamais réalisé.**

---

## §5 — RELEVÉS ANECDOTIQUES (petits échantillons, à ne PAS agréger naïvement)

### 5.1 jeuxvideo.com — « [Forgemagie] Vos exos en moyenne ! » (18/08/2013)
- **URL** : https://www.jeuxvideo.com/forums/1-9655-2127936-1-0-1-0-forgemagie-vos-exos-en-moyenne.htm
- **Accessibilité** : **en ligne**. C'est le fil le plus proche d'un « recensement » trouvé.
- **Nature** : nombre de runes consommées jusqu'au succès, déclaratif, sans les échecs abandonnés.
- Chiffres recopiés :
  - Anneau brouce/meulou : **350 runes** (`[Tactical-Nuke]`)
  - Ceinture rasboulaire : **124 runes** ; Anneau meulou : **114 runes** (`SongForJedi`)
  - Anneau glours PA : **~30 runes** (`vegeta76`)
  - Gelano PA/PM : **~15–18 runes** avec de la chance (plusieurs utilisateurs)
  - Gelano PA/PO : **1 rune** (`VinylScratch`)
  - Solo PA : **2 runes** (`[K]akawete`)
  - Un joueur expérimenté : « ma moyenne se stabilise autour de **100** » runes
- ⚠ **Biais de sélection majeur** : on ne déclare que les FM réussies. Le « 100 » du joueur
  expérimenté est le seul chiffre approchant une moyenne non biaisée, et il colle au 1/100.

### 5.2 Forum officiel — « La légende du 1/100 de chance sur les exos » (07/11/2015)
- **URL** : https://www.dofus.com/fr/forum/1103-discussions-generales/2110186-forgemagie-legende-1-100-chance-exos
- **Accessibilité** : **en ligne** (nécessite un navigateur, robots.txt bloque les fetchers)
- Chiffres recopiés (`liberty-64#9704`, l'auteur) :
  - Voile d'encre 9 do, rune GA PA : **100e tentative** atteinte sans succès, **90 M kamas** dépensés
  - Gelano PA/PM passé en **137 runes**
  - Second gelano : arrêt à **15x tentatives** sans succès (faute de moyens)
  - Anneau nobstant PA : arrêt vers **90 tentatives** sans succès
- `Songif#1791` : « Un ami a réussi devant mes yeux **deux exos PA en 3 essais** [...] j'en ai passé
  un en **13 essais** un en **92** »
- `Systeme74#7017` : « C est bien **1/100** [...] tu peux passer **10 exos en 100 tentas** comme
  **0 exo en 500 tentas** »

### 5.3 Forum officiel — « Taux d'echec anormal lors de repassage PA/PM » (20/03/2021)
- **URL** : https://www.dofus.com/fr/forum/1069-dofus/2353788-forgemagie-proposition-explication-taux-echec-anormal-lors-repassage-pa-pm
- **Accessibilité** : **en ligne**
- Chiffres recopiés (`ChargePump#3197`, ~1 an de FM sur tous les items HL) :
  - Repassages PA/PM au 1er confinement : « assez aisément, environ **5 à 10 runes** »
  - Depuis : « je suis environ à **plus de 15 tentatives** de repassages PA/PM sur mes items
    (après utilisation du reliquat) [...] Et encore, en écrivant 15 je suis gentil. »
  - Bottes de la reine des voleurs : « après environ **40 runes PM**, non pas réussi à être FM
    2% exo res (pour les curieux, le coeff. est de **250 %** sur Meria., date 20/03/2021) »
- **Hypothèse formulée (intéressante pour modéliser)** : « Le taux de repassage PA/PM sur les items
  serait-il **exponentiellement lié au rapport entre le poids de l'item lors du repassage PA/PM et
  le poids de l'item total** lors d'une forgemagie exotique dépassant le poids total de l'item. »

### 5.4 Forum officiel — variables influençant le passage (fil « Loi de probabilité », 2017–2023)
- **URL** : https://www.dofus.com/fr/forum/1067-artisanat/2214849-forgemagie-maths-loi-probabilite-passage-runes
- **Accessibilité** : **en ligne**. Contient la meilleure formalisation qualitative du modèle.
- `JohnButlerBlood#4794` (05/01/2023) liste des variables — recopié :
  poids max naturel de l'item, poids min naturel, poids réel (« baisse de probabilité (Ln?) plus il
  est haut ») ; poids max/min/réel **de la ligne** ; « poids max de **101** en over : barrière
  infranchissable » ; reliquat ; poids de la rune ; nombre de lignes.
  Plus : « A priori le taux de Succes Critique **ne passe jamais en dessous de 1%** » et
  « Les runes avec **plus de 50 de poids ont 0 % de chances de faire un Succès Neutre** ».
- `kankhun#3768` (20/03/2023) corrige et précise — recopié :
  « la rune tentee est trop petite (ca commence a merder vers **16 × la valeur de la rune**, et passe
  **20 fois** bon courage) » ; « si la rune tentee est **au dessus de 80 %** de la plage max du jet
  (=malus) » ; « Pour ce qui est du reliquat, ca ne change rien en terme de probabilite, ca vient
  juste amortir tes pertes » ; « La barre des **101** en over (ou exo), c'est un seuil oui, mais pas
  d'autres effet avant le seuil ».
  ★ Mécanisme d'affichage important pour un simulateur : « Si la rune tentee passe en SN, mais fait
  sauter la stat en question en meme temps, tu peux te retrouver avec un cas d'echec neutre. Si tu as
  un EC, mais qu'il n'y a plus assez de stats sur l'item, ca peut aussi devenir un echec neutre. »
- `LPBA` : « le puits permet **seulement d'annuler les probabilités de succès neutre (SN)** ».
- `podompodompom#6940` : « le puits maximal théoriquement atteignable est un puits de **99** »
  (rune de poids 1 faisant sauter une Ga Pa de poids 100).

### 5.5 Forum officiel — « Lien entre probabilité de passage et densité totale » (03/06/2022)
- **URL** : https://www.dofus.com/fr/forum/1782-dofus/2373054-forgemagie-lien-probabilite-passage-rune-densite-total-item
- **Accessibilité** : **en ligne**. **Aucun chiffre** — purement qualitatif.
- `killer-eca66613#5482`, seul apport chiffré : « une rune cha simple passera facilement jusqu'à
  **~30 chance**, pareil pour la pa cha qui passera jusqu'à environ **~70 chance** MAIS ces chances
  de passer sont aussi influencées par la valeur maximale de la ligne. Par exemple, sur un item qui
  va jusqu'à **100 chance**, la pa cha passera plutôt bien jusqu'à **70 voire 80** alors que sur un
  item à **80 chance max**, tu auras plus de mal à aller à 70 avec une pa cha. »

### 5.6 Loi binomiale appliquée au 1 % (Guilde Alterya, 23/05/2012)
- **URL** : https://guildealterya.wordpress.com/2012/05/23/les-maths-et-la-forgemagie/ — **en ligne**
- Chiffres recopiés (p = 1/100) :
  - **100 tentatives → 63 %** de chance d'avoir réussi **au moins 1** exo
  - **69 tentatives → ~50 %**
  - **500 tentatives → ~99 %**
  - Rappel méthodo : calculer **1 − P(X=0)**, pas P(X=1).

---

## §6 — LE PROJET DE DATASET QUI N'A JAMAIS ABOUTI (mais dont le schéma est utile)

- **URL** : https://www.dofus.com/fr/forum/1003-divers/2333498-forgemagie-machine-learning
- **Auteur** : `Issiraaa#5196`, 02/06/2020. **Accessibilité : en ligne.**
- Objectif recopié : « il faut un "dataset" (un jeu de données). C'est là que j'ai besoin d'aide !
  [...] pour que l'apprentissage se fasse correctement, ce dataset doit être énorme
  (**~30'000 entrées** serait un bon début). À quoi ressemble un dataset ? c'est un tableau excel »
- ★ **Schéma de features proposé — à reprendre tel quel pour la collecte du simulateur** :
  - Poids minimal (somme des poids des stats de l'objet à son jet naturel le plus bas)
  - Poids maximal (somme des poids des stats à son jet naturel le plus haut)
  - Poids actuel (somme des poids des stats de l'objet courant avant passage)
  - Poids de la rune tentée
  - « La rune respecte-t-elle la condition icosagonale ? (n'est pas 19 fois inférieure à la stat courante) »
  - Jet minimum / jet courant / jet maximum de la stat concernée
- Les deux voies envisagées (dataset fourni par Ankama ; template Excel rempli par les joueurs) ont
  été jugées « très compliquées et peu réalisables » par l'auteur lui-même. **Aucun fichier produit.**

---

## §7 — DISCORD & COMMUNAUTÉS (contenu non indexé — piste à explorer manuellement)

Les serveurs Discord sont **la piste la plus prometteuse restante** : c'est là que se trouvent
aujourd'hui les forgemages actifs et d'éventuels relevés partagés en pièce jointe.

| Serveur | Lien d'invitation (public) | Notes |
|---|---|---|
| Forgemage.net | https://discord.com/invite/SyF9bmSK3f | Adossé à https://forgemage.net/ (200+ utilisateurs, 70+ forgemages, note 4,0/5, 1 avis). Marketplace FM pour Dofus 3, import de builds DofusBook, overlay « Blitzkrieg » calculant les coûts en temps réel. |
| « La forgemagie c'est la vie » | https://discord.com/invite/dDFN2F9 | Serveur dédié FM |
| Dofus 3 (généraliste) | https://discord.com/invite/dofus-3-1255519861275230280 | Gros serveur généraliste |
| DofusFM (bot Vicfou) | https://discord.gg/GRV3hBcSr8 | Voir §7bis |
| Discord FM Jahash & Ilyzaelle | https://forums.jeuxonline.info/sujet/1415053/... | 1000+ membres. **Page JOL renvoie HTTP 402** — lien d'invitation non récupérable. |

### §7bis — Bots de FM qui LOGUENT des tentatives (source de données potentielle inexploitée)
- **Vicfou-dev/dofus-fm-server** — https://github.com/Vicfou-dev/dofus-fm-server — **en ligne**
  Le README annonce : « **Statistiques détaillées — Nombre de runes dépensées, coût par exo,
  historique complet des tentatives.** »
  ⚠ **Aucun dataset publié** : le dépôt ne contient qu'un README et une image. Et le projet affirme
  « Le code est local. L'outil ne stocke pas tes données de jeu, ne parle pas à des serveurs tiers. »
  → Les logs existent **chez chaque utilisateur**. Demander sur leur Discord est la meilleure voie
  pour obtenir de vraies données brutes à grand volume.
- **ExoFast** — https://www.exofast.dev/ — bot de FM commercial, même logique.

---

## §8 — OUTILS & SIMULATEURS EXISTANTS (pour comparer un modèle)

| Outil | URL | Données exposées ? |
|---|---|---|
| lilgallon/dofus-tools | https://github.com/lilgallon/dofus-tools | ★ **Oui** — table de 92 runes extraite des serveurs (§3.1) + scripts Python `py/download_all_runes` et `py/retrieve_runes_list`. Le JS ne fait que de l'arithmétique de puits, **aucune formule de probabilité**. |
| Papycha — taux de brisage | https://papycha.fr/taux-de-brisage/ | Formule de brisage dépendant de LVL, poids de ligne (Stat × Poids_unitaire), PoidRune, Coeff. **Validation chiffrée recopiée** : « Sur l'échantillon utilisé le calculateur donne un résultat **faux 34 fois sur 200 tentatives**, avec une **erreur max de 7 %** » ; une ligne à ~**45 %** d'erreur. Méthode : « récupération manuelle de données, prises d'hypothèse et ajustements ». ⚠ « ARTICLE EN COURS DE REDACTION ». |
| geneka.net | https://geneka.net/forgemagie | Monte-Carlo **5 000 runs**, sorties P10/P50/P90, proba de rentabilité, conso moyenne par rune. **Aucune source ni taux publiés.** |
| ForgeMagix (itch.io) | https://lightcroft.itch.io/forgemagiedofus | Simule poids, puits, over, exo, échecs. **Aucune valeur numérique publiée.** |
| Xixou calculateur Rétro | https://xixou.io/forgemagie/ | Rétro 1.49 uniquement |
| Dofus Fashionista | https://dofusfashionista.gg/fr/dofus2/forgemagie/ | Atelier FM Dofus 2 |
| hoboris/EasyFM | https://github.com/hoboris/EasyFM | **HORS LIGNE / 404** au 2026-09-09 (dépôt supprimé ou renommé). À chercher en archive. |

---

## §9 — PISTES NON ABOUTIES / À REPRENDRE MANUELLEMENT

1. **web.archive.org** — inaccessible depuis cet environnement. À refaire à la main pour :
   `dofus-forgemagie.com`, `hoboris/EasyFM`, les anciens DevBlogs Ankama 1.27 (source primaire des
   triplets SC/N/EC du §2, qui trancherait la divergence 43/50/7 vs 34/50/16).
2. **DevBlog Ankama original 1.27** — introuvable en ligne. C'est la donnée la plus précieuse.
3. **Vidéo Fek 1 000 tentatives** (gs0FnGupFQY) — chiffres à relever en visionnant.
4. **Discords FM** (§7) — non consultables sans rejoindre ; probablement le seul endroit où
   quelqu'un a un export de logs de bot exploitable.
5. **Reddit r/Dofus / r/DofusFR** — aucun post avec données chiffrées trouvé (plusieurs requêtes FR
   et EN). La communauté FM francophone n'utilise pas Reddit.
6. **Imps Village / DofusBook** — aucune étude statistique FM trouvée.

---

## §10 — RÉSUMÉ DES PARAMÈTRES EXPLOITABLES POUR LE SIMULATEUR

| Paramètre | Valeur retenue | Confiance | Source |
|---|---|---|---|
| Taux exo PA/PM/PO (SC) | **1 %** | ★★★ | Ankama + 111/10 000 mesuré (IC95 [0,905 ; 1,315] %) |
| SN lors d'un exo PA/PM/PO | **0 %** | ★★★ | Ankama (1/0/99), Helleria, kankhun |
| EC lors d'un exo PA/PM/PO | **99 %** | ★★★ | idem |
| Meilleur cas (bonus simple) | SC 66 / N 34 / EC 0 | ★★☆ | DevBlog 1.27 via 2 relais concordants |
| Jet parfait, objet simple | SC 43/N 50/EC 7 **ou** SC 34/N 50/EC 16 | ★☆☆ | **relais divergents** |
| Cas « minimum » (hors exo) | SC 15 / N 50 / EC 35 | ★☆☆ | Alterya seul |
| Plafond over/exo par ligne | **101** de poids | ★★★ | 5 sources concordantes |
| Puits max théorique | **99** | ★★☆ | podompodompom (raisonnement, non mesuré) |
| Effet du puits | annule le SN, n'augmente pas le SC | ★★☆ | LPBA + kankhun (concordants, non mesuré) |
| Seuil de rune « trop petite » | dégradation vers **16×** la valeur de la rune, très dur à **20×** | ★★☆ | kankhun (empirique) |
| Malus si rune > 80 % du jet max de la ligne | oui | ★☆☆ | kankhun (empirique) |
| Nb moyen de tentatives pour un exo | **90 ± 88,5** si p=1/90 ; **100** si p=1/100 | ★★★ | loi géométrique (Karias) |
| P(≥1 exo en n essais) | 1 − 0,99^n ; n=69 → 50 % ; n=100 → 63 % ; n=500 → 99 % | ★★★ | Guilde Alterya |
| Poids des runes | `data/runes_weights_lilgallon.csv` (92 runes) | ★★★ | extraction serveurs Dofus |

---

## FICHIERS TÉLÉCHARGÉS

- `/home/claude/fm-research/data/runes_weights_lilgallon.csv` — 92 runes (rune, catégorie, poids)
- `/home/claude/fm-research/data/runes_weights_lilgallon.txt` — même table, groupée par catégorie
- `/home/claude/fm-research/data/lilgallon_runes.js` — source brute (serveurs Dofus)
- `/home/claude/fm-research/data/lilgallon_forgemagie.js` — logique puits (arithmétique seulement)
- `/home/claude/fm-research/data/lilgallon_runecomplete.js` — source brute complémentaire
