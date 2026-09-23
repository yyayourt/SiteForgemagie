# Analyse du simulateur — maths, algorithme, sources (2026-09-23)

Constat seulement : **aucun code ni `empirical_params.json` modifié**. Les propositions (§5)
attendent validation (CLAUDE.md, « constat → proposition → validation »).

Pondération des sources communautaires demandée par Yanis : gros créateur reconnu > anonyme,
récent (DOFUS 3 / Unity) > ancien, recoupé plusieurs fois > isolé. Rang de la
[hiérarchie des preuves](hierarchie-preuves.md) conservé.

État vérifié : 264 tests passent (23 fichiers). Observations structurées : N = 1 dans
`observations.json` ; 9 pertes chiffrées au total en comptant `docs/Observation jeu 2026 09 10.md`
et l'errata du 2026-09-09.

---

## 1. Répartition SN/EC : le modèle par défaut contredit le DevBlog

Modèle par défaut `official_factors_linear` (a = 0,15, b = 0,5, `ecShare` = 0,5) :

| Situation | Moteur (SC/SN/EC) | DevBlog 1.27 |
|---|---|---|
| Ligne vide, rune simple | 65 / 17,5 / 17,5 | ancre 1 : **66 / 34 / 0** |
| Ligne à mi-course | 40 / 30 / 30 | ancre 2 : 43 / 50 / 7 |
| Ligne au jet parfait | 15 / 42,5 / 42,5 | ancre 3 : **15 / 50 / 35** |

`ecShare` constant fait apparaître **17,5 % d'EC là où Ankama annonce 0 %**, et il viole la
phrase primaire « SN proche de 50 % dans la majorité des cas ».

**Observation mathématique** (vérifiable à la main) : la règle

```
pSN = min(0,50 ; 1 − pSC)      pEC = 1 − pSC − pSN
```

reproduit **exactement** les ancres 1, 2, 3 et 4, soit 66/34/0, 43/50/7, 15/50/35 et 32/50/18.
Elle reproduit aussi la variante 34/50/16 que donnent les relais Yin-Yang (2009). La règle tient
donc quelle que soit la version de l'ancre 2 (voir §4). Seule l'ancre 5 (1/0/99) y échappe : c'est
le régime « SN impossible », déjà traité à part par le garde-fou d'exotisme.

Conséquence : **SN/EC n'est pas un degré de liberté**. Toute l'inconnue se réduit à pSC.
La famille des émulateurs 1.29 (StarLoco : `P_SN = min(…, 100 − P_SC, 50)`) a la même structure
de plafond. C'est un indice, pas une preuve (règle 6 de CLAUDE.md).

Statut proposé : `MODÈLE` dérivé de `SOURCE PRIMAIRE — v1.27` (4 ancres sur 5). Sa
transposition à Unity reste une `HYPOTHÈSE`, comme les ancres elles-mêmes.

## 2. Quantité perdue : `ceil` ne colle pas aux observations

`losses.ts` retire `ceil(reste / densité)` points (le plus petit entier qui couvre la perte).

Règle concurrente testée : **dépassement strict**, c'est-à-dire retirer des points jusqu'à ce
que le poids retiré soit **strictement supérieur** à la perte, soit `floor(reste / densité) + 1`,
avec le reliquat absorbé d'abord.

