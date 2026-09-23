# Fiche de faits sourcés — page « Savoir » (2026-09-23)

Seule source de contenu autorisée pour la refonte de la page « Savoir »
(`docs/superpowers/specs/2026-09-23-savoir-refonte-design.md`). Aucune formule, valeur ou
exemple n'est ajouté ici : tout vient des fichiers cités. Version de jeu de référence :
DOFUS 3 / Unity, client 3.6.10.11 (`empirical_params.json:4`), sauf mention contraire.

**Abréviations de citation**
- `EP` = `empirical_params.json` ; un chemin de paramètre (`params.x.y`, `densities.N`) renvoie à ce fichier.
- `K/` = `docs/knowledge/` ; `ERR` = `docs/knowledge/errata.md` ; `ANA` = `docs/knowledge/2026-09-23-analyse-simulateur.md` ;
  `EXO` = `docs/knowledge/2026-09-14-exo-leger.md` ; `ARB` = `docs/knowledge/arbitrages-2026-09-10.md` ;
  `S1` = `docs/knowledge/sources/S1-devblog-ankama-1.27.md` ; `S2` = `docs/knowledge/sources/S2-observation-jeu-2026-09-10.md` ;
  `X` = `docs/knowledge/2026-09-07-croisement-densites-reliquat.md` ; `AUD` = `docs/knowledge/audit-forgemagie-dofus3.md` ;
  `REC` = `docs/fm-recherche-2026-09-23.md` ; `OBS` = `data/observations/`.
- Statuts : `SOURCE PRIMAIRE` (SP), `MODÈLE EMPIRIQUE` (ME), `HYPOTHÈSE COMMUNAUTAIRE` (HC), `CONTRADICTION`, `INCONNU`.
  Dans cette fiche ils sont écrits en toutes lettres. « v1.27 » = chiffre ou règle du DevBlog Ankama de 2010 : sa
  transposition à Unity est une HYPOTHÈSE (`S1:47-52`, `K/hierarchie-preuves.md:56-61`).
