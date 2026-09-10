# Forgemagie — règles de travail (à inclure dans le CLAUDE.md du projet)

> Colle ce bloc dans le `CLAUDE.md` à la racine du projet, ou garde ce fichier et
> référence-le depuis `CLAUDE.md` avec une ligne :
> `@docs/forgemagie/CLAUDE-FM.md` (import automatique par Claude Code).

## Contexte
Ce projet simule la forgemagie de DOFUS. **Ankama n'a jamais publié l'algorithme** et a
refusé de le faire (DevBlog 2.27 et 2.29). Aucun jeu de données brut public de tentatives
FM n'existe. Ce qu'on a : les bornes officielles, des tables de poids observables, et trois
rétro-ingénieries serveur. Le simulateur est donc un **modèle empirique calibrable**,
jamais une vérité.

## ⭐ Hiérarchie des sources — à respecter sans exception
* **SOURCE PRIMAIRE** : `docs/forgemagie/DEVBLOG-ANKAMA-ORIGINAL.md` — texte **intégral
  et verbatim** du DevBlog Ankama « La nouvelle forgemagie » (retrouvé sur archive.org le
  10/09/2026). **En cas de conflit, elle tranche.** Courte : la lire en entier.
* **SOURCES SECONDAIRES, parfois FAUTIVES** : blog Yin-Yang, blog Alterya, wiki
  forgemagie.net (ExiTeD), tutoriels Dofus-Touch, JOL. Aucune n'a jamais cité le DevBlog
  intégralement. Erreurs avérées : ancre 2 donnée à 34/50/16 (c'est **43/50/7**), triplet
  « 1/22/77 » **inventé**, « l'exo c'est 1 % » présenté comme universel (c'est un
  **plancher**). Ne jamais calibrer sur un relais.

Référence complète : `docs/forgemagie/ALGORITHME.md` (~1 900 lignes).
**Ne pas la lire en entier par défaut** — y aller par section quand la question s'y prête.

## ⭐ OBSERVATION DIRECTE EN JEU (10/09/2026) — prime sur tout le reste

Voir `docs/forgemagie/OBSERVATION-JEU-2026-09-10.md`. Trois faits **[OBS]** en Dofus 3 :

1. **Le reliquat (puits) EST affiché** dans l'en-tête de la fenêtre de FM, avec décimales
   (`reliquat : 0,2`). Il n'est plus une variable cachée — contrairement à ce qu'affirment
   le wiki forgemagie.net et le DevBlog 2.29, qui décrivaient Dofus 2.
2. **L'infobulle d'une rune affiche `DENSITÉ` = son poids de forgemagie.**
   Vérifié : Pa Vi (15 Vita) → densité 3 ; Ini (10 Ini) → densité 1.
   Donc `densité = valeur × coef_stat`, et **coef Vitalité = 0,2 / Initiative = 0,1 en Dofus 3**.
   ⚠️ Ne pas confondre avec `POIDS`, qui est l'encombrement en pods.
   → La table de poids est **lisible en jeu** ; toute divergence entre tables communautaires
     se tranche en survolant la rune.
3. **Le panneau d'historique est un journal de tentatives natif** : rune, gains, pertes,
   mention `+ reliquat` / `- reliquat`, mention `Échec`. Il persiste toute la session.

**La formule du puits est passée de [CONS] à [OBS]** : vérifiée exactement deux fois
(SN : 1,2 − 1 = 0,2 ; EC : 3,1 − 3 = 0,1) sur les valeurs affichées par le jeu.

### Trois anomalies ouvertes — ne pas coder autour sans les avoir reproduites
* **A1** un EC n'a pas consommé un puits de 0,2 pourtant disponible.
* **A2** une Rune Pa Vi (+15 Vita) n'a fait gagner que **+6 Vitalité** contre −12 Initiative
  (poids parfaitement équilibrés à 1,2). Si c'est reproductible, l'hypothèse
  « le gain vaut toujours la valeur de la rune », câblée dans `fm_sim.py`, est **fausse**.
* **A3** une entrée `Échec` seule, sans perte détaillée.

## Règles non négociables

1. **Aucune constante de probabilité en dur dans le code.** Toute constante numérique du
   modèle (clamps 66/50, exposants, seuils 0.8/101/×20, rate_fm…) vit dans une seule
   dataclass `ModelParams`. Si tu es tenté d'écrire un nombre magique dans une fonction de
   proba, c'est un bug.

2. **Ne jamais mélanger les tables Rétro (1.29) et Dofus 2/3.** Elles diffèrent
   *réellement* : Vitalité coef 0,25 en Rétro vs 0,2 en Dofus 2/3 ; Rune Vi = +3 vs +5 ;
   Coup Critique 30 vs 10 ; Soins 15 vs 10. Ce projet cible **Dofus 3** → colonne
   `dofus2_3` de `data/stats_weights.json`, jeu `runes_dofus2` de `data/runes.json`.
   `items_retro.json` n'est là que pour recouper, jamais comme source de jeux.

3. **Marquer la fiabilité de chaque règle implémentée** avec le même code que la spec :
   `[OBS]` observé/officiel · `[CODE]` recopié d'un émulateur · `[CONS]` consensus
   communautaire · `[SUPP]` supposé. Un commentaire `[SUPP]` au-dessus d'une constante
   signifie « à calibrer », pas « à croire ».

4. **Les 5 ancres officielles sont des tests de non-régression.** Toute modification du
   modèle de probabilité doit être suivie de l'exécution de la suite de tests
   (`python3 reference/test_fm_sim.py`, 49 tests), et l'écart aux ancres ne doit pas
   augmenter. Cible actuelle : **≤ 3 points sur les 5 ancres**, erreur quadratique **10**.

5. **Distinguer le moteur d'état du modèle de proba.** Le moteur d'état (poids, puits,
   over, exos, caps, pertes) est solide et reproductible à ~95 % : il se code une fois et
   ne bouge plus. Le modèle de proba est incertain et changera. Deux modules séparés.

6. **Jamais de `if exo: return 0.01`.** La création d'effet est un **continuum**
   32/50/18 → 1/0/99. Le 1 % des exos PA/PM/PO doit tomber tout seul du plancher officiel
   (`p_sc <= 1 ⇒ 1/0/99`), parce que ces runes pèsent 100/90/51 sur une ligne non
   naturelle. Si tu dois câbler quoi que ce soit pour retrouver le 1 %, le modèle est faux
   — dis-le, ne triche pas.

## Invariants du moteur d'état (à ne pas casser)

```
poids_ligne   = valeur_courante_de_la_stat × coef_unitaire(stat)
poids_rune    = valeur_ajoutée_par_la_rune × coef_unitaire(stat)
puits_nouveau = max(0, puits − absorbé_pendant_la_perte + poids_des_pertes − poids_rune)
overmax(stat) = floor(101 / coef_unitaire(stat))      # dérive du plafond PAR EFFET
```

### Les DEUX plafonds — ne pas les confondre
* **Plafond PAR EFFET = 101** **[OBS]** : `PWR non-naturel + PWR actuel de l'effet ≤ 101`.
  Exemple d'Ankama : impossible de dépasser 101 points de Force sur un objet dont le jet
  max de base est 60. C'est **de là** que sort `overmax = floor(101/coef)`, et c'est lui
  qui interdit un 2ᵉ PA (100+100), un 2ᵉ PM (90+90), une 2ᵉ PO (51+51).
  → `ModelParams.cap_effet_non_naturel = 101.0`
* **Plafond PAR OBJET = INCONNU** **[OBS] pour l'existence, valeur non donnée** : « une
  limite fixe de puissance d'effets non-naturels, pour l'intégralité des objets ». C'est
  **lui** qui empêche d'ajouter à la fois un PA *et* un PM à un objet qui n'a ni l'un ni
  l'autre. Seul encadrement déductible : **[100 ; 190)**.
  → `ModelParams.cap_objet_non_naturel = None` (**désactivé** tant qu'on ne l'a pas mesuré).
  Ne jamais inventer une valeur ; ne jamais dériver `overmax` de ce plafond.

### Probabilités
* SN plafonné à **50 %**. SC toujours ≥ **1 %**, ≤ **66 %**.
* **Plancher officiel** : `p_sc ≤ 1 ⇒ (1, 0, 99)`. Invariant de borne, **pas** un câblage
  de l'exo. Le puits ne le change pas (le triplet « 1/22/77 » n'existe pas).
