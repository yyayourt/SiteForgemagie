# Croisement — fils forum gamega (2017-2023), LPBA (2021-2022) et PDF Karias (2021)

**Date :** 2026-09-09
**Version du jeu au moment du croisement :** DOFUS Unity 3.6.10.11
**Version des sources :** DOFUS 2.x (toutes)
**Statut du document :** rapport de croisement, source non modifiable une fois versé dans `docs/knowledge/`

## 0. Résumé

Trois documents communautaires 2.x sont confrontés à l'état du projet (`empirical_params.json` du 2026-09-08, `CLAUDE.md`, audits A/R/AP, rapport X du 2026-09-07).

Ce qu'ils apportent :

1. **La première mesure publique à grand N d'un taux d'exo lourd** : 111 SC sur 10 000 tentatives d'exo PM (vidéo relayée sur le forum officiel en 2023). Le tutoriel Ankama ne donne qu'une borne (« peut descendre jusqu'à 1 % ») ; ce dataset donne une estimation ponctuelle, compatible avec la borne. C'est l'élément le plus précieux du lot.
2. **La réfutation documentée de l'hypothèse « P(SC exo) = 1 / poids de la rune »**, par deux forgemages indépendants, concédée par l'auteur du PDF.
3. **Le cadre mathématique de la loi géométrique** pour le coût d'un exo lourd, directement réutilisable pour le compteur de coût de session.
4. **Une piste Unity** : une vidéo de février 2026 annonce 1 000 tentatives de Gelano PA/PM sur Unity. Résultat non dépouillé ici (contenu vidéo inaccessible depuis l'outil). Tâche ajoutée.
5. Une dizaine d'hypothèses qualitatives, dont deux nouvelles pour le projet (SN croissant avec la légèreté de la rune exo ; ratio valeur de ligne / valeur de rune).

Ce qu'ils n'apportent pas : aucune `SOURCE PRIMAIRE`, aucune formule, aucune donnée Unity exploitable directement.

## 1. Statut des versions : hypothèse de continuité 2.x → 3.x

Le projet part du principe que la forgemagie n'a pas structurellement changé entre 2.x et Unity (mêmes trois issues, même reliquat, mêmes densités pour la plupart des runes, même plafond 101). Cette continuité est **elle-même une hypothèse**, à porter explicitement :

| Élément | Continuité 2.x → 3.x | Preuve |
|---|---|---|
| Trois issues SC/SN/EC | Confirmée | Tutoriel officiel Unity (`SOURCE PRIMAIRE`) |
| Reliquat = perte − rune | Probable | Guides Unity (Huz 2026) + affichage client 3.6 (`SOURCE PRIMAIRE` sur l'existence, pas sur la formule) |
| Densités des runes | **Partiellement fausse** | Renvoi de dommages : 10 en 2.x (trois témoins : lilgallon, Dofastuces, code 2.x), 5 observé sur Unity → `CONTRADICTION` ouverte ; prouve qu'il existe des ajustements numériques non documentés |
| Plafond 101 | Probable | Tutoriel officiel Unity |
| Exo PA/PM/PO ≈ 1 % | Probable | Tutoriel officiel Unity (borne) |
| Formule P(SC/SN/EC) | Inconnue dans les deux versions | — |

Règle de lecture adoptée pour ce document : **les mécaniques structurelles 2.x sont retenues comme hypothèses de travail pour Unity ; les valeurs numériques 2.x ne sont jamais transférées sans vérification 3.x.** Toute donnée expérimentale 2.x est conservée avec son étiquette de version et reste utilisable pour calibrer un modèle tant qu'aucune donnée Unity ne la contredit.

## 2. Les sources

### 2.1 Fil « [Forgemagie][Maths] Loi de probabilité du passage de runes » (forum officiel, gamega, 19/02/2017 → 07/04/2023)

Question initiale : loi de X (poids net apporté par une rune) et borne de la perte en EC. Intervenants utiles : podompodompom (2017), Kamen-Ecudor, Toxou (2019), JohnButlerBlood, kankhun, LPBA (2023). Aucune mesure propre ; une donnée relayée (vidéo 10 000 tentatives).

### 2.2 Fil « Optimisation de la forgemagie exotique +1PM d'un Gelano » (forum officiel, LPBA/Karias, 23/02/2021 → 29/07/2022)

Publication et relecture du PDF. Intervenants utiles : Indobaclay, Le-skimboarder (« dix ans de FM »), SXD (correction de la formule de rentabilité). Le-skimboarder réfute le postulat 1/poids ; Karias concède le 15/04/2021.

### 2.3 PDF « Optimisation de la forgemagie exotique +1 PM d'un Gelano » (Karias, 23/02/2021, 5 pages)

Modélisation par loi géométrique du nombre de tentatives jusqu'au SC, avec p = 1/90 (postulat 1/poids). Seuil de rentabilité, gain moyen. Table des poids de runes Dofastuces (2.x, poids par rune). Section « PA variable » jamais rédigée.

## 3. Donnée expérimentale n° 1 — 111 SC / 10 000 tentatives d'exo PM (2.x, 2023)

### 3.1 Fiche d'observation

| Champ | Valeur |
|---|---|
| Source | Vidéo YouTube `n1r8-DIPQQg`, relayée par LPBA le 03/04/2023 sur les deux fils |
| Version | DOFUS 2.x (antérieure à avril 2023) |
| Objet | Gelano (d'après le contexte des fils) ; état du PA, jet, reliquat **non documentés** |
| Rune | Ga Pme (exo PM, poids 90) |
| N | 10 000 |
| SC | 111 |
| SN / EC | Non rapportés séparément (SN présumé nul pour exo lourd) |
| Auditabilité | Nulle : pas de dataset brut, pas de journal, contenu vidéo non consulté par le projet |
| Statut proposé | `MODÈLE EMPIRIQUE (externe, non audité, 2.x)` — à distinguer d'un `MODÈLE EMPIRIQUE` reproductible au sens de `CLAUDE.md` |

### 3.2 Analyse statistique

- Estimation ponctuelle : p̂ = 1,110 %.
- IC 95 % Wald (calcul de kankhun, vérifié) : [0,905 % ; 1,315 %].
- IC 95 % Wilson : [0,923 % ; 1,335 %]. IC 95 % Clopper-Pearson : [0,914 % ; 1,335 %].
- Test binomial H0 : p = 1 % → p-value = 0,27. **Le 1 % officiel n'est pas rejeté.**
- Rapport de vraisemblance 1,11 % vs 1 % : 1,8 — trivial, puisque 1,11 % est l'estimateur du maximum de vraisemblance. Ne constitue pas une évidence en faveur de 1,11 %.
- N nécessaire pour discriminer 1 % de 1,11 % (α = 5 % bilatéral, puissance 80 %) : ≈ 66 000 tentatives. LPBA avançait 40 000, kankhun « jusqu'à 100 000 » ; les deux ordres de grandeur sont corrects selon la puissance visée.

### 3.3 Ce que le dataset établit et n'établit pas

Établit :
- Pour un exo PM sur Gelano en 2.x, le taux de SC est **de l'ordre de 1 %** et **compris entre ~0,9 % et ~1,3 %** avec 95 % de confiance. C'est la seule contrainte numérique publique au-delà de la borne officielle.
- Le postulat 1/poids (1,11 %) et la valeur officielle (1 %) sont tous deux dans l'intervalle ; le dataset ne les départage pas.

N'établit pas :
- La valeur exacte.
- La dépendance à l'état de l'objet (PA présent ou non, reliquat, jet), faute de conditions rapportées. kankhun et Le-skimboarder affirment que pour les exos lourds ces facteurs n'ont pas d'effet visible ; c'est une hypothèse, pas une mesure.
- Le taux sur Unity.

### 3.4 Usage dans le projet

- Verser une entrée dans `data/observations/` (schéma observation externe) avec les champs ci-dessus, `version: "2.x"`, `audited: false`.
- Ne pas modifier le plancher `heavyExoCharacteristics` (1 %, `SOURCE PRIMAIRE`). Le modèle actif applique déjà 1 % ; le dataset le **soutient** sans le remplacer.
- Si un paramètre `heavyExoScRate` est un jour exposé, sa note doit citer cet IC comme unique calibration publique.

## 4. Donnée expérimentale n° 2 — 1 000 tentatives de Gelano PA/PM (Unity, février 2026)

| Champ | Valeur |
|---|---|
| Source | Vidéo YouTube `gs0FnGupFQY` (18/02/2026) + short `CKUgsqAoMpo` (19/02/2026) |
| Version | DOFUS Unity (date postérieure à la sortie Unity) — à confirmer à l'écran (numéro de client) |
| N annoncé | 1 000 |
| Résultat | **Non dépouillé** (vidéo inaccessible depuis l'outil) |
| Statut | `À DÉPOUILLER` |

Attendu sous H0 p = 1 % : 10 SC, IC 95 % [4 ; 17]. Un résultat hors de cet intervalle sur Unity serait le premier indice public d'un écart 2.x → 3.x sur ce taux. Un résultat dans l'intervalle renforcerait l'hypothèse de continuité. Dans les deux cas, N = 1 000 ne permet pas de distinguer 1 % de 1,11 %.

**Tâche :** visionner, relever N exact, nombre de SC, état de l'objet à chaque tentative si visible, numéro de version du client. Consigner dans `data/observations/`.

## 5. Croisement affirmation par affirmation

Légende : ✓ convergence avec le projet ; ✗ contradiction ; ★ nouveau pour le projet.

### 5.1 Probabilités

| # | Affirmation | Auteur(s) | Statut | État projet | Verdict |
|---|---|---|---|---|---|
| P1 | P(SC exo) = 1 / poids de la rune | Karias (PDF §2.1) | `HYPOTHÈSE RÉFUTÉE` | Absent | Réfutée par Le-skimboarder (« une rune de poids 1 passerait à chaque coup » ; « PO passerait 2× plus que PA, je l'aurais remarqué en dix ans ») et kankhun (« essaye avec des do per so / invo, tu verras »). Karias concède (15/04/2021). Archiver en `docs/archive/` comme idée reçue. Testable à bas coût sur runes légères (§7). |
| P2 | Exo PA/PM/PO au plancher, SC/SN/EC = 1/0/99 « comme postulat » | kankhun | `HYPOTHÈSE COMMUNAUTAIRE` | `heavyExoEcShare = 1` (`HYPOTHÈSE COMMUNAUTAIRE`) | ✓ Convergence. kankhun est explicite sur le caractère de postulat et sur l'indétectabilité d'un biais type 1,1/0/98,9. |
| P3 | Exo léger : SC reste ~1 %, c'est le SN qui augmente avec la légèreté de la rune et la faiblesse du jet ; « si les SN atteignent 50 %, tu commenceras à voir plus de SC » | kankhun | `HYPOTHÈSE COMMUNAUTAIRE` ★ | Aucun modèle ne découple SC et SN selon le poids exo | Donne une **forme** au modèle exo : plancher SC constant, part SN croissante. Non chiffrée, une source. À noter dans la note de `probability.model`. |
| P4 | Exo Invocation : SC > 1 % mais faible ; SN « beaucoup plus probable » | Le-skimboarder | `HYPOTHÈSE COMMUNAUTAIRE` | Invoc (26) exclu de `heavyExoCharacteristics` | ✓ Convergence avec l'abandon de l'ancien `EXO_HEAVY_THRESHOLD = 30`. Une source, 2-3 objets. |
| P5 | Premier % rés exo : SC < 1/6 même avec puits, dépend des autres lignes | Le-skimboarder | `HYPOTHÈSE COMMUNAUTAIRE` | — | Cohérent avec P1 réfutée (1/6 = 1/poids Ré per 6 en 2.x, borne supérieure non atteinte). |
| P6 | Over passe mieux qu'exo (10 % feu sur Torquistik sans puits PA) | Le-skimboarder | `HYPOTHÈSE COMMUNAUTAIRE` ★ | Over et exo passent par la même `distance` / `usageBorne` | Anecdotique. Ajouter aux hypothèses de l'expérience D (audit A §17). |
| P7 | Runes > 50 de poids : 0 % SN | JohnButlerBlood | `HYPOTHÈSE COMMUNAUTAIRE` | `heavyExoEcShare = 1` limité à PA/PM/PO | Généralisation par seuil de poids, une source. Couvre PO (51) mais pas Invoc (30) → compatible avec P4. Ne pas retenir sans mesure. |
| P8 | Borne 101 : seuil sec, aucun effet avant | kankhun | `HYPOTHÈSE COMMUNAUTAIRE` | `officialFactorsLinear.d = 0` | ✓ Le défaut actuel correspond à cette lecture. |
| P9 | Borne 101 : baisse « exponentielle » en approchant | JohnButlerBlood | `HYPOTHÈSE COMMUNAUTAIRE` | facteur `d` (proposition projet) | ✗ Contredit P8 dans le même fil. `CONTRADICTION` interne. Garder `d = 0`, documenter les deux lectures. |
| P10 | Malus si la rune dépasse 80 % de la plage max de la ligne | kankhun | `HYPOTHÈSE COMMUNAUTAIRE` | R signale le palier 80 % comme issu d'un seul vieux guide | Réapparition en 2023 = héritage probable, pas confirmation indépendante. Statut inchangé. |
| P11 | Rune « trop petite » pour la ligne : dégradation vers 16× la valeur de la rune, « bon courage » au-delà de 20× | kankhun | `HYPOTHÈSE COMMUNAUTAIRE` ★ | Aucun facteur ratio valeur ligne / valeur rune | Facteur candidat absent du modèle. Une source. Lister dans les inconnues sans implémenter. |
| P12 | Qualité de l'objet (proximité du jet max) réduit la probabilité ; « near perf » | tous | `HYPOTHÈSE COMMUNAUTAIRE` | Facteur `distance` de `officialFactorsLinear` (fondé sur le tutoriel officiel) | ✓ Convergence unanime, mais cohérente avec l'héritage des mêmes guides. |
| P13 | Poids total de l'objet (somme des lignes) réduit la probabilité ; retirer le PA « allège de 100 » et facilite les exos | podompodompom, Toxou, JohnButlerBlood | `HYPOTHÈSE COMMUNAUTAIRE` | Absent (le modèle actif est par ligne) | Facteur objet global, trois intervenants. Non chiffré. Noter comme facteur candidat distinct de P12. |
| P14 | Ga PA repasse à 100 % après perte sur Gelano | Indobaclay (rumeur) | `HYPOTHÈSE COMMUNAUTAIRE` | — | ✗ Kamen-Ecudor décrit le PA repassant « en SC ou SN » ; LPBA sans donnée. Ne pas retenir. |

### 5.2 Reliquat / puits

| # | Affirmation | Auteur(s) | Statut | État projet | Verdict |
|---|---|---|---|---|---|
| R1 | Le reliquat ne change rien aux probabilités, il amortit les pertes | kankhun | `HYPOTHÈSE COMMUNAUTAIRE` | `official_factors_linear` n'utilise pas le pool | ✓ Convergence avec le choix actuel. |
| R2 | Le puits « annule les probabilités de SN » sans toucher au SC | LPBA (« presque convaincu », observations de sessions) | `HYPOTHÈSE COMMUNAUTAIRE` | — | Ambigu : effet sur la loi, ou effet d'affichage (SN absorbé affiché comme SC) ? Voir §6. |
| R3 | Puits maximal théorique ≈ 99 (rune de poids 1 faisant sauter un PA 100) | podompodompom | `HYPOTHÈSE COMMUNAUTAIRE` | reliquat = perte − rune | ✓ Arithmétique cohérente. |
| R4 | PA perdu sur une rune % rés → puits 94 | Kamen-Ecudor | `HYPOTHÈSE COMMUNAUTAIRE` | idem | ✓ 100 − 6 = 94 (Ré per à 6 en 2.x). |
| R5 | Le puits ne s'accumule probablement pas sur un puits existant | podompodompom (doute exprimé) | `INCONNU` ★ | `residualPool` ne traite pas explicitement le cumul | À tagger `accumulates: INCONNU`. Testable sur Unity avec le reliquat affiché. |
| R6 | Remettre le PA immédiatement : en SC on garde les 94 de puits, en SN « très peu » de lignes perdues | Kamen-Ecudor | `HYPOTHÈSE COMMUNAUTAIRE` | consommation prioritaire du puits | ✓ Cohérent avec la priorité de consommation. Stratégie, pas mécanique. |

### 5.3 Issues et affichage

| # | Affirmation | Auteur(s) | Statut | État projet | Verdict |
|---|---|---|---|---|---|
| I1 | Il existe un 4ᵉ résultat visible : « échec sans perte » | JohnButlerBlood | `HYPOTHÈSE COMMUNAUTAIRE` | R : « Échec Simple » en `INCONNU` | Voir I2. |
| I2 | Ce 4ᵉ résultat est un artefact : SN dont la perte fait sauter la stat visée, ou EC sans stat disponible à retirer | kankhun | `HYPOTHÈSE COMMUNAUTAIRE` ★ | — | Explication plausible qui **réduirait l'inconnu à 3 issues serveur + couche d'affichage**. Compatible avec `magicPoolStatus ∈ {1,2,3}` du protocole (à ne pas surinterpréter : ce champ peut décrire le pool et non l'issue). Testable sur Unity. |
| I3 | La perte en EC est bornée par les stats disponibles | kankhun | `HYPOTHÈSE COMMUNAUTAIRE` | `ecLossFactor = 1`, `INCONNU` | Ne quantifie pas la perte EC. La question initiale de gamega (perte EC majorée ?) reste sans réponse. |

### 5.4 Densités (table Dofastuces 2.x, PDF figure 1)

Table de **poids par rune** (pas par point). Confrontation aux valeurs Unity du projet :

| Rune (2.x) | Poids 2.x | Unity (projet) | Verdict |
|---|---|---|---|
| Fo/Ine/Cha/Age/Vi/Ini | 1 (Pa 3, Ra 10) | 1/pt ; Vi 0,2/pt ; Ini 0,1/pt | ✓ (rune Vi = 5 pts, rune Ini = 10 pts) |
| Sa, Prospe | 3 | 3 | ✓ |
| Pui | 2 | — | À capturer |
| Ré élém (fixe) | 2 | — | À capturer |
| Ré per | 6 | — | À capturer |
| Ré pou / Ré cri | 2 | — | À capturer (débattu selon R) |
| Ré Pa / Ré Pm / Ret Pa / Ret Pm | 7 | — | **Sur la liste de captures** ; valeur 2.x de référence |
| Pod | 2,5 (Pa 7,5, Ra 25) | 0,25/pt | ✓ (rune = 10 pods) |
| Tacle / Fuite | 4 | 4/pt | ✓ |
| Do | 20 | 20 | ✓ |
| Do élém / Do pou / Do cri / Do pi | 5 | — | À capturer (Do pi = Dommages pièges sur la liste) |
| Do per / Ré per Mé/Di | 15 | — | À capturer |
| Puissance piège | 2 | — | Sur la liste de captures |
| So / Cri / **Do ren** | 10 | Cri 10 ; **Ren 5** | ✓ Cri ; **✗ Renvoi** |
| Invo | 30 | 30 | ✓ |
| Po | 51 | 51 | ✓ |
| Ga PM | 90 | 90 | ✓ |
| Ga PA | 100 | 100 | ✓ |

**Renvoi de dommages** : Dofastuces devient le troisième témoin 2.x de la valeur 10 (avec lilgallon et le code 2.x). Cela renforce l'interprétation « changement 2.x → 3.x non documenté » plutôt que « erreur de lecture ». La `CONTRADICTION` reste ouverte faute de changelog ; elle est le contre-exemple concret à l'hypothèse de continuité (§1).

## 6. Point de méthode : résultat serveur vs conséquence affichée

R1 (kankhun) et R2 (LPBA) sont compatibles si, et seulement si, l'affichage 2.x rapportait la **conséquence** et non l'**issue** : un SN entièrement absorbé par le reliquat ne montre aucune perte et est perçu comme un SC. I2 décrit le cas symétrique (SN qui fait sauter la stat visée → perçu comme échec neutre). Les deux observations décrivent la même confusion, identifiée par l'audit A §16 comme la première source d'erreur de modèle.

Conséquence pour Unity : le client 3.6 affiche le reliquat et une entrée d'historique (`residualPool.visibleInClient`, `SOURCE PRIMAIRE`). La question suivante devient testable et est prioritaire :

> **Un SN dont la perte est entièrement absorbée par le reliquat est-il affiché comme SN ou comme SC dans l'historique Unity ?**

La réponse tranche R1/R2, conditionne le schéma d'observations (champ `displayedOutcome` distinct de `serverOutcome`), et détermine si les mesures communautaires de « taux de SC » sont des mesures d'issue ou de conséquence.

## 7. Le cadre mathématique du PDF Karias (réutilisable)

Indépendamment du postulat P1, la loi géométrique est la modélisation correcte d'un exo lourd à SN nul :

- P(succès en ≤ n tentatives) = 1 − (1 − p)ⁿ (forme de SXD, préférable à la somme de Karias)
- E[X] = 1/p ; σ = √(1 − p) / p ; médiane = ln(0,5) / ln(1 − p)
- Seuil de rentabilité η = (prix objet FM − prix objet nu) / prix rune ; P(rentable) = 1 − (1 − p)^η

Valeurs :

| p | E[X] | σ | médiane | P(≤ 70) |
|---|---|---|---|---|
| 1 % (borne officielle) | 100 | 99,5 | 69 | 50,5 % |
| 1,11 % (postulat PDF) | 90 | 89,5 | 62 | 54,3 % |

Corrections au PDF : σ = 88,52 est légèrement faux (série tronquée ; exact 89,5) ; P(≤ 70) ≈ 0,537 vs 0,539 selon l'arrondi de p, sans conséquence.

Usage projet : le compteur de coût de session peut exposer E[X], σ, médiane et P(≤ η) à partir du `p` du modèle actif, avec le statut du modèle affiché (règle UI : pas de méthodologie visible, mais la valeur de p et son origine doivent rester traçables dans le code).

Extension proposée par LPBA (non rédigée) : coût d'un exo sur objet multi-lignes = coût des runes exo + coût moyen de remontée du jet à chaque EC. Cela nécessite `ecLossFactor` et `lossSelection`, tous deux `INCONNU` ; ne pas afficher de chiffre tant qu'ils le sont.

## 8. Protocole à bas coût issu de ce croisement

Le postulat 1/poids est réfuté qualitativement ; il est aussi **réfutable quantitativement à bas coût**, ce qui vaut mieux qu'un argument d'expérience :

- Exo Do per So (poids 15 en 2.x) sur objet sans dommages poussée : 1/poids prédit 6,7 % de SC ; le plancher officiel + P3 prédit ~1 % de SC avec SN croissant.
- Exo Ré per (6) : 1/poids prédit 16,7 % ; P5 dit < 1/6.
- 500 tentatives par rune suffisent à séparer 1 % de 6,7 % (attendu 5 vs 33 SC).

À condition de journaliser SC/SN/EC séparément et l'état du reliquat, ce protocole teste simultanément P1, P3, P4 et R1/R2 sur Unity. Il est bien moins coûteux que l'expérience E (10 000 Ga Pa/Ga Pme) et devrait la précéder.

## 9. Actions pour le dépôt

1. `data/observations/` — deux entrées : (a) 111/10 000 exo PM, 2.x, non auditée, IC Wilson [0,923 ; 1,335] % ; (b) vidéo Unity 02/2026, 1 000 tentatives, `À DÉPOUILLER`.
2. `empirical_params.json` — notes à enrichir :
   - `probability.model` : facteurs candidats absents (P3 découplage SC/SN exo ; P11 ratio ligne/rune ; P13 poids objet global) ;
   - `officialFactorsLinear.d` : les deux lectures de la borne 101 (P8/P9) ;
   - `heavyExoEcShare` : généralisation « > 50 » (P7) non retenue ;
   - `heavyExoCharacteristics` : ajouter la calibration externe §3 comme soutien du 1 % ;
   - `residualPool` : nouveau champ `accumulates` en `INCONNU` (R5).
3. `docs/archive/` — note « hypothèse 1/poids » : origine (Dofastuces + intuition), réfutation (fils 2021/2023), raisons de sa persistance.
4. `errata.md` — Renvoi de dommages : Dofastuces 2.x = troisième témoin du 10.
5. Liste de captures Unity — ajouter en tête : (a) SN absorbé par le reliquat : affichage SN ou SC ? ; (b) existence d'un 4ᵉ message d'issue ; (c) cumul de reliquat sur reliquat existant ; (d) dépouillement de la vidéo Unity 02/2026.
6. Protocole §8 à inscrire avant l'expérience E dans l'audit A §17.

## 10. Sources

- Forum officiel DOFUS, « [Forgemagie][Maths] Loi de probabilité du passage de runes », gamega#6436, 19/02/2017, réponses jusqu'au 07/04/2023 (copie texte fournie par Yanis le 2026-09-09).
- Forum officiel DOFUS, « Optimisation de la forgemagie exotique +1PM d'un Gelano », LPBA#1394, 23/02/2021, réponses jusqu'au 29/07/2022 (idem). Lien : dofus.com/fr/forum/1067-artisanat-elevage/2352725.
- Karias, « Optimisation de la forgemagie exotique +1 PM d'un Gelano », PDF, 23/02/2021, 5 p. (fichier fourni).
- Vidéo YouTube `n1r8-DIPQQg` (10 000 tentatives, 2.x) — non consultée, relayée.
- Vidéo YouTube `gs0FnGupFQY` et short `CKUgsqAoMpo` (1 000 tentatives, 18-19/02/2026, Unity) — non consultées, identifiées par recherche web le 2026-09-09.
- État du dépôt : `empirical_params.json` (updatedAt 2026-09-08), `CLAUDE.md`, `docs/knowledge/` (A, R), `docs/audit-projet-existant.md` (AP), rapport X du 2026-09-07.
