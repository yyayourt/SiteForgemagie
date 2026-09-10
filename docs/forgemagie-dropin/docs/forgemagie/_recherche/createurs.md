# Forgemagie DOFUS — Créateurs de contenu, données chiffrées & outils
Recherche effectuée le 2026-09-09. Cible : alimenter un simulateur FM local (taux de passage des runes).

> **AVERTISSEMENT MÉTHODO — lire avant d'exploiter les chiffres**
> 1. **YouTube inaccessible depuis cette session.** Toutes les pages `youtube.com/watch` renvoient **HTTP 429**, `youtube.com/results` est bloqué par robots.txt, les frontends alternatifs (yewtu.be) idem, et playboard.co renvoie 453. **Aucune description ni transcription vidéo n'a pu être récupérée.** Les vidéos ci-dessous sont listées avec leur URL + titre (issus des résultats de recherche) mais **le nom de la chaîne n'est pas confirmé** — à vérifier manuellement.
> 2. **Les tableaux de poids diffèrent selon les sources** parce qu'ils mélangent deux conventions : *poids par POINT de stat* vs *poids par RUNE*. Voir §4.1. C'est le piège n°1 pour un simulateur.
> 3. Les « taux » empiriques (§4.3) sont des **estimations de joueurs**, pas des valeurs extraites du client. Seules les valeurs §4.2 sont attribuées à un devblog Ankama (via citation tierce, devblog original non retrouvé).

---

## 1. Créateurs / auteurs identifiés avec données chiffrées