* **La création d'effet n'est PAS toujours à 1 %** : elle couvre **32/50/18 → 1/0/99**.
  Le SN **existe** en création d'effet (jusqu'à 50 %) ; il n'est nul **qu'au plancher**.
  Créer une ligne de Force sur un objet simple peut monter à ~32 %.
* **Le jet en cours de modification est EXCLU de la qualité globale** (PWRG)… mais il est
  **COMPTÉ** dans le facteur « nombre d'over/exo sur l'objet ». Deux traitements opposés
  du même jet, dans la même formule. **[OBS]**
* Règle du ×20 : une rune devient récalcitrante vers 20× sa valeur, quasi impossible à 25×.
  Confirmée par le DevBlog (« plus difficile […] sans utiliser des runes puissantes »).
* Palier à **80 %** de la fourchette du jet — **sauf si le bonus a un jet fixe**
  (PA, PM, PO, dommages fixes) : dans ce cas le palier **ne s'applique pas**. **[OBS]**
* Facteurs de difficulté supplémentaires, tous **[OBS]**, tous dans `ModelParams` :
  * objets **éthérés** → plus difficiles (`malus_ethere` < 1, `Item.ethere`) ;
  * objets à **un seul jet naturel** → plus faciles (`bonus_mono_jet` > 1) ;
  * **nombre d'over/exo sur l'objet** → plus difficile (`penalite_par_over_exo`, jet ciblé
    compté) ;
  * **niveau de l'objet** → plus difficile, « faiblement » (`coef_niveau_objet`).

