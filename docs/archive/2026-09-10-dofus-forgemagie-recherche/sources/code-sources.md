# Forgemagie DOFUS — Sources de CODE trouvées (recherche technique)

Objectif : retrouver l'algorithme exact de la forgemagie via du code source public.
Date : 2026-09-09. Tous les dépôts ci-dessous sont clonés dans `/home/claude/fm-research/repos/`.
Extraits d'algorithme copiés dans `/home/claude/fm-research/sources/code/`.

**Avertissement méthodologique** : Ankama n'a jamais publié l'algorithme. Les émulateurs
sont des *rétro-ingénieries approximatives* calibrées empiriquement, PAS le code d'Ankama.
Les modules client (SmithMagic) donnent en revanche les **tables de poids exactes**, car
celles-ci sont observables/vérifiables en jeu. Fiabilité : tables de poids = haute ;
formule de probabilité = plausible mais non canonique.

---

## 1. DofMod/SmithMagic + alucas/DofusModulesUtils — TABLE DE POIDS (Dofus 2.x) ⭐ fiabilité haute

- URL module : https://github.com/DofMod/SmithMagic
- URL lib (poids) : https://github.com/alucas/DofusModulesUtils
- Nature : module client officiel (AS3) posé au-dessus de l'interface FM d'Ankama.
  Affiche poids des runes, poids des effets, et **calcule la valeur du puits**.
- Fichiers copiés : `code/01_dmUtils_SmithMagic/`
  - `RuneWeightEnum.as` — table de poids complète, bonus ET malus
  - `SmithmagicUtils.as` — `getEffectWeight(effectId)` + `getRuneSubtype()` (1=simple, 2=Pa, 3=Ra)
  - `SmithMagicUi.as` — calcul du puits côté client (lignes ~300-345)

### Table de poids (bonus) — Dofus 2.x
```
Initiative 0.1 | Vie/Vitalité/Pods 0.25 | Force/Intel/Chance/Agi 1
Dommages% / Piège% / Résistances fixes / Rés. critique / Rés. poussée 2
Sagesse / Prospection 3 | Tacle / Fuite 4
Dommages élémentaires (Neutre/Feu/Air/Terre/Eau/Poussée) / Chasse 5
Résistances % élémentaires 6
Esquive PA / Esquive PM / Retrait PA / Retrait PM 7
Dommages Piège 15 | Soins / Dommages 20
Critiques / Invocation / Dommages Renvoyés 30
PO 51 | PM 90 | PA 100
```
### Table de poids (malus) — asymétrique !
```
Initiative 0.05 | Vitalité 0.2 | Force/Intel/Chance/Agi/Rés.crit 1
Sagesse/Prospection/Tacle/Fuite 2 | Dommages élém. 2.5
Dom. Poussée / Rés.% élém. 3 | Esquive+Retrait PA/PM 4
Rés. Poussée 5 | PO 51 | PM 90 | PA 100
```

### Formule du puits (SmithMagicUi.as, ~l.300-345)
```
pour chaque effet modifié par le passage de rune :
  si effet apparu      -> weightGains  += newValue * poids(effet)
  si effet disparu     -> weightLosses += oldValue * poids(effet)
  si valeur augmentée  -> weightGains  += (new - old) * poids(effet)
  si valeur diminuée   -> weightLosses += (old - new) * poids(effet)
nouveau_puits = puits + weightLosses - runeWeight
```
`runeWeight = poids(effet_de_la_rune) * rune.effects[0].parameter0`

---

## 2. lilgallon (N3ROO)/dofus-tools — liste rune→poids en JS + calculateur de puits

- URL : https://github.com/lilgallon/dofus-tools (démo : https://gallon.dev/dofus-tools/forgemagie)
- Fichiers copiés : `code/04_dofus-tools_JS/runes.js` (95 runes, 3 catégories simple/Pa/Ra),
  `forgemagie.js` (logique du compteur de puits)
- Extrait : `{ label: "Rune Ga Pa", weight: "100" }`, `Rune Ga Pme` 90, `Rune Do` 20,
  `Rune Cri` 10, `Rune Do Per Ar/Di/Mé/So` 15, `Rune de chasse` -1 (sic).
- Logique puits : `puit = poids(rune_qui_a_sauté) - poids(rune_ajoutée)`, puis décrément
  à chaque rune ajoutée depuis le puits.
- Scripts Python `py/download_all_runes.py` + `retrieve_runes_list.py` = pipeline pour
  régénérer la table depuis les serveurs Ankama (utile pour actualiser en Dofus 3).