| Auteur / pseudo | Plateforme & URL | Contenu FM | Données chiffrées apportées | Liens externes cités |
|---|---|---|---|---|
| **Shatofu ft. Fipop** | Blog Alterya — https://alterya.over-blog.com/article-la-forgemagie-103398969.html (14/04/2012) | « Le Guide Forgemagie d'Alterya » | ⭐ **Le plus important** : reproduit les tables de probabilités d'un **DevBlog Ankama** (SC/N/EC) — voir §4.2. Poids max ligne over/exo = 101. Taux exo min = 1 % immuable. | forgemagie.net (site d'Exited), forums JeuxOnLine |
| **Pro-Vise** | Blog Alterya — https://alterya.over-blog.com/2017/11/tout-sur-la-forgemagie-en-1.29.html (16/11/2017) | « Tout sur la Forgemagie en 1.29 » | Poids **unitaires par point** (Vi 0,25 / Sa 3 / Ini 0,1 / Ine 1 / Cri 30). Limite = 101 ÷ poids unitaire → Vi 404, Sa 33, Ine 101, Ini 1010. Formule puits. **Courbe de dégression empirique** (§4.3). **Pertes par arrondi** : Vi 25 %, Pa Vi 17 %, Ra Vi 6 %. | Twitch : `ProTeamSurTwiitch` · In-game : Pro-Vise |
| **tuungalterya** | Guilde Alterya — https://guildealterya.wordpress.com/2012/05/23/les-maths-et-la-forgemagie/ | « Les maths et la forgemagie » | Loi binomiale appliquée à l'exo. p = **1/100**. Au moins 1 succès : **100 essais → ~63 %**, **69 essais → ~50 %**, **500 essais → ~99 %**. | Wikipedia loi binomiale / combinaisons |
| **Fahrell** | Blog Helleria — https://helleria.wordpress.com/about/forgemagie/les-bases/ et `/overmax-et-exotique/` (06/03/2013) | Série FM structurée (Les Bases / Overmax et Exotique) | Table poids PA/RA/RL complète. Exo PA/PM/PO = **1/100**, « ~100 remontages en moyenne ». **Pas de succès neutre lors d'un passage exo.** Tableau des limites overmax (§4.4). Seuil rune = **20–25× le poids**. | ⭐ http://www.forgemagie.net/wiki (Exited) · une vidéo YouTube intégrée (`HD9s0Bpn-6g`) |
| **North** | JeuxOnLine — https://dofus.jeuxonline.info/article/235/forgemagie (maj 02/08/2016) | Article de référence FM | ⭐ Table **puissance + poids** par rune (Vi +5→1, Pa Vi +15→3, Ra Vi +50→10, Do +1→20, Po +1→50, Ga Pme→90, Ga Pa→100…). **Table des taux d'obtention de runes Ra par jet d'objet** (§4.5). Table XP métier par poids de rune. **Ordre d'attaque des pertes** (§4.6). | ExiTeD — simulateur forgemagie.net · Easy FM · Atelier de Bilbo le Wabbit (JOL) |
| **Abyna, Naio'** | JeuxOnLine — https://dofus.jeuxonline.info/article/3736/forgemagie (maj 21/09/2017) | Article FM | Définitions SC/SN/EC. Puits invisible ≈ poids grosse rune − poids petite rune posée. Invo=30, Po=51. | — |
| **Exited / ExiTeD** | forgemagie.net (⚠️ **hors ligne / robots.txt KO**) | Wiki FM + simulateur de probabilités historique | **Source canonique du tableau de poids** repris par presque tous les blogs FR. | Repris par Honoris : https://adhonorem.over-blog.com/2018/02/voici-le-poids-des-runes-ce-tableau-provient-de-forgemagie-net-d-exited... |
| **Aka** (+ @Florelsssan) | Gamosaurus — https://www.gamosaurus.com/jeux/dofus/forgemagie-le-guide-complet-dofus (17/02/2022, maj 09/07/2023) | Guide complet FM | Règle **« effet × 20 = palier suivant »** (Fo 1×20=20 → Pa Fo ; Pa Fo 3×20=60 → Ra Fo). Exo PA/PM/PO = **1 %**. Runes Transcendance = **100 % garanti**. Over Vi 505. | https://twitter.com/Florelsssan |
| **Dafous** | https://dafous.app/guides/poids-runes-fm.html | Guide FM 2026 (Dofus 3) | ⭐ Table **poids unitaire + over max** la plus à jour (§4.1c). Taux exo **1 % fixe, indépendant du niveau métier**. Données éco : marge 290 k–870 k kamas/item (sem. 17–23 mars 2026), budget 8–12 % de la valeur de revente, **50 tentatives exo max par lot**. | Simulateur de crafts, Marketplace, Build Generator, Tracker Ocre (internes). Pas de Discord. |
| **Huzounet** | https://huzounet.fr/guides/forgemagie | Guide FM (mode online) | Densités 1 / 3 / 10. 1 RA = 3 PA = 9 mineures. Cap **101 densité/stat**. Formule focus brisage : `densité focus = densité stat focus + (densité autres / 2)`. Exemple reliquat 30−3=27. | — |
| **Kaikina** | https://forgemage.tom-girou.dev/ (forgemage.net) | Plateforme de mise en relation forgemages + overlay **Blitzkrieg** (calcul du coût FM en direct) | Pas de formules publiées, mais **communauté active** = piste pour données brutes. | GitHub https://github.com/kaikina · **Discord https://discord.gg/SyF9bmSK3f** · X https://x.com/forgemage_com |
| **Inkybot** | https://inkybot.me/ + article technique https://medium.com/@inkybot.me/building-inkybot-a-dofus-maging-bot-with-ocr-win32-api-and-a-rule-based-ai-212d4bb2611d | Bot FM (OCR + Win32 + IA à règles) | ⭐ **Heuristique cœur** : `TargetResolve` trie les stats **par distance à leur max, la plus éloignée d'abord — « car leur taux de réussite est supérieur »**. Ordre Grande→Moyenne→Petite rune. Perf ~2 runes/s. Gestion explicite de la contrainte *oversink*. | Medium, site inkybot.me |
| **Vicfou-dev** (2 joueurs) | https://github.com/Vicfou-dev/dofus-fm-server · https://web.dofus-fm.cloud/ | Bot FM Dofus 3 (exos PA/PM/PO/Invo) | **Volume : 12 000+ exos réalisés.** Stats détaillées par utilisateur (runes dépensées, coût/exo, historique complet des tentatives) → **base de données empirique existante**. | **Discord https://discord.gg/GRV3hBcSr8** · guide https://web.dofus-fm.cloud/fr/guide |
| **Lilian Gallon (N3RO)** | https://github.com/lilgallon/dofus-tools · https://gallon.dev/dofus-tools/forgemagie.html | Calculateur de puits | ⭐ **Dataset exploitable directement** : `js/runes.js` = **95 runes** avec poids, scrapées des serveurs Dofus (scripts `py/download_all_runes`, `py/retrieve_runes_list`). Algo puits = `poids(rune sautée) − poids(rune posée)`. | GitHub |
| **Xixou** | https://xixou.io/forgemagie/ · https://xixou.io/les-outils/ | Calculateur FM **Dofus Rétro** | 18 poids de stats : PA 100, PM 90, Do 20, **Vi 0,2**, Ini 0,1. `Puits = Perdu − Rune`. Exo ~1 %. Budget pratique 10–30 runes. | https://xixou.io/rentabilite/ (calculateur de brisage) |
| **Geneka** | https://geneka.net/forgemagie | ⭐ **Simulateur de rentabilité FM Dofus 3 en Monte-Carlo** | **5 000 runs simulés**. Sortie : distribution de profit **P10/P50/P90**, proba de rentabilité, conso moyenne de runes. Modèle : `cible = densité × runes nécessaires`, **cap 101/stat**. Taxe HDV **2,0 %**. | — (formules internes non publiées) |
| **Dofus pour les Noobs** | https://www.dofuspourlesnoobs.com/guide-forgemagie.html | Guide FM | Table poids + PA/RA + **Over Max** par ligne (Vi 2/3/10 over 505 ; Sa 3/9/30 over 33 ; Do 20 over 5 ; Ré Per 6 over 16 ; Ini 1/3/10 over 1010 ; Pod 2,5/7,5/25 over 404). | — |
| **Tofus** | https://www.tofus.fr/fiches/forgemagie | Fiche FM | Bonus par palier (base 1 / PA 3 / RA 10 ; Vi 5/15/50 ; Ini 10/30/100). **Poids des MALUS ≠ poids des bonus** (ex. Vi malus 0,6 vs bonus 0,75) — détail rarement mentionné, important pour simuler les pertes. | — |
| **Wiki-Dofus** | https://wiki-dofus.eu/w/Forgemagie | Wiki | Malus « lorsqu'on tente une carac équivalente à **20× le poids d'une rune** ». Fusion 10 normales→1 PA, 10 PA→1 RA (⚠️ contredit Huzounet qui dit 3). Potions élément : niv1 50 %/50 %, niv2 65 %/35 %, niv3 80 %/20 %. | — |
| **Guilde/blogs secondaires** | Sacri-Flex https://sacriflex.wordpress.com/2016/08/21/forgemagie/ · Honoris https://adhonorem.over-blog.com/ · console-retro.net · rezoactif.com · dofastuces.fr (tableau en **image** : `dofastuces.fr/medias/images/tableau-poids-des-runes.jpg`) | Reprises du tableau Exited | Redondants — utiles seulement pour recoupement. | — |