| Observation | Observé | `ceil` | strict |
|---|---|---|---|
| 08/09 SN Vi (1), puits 0 | 11 ini, reliquat 0,1 | 10 ✗ | 11 ✓ |
| 10/09 SN Ini (1), puits 0 | 6 vita, reliquat 0,2 | 5 ✗ | 6 ✓ |
| 10/09 EC Pa Vi (3), puits 0 | 31 ini, reliquat 0,1 | 30 ✗ | 31 ✓ |
| 10/09 **A1** EC Ini (1), puits 0,2 | 5 vita, puits **reste** 0,2 | 4 et puits 0 ✗ | 5 et puits 0,2 ✓ |
| 09/09 SN Ra Vi (10) : 44 ini puis vita | 28 vita | 28 ✓ | 28 ✓ (10 − 4,4 = 5,6 ; 5,6 / 0,2 = 27,999…) |
| 10/09 A2 SN Pa Vi (3) : 12 ini puis vita | 9 vita | 9 ✓ | 10 ✗ (l'ordre inverse donne ✓) |
| 09/09 SN (1) | 12 ini | 10 ✗ | 11 ✗ |

Score : **5 sur 7 pour la règle stricte, 2 sur 7 pour `ceil`.** La règle stricte
explique **A1 sans mécanisme nouveau**. Le puits absorbe 0,2, 5 vita sont retirées (1,0, soit
strictement plus que 0,8), et l'excédent de 0,2 recrée le reliquat. Le puits est donc inchangé en
net, ce qui explique l'absence de mention « − reliquat ». Les lectures (a), (b) et (c) de
`poolConsumption.ts` deviennent inutiles si la règle se confirme.

Explication concurrente de A1 (Tofus, §3) : l'over/exo paierait **avant** le puits. Or en A1 la
vitalité était en overmax (60/40), donc elle a payé 1,0 pile et le puits n'a pas été touché.
L'observation du 10/09 « EC Pa Vi → −31 ini, vita over épargnée » contredit une priorité
systématique de l'over. Les deux lectures restent ouvertes.

Fait lié : DofusDB stocke les densités en **float32** (`effectPowerRate` de la vitalité =
0,20000000298023224). Une rune Vi pèse alors exactement le poids de 10 ini. La différence entre
« ≥ » et « > » est donc précisément ce qui décide de retirer 10 ou 11 points.

**Test discriminant** : un SN à puits 0 dont la perte tombe sur une ligne de densité 1
(Force, Agilité…). `ceil` prédit une perte égale au poids de la rune et un reliquat nul. La règle
stricte prédit **un point de plus et un reliquat égal à 1**. Une seule tentative tranche.

Statut : `INCONNU` → candidat `MODÈLE EMPIRIQUE` (N = 7, dont 2 non expliqués).

## 3. Sources web (recherche du 2026-09-23)

dofus.com renvoie une erreur 403 au fetch : aucune page Ankama n'a été relue directement.

| Affirmation | Sources | Confiance | Effet sur le projet |
|---|---|---|---|
| Densités = `effectPowerRate` DofusDB (client **3.6.12.16**, vérifié par appel API) | dataminée + lecture en jeu (Yanis) | **élevée** | Tranche Renvoi **5**, % rés mêlée/distance **10**, Pods 0,25, Fuite/Tacle 4. Ferme les `CONTRADICTION` sur les densités 40, 50, 78, 79 (au rang « donnée dataminée tierce »). Répond au point « table des poids unitaires : à extraire du client » de CLAUDE.md. |
| Exo PA/PM à 1 % de SC, SN impossible | Huzounet (01/2026), Tofus, Dafous (2026), DevBlog 1.27 | élevée | Conforme au moteur |
| Huzounet : « runes dont la densité est **> 20**/stat sur un item sans la stat : pas de SN, SC 1 % » | 1 grosse source récente | moyenne | Correspond exactement à la liste [PA, PM, PO, Invocations]. Ne dit rien d'un 2ᵉ point de % Do, donc ne tranche pas `cumulative_weight ≥ 30` (Fashionista + témoignage) |
| Over/exo retirés en priorité | Huzounet, Tofus, DevBlog | moyenne à élevée | Conforme. **Tofus : l'over/exo passe AVANT le puits**, le moteur fait l'inverse (§2) |
| Reliquat = perte − rune, affiché en jeu | Huzounet, Tofus + observation | élevée | Conforme |
| Règle des 101, globale ou par ligne | Huzounet ambigu ; Tofus et Dafous par ligne ; Alterya (2.x) globale | faible | `CONTRADICTION` maintenue |
| Loi de sélection des pertes, taux des exos légers | aucune | — | `INCONNU` maintenu |
| Potions : 50/65/80 = % de dégâts conservés, pour 50/35/20 % de réussite | wiki-dofus 2016 ; le « 85 % » serait un % de dégâts conservés | faible | Piste pour lever la `CONTRADICTION` des potions |
| Refonte de la FM en DOFUS 3 | aucune trace (3.3 à 3.7) | — | Aucun changement de mécanique documenté |
| Brisage | KamelAkar vs Next-Stage : formules incompatibles ; écart 852 prévu / 659 obtenu (forum) | faible | Conforme au statut actuel |
| Datasets publics d'essais FM | aucun | — | Le projet devra produire le sien |

URLs : huzounet.fr/guides/forgemagie · tofus.fr/fiches/forgemagie.php ·
dafous.app/guides/poids-runes-fm.html · yin-yang.over-blog.com/article-29549211.html ·
learn-dofus.blogspot.com/p/forgemagie.html · api.dofusdb.fr/effects/{id} · wiki-dofus.eu/w/Forgemagie.

## 4. Point à réexaminer : la « réfutation » de 34/50/16 et 1/22/77

La mémoire du projet classe `34/50/16` et `1/22/77` comme réfutés par l'archive du DevBlog.
Or Yin-Yang les cite en **mars 2009**, et la capture web.archive.org date de **novembre 2010**.
Hypothèse non vérifiée : Ankama a pu modifier le billet entre les deux dates (retour du serveur
de test, par exemple). Le relais ne serait alors pas fautif, il serait antérieur.
`1/22/77` est libellé « création d'effet **avec effet puits possible** », une situation que le
moteur ne modélise pas. Statut proposé : `CONTRADICTION` (versions successives possibles), et non
réfuté. Cela ne change rien au §1 : les deux versions de l'ancre 2 vérifient la règle SN.

## 5. Autres constats sur le code

1. `distanceToMax` normalise par `baseMax` : (max − valeur) / max. Le palier de 80 %
   (`structuralFlagsOf`) utilise la **fourchette** [min, max]. Exemple : une vita 36/40 est à 10 %
   du max par la première mesure, et au bas de sa fourchette (0 %) par la seconde. Le code a donc
   deux notions de « qualité du jet ». Le DevBlog parle de fourchette.
2. Overmax sans plancher : `distance` est bornée à 0, et le modèle linéaire sort donc 15/42,5/42,5
   pour tout over. Le « 15 % » n'est pas un plancher ici, c'est `a` qui le produit par
   coïncidence.
3. Monte Carlo : les probabilités sont calculées une seule fois sur l'état de départ (rune
   répétée sur un état figé). C'est correct pour comparer des modèles, mais ce n'est pas une
   simulation de session.