---

## 3. StarLoco/StarLoco-Game — ⭐ IMPLÉMENTATION SERVEUR LA PLUS COMPLÈTE (Dofus 1.39.8)

- URL : https://github.com/StarLoco/StarLoco-Game
- Nature : « most advanced dofus 1.39.8 public emulator », Java, maintenu.
- **Seule implémentation trouvée qui modélise les 3 issues (SC / SN / EC) + un vrai puits persistant sur l'objet.**
- Fichiers copiés : `code/05_StarLoco_1.39/`
  - `Formulas_chanceFM.java` — la formule de probabilité (source : `common/Formulas.java` l.945)
  - `JobAction_FM_core.java` — appelant, coefficients, gestion over-max (`job/JobAction.java` l.1000-1420)
  - `JobAction_weight_tables.java` — `getPwrPerEffet()` (47 cases) et `getOverPerEffet()` (plafonds d'over)
  - `GameObject_echec_critique.java` — algorithme de perte sur échec critique (`object/GameObject.java` l.872+)
  - `Constant_stat_ids.java` — mapping ID d'effet → nom

### Formule de probabilité (Formulas.chanceFM)
```java
// c : pénalité de sur-jet. Reste à 1 tant que le jet ne dépasse pas 80% du max.
float m1 = maxStat - (actualStat + statsAdd), m2 = maxStat - minStat;
float c = 1;
if      ((1 - m1/m2) > 1.0) c = (1 - ((1 - m1/m2) / 2)) / 2;   // au-dessus de 100% : chute forte
else if ((1 - m1/m2) > 0.8) c =  1 - ((1 - m1/m2) / 2);        // 80-100% : chute modérée
if (c < 0) c = 0;

int   moyenne = floor(PWRmax - (PWRmax - PWRmin)/2);
float mStat   = min(1.2f, (float)moyenne / (float)PWRg);  // bon jet global => moins de chances

float a = (PWRmax + diff) * coef * mStat * c * x * rateFm;
float b = sqrt(PWRg + PWRcarac) + poidsRune;   if (b < 1) b = 1;

int p1 = floor(a / b);      // Succès CRITIQUE
if (bonusRune) p1 += 20;
if      (p1 < 1)   { p1 = 1;  p2 = 0;  p3 = 99; }
else if (p1 > 100) { p1 = 66; p2 = 34; }
else if (p1 > 66)    p1 = 66;               // plafond dur à 66%

if (p2 == 0 && p3 == 0) {                    // Succès NEUTRE
    p2 = floor(a / sqrt(PWRg + PWRcarac));   // NB : sans le +poidsRune au dénominateur
    p2 = min(p2, 100 - p1);
    p2 = min(p2, 50);
}
// tirage : r = rand(1,100) ; SC si r <= p1 ; SN si r <= p1+p2 ; sinon EC
```
Variables : `PWRmax` = poids total max de l'objet de base, `PWRmin` = poids total min,
`PWRg` = poids total actuel de l'objet, `PWRcarac` = poids de la carac visée,
`poidsRune = statsAdd * poidsParEffet(effet)`, `diff = |PWRmax*1.3 - PWRg|`.

### Coefficients `coef` (JobAction l.1099-1109)
```
carac présente sur l'objet de base                       coef = 1.00
carac présente en NÉGATIF de base et négative sur l'objet coef = 0.50
carac ABSENTE de l'objet de base (exotique)               coef = coefExo = 0.25
```
### Facteur `x` (over-max)
`x = 1` normalement ; `x = 0.8` si `jetActuel > statMax` ; FM interdite si
`jetActuel >= statMax + getOverPerEffet(effet)` (ex. PA over +1, Vita +404, CC +3).

### Bonus puits (JobAction l.1145-1152) — important pour un simulateur
```java
if (objectFm.getPuit() >= statsAdd)      // puits suffisant
    if (rand(1,2) == 1) successC = true; // 50% de forcer un succès critique
```
### Algorithme de PERTE sur échec critique (GameObject.parseStringStatsEC_FM)
```java
keys = shuffle(toutes les caracs de l'objet)   // ordre ALÉATOIRE
// puis on force l'over-FM en tête de liste pour qu'il soit détruit en priorité
double perte = 0;
pour chaque carac (dans cet ordre) :
    si (perte > poidsRune || carac == carac_visée)  -> inchangée   // on s'arrête une fois
                                                                    // le poids de la rune "remboursé"
    si carac est un MALUS (152,154,155,157,116,153) -> value += max(1, value*poidsRune/100)
                                                       plafonné au max de base
    si carac == 127 (retrait PM) ou 101 (retrait PA) -> ignorée (jamais de négatif)
    sinon :
        si over-FM : chute = value - value*(poidsRune - floor(perte))*2/100   // double peine
        sinon      : chute = value - value*(poidsRune - floor(perte))  /100
        si chute/value < 0.75 -> chute = value*0.75   // on ne perd jamais plus de 25% d'une stat d'un coup
        perte += (value - chute) * poidsParEffet(carac)
```
### Mise à jour du puits après jet (JobAction l.1365)
```java
objectFm.setPuit(objectFm.getPuit() + pwrPerte - poidsRune);
// pwrPerte = PWRg_avant - PWRg_après (0 en cas de succès)
```

---

## 4. Romain-P/Ancestra-Evolutive — implémentation 1.29 (lignée Ancestra) ⭐ table de poids retro

- URL : https://github.com/Romain-P/Ancestra-Evolutive
- Fichiers copiés : `code/03_AncestraEvolutive_1.29/`
  - `Formulas_ChanceFM.java`, `Job_FM_core.java`, `Objet_poids_and_echec.java`, `Job_helpers.txt`
- Version *plus simple* (2 issues : succès / échec total), utile comme modèle de référence minimal.

### Formule (Formulas.ChanceFM, l.860)
```java
int a = poidItemBase + poidBaseJet + (Puis * 2);          // Puis = poidBase - poidActuel (le "puits")
int b = (int) sqrt(poidItemActual + poidActualJet + poidRune);  if (b <= 0) b = 1;
Chance = floor((a / b) * Coef);
// clamp 1..100 ; tirage : succès si Chance >= rand(1,100)
```
### Coefficients (Job.java l.1018-1035)
```java
Coef = 1     si carac présente sur l'objet de base
Coef = 0.75  si carac présente en négatif de base et négative sur l'objet
Coef = 0.25  si carac absente de l'objet de base (exotique)
double JetMax = BaseMaxJet * (2 - (niveauObjet / 100));       // plafond d'over
Coef = Coef * ((JetMax - jetActuel) / 25);   if (Coef <= 0) Coef = 0;
```
### Changement d'élément (rune Pa/Ra de puissance)
```java
calculElementChangeChance(lvlMétier, lvlObjet, lvlRune):
    K = 100 si rune lvl 1 ; 175 si lvl 25 ; 350 si lvl 50
    return (lvlMétier * 100) / (K + lvlObjet)
    // clampé entre lvlMétier/20 et 100 - lvlMétier/20
// puis les dommages sont recalculés à coef% : 50% (lvl1), 65% (lvl25), 85% (lvl50)
```
### Table de poids 1.29 par statID (Objet.getPoidOfActualItem / getPoidOfBaseItem)
```
118 Force,126 Intel,125 Vita,119 Agi,123 Chance,158 Pods,174 Initiative  x1
138 Dommages%, 666 Dom. renvoyés, 226/220 Piège%                          x2
124 Sagesse, 176 Prospection                                             x3
240-244 Rés. fixes (Feu/Air/Eau/Terre/Neutre)                            x4
210-214 Rés. % (Feu/Air/Eau/Terre/Neutre)                                x5
225 Piège  x15 | 178 Soins, 112 Dommages x20 | 115 Critiques, 182 Invoc x30
117 PO x50 | 128 PM x90 | 111 PA x100
poids_objet = Σ (valeur_carac * multiplicateur)
```
⚠️ Divergences vs table Dofus 2 : PO 50 vs 51, Rés. fixes 4 vs 2, Rés.% 5 vs 6,
Initiative 1 vs 0.1, Vita 1 vs 0.25. La table 1.29 est plus grossière (entiers).

### Perte sur échec (Objet.parseFMEchecStatsString)
```java
caracs négatives (152,154,155,157,116,153) : value += max(1, value*poid/100), plafonné au max de base
127 (retrait PM), 101 (retrait PA) : ignorées
autres : chute = floor(value - value*poid/100)   // pas de plancher à -25% ici
```

---

## 5. Dysta/Nao — émulateur 1.29 (fork Ancestra Remake), variante de la formule

- URL : https://github.com/Dysta/Nao
- Fichiers copiés : `code/02_Nao_emu_1.29/`
  - `Formulas_FM.java` (l.1123 `chanceFM`, l.1521 `calculateChanceByElement`)
  - `Job_doFmCraft.java` (l.543-1403) — **table complète templateID de rune → (statID, statsAdd, poids)**
  - `Job_weight_helpers.java`
### Formule (variante « diff » proche de StarLoco mais sans SC/SN)
```java
float a = (WeightTotalBase + diff) * coef * RATE_FM;
float b = sqrt(currentWeithTotal + currentWeightStats) + weight;  if (b < 1) b = 1;
chance = (int)(a / b);
// coef : 1.0 (base) / 0.50 (négatif) / 0.25 (exo) ; 0.15 si jet déjà >= max de base
// diff = (int)(WeightTotalBase * 1.3f) - currentWeightTotal
// + 20 si rune bonus ; clamp 1..100
```
### Table rune → poids (extraits, IDs d'items 1.29)
```
1519 Force(76) +1 poids1   | 1521 Sagesse(7c) +1 poids6  | 1522 Intel(7e) +1 poids1
1523 Vita(7d)  +3 poids1   | 1524 Chance(77) +1 poids1   | 1525 Agi(7b)  +1 poids1
1545 Fo+3 p3 | 1546 Sa+3 p18 | 1547 In+3 p3 | 1548 Vi+10 p10 | 1549 Ch+3 p3 | 1550 Ag+3 p10
1551 Fo+10 p10 | 1552 Sa+10 p50 | 1553 In+10 p10 | 1554 Vi+30 p10 | 1555 Ch+10 p10 | 1556 Ag+10 p10
1557 PA(6f) +1 poids 100   | 1558 PM(80) +1 poids 90
```

---

## 6. reben/AncestraRemake — ancêtre commun (même code que #4)

- URL : https://github.com/reben/AncestraRemake
- Fichier : `revision55/src/game/objects/Metier.java` l.1036-1250 — code **identique** à
  Ancestra-Evolutive (`ChanceFM(poidBase, poidActual, BaseMaxJet, ActualJet, poid, Puis, Coef)`).
- Intérêt : confirme la lignée Ancestra → Ancestra-Evolutive → Nao → StarLoco.
  Utile pour dater l'évolution de la formule, pas de nouvelle information.

---

## 7. Pistes explorées SANS résultat exploitable

| Dépôt / piste | URL | Verdict |
|---|---|---|
| Vicfou-dev/dofus-fm-server | https://github.com/Vicfou-dev/dofus-fm-server | Vitrine seulement (README + png), bot propriétaire |
| hoboris/EasyFM | https://github.com/hoboris/EasyFM | 404 au clone (dépôt supprimé/privé) |
| Arakne/Araknemu | https://github.com/Arakne/Araknemu | Serveur 1.29 propre mais **FM non implémentée** |
| Emudofus/Shivas | https://github.com/Emudofus/Shivas | Pas de FM (seulement `ItemTypeEnum`) |
| Romain-P/Jumbo | https://github.com/Romain-P/Jumbo | Pas de FM |
| Dysta/Dofutils | https://github.com/Dysta/Dofutils | Outils, pas de FM |
| dofusdude (API/SDK) | https://github.com/dofusdude | Données d'items Dofus 2/3, **pas de poids de runes** ni d'algo |
| API GitHub code search | api.github.com/search/code | Bloqué par le proxy (403) — recherche par clonage utilisée à la place |

Autres calculateurs web (closed source, utiles pour valider numériquement) :
xixou.io/forgemagie, gallon.dev/dofus-tools/forgemagie, geneka.net/forgemagie,
dofusfashionista.gg/forgemagie.

---

## Recommandation pour le simulateur

1. **Poids** : prendre `01_dmUtils_SmithMagic/SmithmagicUtils.as` (Dofus 2/3) ou
   `03_AncestraEvolutive_1.29/Objet_poids_and_echec.java` (Retro 1.29). Ce sont les
   seules données de haute fiabilité.
2. **Puits** : la formule SmithMagic (`puits += pertes - poidsRune`) est la référence
   client, vérifiée en jeu.
3. **Probabilités** : partir de `05_StarLoco_1.39/Formulas_chanceFM.java` (seule à
   modéliser SC/SN/EC + puits), puis **recalibrer** les constantes (66, 50, 1.2, 1.3,
   0.8, 25) sur des données réelles — elles sont empiriques, pas canoniques.
4. **Perte sur EC** : `05_StarLoco_1.39/GameObject_echec_critique.java` — l'ordre
   aléatoire des caracs, la priorité à l'over-FM, la double peine sur l'over et le
   plancher à -25% sont des comportements observés en jeu et méritent d'être reproduits.