### Résolution et pertes
* Le puits ne change **qu'en SN et EC**. Un SC ne le touche pas (paramétrable).
* Le puits est perdu si l'objet est équipé, échangé ou mis en HDV. Conservé à la déco.
* Le puits « absorbera **en partie** les échecs futurs » — pas totalement
  (`puits_absorption`). Il est créé exactement quand on perd **plus que prévu**.
* **SN sur objet mono-jet = rien ne se passe** (no-op complet : pas de rune, pas de perte,
  pas de mouvement de puits). Ce n'est **pas** un gain. **[OBS]**
  Se généralise : no-op dès qu'aucune autre ligne ne peut diminuer.
* **Bonus : plancher à 0.** **Malus : jamais au-delà du malus maximum naturel.** **[OBS]**
* **Impossible de « puiser » dans les malus non overmaxés** — sinon puits sans fond.
  Un malus est « overmaxé » quand il a été FM'é **au-delà de son meilleur état naturel**
  (`value < jet_min`) ; il ne peut alors se dégrader que jusqu'au retour à cet état. **[OBS]**
* Le choix des bonus perdus est **aléatoire** ; un bonus trop lourd « a une chance d'être
  épargné, mais ce n'est pas systématique » (aucun chiffre donné → **[SUPP]**).
* Une stat qui tombe à 0 disparaît de l'objet mais **reste dans le template** : elle est
  remontable, elle n'est pas devenue exotique.
* Un bonus ne peut pas devenir un malus. Un malus peut remonter en bonus (compté en over).

## Les 5 ancres officielles (DevBlog Ankama 1.27 — texte primaire, verbatim)

| # | Situation (formulation Ankama) | SC | SN | EC | Régime |
|---|---|---:|---:|---:|---|
| 1 | Meilleures probabilités atteignables : remontage d'un effet simple (vitalité) sur objet normal, maître forgemage | **66** | **34** | **0** | remontage |
| 2 | Meilleures probabilités (bonus simples sur objets simples) pour tenter d'atteindre un **jet parfait** | **43** | **50** | **7** | remontage |
| 3 | Probabilités **minimums** (bonus maximums sur objets complexes haut-niveau) en remontage, maître avec runes de puissance suffisante | **15** | **50** | **35** | remontage |
| 4 | Probabilités **maximums en création d'effet**, maître | **32** | **50** | **18** | création |
| 5 | Probabilités **minimums en création d'effet**, maître | **1** | **0** | **99** | création |

* Ancre 2 : **tranchée à 43/50/7**. Le 34/50/16 du relais Yin-Yang est **faux**.
* Ancre 4 : **inédite**, jamais reprise par aucun guide en 15 ans. C'est elle qui prouve
  que « l'exo, c'est 1 % » est faux en général.
