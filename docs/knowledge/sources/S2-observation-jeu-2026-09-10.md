# S2 — Observation directe en jeu, 10/09/2026

## Identité

| Champ | Valeur |
|---|---|
| **Nature** | Observation directe du client par l'utilisateur, capturée en vidéo |
| **Statut de base** | `SOURCE PRIMAIRE — Unity 3.6.10.11` |
| **Date** | 2026-09-10 |
| **Version de jeu couverte** | **DOFUS 3 / Unity 3.6.10.11** — la version courante |
| **Méthode d'obtention** | Vidéo 42 s, 16 images extraites, transcription manuelle. Aucun sniffing, aucune automatisation, aucun logiciel tiers |
| **Contexte** | Atelier de forgemagie, personnage El-Faker, métier Costumage niv. 42 |
| **Objet** | Cape Bouffante (id 2414), 2 lignes : Vitalité 36–40 à **60** (over) ; Initiative 151–200 à **10** (vidée) |
| **Copie dans le dépôt** | `docs/Observation jeu 2026 09 10.md` (non suivi par git) |
| **Rang de fiabilité** | **R1** — le rang le plus élevé du corpus |

## Portée — règle (b)

> **Cette source prime sur tout le reste pour la version courante.** Une lecture d'écran du
> client Unity 3.6.10.11 tranche contre le DevBlog 1.27, contre les guides, contre les
> dépôts open-source et contre les rapports de compilation.

