# SPÉCIFICATION D'ALGORITHME — SIMULATEUR DE FORGEMAGIE DOFUS

> Document d'implémentation. Cible : quelqu'un qui code un simulateur.
> Rédigé à partir de `sources/mecaniques.md`, `sources/datasets.md`, `sources/createurs.md`,
> `sources/code-sources.md` et d'une relecture directe du code des dépôts
> (`repos/StarLoco-Game`, `repos/Ancestra-Evolutive`, `repos/Nao`, `repos/dmUtils`,
> `repos/SmithMagic`, `repos/dofus-tools`).
> Implémentation de référence : `reference_impl/fm_sim.py`.

## Convention de fiabilité utilisée dans TOUT ce document

| Marque | Signification |
|---|---|
| **[OBS]** | **Observé / vérifiable** : donnée de jeu, dump serveur, module client, ou déclaration Ankama. |
| **[CODE]** | **Recopié d'un code source réel** (émulateur ou module client). Vrai *dans ce code*, pas forcément chez Ankama. |
| **[CONS]** | **Consensus communautaire** : répété de façon cohérente par ≥3 sources indépendantes anciennes. |
| **[SUPP]** | **Supposé** : hypothèse de modélisation, valeur arbitraire, ou témoignage isolé. À calibrer. |

**Avertissement fondateur — à lire avant de coder quoi que ce soit.**
Ankama n'a **jamais** publié l'algorithme de forgemagie et a explicitement refusé de le faire
(Devblog 2.29, 25/05/2015 : le reliquat et les probabilités ne sont volontairement pas affichés
« afin de laisser une place importante et suffisante à l'expérience […] des joueurs »). **[OBS]**
Il n'existe **aucun** jeu de données brut public de tentatives de FM (une seule expérience
à grand échantillon existe : 10 000 tentatives d'exo PM → 111 succès). **[OBS]**

**Conséquence structurante pour l'architecture du simulateur :**
> Le **modèle d'état** (poids, puits, over, exos, caps) est solide et reproductible à ~95 %.
> La **fonction de probabilité** est un modèle empirique, **paramétrable**, et doit être
> conçue dès le départ pour être **recalibrée** (cf. §12). Ne jamais coder une constante en dur.

---

# 1. MODÈLE D'ÉTAT

## 1.1 Entités

```
Stat            : identifiant de caractéristique (ex. "force", "vitalite", "pa", "res_pct_feu")
                  → clé dans les tables de poids

Effect (ligne)  : {
                    stat        : Stat
                    jet_min     : int      # borne basse du jet naturel du template
                    jet_max     : int      # borne haute du jet naturel du template (0 si la ligne
                                           #   n'existe pas nativement → ligne EXOTIQUE)
                    value       : int      # valeur courante sur l'objet (peut être > jet_max = OVER)
                    is_negative : bool     # la ligne est un MALUS natif (ex. -20 initiative)
                  }

Item            : {
                    template_id : int
                    level       : int
                    effects     : list[Effect]     # lignes présentes ACTUELLEMENT
                    template    : list[Effect]     # lignes du TEMPLATE (jet_min/jet_max natifs)
                    puits       : float            # reliquat, >= 0
                  }

Rune            : {
                    name        : str
                    stat        : Stat
                    add         : int      # valeur de stat ajoutée en cas de succès (ex. Pa Fo → 3)
                    tier        : 1|2|3    # simple / Pa / Ra  (informatif, pas utilisé dans le calcul)
                  }
```

### Notes d'implémentation

* Une ligne dont `value` tombe à 0 **disparaît** de `item.effects` (« la stat saute ») mais
  reste dans `item.template` : elle peut être remontée plus tard, elle n'est PAS devenue exotique. **[CODE]**
  (StarLoco `GameObject.parseStringStatsEC_FM` : `if (newstats < 1) continue;` → la ligne n'est pas
  ré-émise dans la chaîne de stats.)
* Une ligne **exotique** = `stat` absente de `item.template`. Elle est créée par le premier SC
  d'une rune sur cette stat.
* Une ligne **over** = `value > jet_max` avec `jet_max > 0`.
* `puits` doit être stocké **sur l'objet** et remis à 0 à toute sortie du contexte de FM
  (équipement, banque, échange, HDV, déconnexion). **[CONS]**
  Ne pas modéliser cette remise à zéro dans le cœur de la simulation ; l'exposer comme
  `item.reset_puits()` appelée par le scénario.

## 1.2 État dérivé (recalculé à chaque tentative, jamais stocké)

```
poids_ligne(e)        = e.value   * COEF[e.stat]                    (bonus)
                      = e.value   * COEF_MALUS[e.stat]              (si e.is_negative)
poids_ligne_min(e)    = e.jet_min * COEF[e.stat]
poids_ligne_max(e)    = e.jet_max * COEF[e.stat]

PWRg   (poids courant)= Σ poids_ligne(e)          pour e ∈ item.effects
PWRmax (poids max)    = Σ poids_ligne_max(t)      pour t ∈ item.template
PWRmin (poids min)    = Σ poids_ligne_min(t)      pour t ∈ item.template
PWRcarac              = poids_ligne(ligne visée)  (0 si la ligne n'existe pas encore)
poids_rune(r)         = r.add * COEF[r.stat]      (voir §2.4 pour le cas des lignes négatives)
poids_over_exo(e)     = max(0, poids_ligne(e) − poids_ligne_max(e))
                        # pour une ligne exotique, jet_max = 0 → tout le poids est "exotique"
```

`PWRmax` / `PWRmin` / `PWRg` sont les notations **du DevBlog Ankama 1.27** lui-même
(relayé sous les noms `PWRGmax`, `PWRGmin`, `PWRmax`, `PWRmin`) **[OBS]** — et ce sont
exactement les noms de variables de `StarLoco Formulas.chanceFM`. **[CODE]**
Ce n'est pas une coïncidence : l'émulateur est une réimplémentation de la description du DevBlog.
**C'est l'argument le plus fort en faveur de la formule StarLoco comme point de départ.**

---

# 2. POIDS (« DENSITÉ DE RUNE » dans le vocabulaire officiel depuis la 2.58)

## 2.1 Principe

```
poids d'une rune  = valeur ajoutée par la rune × coefficient de poids de la caractéristique
poids d'une ligne = valeur actuelle de la stat  × coefficient de poids de la caractéristique
poids de l'objet  = Σ poids de chaque ligne
```
**[CONS]** universel. Vérification croisée : `Pa Do Neutre` ajoute 3 dégâts, coef 5 → poids 15 ✅
(table lilgallon, scrapée des serveurs Dofus).

⚠️ **1 Ra ≠ 3 Pa en valeur de stat.** Hiérarchie réelle : simple = ×1, Pa = ×3, Ra = ×10. **[OBS]**

## 2.2 TABLE DOFUS 2.x / 3.x — coefficient de poids par point de stat (BONUS)

Source primaire : `repos/dmUtils/src/enums/RuneWeightEnum.as` (module client SmithMagic
d'ExiTeD/Relena, celui-là même dont Ankama s'est inspiré pour refondre l'interface FM en 2.29),
recoupée avec `data/runes_weights_lilgallon.csv` (92 runes scrapées des serveurs Dofus). **[OBS]**

| Caractéristique | Coef | Overmax (= ⌊101/coef⌋) |
|---|---:|---:|
| Initiative | 0.1 | 1010 |
| Vitalité / Vie / Pods | 0.25 † | 404 |
| Force / Intelligence / Chance / Agilité | 1 | 101 |
| % Dommages, % Dommages Pièges | 2 | 50 |
| Résistances fixes (Air/Eau/Feu/Terre/Neutre/Poussée/Critique) | 2 | 50 |
| Sagesse / Prospection | 3 | 33 |
| Tacle / Fuite | 4 | 25 |
| Dommages élémentaires (Neu/Feu/Air/Terre/Eau/Poussée), Chasse | 5 | 20 |
| % Résistances élémentaires | 6 | 16 |
| Esquive PA / Esquive PM / Retrait PA / Retrait PM | 7 | 14 |
| Dommages Pièges | 15 | 6 |
| % Dommages Mêlée / Distance / Armes / Sorts, % Rés Mêlée / Distance | 15 | 6 |
| Soins | 20 ‡ | 5 |
| Dommages (fixe, générique) | 20 | 5 |
| % Coups Critiques | 30 ‡ | 3 |
| Invocations | 30 | 3 |
| Renvoi de dommages | 30 ‡ | 3 |
| Portée (PO) | 51 | 1 |
| PM | 90 | 1 |
| PA | 100 | 1 |
| Puissance | 2 | 50 |
| Rune de chasse | −1 (poids **négatif**) | — |

† **Divergence de version majeure sur la Vitalité.** SmithMagic (≈2013) donne `BONUS_VITALITY = 0.25`.
La table lilgallon (dump serveur, plus récent) implique **0.2** (Rune Vi = +5 vita pour un poids 1).
La 2.x moderne / 3.x est à **0.2** (overmax 505). Rendre ce coefficient **paramétrable**. **[OBS/SUPP]**

‡ **Divergences de version confirmées** : Cri 30 (ancien / Rétro) → 10 (2.x moderne),
Soins 20 → 10, Renvoi 30 → 10. La table lilgallon (récente) donne Cri 10, So 10, Do Ren 10.
**Ne pas coder ces trois valeurs en dur : elles dépendent de la version cible.**

## 2.3 TABLE DES MALUS — asymétrique, et rarement documentée

`RuneWeightEnum.as`, section `// Malus` — **recopiée telle quelle** **[OBS]** :

| Caractéristique (en malus) | Coef malus | Coef bonus correspondant |
|---|---:|---:|
| Initiative | 0.05 | 0.1 |
| Vitalité | 0.2 | 0.25 |
| Force / Intelligence / Chance / Agilité / Rés. critique | 1 | 1 / 1 / 1 / 1 / 2 |
| Sagesse / Prospection / Tacle / Fuite | 2 | 3 / 3 / 4 / 4 |
| Dommages élémentaires | 2.5 | 5 |
| Dommages Poussée, % Résistances élémentaires | 3 | 5 / 6 |
| Esquive PA/PM, Retrait PA/PM | 4 | 7 |
| Résistance Poussée | 5 | 2 |
| PO / PM / PA | 51 / 90 / 100 | 51 / 90 / 100 |

➡️ **Règle générale : le poids d'un malus vaut ≈ la moitié du poids du bonus**, sauf PA/PM/PO
(inchangés) et Force/Int/Cha/Agi (inchangés). C'est la forme exacte, mesurée, de la règle
communautaire « les runes pèsent 2 fois moins sur les jets négatifs ». **[OBS]**
➡️ Implémenter **deux tables** (`COEF_BONUS`, `COEF_MALUS`) et non un facteur ×0.5 global.

## 2.4 Poids de la rune sur une ligne négative

Quand on passe une rune sur une ligne actuellement **négative** (ex. remonter un −3 PM vers −2 PM) :
`poids_rune = r.add * COEF_MALUS[r.stat]` — soit environ deux fois moins que la normale. **[CONS]**
StarLoco/Ancestra modélisent ceci différemment, par un **coefficient de difficulté** `coef = 0.5`
(StarLoco) ou `0.75` (Ancestra) plutôt que par un poids réduit. **[CODE]**
Les deux mécanismes existent probablement en parallèle dans le vrai jeu ; le simulateur les expose
comme deux paramètres distincts (`coef_negatif` et l'usage de `COEF_MALUS`).

## 2.5 TABLE RÉTRO 1.29 / 1.49 — valeurs DIFFÉRENTES

Deux sources de code, **contradictoires entre elles**, ce qui est en soi une information :

**(a) Table « rune » de StarLoco 1.39 (`JobAction.getPwrPerEffet`)** — coefficient par point **[CODE]** :
```
PA 100 · PM 90 · PO 51 · CC 30 · Invocation 30 · Dommages 20 · Soins 20
Dommages Pièges 15 · % Rés élémentaires 6 · Esquive/Retrait PA-PM 1 (sic)
Sagesse 3 · Prospection 3 · % Dommages 2 · % Dom. Pièges 2 · Rés. fixes 2
Force/Intel/Chance/Agilité 1 · Vitalité 0.25 · Pods 0.25 · Initiative 0.1
```

**(b) Table « objet » du MÊME fichier StarLoco** (`WeithTotalBase`, `currentTotalWeigthBase`,
`currentWeithStats`) — **une autre table, entière et plus grossière** **[CODE]** :
```
Vitalité / Pods / Initiative           ×1
Force / Intel / Agilité / Chance       ×2
% Dommages / Renvoi / % Pièges         ×3
Sagesse / Prospection                  ×5
Résistances fixes                      ×7
% Résistances                          ×8
Dommages Pièges                        ×15
Soins                                  ×20
Coups Critiques / Invocations          ×30
Portée                                 ×50
PM                                     ×90
PA                                     ×100
```

⚠️ **C'est une incohérence interne de l'émulateur, PAS une mécanique du jeu.** StarLoco utilise
la table (a) pour le poids de la **rune** et la table (b) pour le poids de l'**objet**. Les deux
ne sont pas dans la même unité (Force pèse 1 comme rune, 2 comme ligne d'objet).
**Ne pas reproduire cette incohérence.** Utiliser **une seule** table de coefficients.
(Si l'on veut reproduire *exactement* StarLoco pour comparaison, `fm_sim.py` expose
`ModelParams.starloco_dual_table = True`.)

**(c) Bug notable de StarLoco à ne PAS reproduire** **[CODE]** : `JobAction` fait
`poid = statsAdd * ((int) getPwrPerEffet(...))` — un **cast en int**. Donc pour la Vitalité (0.25),
les Pods (0.25) et l'Initiative (0.1), `poid = statsAdd * 0 = 0`. Toutes les runes Vi/Pod/Ini ont
un poids **nul** dans cet émulateur. C'est une erreur d'implémentation, pas une règle.

**Table Rétro communautaire (à préférer pour un simulateur Rétro)** **[CONS]** :
```
PA 100 · PM 90 · PO 51 · Coup Critique 30 · Invocation 30 · Renvoi 30
Dommages 20 · Soins 15 · Dommages Pièges 15 · Fuite 5 · Tacle 5
Sagesse 3 · Prospection 3 · Force/Chance/Intel/Agilité 1
Vitalité 0.25 · Initiative 0.1
```
avec, en Rétro, **arrondi supérieur du poids des runes de Vitalité** : Vi (+3 vita) pèse **1**
au lieu de 0.75, Pa Vi (+10) pèse **3** au lieu de 2.5, Ra Vi (+30) pèse **8** au lieu de 7.5.
**[CONS]** (Schoup#6591 sur le forum officiel, corroboré par Alterya.)
Conséquence exploitable : la Vitalité perd 25 % d'efficacité par arrondi en rune simple,
6 % en Ra → pour optimiser la vita en Rétro, n'utiliser que des **Ra Vi**.

Valeurs de runes Rétro confirmées par le code de StarLoco/Nao **[CODE]** :
`Rune Vi = +3` · `Pa Vi = +10` · `Ra Vi = +30` (contre +5 / +15 / +50 en Dofus 2.x **[OBS]** DofusDB).

---

# 3. LA FONCTION DE PROBABILITÉ

C'est **la seule partie réellement inconnue** du système. Cette section donne :
(a) l'enveloppe de contraintes dures, (b) trois formules candidates issues de code réel,
(c) un modèle paramétrique recommandé.

## 3.1 ENVELOPPE DE CONTRAINTES — les 5 triplets du DevBlog Ankama 1.27

Le DevBlog original n'est plus en ligne. **Deux relais indépendants** en recopient les chiffres.
J'ai re-vérifié ces deux pages en direct pendant la rédaction de ce document. **[OBS]**

| # | Situation (formulation du relais) | SC | SN | EC | Notation DevBlog |
|---|---|---:|---:|---:|---|
| 1 | Meilleures probabilités atteignables (bonus simples, objet à bas poids, jet bas) | **66 %** | **34 %** | **0 %** | `Pmax(PWRGmin & PWRmin)` |
| 2 | Meilleures probas **sur un jet parfait** | **34 %** | **50 %** | **16 %** | `Pmax(PWRGmax & PWRmax)` |
| 3 | Probabilités **minimum** hors exo | **15 %** | **50 %** | **35 %** | `Pmin(PWRGmax & PWRmax)` |
| 4 | Création d'effet exotique, **avec puits disponible** | **1 %** | **22 %** | **77 %** | — |
| 5 | Création d'effet exotique, **sans puits** | **1 %** | **0 %** | **99 %** | `Pmin(Création d'effet)` |

⚠️ **Divergence entre relais sur la ligne 2** : le blog Yin-Yang donne **34/50/16**, le blog
Alterya donne **43/50/7**. Impossible de trancher sans le DevBlog original.
→ paramètre `p_jet_parfait ∈ {(34,50,16), (43,50,7)}`, défaut **34/50/16**
(la ligne 2 doit rester ≤ la ligne 1 et ≥ la ligne 3, les deux le vérifient).

**Trois règles dures qui en découlent, et qui doivent être des invariants testés :**
```
INV-1   P_SC ≥ 1 %       toujours, dans TOUS les cas.       [OBS] DevBlog + [CONS] forum
INV-2   P_SN ≤ 50 %      « Les Chances de SN sont au maximum de 50% ».   [OBS] DevBlog
INV-3   P_SC ≤ 66 %      plafond absolu du succès critique.             [OBS] DevBlog
```
`INV-2` et `INV-3` sont **exactement** les deux clamps codés dans StarLoco
(`if (p2 > 50) p2 = 50;` et `else if (p1 > 66) p1 = 66;`). **[CODE]**
`INV-1` est le `if (p1 < 1) { p1 = 1; p2 = 0; p3 = 99; }` de StarLoco, qui reproduit
**littéralement** le triplet #5 du DevBlog. **[CODE]**

➡️ **Conclusion méthodologique forte** : la formule de StarLoco n'a pas été inventée au hasard,
elle a été écrite **pour reproduire les bornes publiées par Ankama**. C'est le meilleur point
de départ disponible. Ses *constantes internes* (1.3, 1.2, 0.8, 0.5, 25) restent [SUPP].

## 3.2 Les trois facteurs de difficulté, par ordre d'importance (DevBlog 1.27) **[OBS]**

1. **Qualité globale de l'objet** (`PWRg` rapporté à `PWRmax`) — « augmente rapidement à proximité
   des jets parfaits ». C'est le facteur dominant.
2. **Qualité du jet modifié** — « si le jet que l'on modifie est supérieur à **80 %** de la
   fourchette du jet, la difficulté augmente **brutalement** ».
3. **Niveau de l'objet** — impact **mineur**.

Ces trois facteurs et **rien d'autre** sont cités par Ankama. Notablement **absents** :
le poids de la rune tentée, le niveau du métier, le nombre de lignes, le reliquat.
(Le poids de la rune apparaît quand même dans toutes les formules d'émulateur, et la
règle du ×20 est trop universellement observée pour être ignorée — cf. §3.6.)

## 3.3 FORMULE CANDIDATE A — StarLoco 1.39 (recopiée **exactement**)

Fichier : `repos/StarLoco-Game/src/org/starloco/locos/common/Formulas.java`, ligne 945.
Seule implémentation publique connue qui modélise les **trois** issues SC/SN/EC. **[CODE]**

```java
public static ArrayList<Integer> chanceFM(int WeightTotalBase,      // PWRmax
                                          int WeightTotalBaseMin,   // PWRmin
                                          int currentWeithTotal,    // PWRg
                                          int currentWeightStats,   // PWRcarac
                                          int weight,               // poids de la rune
                                          int diff,                 // |PWRmax*1.3 − PWRg|
                                          float coef,               // 1.0 / 0.5 / 0.25
                                          int maxStat, int minStat, int actualStat,
                                          float x,                  // 1.0, ou 0.8 si over
                                          boolean bonusRune, int statsAdd) {
    ArrayList<Integer> chances = new ArrayList<Integer>();
    float c = 1, m1 = (maxStat - (actualStat + statsAdd)), m2 = (maxStat - minStat);
    if ((1 - (m1 / m2)) > 1.0)
        c = (1 - ((1 - (m1 / m2)) / 2)) / 2;
    else if ((1 - (m1 / m2)) > 0.8)
        c = 1 - ((1 - (m1 / m2)) / 2);
    if (c < 0)
        c = 0;
    // la variable c reste à 1 si le jet ne dépasse pas 80% sinon il diminue très fortement.
    // Si le jet dépasse 100% alors il diminue encore plus.

    int moyenne = (int) Math.floor(WeightTotalBase
            - ((WeightTotalBase - WeightTotalBaseMin) / 2));

    float mStat = ((float) moyenne / (float) currentWeithTotal);
    // Si l'item est un bon jet dans l'ensemble, diminue les chances sinon l'inverse.

    if (mStat > 1.2)
        mStat = 1.2F;
    float a = ((((((WeightTotalBase + diff) * coef) * mStat) * c) * x) * Config.rateFm);
    float b = (float) (Math.sqrt(currentWeithTotal + currentWeightStats) + weight);
    if (b < 1.0)
        b = 1.0F;

    int p1 = (int) Math.floor(a / b); // Succes critique
    int p2 = 0;                       // Succes neutre
    int p3 = 0;                       // Echec critique
    if (bonusRune)
        p1 += 20;
    if (p1 < 1) {
        p1 = 1;
        p2 = 0;
        p3 = 99;
    } else if (p1 > 100) {
        p1 = 66;
        p2 = 34;
    } else if (p1 > 66)
        p1 = 66;

    if (p2 == 0 && p3 == 0) {
        p2 = (int) Math.floor(a
                / (Math.sqrt(currentWeithTotal + currentWeightStats)));
        if (p2 > (100 - p1))
            p2 = (100 - p1);
        if (p2 > 50)
            p2 = 50;
    }
    chances.add(0, p1);
    chances.add(1, p2);
    chances.add(2, p3);
    return chances;
}
```

**Entrées, telles que calculées par l'appelant `JobAction.craftMaging` (lignes 1085-1136) [CODE] :**

```java
currentWeightTotal = currentTotalWeigthBase(statStringObj, objectFm);  // PWRg
currentWeightStats = currentWeithStats(objectFm, statsObjectFm);       // PWRcarac
currentTotalBase   = WeithTotalBase(objTemplateID);                    // PWRmax
currentMinBase     = WeithTotalBaseMin(objTemplateID);                 // PWRmin
diff               = (int) Math.abs((currentTotalBase * 1.3f) - currentWeightTotal);
poid               = statsAdd * ((int) getPwrPerEffet(statId));        // poids de la rune

// coef — difficulté selon la nature de la ligne visée :
//   baseStats==1 (présente nativement)                       → coef = 1.00
//   baseStats==2 (présente en NÉGATIF, et négative)          → coef = 0.50
//   baseStats==0 (ABSENTE du template → EXOTIQUE)            → coef = coefExo = 0.25

// x — pénalité d'over :
float x = 1;
if (actualJet > statMax) {
    x = 0.8F;
    if (actualJet >= (statMax + getOverPerEffet(statId))) canFM = false;  // cap dur
}
if (lvlJob < Math.floor(template.getLevel() / 2)) canFM = false;  // niveau métier (RÉTRO uniquement)
if (!canFM) { chances = [0, 0]; }   // 0 % SC, 0 % SN → EC garanti
```

**Deux pondérations cachées dans le calcul de `PWRcarac` et `PWRg` [CODE] :**
```
currentWeithStats  (PWRcarac) : coef ×1 si ligne native, ×3 si native-négative, ×8 si EXOTIQUE
currentTotalWeigthBase (PWRg) : coef ×1 si ligne native, ×3 si native-négative, ×2 si exotique
```
→ une ligne exotique compte **×8** au dénominateur quand c'est elle qu'on vise, et **×2** dans le
poids total de l'objet. C'est ce qui rend un **deuxième** point d'exo quasi impossible. **[CODE]**

**Post-traitement du tirage (`JobAction` l.1136-1157) [CODE] — attention, c'est là que se
joue le mécanisme d'exo :**
```java
int aleatoryChance = Formulas.getRandomValue(1, 100);
boolean successC = (aleatoryChance <= SC);
boolean successN = (aleatoryChance <= (SC + SN));

// (1) BONUS PUITS : si le puits est ≥ la VALEUR ajoutée par la rune (pas son poids !),
//     50 % de chance de forcer un succès critique. Exclu pour PA/PM/PO.
if (objectFm.getPuit() >= statsAdd) {
    if (runeId != 1558 && runeId != 1557 && runeId != 7438) {   // ni Ga Pme, ni Ga Pa, ni Po
        if (Formulas.getRandomValue(1, 2) == 1) successC = true;
    }
}
// (2) EXO PA/PM : 1 chance sur 101 de forcer un SC, quoi qu'il arrive.
if (runeId == 1558 || runeId == 1557)
    if (Formulas.getRandomValue(0, 100) == 1) successC = true;
```
➡️ Le fameux **« 1 % en SC uniquement »** est implémenté ici comme `rand(0,100) == 1`,
soit **1/101 ≈ 0.990 %**. La valeur communautaire est **1/100**. Écart non mesurable
(cf. §11, l'IC95 de la seule mesure sérieuse est [0.905 % ; 1.315 %]).
➡️ Noter que ce chemin **ne s'applique pas à la Portée** (7438) alors que la règle
communautaire dit « exo PA, PM **et PO** à 1 % ». C'est une omission de l'émulateur. **[CODE]**

## 3.4 FORMULE CANDIDATE B — Ancestra-Evolutive / AncestraRemake (1.29)

Modèle **binaire** (succès / échec), plus ancien, plus simple. **[CODE]**
```java
// Formulas.ChanceFM, l.860 — Puis = le puits
int a = (poidItemBase + poidBaseJet + (Puis * 2));
int b = (int) Math.sqrt(poidItemActual + poidActualJet + poidRune);
if (b <= 0) b = 1;
Chance = (int) Math.floor((a / b) * Coef);      // clamp 1..100, succès si Chance >= rand(1,100)

// Job.java l.1018-1035
Coef = 1.00   si la carac est présente sur l'objet de base
Coef = 0.75   si présente en négatif de base et négative sur l'objet
Coef = 0.25   si absente de l'objet de base (exotique)
double JetMax = BaseMaxJet * (2 - (niveauObjet / 100));    // plafond d'over dépendant du NIVEAU
Coef = Coef * ((JetMax - jetActuel) / 25);   if (Coef <= 0) Coef = 0;
```
**Intérêt principal** : c'est la **seule** formule publique où le **puits augmente explicitement
la probabilité de succès** (terme `+ Puis*2` au numérateur). Elle contredit donc directement
le consensus des forgemages expérimentés (« le reliquat ne change rien aux probabilités,
il vient juste amortir tes pertes »). **Contradiction non résolue — cf. §11.**
**Intérêt secondaire** : le plafond d'over y dépend du **niveau de l'objet**
(`BaseMaxJet * (2 − lvl/100)`), une mécanique absente partout ailleurs.

## 3.5 FORMULE CANDIDATE C — Nao (fork intermédiaire)

```java
float a = ((WeightTotalBase + diff) * coef * Config.RATE_FM);
float b = (float) (Math.sqrt(currentWeithTotal + currentWeightStats) + weight);
if (b < 1.0) b = 1.0F;
chance = a / b;    // clamp 1..100, +20 si rune bonus
// coef : 1.0 / 0.50 / 0.25 ; 0.15 si le jet est déjà >= max de base
// diff = (int)(WeightTotalBase * 1.3f) - currentWeightTotal
```
Chaînon manquant entre B et A : la structure `a/b` de StarLoco y est déjà, sans les
facteurs `c`, `mStat`, `x` ni la séparation SC/SN. Confirme la filiation
**Ancestra → Ancestra-Evolutive → Nao → StarLoco** et permet de dater l'apparition
de chaque terme. Aucune information nouvelle.

## 3.6 MODÈLE RECOMMANDÉ — paramétrique et calibrable (`fm_sim.py`)

Aucune des formules A/B/C n'est canonique. Le modèle implémenté dans `fm_sim.py` **conserve la
structure de StarLoco** (elle reproduit les bornes officielles) mais **sort toutes les constantes**
dans une `dataclass ModelParams`, et **ajoute un terme pour la règle du ×20** — que StarLoco ne
modélise pas et qui est pourtant l'observation empirique la plus universellement répétée.

```
Entrées :  item (état complet), rune, ligne visée
Sorties :  (P_SC, P_SN, P_EC) avec P_SC + P_SN + P_EC = 1

# --- 0. Cas bloquants -------------------------------------------------------
si poids_over_exo(ligne) + poids_rune > CAP_OVER (101)  → (0, 0, 1)   # tentative impossible
si version == RETRO et lvl_metier < lvl_objet/2         → (0, 0, 1)

# --- 1. c : pénalité de sur-jet (dégressivité au-delà de 80 % du jet max) ----
# recopié de StarLoco, seuils sortis en paramètres
f = (value_apres + rune.add − jet_min) / max(1, jet_max − jet_min)   # remplissage du jet
si f > 1.0                    : c = (1 − (f − 1)/2) / 2       # au-delà du max naturel
sinon si f > SEUIL_DEGRESSIF  : c = 1 − f/2                    # SEUIL_DEGRESSIF = 0.80
sinon                         : c = 1
c = max(0, c)

# --- 2. mStat : qualité globale de l'objet ----------------------------------
moyenne = PWRmax − (PWRmax − PWRmin)/2
mStat   = min(PLAFOND_MSTAT, moyenne / max(1, PWRg))          # PLAFOND_MSTAT = 1.2

# --- 3. coef : nature de la ligne visée -------------------------------------
coef = 1.00   ligne native positive
     = 0.50   ligne native négative
     = 0.25   ligne EXOTIQUE                                   # = COEF_EXO

# --- 4. x : pénalité d'over --------------------------------------------------
x = 1.0 si value <= jet_max sinon PENALITE_OVER                # PENALITE_OVER = 0.8

# --- 5. NOUVEAU — t : pénalité « règle du ×20 » -----------------------------
# absente de tous les émulateurs, mais universellement observée en jeu.
ratio = value_courante / max(1, rune.add)
t = 1.0                                  si ratio <= SEUIL_X20_DOUX   (16)
  = interp. linéaire 1.0 → PENAL_X20     si SEUIL_X20_DOUX < ratio <= SEUIL_X20_DUR (20)
  = PENAL_X20 * (SEUIL_X20_DUR/ratio)^EXPOSANT_X20   au-delà      (PENAL_X20=0.35, EXPO=2)

# --- 6. agrégation, structure StarLoco --------------------------------------
taille = PWRmax + |PWRmax * FACTEUR_DIFF − PWRg|
taille = 100 * (taille / 100) ** EXPOSANT_TAILLE      # U31, cf. §3.7 ; =1.0 -> StarLoco brut
a = taille * coef * mStat * c * x * t * RATE_FM
b = sqrt(PWRg + PWRcarac_pondéré) + poids_rune       ; b = max(1, b)
    # PWRcarac_pondéré = PWRcarac × 1 (native) / 3 (négative) / 8 (exotique)
p_sc = floor(a / b)

# --- 7. clamps et invariants (BORNES OFFICIELLES) ---------------------------
si p_sc <= 1 :        # <= et non < : toute création d'effet qui tombe au plancher
                      #   doit donner le triplet officiel, pas un SN résiduel
    p_sc, p_sn = 1, (PUITS_DONNE_SN and puits > 0 ? 22 : 0)     # triplets #4 / #5 du DevBlog
sinon :
    p_sc = min(p_sc, 66)                                        # INV-3
    p_sn = min(floor(a / sqrt(PWRg + PWRcarac_pondéré)), 100 − p_sc, 50)   # INV-2
p_ec = 100 − p_sc − p_sn
```

Constantes par défaut, **toutes [SUPP] sauf les clamps 1/50/66 qui sont [OBS]** :
`FACTEUR_DIFF=1.3 · PLAFOND_MSTAT=1.2 · SEUIL_DEGRESSIF=0.80 · PENALITE_OVER=0.8 ·
COEF_EXO=0.25 · COEF_NEG=0.50 · RATE_FM=1.0 · EXPOSANT_TAILLE=1.0 · SEUIL_X20_DOUX=16 ·
SEUIL_X20_DUR=20 · PENAL_X20=0.35 · EXPOSANT_X20=2 · CAP_OVER=101`
(ces défauts = **StarLoco à l'identique** ; pour un simulateur, préférer le préréglage
ajusté du §3.7 : `RATE_FM=20 · FACTEUR_DIFF=1.0 · EXPOSANT_TAILLE=0.4`)

**Note sur le triplet #4 (1/22/77).** C'est le seul chiffre officiel qui dise explicitement que
le **puits change le triplet de probabilité** : avec puits, l'exo passe de 1/0/99 à 1/22/77.
Interprétation cohérente avec tout le reste du corpus : *le puits ne change pas P_SC, il
transforme une partie des EC en SN* (un EC dont les pertes sont intégralement absorbées par le
puits **est** un SN du point de vue du joueur). C'est aussi exactement ce que fait le code de
StarLoco : dans la branche SN, les pertes ne sont appliquées **que si `puits <= 0`**.
➡️ Le simulateur implémente ceci par le drapeau `PUITS_DONNE_SN` : avec puits suffisant,
`P_SN` prend la valeur `SN_AVEC_PUITS = 22` dans le cas plancher. **[OBS pour 22, SUPP pour la
généralisation aux cas non-plancher]**

## 3.7 RÉSULTAT DE L'AJUSTEMENT SUR LES ANCRES OFFICIELLES (fait, reproductible)

`reference_impl/fm_sim.py` contient les 5 situations du DevBlog codées comme scénarios
(`ancres_devblog()`), un score d'erreur (`score_ancres()`) et un calibrateur
(`calibrate_multistart()`). Résultats **effectivement obtenus** (`python3 fm_sim.py`) :

| Ancre | Cible | **StarLoco brut** (défauts §3.6) | **Après ajustement** |
|---|---|---|---|
| 1 `Pmax(PWRGmin & PWRmin)` | 66/34/0 | **66 / 34 / 0** ✅ | **66 / 34 / 0** ✅ |
| 2 `Pmax(PWRGmax & PWRmax)` | 34/50/16 | 2 / 3 / 95 ❌ | **38 / 49 / 13** ✅ |
| 3 `Pmin(PWRGmax & PWRmax)` | 15/50/35 | 5 / 9 / 86 ❌ | 25 / 42 / 33 ⚠️ |
| 4 exo **avec** puits | 1/22/77 | **1 / 22 / 77** ✅ | **1 / 22 / 77** ✅ |
| 5 exo **sans** puits | 1/0/99 | **1 / 0 / 99** ✅ | **1 / 0 / 99** ✅ |
| **Erreur quadratique totale** | | **13 856** | **194** |

**Trois enseignements, qui sont des résultats de ce travail :**

1. **La formule de StarLoco reproduit EXACTEMENT le meilleur cas officiel (66/34/0)** sans
   qu'on ait rien à ajuster. Sur un objet simple au jet minimal avec une petite rune, elle
   sature naturellement aux deux clamps 66 et 34. C'est une confirmation très forte que
   cette formule descend bien de la description du DevBlog.

2. **Mais elle a un défaut de mise à l'échelle** (**incertitude U31**, nouvelle) :
   au numérateur `a ∝ PWRmax`, au dénominateur `b ∝ √PWRg`. Au jet parfait (`PWRg = PWRmax`),
   `p_sc ∝ √PWRmax` : **plus l'objet est gros et complexe, plus la FM devient facile.**
   C'est l'inverse de ce que dit Ankama (« la qualité globale est le facteur de difficulté
   n°1 ») et de ce que rapportent les joueurs. ➡️ `fm_sim.py` ajoute un paramètre
   `exposant_taille` (`taille = 100 × ((PWRmax + diff)/100)^e`, `e = 1` reproduisant
   StarLoco à l'identique). **L'ajustement choisit `e = 0.4`**, c'est-à-dire qu'il
   *inverse* la tendance. C'est la correction la plus importante apportée au modèle.

3. **L'ancre 3 reste mal reproduite (25 au lieu de 15).** Aucun jeu de paramètres de cette
   famille fonctionnelle n'y arrive tout en gardant les quatre autres. ➡️ Soit la forme
   fonctionnelle est trop pauvre (il manque un terme dépendant du **nombre de lignes** ou du
   **niveau de l'objet** — ce dernier étant le 3ᵉ facteur cité par Ankama et **absent de
   toutes** les formules d'émulateur), soit ma reconstruction du scénario « objet complexe au
   jet parfait avec une grosse rune » ne correspond pas à celui qu'Ankama avait en tête.
   **C'est le premier endroit à regarder avec des données réelles.**

**Préréglage recommandé** (`params_devblog_fit()` dans `fm_sim.py`) :
```
rate_fm = 20.0 · facteur_diff = 1.0 · plafond_mstat = 1.2
exposant_c = 1.0 · exposant_mstat = 1.0 · exposant_taille = 0.4 · coef_exo = 0.25
```
⚠️ **Ajusté sur 5 points seulement.** Il n'a **aucune** valeur prédictive démontrée en dehors
de ces 5 situations. Il est meilleur que StarLoco brut *par construction*, pas *par preuve*.
`ModelParams()` sans argument reste **StarLoco à l'identique**, pour comparaison.


---

# 4. RÉSOLUTION D'UNE TENTATIVE — ordre exact des opérations

C'est la partie **la mieux connue** du système. L'ordre ci-dessous est celui du code de StarLoco,
qui concorde avec les descriptions communautaires. **[CODE]** + **[CONS]**

```
attempt(item, rune, ligne_ciblée) -> outcome

 1. PRÉ-CALCUL   (aucune mutation)
    PWRg, PWRmax, PWRmin, PWRcarac, poids_rune, poids_over_exo
    snapshot = copie de l'état de l'objet   (nécessaire pour calculer pwrPerte)

 2. VÉRIFICATION DES BLOCAGES
    si poids_over_exo(ligne) + poids_rune > 101      -> tentative refusée / EC sec
    si stat ∈ {PA, PM, PO} et déjà 1 exo de ce type  -> refusée  (règle 2.3.4)   [OBS]
    si l'objet porte une rune de transcendance       -> refusée                  [OBS]

 3. TIRAGE
    (P_SC, P_SN, P_EC) = probabilite(...)      # §3
    r = uniforme(0, 1)
    issue = SC si r < P_SC ; SN si r < P_SC+P_SN ; EC sinon

 4. APPLICATION

    === SC (succès critique) ===
      ligne.value += rune.add          (crée la ligne si elle n'existait pas → exo)
      pwrPerte = 0
      LE PUITS N'EST PAS CONSOMMÉ                                    [CONS] contesté, cf. §11

    === SN (succès neutre) ===
      si item.puits <= 0 :
          appliquer PERTE(item, rune)                                 # §6
          pwrPerte = PWRg_avant − PWRg_après
      ligne.value += rune.add
      # NB : si la ligne ciblée est elle-même touchée par la perte, le joueur voit
      #      un « échec neutre » : la rune passe mais la stat ne bouge pas / baisse.  [CONS]

    === EC (échec critique) ===
      appliquer PERTE(item, rune)                                     # §6
      pwrPerte = PWRg_avant − PWRg_après
      la rune n'est PAS ajoutée
      # NB : s'il ne reste plus rien à perdre sur l'objet, l'EC se présente
      #      comme un « échec neutre » (rien ne se passe).                            [CONS]

 5. MISE À JOUR DU PUITS  — une seule ligne, valable pour les trois issues
      item.puits = max(0, item.puits + pwrPerte − poids_rune)
      # StarLoco : objectFm.setPuit((objectFm.getPuit() + pwrPerte) - poid);
      # le max(0,...) n'est PAS dans StarLoco (le puits peut y devenir négatif) mais
      # il est unanimement décrit côté joueurs : « le reliquat ne descend jamais sous 0 ».

 6. NETTOYAGE
      supprimer de item.effects toute ligne dont value < 1
      consommer 1 rune
      retourner outcome {issue, lignes_modifiées, pwrPerte, puits_avant, puits_après}
```

## 4.1 Ce qui monte, de combien

* **SC** et **SN** ajoutent **exactement `rune.add`** à la ligne visée. Ni plus, ni moins,
  ni valeur aléatoire. **[CODE]** (`parseFMStatsString` : `newstats = entry.getValue() + add`).
* Si la ligne est **négative** (`is_negative`), la rune **réduit le malus** :
  `newstats = value − add`, et si le résultat passe sous 1 la ligne disparaît. **[CODE]**
* Aucun **arrondi** ni aucune **valeur partielle** : la FM est entièrement en pas discrets
  de `rune.add`. Toute la granularité vient du choix du palier de rune (simple / Pa / Ra).

---

# 5. LE PUITS (RELIQUAT)

## 5.1 Formule — consensus total, aucune contradiction dans le corpus **[CONS]**

```
puits ← max(0, puits + poids_total_perdu − poids_de_la_rune_tentée)
```

Formulations rencontrées, toutes équivalentes :
* SmithMagic (module client, `SmithMagicUi.as` l.300-345) — **la référence, car c'est du code
  qui affichait la bonne valeur en jeu** **[OBS]** :
  ```
  pour chaque effet modifié par le passage :
      effet apparu       -> weightGains  += newValue * poids(effet)
      effet disparu      -> weightLosses += oldValue * poids(effet)
      valeur augmentée   -> weightGains  += (new − old) * poids(effet)
      valeur diminuée    -> weightLosses += (old − new) * poids(effet)
  si (resultat == CRAFT_FAILED || resultat == CRAFT_NEUTRAL) :
      nouveau_puits = puits + weightLosses − runeWeight
  ```
  avec `runeWeight = poids(effet_de_la_rune) × rune.effects[0].parameter0`.
* StarLoco (serveur) : `setPuit(getPuit() + pwrPerte − poid)` **[CODE]**
* Communauté : « Reliquat total = Reliquat précédent + (Poids de la perte – Poids de la rune) »

⚠️ **Point important, souvent mal compris** : le puits est **crédité même sur un succès**.
Sur un SC, `pwrPerte = 0`, donc `puits −= poids_rune`. Une longue série de SC **vide** le puits.
Le puits n'est donc pas « le poids perdu » mais **le bilan net perte/investissement**.
(SmithMagic ne recalcule le puits que sur FAILED/NEUTRAL ; StarLoco l'applique aux trois issues.
**Divergence non résolue — cf. §11.** `fm_sim.py` : paramètre `puits_decremente_sur_sc`.)

## 5.2 Consommation du puits par type de résultat **[CONS]**

| Issue | Rune ajoutée ? | Puits consommé ? | Stats perdues ? |
|---|---|---|---|
| **SC** | oui | **non** (mais `−poids_rune` sur le bilan) | non |
| **SN** | oui | **oui**, absorbe en priorité | seulement si le puits est insuffisant |
| **EC** | non | **oui**, absorbe en priorité | seulement si le puits est insuffisant |

Sources concordantes : Pousset/dofusToolForgemagie AGENTS.md, `Alpha-Rush#5676` (« en succès simple
le puits est comblé alors qu'en succès critique le puits est conservé »), et le code de StarLoco
(branche SN : `if (objectFm.getPuit() <= 0) { …appliquer la perte… }`). **[CODE]**

## 5.3 Ordre de priorité des pertes — **DEUX ORDRES CONTRADICTOIRES**

**Ordre 1 — DevBlog Ankama 1.27** (relais blackleaf, vérifié en direct) **[OBS]** :
```
1. le puits
2. les jets overmax / exotiques
3. les effets de PWR inférieur ou égal au PWR à enlever
4. les effets de PWR supérieur au PWR à enlever
```

**Ordre 2 — tutoriels communautaires modernes** (Dofus-Touch « FM de F à E », corroboré par
`dayseique#1094`) **[CONS]** :
```
1. overjets / exos, SAUF la caractéristique ciblée
2. le puits
3. overjets / exos, même la caractéristique ciblée
4. les caractéristiques absorbant le poids restant
```

La différence est réelle et **observable** : dans l'ordre 2, un over sur une autre ligne saute
**avant** que le puits ne soit entamé — c'est exactement ce que décrivent les joueurs
(« l'over sera prioritaire à sauter par rapport au puits, sauf si c'est la stat que tu montes »).
➡️ `fm_sim.py` implémente **l'ordre 2 par défaut** (plus récent, plus corroboré par la pratique)
et expose `ModelParams.ordre_pertes ∈ {"devblog_1_27", "communaute"}`.

**Ordre 3 — StarLoco (pour mémoire) [CODE]** : ordre **aléatoire** des caractéristiques
(`Collections.shuffle(keys)`), avec l'over-FM déplacé **en tête** de liste. Pas de gestion du
puits dans la fonction de perte elle-même (le bloc correspondant est **commenté** dans le source) ;
le puits est géré en amont, en tout ou rien (`if (puits <= 0) alors perte`).

## 5.4 Bornes du puits

* `puits ≥ 0` toujours. **[CONS]**
* Puits maximal théoriquement atteignable : **99** (une rune de poids 1 fait sauter un PA de
  poids 100). **[SUPP]** — raisonnement, jamais mesuré. Ne pas coder de plafond dur.
* Le puits est **remis à zéro** si l'objet est équipé, échangé, banqué, vendu, ou à la
  déconnexion. **[CONS]** Il est **invisible** en jeu (2.29). Sa restitution éventuelle par
  l'interface en Dofus 3.x est **[SUPP]** (une seule source, contredit le DevBlog).

## 5.5 Bug Rétro connu — le puits n'est pas un bouclier absolu

Thread officiel « Fonctionnement du puit sur DOFUS Retro ? » (fév. 2020, réponse Ankama,
bug encore signalé en juillet 2024) **[OBS]** :
> les runes VI ont une forte tendance à « taper » dans d'autres stats même avec du puits ;
> les Pa Vi peuvent avoir le même comportement.

➡️ Pour un simulateur **Rétro**, prévoir `p_fuite_puits` (probabilité qu'une perte se produise
malgré un puits suffisant), non nulle pour les runes de Vitalité. Défaut **[SUPP]** : 0.

---

# 6. PERTE SUR ÉCHEC — algorithme détaillé

Recopié de `repos/StarLoco-Game/.../object/GameObject.java` l.872, `parseStringStatsEC_FM`.
**Seule implémentation publique complète de la perte.** **[CODE]**

```java
// paramètres réels de l'appel : (obj, poid = statsAdd, carac)
//   EC  : carac = -1
//   SN  : carac = runeOrPotion.getTemplate().getId()   <-- BUG, cf. note ci-dessous
keys = shuffle(toutes les caracs actuelles de l'objet)
// puis on cherche une carac en OVER-FM et on la place EN TÊTE de liste
double perte = 0;
pour chaque carac i dans keys :
    value = valeur actuelle de i
    si (perte > poid || i == carac)               -> inchangée
    sinon si i ∈ {152,154,155,157,116,153}        // caracs de MALUS
        a = max(1, value * poid / 100)
        newstats = floor(value + a)               // on AGGRAVE le malus
        newstats = min(newstats, max_de_base)
    sinon si i ∈ {127, 101}                        // retrait PM / retrait PA
        -> ignorée (jamais de négatif)
    sinon
        si over-FM : chute = value − value * (poid − floor(perte)) * 2 / 100   // double peine
        sinon      : chute = value − value * (poid − floor(perte))     / 100
        si (chute / value) < 0.75 : chute = value * 0.75      // plancher : jamais plus de −25 %
        perte += (value − chute) * poidsParEffet(i)
        newstats = floor(chute)
    si newstats < 1 -> la ligne DISPARAÎT de l'objet
```

## 6.1 Lecture, et corrections à apporter

| Comportement | Statut | Recommandation pour le simulateur |
|---|---|---|
| L'**over-FM est détruit en priorité** (déplacé en tête) | **[CONS]** confirmé par les joueurs | garder |
| **Double peine sur l'over** (`×2`) | **[SUPP]** propre à StarLoco | garder, paramétrable (`MULT_PERTE_OVER = 2.0`) |
| **Plancher à −25 %** par stat et par tentative | **[SUPP]** cohérent avec le ressenti (« une stat ne saute jamais d'un coup ») | garder, paramétrable |
| L'ordre des autres caracs est **aléatoire** | **[SUPP]** | à remplacer par l'ordre §5.3 |
| Les **malus s'aggravent** au lieu de baisser | **[CONS]** — c'est bien ce qui se passe en jeu | garder |
| Retrait PA / Retrait PM **jamais touchés** | **[CODE]** | garder |
| Boucle **stoppée dès que `perte > poid`** | **[CODE]** | garder, c'est le mécanisme central |
| `poid` = **`statsAdd`** (valeur de la rune) et non son **poids** | **BUG d'unité** | **corriger** : utiliser le **poids** de la rune. Sinon une Ga Pa (poids 100, add 1) ne fait perdre que 1 % d'une stat. |
| `perte` accumulée en **poids**, comparée à `poid` en **valeur de stat** | **BUG d'unité** | **corriger** : tout en poids. |
| En SN, `carac` reçoit un **ID de rune** (1519…) au lieu d'un **ID de stat** (111…) | **BUG** : la règle « la stat ciblée est épargnée » ne se déclenche jamais | **corriger** : passer l'ID de la stat visée. |

## 6.2 Algorithme de perte **corrigé**, tel qu'implémenté dans `fm_sim.py`

```
PERTE(item, poids_a_perdre, stat_ciblée) :
    reste = poids_a_perdre
    # (1) le puits absorbe d'abord  (ou après l'over, selon ModelParams.ordre_pertes)
    absorbe = min(item.puits, reste)
    item.puits -= absorbe ; reste -= absorbe
    si reste <= 0 : return 0

    # (2) construire l'ordre des lignes candidates selon ModelParams.ordre_pertes
    #     défaut "communaute" :
    #        over/exo hors ligne ciblée   >   over/exo ciblé   >   lignes normales
    #     à poids égal, départager par poids de ligne croissant (règle 3 du DevBlog),
    #     puis aléatoirement.

    poids_perdu_total = 0
    pour chaque ligne L dans cet ordre :
        si reste <= 0 : break
        si L.stat == stat_ciblée et ModelParams.epargner_ligne_ciblee : continue
        si L.stat ∈ {retrait_pa, retrait_pm} : continue

        si L.is_negative :                       # un malus s'AGGRAVE
            delta = max(1, floor(L.value * reste / 100))
            L.value = min(L.value + delta, L.jet_max_malus)
            continue                             # n'absorbe pas de poids

        mult   = MULT_PERTE_OVER si L est en over/exo sinon 1.0
        pct    = min(reste * mult / 100.0, 1.0 - PLANCHER_PERTE)    # PLANCHER_PERTE = 0.75
        chute  = floor(L.value * (1.0 - pct))
        chute  = max(chute, floor(L.value * PLANCHER_PERTE))
        perdu  = (L.value - chute) * COEF[L.stat]
        L.value = chute
        si L.value < 1 : retirer L de item.effects
        poids_perdu_total += perdu
        reste -= perdu
    return poids_perdu_total
```

---

# 7. LES RÈGLES DURES

## 7.1 Le cap 101 (over + exo) — **[CONS]**, 5+ sources concordantes

> « Aucune overmax, et ça vaut aussi pour l'exo, ne peut au total, en comptant la caractéristique
> de départ, avoir un poids de plus de **101**. »

```
pour chaque ligne :  (value − jet_max) * COEF[stat]  ≤  101
                     # jet_max = 0 pour une ligne exotique → value * COEF ≤ 101
```
Toute tentative qui ferait franchir 101 est **impossible** (elle n'est même pas proposée en jeu).

⚠️ **Divergence 101 vs 110.** Le relais du DevBlog 1.27 dit « cette limite admet **110** en plus
du PWRGmax ». Toutes les sources modernes disent **101**. Les caps par stat observés en jeu
(Vitalité 404 = 101/0.25, Sagesse 33 = 101/3, Initiative 1010 = 101/0.1, Force 101) sont
**exactement** cohérents avec 101 et **incohérents** avec 110. ➡️ retenir **101**,
paramètre `CAP_OVER = 101`. **[OBS]**

**Plafonds d'overmax par stat** — dérivés de `⌊101 / coef⌋`, et **confirmés indépendamment**
par la table `JobAction.getOverPerEffet` de StarLoco **[CODE]** :

| Stat | Cap over | Cohérent avec 101/coef ? |
|---|---:|---|
| PA | **1** | 101/100 = 1 ✅ |
| PM | 1 (StarLoco code 0, via une exception `isOverFm2`) | 101/90 = 1 ✅ |
| PO | 1 (StarLoco code 0) | 101/51 = 1 ✅ |
| Force / Intelligence / Chance / Agilité | **101** | ✅ |
| Vitalité | **404** (Rétro, coef 0.25) / **505** (Dofus 2.x, coef 0.2) | ✅ |
| Pods | 404 | ✅ |
| Initiative | **1010** | ✅ |
| Sagesse / Prospection | **33** | ✅ |
| Coups Critiques | **3** (coef 30, Rétro) / 10 (coef 10, moderne) | ✅ |
| Invocations | **3** | ✅ |
| Dommages (fixe) | **5** | ✅ |
| Soins | **5** (coef 20) / 10 (coef 10) | ✅ |
| Dommages élémentaires | **20** | ✅ |
| % Résistances élémentaires | **16** | ✅ |
| Résistances fixes | **50** | ✅ |
| % Dommages / % Dom. Pièges | **50** | ✅ |
| Dommages Pièges | **6** | ✅ |
| Esquive / Retrait PA-PM | **14** | ✅ (101/7) |

➡️ **Ne pas coder cette table en dur : la dériver de `⌊101 / COEF[stat]⌋`.** La cohérence
parfaite entre une table de code serveur et un calcul `101/coef` est le meilleur indice
disponible que la règle des 101 est réelle et que la table de coefficients est correcte.

## 7.2 La règle du ×20 — **[CONS]** très forte, mais zone floue

> « une rune passe de façon fiable tant que la stat est en dessous d'environ **20× le bonus de
> la rune** » : rune +1 → jusqu'à ~20, Pa (+3) → ~60, Ra (+10) → ~200.

Précisions et tensions :
* `kankhun#3768` (forgemage expérimenté) : « ça commence à merder vers **16×**, et passé **20×**
  bon courage. »
* `killer-eca66613#5482` : « une rune cha simple passe facilement jusqu'à **~30** chance, la pa cha
  jusqu'à **~70** » — **mais** ces seuils dépendent du **jet max de la ligne** : sur un item à
  100 chance max, la pa cha passe bien jusqu'à 70-80 ; sur un item à 80 max, c'est plus dur à 70.
* Courbe empirique (Pro-Vise, ligne 40 sagesse max) : 0→20 pts ≈ 99 % ; 20→30 ≈ 95 % ;
  30→35 ≈ 90 % ; au-delà de 35, dégression drastique. **[SUPP]**

➡️ **Ce n'est PAS un seuil binaire** : c'est une dégradation continue, et elle est **corrélée**
au facteur « remplissage du jet » (§7.4). Les deux facteurs se recouvrent partiellement.
➡️ Modélisé dans `fm_sim.py` par le facteur `t` (§3.6), désactivable
(`ModelParams.utiliser_regle_x20 = False`) pour tester si le facteur `c` suffit à l'expliquer.

⚠️ **La « condition icosagonale » / « loi du 19 »** : ce vocabulaire n'existe dans **aucune**
source du corpus, sauf une occurrence dans un post de projet ML (« la rune n'est pas 19 fois
inférieure à la stat courante »). C'est très probablement une reformulation de la règle du ×20
(*au plus 19 runes d'un palier avant de changer de palier*). **Ne pas en faire une règle distincte.**

## 7.3 L'exo — 1 %, en succès critique uniquement

| Fait | Statut |
|---|---|
| Un exo PA / PM / PO ne passe **jamais** en succès neutre : le triplet est `1 / 0 / 99` | **[OBS]** DevBlog #5 |
| **Avec puits** disponible, le triplet devient `1 / 22 / 77` | **[OBS]** DevBlog #4 |
| Le taux de SC d'un exo est **1 %**, quel que soit l'objet, la rune, le puits, le niveau de métier | **[CONS]** |
| Mesure réelle : **111 exos PM / 10 000 tentatives = 1.11 %**, IC95 = **[0.905 % ; 1.315 %]** | **[OBS]** |
| ➡️ **Coder 1 %, pas 1.11 %** : l'écart n'est pas significatif (il faudrait ~40 000 tentatives) | **[OBS]** |
| Hypothèse « P(SC exo) = 1 / poids de la rune » (1/90 PM, 1/100 PA, 1/51 PO) | **[SUPP] réfutée** — sinon le PO passerait 2× plus souvent que le PA, ce qui n'est pas observé |
| Maximum **1 PA + 1 PM + 1 PO** exotiques par objet (MàJ 2.3.4, 29/03/2011) | **[OBS]** |
| Caps personnage : **12 PA / 6 PM / 9 PO** (équipements + consommables) | **[OBS]** |
| Pour les exos de **petit poids** (Do Per So, Invo…), le SC reste ~1 % mais le **SN augmente** ; quand le SN dépasse ~50 %, le SC commence à monter | **[SUPP]** (kankhun) |
| Un over est **beaucoup plus facile** qu'un exo (10 % observé sur une rés en over) | **[SUPP]** |
| Le premier % de rés en exo, **même avec puits**, reste sous **1/6** | **[SUPP]** |

**Espérance et dispersion (loi géométrique, p = 1/100)** **[OBS]** (mathématiques) :
```
E[X] = 100 tentatives · médiane ≈ 69 · σ ≈ 99.5
P(≥ 1 succès en n essais) = 1 − 0.99^n :   n=69 → 50 % · n=100 → 63 % · n=500 → 99.3 %
```
Un simulateur correct **doit** retomber sur ces chiffres. C'est le test d'acceptation n°1.

## 7.4 Dégressivité au-delà de 80 % du jet max — **[OBS]** DevBlog

> « Si le jet que l'on modifie est supérieur à **80 %** de la fourchette du jet, la difficulté
> augmente **brutalement**. » (2ᵉ facteur de difficulté par ordre d'importance)

Formalisation, recopiée de StarLoco (`Formulas.chanceFM`) **[CODE]** — avec
`f = 1 − (jet_max − (jet_courant + rune.add)) / (jet_max − jet_min)` = **taux de remplissage
du jet APRÈS la tentative** :
```
f > 1.0   (au-delà du jet max naturel)  ->  c = (1 − (f − 1)/2) / 2      # chute forte, puis /2
0.8 < f ≤ 1.0                           ->  c = 1 − f/2                   # chute modérée
f ≤ 0.8                                 ->  c = 1                         # aucune pénalité
c = max(0, c)
```
Valeurs : `f=0.8 → c=1` · `f=0.9 → c=0.55` · `f=1.0 → c=0.50` · `f=1.2 → c=0.45` · `f=1.5 → c=0.375`.
➡️ La transition à `f=0.8` est **discontinue** (c saute de 1.0 à 0.60). Cela colle bien au
« augmente **brutalement** » du DevBlog. **Garder la discontinuité.**

## 7.5 Autres règles dures

* **Niveau du métier** : influence le taux **en 1.29 / Rétro** (StarLoco : `canFM = false`
  si `lvlJob < lvlObjet/2`) **[CODE]** ; **aucune influence en Dofus 2.x / 3.x**
  (confirmé par le forum officiel, 2020) **[CONS]**. Paramètre par version.
* **Runes de transcendance** : 100 % de réussite, mais l'objet devient **définitivement
  non-forgemageable** et non réinitialisable par orbe. **[OBS]** Devblog 2.58.
* **Runes de corruption** (bonus + malus simultanés) : introduites en 2.49, **supprimées** depuis. **[OBS]**
* **Orbes de forgemagie** : remettent les stats aux valeurs de craft et **effacent le puits**.
  4 orbes par tranche de niveau (60/120/180/200). **[CONS]**
* **Un objet ne se détruit JAMAIS pendant une forgemagie.** Il n'y a pas de « casse » d'objet
  en FM ; « casser » désigne le **brisage** au concasseur (§8) ou, familièrement, une ligne
  qui tombe à 0. **[OBS]**
* **Interface** : 19 lignes d'effets affichées au maximum (2.29). Sans effet sur les probabilités. **[OBS]**

---

# 8. BRISAGE (obtention des runes) — hors du cœur FM, mais nécessaire pour l'économie

> ⚠️ Ne pas confondre avec la « casse » d'un objet en FM : **elle n'existe pas** (§7.5).

Ankama a explicitement refusé de publier ces formules aussi (Devblog 02/02/2015) :
> « Nous ne voulons pas dévoiler ces formules, mais vous pourrez essayer de les déterminer
> de façon empirique en jouant. » **[OBS]**

## 8.1 Modèle historique JOL (valide en **Rétro 1.29** uniquement) **[CONS]**

```
puissance_réelle = jet × (2/3) × U        avec U ~ Uniforme(0.9, 1.1)
x = puissance_réelle
n = floor(x) ; y = x − n
→ n runes garanties, décomposées en 4×Ba + 2×Pa + 1×Ra  (règle de conversion par paliers)
→ + une rune supplémentaire avec probabilité y
```
Le taux d'obtention est **bridé à 2/3 (66.66 %)** pour les runes sans palier Pa/Ra
(Ga Pa, Ga Pme, Po). **[CONS]**

Seuils « 100 % » par rune : `100 % de X = [puissance_intermédiaire(X) / (2/3)] / 0.9`
```
Ba :  Vi 5   · Sa/Fo/Ine/Cha/Age 2   · Ini/Pod 17
Pa :  Vi 27  · Sa/Fo/Ine/Cha/Age 9   · Ini/Pod 84
Ra :  Vi 104 · Sa/Fo/Ine/Cha/Age 34  · Ini/Pod 334
```
(⚠️ contradiction : le forum officiel donne **109** vita pour 100 % de Ra Vi, le wiki JOL **104**.)

Table de probabilité d'obtenir une **Ra** selon le jet (utilisable telle quelle) **[CONS]** :
`≤23 : 0 % · 24 : 8 % · 25 : 20 % · 26 : 31 % · 27 : 41 % · 28 : 50 % · 29 : 59 % · 30 : 67 % ·
31 : 74 % · 32 : 81 % · 33 : 88 % · 34 : 94 % · ≥35 : 100 %`

## 8.2 Dofus 2.x / 3.x — **toutes les tables ci-dessus sont OBSOLÈTES**

Refonte totale en **2.27** (02/02/2015) **[OBS]** :
* nouvelle formule, générant **plus de runes que la valeur des effets** sur le haut niveau ;
* **« formule méta » dynamique** : bonus/malus de génération calculés **en temps réel après chaque
  destruction**, **indépendamment par serveur**, connus **seulement après avoir brisé** ;
* amplitude annoncée : génération **×100** ou **÷100** ;
* objets **sans recette** : malus fixe de **−50 %** ;
* runes générées directement dans l'inventaire (fin des fragments) ;
* ajout ultérieur d'un **système de focus** (concentrer la génération sur une rune).

➡️ **Le brisage en Dofus 2/3 n'est PAS simulable de façon prédictive** : il dépend d'un état
serveur global et non publié. Modéliser un simple `coeff_brisage` global exposé à l'utilisateur
(les sites de FM publient des coefficients par serveur, ex. « 250 % sur Merkator »).

## 8.3 Formule communautaire de poids de ligne au brisage (à titre indicatif) **[SUPP]**

`Hildreya/roue-de-gamma — forgemagie/calculator.js`, recopiée :
```js
// poids = (quantité_stat × densité_rune × niveau_item × 3) / (200 × effet_rune) + 1
function calculateStatWeight(statValue, runeKey, itemLevel) {
    const rune = RUNES_DATA[runeKey];
    if (!rune) return 1;
    return (statValue * rune.density * itemLevel * 3) / (200 * rune.effect) + 1;
}
// statValue utilisé = (min + max) / 2
```
Formules de rentabilité du même module :
```
rentabilité_i          = ratio_i × [poids_i + 0.5 × (Σ poids − poids_i)]
ratio_rune             = prix_rune / densité_rune
% limite AVEC focus    = (prix_item × 100) / rentabilité_focus
rentabilité SANS focus = Σ (poids_x × ratio_x)
```
Fiabilité annoncée par l'auteur du calculateur Papycha équivalent : « sur 200 tentatives testées,
le calculateur donne un résultat faux **34 fois** » (~17 % d'erreur, erreur max 7 %).

## 8.4 Potions de changement d'élément (armes) **[CONS]**

| Potion (palier) | Dégâts conservés | Taux de réussite |
|---|---|---|
| Étincelle / Secousse / Crachin / Courant d'Air (niv. 1) | 50 % | **50 %** |
| Flambée / Éboulement / Averse / Rafale (niv. 25) | 65 % | **35 %** |
| Incendie / Séisme / Tsunami / Ouragan (niv. 50) | 80 % (ou 85 %) | **20 %** |

Formule Rétro correspondante (StarLoco + Ancestra, identique dans les deux) **[CODE]** :
```java
K = 100 (rune niv.1) | 175 (niv.25) | 350 (niv.50)
chance = (lvlMetier * 100) / (K + lvlObjet)
chance = clamp(chance, lvlMetier/20, 100 − lvlMetier/20)
// en cas de succès, les dégâts sont recalculés à coef % : 50 (niv1) / 65 (niv25) / 85 (niv50)
```

---

# 9. DIFFÉRENCES RÉTRO 1.29/1.49 ↔ DOFUS 2.x/3.x

| Élément | RÉTRO (1.29 / 1.49) | DOFUS 2.x / 3.x | Fiabilité |
|---|---|---|---|
| Coef **Vitalité** | **0.25** (Vi=+3, PaVi=+10, RaVi=+30) | **0.2** (Vi=+5, PaVi=+15, RaVi=+50) | [OBS] code + DofusDB |
| Poids des runes Vi | **arrondis sup.** : 1 / 3 / **8** | exacts : 1 / 3 / 10 | [CONS] |
| Overmax Vitalité | **404** | **505** | [CONS] |
| Coef **Coup Critique** | **30** (overmax 3) | **10** (overmax 10) | [OBS] |
| Coef **Soins** | **15–20** (overmax 5) | **10** (overmax 10) | [OBS/CONS] |
| Coef **Renvoi de dommages** | **30** | **10** | [CONS] |
| Coef **Fuite / Tacle** | **5** | **4** | [CONS] |
| Coef **Portée** | 50 (Ancestra) / 51 (StarLoco, consensus) | **51** | [CONS] — retenir 51 |
| Arrondis | `floor()` systématique sur les poids d'objet, **arrondi supérieur** sur le poids des runes Vi | non documenté | [SUPP] contradictoire |
| **Niveau du métier** influence le taux | **OUI** (`canFM=false` si lvlJob < lvlObjet/2) | **NON** | [CODE] / [CONS] |
| Rune **Ga Po** | n'existe pas (mais « Rune Po » existe) | n'existe pas non plus | [OBS] |
| Le puits protège intégralement | **NON** — bug reconnu, runes Vi/Pa Vi tapent quand même | oui (aux priorités près) | [OBS] |
| Restriction 1 PA + 1 PM + 1 PO exo | non (antérieure à 2011) | **oui** (2.3.4) | [OBS] |
| Runes transcendance / signature / astrales | n'existent pas | existent (2.49+) | [OBS] |
| Taux de brisage | tables JOL 2009-2011 **valides** | **obsolètes** depuis 2.27 (formule méta par serveur) | [OBS] |
| Plafond d'over | fixe (`101/coef`), ou dépendant du niveau chez Ancestra (`BaseMax × (2 − lvl/100)`) | fixe (`101/coef`) | [CODE] |

## 9.1 Chronologie des changements d'algorithme **[OBS]**

| Date | Version | Changement |
|---|---|---|
| 29/03/2011 | 2.3.4 | Max 1 PA / 1 PM / 1 PO exo par objet ; caps perso 12/6/9 |
| 02/02/2015 | 2.27 | **Refonte totale du brisage** (formule méta dynamique par serveur) |
| 25/05/2015 | 2.29 | Refonte de l'interface FM (inspirée du module SmithMagic) ; 19 lignes max ; **refus explicite d'afficher reliquat et probabilités** |
| 2018 | 2.49 | Runes de transcendance et de corruption |
| ~2019 | ? | Suppression des runes de corruption (dégradation ressentie des taux, jamais confirmée) |
| 10/11/2020 | 2.58 | Mode avancé ; **affichage de la « densité de rune » dans l'infobulle** ; SN en jaune, exo en bleu, over en vert clair ; blocage FM après rune de transcendance |
| 2024-2026 | 3.x (Unity) | **Aucun changement d'algorithme FM identifié** dans les patch notes consultés |

➡️ **Aucune modification publique de la formule de probabilité depuis au moins 2011.**
Un modèle calibré aujourd'hui devrait rester valide.

---

# 10. AUTRES MÉCANIQUES ET FAUSSES PISTES

* **« Échec neutre »** : ce n'est pas une 4ᵉ issue, c'est un **artefact d'affichage**. **[CONS]**
  Deux cas : (a) un SN où la perte touche justement la ligne visée → la rune passe mais la stat
  ne bouge pas ; (b) un EC sur un objet qui n'a plus rien à perdre → rien ne se passe.
  ➡️ Le simulateur doit distinguer `issue` (SC/SN/EC, la **mécanique**) de `affichage`
  (SC/SN/EC/« échec neutre », ce que **voit** le joueur). Indispensable si l'on veut calibrer
  sur des observations de joueurs, qui ne rapportent que l'affichage.
* **Système avec ou sans mémoire ?** Question ouverte, aucune donnée. Un joueur rapporte
  l'impression qu'enchaîner des crits sur une ligne amène ensuite des échecs sur cette ligne,
  même en revenant au même état. **[SUPP]** — modéliser **sans mémoire** par défaut
  (chaîne de Markov sur l'état de l'objet) et laisser l'hypothèse mémoire à tester.
* **Le nombre de lignes influence-t-il le taux ?** Indirectement seulement, via `PWRg`. **[SUPP]**
* **Le type de rune influence-t-il le taux ?** « d'expérience j'ai pas senti de différence
  notable » (kankhun). ➡️ **non**, seul le poids compte. **[SUPP]**
* **« Ma… », « Bricoleur », « Insolent », « Ga Po »** : **aucune occurrence** dans les 105 runes
  de DofusDB ni dans aucun dump. Ces termes ne correspondent à aucune mécanique de FM identifiée. **[OBS]**
* **« Le poids double au-delà de 100 en stat primaire »** (une seule source SEO) : **non corroboré,
  à ignorer.** **[SUPP réfutée]**

---

# 11. INCERTITUDES — chaque constante non vérifiée, et comment la calibrer

Tableau de travail. Colonne « Effet » = comment l'erreur se manifeste dans la simulation.
Colonne « Calibration » renvoie aux protocoles du §12.

## 11.1 Constantes de la fonction de probabilité — **toutes [SUPP]**

| # | Constante | Défaut | Origine | Effet si fausse | Comment la calibrer |
|---|---|---:|---|---|---|
| U1 | `FACTEUR_DIFF` (le `1.3` de `diff = \|PWRmax×1.3 − PWRg\|`) | 1.3 | StarLoco seul | Déplace tout le niveau général des taux | Protocole **A** : ajuster pour que le remontage d'une ligne à 50 % du jet donne ~66 % de SC |
| U2 | `PLAFOND_MSTAT` (le `1.2`) | 1.2 | StarLoco seul | Plafonne la facilité sur les objets à bas jet | Protocole **A**, cellules à `PWRg/PWRmax < 0.4` |
| U3 | `SEUIL_DEGRESSIF` | 0.80 | **DevBlog [OBS]** | Position de la cassure de difficulté | Protocole **B** : balayer le remplissage du jet par pas de 5 % et chercher la discontinuité |
| U4 | Forme de `c` au-delà de 80 % (`1 − f/2`) et au-delà de 100 % (`(1−(f−1)/2)/2`) | StarLoco | StarLoco seul | Vitesse de la dégression en fin de jet et en over | Protocole **B** |
| U5 | `PENALITE_OVER` (`x = 0.8` si over) | 0.8 | StarLoco seul | Difficulté de l'over ; interagit avec U4 (double comptage possible) | Protocole **C** |
| U6 | `COEF_EXO` | 0.25 | StarLoco + Ancestra (**concordants**) | Taux d'exo. Mais le plancher à 1 % masque ce paramètre dans la plupart des cas | Protocole **D** |
| U7 | `COEF_NEG` | 0.50 (StarLoco) / 0.75 (Ancestra) | **divergent** | Difficulté de remonter un malus | Protocole **E** |
| U8 | Pondération de `PWRcarac` : ×1 / ×3 / ×8 | 1/3/8 | StarLoco seul, **jamais expliqué** | Rend le 2ᵉ point d'exo quasi impossible | Protocole **D** (2ᵉ exo) |
| U9 | Pondération de `PWRg` : ×1 / ×3 / ×2 | 1/3/2 | StarLoco seul | Le poids d'un item exoté est surévalué | Protocole **A** sur items exotés vs non exotés |
| U10 | `SEUIL_X20_DOUX` / `SEUIL_X20_DUR` | 16 / 20 | kankhun **[SUPP]** | Position du décrochage « rune trop petite » | Protocole **F** — **le plus rentable à mesurer** |
| U11 | `PENAL_X20` / `EXPOSANT_X20` | 0.35 / 2 | **inventés** | Forme de la queue au-delà de 20× | Protocole **F** |
| U12 | Le triplet « jet parfait » | 34/50/16 **ou** 43/50/7 | **relais divergents** | Ancre haute du modèle | Protocole **B**, cellule `f ≈ 1.0` |
| U13 | `SN_AVEC_PUITS` (le 22 % de `1/22/77`) | 22 | **[OBS]** DevBlog, mais seulement pour le cas exo-plancher | Généralisation du 22 % aux cas non-plancher : **arbitraire** | Protocole **D** avec/sans puits |
| U14 | Le plancher exo : `1/100` ou `1/101` | 1/100 | consensus vs code | Écart de 1 % relatif, **non mesurable** avant ~40 000 tentatives | ne pas chercher à trancher |
| U15 | Y a-t-il de la **mémoire** dans le système ? | non | question ouverte | Invaliderait toute l'approche markovienne | Protocole **G** |
| **U31** | `exposant_taille` — mise à l'échelle avec la taille de l'objet | **0.4** | **découvert ici** (§3.7). StarLoco (`e = 1`) rend les gros objets *plus faciles*, contrairement au DevBlog | Le facteur de difficulté **n°1** selon Ankama. Une erreur ici fausse tout | Protocole **A**, en faisant varier `PWRmax` (objets de niveaux/complexités très différents) à `f` constant |
| **U32** | Terme dépendant du **niveau de l'objet** | **absent** | 3ᵉ facteur cité par Ankama, **absent de toutes** les formules d'émulateur | Expliquerait peut-être l'écart résiduel sur l'ancre 3 | Protocole **A** sur 3 objets de même `PWRmax` mais de niveaux très différents |

## 11.2 Constantes de la mécanique de perte — **toutes [SUPP] sauf mention**

| # | Constante | Défaut | Effet si fausse | Calibration |
|---|---|---:|---|---|
| U16 | `PLANCHER_PERTE` (jamais plus de −25 % d'une stat d'un coup) | 0.75 | Vitesse à laquelle un objet « se vide » sur une série d'EC | Protocole **H** : logger la valeur avant/après sur chaque EC |
| U17 | `MULT_PERTE_OVER` (double peine sur l'over) | 2.0 | Fragilité des overs | Protocole **H**, séparer les EC avec/sans over |
| U18 | Ordre de priorité des pertes | « communaute » | Quelle ligne saute en premier | Protocole **H** : compter les fréquences par type de ligne |
| U19 | La ligne ciblée est-elle épargnée par la perte ? | oui | Fréquence des « échecs neutres » | Protocole **H** |
| U20 | Le puits est-il consommé en **SC** ? | non consommé ; mais `−poids_rune` appliqué | **Contradiction non résolue** : StarLoco décrémente aux 3 issues, SmithMagic seulement en SN/EC, Xixou dit qu'en 1.29 le puits diminue aussi en SC | Protocole **I** — question posée sur JOL en 11/2024, **restée sans réponse** |
| U21 | Le puits influence-t-il **P_SC** ? | non | **Contradiction non résolue** : Ancestra a un terme `+2×puits` au numérateur ; kankhun et LPBA affirment que non | Protocole **I** |
| U22 | Bonus puits de StarLoco (`puits ≥ rune.add` → 50 % de SC forcé) | **désactivé** par défaut | Rendrait la FM avec puits beaucoup trop facile ; probablement un ajout d'émulateur | Protocole **I** |
| U23 | `p_fuite_puits` (Rétro : les runes Vi tapent malgré le puits) | 0 | Sous-estime les pertes en Rétro sur la vitalité | Protocole **H**, Rétro, runes Vi uniquement |

## 11.3 Constantes des tables de poids

| # | Point | Statut | Comment trancher |
|---|---|---|---|
| U24 | Coef Vitalité : 0.2 vs 0.25 vs 0.75 vs 1 | version-dépendant | **Mesurable sans FM** : passer 1 rune Vi et lire la densité affichée en infobulle (2.58+). Vérifier `overmax_vita × coef = 101` |
| U25 | Coef CC : 10 vs 30 | version-dépendant | idem, ou vérifier l'overmax observé (3 → coef 30 ; 10 → coef 10) |
| U26 | Coef Soins : 10 vs 15 vs 20 | version-dépendant | idem |
| U27 | Portée : 50 vs 51 | 51 (consensus) | idem — l'infobulle 2.58+ donne la réponse |
| U28 | Table des **malus** (asymétrique) | [OBS] SmithMagic, mais jamais revérifiée depuis | passer une rune sur une ligne négative et comparer les puits générés |
| U29 | `Rune de chasse` : poids **−1** (négatif) ou +5 | contradictoire | infobulle |
| U30 | Cap over/exo : 101 vs 110 | 101 (cohérence parfaite avec tous les caps par stat) | tenter une ligne à poids 102-110 en over : impossible ⇒ 101 |

➡️ **U24-U30 sont les seules incertitudes que l'utilisateur peut lever SANS aucune statistique**,
simplement en lisant l'infobulle de densité de rune en jeu (Dofus ≥ 2.58). **À faire en premier.**

## 11.4 Ce qui reste structurellement inconnaissable

1. **La vraie formule d'Ankama.** Elle n'a jamais été publiée et ne le sera pas.
   Le meilleur objectif atteignable est un modèle qui **reproduit les taux observés**,
   pas qui reproduit le code.
2. **Le brisage en Dofus 2/3** dépend d'un état serveur global non publié (§8.2).
3. **Le contenu exact du DevBlog 1.27** — les deux relais divergent sur un triplet (U12).
   Une recherche sur `web.archive.org` (inaccessible depuis l'environnement de collecte)
   pourrait le retrouver : c'est la piste non explorée la plus rentable.

---

# 12. PROTOCOLE DE CALIBRATION

Objectif : passer d'un modèle **plausible** à un modèle **calibré sur tes propres données**.

## 12.1 Étape 0 — les mesures gratuites (à faire avant toute statistique)

Depuis la **2.58**, l'infobulle d'une rune affiche sa **« densité »**. Cela permet de vérifier
**directement**, sans aucune tentative, les incertitudes **U24 à U30** :
1. Survoler chaque rune que tu comptes utiliser → noter `densité` et `valeur ajoutée`.
2. `COEF[stat] = densité / valeur_ajoutée`.
3. Vérifier `⌊101 / COEF[stat]⌋ = overmax observé` pour cette stat.
4. Remplir la table `COEF` de `fm_sim.py` avec **tes** valeurs. **Fait, ~15 minutes, zéro tentative.**

Si tu joues en **Rétro** (pas d'infobulle de densité) : déduire les coefficients des puits générés.
Passe une rune de poids connu sur un objet à 2 lignes seulement, note la ligne qui saute et
de combien : `COEF = puits_observé_+_poids_rune / valeur_perdue`.

## 12.2 Le journal de tentatives — schéma de données à logger

**Une ligne par tentative.** C'est le format que `fm_sim.py` sait relire
(`ModelParams.from_csv` / `calibrate.py`). Colonnes **obligatoires** :

```csv
ts,item_id,item_template,item_level,version,rune_stat,rune_add,rune_poids,
cible_valeur_avant,cible_jet_min,cible_jet_max,cible_est_exo,cible_est_over,
pwr_g,pwr_min,pwr_max,pwr_carac,puits_avant,nb_lignes,
issue,affichage,cible_valeur_apres,lignes_perdues,poids_perdu,puits_apres
```

| Champ | Comment l'obtenir | Pourquoi il est indispensable |
|---|---|---|
| `pwr_g`, `pwr_min`, `pwr_max` | calculés par ton simulateur à partir de l'état de l'objet et du template | **Le facteur de difficulté n°1 selon Ankama.** Sans lui, aucune calibration n'est possible |
| `cible_valeur_avant`, `cible_jet_min`, `cible_jet_max` | template de l'objet (DofusDB / dofusdude) | Facteur n°2 (les 80 %) |
| `rune_add`, `rune_poids` | table de densité (§12.1) | Règle du ×20 et dénominateur `b` |
| `puits_avant` | **suivi par ton propre outil**, pas par le jeu (invisible) | Sépare les hypothèses U13/U20/U21 |
| `issue` | **déduite**, pas observée : SC si aucune perte, SN si rune passée + perte, EC si rune non passée | c'est la variable expliquée |
| `affichage` | ce que le jeu montre littéralement (couleur / message) | permet de détecter les « échecs neutres » et donc de valider U19 |
| `lignes_perdues`, `poids_perdu` | diff avant/après de toutes les lignes | calibre **U16-U19** en même temps, gratuitement |

**Conseil pratique décisif** : logue **tout**, y compris les tentatives « inintéressantes ».
Le biais de sélection est l'erreur n°1 de toutes les données FM existantes
(les joueurs ne rapportent que leurs réussites — c'est pour cela que les chiffres du type
« j'ai mis 15 runes » du forum sont inutilisables).

## 12.3 Plan d'expérience — combien de tentatives par cellule ?

Modèle : chaque tentative est un tirage multinomial à 3 issues. Pour estimer une proportion `p`
avec une demi-largeur d'IC95 de `ε` :
```
n ≈ 1.96² × p(1−p) / ε²        (approx. normale, valable si n·p ≥ 10)
```

| Objectif | p attendu | Précision visée | **n par cellule** |
|---|---:|---:|---:|
| Distinguer 60 % de 70 % | ~0.65 | ±5 pts | **350** |
| Distinguer 30 % de 40 % | ~0.35 | ±5 pts | **350** |
| Estimer un taux ~15 % à ±3 pts | 0.15 | ±3 pts | **545** |
| Localiser la cassure des 80 % (§7.4) | — | — | **150 par pas de 5 %** sur `f ∈ [0.6, 1.1]` → 11 cellules ≈ **1 650** |
| Confirmer le plancher exo à 1 % (±0.3 pt) | 0.01 | ±0.3 pt | **4 200** |
| **Réfuter** 1 % au profit de 1.11 % | 0.011 | — | **~40 000** — *ne le tente pas* |
| Calibrer la courbe du ×20 (U10/U11) | variable | ±7 pts | **200 par palier de ratio**, ratios {5, 10, 14, 16, 18, 20, 25, 30} → **1 600** |

➡️ **Budget réaliste conseillé : 2 000 à 3 000 tentatives bien réparties.** C'est déjà mieux
que tout ce qui existe publiquement. Réparties ainsi :
* **600** sur le facteur « remplissage du jet » `f` (protocole B) — le facteur n°1 après PWRg ;
* **600** sur la règle du ×20 (protocole F) — la plus grosse incertitude « inventée » du modèle ;
* **400** sur `PWRg/PWRmax` à `f` constant (protocole A) — isole le facteur global ;
* **400** sur puits vs sans puits, même état (protocole I) — tranche U20/U21, question ouverte
  depuis 2024 sur laquelle **personne n'a de réponse publique** ;
* **le reste** en pertes/EC (protocole H), qui se collecte **gratuitement** en sous-produit
  de tous les autres protocoles.

## 12.4 Les protocoles, un par incertitude

> **Règle d'or commune** : dans chaque protocole, **ne faire varier qu'une seule chose**.
> Réinitialiser l'objet à l'orbe entre les séries pour repartir d'un état identique **et d'un
> puits nul** (les orbes effacent le puits — c'est le seul moyen de contrôler cette variable).

**A — Facteur « qualité globale de l'objet » (U1, U2, U9).**
Prendre 4 objets du **même template**, amenés à des `PWRg/PWRmax` de ~0.3, 0.5, 0.7, 0.9,
mais tenter à chaque fois **la même ligne au même remplissage `f`** (choisir une ligne
volontairement basse). 100 tentatives par objet. Régresser `logit(P_SC)` sur `PWRg/PWRmax`.
*Variante U9 : refaire avec un objet portant un exo, comparer.*

**B — Cassure des 80 % (U3, U4, U12).**
Un seul objet, une seule ligne, une seule rune. Monter la ligne pas à pas de `f = 0.60` à
`f = 1.10`, 150 tentatives à chaque palier de 5 %. Tracer `P_SC(f)`. Chercher :
(a) la position de la discontinuité, (b) la pente avant, (c) la pente après, (d) la valeur
en `f = 1.0` — qui tranche directement **U12** (34/50/16 vs 43/50/7).
*C'est LE protocole à faire en premier si tu n'en fais qu'un.*

**C — Pénalité d'over (U5).**
Même objet, même ligne, comparer `f = 0.99` (sous le max) et `f = 1.01` (juste au-dessus).
200 tentatives de chaque côté. La chute observée = `PENALITE_OVER × (effet de c)`.
Comme B mesure déjà `c`, on isole `PENALITE_OVER` par division.

**D — Exos (U6, U8, U13).**
Trois séries de 500 tentatives : (a) exo PM sur objet **sans** puits, (b) exo PM sur objet **avec**
puits ≥ poids rune maintenu, (c) exo **d'une petite stat** (Do Per So, Invo) sans puits.
Comparer les trois `P_SC` **et** les trois `P_SN`. C'est la seule façon de tester si le
`1/22/77` du DevBlog est réel, et si les exos de petit poids ont bien un SN non nul.
*Un 2ᵉ exo sur le même objet (série d) teste U8 — mais c'est coûteux.*

**E — Lignes négatives (U7).**
Objet à malus natif (ex. −20 initiative). Remonter le malus par paliers, 150 tentatives par
palier. Comparer à la même expérience sur une ligne positive de poids équivalent : le rapport
des `P_SC` donne `COEF_NEG` directement (0.50 ou 0.75).

**F — Règle du ×20 (U10, U11).**
Une ligne à **très large fourchette** (idéalement `jet_max` ≥ 300× la valeur de la rune, ex. une
grosse ligne de vitalité) pour que `f` reste **quasi constant et bas** pendant toute l'expérience —
c'est ce qui **découple** l'effet ×20 de l'effet « remplissage ». Utiliser une rune simple
et monter la ligne. Mesurer `P_SC` aux ratios `value/rune.add` ∈ {5, 10, 14, 16, 18, 20, 25, 30},
200 tentatives chacun.
➡️ **Test décisif** : si `P_SC` ne décroche pas alors que `f` est constant, alors **la règle du
×20 n'existe pas** et n'est qu'un effet de bord du facteur `c` → mettre
`utiliser_regle_x20 = False`. Ce serait un résultat publiable.

**G — Mémoire du système (U15).**
Amener un objet à un état E. Enregistrer 100 tentatives. Le ramener **exactement** au même état E
(mêmes valeurs sur toutes les lignes) par un chemin différent — dont un passage par orbe pour
garantir un puits nul. Refaire 100 tentatives. Test du χ² d'homogénéité sur les deux triplets.
Si l'hypothèse « sans mémoire » tient, les deux distributions sont indistinguables.

**H — Mécanique de perte (U16-U19, U23). Gratuit** : se collecte en sous-produit de A-G.
Pour chaque EC/SN avec perte, logger toutes les lignes avant/après. Puis :
* histogramme de `(valeur_avant − valeur_après) / valeur_avant` → borne inférieure = `PLANCHER_PERTE` (U16) ;
* fréquence « la ligne over saute » ÷ « une ligne normale saute », à effectif comparable → `MULT_PERTE_OVER` (U17) ;
* ordre observé des lignes touchées → **U18** (départage les deux ordres du §5.3) ;
* fréquence des cas où la **ligne ciblée** perd de la valeur → **U19**.

**I — Le puits (U20, U21, U22, U13). La question la plus ouverte du domaine.**
Deux séries **au même état d'objet** (via orbe), même rune, même ligne :
* série 1 : puits nul (juste après orbe) ;
* série 2 : puits > poids de la rune (créé volontairement en faisant sauter une grosse ligne).
300 tentatives chacune. Comparer les **trois** taux :
* si `P_SC` identique et `P_SN` supérieur en série 2 → **U21 = non, U13 = oui** (le puits
  transforme des EC en SN). C'est l'hypothèse du modèle par défaut.
* si `P_SC` supérieur en série 2 → **U21 = oui**, la formule d'Ancestra (`+2×puits`) a raison
  et il faut ajouter le terme au numérateur.
* si `P_SC` ≈ 50 % dès qu'il y a du puits → le bonus de StarLoco (U22) est réel — peu probable.
**Pour U20** (le puits est-il décrémenté en SC ?) : mesurer le puits par la méthode indirecte —
faire N succès critiques d'affilée avec une rune de poids `w`, puis compter combien d'EC il faut
ensuite pour commencer à perdre des stats. Si le puits a été décrémenté de `N×w`, la protection
disparaît plus tôt.

## 12.5 Méthode d'estimation

**Étape 1 — non paramétrique d'abord.** Ne pas ajuster le modèle tout de suite. Tracer
`P_SC`, `P_SN`, `P_EC` observés par cellule, avec les IC de Wilson (pas Wald : les proportions
sont proches de 0 ou 1 dans une bonne partie du domaine) :
```
IC_Wilson(p̂, n, z=1.96) = ( p̂ + z²/2n ± z·sqrt( p̂(1−p̂)/n + z²/4n² ) ) / (1 + z²/n)
```
Regarder les courbes **avant** de choisir une forme fonctionnelle. Si la cassure des 80 %
n'apparaît pas, ne pas la coder.

**Étape 2 — ajustement des paramètres.** Le modèle du §3.6 est un multinomial à 3 issues.
Maximiser la log-vraisemblance sur le vecteur de paramètres `θ` :
```
ℓ(θ) = Σ_i [ 1{SC_i}·log P_SC(x_i;θ) + 1{SN_i}·log P_SN(x_i;θ) + 1{EC_i}·log P_EC(x_i;θ) ]
```
`P` n'est pas différentiable (`floor`, clamps, discontinuité en 0.8) → **ne pas utiliser de
gradient**. Utiliser :
* **Nelder-Mead** ou **Powell** (`scipy.optimize.minimize`) si scipy est disponible ;
* sinon, l'optimiseur **coordonnée par coordonnée** fourni dans `fm_sim.py`
  (`calibrate_coordinate_descent`, stdlib pure) : balayage en grille sur chaque paramètre
  à tour de rôle, 3 passes. Suffisant pour 8-12 paramètres et quelques milliers d'observations.

**Étape 3 — contraintes.** Imposer en dur pendant l'optimisation :
`P_SC ≥ 0.01`, `P_SN ≤ 0.50`, `P_SC ≤ 0.66`. Ce sont les seules valeurs **officielles** du
système ; un ajustement qui les viole est faux même s'il colle mieux aux données.

**Étape 4 — validation croisée.** Séparer les données par **objet** (pas au hasard) :
calibrer sur 3 objets, valider sur le 4ᵉ. Un modèle qui ne généralise pas d'un objet à l'autre
a appris `PWRmax` par cœur au lieu d'apprendre le mécanisme.

**Étape 5 — tests d'acceptation** (à faire tourner à chaque recalibration ; ils sont dans
`test_fm_sim.py`) :
```
T1  exo PM, 100 000 tentatives           -> P_SC ∈ [0.9 %, 1.1 %]   et P_SN = 0
T2  exo PM avec puits                    -> P_SC inchangé, P_SN > 0
T3  loi géométrique                      -> nb moyen de tentatives par exo ≈ 100, médiane ≈ 69
T4  P(≥1 exo en n essais) = 1 − 0.99^n   -> n=69 → ~50 %, n=100 → ~63 %
T5  invariants                           -> ∀ état : P_SC ≥ 1 %, P_SN ≤ 50 %, P_SC ≤ 66 %, Σ = 1
T6  cap 101                              -> aucune ligne n'atteint jamais poids_over > 101
T7  conservation du puits                -> puits ≥ 0, et puits += perte − poids_rune vérifié pas à pas
T8  ligne basse, objet bas               -> triplet proche de 66/34/0
T9  jet parfait                          -> triplet proche de 34/50/16 (ou 43/50/7 selon U12)
```

## 12.6 Sources de données externes à exploiter avant de collecter soi-même

1. **Bots de FM qui loguent les tentatives** : `Vicfou-dev/dofus-fm-server` annonce un
   « historique complet des tentatives », mais **les logs restent chez chaque utilisateur**
   (le projet ne remonte rien). ➡️ Demander sur leur Discord un export : c'est de très loin
   la voie la plus rapide vers un dataset de plusieurs dizaines de milliers de lignes.
   Idem pour **ExoFast**.
2. **La vidéo des 10 000 tentatives** (Fek) : le comptage est filmé ; ré-annoter la vidéo
   donnerait la seule grande série existante, avec l'état de l'objet à chaque tentative.
3. **DevBlog 1.27 original** sur `web.archive.org` — trancherait **U12** définitivement.
4. **API DofusDB / dofusdude** pour les `jet_min` / `jet_max` de tous les templates
   (indispensables au calcul de `PWRmin`/`PWRmax`, et donc à toute calibration).

---

# 13. RÉCAPITULATIF POUR L'IMPLÉMENTEUR

**Ce que tu peux coder avec confiance (≈95 % sûr) :**
poids de ligne et d'objet · formule du puits · cap 101 et caps par stat dérivés de `101/coef` ·
`rune.add` fixe · exo = 1 % en SC uniquement, 0 % en SN sans puits · 1 PA + 1 PM + 1 PO max ·
disparition d'une ligne sous 1 · over prioritaire à la perte · pas de casse d'objet en FM ·
les bornes 1 % / 50 % / 66 %.

**Ce que tu dois coder comme paramétrable (et faux jusqu'à preuve du contraire) :**
toute la fonction `probabilite()` · la forme de la dégression après 80 % · la règle du ×20 ·
l'ordre exact des pertes · le pourcentage de perte par stat · le rôle exact du puits dans
les probabilités.

**Ce que tu ne dois pas essayer de simuler :**
le brisage en Dofus 2/3 · les taux exacts « connus » d'un site qui ne publie ni source ni méthode ·
une différence entre 1 % et 1.11 %.

**Ordre de travail conseillé :**
1. `COEF` correct (§12.1, 15 min, gratuit) → 2. modèle d'état + puits + pertes (déterministe,
testable) → 3. `probabilite()` avec le préréglage **ajusté** du §3.7 (`params_devblog_fit()`)
→ 4. tests T1-T9 → 5. collecte protocole **B** puis **F** → 6. recalibration → 7. le reste.

**Ce que ce document apporte de neuf par rapport au corpus de départ :**
* la confirmation, par les noms de variables (`PWRG`, `PWRmax`) et par les clamps 1/50/66,
  que la formule de StarLoco est une réimplémentation de la description du DevBlog 1.27 ;
* le **5ᵉ triplet officiel `1/22/77`** (exo *avec* puits), absent du corpus initial,
  re-vérifié en direct sur les deux relais du DevBlog ;
* la mise en évidence de l'**erreur de mise à l'échelle** de la formule StarLoco (U31) et
  sa correction par `exposant_taille` ;
* un préréglage qui reproduit **4 des 5 triplets officiels** à moins de 5 points ;
* l'identification des **bugs d'unité** de l'algorithme de perte de StarLoco (§6.1), qu'il
  ne faut surtout pas recopier tels quels.

---

*Fin de la spécification. Implémentation : `reference_impl/fm_sim.py`, tests : `reference_impl/test_fm_sim.py`.*

---

# 14. ADDENDUM — Wiki forgemagie.net récupéré (source primaire historique)

Ajouté après coup : le wiki de référence de la communauté FM francophone
(forgemagie.net, par ExiTeD, dernière MAJ 28/12/2015) a été retrouvé via la Wayback Machine.
Contenu intégral recopié dans `sources/archive/forgemagie-net-wiki.md`.
C'est la source dont dérivent, directement ou indirectement, la plupart des guides FM
français ultérieurs. Il confirme l'essentiel du présent document et apporte 4 corrections.

## 14.1 Confirmations **[CONS]** renforcées
* Formule du puits : `(Puits + PWR_Pertes) − PWR_Rune`, deux exemples chiffrés à l'appui.
  Le SC ne modifie pas le puits ; l'EC ne peut que le réduire. → identique au §5.
* Cap 101 sur over+exo, avec la déduction explicite `OVER = floor(101 / coef)`. → §7.1
* Règle du ×20 (difficile) / ×25 (quasi impossible sans puits). → §7.2
* SN plafonné à 50 %, SC toujours ≥ 1 %. → §3.
* Exo PA/PM/PO : probas **arbitraires** 1 % SC / 99 % EC, SN **impossible**, indépendantes
  de l'objet, de ses jets et de son niveau. Le puits n'améliore pas la réussite,
  il ne fait que compenser les pertes en EC. → §7.3

## 14.2 Correction 1 — l'ancre n°2 est contestée (43/50/7 vs 34/50/16)
Les deux relais indépendants du DevBlog 1.27 divergent sur le triplet « jet parfait » :

| Relais | SC | SN | EC |
|---|---|---|---|
| Wiki forgemagie.net (ExiTeD) | **43** | 50 | **7** |
| Blog Guilde Yin-Yang | **34** | 50 | **16** |
| Modèle calibré `fm_sim.py` | 38 | 49 | 13 |

Le modèle actuel tombe **exactement entre les deux**. Tant que le DevBlog original n'est pas
retrouvé, ne pas sur-ajuster sur l'un ou l'autre : traiter l'ancre 2 comme un intervalle
`SC ∈ [34 ; 43]`, `EC ∈ [7 ; 16]`. Cela réduit mécaniquement l'erreur résiduelle de §3.7.

## 14.3 Correction 2 — le jet en cours de modification est EXCLU du PWRG **[OBS]**
> « Le Jet en cours de modification n'est pas pris en compte dans le calcul du PWRG.
>   Également les Caractéristiques Exotiques ou Overmax interviennent dans le PWRG. »

À vérifier dans `fm_sim.py` : le poids global utilisé au dénominateur doit être
`PWRG_objet − PWR_ligne_ciblée`, pas `PWRG_objet`. Les over et exos, eux, comptent bien.
Impact non négligeable sur les objets à peu de lignes.

## 14.4 Correction 3 — le 3e facteur manquant : le NIVEAU DE L'OBJET **[OBS]**
> « Du Niveau de L'objet : ce paramètre intervient vraiment dans une moindre mesure comparé
>   aux 2 autres. La réussite diminue au fur et à mesure que le niveau de l'objet augmente. »

Ce facteur est **absent de tous les émulateurs étudiés** (StarLoco, Ancestra, Nao).
C'est très probablement la cause de l'écart irréductible de 10 points sur l'ancre 3 (§3.7).
Piste d'implémentation : un terme multiplicatif faible sur `a`, du type
`(1 − k · niveau_objet / 200)` avec `k` petit, à calibrer. À ajouter dans `ModelParams`.

⚠️ Contradiction interne à noter : ce même wiki affirme plus loin qu'un exo PA
« ne dépend ni de l'objet, ni de ses jets et encore moins de son niveau ». Les deux
énoncés sont compatibles : le niveau joue sur la FM normale, pas sur l'exo à proba fixe.

## 14.5 Correction 4 — mécanique d'épargne d'une ligne lourde (hypothèse ExiTeD) **[SUPP]**
> « Si le PWR pour 1 d'un jet est plus élevé que celui de la rune utilisée, ce jet a une chance
>   d'être épargné par la baisse mais ce n'est pas systématique. »
> Hypothèse : `P(la carac part quand même) = (PWR_Rune × 100) / PWR_Jet_qui_baisse` en %

Exemple donné : rune de PWR 6, l'algo tombe sur un CC (PWR 30) → 20 % de perdre le CC,
80 % de se tourner vers une autre carac. C'est une règle de **rejet** à insérer dans la boucle
de sélection aléatoire des pertes (§6.2), là où `fm_sim.py` utilise actuellement un tirage
uniforme. Non confirmée — la marquer `[SUPP]` et l'exposer en option dans `ModelParams`.

## 14.6 Ordre de priorité des pertes — la version du wiki
1. Le jet en Overmax → 2. Le jet en Exotique → 3. Le Puits → 4. caracs aléatoires

**Exception** : si l'objet a un over/exo **et** un puits, et que la rune utilisée n'est pas
différente de ladite carac, alors le **puits est prioritaire** sur l'over/exo.

C'est un **troisième ordre**, différent des deux déjà documentés au §5.3. Les trois sont
maintenant : (a) DevBlog, (b) communauté « puits d'abord », (c) wiki ci-dessus.
→ paramètre `ordre_pertes` à trois valeurs dans `ModelParams`, à trancher expérimentalement.

## 14.7 Concept opérationnel utile : le « plus gros puits exploitable »
`max(coef_stat) − min(coef_stat)` sur les lignes de l'objet. Amulette avec PA : 99 (100−1).
Bottes avec PM : 89. Ceinture Rasboulaire (PO) : 50 vs Chapignon : 29 — d'où la réputation
du Chapignon jet parfait. **Métrique à afficher dans le simulateur** : elle prédit à elle seule
une grande partie de la difficulté ressentie d'un objet.

## 14.8 Pistes archivées (non exploitées)
* **EasyFM** — simulateur FM hors-ligne de 2010 (overmax + 1 exo + affichage des probas).
  Binaire encore téléchargeable :
  `https://web.archive.org/web/20121226112220/http://www.forgemagie.net/EasyFM.rar`
  Son moteur de probabilités est une reconstruction indépendante → intéressant à décompiler.
* **Applet Java/GeoGebra « Probabilités Forgemagie Dofus 1.27 »** — courbes de probabilité
  paramétrées par *poids de la rune* et *niveau de l'objet*. La page
  `/easyfmproject/probabilites_2.html` renvoie 404 sur tous les snapshots testés. **Perdue.**
  Ce serait la meilleure source restante : chercher si quelqu'un en a gardé une copie
  (forum forgemagie.net archivé, sujet 566).
