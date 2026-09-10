# Arbitrages du 2026-09-10

Cinq questions tranchées, puis les modifications de code proposées.
Ordre de préséance appliqué : [`hierarchie-preuves.md`](hierarchie-preuves.md).
Table complète des écarts : [`deltas-2026-09-10.md`](deltas-2026-09-10.md).

> **État : validé et implémenté le 2026-09-10.**
> Les §4.1 à §4.5 ont été écrits AVANT validation et sont conservés tels quels — ils
> constituent le raisonnement, pas le compte rendu. Le §6 liste les propositions telles
> qu'elles ont été soumises ; ce qui a réellement été fait, et ce qui a été délibérément
> écarté, figure au § « Sorties du moteur, avant/après » en fin de document.
> Les numéros de ligne d'`empirical_params.json` cités dans les §4 datent d'avant
> l'ajout des nouveaux paramètres et ont bougé.

---

## 4.1 — PLAFONDS : il y en a deux, pas un

### Ce que dit la racine

DevBlog 1.27, verbatim, deux puces distinctes sous « certaines tentatives sont impossibles » :

> « Il est impossible de dépasser **une limite fixe de puissance d'effets non-naturels, pour
> l'intégralité des objets** (cette limite empêche par exemple d'ajouter à la fois un PA et
> un PM aux objets qui ne possèdent ni l'un ni l'autre de base). »

> « Il est impossible de dépasser un jet naturel maximum si **la somme du power-rate
> non-naturel et du power-rate actuel de l'effet** dépasse une limite fixe. Il est par
> exemple impossible de dépasser **101 points de force** sur un objet dont le jet maximum de
> base est de 60. »

### Ce que fait le dépôt

Une seule constante, `overCapWeight = 101` (`empirical_params.json:7`), sert aux **deux**
usages dans `src/logic/engine/overCap.ts` :

- règle 1 (ligne 50) : la ligne visée, mesurée selon `overCapLineBasis`, ≤ 101 ;
- règle 2 (ligne 56, si `overCapScope = global`) : la somme des parts over + exo de **toutes**
  les lignes ≤ 101.

### Verdict

> **Les deux plafonds sont distincts et doivent être deux paramètres distincts.**
> Rang R3 (S1) contre R5 (guides communautaires, qui les ont fusionnés sous « cap 101 »).
> R3 prime, et il s'agit ici d'une affirmation **structurelle** — de celles qui se
> transposent par défaut à Unity (règle 3 de la hiérarchie).

| | **Plafond par effet** | **Plafond par objet** |
|---|---|---|
| Portée | une ligne | l'objet entier |
| Grandeur bornée | `power-rate non-naturel + power-rate actuel de l'effet` | « puissance d'effets non-naturels » de l'objet |
| Valeur | **exemple donné : 101 points de Force sur base max 60** | **NON DONNÉE** |
| Statut | `SOURCE PRIMAIRE — v1.27` pour la mécanique ; la valeur 101 est un **exemple**, pas une constante nommée | existence `SOURCE PRIMAIRE — v1.27` ; **valeur `INCONNU`** |
| Effet illustratif | plafonne l'overmax d'une ligne | interdit PA **et** PM sur un objet qui n'a ni l'un ni l'autre |
| Dans le dépôt | `overCapWeight` + `overCapLineBasis` | `overCapScope = global` réutilise `overCapWeight` — **conflation** |

### Deux difficultés à ne pas masquer

**(i) La formule du plafond par effet n'est pas celle du dépôt.** Ankama borne une **somme
de deux termes** ; le dépôt borne **un seul terme**, au choix (`total_value` ou `over_part`).
Trois lectures de « power-rate non-naturel + power-rate actuel de l'effet » :

| Lecture | Sur l'exemple Force (base 60, valeur V) | Limite impliquée | Verdict |
|---|---|---|---|
| L1 — les deux termes portent sur la même ligne : `(V − 60) + V` | à V = 101 : 41 + 101 = 142 | **142 ou 143** | valeur non ronde → **peu vraisemblable** |
| L2 — « non-naturel » = le reste de l'objet, « actuel » = la ligne visée : `Σ non-naturel(autres lignes) + V×densité` | objet propre : 0 + 101 = **101** | **101** ✓ | **la plus vraisemblable**, et elle unifie les deux règles du dépôt en **une seule** |
| L3 — le dépôt actuel : deux contrôles séparés, `V×densité ≤ 101` **et** `Σ parts over ≤ 101` | 101 ✓ | 101 | donne la bonne réponse ici, mais par une formule différente |

L2 et L3 divergent dès qu'un objet porte à la fois un over sur la ligne visée **et** un
over/exo ailleurs : L2 les additionne dans un seul budget, L3 les contrôle séparément.
**Statut : `CONTRADICTION` de lecture, non tranchée.** Ne pas trancher au jugé : c'est
observable en HDV, avec le même protocole que celui déjà en place pour `overCapScope`
(`data/observations/item-snapshot.schema.json`).

**(ii) La valeur du plafond par objet est inconnue, mais elle est encadrable.**
Deux faits la bornent, si l'on admet qu'elle se mesure dans l'unité de densité FM :

- un exo PA **seul** est possible (fait massivement attesté) → cap **≥ 100** ;
- PA **et** PM ensemble sont impossibles → cap **< 190**.

> **`objectNonNaturalCap ∈ [100 ; 190[`, valeur exacte `INCONNU`.**
>
> Hypothèses de cet encadrement, à écrire dans la note du paramètre : (a) la « puissance
> d'effets non-naturels » se mesure dans la même unité que la densité FM ; (b) PA = 100 et
> PM = 90 (statut actuel `HYPOTHÈSE COMMUNAUTAIRE`, `empirical_params.json:662` et `:782`) ;
> (c) les densités de 1.27 valent celles d'Unity. Si l'une tombe, l'encadrement tombe.

**Remarque qui ferme la boucle** : la valeur 101, si elle valait aussi pour le plafond objet,
interdirait « exo PA (100) + over de 2 de densité ailleurs ». C'est **exactement** le
contre-exemple déjà inscrit à l'errata comme test de réfutation d'`overCapScope = global`
(2026-09-06, non réfuté par la recherche HDV du 2026-09-08). **La même observation tranche
les deux questions.** Le protocole existant n'a pas besoin d'être refait, seulement relu
sous ce nouvel angle.

---

## 4.2 — ANCRE « JET PARFAIT » : 43/50/7, et le triplet 1/22/77 n'existe pas