4. Exo Invocations : la règle des 101 en valeur totale autorise `floor(101 / 30)` = **3**
   invocations exo par la borne seule. À vérifier (objets en HDV).

## 6. Propositions (en attente de validation)

| # | Proposition | Coût | Statut |
|---|---|---|---|
| P1 | Stratégie `snSplit = capped_50` (règle du §1) à côté de `ec_share`, sélectionnée dans `empirical_params.json`, **par défaut** | petit, tests d'ancres existants | MODÈLE (4/5 ancres) |
| P2 | Stratégie de quantité de perte `strict_overshoot` à côté de `ceil`, sélectionnée par paramètre ; défaut inchangé tant que le test discriminant du §2 n'est pas fait | petit | INCONNU → à mesurer |
| P3 | Script d'extraction des densités depuis `effectPowerRate` (DofusDB 3.6.12.16), avec version et date, pour remplacer les statuts `HYPOTHÈSE` et `CONTRADICTION` | moyen | donnée dataminée tierce |
| P4 | Repasser 34/50/16 et 1/22/77 de « réfuté » à `CONTRADICTION` (§4) | doc | — |
| P5 | Paramètre d'ordre de paiement `pool_first` / `over_exo_first` (Tofus) | petit | HYPOTHÈSE COMMUNAUTAIRE |