* Le triplet **« 1/22/77 — exo avec puits » N'EXISTE PAS**. Toute calibration qui s'en
  sert est à refaire.
* 1-2-3 encadrent le **remontage**, 4-5 la **création d'effet** : deux régimes du **même
  continuum**, pas deux formules.

### Résultat de l'ajustement (`reference/fm_sim.py`, `python3 fm_sim.py`)

| Ancre | StarLoco brut | Ancien préréglage (ancres fausses) | **Actuel** |
|---|---|---|---|
| 1 — 66/34/0 | 66/34/0 | 66/34/0 | **66/34/0** |
| 2 — 43/50/7 | 3/4/93 | 54/46/0 | **43/50/7** |
| 3 — 15/50/35 | 7/30/63 | 26/50/24 | **14/50/36** |
| 4 — 32/50/18 | 2/3/95 | 66/34/0 | **34/50/16** |
| 5 — 1/0/99 | 1/0/99 | 1/0/99 | **1/0/99** |
| **erreur quadratique** | **21 398** | **2 164** | **10** |

⚠️ **Contrainte structurelle à connaître avant de toucher à la formule** : dans la famille
StarLoco, `P_SN / P_SC = 1 + poids_rune / √(PWRg + PWRcarac)` tant que P_SN < 50. Ce
rapport n'est modifiable par **aucun** paramètre. L'ancre 3 (15/50) exige donc
`poids_rune ≥ 2.33 · √(PWRg+PWRcarac)`, soit une rune de poids ≥ 63-100 : **PA ou PM**.
C'est ce qui fixe la lecture d'Ankama — « bonus maximums » = les bonus les plus **lourds**,
pas « jets au maximum ».

## Les facteurs de difficulté (ordre d'importance, source primaire)
1. **Qualité globale de l'objet** — PWRG, **hors ligne ciblée** ; over et exos comptés.
2. **Qualité du jet modifié** — palier brutal à 80 % de la fourchette, **sauf jet fixe**.
3. **Niveau de l'objet** — « faiblement ». Absent de tous les émulateurs ; ajusté à
   `coef_niveau_objet = 0.3`.

Puis, cités dans le même paragraphe et jamais repris par les guides :
4. ligne over ou non naturelle → « difficulté encore davantage » ; et **plus l'objet a
   d'over/exo** (jet ciblé compté), plus c'est dur ;
5. « plus difficile […] **sans utiliser des runes puissantes** » = la règle du ×20 ;
6. objets à **un seul jet naturel** → plus **faciles** ;
7. objets **éthérés** → plus **difficiles**.

## Trous connus, à ne pas masquer
* `items_dofus2.json` est un scrap de l'encyclopédie **Dofus 2**, pas Dofus 3. Les jets
  min/max des objets récents (et les objets post-2.x) manquent. Pour Dofus 3, brancher
  l'API DofusDB / dofusdude plutôt que ce fichier figé.
* Les poids de malus sont inconnus pour ~43 stats (repris = poids bonus par défaut).
* Poids du Renvoi de dommages et de la Rune de chasse non tranchés.
* Aucune donnée brute de taux de passage : tout le §12 de la spec sert à en produire.
* **`malus_ethere` et `bonus_mono_jet` ne sont pas identifiables** sur les 5 ancres :
  aucune des situations d'Ankama ne met en jeu un objet éthéré ni un objet mono-jet. Le
  calibrateur les laisse à 1.0 (neutre), ce qui est un **artefact d'identifiabilité**, pas
  une réfutation. `params_devblog_fit_complet()` y injecte 0.7 / 1.5, **[SUPP]**.
  400 tentatives en jeu suffiraient à les lever — **priorité de mesure n°1**.
* **La valeur du plafond PAR OBJET est inconnue** (encadrée dans [100 ; 190)). Mesurable
  **sans statistique** : tenter PA+PO, PM+PO, PA+PM… la première combinaison refusée par
  l'interface donne la borne haute.
* Le modèle est ajusté sur **5 points** avec ~10 paramètres libres. Une erreur de 10 prouve
  que la forme est *assez riche*, **pas** qu'elle est prédictive.