### Ce que dit la racine

Ancre 2 du DevBlog : *« Les meilleures probabilités (bonus simples sur objets simples) pour
tenter d'atteindre un jet parfait »* = **43 / 50 / 7**.

Le triplet **`1/22/77`** ne figure **ni dans le texte FR ni dans la traduction allemande**.

### Ce que le dépôt utilise aujourd'hui

Le dépôt n'utilise **aucun triplet littéral**. Il utilise un modèle linéaire :

```
pSC = a + b × distance − c × (niveau / 200) − d × usageBorne
      a = 0,15   b = 0,5   c = 0   d = 0
```
`src/logic/probability/models/officialFactorsLinear.ts:29`, paramètres
`empirical_params.json:277` (`a`), `:288` (`b`), `:253` (`ecShare` = 0,5).

**Écart mesuré sur l'ancre 2.** Une ligne « bonus simple sur objet simple » proche de son jet
parfait a une `distance` proche de 0 :

| Situation | Modèle actuel (SC / SN / EC) | Ancre 2 (v1.27) | Écart |
|---|---|---|---|
| ligne 49 / 50 (`distance` = 0,02) | **16 / 42 / 42** | **43 / 50 / 7** | SC **−27** pts, EC **+35** pts |
| ligne 40 / 50 (`distance` = 0,20) | **25 / 37,5 / 37,5** | — | — |
| ligne vide (`distance` = 1) | **65 / 17,5 / 17,5** | ancre 1 : 66 / 34 / 0 | SC ≈ ✓, **SN divisé par 2** |

**Diagnostic de la cause.** La note de `a` dit : *« posé égal au plancher officiel de 15 %
pour qu'une ligne au jet parfait soit au minimum »*. C'est une **confusion entre deux
situations distinctes du DevBlog** :

- **ancre 3** (15 %) = *« bonus maximums sur objets complexes haut-niveau »* → le minimum
  s'obtient parce que **tout l'objet** est parfait, pas parce que la ligne visée l'est ;
- **ancre 2** (43 %) = *« bonus simples sur **objets simples** »* avec la ligne visée au
  parfait → **43 %**.

Le modèle du dépôt ne peut pas distinguer les deux cas : **il n'a pas de facteur « qualité
globale de l'objet »**, alors que le DevBlog en fait le facteur **le plus important**
(delta A09). Le `a = 0,15` compresse les deux situations sur la même valeur. Ce n'est pas
un réglage à retoucher, c'est une variable manquante.

### Verdict

> **1. L'ancre « jet parfait » est `43/50/7`.** Rang R3 (original Ankama) contre R5 (relais
> Yin-Yang `34/50/16`). L'intervalle `[34 ; 43]` est **fermé sur 43**.
> Valeur `SOURCE PRIMAIRE — v1.27` ; **sa transposition à Unity est une `HYPOTHÈSE`.**
>
> **2. Le triplet `1/22/77` n'existe pas.** Absent du FR et du DE, absent de tous les autres
> relais. **Toute calibration qui le prend pour cible est invalide** — pas approximative :
> invalide, parce qu'elle ajuste des paramètres sur une donnée fabriquée.
>
> **3. Le dépôt `src/` est indemne.** Aucun triplet, aucune calibration sur `1/22/77` dans le
> code ni dans `empirical_params.json`. La contamination est **entièrement documentaire**.

### Fichiers concernés

**Écart à l'ancre 2 (calibration à revoir) :**

| Fichier:ligne | Nature |
|---|---|
| `empirical_params.json:277` | `officialFactorsLinear.a` = 0,15, justifié par une confusion ancre 2 / ancre 3 |
| `empirical_params.json:288` | `officialFactorsLinear.b` = 0,5, calibré sur « l'écho du 66 % d'un vieux guide » — le 66 est authentique, la note le dénigre à tort |
| `empirical_params.json:253` | `ecShare` = 0,5, dont la note affirme que les triplets « ne sont pas utilisables » — **affirmation caduque** |
| `empirical_params.json:368` | `lookupTable`, première ligne (`distance` = 0) = `15 / 42,5 / 42,5` : même écart, figé en table |
| `src/logic/probability/models/officialFactorsLinear.ts:29` | forme linéaire sans facteur de qualité globale |

**Contamination par `1/22/77` et `34/50/16` (documentaire, non versionné) :**

| Fichier:ligne | Nature |
|---|---|
| `docs/archive/2026-09-10-dofus-forgemagie-recherche/ALGORITHME.md:266-268` | `p_jet_parfait`, **défaut 34/50/16** |
| `docs/archive/2026-09-10-dofus-forgemagie-recherche/ALGORITHME.md:532-533` | « le seul chiffre officiel qui dise que le puits change le triplet » — sur un triplet inexistant |
| `docs/archive/2026-09-10-dofus-forgemagie-recherche/ALGORITHME.md:550-559` | tableau de calibration : `1/22/77` compté comme **cible atteinte ✅** |
| `docs/archive/2026-09-10-dofus-forgemagie-recherche/ALGORITHME.md:1135-1136` | U12 « relais divergents », U13 `SN_AVEC_PUITS = 22` |
| `docs/archive/2026-09-10-dofus-forgemagie-recherche/ALGORITHME.md:1270, 1282, 1369-1370, 1413, 1445` | protocoles et prédictions bâtis dessus |
| `docs/archive/2026-09-10-dofus-forgemagie-recherche/README.md:83` | divergence 43 / 34 présentée comme non tranchable |
| `docs/archive/2026-09-10-dofus-forgemagie-recherche/sources/datasets.md:97, 399` | idem |

> **Le bundle est un corpus corrompu.** Sa calibration valide un triplet fabriqué et prend un
> relais fautif pour défaut. Il n'a **pas** été supprimé (règle de `CLAUDE.md` : archiver, ne
> pas effacer) mais **archivé le 2026-09-10** dans
> `docs/archive/2026-09-10-dofus-forgemagie-recherche/`, avec un `AVERTISSEMENT.md` en tête.
> `docs/forgemagie-dropin/` est postérieur au DevBlog et intègre déjà les corrections ; il
> n'est pas contaminé et reste en place, mais il n'est pas audité, et son sous-dossier
> `_recherche/` porte encore des copies périmées du corpus contaminé — d'où son propre
> `AVERTISSEMENT.md`.

---

## 4.3 — ANCRE INÉDITE 32/50/18 : « l'exo, c'est 1 % » est un PLANCHER