**Mais la primauté d'un rang ne remplace pas la taille de l'échantillon.** Une observation
unique établit un **fait ponctuel** (« ceci s'est produit »), pas une **règle**
(« ceci se produit toujours »). Le partage est le suivant :

- **Lecture d'écran directe et non ambiguë** (un nombre affiché par le jeu) → règle
  immédiate, N = 1 suffit. Exemple : « le reliquat est affiché », « la densité de la Rune
  Pa Vi est 3 ».
- **Comportement dynamique** (ce que le jeu a *fait* lors d'une tentative) → une occurrence
  ne suffit pas. Statut **`INCONNU`** tant que N est insuffisant.

C'est exactement le partage appliqué aux anomalies ci-dessous.

## Contenu — trois découvertes

### D1 — Le reliquat est affiché en jeu, avec décimales

L'en-tête de la fenêtre de forgemagie affiche `reliquat : X`. Valeurs relevées au fil de la
session : `0` → `0,2` → `0,2` → `0` → `0,1` → `0`.

`SOURCE PRIMAIRE — Unity 3.6.10.11`. **Confirme** l'observation du 2026-09-08 déjà intégrée
(`empirical_params.json → residualPool.visibleInClient = true`, `SOURCE PRIMAIRE`).
Rien de neuf pour le dépôt ; neuf pour la fiche S4 (voir arbitrage 4.4).

### D2 — « DENSITÉ » dans l'infobulle d'une rune = son poids de forgemagie

| Rune | Effet | POIDS (pods) | DENSITÉ | Contrôle |
|---|---|---|---|---|
| Rune Pa Vi (niv. 5) | 15 Vitalité | 1 | **3** | 15 × 0,2 = 3 ✓ |
| Rune Ini (niv. 1) | 10 Initiative | 1 | **1** | 10 × 0,1 = 1 ✓ |

`SOURCE PRIMAIRE — Unity 3.6.10.11`. **Confirme** l'acquis : le schéma
`data/observations/tooltips/schema.json` documente déjà `densityRead` comme la densité de la
**rune entière**, avec l'exemple *« Rune Pa Vi +15 → 3 »*, et `densities.11 = 0,2` /
`densities.44 = 0,1` sont `SOURCE PRIMAIRE` depuis le 2026-09-08. Aucun delta.

### D3 — Le panneau d'historique est un journal de tentatives natif

Colonne de gauche persistante, bouton « VIDER L'HISTORIQUE ». Chaque entrée porte l'icône de
la rune, le détail des gains et des pertes, la mention explicite `+ reliquat` / `- reliquat`,
et la mention `Échec`.

`SOURCE PRIMAIRE — Unity 3.6.10.11`. Conséquence méthodologique majeure : **une entrée
d'historique = une ligne de dataset complète**, et l'historique persiste sur toute la session
— une capture tous les ~15 clics suffit. Cela rend caduc, pour Unity, le protocole de
reconstitution du puits par déduction décrit en S4.

⚠️ **Réserve de lecture** : les entrées d'historique semblent afficher la variation **nette**
d'une ligne, pas le couple (gain brut, perte brute). L'errata du 2026-09-09 contient déjà un
cas analogue (SN Ra Vi : +50 brut, −28 vita −44 ini, **net +22**). Cette réserve est
déterminante pour l'anomalie A2.

## Vérification de la formule du puits

Formule testée : `puits_nouveau = (puits_actuel + poids_des_pertes) − poids_de_la_rune`.

| Test | t | Régime | Rune (poids) | Gain | Perte | Calcul | Affiché |
|---|---|---|---|---|---|---|---|
| 1 | 17,9 s | SN | Ini (1) | +10 Ini | −6 Vitalité | (0 + 6 × 0,2) − 1 = **0,2** | `0,2` ✓ |
| 2 | 30,0 s | EC | Pa Vi (3) | — | −31 Initiative | (0 + 31 × 0,1) − 3 = **0,1** | `0,1` ✓ |

Deux régimes différents, deux exactitudes. La formule du reliquat passe de « convergence
communautaire » à **vérifiée en Unity**. Elle est déjà celle du moteur
(`src/logic/engine/losses.ts`, règle 3) : **CONFIRME**, ne change rien au code.

## Anomalies — statut INCONNU, une occurrence chacune

### A1 — Un EC n'a pas consommé le puits disponible (t ≈ 22,4 s)

Puits = 0,2 avant. Rune Ini (poids 1). Résultat : −5 Vitalité (= 1,0 de poids), aucun gain,
**pas de mention `- reliquat`**, reliquat toujours `0,2` après.

**Contredit le moteur** : `src/logic/engine/losses.ts:66` absorbe la perte par le reliquat
**en priorité**. Le moteur aurait prédit −4 Vitalité (0,8) et reliquat → 0.

Trois lectures, aucune tranchée :
1. la consommation du puits n'est pas systématique en EC ;
2. le puits s'applique par tranches, 0,2 étant trop petit ;
3. la perte est calculée d'abord, le puits n'intervient que si la perte **dépasse** le poids
   de la rune (ici 1,0 pour une rune de 1 : pile, donc aucun dépassement).

La lecture 3 est la plus cohérente avec le DevBlog (S1, « absorbera **en partie** les échecs
futurs »), et elle a le mérite d'être **symétrique** de la règle de création du reliquat
(« créé exactement quand on perd plus que prévu »). Elle reste une lecture.

> **Statut : `INCONNU` — une occurrence, aucune règle.** Le comportement du moteur n'est
> pas modifié dans cette passe. Reproduction ciblée requise : ~20 EC sur objet à puits non
> nul, avec relevé du reliquat avant/après.

### A2 — Un gain partiel : +6 Vitalité avec une Rune Pa Vi (t ≈ 32,0 s)

La Rune Pa Vi vaut +15 Vitalité. L'entrée d'historique montre `6 Vitalité` / `-12 Initiative`.

La source propose de lire un **gain plafonné** et note que « ça invalide l'hypothèse *le gain
vaut toujours la valeur de la rune* ». **Cette lecture n'est pas la seule, et une lecture
concurrente explique l'observation sans invalider quoi que ce soit** :

> **Lecture alternative — SN avec la ligne visée parmi les victimes, affichage en net.**
> Rune Pa Vi, poids 3. En SN, la perte vaut exactement le poids de la rune, et la ligne
> visée est candidate **après application de son gain** (`SOURCE PRIMAIRE`, errata
> 2026-09-09). Si la perte de 3,0 se répartit en **9 Vitalité (1,8) + 12 Initiative (1,2)** :
> - Vitalité : +15 − 9 = **+6 net** ✓ (ce que l'historique affiche)
> - Initiative : **−12** ✓
> - poids total retiré : 1,8 + 1,2 = **3,0** = poids de la rune, exactement ✓
> - reliquat : 3,0 − 3,0 = **0** → aucune mention `± reliquat` ✓
>
> Les quatre observables sont reproduits **par les règles déjà établies**, sans invoquer
> aucun plafond de gain.

La lecture « gain plafonné » exigerait au contraire un mécanisme nouveau et non documenté, et
laisserait inexpliqué pourquoi gain et perte affichés s'équilibrent exactement à 1,2 / 1,2
alors que le poids de la rune est 3.

> **Statut : `INCONNU` — une occurrence.** L'ordre de priorité entre les deux lectures n'est
> pas neutre : la lecture « net » est **compatible avec deux règles déjà `SOURCE PRIMAIRE`** ;
> la lecture « gain plafonné » demande une règle nouvelle. Par parcimonie, la charge de la
> preuve est du côté du plafond de gain.
>
> **Discriminant expérimental** : lire la **valeur absolue** de la ligne Vitalité avant et
> après dans le panneau d'objet (pas dans l'historique). Les deux lectures prédisent ici la
> même valeur finale, donc il faut un cas asymétrique : une rune posée sur une ligne que
> l'objet ne peut pas faire payer (ligne visée à 0 après gain impossible), ou un relevé où
> l'historique afficherait un gain **supérieur** à la variation nette de la ligne.

### A3 — Le libellé `Échec` seul, sans perte détaillée (t ≈ 32,0 s)

À distinguer d'un EC avec pertes. Correspond peut-être au cas DevBlog « rien ne se passe »
(SN impossible), ou au cas déjà codé « EC à lignes et reliquat nuls, Échec sans effet »
(`src/logic/engine/applyRune.ts`, `SOURCE PRIMAIRE` 2026-09-09).

⚠️ **Anomalie de transcription** : A2 et A3 portent le **même horodatage** `t ≈ 32,0 s`. Soit
deux entrées d'historique distinctes sont apparues dans la même image, soit une seule entrée
a été lue deux fois. **À lever sur la vidéo avant toute exploitation** : tant que ce n'est pas
levé, A3 n'est pas une observation exploitable.

> **Statut : `INCONNU`**, et de surcroît **non consolidé** (horodatage en conflit).

## Ce que cette source ne dit pas

- Elle ne donne **aucune probabilité**. Aucune ancre SC/SN/EC n'en sort, ni pour confirmer ni
  pour réfuter S1. Quatre tentatives ne mesurent rien.
- L'échantillon est **hétérogène par construction** : une ligne en over (Vitalité) et une
  ligne quasi vide (Initiative) sur le même objet. La source le signale elle-même. Toute
  estimation de probabilité exige des séries à conditions homogènes.
- Le protocole recommandé par la source — verrouiller la table de densités, puis reproduire
  A1/A2/A3, **puis seulement** la collecte de masse — est repris tel quel dans les
  propositions : c'est le bon ordre.

## Rapport avec les observations déjà versionnées

`data/observations/observations.json` ne contient **qu'une seule tentative** (2026-09-08,
Cape Bouffante, Rune +5 Vitalité, SN, −11 ini, reliquat 0,1). Les quatre tentatives décrites
ici sont **distinctes** et concernent le même objet à un état ultérieur (Vitalité poussée à
60, Initiative vidée à 10). Elles font donc partie des « 13 tentatives de la série encore à
transcrire » signalées dans l'errata du 2026-09-09 : cette source en livre **au moins 4**.