## 7. Révision après `docs/fm-recherche-2026-09-23.md` (même jour)

### 7.1 Ce qui change

| Donnée nouvelle | Fiabilité | Effet |
|---|---|---|
| Dasech (forum, 25/11/2024, bêta Dofus 3) : 100 exos PM sur Gelano en **8 949 runes**, soit **1,117 %** | [MES], N = 8 949, source primaire non relue par moi (403) | IC95 binomial **[0,89 % ; 1,34 %]**, 1 % dedans. Le taux de l'exo PM passe de « POLITIQUE (plancher retenu comme valeur) » à **`MODÈLE EMPIRIQUE`, N = 8 949**, pour un objet simple (Gelano). Le chiffre du moteur est donc **mesuré**, pas seulement retenu. Les objets chargés restent non mesurés. |
| Même série : repassage PA après exo, **99 réussites pour 177 runes (56 %)** ; PM exo perdu **2 fois** seulement | [MES] | Les ~78 tentatives ratées n'ont presque jamais retiré l'exo PM (90). C'est un indice **contre** une priorité systématique de l'over/exo dans les pertes (`prioritizeOverExo`), mais l'état du puits pendant la série est inconnu. À ne pas coder, à reproduire avec relevé du puits. |
| Alterya 2012 : remontée d'un PA naturel ≈ **30 / 50 / 20** | [TEM] | Vérifie la règle SN = min(50 %, 1 − SC) du §1. Cela fait **5 triplets indépendants** conformes. |
| 3 témoignages (forum, 2021, 2.x) : repasser un PA/PM **naturel** sur un objet portant un exo % rés → SC « 2-3 % », « 20 % plus ou moins », 40 runes sans succès | [TEM], convergents, anciens | Contredit la **portée** actuelle du plancher 15 % : le moteur l'applique à toute ligne naturelle ≤ max, même si l'objet porte des exos ailleurs. Lecture concurrente cohérente avec le tutoriel (« hors … forgemagie exotique ») et le DevBlog (« plus l'objet dispose d'overmax/exo … ») : le plancher ne vaut que pour un objet **sans** over/exo. |
| Patch 3.7 bêta (17/09/2026) [OFF] : potions de conversion **85 % → 100 %**, **50 % → 10 %** | officiel, bêta | **Lève la CONTRADICTION des potions** : 85/50 sont des **taux de conversion** des dégâts, pas des taux de réussite. Modèle à deux paliers, dépendant de la version. À réconcilier avec la lecture en jeu « 2 paliers 20/80 » du 2026-09-08. |
| Patch 3.7 bêta : l'orbe régénérant réinitialise un objet **transcendé** et retire la transcendance | officiel, bêta | Contredit, **à partir de 3.7**, la règle 2.58 codée en dur (`orb.ts`) et la ligne de CLAUDE.md « objet verrouillé, plus d'orbe ». La règle devient **fonction de la version du jeu**. |
| Patch 3.6 [OFF] : potions et gravures d'élément autorisées après transcendance | officiel | La transcendance n'interdit plus la conversion d'élément (≥ 3.6). |
| « Retrait sur des lignes de poids proche de celui de la rune » | [HYP] | Loi de sélection candidate **D** (∝ proximité du poids de la ligne à celui de la rune), à ajouter aux stratégies A–C. |

### 7.2 Propositions révisées

| # | Proposition | Priorité |
|---|---|---|
| P1 | Règle de répartition SN plafonné à 50 % | **1** (renforcée : 5 triplets) |
| P6 | Exo PM (et PA par symétrie, marqué comme tel) : statut `MODÈLE EMPIRIQUE` N = 8 949 avec IC95 affiché, au lieu de `POLITIQUE` | 2 |
| P7 | Paramètre `normalFloorScope` = `target_line` (actuel) / `clean_item` (plancher 15 % seulement sur un objet sans over/exo). Défaut à décider | 3 |
| P8 | Règles dépendantes de la version : orbe sur objet transcendé (≤ 3.6 refus, ≥ 3.7 reset complet), potions de conversion (85/50 → 100/10) | 4 |
| P2 | Quantité de perte « dépassement strict » en option | 5 |
| P3 | Extraction des densités `effectPowerRate` | 6 |
| P5 | Ordre de paiement over/exo vs puits, affaibli par la série Dasech | 7 |
| P4 | 34/50/16 et 1/22/77 : le nouveau rapport maintient « n'existe pas » dans l'original. Aucun élément nouveau, laissé en l'état | abandonnée |