### Ce que dit la racine

Ancre 4 : *« Les probabilités **maximums en création d'effet** pour un maître »* =
**32 / 50 / 18**.
Ancre 5 : *« Les probabilités **minimums en création d'effet** pour un maître »* =
**1 / 0 / 99**.

Ces deux ancres bornent **le même régime** — la création d'effet, c'est-à-dire l'exotique.
Elles n'en donnent pas la valeur : elles en donnent l'**intervalle**.

### Verdict

> **1. « L'exo, c'est 1 % » est un plancher, pas une constante.** La création d'effet couvre
> tout l'intervalle **32/50/18 → 1/0/99** selon la difficulté. Le 1 % est atteint aux cas
> extrêmes (PA densité 100, PM 90, PO 51, sur objet déjà chargé) ; créer une ligne légère sur
> un objet simple peut monter à **32 %**.
> Confirmation indépendante en R2 : le tutoriel Ankama actuel dit « **peut descendre jusqu'à**
> 1 % », formulation de plancher, jamais de constante.
>
> **2. Le succès neutre existe en création d'effet, jusqu'à 50 %.** Il n'est nul **qu'au
> plancher** (ancre 5). Poser SN = 0 pour tout exotique est une extrapolation du pire cas au
> régime entier.
>
> **3. L'ancre 4 n'a jamais été relayée par aucun guide en quinze ans.** C'est ce qui explique
> la croyance communautaire « exo = 1 %, jamais de SN » : elle vient d'une **omission** dans
> la chaîne de transmission, pas d'une observation. Voir [`sources/genealogie.md`](sources/genealogie.md).

### Endroits qui traitent l'exo comme une constante 1 % ou posent SN = 0 — inventaire

**Code et paramètres :**

| # | Fichier:ligne | Ce qui s'y trouve | Nature du problème |
|---|---|---|---|
| E1 | `empirical_params.json:264` | `heavyExoEcShare` = **1**, `HYPOTHÈSE COMMUNAUTAIRE`, note : « 1 = aucun succès neutre possible (0/99 des guides) » | **Pose SN = 0 en création d'effet** par défaut. Le pire cas devient le régime |
| E2 | `src/logic/probability/types.ts:63-66` | `distanceToMax` renvoie **0** si `line.isExo` | **Racine du problème.** Tous les exotiques ont la même « distance », donc la même difficulté : le modèle **ne peut pas** exprimer un gradient 32 % → 1 %. Un exo PA et un exo Force léger sortent identiques |
| E3 | `src/logic/probability/index.ts:41` | `isHeavyExo` : appartenance binaire à `{PA, PM, PO}` | Deux régimes seulement (lourd / pas lourd), là où le DevBlog décrit un **continuum** |
| E4 | `src/logic/probability/models/officialFactorsLinear.ts:29` | conséquence de E2 : `pSC = a = 0,15` pour tout exo | **Sortie actuelle d'un exo PA sur objet propre : `15 / 0 / 85`.** Ni le 1 % des guides, ni le 32 % de l'ancre 4, ni rien de documenté. Le plancher de 1 % (`constraints.ts:29`) ne mord jamais, puisque 0,15 > 0,01 |
| E5 | `empirical_params.json:234` | `heavyExoCharacteristics` = `[1, 23, 19]`, `SOURCE PRIMAIRE` | Correct **comme liste des caractéristiques citées par Ankama pour le 1 %** ; devient trompeur si on en fait le seul discriminant de difficulté |

Traitement **correct**, à ne pas toucher : `src/logic/probability/constraints.ts:29`
(`MIN_SC_HEAVY_EXO` est bien un **plancher** appliqué après le modèle) et
`src/content/knowledge.ts:87` (« **Plancher** officiel plus bas pour les exotiques PA, PM et
PO »). Le vocabulaire du projet était déjà juste ; c'est le modèle qui ne suit pas.

**Documentation :**

| # | Fichier:ligne | Ce qui s'y trouve |
|---|---|---|
| E6 | `docs/archive/2026-09-10-dofus-forgemagie-recherche/sources/createurs.md:134` | « L'exo est un cas particulier hors courbe : **1 % fixe, jamais de succès neutre** » |
| E7 | `docs/archive/2026-09-10-dofus-forgemagie-recherche/sources/createurs.md:221` | « avec l'exo traité à part (**1 % / 0 % / 99 %**) » |
| E8 | `docs/archive/2026-09-10-dofus-forgemagie-recherche/sources/datasets.md:415` | « SN lors d'un exo PA/PM/PO | **0 %** | ★★★ » — trois étoiles de confiance sur une valeur qui n'est que le pire cas |
| E9 | `docs/knowledge/Reconstruction_…md`, Key Findings 5 + tableau final | « Exo PA/PM/PO ≈ 1 % : valeur primaire […] **Implémentable : Oui (constante)** » |

> **Aucune correction n'est appliquée.** L'inventaire est arrêté ici, comme demandé.
> Les corrections sont proposées en §6, propositions 2 et 3.

---

## 4.4 — RELIQUAT ET PROTOCOLE : la conclusion S4 est re-scopée à 2.x

### Les deux affirmations en présence

| Source | Affirmation | Rang | Version couverte |
|---|---|---|---|
| **S4** §A, §D, §H·5 | « `magicPoolStatus` n'est **pas** la valeur du reliquat : c'est un simple indicateur de sens de variation (1 stable / 2 + / 3 −). Le reliquat est calculé et stocké côté serveur et **n'est pas exposé au client**. » Source : fil Cadernis sur le message ActionScript `ExchangeCraftResultMagicWithObjectDescMessage` | R4 | **DOFUS 2.x** |
| **S2** D1 | L'en-tête de la fenêtre de forgemagie Unity affiche `reliquat : 0,2`, **avec décimales** ; l'historique porte les mentions `+ reliquat` / `- reliquat` | R1 | **Unity 3.6.10.11** |

### Verdict

> **La conclusion de S4 est exacte pour le protocole 2.x et obsolète pour Unity.**
>
> Ce n'est **pas** une contradiction entre deux sources : ce sont deux affirmations vraies
> portant sur **deux versions différentes du protocole**. Le message cité par S4 est un
> message ActionScript de DOFUS 2.x ; S4 dit lui-même que rien ne garantit sa survie sous
> Unity. Ankama a changé de comportement entre les deux versions, comme il l'avait déjà fait
> en 2.58 en affichant le poids des runes en infobulle.
>
> Rang R1 contre R4 sur la version courante : **S2 prime, sans discussion.**