---

## 2. Vidéos YouTube repérées (⚠️ chaînes NON confirmées — 429 sur toutes les pages)

Les plus prometteuses pour des données chiffrées / outils en description :

| Titre | URL | Pourquoi |
|---|---|---|
| **TUTO FM \| FONCTIONNEMENT & EXPLOITATION DU PUITS — DOFUS** | https://www.youtube.com/watch?v=esLjYF1rCvY | ⭐ Le plus technique : mécanique du puits |
| **TenTatives Exos PA et PM De Fou ! — FORGEMAGIE** | https://www.youtube.com/watch?v=WkgOVwWlBXw | ⭐ Session de tentatives = données de volume |
| **Des MILLIONS de KAMAS GRÂCE à CET OUTIL FORGEMAGIE** | https://www.youtube.com/watch?v=WCs1_XUs0mA | ⭐ Décrit un **outil FM** — description = lien vers l'outil |
| Le GUIDE de FORGEMAGIE pour DOFUS 3 | https://www.youtube.com/watch?v=xgzAVrRc6K8 | Guide à jour Dofus 3 |
| DOFUS 3 : DEVIENS MAÎTRE de la FORGEMAGIE (guide complet) | https://www.youtube.com/watch?v=bAnPWylMUBE | Guide complet |
| GUIDE COMPLET de la FORGEMAGIE sur DOFUS | https://www.youtube.com/watch?v=LIHRzH27Cgk | Guide complet |
| Le MEILLEUR TUTO pour comprendre la Forgemagie | https://www.youtube.com/watch?v=ysfiwEAlVPw | Pédagogique |
| Forgemagie DOFUS Touch ⚒️ Guide Ultime : Exo, Over et Kamas | https://www.youtube.com/watch?v=PZ7LZU-S24s | Exo + over |
| FM EXO % \| Session Kamas par la FM | https://www.youtube.com/watch?v=cLKDKNNnleM | Session live |
| Forgemagie expliquée : Méthode pour FM efficacement (Touch 2025) | https://www.youtube.com/watch?v=YPpzKbc8xqw | Méthode |
| TUTO FORGEMAGIE : LE GUIDE COMPLET — DOFUS TOUCH 2026 | https://www.youtube.com/watch?v=C2hLbTgn2lY | À jour |
| Guide débutant forgemagie DOFUS 3 unity | https://www.youtube.com/watch?v=nH1QiJLprxc | Débutant |
| -Dofus- GUIDE COMPLET FORGEMAGIE | https://www.youtube.com/watch?v=J7HB9-Sligo | Guide |
| LES BASES DE LA FORGEMAGIE [RE-UPLOAD] | https://www.youtube.com/watch?v=1UyRb3URhfk | Bases |
| Tuto Forgemagie en 4 Minutes (2023) | https://www.youtube.com/watch?v=TlcRnoZBmg8 | Condensé |
| LA FORGEMAGIE pour les noobs : des MILLIONS de kamas | https://www.youtube.com/watch?v=cyH_XHaWV-s | Rentabilité |
| UN EXO PA ULTRA FAST 🤑 (short) | https://www.youtube.com/watch?v=HxsL8_4vLf4 | Exo PA |
| TUTO FORGEMAGIE : Faire des MILLIARDS de KAMAS | https://www.youtube.com/watch?v=r819h6iFCy0 | Rentabilité |
| Dofus 1.29 : TUTO Forgemagie | https://www.youtube.com/watch?v=GXjMGG3fXBQ | Rétro |
| DOFUS RETRO : TEST MAJ 1.31 + NOUVELLE FORGEMAGIE | https://www.youtube.com/watch?v=pNQSXhcqgeg | Rétro 1.31 |
| Dofus Forgemagie Tool | https://www.youtube.com/watch?v=6xyoEc_5ubs | Démo d'outil |
| (vidéo intégrée par Fahrell/Helleria) | https://www.youtube.com/watch?v=HD9s0Bpn-6g | Liée au wiki d'Exited |