## 8. Deuxième passe (§3 de `docs/fm-recherche-2026-09-23.md`) et mise en œuvre

### 8.1 Données nouvelles retenues

- **Exo PM sur Gelano, deux séries indépendantes** : Fek (vidéo, 19/01/2023, Dofus 2) a obtenu
  111 exos en 10 000 runes, Dasech 100 en 8 949. Poolé : **1,11 %**, IC95 ≈ 0,96–1,26 %.
- **2ᵉ % Do Per So en exo** : Waveformer (bêta 3.6, 10 à 15 000 runes) mesure **3,4 %** de SC et
  **aucun SN** sur toute la série. Cela réfute « le régime SC seul vaut 1 % » pour le déclencheur
  par poids, et confirme « pas de SN ». albert-deux (1 000 tentatives, objet au jet parfait) obtient
  0,8 % : le SC du régime dépend donc de la qualité de l'objet, sans modèle à ce stade.
- **Quantité perdue** : témoignages DekaPhobia et Banjore (forum, 04/05/2025, Dofus 3) :
  « une rune de densité 1 retire aléatoirement 5 ou 6 Vi » et « une rune Pod retire toujours
  exactement 13 Vi ». La règle stricte du §2 est réfutée ; la règle `ceil` avec un point
  supplémentaire aléatoire quand le ratio est entier rend compte de tout.
- **Proximité de densité** : les lignes de densité proche de celle de la rune sautent plus souvent
  (témoignages convergents). Stratégie D préparée, forme à définir.
- **Non intégrés à ce stade** : densité divisée par 2 pour les stats négatives [TEM] ; réduction
  % rés. mêlée/distance de 15 à 10 au passage à Dofus 3 [TEM], cohérente avec DofusDB ; formule de
  brisage d'« Enpreur », identique à celle du code (3/200 = 0,015), qui fait une troisième source.

### 8.2 Mis en œuvre le 2026-09-23 (défauts changés)

| Paramètre | Ancien défaut | Nouveau défaut | Statut |
|---|---|---|---|
| `probability.snSplit` | (part fixe `ecShare` 0,5) | `capped_50` | MODÈLE EMPIRIQUE |
| `probability.cumulativeRegimeSc` | (1 %) | 0,034 | MODÈLE EMPIRIQUE [MES] |
| `lossSelection.quantization` | (`ceil`) | `ceil_random_extra` | MODÈLE EMPIRIQUE, N = 6 |
| `lossSelection.exactRatioExtraPointChance` | — | 0,67 | MODÈLE EMPIRIQUE, N = 6 |
| `lossSelection.strategy` | `weighted_by_value_times_weight` | `weighted_by_deficit_ratio` (ratio quantum / déficit, asymétrique, plancher 3 %) | HYPOTHÈSE COMMUNAUTAIRE + DevBlog qualitatif ; pentes INCONNU |

Remarque de Yanis (2026-09-23), à ne pas confondre avec la sélection des pertes : « un objet à
400 vita est plus simple à forgemager de 100 à 200 que de 300 à 400 ». Cela porte sur la
**probabilité de SC**. Le terme `b × distance au jet max` du modèle linéaire la couvre déjà
(pSC 0,15 + 0,5 × distance), sans mesure à l'appui pour l'instant.

Restent en attente de validation : P7 (portée du plancher 15 %), P8 (règles dépendantes de la
version : orbe sur objet transcendé en 3.7, potions 100/10), P3 (extraction `effectPowerRate`),
P5 (ordre over/exo vs puits).