Cette conclusion était déjà celle du dépôt depuis le 2026-09-08
(`empirical_params.json:129`, `visibleInClient = true`, `SOURCE PRIMAIRE`). L'apport du
2026-09-10 n'est pas le fait — il est acquis — mais le **re-scope explicite de la fiche S4**,
qui restait citable en l'état et pouvait rouvrir une question close.

### Re-scope de la fiche protocole

Consigné dans [`sources/S4-reverse-engineering-technical-mapping.md`](sources/S4-reverse-engineering-technical-mapping.md),
section « Périmètre de validité ». En résumé :

| Élément de S4 | Nouveau périmètre |
|---|---|
| `magicPoolStatus`, `craftResult`, `ExchangeCraftResultMagicWithObjectDescMessage` | **valide pour 2.x uniquement** ; non confirmé sous Unity |
| « le reliquat n'est pas exposé au client » | **valide pour 2.x, obsolète pour Unity** |
| §I étape 7, « sniffer une session pour capter `magicPoolStatus` » | **caduc pour le reliquat** ; reste utile pour les noms de messages |
| §H·5 « formule exacte du reliquat côté serveur, inconnue » | **partiellement close** : la **création** est vérifiée deux fois en Unity (S2) ; la **consommation** reste inconnue (anomalie A1) |
| §B outillage, §A protocole Unity, §D/§E résultats négatifs, §F champs DofusDB | **inchangés et valides** |

### Ce que le re-scope change au protocole de collecte

Le protocole de calibration reposait sur la reconstitution du puits par déduction, faute de
pouvoir le lire. **Il n'a plus lieu d'être.** Le jeu affiche la valeur, journalise chaque
tentative, et conserve l'historique sur toute la session : une entrée d'historique **est**
une ligne de dataset. Le chemin technique lourd (dump IL2CPP, sniffing protobuf) reste
pertinent pour ce que l'écran n'expose pas — noms de messages, valeurs d'enum, emplacement de
la table de densités, probabilités éventuellement transmises — **pas pour le reliquat**.

---

## 4.5 — POTIONS : contradiction non résolue, aucune valeur dans le code

### Les trois versions en circulation

| Version | Contenu | Source | Rang | Version de jeu |
|---|---|---|---|---|
| **V1** | **Deux paliers** (niveau 20 et 80), **aucun taux affiché** ni dans l'infobulle du client Unity, ni dans l'API | observation en jeu du 2026-09-08 (client 3.6.10.11) + `data/dataset.json` | **R1** | **Unity 3.6.10.11** |
| **V2** | **Trois** qualités : **50 % / 65 % / 80 %** de dégâts conservés | Dofus Pages, wiki-dofus.eu (via S3 PARTIE 10 et S4 §G) | R5 | Rétro / 2.x |
| **V3** | Le palier **65 % supprimé en 3.1** ; les armes ainsi forgemagées **converties à 85 %** | Dofus Wiki (Fandom), via S4 §G | R5 | 3.1 |

### Verdict

> **`CONTRADICTION NON RÉSOLUE`. Aucune valeur n'entre dans le code.**
>
> Les trois versions sont mutuellement incompatibles, et **aucune ne peut être écartée par
> la hiérarchie seule** :
> - V1 est R1, le rang le plus élevé, et porte sur la version courante — mais c'est un
>   **résultat négatif** : « aucun taux affiché » ne donne pas le taux. V1 réfute V2 sur le
>   **nombre de paliers** (deux, pas trois) sans rien dire des pourcentages.
> - V3 expliquerait V1 : si le palier 65 % a disparu en 3.1, il ne reste que deux paliers —
>   ce que V1 constate. **Cohérence troublante, et insuffisante** : V3 est R5, et « converties
>   à 85 % » décrit une **migration d'objets existants**, pas le taux du palier haut.
> - V2 est R5 et daté d'avant 3.1.
>
> Ce qui est établi : **deux paliers en Unity** (R1). Ce qui ne l'est pas : **les deux
> pourcentages**. Une contradiction sur trois valeurs dont on ne peut en confirmer aucune
> n'est pas une contradiction qu'on tranche par arbitrage documentaire — elle se tranche par
> mesure.

### État du dépôt : correct au fond, incohérent en surface

| Élément | État | Verdict |
|---|---|---|
| `empirical_params.json:648` | `damageKeptPercentByLevel` = `{}` (vide), module désactivé | ✅ **correct** — le dépôt a refusé la recommandation de S3 de coder 50/65/80 en dur |
| `empirical_params.json:650` | statut = **`INCONNU`** | ⚠️ **à revoir** : il y a bien des sources, elles se contredisent → `CONTRADICTION` |
| `empirical_params.json:652` | note citant V2 (50/65/80) et « 85 % (jeuxonline, Rétro) » | ⚠️ **incomplet** : **V3 n'y figure pas** — « 65 % supprimé en 3.1, conversion à 85 % » est une affirmation distincte de « 85 % en Rétro » |
| `src/components/atelier/ActionPanel.tsx:177` | affiche `<StatusBadge status="CONTRADICTION" />` | ⚠️ **incohérent** avec le statut `INCONNU` du paramètre : l'interface annonce un statut que la donnée ne porte pas |
| `src/content/knowledge.ts:95` | texte prudent, aucune valeur avancée | ✅ correct |
| Module potions | désactivé, bouton inerte | ✅ correct |

### Mesure qui trancherait

Relever les dégâts d'une arme **avant et après** application d'une potion, pour **chaque
palier** (niveau 20 et niveau 80), sur au moins deux armes de fourchettes différentes pour
séparer le taux d'un éventuel arrondi. Deux mesures par palier suffisent : le taux est une
constante, pas une distribution. C'est le protocole le moins coûteux du corpus, et il ferme
définitivement V1/V2/V3.

---

## 6 — Modifications de code proposées

Triées par **impact décroissant sur les sorties du simulateur**.
Aucune n'est implémentée. Chacune porte le statut de la donnée qui la motive et ce qui casse
si l'hypothèse sous-jacente est fausse.

---

### P1 — Ajouter le facteur « qualité globale de l'objet » au modèle de probabilité

**Fichiers visés** : `src/logic/probability/types.ts` (ajout à `ProbabilityInput`),
`src/logic/probability/models/officialFactorsLinear.ts:29`,
`empirical_params.json:275` (nouveau coefficient), appelants dans `src/hooks/useAtelier.ts`.