- `POLITIQUE` n'est pas un statut du projet : c'est le mot employé par `EP` et l'errata pour un choix de projet
  (retenir une borne d'un intervalle). Il est à afficher tel quel, jamais comme un fait.

---

## 1. Poids et densités

### En bref
- Chaque caractéristique a une densité : un poids par point. [SOURCE PRIMAIRE — source: S2:46-56 (infobulle « DENSITÉ », 2026-09-10)]
- Le poids d'une rune = ce qu'elle ajoute × la densité. Une Rune Pa Vi (+15 Vitalité) pèse 3. [SOURCE PRIMAIRE — source: S2:50]
- Onze densités sont lues en jeu ou confirmées par le reliquat affiché ; les autres viennent de tables communautaires. [voir statut par ligne — source: EP densities.11, .18, .27, .28, .44, .69, .70, .82, .83, .121, .124]
- La densité n'est ni le poids d'inventaire (pods) ni le poids du brisage. [SOURCE PRIMAIRE pour la distinction pods/densité — source: S2:48 (colonnes « POIDS (pods) » et « DENSITÉ » distinctes dans l'infobulle)]

### Comment ça marche
1. Le poids d'une ligne = valeur × densité de la caractéristique. [SOURCE PRIMAIRE — source: S2:50-51 (15 × 0,2 = 3 ; 10 × 0,1 = 1)]
2. Depuis la 2.58, le poids des runes est affiché dans l'infobulle. [SOURCE PRIMAIRE (changelog relayé par jeuxonline) — source: ERR:53]
3. Une densité passe en SOURCE PRIMAIRE seulement par une citation Ankama ou une lecture en jeu consignée. [règle du projet — source: EP:1557]
4. Plusieurs valeurs des tables 2.x ont changé sur Unity sans changelog : % Rés. mêlée/distance lus 10 (et non 15), Renvoi lu 5 (et non 10). [SOURCE PRIMAIRE pour 121/124 ; CONTRADICTION pour 50 — source: EP densities.121, densities.124, densities.50 ; ERR:43, ERR:48]

### Exemple
Infobulles lues en jeu le **2026-09-10** (client 3.6.10.11, vidéo, `S2:46-56`) :
- Rune Pa Vi (niv. 5) : 15 Vitalité, POIDS (pods) 1, DENSITÉ **3** → 15 × `densities.11` (0,2) = 3.
- Rune Ini (niv. 1) : 10 Initiative, POIDS (pods) 1, DENSITÉ **1** → 10 × `densities.44` (0,1) = 1.
Statut : SOURCE PRIMAIRE (lecture d'écran, rang R1). Les densités 0,2 et 0,1 sont à lire en direct : `densities.11`, `densities.44`.

### Sûr
- Vitalité 0,2/pt, Initiative 0,1/pt, confirmées par l'arithmétique du reliquat affiché (2026-09-08). [SOURCE PRIMAIRE — source: EP densities.11 (l.945), densities.44 (l.1173) ; ERR:40]
- Esquive PA/PM 7, Retrait PA/PM 7, Puissance pièges 2, Dommages pièges 5, lus en infobulle le 2026-09-08. [SOURCE PRIMAIRE — source: EP densities.27, .28, .82, .83, .69, .70 ; OBS/tooltips/tooltips.json ; ERR:42]
- % Résistance mêlée et distance : 10 (lu en infobulle, et non 15). [SOURCE PRIMAIRE — source: EP densities.121 (l.1473), densities.124 (l.1509) ; ERR:43]
- % Critique : 10 (30 = valeur Rétro, écart de version). [SOURCE PRIMAIRE — source: EP densities.18 (l.1017) ; ERR:47] — réserve : lecture en jeu « à consigner dans data/observations/tooltips » (EP densities.18 note).
- Le poids des runes est affiché en infobulle depuis la 2.58. [SOURCE PRIMAIRE — source: ERR:53]

### Pas sûr
- PA 100, PM 90, Portée 51, Invocations 30, Force/Agi/Chance/Intel 1, Sagesse 3, Dommages 20, % Dommages 15, etc. : tables 2.x convergentes, non revérifiées sur Unity. [HYPOTHÈSE COMMUNAUTAIRE — source: EP densities.1, .23, .19, .26, .10, .12, .16, .120 ; ERR:50]
- Pods 0,25/pt (les rapports divergent d'un facteur 10). [CONTRADICTION — source: EP densities.40 (l.1161)]
- Renvoi de dommages 5 (lu en jeu) contre 10 (tables 2.x). [CONTRADICTION — source: EP densities.50 (l.1209) ; X:137]
- Fuite et Tacle 4 contre 5 (5 = Rétro 1.49 probable). [CONTRADICTION — source: EP densities.78 (l.1305), densities.79 (l.1317)]
- L'API DofusDB expose-t-elle les densités ? Oui selon `ANA:92` (`effectPowerRate`, client 3.6.12.16, « vérifié par appel API ») ; non selon `EP:1557` et `ERR:54`. Extraction proposée (P3), non validée. [CONTRADICTION (documentaire) — source: ANA:92, ANA:139 ; EP:1557 ; ERR:54]
- Liste exacte des poids modifiés par le changelog 2.29. [INCONNU — source: ERR:53]
- Densité divisée par 2 pour les stats négatives : témoignage non intégré. [HYPOTHÈSE COMMUNAUTAIRE (témoignage) — source: ANA:187]

### Paramètres liés
Section `densities` (toutes les entrées `densities.N`). Chemins clés : `densities.11`, `densities.44`, `densities.40`, `densities.50`, `densities.78`, `densities.79`, `densities.121`, `densities.124`.

---

## 2. Chances : SC, SN, EC

### En bref
- Trois issues : succès critique (SC), succès neutre (SN), échec critique (EC). [SOURCE PRIMAIRE — source: src/content/knowledge.ts:39 (tutoriel officiel) ; S1:35-45]
- La formule du serveur est secrète : le simulateur utilise des modèles réglables, pas la vraie formule. [SOURCE PRIMAIRE pour le secret ; INCONNU pour le modèle — source: EP params.probability.$comment (l.305), params.probability.model (l.307-310)]
- En forgemagie normale, le SC ne descend jamais sous 15 %, hors over et exo. [SOURCE PRIMAIRE — source: src/logic/probability/constraints.ts:7-8, 26 ; ERR:31]
- Ajouter un PA ou un PM exotique : le SC « peut descendre jusqu'à 1 % ». [SOURCE PRIMAIRE (atteignabilité) — source: constraints.ts:50-71 ; ERR:15]

### Comment ça marche
1. Le modèle choisi calcule une chance de SC à partir de la distance au jet max (et d'autres facteurs, à pente nulle pour l'instant). [INCONNU — source: EP params.probability.model, params.probability.officialFactorsLinear.$comment (l.440)]
2. Le reste (1 − SC) va d'abord au SN, jusqu'à 50 % ; l'EC prend le reste. [MODÈLE EMPIRIQUE (dérivé des ancres v1.27, 5 triplets) — source: EP params.probability.snSplit (l.390-401) ; ANA:29-38]
3. Si la tentative crée ou étend un exo lourd, le SC est épinglé à 1 %, sans SN. [HYPOTHÈSE COMMUNAUTAIRE (valeur) / POLITIQUE (usage du plancher comme valeur) — source: EP params.probability.heavyExoCharacteristics (l.321-330), params.probability.heavyExoEcShare (l.403-412)]
4. Un exo léger n'a pas de chiffre : le jeu affiche un intervalle entre 1/0/99 et 32/50/18 ; le tirage utilise la borne haute. [INCONNU (choix de projet) — source: EP params.probability.unknownIntervalSampling (l.425-437)]
5. Enfin, les bornes officielles (15 % ; 1 %) sont appliquées par-dessus tout modèle. [SOURCE PRIMAIRE — source: constraints.ts:83-93]

### Exemple
**Exo PM sur Gelano** (`REC:45`, `REC:103-104`, `ANA:175-176`, `ERR:9`) :
- Dasech (forum dofus.com, **25/11/2024**, bêta Dofus 3) : 100 exos PM en **8 949** runes = **1,117 %** (IC95 [0,89 % ; 1,34 %], `ANA:149`).
- Fek (vidéo, **19/01/2023**, Dofus 2) : **111** exos en **10 000** runes = 1,11 %.
- Poolé : **1,11 %**, IC95 ≈ 0,96–1,26 %.
Statut : MODÈLE EMPIRIQUE [MES], N = 8 949 et 10 000, objet simple ; forum non relu directement (erreur 403). Le 1 % du moteur est une constante codée (`constraints.ts:48`, `MIN_SC_HEAVY_EXO`), pas un paramètre.

### Sûr
- Plancher de SC 15 % en FM normale, « hors tentative d'overmax ou de forgemagie exotique ». [SOURCE PRIMAIRE — source: constraints.ts:7-8 ; ERR:31]
- Ce plancher ne vaut que pour une ligne naturelle qui reste ≤ son jet max après la rune. [SOURCE PRIMAIRE (lecture du tutoriel) — source: constraints.ts:15-18 ; ERR:31]
- 1 % est atteignable pour un exo PA ou PM (verbatim recoupé par deux relais, pas lu sur dofus.com). [SOURCE PRIMAIRE — source: constraints.ts:50-71 ; ERR:15]
- Exo PM sur Gelano : 1,11 % mesuré (N = 8 949 et 10 000). [MODÈLE EMPIRIQUE — source: ANA:175-176 ; ERR:9]
- 2ᵉ point de % Do Per So en exo : 3,4 % de SC, aucun SN (10 000 à 15 000 runes, bêta 3.6). [MODÈLE EMPIRIQUE — source: EP params.probability.cumulativeRegimeSc (l.414-423) ; REC:105]
- Répartition SN = min(50 %, 1 − SC) : reproduit les ancres 66/34/0, 43/50/7, 15/50/35, 32/50/18 et Alterya 30/50/20. [MODÈLE EMPIRIQUE (5 triplets) — source: EP params.probability.snSplit ; ANA:29-45, ANA:151]
- Les cinq ancres Ankama 2010 : 66/34/0, 43/50/7, 15/50/35, 32/50/18, 1/0/99. [SOURCE PRIMAIRE — v1.27 ; transposition Unity HYPOTHÈSE — source: S1:39-52]
- Facteurs de difficulté, par importance : qualité globale de l'objet (hors ligne visée) > qualité du jet modifié > niveau ; palier à 80 % de la fourchette ; jet fixe exempté du palier ; objets à un seul jet plus faciles ; objets éthérés plus difficiles ; plus d'over/exo = plus dur. [SOURCE PRIMAIRE — v1.27 (existence) — source: S1:80-95 ; EP params.probability.structuralFactors]
- Jet fixe exempté du palier 80 %. [SOURCE PRIMAIRE — v1.27 — source: EP params.probability.structuralFactors.fixedRollExempt (l.521-533)]

### Pas sûr
- Le modèle actif et tous ses coefficients (a = 0,15, b = 0,5, c, d, e = 0). [INCONNU — source: EP params.probability.model, params.probability.officialFactorsLinear.a…e (l.441-495)]
- Que le 1 % soit LA valeur d'un exo lourd (le tutoriel dit seulement « peut descendre jusqu'à »). [HYPOTHÈSE COMMUNAUTAIRE forte / POLITIQUE — source: EP params.probability.heavyExoCharacteristics note (l.330) ; ERR:26]
- Portée et Invocations dans la liste des exos lourds (Ankama ne les nomme pas). [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.probability.heavyExoCharacteristics source (l.329) ; ERR:13]
- Partage 0 % SN / 99 % EC en exo lourd. [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.probability.heavyExoEcShare]
- Où tombe un exo léger entre 1/0/99 et 32/50/18. [INCONNU — source: EP params.probability.unknownIntervalSampling ; EXO:131-146]
- Portée du plancher 15 % sur un objet qui porte déjà un over/exo : trois témoignages 2.x (2021) parlent de « 2-3 % » ; proposition P7 en attente. [HYPOTHÈSE COMMUNAUTAIRE (témoignages) — source: ANA:152, ANA:164]
- Les pentes des facteurs v1.27 (palier 80 %, un seul jet, éthéré, nombre d'over/exo, qualité globale). [INCONNU — source: EP params.probability.structuralFactors.*, params.probability.officialFactorsLinear.e]
- Le SC du régime « poids cumulé » dépend de la qualité de l'objet (0,8 % sur objet parfait, N = 1 000), non modélisé. [MODÈLE EMPIRIQUE partiel — source: EP params.probability.cumulativeRegimeSc note ; ANA:179-180]
- Le reliquat influe-t-il sur la probabilité ? Aucune source ne l'affirme. [INCONNU — source: EXO:100-101 ; AUD:238]
- `34/50/16` et `1/22/77` : réfutés par l'original (`ERR:16`) mais `ANA:108-116` propose de les repasser en CONTRADICTION (billet peut-être modifié entre 2009 et 2010) ; proposition abandonnée ensuite (`ANA:169`). [état : réfutés, doute noté — source: ERR:16 ; ANA:108-116, ANA:169]

### Paramètres liés
Section `probability`. Chemins clés : `params.probability.model`, `params.probability.snSplit`, `params.probability.ecShare`, `params.probability.heavyExoCharacteristics`, `params.probability.heavyExoRule`, `params.probability.heavyExoWeightThreshold`, `params.probability.cumulativeRegimeSc`, `params.probability.heavyExoEcShare`, `params.probability.unknownIntervalSampling`, `params.probability.officialFactorsLinear.*`, `params.probability.structuralFactors.*`. Constantes non paramétrables : `MIN_SC_NORMAL`, `MIN_SC_HEAVY_EXO`, `HEAVY_EXO_VERBATIM` (`src/logic/probability/constraints.ts:26, 48, 71`).

---

## 3. Pertes et reliquat

### En bref
- En SC : la rune passe, rien n'est perdu. [SOURCE PRIMAIRE — source: src/logic/engine/applyRune.ts:12]
- En SN : la rune passe, et l'objet perd un poids égal à celui de la rune, ligne visée comprise. [SOURCE PRIMAIRE — source: applyRune.ts:13-16 ; ERR:32]
- En EC : la rune ne passe pas, et l'objet perd exactement le poids de la rune. [SOURCE PRIMAIRE — source: applyRune.ts:17-22 ; ERR:33 ; EP:1564]
- Quand on perd plus que prévu, le surplus devient le reliquat, affiché en jeu. [SOURCE PRIMAIRE — source: EP params.residualPool.visibleInClient (l.203-214) ; S2:74-85]

### Comment ça marche
1. La perte à payer = poids de la rune (SN ou EC). [SOURCE PRIMAIRE — source: applyRune.ts:13-21]
2. Le reliquat absorbe d'abord la perte (comportement actuel du moteur). [INCONNU — source: EP params.residualPool.poolConsumptionRule (l.216-226)]
3. Une loi choisit la ligne qui paie ; la ligne visée peut payer, après son gain. [HYPOTHÈSE COMMUNAUTAIRE (loi) ; SOURCE PRIMAIRE (ligne visée candidate) — source: EP params.lossSelection.strategy (l.85-98) ; ERR:32]
4. On retire des points entiers : le plus petit nombre qui couvre la perte, parfois un point de plus quand le compte tombe juste. [MODÈLE EMPIRIQUE, N = 6 — source: EP params.lossSelection.quantization (l.127-139), params.lossSelection.exactRatioExtraPointChance (l.141-150)]
5. Nouveau reliquat = (reliquat + poids perdu) − poids de la rune. [SOURCE PRIMAIRE (vérifié sur deux tentatives) — source: S2:74-85]

### Exemple
**Cape Bouffante, 2026-09-08** (`OBS/observations.json`, client 3.6.10.11, captures `OBS/captures/2026-09-08/`) :
- Objet : Vitalité 36–40, Initiative 151–200. Rune Vi (+5 Vitalité, poids 1 = 5 × `densities.11`). Issue : **SN**.
- Avant (déduit, non lu) : Vitalité 37, Initiative 166, reliquat 0.
- Après : Vitalité **42** (en over), Initiative **155** (−11 = 1,1 de poids avec `densities.44`), reliquat affiché **0,1**.
- 1,1 − 1 = 0,1 : le surplus devient le reliquat. Le minimum aurait été 10 initiative ; le jeu en a retiré 11.
Statut : SOURCE PRIMAIRE (affichage du reliquat, rang R1) ; loi de quantité : MODÈLE EMPIRIQUE (`params.lossSelection.quantization`, `params.lossSelection.exactRatioExtraPointChance`).

### Sûr
- EC = poids de la rune exactement (10,0 sur deux Ra Vi), réparti sur plusieurs lignes si besoin. [SOURCE PRIMAIRE — source: ERR:33 ; EP:1564]
- EC impayable : retire tout ce qui reste puis s'arrête (−30 vita = 6,0 pour 10 demandés) ; à lignes et reliquat nuls, « Échec » sans effet, rune consommée. [SOURCE PRIMAIRE — source: ERR:34 ; applyRune.ts:19-21]
- La ligne visée perd après son gain (SN Ra Vi : +50 brut, −28 vita −44 ini = 10,0, net +22). [SOURCE PRIMAIRE — source: ERR:32]
- Le reliquat est affiché dans l'interface et dans l'historique (« + reliquat » / « − reliquat »). [SOURCE PRIMAIRE — source: EP params.residualPool.visibleInClient ; ERR:39 ; S2:37-44, S2:58-67]
- Formule du reliquat vérifiée sur un SN (Ini → −6 Vita → 0,2) et un EC (Pa Vi → −31 Ini → 0,1). [SOURCE PRIMAIRE — source: S2:78-83]
- Point supplémentaire quand la perte est un multiple exact de la densité : 4 cas sur 6, p ≈ 0,67 (IC95 ≈ 0,30–0,90). [MODÈLE EMPIRIQUE, N = 6 — source: EP params.lossSelection.exactRatioExtraPointChance]
- Un bonus peut redescendre à 0 ; un malus ne peut perdre que s'il est overmaxé, jamais au-delà du malus naturel. [SOURCE PRIMAIRE — v1.27 — source: ERR:21 ; K/deltas-2026-09-10.md:66-68]

### Pas sûr
- Quelle ligne perd : loi par défaut « ratio quantum / déficit » (épargne les lignes trop lourdes) ; ses pentes et son plancher sont inventés pour respecter les témoignages. [HYPOTHÈSE COMMUNAUTAIRE (tendance) ; INCONNU (valeurs) — source: EP params.lossSelection.strategy, params.lossSelection.deficitRatio.* (l.152-186) ; ERR:7]
- Priorité aux lignes over/exo lors des pertes. [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.lossSelection.prioritizeOverExo (l.100-111)] — indice contraire : série Dasech, PM exo perdu 2 fois seulement (`ANA:150`).
- Ordre reliquat / over-exo : le moteur fait payer le reliquat d'abord, Tofus dit l'inverse. [INCONNU — source: EP params.residualPool.poolConsumptionRule ; ANA:71-74, ANA:95]
- Anomalie A1 (2026-09-10) : EC avec reliquat 0,2, reliquat inchangé ; `ceil_random_extra` l'explique sans mécanisme nouveau. [INCONNU, N = 1 — source: S2:89-109 ; ERR:10, ERR:22]
- Purge du reliquat à l'équipement, en HDV ou à l'échange. [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.residualPool.resetOnEquipOrMarket (l.190-201)]
- SN impayable : « rien ne se passe » (v1.27), jamais observé en Unity ; sort de la rune inconnu. [SOURCE PRIMAIRE — v1.27 ; INCONNU pour la rune — source: EP params.lossSelection.unpayableSn (l.113-126)]
- « Le reliquat absorbera en partie les échecs futurs » (v1.27) : le moteur absorbe en totalité. [CONTRADICTION (code vs v1.27) — source: K/deltas-2026-09-10.md:71]
- Mécanisme serveur réel de la quantité perdue (arrondi float32 plausible). [INCONNU — source: EP params.lossSelection.quantization note ; ANA:76-78]

### Paramètres liés
Sections `lossSelection` et `residualPool`. Chemins clés : `params.lossSelection.strategy`, `params.lossSelection.prioritizeOverExo`, `params.lossSelection.unpayableSn`, `params.lossSelection.quantization`, `params.lossSelection.exactRatioExtraPointChance`, `params.lossSelection.deficitRatio.heavyExponent|lightExponent|floor`, `params.residualPool.resetOnEquipOrMarket`, `params.residualPool.visibleInClient`, `params.residualPool.poolConsumptionRule`.

---

## 4. Over et exo (borne, exo lourd, poids cumulé)

### En bref
- Over = une ligne au-dessus de son jet max ; exo = une ligne absente du patron de l'objet. [définition — source: src/content/knowledge.ts:50]
- Il existe un plafond par ligne : Ankama donne l'exemple de 101 points de Force sur une base max de 60. [SOURCE PRIMAIRE — v1.27 (existence) ; HYPOTHÈSE COMMUNAUTAIRE (valeur 101) — source: EP params.overCapWeight (l.7-17) ; ARB:21-30]
- Il existe aussi un plafond pour tout l'objet (il empêche PA + PM exo), de valeur inconnue. [SOURCE PRIMAIRE — v1.27 (existence) ; INCONNU (valeur) — source: EP params.objectNonNaturalCap (l.18-28)]
- Une ligne qui dépasse de 30 de poids ou plus son jet (PA, PM, PO, Invocations dès le 1ᵉʳ point ; % Do au 2ᵉ) ne passe qu'en SC. [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.probability.heavyExoRule (l.342-354), params.probability.heavyExoWeightThreshold (l.355-365)]

### Comment ça marche
1. Sur une ligne, le simulateur borne la valeur totale × densité (505 vita, 101 agilité), pas seulement la part over. [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.overCapLineBasis (l.42-54)]
2. Sur l'objet, il additionne les parts over (valeur − max) et les exos, face au plafond objet. [HYPOTHÈSE COMMUNAUTAIRE (portée) ; INCONNU (valeur du plafond) — source: EP params.overCapScope (l.29-41), params.objectNonNaturalCap]
3. Une rune qui dépasserait la borne s'arrête à la borne (Ra Vi sur 480 vita → 505). [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.overCapExcess.behaviour (l.57-69)]
4. Exo lourd (liste PA, PM, PO, Invocations) : SC épinglé à 1 %, pas de SN. [HYPOTHÈSE COMMUNAUTAIRE / POLITIQUE — source: EP params.probability.heavyExoCharacteristics]
5. Exo atteint par poids cumulé (ex. 2ᵉ point de % Do) : SC 3,4 %, pas de SN. [MODÈLE EMPIRIQUE — source: EP params.probability.cumulativeRegimeSc]

### Exemple
**Cape du Wa Wabbit, vue en HDV le 2026-09-09** (`OBS/item-snapshots.json:1-41`, captures `OBS/captures/2026-09-09/`) :
- Objet niveau 60 : Vitalité **233** pour un jet max de **100**, autres lignes au max, aucune transcendance.
- Over classique de **+133 vita = 26,6 de poids** (133 × `densities.11`), obtenu par succès critiques.
Statut : SOURCE PRIMAIRE (objet vu, `ERR:38`). Ce que l'exemple prouve : des over par SC existent, sans plafond lié au niveau. Ce qu'il ne prouve pas : la valeur de la borne ni sa portée.

### Sûr
- Deux plafonds distincts : par effet et par objet. [SOURCE PRIMAIRE — v1.27 — source: ARB:19-55 ; ERR:18]
- Le plafond par objet empêche d'ajouter PA et PM sur un objet qui n'a ni l'un ni l'autre ; Ankama ne donne pas sa valeur. [SOURCE PRIMAIRE — v1.27 — source: EP params.objectNonNaturalCap source (l.21)]
- Over par SC possible, sans plafond lié au niveau (Cape du Wa Wabbit). [SOURCE PRIMAIRE — source: ERR:38]
- Les objets « 140 vita » / « 200 vita » vus en HDV sont des Rata Vi, pas une limite d'over liée au niveau. [observation HDV, errata « hypothèse écartée » — source: ERR:37]
- 2ᵉ % Do Per So en exo : 3,4 % de SC, aucun SN. [MODÈLE EMPIRIQUE — source: EP params.probability.cumulativeRegimeSc ; REC:105]

### Pas sûr
- Valeur 101 du plafond par effet (c'est l'exemple d'Ankama, pas une constante nommée). [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.overCapWeight]
- Forme exacte du plafond par effet : Ankama borne une somme de deux termes, le code un seul (lectures L1/L2/L3). [CONTRADICTION — source: EP params.overCapWeight note (l.11) ; ERR:18 ; K/deltas-2026-09-10.md:56]
- Valeur du plafond objet : initialisée à 101, encadrée [100 ; 190[ sous trois hypothèses. [INCONNU — source: EP params.objectNonNaturalCap]
- Portée globale ou par ligne : le champ de statut dit HYPOTHÈSE COMMUNAUTAIRE, la note dit « CONTRADICTION depuis le 2026-09-07 », `ANA:97` dit « CONTRADICTION maintenue ». [HYPOTHÈSE COMMUNAUTAIRE / CONTRADICTION — source: EP params.overCapScope (l.31, l.33) ; ANA:97]
- Borne mesurée sur la valeur totale de la ligne. [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.overCapLineBasis]
- Troncature à la borne (Ra Vi 480 → 505, lecture d'un joueur, aucune source écrite). [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.overCapExcess.behaviour ; ERR:55]
- Poids retenu pour la perte d'une rune tronquée (rune entière ou part appliquée). [INCONNU — source: EP params.overCapExcess.lossBasis (l.70-82)]
- Règle « poids cumulé ≥ 30 » (Fashionista + témoignage de Yanis, aucune source Ankama). [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.probability.heavyExoRule ; EXO:61-87]
- L'overmax d'une ligne naturelle à ≥ 30 de poids passe-t-il aussi en régime 1 % ? [INCONNU — source: EP params.probability.heavyExoIncludeOvermax (l.366-378)]
- Chances d'un exo léger (1ᵉʳ point de % Do, etc.). [INCONNU — source: EP params.probability.unknownIntervalSampling ; EXO:144-146]
- Exo Invocations : la borne par ligne en valeur totale autoriserait 3 invocations exo ; à vérifier en HDV. [INCONNU — source: ANA:130-131]

### Paramètres liés
Section `overCap` : `params.overCapWeight`, `params.overCapScope`, `params.overCapLineBasis`, `params.overCapExcess.behaviour`, `params.overCapExcess.lossBasis`. Hors section `overCap` dans le registre (voir doutes) : `params.objectNonNaturalCap`. Section `probability` : `params.probability.heavyExoCharacteristics`, `params.probability.heavyExoRule`, `params.probability.heavyExoWeightThreshold`, `params.probability.heavyExoIncludeOvermax`, `params.probability.cumulativeRegimeSc`.

---

## 5. Transcendance

### En bref
- Une rune de transcendance verrouille l'objet : plus de forgemagie, plus d'orbe. [SOURCE PRIMAIRE (devblog 2.58), version ≤ 3.6 — source: src/logic/engine/transcendence.ts:4-11 ; ERR:27]
- Chaque rune de transcendance porte l'effet « Empêche les futures forgemagies » dans les données client. [SOURCE PRIMAIRE (données client via DofusDB) — source: ERR:60 ; transcendence.ts:8-10]
- Rangs Ta / Pata / Rata ; leur taux de réussite est posé à 100 % selon le wiki. [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.transcendence.successRateByRank (l.268-286)]
- Depuis la 3.6, les potions et gravures d'élément restent possibles après transcendance. [SOURCE PRIMAIRE (patch note 3.6 du 23/06/2026, [OFF]) — source: REC:14-16]

### Comment ça marche
1. Le simulateur vérifie d'abord le verrou de l'objet. [SOURCE PRIMAIRE — source: transcendence.ts:13-14]
2. Il refuse la rune si l'objet a déjà un exo ou un over. [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.transcendence.refuseIfExo (l.231-243), params.transcendence.refuseIfOver (l.244-256)]
3. Il vérifie un seuil de valeur par rang — aucun n'est renseigné, donc aucun seuil n'est appliqué. [INCONNU — source: EP params.transcendence.maxCurrentValueByRank (l.257-267)]
4. Il applique la rune comme un SC garanti tant que le taux vaut 100, puis vérifie la borne d'over/exo. [HYPOTHÈSE COMMUNAUTAIRE — source: transcendence.ts:19-21 ; EP params.transcendence.successRateByRank]

### Exemple
**Recherche en HDV, 2026-09-09** (Yanis, `ERR:37`) : des objets « 140 vita » (Cape Bouffante, max 40) et « 200 vita » (Abracapa Ancestrale, max 100) sont des **Rata Vi** (+100 vita, rune 20569) ; leur statut « Empêche les futures forgemagies » est affiché. Statut : observation en HDV consignée à l'errata (classée « hypothèse écartée, tracée » : elle écarte l'idée d'une limite d'over liée au niveau). Aucun paramètre en jeu dans cet exemple.

### Sûr
- Objet transcendé : plus de forgemagie ni de réinitialisation par orbe (devblog 2.58). [SOURCE PRIMAIRE, valable ≤ 3.6 — source: ERR:27 ; transcendence.ts:4-11]
- Verrou de l'objet entier, pas d'une seule ligne. [SOURCE PRIMAIRE — source: ERR:28]
- Effet 2825 « Empêche les futures forgemagies » sur chaque rune ; effet 2827 « % de chances de réussite » renvoyé à 0 par l'API. [SOURCE PRIMAIRE (donnée client relayée) — source: ERR:60]
- Potions et gravures d'élément autorisées après transcendance depuis la 3.6. [SOURCE PRIMAIRE [OFF] — source: REC:14-16 ; ANA:155]

### Pas sûr
- Refus si exo ou over déjà présent. [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.transcendence.refuseIfExo, refuseIfOver ; X:116]
- Seuils de valeur par rang (ex. Initiative 610 / 410 / 210 selon Gamosaurus). [INCONNU — source: EP params.transcendence.maxCurrentValueByRank ; X:116]
- Taux de réussite 100 % par rang. [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.transcendence.successRateByRank]
- 3.7 (patch note **bêta** du 17/09/2026) : l'orbe réinitialise un objet transcendé et retire la transcendance. Règle dépendante de la version, proposition P8 non validée ; le moteur applique encore le verrou 2.58. [SOURCE PRIMAIRE (bêta, susceptible de changer) — source: REC:20-25 ; ANA:154, ANA:165, ANA:207]

### Paramètres liés
Section `transcendence` : `params.transcendence.refuseIfExo`, `params.transcendence.refuseIfOver`, `params.transcendence.maxCurrentValueByRank`, `params.transcendence.successRateByRank`. Le verrou n'est pas paramétrable (`EP:230`).

---

## 6. Jet de craft et orbes régénérants

### En bref
- Un objet crafté reçoit sur chaque ligne une valeur tirée dans l'intervalle affiché. [source officielle relayée — source: EP params.craft.rollDistribution source (l.293)]
- La loi de ce tirage n'est pas publique : uniforme par défaut, faute de mieux. [INCONNU — source: EP params.craft.rollDistribution (l.290-302)]
- Un orbe remet l'objet à un jet de craft aléatoire et purge over, exo et reliquat. [HYPOTHÈSE COMMUNAUTAIRE — source: src/logic/engine/orb.ts:8-11]
- Pas d'orbe sur un objet transcendé (règle 2.58, remise en cause par la 3.7 bêta). [SOURCE PRIMAIRE ≤ 3.6 — source: orb.ts:4-6 ; REC:25]

### Comment ça marche
1. L'orbe est refusé si l'objet est transcendé. [SOURCE PRIMAIRE (2.58) — source: orb.ts:24-25]
2. Les lignes exotiques sont retirées. [HYPOTHÈSE COMMUNAUTAIRE — source: orb.ts:27-28]
3. Chaque ligne naturelle est retirée dans son intervalle, selon la loi choisie. [INCONNU — source: orb.ts:29 ; EP params.craft.rollDistribution]
4. Le reliquat est remis à 0. [HYPOTHÈSE COMMUNAUTAIRE — source: orb.ts:30]
5. L'indicateur « qualité du jet » de l'atelier mesure la position pondérée par densité dans les intervalles ; c'est un outil de planification, pas une règle du jeu. [outil du projet — source: src/logic/craft/rollQuality.ts:1-10]

### Exemple
Aucun exemple documenté.

### Sûr
- Refus de l'orbe sur un objet transcendé (≤ 3.6). [SOURCE PRIMAIRE — source: ERR:27 ; orb.ts:4-6]

### Pas sûr
- Loi du jet de craft (uniforme ; « triangulaire » proposée sans source, pour test). [INCONNU — source: EP params.craft.rollDistribution ; ERR:58]
- Purge over/exo/reliquat par l'orbe. [HYPOTHÈSE COMMUNAUTAIRE — source: orb.ts:8-11]
- 3.7 bêta : l'orbe réinitialise complètement un objet même transcendé et retire la transcendance. [SOURCE PRIMAIRE (bêta) — source: REC:25]

### Paramètres liés
Section `craft` : `params.craft.rollDistribution`.

---

## 7. Brisage

### En bref
- Le brisage transforme les lignes d'un objet en runes, selon le poids de chaque ligne, le niveau et un coefficient du serveur. [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.brisage.$comment (l.820) ; src/logic/brisage/brisage.ts:1-16]
- La formule vient de deux calculateurs open source et du forum officiel ; elle n'est pas exacte. [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.brisage.levelFactor (l.821-831)]
- Avec un focus, la ligne visée compte en entier, les autres pour moitié. [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.brisage.focusOtherLinesFactor (l.843-853)]

### Comment ça marche
1. Pour chaque ligne : valeur × densité × niveau × 0,015 + 1. [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.brisage.levelFactor, params.brisage.constantOffset (l.832-842)]
2. Le résultat est multiplié par le coefficient du serveur / 100. [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.brisage.$comment]
3. Puis divisé par le poids d'une rune de la ligne pour obtenir un nombre de runes. [HYPOTHÈSE COMMUNAUTAIRE — source: brisage.ts:26-30]
4. Pods : la valeur est d'abord divisée par 2,5 (sans justification écrite). [INCONNU — source: EP params.brisage.podsDivisor (l.854-864)]
5. PA, PM, PO, Invocations avec une valeur entre 0 et 1 sont comptés 1. [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.brisage.forceOneForActionStats (l.865-877)]

### Exemple
Aucun exemple documenté. (Seules traces chiffrées, non exploitables comme exemple : « écart 852 prévu / 659 obtenu (forum) », non daté, `ANA:101` ; Papycha, 34 écarts sur 200 essais, erreur max 7 %, `EP params.brisage.levelFactor` note.)

### Sûr
- Rien au rang SOURCE PRIMAIRE ou MODÈLE EMPIRIQUE (N documenté) sur le brisage Unity.

### Pas sûr
- Facteur 0,015 (= 3/200) et terme + 1 : deux dépôts + forum officiel + « Enpreur ». [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.brisage.levelFactor, params.brisage.constantOffset ; ANA:189]
- Écart avec le jeu dans 34 cas sur 200 (erreur max 7 %). [HYPOTHÈSE COMMUNAUTAIRE (relevé Papycha, non vérifié) — source: EP params.brisage.levelFactor note (l.825)]
- Formules KamelAkar et Next-Stage incompatibles. [HYPOTHÈSE COMMUNAUTAIRE, confiance faible — source: ANA:101]
- Diviseur Pods 2,5. [INCONNU — source: EP params.brisage.podsDivisor]
- Pods non focalisés divisés ou non par 2,5 (Icksir oui, KamelAkar non). [CONTRADICTION — source: EP params.brisage.podsDivisorOnNonFocusLines (l.878-890)]
- Lignes nulles ou négatives : ignorées (KamelAkar) ou comptées + 1 (Icksir). [CONTRADICTION — source: EP params.brisage.nonPositiveLineContribution (l.891-903)]
- Part des autres lignes en focus : 0,5. [HYPOTHÈSE COMMUNAUTAIRE — source: EP params.brisage.focusOtherLinesFactor]

### Paramètres liés
Section `brisage` : `params.brisage.levelFactor`, `params.brisage.constantOffset`, `params.brisage.focusOtherLinesFactor`, `params.brisage.podsDivisor`, `params.brisage.forceOneForActionStats`, `params.brisage.podsDivisorOnNonFocusLines`, `params.brisage.nonPositiveLineContribution`. Lien : `densities.40` (Pods).

---

## 8. Potions

### En bref
- Les potions changent l'élément des dommages neutres d'une arme, en gardant une part des dégâts. [HYPOTHÈSE COMMUNAUTAIRE (mécanisme décrit par les tables 2.x) — source: EP params.potions.damageKeptPercentByLevel (l.905-917)]
- Sur Unity : deux paliers seulement (niveau 20 et niveau 80), aucun taux affiché. [SOURCE PRIMAIRE — source: EP params.potions.$comment (l.906) ; ERR:44]
- Le taux est contesté : le module potions reste désactivé. [CONTRADICTION — source: EP params.potions.damageKeptPercentByLevel]

### Comment ça marche
1. Aucune valeur n'est codée : le simulateur ne calcule rien pour les potions. [CONTRADICTION — source: EP params.potions.damageKeptPercentByLevel note (l.911)]
2. Anciennes tables : 50 / 65 / 80 % (Rétro / 2.x) ; « 65 % supprimé en 3.1, armes converties à 85 % » (wiki). [HYPOTHÈSE COMMUNAUTAIRE (R5) — source: EP params.potions.damageKeptPercentByLevel source (l.910)]
3. Patch note 3.7 **bêta** (17/09/2026) : les potions à 85 % passent à 100 %, celles à 50 % à 10 %. [SOURCE PRIMAIRE (bêta) — source: REC:20-22 ; ANA:153]

### Exemple
**Observation en jeu du 2026-09-08** (Yanis, client 3.6.10.11, captures `OBS/captures/2026-09-08/`) : 8 potions dans le dataset, deux paliers — niveau 20 (Étincelle, Crachin, Courant d'Air, Secousse) et niveau 80 (Incendie, Tsunami, Ouragan, Séisme) ; l'infobulle Unity n'affiche aucun taux, l'API non plus. Statut : SOURCE PRIMAIRE (rang R1). Paramètre à lire en direct : `params.potions.damageKeptPercentByLevel` (valeur actuelle vide).

### Sûr
- Deux paliers (20 et 80) sur Unity ; le palier 50 des tables 2.x n'existe pas. [SOURCE PRIMAIRE — source: EP params.potions.$comment ; ERR:44]
- Aucun taux affiché dans l'infobulle Unity. [SOURCE PRIMAIRE — source: ERR:44]
- Potions utilisables après transcendance depuis la 3.6. [SOURCE PRIMAIRE [OFF] — source: REC:14-16]

### Pas sûr
- Pourcentage de dégâts conservés par palier. [CONTRADICTION — source: EP params.potions.damageKeptPercentByLevel ; K/hierarchie-preuves.md:100]
- Les nombres 85 / 50 sont-ils des taux de conversion (et non de réussite) ? `ANA:153` le lit ainsi à partir de la 3.7 bêta ; `ANA:99` évoquait « 50/65/80 = % de dégâts conservés pour 50/35/20 % de réussite » (wiki-dofus 2016, confiance faible). Réconciliation avec les deux paliers 20/80 non faite. [CONTRADICTION — source: ANA:99, ANA:153]
- Règles 3.7 (100 % / 10 %) : bêta, proposition P8 non validée. [SOURCE PRIMAIRE (bêta) — source: REC:20-22 ; ANA:165]

### Paramètres liés
Section `potions` : `params.potions.damageKeptPercentByLevel`.

---

## Glossaire

| Terme | Définition | Statut / source |
|---|---|---|
| **Densité** | Poids d'un point d'une caractéristique (ex. Vitalité 0,2, Initiative 0,1, PA 100). Affichée en jeu dans l'infobulle des runes. | SOURCE PRIMAIRE pour l'affichage ; valeurs : statut par ligne — `S2:46-56`, EP `densities` |
| **Poids d'une ligne** | Valeur de la ligne × sa densité. | SOURCE PRIMAIRE — `S2:50-51` |
| **Poids d'une rune** | Ce que la rune ajoute × la densité (Rune Pa Vi +15 = 3). C'est aussi la perte à payer en SN ou en EC. | SOURCE PRIMAIRE — `S2:50` ; `applyRune.ts:13-21` |
| **Poids d'inventaire (`weight` / `realWeight`)** | Le poids en pods d'un objet dans l'inventaire, sans rapport avec la densité FM. `weight` = pods (absent de l'API). `realWeight` : « pods d'inventaire » selon `X:125`, `ERR:54`, `data/README.md:47` ; « poids brisage/économie » selon `CLAUDE.md:61` et `Reverse-Engineering…:83`. | CONTRADICTION documentaire — ne jamais utiliser comme densité |
| **Jet (min, max, jet parfait)** | Intervalle [min, max] d'une ligne ; le jet parfait = la ligne à son max. Le jet de craft = valeur tirée dans cet intervalle à la fabrication (loi du tirage inconnue). | INCONNU (loi) — EP `params.craft.rollDistribution` |
| **Over (overmax)** | Ligne naturelle au-dessus de son jet max. | définition — `knowledge.ts:50` |
| **Exo (exotique)** | Ligne absente du patron de l'objet, ajoutée par forgemagie. | définition — `knowledge.ts:50` |
| **Exo lourd** | Exo qui ne passe qu'en SC : PA, PM, PO, Invocations, ou toute ligne dont la part au-delà du jet pèse ≥ 30 après la rune. 1 % pour la liste, 3,4 % mesuré pour le poids cumulé. | HYPOTHÈSE COMMUNAUTAIRE (règle) ; SOURCE PRIMAIRE (1 % atteignable PA/PM) ; MODÈLE EMPIRIQUE (3,4 %) — EP `params.probability.heavyExoRule`, `cumulativeRegimeSc` |
| **Exo léger** | Exo sous le seuil de 30 (ex. 1ᵉʳ point de % Do). Chances entre 1/0/99 et 32/50/18 ; le simulateur tire à 32/50/18. | INCONNU — EP `params.probability.unknownIntervalSampling` |
| **Borne des 101 (plafond par effet)** | Limite du poids d'une ligne en over ou en exo ; Ankama donne l'exemple de 101 Force sur une base 60. Le simulateur borne la valeur totale × densité (505 vita). | SOURCE PRIMAIRE — v1.27 (existence) ; HYPOTHÈSE COMMUNAUTAIRE (101, base de mesure) — EP `params.overCapWeight`, `overCapLineBasis` |
| **Plafond par objet** | Limite du total over + exo sur tout l'objet ; empêche PA + PM exo. Valeur non donnée par Ankama. | INCONNU — EP `params.objectNonNaturalCap` |
| **Reliquat (puits serveur)** | Poids perdu en trop lors d'une perte, gardé par le serveur et affiché en jeu ; il paie une partie des pertes suivantes. | SOURCE PRIMAIRE (existence, affichage, formule de création) ; INCONNU (consommation) — EP `params.residualPool.*` ; `S2:74-85` |
| **Budget de poids (planification)** | Calcul de l'atelier à partir des lignes visibles (« combien je libère, combien je consomme »). Ce n'est **pas** le reliquat serveur. | outil du projet — `src/logic/planning/weightBudget.ts:1-15` |
| **SC (succès critique)** | La rune passe, sans perte. | SOURCE PRIMAIRE — `applyRune.ts:12` |
| **SN (succès neutre)** | La rune passe, et l'objet perd le poids de la rune, ligne visée comprise. Au plus 50 % de chances (v1.27). | SOURCE PRIMAIRE (mécanique) ; v1.27 (plafond 50 %) — `applyRune.ts:13-16`, `S1:95` |
| **EC (échec critique)** | La rune ne passe pas, et l'objet perd exactement le poids de la rune. | SOURCE PRIMAIRE — `ERR:33` |
| **Transcendance** | Rune (Ta, Pata, Rata) qui ajoute des points et verrouille l'objet : plus de forgemagie ni d'orbe (≤ 3.6). | SOURCE PRIMAIRE (verrou, 2.58) ; HYPOTHÈSE COMMUNAUTAIRE (refus over/exo, taux 100 %) — EP `params.transcendence.*` |
| **Orbe régénérant** | Objet qui remet un équipement à un jet de craft aléatoire ; refusé sur un objet transcendé (≤ 3.6). | SOURCE PRIMAIRE (refus) ; HYPOTHÈSE COMMUNAUTAIRE (purge) — `orb.ts:4-11` |
| **Brisage** | Destruction d'un objet pour obtenir des runes, selon le poids des lignes, le niveau et un coefficient du serveur. | HYPOTHÈSE COMMUNAUTAIRE — EP `params.brisage.*` |
| **Focus** | Option du brisage : la ligne choisie compte en entier, les autres pour une fraction (0,5). | HYPOTHÈSE COMMUNAUTAIRE — EP `params.brisage.focusOtherLinesFactor` |

(20 termes.)

---

## Aide-nous à mesurer

Liste exhaustive des entrées `INCONNU` (25) et `CONTRADICTION` (7) de `empirical_params.json` (parcours complet du fichier, 2026-09-23). « Protocole non documenté » = aucun texte du dépôt ne dit comment mesurer.

| # | Paramètre | Statut | Ce qu'on ignore | Ce qu'il faudrait observer en jeu pour trancher |
|---|---|---|---|---|
| 1 | `params.objectNonNaturalCap` | INCONNU | La valeur du plafond objet (posée à 101). | « un exo PA (100) et un exo PO (51) coexistent-ils sur un même objet ? Si oui la borne basse remonte à 151 et 101 est réfuté. Test à mener en HDV » — EP l.22 |
| 2 | `params.overCapExcess.lossBasis` | INCONNU | Sur une rune tronquée à la borne, la perte porte-t-elle sur la rune entière ou la part appliquée ? | « À trancher par observation en jeu. » — EP l.74 (protocole détaillé non documenté) |
| 3 | `params.lossSelection.deficitRatio.heavyExponent` | INCONNU | La pente d'épargne des lignes trop lourdes. | « objet Vi + Fo + PA, puits 0, runes de poids 1, au moins 300 pertes relevées — uniforme ≈ 33 % de PA touché, ce modèle ≈ 2 % » — EP l.153 |
| 4 | `params.lossSelection.deficitRatio.lightExponent` | INCONNU | La pente côté lignes légères. | Même expérience (≥ 300 pertes, objet Vi + Fo + PA, puits 0) — EP l.153 |
| 5 | `params.lossSelection.deficitRatio.floor` | INCONNU | Le plancher de probabilité d'une ligne très lourde. | Même expérience — EP l.153 |
| 6 | `params.residualPool.poolConsumptionRule` | INCONNU | Le reliquat paie-t-il toujours en premier et en totalité ? | « ~20 EC sur objet à puits non nul, relevé avant/après » — EP l.220 ; `S2:108-109` |
| 7 | `params.transcendence.maxCurrentValueByRank` | INCONNU | Les seuils de valeur par rang (Ta/Pata/Rata). | « À extraire des effets 2825/2826/2827 du client Unity » — EP l.261 (datamining, pas une observation en jeu) |
| 8 | `params.craft.rollDistribution` | INCONNU | La loi du tirage des jets de craft. | « un relevé de jets bruts (journal d'observations) pourrait le faire » — EP l.294 |
| 9 | `params.probability.model` | INCONNU | Quel modèle SC/SN/EC ressemble au serveur. | Comparaison « avec des observations réelles (data/observations/) » — EP l.310 ; protocole de collecte : `AUD:253-260` (expérience B) |
| 10 | `params.probability.heavyExoIncludeOvermax` | INCONNU | Un overmax naturel ≥ 30 de poids passe-t-il en régime 1 % ? | Protocole non documenté (une seule source, `EXO:128-129`) |
| 11 | `params.probability.ecShare` | INCONNU | Part fixe de l'EC (utilisée seulement si `snSplit = ec_share`). | Protocole non documenté |
| 12 | `params.probability.unknownIntervalSampling` | INCONNU | Où tombe un exo léger dans l'intervalle. | « ≥ 100 tentatives par rang de point (1ᵉʳ, 2ᵉ, 3ᵉ), tally SC / SN / EC séparé » sur % Do distance ou sorts, objet bas niveau à une ou deux lignes, reliquat lu avant chaque tentative — `EXO:131-142` |
| 13 | `params.probability.officialFactorsLinear.a` | INCONNU | Chance de SC d'une ligne au jet parfait (ordonnée). | `AUD:253-260` (expérience B : lignes à 25/50/75/90/100 %, 2 000 tentatives par état) |
| 14 | `params.probability.officialFactorsLinear.b` | INCONNU | Pente selon la distance au jet max. | `AUD:253-260` (expérience B) |
| 15 | `params.probability.officialFactorsLinear.c` | INCONNU | Pente selon le niveau (sens connu : faible, positive). | Protocole non documenté |
| 16 | `params.probability.officialFactorsLinear.d` | INCONNU | Pente selon l'usage de la borne over/exo. | « À estimer par le journal d'observations (N documenté) » — EP l.478 ; `AUD:269-276` (expérience D : 0, 10, 50, 90, 100 de poids non naturel) |
| 17 | `params.probability.officialFactorsLinear.e` | INCONNU | Pente selon la qualité globale de l'objet (facteur le plus important selon Ankama). | Protocole non documenté |
| 18 | `params.probability.structuralFactors.palier80` | INCONNU | Saut de difficulté à 80 % de la fourchette. | `AUD:253-260` (expérience B, hypothèse « seuil à 80% ») |
| 19 | `params.probability.structuralFactors.singleNaturalRoll` | INCONNU | Bonus de facilité des objets à un seul jet. | Protocole non documenté |
| 20 | `params.probability.structuralFactors.ethereal` | INCONNU | Malus des objets éthérés. | Protocole non documenté (la notion n'existe pas encore dans le dataset, EP l.549) |
| 21 | `params.probability.structuralFactors.overExoCount` | INCONNU | Malus par ligne over/exo déjà présente. | Protocole non documenté (l'expérience D de `AUD` fait varier le poids, pas le nombre de lignes) |
| 22 | `params.probability.devblog127.difficultyWeights` | INCONNU | Poids du mélange de difficulté (seul l'ordre est sourcé). | Protocole non documenté |
| 23 | `params.probability.poolRatioLegacy.coefficients` | INCONNU | Ancien modèle inventé, gardé pour comparaison. | Sans objet (modèle conservé pour comparaison, EP l.608) |
| 24 | `params.probability.lookupTable.table` | INCONNU | Table à remplir par des joueurs expérimentés. | Protocole non documenté (« gabarit à remplir », EP l.720) |
| 25 | `params.brisage.podsDivisor` | INCONNU | Pourquoi les Pods sont divisés par 2,5. | `AUD:285-291` (expérience F : 100 brisages par configuration) |
| 26 | `params.brisage.podsDivisorOnNonFocusLines` | CONTRADICTION | Pods non focalisés divisés ou non. | `AUD:285-291` (expérience F, variable « focus ») |
| 27 | `params.brisage.nonPositiveLineContribution` | CONTRADICTION | Lignes nulles/négatives ignorées ou comptées. | `AUD:285-291` (expérience F, variable « malus ») |
| 28 | `params.potions.damageKeptPercentByLevel` | CONTRADICTION | Part des dégâts conservée par palier. | « dégâts d'une arme avant et après potion, pour chaque palier (20 et 80), sur deux armes de fourchettes différentes […] Deux mesures par palier suffisent » — EP l.911 |
| 29 | `densities.40` (Pods) | CONTRADICTION | 0,25 ou 2,5 par pod. | Lecture en infobulle consignée dans `data/observations/tooltips` (règle EP l.1557) ; extraction `effectPowerRate` proposée (`ANA:139`, non validée) |
| 30 | `densities.50` (Renvoi de dommages) | CONTRADICTION | 5 ou 10. | « EC/SN contrôlé sur une ligne renvoi, lire la densité perdue (déjà 5 côté utilisateur — confirmer sur N tentatives) » — `X:137` |
| 31 | `densities.78` (Fuite) | CONTRADICTION | 4 ou 5. | « À consigner dans data/observations/tooltips avant promotion. » — EP densities.78 note |
| 32 | `densities.79` (Tacle) | CONTRADICTION | 4 ou 5. | « À consigner dans data/observations/tooltips avant promotion. » — EP densities.79 note |

À noter (hors comptage, statut de champ ≠ note) : `params.overCapScope` a le statut HYPOTHÈSE COMMUNAUTAIRE mais sa note le dit « CONTRADICTION depuis le 2026-09-07 ». Mesure documentée : « un objet portant un exo PA (100) ET un over ≥ 2 de poids sur une autre ligne (ex. 211/200 vita) réfute le cumul » (EP l.33 ; `ERR:46`).

---

## Prose périmée (`src/content/knowledge.ts`)

| # | Ligne | Phrase actuelle (extrait) | Problème | Correction | Citation |
|---|---|---|---|---|---|
| 1 | 24 | « Elles n'ont pas encore été réextraites du client : le tableau ci-dessous vient de tables communautaires convergentes » | Onze densités sont désormais SOURCE PRIMAIRE (lecture en jeu ou reliquat). | « Onze densités sont lues en jeu ; les autres viennent de tables communautaires. » | EP densities.11, .18, .27, .28, .44, .69, .70, .82, .83, .121, .124 ; ERR:40-43 |
| 2 | 25 | « L'API DofusDB, dont vient le dataset local, n'expose aucune densité » | Contesté par `ANA:92` (`effectPowerRate` = densités, client 3.6.12.16) ; EP l.1557 et ERR:54 disent l'inverse. | Présenter comme CONTRADICTION documentaire, extraction P3 en attente. | ANA:92, ANA:139 ; EP:1557 ; ERR:54 |
| 3 | 33 | « Une perte est d'abord absorbée par le reliquat, puis retirée sur une ligne » | Présenté comme un fait ; la règle de consommation est INCONNU (anomalie A1, Tofus : over/exo avant le puits). La perte peut aussi toucher plusieurs lignes. | « Le simulateur fait payer le reliquat d'abord ; la vraie règle est inconnue. La perte peut toucher plusieurs lignes. » | EP params.residualPool.poolConsumptionRule ; ANA:95 ; EP:1564 |
| 4 | 35 | « La quantité retirée sur une ligne en succès neutre, elle, dépasse parfois le minimum nécessaire sans loi connue. » | Il existe maintenant un MODÈLE EMPIRIQUE (N = 6) : ceil + un point avec p ≈ 0,67 quand le compte tombe juste. | Citer `quantization = ceil_random_extra` et `exactRatioExtraPointChance`. | EP params.lossSelection.quantization, exactRatioExtraPointChance ; ERR:10 |
| 5 | 36 | « une tentative d'over ou un exotique n'ont aucun plancher connu, et le modèle peut y descendre à zéro » | Faux pour l'exo lourd (1 %) et le régime poids cumulé (3,4 %) ; l'exo léger est tiré à 32/50/18. Vrai seulement pour over et exo léger. Portée du 15 % elle-même discutée (P7). | « Over et exo léger : aucun plancher officiel. Exo lourd : 1 %. » | constraints.ts:83-93 ; EP params.probability.cumulativeRegimeSc, unknownIntervalSampling ; ANA:152 |
| 6 | 50 | « Une borne pratique de poids ajouté est largement attestée par les guides récents. » | L'existence du plafond par effet est SOURCE PRIMAIRE v1.27 ; il y a deux plafonds distincts, le cumul objet se mesure contre `objectNonNaturalCap` (INCONNU) depuis le 2026-09-10. La prose ne parle que d'une borne. | Présenter les deux plafonds et leurs statuts. | EP params.overCapWeight (l.11), params.objectNonNaturalCap, params.overCapScope note (fin l.33) ; ERR:18 ; ARB:41-55 |
| 7 | 50 | « lecture cumulée que suggèrent les exemples d'un guide récent […] La lecture par ligne reste disponible » | Ne signale pas que la portée est en CONTRADICTION selon la note du paramètre et `ANA:97` (Tofus, Dafous : par ligne). | Ajouter le statut CONTRADICTION (ou aligner le champ de statut). | EP params.overCapScope (l.33) ; ANA:97 |
| 8 | 59 | « Une rune de transcendance se pose sans perte » | Le taux 100 % est HYPOTHÈSE COMMUNAUTAIRE (effet 2827 à 0 dans l'API). | « Le simulateur la pose comme un SC garanti (taux 100 % selon le wiki, non vérifié). » | EP params.transcendence.successRateByRank |
| 9 | 59, 63 | « plus aucune forgemagie, plus aucune réinitialisation par orbe » | Vrai ≤ 3.6 pour l'orbe ; depuis la 3.6, potions et gravures d'élément restent possibles ; la 3.7 bêta permet l'orbe sur un objet transcendé. | Préciser la version et l'exception potions/gravures. | REC:14-16, REC:25 ; ANA:154-155 |
| 10 | 72 | « ce qui en fait un modèle empirique et non une règle » | Les paramètres du brisage sont HYPOTHÈSE COMMUNAUTAIRE, pas MODÈLE EMPIRIQUE (aucun N documenté par le projet). | « une hypothèse communautaire, pas une règle ». | EP params.brisage.levelFactor, constantOffset, focusOtherLinesFactor ; ANA:101 |
| 11 | 81 | « il propose des modèles paramétrés, tous marqués inconnus » | `snSplit` et `cumulativeRegimeSc` sont MODÈLE EMPIRIQUE depuis le 2026-09-23. | « Le modèle de SC est inconnu ; la répartition SN/EC et le régime poids cumulé sont des modèles empiriques. » | EP params.probability.snSplit, cumulativeRegimeSc ; ERR:8-9 |
| 12 | 82 | « un taux bien plus bas pour les exotiques PA, PM et PO, auquel le simulateur se tient sans jamais proposer mieux » | La liste inclut les Invocations depuis le 2026-09-16 ; Ankama ne nomme que PA et PM ; le 1 % est un plancher atteignable, son usage comme valeur est une POLITIQUE. | « 1 % atteignable pour un exo PA ou PM (tutoriel) ; le simulateur l'applique aussi à PO et Invocations. » | EP params.probability.heavyExoCharacteristics ; constraints.ts:71 ; ERR:13, ERR:26 |
| 13 | 82 | « Le devblog de deux mille dix énumère six facteurs de difficulté » | La phrase en énumère ensuite huit (voir `S1:80-95`) ; « six » vient de `ERR:19`. Incohérence de décompte, pas de valeur. | Supprimer le nombre ou recompter. | S1:80-95 ; ERR:19 |
| 14 | 83 | « Le facteur le plus important […] manquait au modèle jusqu'au dix septembre. » | Laisse entendre que c'est réglé ; la pente `e` vaut toujours 0, donc le modèle ne distingue toujours pas les deux cas. | Ajouter : « il est câblé, mais sans effet tant que sa pente n'est pas mesurée ». | EP params.probability.officialFactorsLinear.e (l.485-494) |
| 15 | 84 | « Pour un exotique PA, PM ou PO, le taux officiel s'applique tel quel. Pour tout autre exotique, le simulateur affiche un intervalle » | Oublie les Invocations et la règle du poids cumulé (2ᵉ point de % Do : régime SC seul, 3,4 %). Le tirage de l'exo léger se fait à 32/50/18. | Décrire les trois cas : liste (1 %), poids cumulé (3,4 %), exo léger (intervalle, tirage à la borne haute). | EP params.probability.heavyExoRule, cumulativeRegimeSc, unknownIntervalSampling ; ERR:11-12 |
| 16 | 89 | « Taux officiel bien plus bas pour les exotiques PA, PM et PO, appliqué comme plafond autant que comme plancher (tutoriel officiel). » (liste « certain ») | Le tutoriel ne nomme que PA et PM et dit « peut descendre jusqu'à » ; l'usage en plafond est une POLITIQUE ; PO et Invocations sont HYPOTHÈSE COMMUNAUTAIRE. Ne doit pas figurer dans « certain ». | « 1 % atteignable pour un exo PA ou PM (tutoriel). » ; le reste en « Pas sûr ». | constraints.ts:28-71 ; ERR:15, ERR:26 |
| 17 | 90 | « Le succès neutre ne dépasse jamais la moitié des chances (devblog 1.27). » (liste « certain ») | SOURCE PRIMAIRE v1.27 : transposition à Unity HYPOTHÈSE. La répartition utilisée est MODÈLE EMPIRIQUE. | Ajouter « (règle de 2010, supposée valable sur Unity) ». | S1:47-52, S1:95 ; EP params.probability.snSplit |
| 18 | 91 | « Un succès neutre impossible ne fait rien : ni gain, ni perte, ni reliquat (devblog 1.27). » | v1.27, jamais observé sur Unity ; la rune est consommée (INCONNU). | Ajouter la réserve de version et « rune consommée : inconnu ». | EP params.lossSelection.unpayableSn (l.116-117) |
| 19 | 108, 111 | « Le refus sur un objet transcendé est, lui, une règle officielle. » | Vrai jusqu'à la 3.6 ; la 3.7 bêta (17/09/2026) l'inverse. | Préciser « (devblog 2.58, jusqu'à la 3.6 ; changement annoncé en 3.7 bêta) ». | REC:25 ; ANA:154 |
| 20 | 99 | « Aucune valeur n'est donc posée par défaut » (potions) | Pas faux, mais incomplet : la 3.7 bêta annonce 85 % → 100 % et 50 % → 10 % (P8 non validée). | Mentionner la patch note bêta comme piste, sans valeur codée. | REC:20-22 ; ANA:153, ANA:165 |

---

## Parcours d'une rune

Pipeline de référence (`CLAUDE.md`, « Pipeline de référence ») tel que codé (`src/logic/engine/applyRune.ts:4-6`). L'issue SC/SN/EC est tirée hors de `applyRune` (`useAtelier.ts`, `monteCarlo.ts`) puis passée en argument (`applyRune.ts:8-9`).

| Étape | Phrase | Bloc |
|---|---|---|
| 1. Lire l'objet | Le simulateur lit les lignes, leur valeur et le reliquat de l'objet. | §1 Poids et densités ; §3 Pertes et reliquat |
| 2. Peser la rune et vérifier les limites | Il calcule le poids de la rune, refuse si l'objet est transcendé, et arrête la rune à la borne d'over/exo si besoin. | §1 Poids ; §4 Over et exo ; §5 Transcendance |
| 3. Tirer l'issue | Un modèle donne les chances de SC, SN et EC, puis les bornes officielles (15 % ; 1 %) s'appliquent. | §2 Chances |
| 4. Appliquer le résultat | SC : la rune passe ; SN : la rune passe et une perte est due ; EC : la rune ne passe pas et une perte est due. | §2 Chances ; §3 Pertes |
| 5. Choisir les pertes | Le reliquat paie d'abord, puis une loi choisit les lignes qui perdent et combien de points. | §3 Pertes et reliquat |
| 6. Mettre à jour | Le surplus perdu devient le nouveau reliquat, et l'objet est enregistré. | §3 Pertes et reliquat |