**Playlists dédiées FM :**
- `https://www.youtube.com/playlist?list=PL-lvDBELoTErNHYjvGluBSSZcjAnCZeOS` — « FORGEMAGIE \| DOFUS »
- `https://www.youtube.com/playlist?list=PLAXH4KqjWw__PYKXtqSwVeVWvOs5KSWja` — « La trilogie des tuto Forgemagie (DOFUS) »

**Pour débloquer ces vidéos toi-même** (à faire hors de cette session) :
```bash
pip install yt-dlp
# description + métadonnées + chaîne
yt-dlp --skip-download --write-info-json --write-description "https://www.youtube.com/watch?v=esLjYF1rCvY"
# transcription FR (auto ou manuelle)
yt-dlp --skip-download --write-auto-subs --write-subs --sub-langs "fr.*" --convert-subs srt "URL"
# toute une playlist d'un coup
yt-dlp --flat-playlist --print "%(channel)s | %(title)s | %(url)s" "PLAYLIST_URL"
```

---

## 3. X / Twitter
Recherche peu fructueuse (nitter/xcancel non joignables, `site:twitter.com` ne renvoie rien de pertinent). Comptes repérés indirectement :
- **@forgemage_com** — https://x.com/forgemage_com (plateforme de Kaikina, communauté de forgemages)
- **@Florelsssan** — https://twitter.com/Florelsssan (collaborateur du guide FM Gamosaurus)
- **@ibendouma** — compte de marque, contenu FM générique

➡️ **Les Discords sont une bien meilleure piste que X** pour des données brutes : `discord.gg/SyF9bmSK3f` (forgemage.net) et `discord.gg/GRV3hBcSr8` (DofusFM, 12 000+ exos loggés).