**Statut de la donnée qui la motive** : `SOURCE PRIMAIRE — v1.27` (delta A09) —
*« La formule dépend, par ordre décroissant d'importance : de la qualité globale de l'objet,
de la qualité du jet modifié, du niveau de l'objet »*. Transposition à Unity : `HYPOTHÈSE`.
Le DevBlog précise aussi que **le jet en cours de modification est exclu** de ce calcul
(A10), et que le décompte des over/exo, lui, **l'inclut** (A11).

**Pourquoi c'est le premier** : c'est le facteur **le plus important** selon Ankama, et il
est **entièrement absent** du modèle. Toutes les autres corrections de calibration (P3)
butent dessus : sans lui, le modèle ne peut pas distinguer l'ancre 2 (43 %, objet simple) de
l'ancre 3 (15 %, objet complexe parfait), et aucun réglage de `a` ne le pourra.

**Ce qui casse si l'hypothèse est fausse** :
- Si Unity a supprimé ce facteur, le modèle acquiert une dépendance à l'**état complet de
  l'objet**. Conséquence pratique : les mesures faites sur une ligne isolée ne suffisent plus
  à identifier les paramètres — le nouveau coefficient absorbe du bruit et **dégrade** les
  calibrations existantes au lieu de les améliorer.
- Le coût en surface d'API est réel : `ProbabilityInput` ne reçoit aujourd'hui qu'une ligne ;
  il faudrait lui passer l'objet. Cela touche tous les appelants et les trois modèles.
- **Atténuation** : pente à **0 par défaut**, comme le terme `d`. Le comportement par défaut
  du simulateur reste **strictement inchangé** tant qu'aucune mesure ne fixe la pente.
  La proposition est alors sans risque de sortie, et son seul coût est structurel.

---

### P2 — Cesser de produire `15 / 0 / 85` pour un exotique

**Fichiers visés** : `src/logic/probability/types.ts:63-66` (`distanceToMax`),
`empirical_params.json:264` (`heavyExoEcShare`), `src/logic/probability/index.ts:41`.

**Statut de la donnée qui la motive** : `SOURCE PRIMAIRE — v1.27` (ancres 4 et 5, deltas A05
et A06) + `SOURCE PRIMAIRE — Unity` (tutoriel : « **peut descendre jusqu'à** 1 % »).

**Le défaut, précisément** : `distanceToMax` renvoie 0 pour toute ligne exotique, donc
`pSC = a = 0,15` ; avec `heavyExoEcShare = 1`, un **exo PA sur objet propre sort à
`15 / 0 / 85`**. Cette valeur ne correspond à **aucune source** : ni au 1 % des guides, ni
au 32 % de l'ancre 4, ni au 15 % du plancher normal (qui, par le tutoriel, **ne s'applique
pas** aux exotiques). C'est un artefact de la valeur de `a`, pas un modèle.

**Deux corrections distinctes, à ne pas confondre** :
1. *(structurelle)* donner une **grandeur de difficulté** aux exotiques — la plus naturelle
   étant la densité de la ligne créée (PA 100 ≫ Force 1), ce qui produit mécaniquement le
   gradient 32 % → 1 % du DevBlog. Statut de la forme retenue : `INCONNU`, à exposer en
   paramètre.
2. *(paramétrique)* ramener `heavyExoEcShare` de 1 à une valeur qui **laisse exister le SN**,
   le 0 étant réservé au plancher. Statut : `SOURCE PRIMAIRE — v1.27` pour l'existence du SN
   en création d'effet ; `INCONNU` pour la valeur.

**Ce qui casse si l'hypothèse est fausse** :
- Si Unity a bien figé l'exotique à `1/0/99` (ce que croient les guides depuis quinze ans, et
  que **personne n'a mesuré**), on remplace une valeur fausse mais conservatrice par une
  valeur **optimiste** : l'atelier annoncerait des chances de réussite d'exo supérieures à la
  réalité. **C'est le risque le plus coûteux de toute cette liste pour l'utilisateur** —
  un joueur brûlerait des runes sur la foi d'un chiffre trop favorable.
- Atténuation obligatoire : ne pas toucher le défaut avant mesure ; livrer la **structure**
  (1) avec des pentes qui reproduisent `1/0/99` sur PA/PM/PO, et n'ouvrir le gradient que
  pour les exotiques légers, là où l'ancre 4 s'applique.
- La liste `heavyExoCharacteristics` reste `SOURCE PRIMAIRE` et ne bouge pas.

---

### P3 — Recalibrer `a` / `b` / `ecShare`, ou ajouter un modèle `devblog_1_27`

**Fichiers visés** : `empirical_params.json:277` (`a`), `:288` (`b`), `:253` (`ecShare`),
`:368` (`lookupTable`, première ligne), et éventuellement un nouveau modèle dans
`src/logic/probability/models/`.

**Statut de la donnée qui la motive** : les cinq ancres, `SOURCE PRIMAIRE — v1.27` ;
**leur transposition à Unity est une `HYPOTHÈSE`**, appuyée par le fait que deux des cinq
bornes (15 % et 1 %) sont reconduites à l'identique dans le tutoriel Ankama actuel (R2).

**Forme recommandée** : **ne pas modifier le modèle par défaut**. Ajouter un modèle nommé
`devblog_1_27`, sélectionnable, calibré sur les cinq ancres, avec le SN **plafonné à 50 %**
et en cloche (delta A08 : *« au maximum 50 %, proches de ce maximum dans la majorité des cas,
elles diminuent si la transformation est très facile, au profit du SC, ou très difficile, au
profit de l'EC »*). L'interface l'affiche avec sa version : **« modèle DevBlog 1.27 (2010) »**.

**Ce qui casse si l'hypothèse est fausse** :
- Si les probabilités Unity ont changé depuis 2010, on offre un modèle **faussement précis**.
  Un modèle qui reproduit exactement cinq chiffres inspire une confiance que sa source ne
  justifie pas : c'est exactement le piège dans lequel le PDF réfuté était tombé.
- **Le nommer par sa version est la seule protection efficace.** Un modèle appelé
  `devblog_1_27` ne peut pas être confondu avec une mesure Unity ; un modèle appelé
  `official_anchors` le serait immédiatement.
- Risque nul sur les sorties par défaut si le modèle n'est pas le défaut. C'est la raison de
  le proposer sous cette forme.

---

### P4 — Scinder `overCapWeight` en deux paramètres

**Fichiers visés** : `empirical_params.json:7` et `:18`, `src/logic/engine/overCap.ts:39-93`,
`src/data/statCaps.ts`, `src/__tests__/engine/overCap.test.ts` et `overCapTruncate.test.ts`.

**Statut de la donnée qui la motive** : `SOURCE PRIMAIRE — v1.27` pour l'**existence de deux
plafonds distincts** (§4.1) ; **`INCONNU`** pour la valeur du plafond objet, encadrée
`[100 ; 190[` sous trois hypothèses explicitées.

**Forme** : `overCapEffectWeight` (101, mécanique du plafond par effet) et
`objectNonNaturalCap` (`INCONNU`, initialisé à 101 **pour ne rien changer**, bornes
`[100 ; 190[`). Le paramètre `overCapScope` cesse d'être une portée de la même constante et
devient le choix entre les lectures L2 et L3 de §4.1(i).

**Ce qui casse si l'hypothèse est fausse** :
- Si Unity n'a qu'un seul plafond, on introduit un paramètre libre supplémentaire qui, mal
  réglé, **interdirait des combinaisons légales** : l'atelier refuserait des runes que le jeu
  accepte. C'est un faux négatif silencieux, plus difficile à repérer qu'une erreur de
  probabilité.
- Atténuation : initialiser à 101 rend le comportement **identique bit à bit** à l'actuel ;
  la scission est alors purement documentaire tant que la valeur n'est pas changée. Les tests
  existants doivent passer **sans modification** — c'est le critère d'acceptation.
- La lecture L2 vs L3 reste ouverte : ne pas la trancher dans le code, l'exposer.

---

### P5 — Rendre la consommation du reliquat paramétrable

**Fichiers visés** : `src/logic/engine/losses.ts:65-68`, nouveau paramètre sous
`empirical_params.json:115` (`residualPool`).

**Statut de la donnée qui la motive** : `INCONNU` (anomalie **A1** de S2, **N = 1**),
convergent avec `SOURCE PRIMAIRE — v1.27` (delta A29 : le reliquat « absorbera **en partie**
les échecs futurs » — *en partie*, pas en totalité).

**Le fait** : puits 0,2 disponible, rune de poids 1, EC → le jeu a retiré **5 Vitalité
(1,0)** et **laissé le puits intact**. Le moteur aurait prédit 4 Vitalité et puits → 0.

**Ce qui casse si l'hypothèse est fausse** :
- **Une occurrence ne fait pas une règle.** Si c'est un cas particulier (arrondi, tranche
  minimale, cas limite « perte exactement égale au poids de la rune »), généraliser
  introduirait un biais systématique sur **toutes** les simulations à puits non nul —
  c'est-à-dire la majorité des sessions longues.