---

## 4. Synthèse des données exploitables pour le simulateur

### 4.1 Poids des runes — ⚠️ trois conventions incompatibles

**(a) Poids par RUNE** — dataset le plus complet et le plus fiable, scrapé des serveurs Dofus :
`https://raw.githubusercontent.com/lilgallon/dofus-tools/master/js/runes.js` → **95 runes** (sauvegardé en local, voir §5).
Extraits : Ga Pa 100 · Ga Pme 90 · Invo 30 · Ra Sa 30 · Do 20 · Ra Pui 20 · Ra Pi Per 20 · Do Per (Ar/Di/Mé/So) 15 · Ré Per Di 15 · Ré Per Mé 15 · Cri 10 · Do Ren 10 · So 10 · Ra Cha/Fo/Ine/Ini/Vi 10 · Ré Pa/Pme 7 · Ret Pa/Pme 7 · Ré Per (élém.) 6 · Do (élém.) 5 · Do Cri 5 · Do Pou 5 · Tac 4 · Fui 4 · Sa 3 · Pa (élém.) 3 · Ré (élém.) 2 · Ré Cri/Pou 2 · Age/Cha/Fo/Ine/Ini/Vi 1 · **Rune de chasse −1**.

**(b) Poids par RUNE avec puissance associée** (North / JOL) : Vi **+5** → poids 1 · Pa Vi **+15** → 3 · Ra Vi **+50** → 10 · Sa **+1** → 3 · Ini **+10** → 1 · Do **+1** → 20 · Po **+1** → 50 · Ga Pme **+1** → 90 · Ga Pa **+1** → 100 · Signature → 0 · Chasse → 5.

**(c) Poids par POINT de stat** (dafous.app, Dofus 3 / 2026) — avec l'over max dérivé de 101 :
| Stat | Poids unitaire | Over max |
|---|---|---|
| Ga PA | 100 | 1 |
| Ga PM | 90 | 1 |
| Portée | 51 | 1 |
| Invocation | 30 | 3 |
| Dommage | 20 | 5 |
| Do spécialisé | 15 | 6 |
| Soin / Critique / Renvoi | 10 | 10 / 10 / 20 |
| Retrait & Esquive PA/PM | 7 | 14 |
| Résistance % | 6 | 16 |
| Do élémental | 5 | 20 |
| Fo / Ine / Cha / Age | 1 | 101 |
| Vitalité | 0,25 | 404 |
| Initiative | 0,1 | 1010 |

➡️ **Choisis UNE convention et convertis tout le reste.** `poids_rune = poids_unitaire × puissance_rune` réconcilie (b) et (c) — vérifie : Vi 0,25 × 5 = 1,25 (≈1) ; Ini 0,1 × 10 = 1 ✅ ; Sa 3 × 1 = 3 ✅ ; Do 20 × 1 = 20 ✅.
⚠️ Divergences résiduelles à trancher : Vi (0,2 / 0,25 / 0,75 / 1 / 2 selon la source et la version), Cri (10 en 2.0 vs 30 en 1.29), Po (50 vs 51), Ré élém. (2 vs 4 vs 5).

### 4.2 Enveloppe de probabilités SC / N / EC — ⭐ le cœur du modèle
Valeurs attribuées à un **DevBlog Ankama**, citées par Shatofu/Fipop (Alterya) :

| Situation | SC | N (neutre) | EC |
|---|---|---|---|
| Meilleures probas atteignables (bonus simples) | **66 %** | **34 %** | **0 %** |
| Meilleures probas pour un jet parfait | **43 %** | **50 %** | **7 %** |
| Probabilités **minimum** | **15 %** | **50 %** | **35 %** |
| Création d'effet **exo** | **1 %** | **0 %** | **99 %** |

➡️ Lecture pour un simulateur : la proba n'est **pas** libre, elle glisse entre un plancher (15/50/35) et un plafond (66/34/0) en fonction du **remplissage de la ligne visée** (distance au max). L'exo est un cas particulier **hors courbe** : 1 % fixe, **jamais de succès neutre** (Fahrell), donc 99 % d'EC.