- Atténuation : **ne pas changer le défaut**. Ajouter le mode alternatif (« le puits
  n'absorbe que le dépassement au-delà du poids de la rune ») en option, et attendre les
  ~20 EC de reproduction. C'est le même schéma que `overCapLineBasis`.
- **Cette proposition ne doit pas être implémentée avant la campagne de reproduction.**
  Elle figure ici pour être planifiée, pas pour être faite maintenant.

---

### P6 — Facteurs de difficulté v1.27 non modélisés

**Fichiers visés** : `src/logic/probability/types.ts` et
`models/officialFactorsLinear.ts` ; `src/types/forgemagie.ts` (notion d'éthéré) ;
`empirical_params.json:275`.

**Statut** : `SOURCE PRIMAIRE — v1.27` pour l'existence de chaque facteur ; `INCONNU` pour
toutes les valeurs. Transposition Unity : `HYPOTHÈSE`.

| Facteur | Delta | Effet dans le dépôt aujourd'hui |
|---|---|---|
| Palier **brutal à 80 %** de la fourchette | A12 | aucun modèle n'a de discontinuité |
| Exemption du palier pour les **jets fixes** | A13 | `distanceToMax` traite un jet fixe comme un jet parfait — **effet opposé** |
| Objets **mono-jet** plus faciles | A17 | absent |
| Objets **éthérés** plus difficiles | A18 | notion absente du modèle de données |
| Niveau : effet **positif et faible** | A15 | `c` = 0, note « sens inconnu » — **le sens est connu** |
| Runes puissantes facilitent les valeurs élevées | A16 | `runeWeight` est en entrée mais **inutilisé** |

**Ce qui casse si l'hypothèse est fausse** : chaque facteur ajouté est un degré de liberté
supplémentaire. Sur un dataset de quelques dizaines de tentatives, **un modèle à huit
paramètres libres s'ajuste à n'importe quoi** et ne prédit rien. Le risque n'est pas
l'erreur : c'est le **surajustement présenté comme une reconstitution**. Atténuation : les
introduire un par un, chacun à pente nulle, et n'en activer un que si le dataset le
distingue significativement de zéro (N documenté, comme l'exige `CLAUDE.md`).

---

### P7 — Règles de perte v1.27 non modélisées

**Fichiers visés** : `src/logic/engine/losses.ts:31-55`, `src/logic/engine/lossSelection.ts`,
`empirical_params.json:74` et `:101`.

**Statut** : `SOURCE PRIMAIRE — v1.27`.

1. **Malus** (A24, A25) : les malus ne peuvent pas dépasser le malus maximum **naturel**, et
   on ne peut **pas puiser dans un malus non overmaxé**. Le moteur obtient un résultat voisin
   par accident (`removablePoints` renvoie 0 pour une valeur ≤ 0) mais **n'a pas la règle**.
2. **Épargne probabiliste** (A27) : un bonus trop puissant « a une chance d'être épargné, mais
   ce n'est pas systématique ». Aucune stratégie ne l'implémente ; le DevBlog **ne donne aucun
   chiffre**, donc la probabilité est `INCONNU`.
3. **SN impossible sur mono-jet** (A32) : « **rien ne se passe** ». Le paramètre
   `lossSelection.unpayableSn` (`INCONNU`, défaut `ec_no_effect`) a désormais une source
   primaire v1.27, au moins pour ce cas précis.

**Ce qui casse si l'hypothèse est fausse** :
- Point 1 : risque faible, le comportement observable ne changerait presque pas. Le gain est
  d'avoir la règle explicite plutôt qu'un effet de bord.
- Point 2 : **risque élevé**. Ajouter une épargne probabiliste sans en connaître la loi
  revient à inventer une formule — ce que `CLAUDE.md` interdit. À n'implémenter que comme
  **stratégie de sélection supplémentaire, non défaut**, paramétrée, et jamais présentée
  comme la loi du serveur.
- Point 3 : ⚠️ **attention à la version**. Le DevBlog décrit le cas mono-jet en 1.27 ;
  l'observation A3 (S2) pourrait être ce cas en Unity, mais elle est **non consolidée**
  (horodatage en conflit avec A2). Ne rien changer avant de lever cette ambiguïté.

---

### P8 — Étiquettes, statuts et cohérence des textes

**Aucun effet sur les sorties du simulateur.** Uniquement de la traçabilité — ce qui, dans ce
projet, est la fonction principale.

| # | Fichier:ligne | Correction proposée | Statut motivant |
|---|---|---|---|
| a | `empirical_params.json:650` | statut potions `INCONNU` → **`CONTRADICTION`** | §4.5 |
| b | `empirical_params.json:652` | ajouter **V3** à la note : « 65 % supprimé en 3.1, armes converties à 85 % » (Fandom, via S4 §G) — distinct du « 85 % Rétro » déjà cité | `R5`, delta D08 |
| c | `empirical_params.json:256` (`ecShare`) | la note affirme que les triplets « viennent d'une seule source ancienne recopiée et **ne sont pas utilisables** » → **caduc** : l'original Ankama a été retrouvé. Reformuler en « chiffres d'Ankama datés de v1.27, transposition à Unity = `HYPOTHÈSE` » | `SOURCE PRIMAIRE — v1.27` |
| d | `empirical_params.json:291` (`b`) | même correction : « écho du 66 % d'un vieux guide » → **ancre 1 du DevBlog, authentique** | idem |
| e | `empirical_params.json:280` (`a`) | documenter la **confusion ancre 2 / ancre 3** dans la note, même sans changer la valeur | §4.2 |
| f | `empirical_params.json:310` (`d`) | le terme d'usage de la borne était « une proposition du projet **sans source** » : il a maintenant une **source primaire v1.27** pour son existence et son signe (A14, A11) | `SOURCE PRIMAIRE — v1.27` |
| g | `empirical_params.json:301` (`c`) | la note dit « Ankama cite le niveau **sans en donner le sens** » → le DevBlog donne le sens (positif) et l'ordre de grandeur (**faible**) | A15 |
| h | `src/components/atelier/ActionPanel.tsx:177` | l'interface affiche `CONTRADICTION` alors que le paramètre porte `INCONNU` — **incohérence** ; résolue par (a) | §4.5 |
| i | `src/content/knowledge.ts:82` | « Les **seuls** facteurs cités par Ankama sont le niveau de l'objet et la proximité du jet maximal » → **faux depuis S1** : le DevBlog en cite six, dont le plus important (qualité globale de l'objet) est absent du modèle | A09 |
| j | `docs/knowledge/errata.md` | ajouter les lignes correspondant aux arbitrages 4.1 à 4.5 | — |

**Ce qui casse si l'hypothèse est fausse** : rien, techniquement. Mais (c), (d) et (i)
touchent des notes qui **justifient** des valeurs : les corriger sans corriger les valeurs
laisse le dépôt dans un état où la justification et le chiffre ne concordent plus. À faire
**avec** P3, ou à assortir d'une mention explicite « valeur inchangée, justification revue ».

---

### P9 — Ingestion des données, et rangement documentaire

**Fichiers visés** : `data/observations/observations.json`,
`data/observations/captures/2026-09-10/` (à créer), `docs/sources/raw/` (à créer),
`docs/archive/`.

**Statut** : `SOURCE PRIMAIRE — Unity 3.6.10.11` pour les tentatives ; organisationnel pour
le reste.

1. **Transcrire les quatre tentatives de S2** au format `schemaVersion 1` (Test 1, Test 2,
   A1, A2). Elles font partie des « 13 tentatives de la série encore à transcrire » signalées
   à l'errata du 2026-09-09. `observations.json` n'en contient **qu'une** à ce jour.
   ⚠️ Prérequis : verser les **captures** dans `data/observations/captures/2026-09-10/`.
   Le schéma l'exige — *« sans capture, la lecture n'est pas auditable »* — et cette règle
   ne souffre pas d'exception, fût-ce pour une source R1.
2. **Lever l'ambiguïté A2 / A3** (même horodatage `t ≈ 32,0 s`) sur la vidéo avant de
   transcrire l'une ou l'autre.
3. **Créer `docs/sources/raw/`** et y ranger les quatre sources, comme l'annonçait la demande.
   Les deux fichiers de la racine de `docs/` ne sont pas suivis par git ; les deux de
   `docs/knowledge/` le sont depuis `da87c77` et leur déplacement demande un `git mv`.
4. **Archiver `docs/archive/2026-09-10-dofus-forgemagie-recherche/`** vers `docs/archive/` avec une note
   d'en-tête expliquant la contamination (`1/22/77` inexistant, défaut `34/50/16`). Ne pas
   supprimer : `CLAUDE.md` l'interdit.
5. **Auditer ou écarter `docs/forgemagie-dropin/`** : postérieur au DevBlog, non contaminé,
   mais **non fiché**. Tant qu'il n'est pas audité, il n'appartient pas au corpus.

**Ce qui casse si l'hypothèse est fausse** :
- Point 1 : si les tentatives sont mal transcrites (état AVANT déduit plutôt que lu), elles
  contaminent le futur dataset de calibration avec des valeurs reconstruites. Le champ
  `lineStateBeforeDeduced` existe précisément pour ça — **il doit être renseigné à `true`**
  pour toute tentative dont l'état initial n'a pas été lu à l'écran.
- Point 3 : un `git mv` sur des fichiers cités par `empirical_params.json` (abréviation `R`)
  et par `CLAUDE.md` casse ces références. **À ne faire qu'avec la mise à jour simultanée des
  citations**, sinon le dépôt perd sa traçabilité — le contraire du but recherché.

---

## Sorties du moteur, avant / après

Mesuré sur le code, pas déduit. Valeurs par défaut du fichier, objet propre de niveau 200
sauf mention contraire. **Seuls P2 et P7 modifient une sortie.**

### Ce qui change

| Situation | Avant | Après | Proposition |
|---|---|---|---|
| **Exo PA sur objet propre** | **15 / 0 / 85** | **1 / 0 / 99** | **P2** |
| **Exo léger** (Invocations, Force…) | **15 / 42,5 / 42,5**, point | **intervalle 1–32 / 0–50 / 18–99**, marqué `INCONNU` ; tirage sur 1 / 0 / 99 | **P2** |
| **Malus overmaxé** (Chance −1, naturel −10…−5) lors d'un EC de poids 10 | jamais candidat : Force 20 → 10, le malus intact | Chance −1 → −5 (paie 4), Force 20 → 14 (paie 6) | **P7** |
| **Malus non overmaxé** | jamais candidat (par accident) | jamais candidat (par règle) — comportement identique, justification différente | **P7** |
| **SN dont la perte est impayable** | converti en « échec sans effet », rune consommée | **rien ne se passe** : objet strictement identique, reliquat intact | **P7** |

L'exo PA est le cas qui motivait la priorité : **quinze fois trop optimiste** sur
l'opération la plus coûteuse du jeu. Le simulateur annonce désormais la seule valeur
qu'Ankama publie, et ne propose jamais mieux.

### Ce qui ne change pas — vérifié, pas supposé

| Situation | Avant | Après | Proposition concernée |
|---|---|---|---|
| Ligne naturelle 40 / 50, rune +1 | 25 / 37,5 / 37,5 | **identique** | P1, P3, P6 |
| Ligne naturelle 49 / 50, rune +1 | 16 / 42 / 42 | **identique** | P1 |
| Ligne vide 0 / 50 | 65 / 17,5 / 17,5 | **identique** | P1, P6 |
| Overmax (55 / 50) | 15 / 42,5 / 42,5 | **identique** | P1, P6 |
| Ligne à jet fixe | 15 / 42,5 / 42,5 | **identique** | P6 |
| Objet de qualité globale 1 (toutes autres lignes parfaites) | — | **identique** au cas qualité 0 (`e` = 0) | **P1** |
| Borne over/exo, tous les cas | `overCapWeight` = 101 partout | `overCapWeight` = 101, `objectNonNaturalCap` = 101 → **identique bit à bit** | **P4** |
| Absorption par le reliquat | priorité, en totalité | **identique** — seam posé, une seule implémentation | **P5** |
| Étiquettes, statuts, textes | — | aucun effet sur les sorties | **P8**, **P9** |

**Critère d'acceptation de P4 tenu** : les 22 tests d'`overCap.test.ts` et les 14
d'`overCapTruncate.test.ts` passent **sans une seule modification**.

**P1 et P6 sont neutres par construction** : toutes les pentes ajoutées valent 0. Le
facteur de qualité globale est calculé et transmis au modèle, mais ne pèse rien tant qu'un
dataset ne l'aura pas mesuré. C'était la condition posée.

### Tests

| | Avant | Après |
|---|---|---|
| Fichiers | 17 | **21** |
| Tests | 197 | **235** |
| Modifiés | — | 3 fichiers, tous par nécessité de P2 (voir ci-dessous) |

Trois tests existants ont dû changer, tous parce qu'ils **certifiaient le défaut** :

- `probability.test.ts` — `distanceToMax` d'un exo attendait `0` ; c'est précisément ce
  qui rendait un exotique indiscernable d'un jet parfait. Attend maintenant `null`.
- `floorScope.test.ts` — attendait qu'un exo sorte à la valeur du modèle (`a`). Le
  garde-fou précède désormais le modèle : le test vérifie cette précédence.
- `probability.test.ts` (deux constructions de paramètres) — ajout du champ `e`.

Aucun test n'a été modifié pour faire passer P1, P3, P4, P5, P6, P8 ou P9.

### Ce qui a été délibérément écarté

| Écarté | Pourquoi |
|---|---|
| Le **continuum** de difficulté 32 % → 1 % pour les exotiques | Sa forme est inconnue. L'inventer produirait le chiffre faussement précis que P2 cherche à supprimer. L'intervalle est l'aveu d'ignorance, et il tient. |
| L'**épargne probabiliste** d'un bonus « trop puissant » (P7) | Ankama écrit « a une chance d'être épargné, mais ce n'est pas systématique » **sans donner aucun chiffre**. Coder une probabilité serait inventer une formule (`CLAUDE.md`, règle 3). |
| Les **trois lectures alternatives** de l'anomalie A1 (P5) | N = 1. Le seam est posé, les implémentations attendent la campagne de reproduction. |
| Le **déclencheur littéral** du no-op mono-jet (P7) | « Un AUTRE jet » suppose que la ligne visée ne peut pas payer — vrai en 1.27, faux en Unity (observation R1 du 2026-09-09). Appliquer le déclencheur de 1.27 contredirait une source de rang supérieur. C'est la condition générale d'Ankama qui est codée, avec les règles de paiement d'Unity. |
| L'**ingestion des 4 tentatives** de S2 (P9) | Les captures manquent. Le schéma exige une capture versionnée : « sans capture, la lecture n'est pas auditable ». Sans exception, fût-ce pour du R1. |
| Le **déplacement** des documents de `docs/knowledge/` vers `docs/sources/raw/` (P9) | Un `git mv` casserait les références `R` d'`empirical_params.json` et de `CLAUDE.md` s'il n'est pas simultané avec leur mise à jour. |
| Toute valeur de **potion** | `CONTRADICTION NON RÉSOLUE`. |

### Ce qui reste ouvert

| Question | Statut | Comment la trancher |
|---|---|---|
| Forme du plafond par effet : lectures L1 / L2 / L3 | `CONTRADICTION` | Observation HDV d'un objet portant un over sur la ligne visée **et** un over/exo ailleurs |
| Valeur du plafond objet | `INCONNU`, encadré [100 ; 190[ | Un exo PA + un exo PO coexistent-ils ? Si oui, borne basse à 151 et 101 réfuté |
| Anomalie A1 (consommation du reliquat) | `INCONNU`, N = 1 | ~20 EC sur objet à puits non nul, relevé avant/après |
| Anomalie A2 (affichage net vs gain plafonné) | `INCONNU`, N = 1, lecture retenue | Une tentative à reliquat nul avant ET après dont le poids perdu ≠ poids de la rune |
| Anomalie A3 | **lecture non fiable** | Revue de la vidéo : horodatage confondu avec A2 |
| Pentes de tous les facteurs v1.27 | `INCONNU`, à 0 | Dataset avec N documenté, un facteur à la fois |
| Taux des potions | `CONTRADICTION` | Dégâts avant/après, deux paliers, deux armes |