### 4.3 Courbe de dégression empirique (Pro-Vise, item 40 sagesse max)
| Progression sur la ligne | Taux de réussite observé |
|---|---|
| 0 → 20 pts | ~99 % |
| 20 → 30 pts | ~95 % |
| 30 → 35 pts | ~90 % |
| 35 pts et + | dégression drastique, échecs en chaîne |

**Règle du « ×20 »** (confirmée indépendamment par Wiki-Dofus, Gamosaurus, Tofus, Helleria) : une rune reste efficace jusqu'à **~20× (Fahrell : 20–25×) la valeur de stat qu'elle apporte** ; au-delà, passer au palier supérieur.
Exemples : Fo 1×20 = 20 → passer Pa Fo ; Pa Fo 3×20 = 60 → passer Ra Fo ; Vi (3 vita) → ~60 vita ; Pa Vi (10 vita) → ~200 vita.

**Cohérence Inkybot** : le bot trie les stats **par distance au max décroissante** parce que « les stats les plus éloignées de leur plafond ont un taux de réussite supérieur » → confirme que `P(succès) = f(remplissage de la ligne)`.

### 4.4 Overmax / exotique
- Plafond dur : **101 de poids par ligne de stat**.
- Limites dérivées (`101 ÷ poids unitaire`) : Vi **404** (ou 505 selon la convention Vi), Fo/Ine/Cha/Age **101**, Sa/Prospe **33**, Ini **1010**, Pui **50**, Do élém. **20**, Ré % **16**, Cri **3–10**, PA/PM/PO **1**.
- Exo PA/PM/PO : **1 % fixe**, **indépendant du niveau de métier** (dafous.app).
- Espérance : **~100 remontages** par exo. Binomiale : 69 essais → 50 %, 100 → 63 %, 500 → 99 %.
- **Runes de Transcendance : 100 % garanti** (mécanique récente, à modéliser à part).

### 4.5 Taux d'obtention de runes Ra au brisage, par jet de l'objet (North / JOL)
| Jet objet | ≤23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | ≥35 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| % Ra | 0 | 8 | 20 | 31 | 41 | 50 | 59 | 67 | 74 | 81 | 88 | 94 | 100 |

### 4.6 Puits (reliquat) — mécanique
- `Puits = poids de la rune/stat perdue − poids de la rune posée` (ex. Do 20 cassé par Vi 1 → puits 19 ; Invo 30 cassé par Pa Ine 3 → puits 27 ; Sa 3 faisant sauter Do 20 → puits 17).
- Le puits **absorbe** les pertes des SN/EC suivants jusqu'à épuisement → passages « gratuits ».
- **Ordre d'attaque des pertes** (North) : **1)** puits invisible → **2)** overmax & runages exotiques → **3)** jets standards (poids égal en priorité).
- Le puits est **réinitialisé** si l'objet est banqué, équipé, échangé ou mis en vente.
- ⚠️ **Les poids des MALUS diffèrent des poids des bonus** (Tofus : Vi malus 0,6 vs bonus 0,75) — impacte le calcul des pertes.

### 4.7 Pertes par arrondi (Pro-Vise) — optimisation
Vi simple 0,75 → arrondi à 1 = **−25 %** · Pa Vi 2,5 → 3 = **−17 %** · Ra Vi 7,5 → 8 = **−6 %**.
➡️ Pour l'optimisation pure de la Vitalité, n'utiliser que des **Ra Vi**.

### 4.8 Économie (calibration de la fonction de coût)
- Marge par item : **290 k – 870 k kamas** (dafous.app, sem. 17–23 mars 2026).
- Budget FM recommandé : **8–12 %** de la valeur de revente cible ; **50 tentatives exo max par lot**.
- Taxe HDV : **2,0 %** (Geneka).
- Budget pratique Rétro : **10–30 runes** par item (Xixou).

---

## 5. Outils FM en ligne / logiciels (sources d'algorithme)

| Outil | URL | Intérêt algorithmique |
|---|---|---|
| ⭐ **dofus-tools** (L. Gallon / N3RO) | https://github.com/lilgallon/dofus-tools · https://gallon.dev/dofus-tools/forgemagie.html | **Open source.** `js/runes.js` = 95 runes + poids. Scripts Python de scraping des runes depuis les serveurs Dofus. Algo puits complet. |
| ⭐ **Geneka — Simulation FM** | https://geneka.net/forgemagie | **Monte-Carlo 5 000 runs**, P10/P50/P90, proba de rentabilité, cap 101/stat, taxe 2 %. Le plus proche de ce que tu construis. |
| ⭐ **Inkybot** | https://inkybot.me/ + article Medium | Logique de sélection de runes documentée (tri par distance au max, contrainte oversink). |
| **DofusFM** (Vicfou-dev) | https://github.com/Vicfou-dev/dofus-fm-server · https://web.dofus-fm.cloud/ | 12 000+ exos loggés ; stats runes/coût/historique. Discord = source de données brutes. |
| **ExoFast** | https://www.exofast.dev/ | Bot FM |
| **Xixou — Calculateur FM Rétro** | https://xixou.io/forgemagie/ (+ /rentabilite/, /calculateurs/, /les-outils/) | Poids Rétro + calcul du puits |
| **Retro Toolbox** | https://retro-toolbox.fr/outils/ | Calculateurs Rétro |
| **Dofus Fashionista — Atelier de Forgemagie** | https://dofusfashionista.gg/fr/dofus2/forgemagie/ | Atelier FM Dofus 2 |
| **CalculatricePro — Calculateur FM** | https://calculatricepro.com/amusement-et-divertissement/calculateur-fm-dofus.html | Runes & Over FM |
| **ForgeMagix** | https://lightcroft.itch.io/forgemagiedofus | Simulation de forgemagie (itch.io) |
| **Blitzkrieg** (overlay, Kaikina) | via https://forgemage.tom-girou.dev/ | Calcul du coût FM en direct |
| **forgemagie.net** (Exited) | ⚠️ hors ligne | Wiki + simulateur de probabilités historique — **la source d'origine** de tous les tableaux FR |
| **EasyFM** (hoboris) | https://github.com/hoboris/EasyFM ⚠️ **404** | Module de simulation FM ; encore cité partout |
| **Magic'Forgemagie Tool** | https://shadowlabs.eklablog.fr/le-projet-magic-forgemagie-tool-pour-dofus-p526967 | Projet ancien |
| **dafous.app** | https://dafous.app/ | Simulateur de crafts, marketplace, build generator |

---

## 6. Sources bloquées (à retenter depuis un autre réseau)
- **`youtube.com`** — 429 systématique (descriptions + transcriptions ⇒ utiliser `yt-dlp` en local, §2)
- **`www.dofus.com/fr/forum/...`** — robots.txt / 403. Fils à haute valeur :
  - `2373054-forgemagie-lien-probabilite-passage-rune-densite-total-item` ⭐ (proba de passage ↔ densité totale de l'item)
  - `2315861-ankama-avez-change-taux-reussite-forgemagie`
  - `2326160-taux-reussite-influence-niveau-metier-forgemagie`
  - `2338803-fm-connaissiez-regle-fm`
  - `2348873-over-101-max-item-passe-fail`
- **`forums.jeuxonline.info`** — 402. Fil clé : `/sujet/1408051/taux-de-repassage-des-runes` ⭐ (taux de repassage empiriques)
- **`web.archive.org`** — 403 (empêche de récupérer forgemagie.net d'Exited)
- **`astra-dofus.fandom.com`**, **`playboard.co`**, **`api.github.com/search`** — bloqués

---

## 7. Prochaines actions recommandées
1. **`yt-dlp`** sur les 3 vidéos ⭐ de §2 + les 2 playlists → descriptions (liens Sheets/Discord/outils) + transcriptions FR.
2. **Rejoindre les 2 Discords** (forgemage.net, DofusFM) : demander les logs agrégés — DofusFM a 12 000+ exos horodatés, c'est le plus gros jeu de données empiriques identifié.
3. **Retenter les fils dofus.com + JOL** depuis un réseau non filtré (surtout `2373054` et `1408051`).
4. **Lire le code de Geneka** (`geneka.net/forgemagie`, JS côté client) → sa fonction de proba est probablement lisible dans le bundle.
5. **Calibrer** le simulateur sur l'enveloppe §4.2 (plancher 15/50/35 → plafond 66/34/0) modulée par le taux de remplissage de la ligne, avec l'exo traité à part (1 % / 0 % / 99 %).
