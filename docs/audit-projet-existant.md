# Audit du projet existant — Simulateur de Forgemagie DOFUS 3

- **Date** : 2026-09-05
- **Périmètre** : dépôt `SiteForgemagie` à l'état du commit `5e02ed4` + fichiers non suivis (`CLAUDE.md`, `docs/knowledge/`).
- **Méthode** : lecture intégrale de `CLAUDE.md`, des trois documents de `docs/knowledge/`, de `docs/plans/`, du `README.md`, de la configuration et de la totalité de `src/` ; exécution de `tsc -b`, `vite build` (vers un dossier temporaire), `vitest run`, `eslint .` ; sondage en lecture seule de l'API DofusDB pour vérifier les identifiants d'effets réellement utilisés par le code. Aucun fichier du projet n'a été modifié en dehors de ce rapport.
- **Statuts épistémiques** : ceux de `CLAUDE.md` (`SOURCE PRIMAIRE`, `MODÈLE EMPIRIQUE`, `HYPOTHÈSE COMMUNAUTAIRE`, `CONTRADICTION`, `INCONNU`). Les lettres A→E citées entre parenthèses renvoient aux grilles de confiance de `docs/knowledge/`.

---

## 0. Résumé exécutif

1. **La coquille technique est saine** : le projet compile, se construit et ses 35 tests passent. Un seul avertissement ESLint.
2. **La couche données est cassée** : sur les 43 identifiants d'effets DofusDB codés dans `effectMapping.ts`, **19 sont faux** (ils pointent vers un autre effet, un malus, ou un effet inexistant). Tous les dommages élémentaires, les % dommages/résistances catégoriels, Tacle/Fuite/Initiative, Retrait PA/PM et les Dommages/Coups critiques sont mal câblés. Un item réel chargé depuis l'API affiche donc des lignes erronées ou en oublie.
3. **La couche moteur est un modèle inventé** : les probabilités SC/SN/EC (formule linéaire sur le ratio puits/rune), le recul en EC (50 % du poids de la rune), la loi de sélection de la ligne perdue et l'absorption nulle du puits n'ont aucune source et contredisent sur plusieurs points `docs/knowledge/` (borne primaire SC ≥ 15 %, puits consommé en priorité). Rien n'est paramétrable, tout est en dur.
4. **Le « puits » du code n'est pas le reliquat serveur** : c'est un calculateur de planification (« combien de poids je libère si je sacrifie telle ligne »). C'est un outil utile, mais il ne correspond pas au pipeline `Calcul du reliquat → Application → Sélection des pertes → MAJ reliquat` imposé par `CLAUDE.md`.
5. **Verdict** : ni reset total ni refonte légère. **Refonte structurante** : on garde l'outillage, la coquille UI et quelques briques génériques (≈ 40 % du code), on jette et on réécrit les données, le moteur et le guide théorique (≈ 60 %). Détail en §6.

---

## 1. Stack, structure, dépendances, build

### 1.1 Stack

| Élément | Version installée | Remarque |
|---|---|---|
| Node / npm | 22.14.0 / 11.2.0 | |
| React / ReactDOM | 19.2.4 | SPA sans routeur, navigation par `useState` |
| TypeScript | 5.9.3 | `strict`, `noUnusedLocals`, `verbatimModuleSyntax` |
| Vite | 7.3.1 | plugin React + `@tailwindcss/vite` |
| Tailwind CSS | 4.2.1 | thème custom dans `src/index.css` |
| Vitest | 4.0.18 | 2 fichiers de tests |
| ESLint | 9.39.3 | config flat, `typescript-eslint` 8.56.1 |

Aucune dépendance de production hors React. Pas de bibliothèque d'état, de validation, de fetch, de persistance. `node_modules` présent (148 paquets), `package-lock.json` versionné.

### 1.2 Structure

```
.
├── CLAUDE.md                     (non suivi par git)
├── README.md                     (boilerplate Vite intact, ne décrit pas le projet)
├── .claude/launch.json           (serveur dev Vite 127.0.0.1:5173)
├── .claude/settings.local.json   (COMMITTÉ — liste d'autorisations d'outils, cf. §1.5)
├── dist/                         (build du 2026-03-03, obsolète, ignoré par git)
├── docs/
│   ├── knowledge/                (3 rapports .md, non suivis par git)
│   └── plans/                    (1 design de 20 lignes daté 2026-03-02)
└── src/                          (3 565 lignes .ts/.tsx)
    ├── types/index.ts            150 l.  — types DofusDB, SimulatedStat, PoolResult, actions
    ├── data/effectMapping.ts     437 l.  — effectId → nom / poids / valeurs de runes
    ├── data/statCaps.ts          417 l.  — caps « règle des 101 » par stat
    ├── logic/poolCalculator.ts   169 l.  — calcul du puits de planification
    ├── logic/runeSimulator.ts    303 l.  — moteur SC/SN/EC + recul
    ├── logic/statsReducer.ts     144 l.  — reducer avec undo/redo
    ├── hooks/useItemSearch.ts    126 l.  — recherche DofusDB + mapping effets
    ├── hooks/useSimulation.ts    112 l.  — façade du reducer
    ├── components/ (9 fichiers)  1 202 l. — UI, dont TheoryGuide.tsx (381 l.)
    └── __tests__/ (2 fichiers)   335 l.  — 35 tests
```

### 1.3 Est-ce que ça build / lance ?

| Commande | Résultat |
|---|---|
| `npx tsc -b` | OK, 0 erreur |
| `npx vite build` | OK, 45 modules, `index.js` 248 kB (75 kB gzip), `index.css` 27,7 kB |
| `npx vitest run` | OK, 35/35 tests, 320 ms |
| `npx eslint .` | **1 erreur** : `_pEC` déclaré et inutilisé dans [runeSimulator.ts:84](../src/logic/runeSimulator.ts:84) |
| Serveur dev | `.claude/launch.json` valide ; non lancé pendant l'audit (pas nécessaire) |

Le dossier `dist/` date du 2026-03-03 et ne contient donc pas la correction du commit `5e02ed4` (2026-09-05). Il est ignoré par git, ce n'est pas un problème, mais il ne faut pas s'y fier.

### 1.4 Historique git

| Commit | Date | Contenu |
|---|---|---|
| `f534b80` | 2026-03-03 | Initialisation : 36 fichiers, 8 119 lignes (dont 4 238 de lockfile) |
| `5e02ed4` | 2026-09-05 | Poids des dommages élémentaires 20 → 5 ; clamp `getStatAbsoluteMax` dans le simulateur, le reducer et l'UI ; commentaires « modèle simplifié » ajoutés |

`CLAUDE.md` et `docs/knowledge/` sont **non suivis** : l'état intellectuel du projet n'est pas versionné.

### 1.5 Incohérences de configuration et de documentation

- Les fichiers de `docs/knowledge/` portaient des noms avec espaces et parenthèses différents de ceux cités dans `CLAUDE.md` (corrigé en phase 0 par renommage).
- `CLAUDE.md` liste `docs/knowledge/Algorithme_Forgemagie_DOFUS_3.pdf` parmi les documents à lire : **le PDF n'est pas dans le dépôt**. Seuls ses audits y sont.
- `empirical_params.json`, `docs/archive/`, le panneau « Paramètres avancés » et l'import/export de profils exigés par `CLAUDE.md` n'existent pas.
- `.claude/settings.local.json` est committé alors que la convention (et `.gitignore` via `*.local`) vise à ne pas versionner les fichiers locaux ; le motif `*.local` ne couvre pas `*.local.json`. Le fichier ne contient que des autorisations d'outils (domaines DofusDB, dofus.com, wikis, `npm`, `npx`), rien de secret, mais il n'a rien à faire dans l'historique.
- `README.md` est le gabarit Vite d'origine.

---

## 2. Ce que le code fait réellement

### 2.1 Types (`src/types/index.ts`)

- `DofusDBEffect { effectId, from, to, characteristic }`, `DofusDBItem`, `DofusDBResponse` : sous-ensemble du schéma DofusDB.
- `SimulatedStat { effectId, statName, baseMin, baseMax, currentValue, weightPerPoint, isExo, isForgemeable }` : une ligne de stat. Il n'y a **pas** de notion de reliquat, de malus, de ligne « verrouillée » (transcendance), ni de version de jeu.
- `PoolResult` : sortie du calcul de puits (poids base/actuel, gagné/dépensé/restant, poids max théorique, qualité %, proba du jet, poids over/exo, budget 101 restant).
- `SimLogEntry`, `SimulationResult`, `SimulationState`, `SimulationAction` : journal et état du reducer.

### 2.2 Données (`src/data/`)

**`EFFECT_MAPPING`** ([effectMapping.ts](../src/data/effectMapping.ts)) : 43 entrées `effectId → { statName, weightPerPoint, isForgemeable, runeNormal, runePa, runeRa }`. Commentaire d'en-tête : « Sources : Poids officiels de la forgemagie Dofus » sans lien ni version. Voir §3.1 pour la vérification des identifiants (19 faux).

**`ITEM_TYPE_NAMES`** : 20 `typeId → libellé FR` écrits à la main. L'API renvoie déjà `type.name.fr` dans la réponse, la table est redondante et incomplète (ex. `typeId 47` « Griffe/Bec » non couvert).

**`COMMON_EXO_STATS`** : 10 stats proposées en exo (PA, PM, PO, Invocations, % dommages ×4, % résistances ×2). Les 6 derniers effectIds sont faux (§3.1).

**`STAT_CAPS`** ([statCaps.ts](../src/data/statCaps.ts)) : 43 entrées `effectId → { weightPerPoint, maxOverOrExo = floor(101 / poids), absoluteMax?, hardCapOne?, category, note }`. Duplique `weightPerPoint` de `EFFECT_MAPPING` (deux sources de vérité pour le même nombre). `getStatAbsoluteMax(stat)` renvoie `absoluteMax` si défini (PA/PM/PO = 1, Invocations = 3), sinon `maxOverOrExo` pour un exo, sinon `baseMax + maxOverOrExo`.

### 2.3 Logique de puits (`src/logic/poolCalculator.ts`)

- **`computeItemPool(stats)`** : pour chaque ligne forgeable, `baseWeight += baseMax × w`, `currentWeight += current × w`. Si `current < baseMax` → `poolGained += (baseMax − current) × w` ; si `current > baseMax` → `poolSpent += (current − baseMax) × w` (compté aussi en `overWeight`). Exo : tout le poids va en `poolSpent`/`exoWeight`. `poolRemaining = poolGained − poolSpent` (**peut être négatif**). Calcule aussi `maxTheoreticalWeight` (jet parfait + max over de chaque ligne), `qualityPercent = currentWeight / poids du jet parfait`, `overExoBudgetRemaining = 101 − (over + exo)` (calculé mais **plus affiché nulle part** depuis le commit 2).
- **`computeRollProbability(stats)`** : produit sur les lignes naturelles de `(baseMax − current + 1) / (baseMax − baseMin + 1)`. Hypothèse : jet de craft uniforme et indépendant par ligne. Hors périmètre FM serveur.
- **`getStatStatus`** : `exo | over | sacrificed | perfect | normal`.
- **`computeMaxReachable(stat, poolRemaining)`** : `min(current + floor(pool / w), cap par ligne)`.

**Ce que « puits » signifie ici** : une réserve de planification dérivée de l'état visible (`Σ poids retiré − Σ poids ajouté`). Ce n'est pas le reliquat serveur décrit dans `docs/knowledge/` (créé par un SN/EC à hauteur de `perte − rune`, consommé en priorité, jamais négatif, invisible). Les deux notions sont utiles mais distinctes ; le code les confond dans le nom, dans l'UI (« Puits de Forgemagie ») et dans le moteur (§2.4).

### 2.4 Moteur de simulation (`src/logic/runeSimulator.ts`)

- **`computeOutcomeProbabilities(poolRemaining, runeWeight, isExoAttempt)`** :
  - `runeWeight ≤ 0` → SC 100 %.
  - `isExoAttempt && runeWeight ≥ 30` → SC 1 %, SN 0 %, EC 99 %.
  - sinon `ratio = pool / runeWeight` ; si `ratio ≥ 0` : `pSC = min(50 + 5·ratio, 90) %`, `pEC = max(5 − 0,5·ratio, 1) %` ; si `ratio < 0` : `pSC = max(50 + 5·ratio, 5) %`, `pEC = min(10 − 3·ratio, 50) %` ; `pSN = 1 − pSC − pEC`.
- **`rollOutcome(pSC, pSN, _pEC)`** : tirage `Math.random()` (le paramètre `_pEC` est ignoré → erreur ESLint).
- **`pickRecoilTarget(stats, excludeId)`** : candidats = lignes forgeables ≠ cible avec `current > 0` ; si des lignes over/exo existent, on ne tire que parmi elles ; tirage pondéré par `current × w` (« masse magique »).
- **`applyRecoil(stats, victimId, weightToLose)`** : `pointsLost = min(ceil(weightToLose / w_victime), current)`.
- **`getRuneValue(effectId, tier)`** : `runeNormal | runePa | runeRa` avec repli sur le palier inférieur.
- **`simulateRune(stats, targetId, tier, logId)`** : calcule le puits **avant** l'action, tire l'issue, puis : SC → `+runeValue` (clampé au cap) ; SN → `+runeValue` puis recul de `runeWeight` sur une victime ; EC → recul de `0,5 × runeWeight` sur une victime, rune non appliquée. Le puits n'absorbe jamais rien : **toute perte touche une ligne visible**, même avec un puits positif. Journalise l'issue et `poolAfter`.

Effets de bord notables du modèle :

- Avec un exo PA présent, tout SN ou EC sur une autre ligne cible d'abord les over/exo ; comme `ceil(runeWeight / 100) = 1` pour n'importe quelle rune de poids ≥ 0,2, **une rune Vi qui passe en SN fait sauter le PA entier**. Aucune source ne décrit ce comportement.
- SN avec puits positif : `docs/knowledge/` (B) dit que le puits absorbe la perte ; le code fait perdre une ligne visible.
- `pSC` peut descendre à 5 % en FM normale, alors que le tutoriel Ankama (`SOURCE PRIMAIRE`) fixe le plancher à 15 %.

### 2.5 Reducer et hooks

- **`simulationReducer`** ([statsReducer.ts](../src/logic/statsReducer.ts)) : `SET_ITEM`, `UPDATE_STAT` (clamp `[0, getStatAbsoluteMax]`), `ADD_EXO` (refus si effectId déjà présent), `REMOVE_EXO`, `RESET_TO_PERFECT`, `UNDO`/`REDO` (pile de 100), `TOGGLE_MODE` (vide le log en passant en simulation), `APPLY_RUNE` (re-clamp de sécurité), `CLEAR_LOG`. Générique et propre.
- **`useItemSearch`** ([useItemSearch.ts](../src/hooks/useItemSearch.ts)) : `GET https://api.dofusdb.fr/items?slug.fr[$search]=…&$limit=25&$sort[level]=-1`, debounce 300 ms, `AbortController`, filtre les items sans `effects`. **`mapEffectsToStats`** : ignore les effectIds absents du mapping, ignore les effets dont `from < 0 && to < 0`, puis `baseMin = min(|from|, |to|)`, `baseMax = max(|from|, |to|)`, `currentValue = baseMax`.
- **`useSimulation`** : façade `useReducer` + `useMemo(computeItemPool)`.

### 2.6 UI (`src/components/`, `src/App.tsx`)

- `Header` : deux onglets (Simulateur / Guide Théorique).
- `ItemSelector` : champ de recherche + liste déroulante.
- `ActionBar` : bascule planning/simulation, undo, redo, « Jet parfait », « Sauvegarder ».
- `PoolSummary` : 5 cartes (poids base, actuel, puits gagné/utilisé/restant), barre d'utilisation, message « Puits négatif → les runes auront moins de chances de passer », poids max, qualité, proba du jet.
- `StatsSimulator` / `StatRow` : en planning, stepper + boutons `+valeur rune` clampés par `computeMaxReachable` ; en simulation, boutons par palier de rune avec le `% SC` du modèle inventé affiché en couleur.
- `ExoAdder` : menu des 10 exos « courants ».
- `SimulationLog` : journal, compteurs SC/SN/EC, « taux de réussite ».
- `TheoryGuide` : ~380 lignes de texte pédagogique (règle des 101 par ligne, over vs exo, puits, tables de poids/caps, « règles importantes »). Voir §3.3 pour les affirmations non sourcées.
- `App` : raccourcis Ctrl+Z/Y ; **`handleSave` écrit dans `localStorage` mais aucun code ne relit jamais ces clés** (fonctionnalité morte).

---

## 3. Inventaire des valeurs et formules codées en dur

Convention : « statut » = ce que la valeur devrait porter selon `CLAUDE.md` ; « présenté comme » = ce que le code ou l'UI affirme. Le symbole ⚠ signale une contradiction avec `docs/knowledge/`.

### 3.1 Identifiants d'effets DofusDB (`effectMapping.ts`, `statCaps.ts`, `COMMON_EXO_STATS`)

Vérification effectuée le 2026-09-05 contre `GET https://api.dofusdb.fr/effects` (données DofusDB, version de jeu annoncée par `GET /version` : **3.6.10.11**). Statut de la vérification : `SOURCE PRIMAIRE` au sens « données extraites du client par un tiers » (donnée dataminée, non officielle).

| effectId | Ce que le code croit | Ce que DofusDB dit | Verdict |
|---|---|---|---|
| 111, 112, 117, 118, 119, 123, 124, 125, 126, 128, 138, 158, 160, 161, 176, 178, 182, 210–214, 220, 240–244 | PA, Dommages, PO, Force, Agi, Chance, Sagesse, Vita, Int, PM, Puissance, Pods, Esquive PA/PM, Prospection, Soins, Invocations, % Rés élém., Renvoi, Rés fixes | idem | **24 corrects** |
| 114 | Dommages Terre | **n'existe pas** | ✗ |
| 115 | Dommages Critiques (poids 5) | **% Critique** (charac 18) | ✗ mauvais libellé, mauvais poids (docs : CC = 10) |
| 116 | Dommages Neutre | **− Portée** (malus) | ✗ un item avec −1 PO afficherait « +1 Dommages Neutre » |
| 120 | Dommages Eau | Rembourse PA (effet de sort) | ✗ |
| 122 | Dommages Air | Échecs critiques (malus) | ✗ |
| 136 | Dommages Feu | + Portée (lanceur, effet de sort) | ✗ |
| 162, 163 | Retrait PA, Retrait PM | **− Esquive PA/PM** (malus) | ✗ (vrais ids : 410, 412) |
| 173 | Tacle | − Réduction physique | ✗ (vrai id : 753) |
| 174 | Fuite | **Initiative** | ✗ (vrai id Fuite : 752) |
| 184 | Initiative | + Réduction physique | ✗ (vrai id : 174) |
| 750, 751 | % Dommages Sorts, % Dommages Armes | % capture, % XP monture | ✗ (vrais ids : 2812, 2808) |
| 752, 753 | % Dommages Distance, % Dommages Mêlée | **Fuite, Tacle** | ✗ (vrais ids : 2804, 2800) |
| 754, 755 | % Résistance Distance, % Résistance Mêlée | − Fuite, − Tacle | ✗ (vrais ids : 2807, 2803) |

Identifiants réels **absents** du mapping alors que les runes correspondantes existent : 422/424/426/428/430 (Dommages Terre/Feu/Eau/Air/Neutre), 418 (Dommages critiques), 420 (Résistance critiques), 414 (Dommages poussée), 416 (Résistance poussée), 410/412 (Retrait PA/PM), 752/753 (Fuite/Tacle), 174 (Initiative), 2800–2815 (% dommages/résistances mêlée/distance/armes/sorts), 225/226 (pièges), 795 (arme de chasse).

Conséquence vérifiée sur un item réel : l'Amulette du Strigide renvoie `[125, 124, 138, 115, 111, 210, 212, 753, 160, 418, 421]`. Le code affiche sa ligne 115 (4–6 % Critique) comme « Dommages Critiques » à 5 de poids, sa ligne 753 (11–15 Tacle) comme « % Dommages Mêlée » à 15 de poids, et ignore la ligne 418 (16–25 Dommages critiques). Le puits calculé est donc faux sur cet item.

Cause probable : les ids ont été écrits de mémoire ou depuis une table Dofus 1.29/Touch. L'API fournit un champ `characteristic` (stable, indépendant du signe bonus/malus) que le type `DofusDBEffect` déclare mais que le code n'exploite jamais.

### 3.2 Poids unitaires (densité) — `effectMapping.ts` et `statCaps.ts` (dupliqués)

Le commentaire d'en-tête dit « Poids officiels » ; aucun lien. `CLAUDE.md` classe la densité comme `SOURCE PRIMAIRE` **à réextraire** ; en l'état, la table du code est une `HYPOTHÈSE COMMUNAUTAIRE` non tracée.

| Stat | Code | `docs/knowledge/` | Statut réel | Note |
|---|---|---|---|---|
| Vitalité | 0,2 | 0,2 (0,25 débattu), B | `HYPOTHÈSE COMMUNAUTAIRE` | convention « 5 vita = 1 » |
| Force/Int/Agi/Chance | 1 | 1, B | idem | |
| Sagesse, Prospection | 3 | 3, B | idem | |
| Puissance | 2 | 2, B | idem | |
| PA / PM / PO | 100 / 90 / 51 | idem, B forte | idem | |
| Invocations | 30 | 30, B | idem | |
| Dommages (112) | 20 | 20, B | idem | |
| Dommages élémentaires | 5 | 5, B | idem | corrigé au commit 2, mais sur de **faux ids** |
| « Dommages Critiques » (115) | 5 | id 115 = % Critique → **10** (changelog 2.29) | ⚠ `CONTRADICTION` | vrais Dommages critiques (418) : docs 5 |
| Soins | 10 | 10, C-B | `HYPOTHÈSE COMMUNAUTAIRE` | |
| % Dommages catégoriels | 15 | 15, C | idem | ids faux |
| % Résistance élémentaire | 6 | 6, B | idem | |
| « % Résistance Distance/Mêlée » (754/755) | 6 | catégoriels = **15**, C | ⚠ `CONTRADICTION` | ids faux en plus |
| Résistances fixes | 2 | 2, « tables divergentes » | idem | |
| Tacle / Fuite | 4 | « 4 ou 5 selon sources » | ⚠ `CONTRADICTION` non tranchée | ids faux |
| Esquive / Retrait | 7 | 7, B | idem | Retrait sur ids faux |
| Initiative | 0,1 | 0,1, B | idem | id faux |
| Pods | 0,25 / pod | audit : 0,25/pt ; reconstruction : « 2,5 par pod » | ⚠ `CONTRADICTION` **entre les deux docs** | code cohérent avec le doc « audit » |
| Renvoi de dommages (220) | 10 | DofusDB affiche « Densité 15 » pour Rune Pa Do Ren (+3) → **5 / pt** | ⚠ `CONTRADICTION` | |
| Dommages poussée, Rés. crit/poussée, pièges, chasse | absents | 5 / 2 / 5 / 5 | — | à ajouter |

Valeurs de runes (`runeNormal / runePa / runeRa` = 1/3/10, Vita 5/15/50, Ini et Pods 10/30/100) : cohérentes avec `docs/knowledge/` (B), mais l'existence réelle d'un palier Ra pour chaque stat (ex. Ra pour % résistance, Ra pour esquive) n'a pas été vérifiée contre les 105 runes `typeId = 78` de DofusDB.

### 3.3 Règles et formules

| # | Valeur / formule | Emplacement | Présenté comme | Statut réel | Contradiction avec `docs/knowledge/` |
|---|---|---|---|---|---|
| R1 | Règle des 101 **par ligne**, `maxOverOrExo = floor(101 / w)` | `statCaps.ts`, `poolCalculator.ts:15`, `TheoryGuide` | « Règle fondamentale », « CORRECTION IMPORTANTE » (notes de la session précédente) | `HYPOTHÈSE COMMUNAUTAIRE` | ⚠ Existence d'une borne 101 : B. Nature **globale vs par ligne** : C-D dans l'audit, « globale over+exo » dans le rapport de reconstruction. Les deux docs se contredisent ; le code tranche sans preuve et l'UI le présente comme certain. |
| R2 | PA/PM/PO : `absoluteMax = 1`, `hardCapOne` ; Invocations `absoluteMax = 3` | `statCaps.ts:55-97` | fait | dérivé de R1 | « PO fixé à 51 délibérément par Ankama » : aucune source primaire, affirmé dans l'UI (`TheoryGuide`, `statCaps` note). |
| R3 | Caps dérivés : Vita 505, Sagesse 33, % Rés 16, Ini 1010, Pods 404, Tacle 25, etc. | `statCaps.ts` | faits | arithmétique sur R1 | Les docs précisent que ce sont des plafonds arithmétiques, « pas toujours des limites de gameplay ». |
| R4 | `pSC = 50 + 5·ratio` (cap 90 %, plancher 5 %), `pEC = 5 − 0,5·ratio` / `10 − 3·ratio` (cap 50 %) | `runeSimulator.ts:56-78` | « approximation plausible » (commentaire), mais affiché en `% SC` coloré dans l'UI sans avertissement | `INCONNU` (formule inventée) | ⚠ Plancher SC 15 % en FM normale = `SOURCE PRIMAIRE` ; le code descend à 5 %. ⚠ Les docs classent « puits sans influence sur la probabilité » comme hypothèse forte ; le code fait l'inverse. Pas de dépendance au niveau de l'objet ni à la proximité du jet max, seuls facteurs cités par Ankama. |
| R5 | Exo lourd : `runeWeight ≥ 30` → 1 / 0 / 99 | `runeSimulator.ts:30,52` | « Cas spécial CONFIRMÉ » | 1 % pour exo PA/PM/PO = `SOURCE PRIMAIRE` (« peut descendre jusqu'à 1 % ») ; partage 0/99 = `HYPOTHÈSE COMMUNAUTAIRE` ; seuil 30 et inclusion des Invocations = `INCONNU` | ⚠ Les docs ne documentent que PA/PM/PO ; Huzounet évoque un seuil ≈ 20 ; « poids > 50 » est réfuté. Le mot « CONFIRMÉ » est abusif. |
| R6 | Sélection de la victime : over/exo d'abord, puis tirage ∝ `valeur × poids` | `runeSimulator.ts:100-134` | « Priorité réaliste Dofus » | priorité over/exo = `HYPOTHÈSE COMMUNAUTAIRE` (forte) ; pondération = modèle C parmi A/B/C/D, `INCONNU` | ⚠ `CLAUDE.md` exige des stratégies interchangeables ; le code fige un seul modèle. Le puits n'est jamais consommé avant les lignes naturelles (docs : ordre over/exo → puits → naturelles). |
| R7 | EC : perte = `0,5 × runeWeight` | `runeSimulator.ts:270` | « modèle simplifié » | `INCONNU` (inventé, admis en commentaire) | Aucune source ; les docs ne quantifient pas la perte en EC. |
| R8 | Recul arrondi `ceil(poids / w_victime)` | `runeSimulator.ts:157-161` | implicite | `INCONNU` | Produit l'effet « une rune Vi fait sauter un PA » (§2.4). |
| R9 | Le puits n'absorbe jamais une perte | `applyRecoil`, `simulateRune` | « point débattu » (commentaire) | ⚠ `CONTRADICTION` avec docs (B : puits consommé en priorité) | |
| R10 | Puits = `Σ(baseMax − current)·w − Σ over/exo`, peut être négatif | `poolCalculator.ts:22-93` | « Puits de Forgemagie » | modèle de **planification**, pas le reliquat | Le reliquat serveur est `perte − rune`, jamais négatif, créé par SN/EC. Deux concepts sous un seul nom. |
| R11 | Puits purgé « si l'item est échangé, vendu ou remis en stockage » | `TheoryGuide.tsx:283` | fait | `CONTRADICTION` (audit : D ; reconstruction : B ; `CLAUDE.md` : hypothèse à confirmer) | Présenté sans réserve. |
| R12 | Proba du jet : uniforme indépendante par ligne | `poolCalculator.ts:102-119` | fait | `INCONNU` (loi de craft non documentée) ; hors périmètre FM | Faussée en plus par le bug `to = 0` (§3.4). |
| R13 | « Une rune normale = 1 poids, Pa = 3, Ra = 10 » | `TheoryGuide.tsx:292` | fait | **faux** en général (Ra Sa = 30, Ra Do = 200, Ra Vi = 10) | Confusion valeur / poids. |
| R14 | « Ces valeurs proviennent de milliers de tests communautaires » | `TheoryGuide.tsx:139-141` | fait | non sourcé | Les docs n'ont retrouvé **aucun** dataset public reproductible. |
| R15 | Transcendance : « requiert 0 over/exo » | `TheoryGuide.tsx` | fait | `HYPOTHÈSE COMMUNAUTAIRE` (wiki) ; le verrou de l'objet est `SOURCE PRIMAIRE` (devblog **2.58**, pas 2.72 — voir `docs/knowledge/errata.md`) | Incomplet : verrouillage de l'objet (FM + orbes) et plafond non mentionnés. |
| R16 | « Impossible d'avoir 2 lignes de la même stat » | `TheoryGuide.tsx:366` | fait | `HYPOTHÈSE COMMUNAUTAIRE` | Plausible, non sourcé. |
| R17 | Potions, orbes régénérants, brisage, malus (÷2), reliquat fractionnaire | — | — | **absents** | Modules exigés par `CLAUDE.md`. |

### 3.4 Bugs et défauts non liés au statut épistémique

| # | Défaut | Emplacement | Effet |
|---|---|---|---|
| B1 | Effets à valeur fixe : DofusDB renvoie `to = 0` (ex. PA `[111, 1, 0]`, runes `[118, 1, 0]`). Le code fait `baseMin = min(1, 0) = 0`. | `useItemSearch.ts:110-111` | Un PA natif est affiché « Base : 0–1 » ; `computeRollProbability` lui applique un facteur 0,5 ; le stepper permet de « sacrifier » le PA pour +100 de puits (peut être voulu, mais l'intervalle est faux). |
| B2 | Filtrage des malus par le signe des valeurs | `useItemSearch.ts:108` | Les malus DofusDB à valeurs positives et `bonusType = −1` (ex. 116 « −Portée », 162 « −Esquive PA ») passent le filtre et sont **mappés en bonus** via les ids faux de §3.1. |
| B3 | Le champ `characteristic` est typé mais jamais lu | `types/index.ts:6` | La clé stable de DofusDB est ignorée au profit d'`effectId`. |
| B4 | `handleSave` écrit `localStorage`, rien ne relit | `App.tsx:55-62` | Fonction morte ; `alert()` bloquant. |
| B5 | `overExoBudgetRemaining` calculé, plus affiché | `poolCalculator.ts:102` | Vestige du modèle « 101 global » abandonné au commit 2. |
| B6 | `_pEC` inutilisé | `runeSimulator.ts:84` | Erreur ESLint, `npm run lint` échoue. |
| B7 | Les tests appellent `effectId 126` « Sagesse » (c'est Intelligence ; Sagesse = 124) | `runeSimulator.test.ts:67,131` | Sans effet sur le résultat, révélateur d'ids écrits de mémoire. |
| B8 | `weightPerPoint` dupliqué dans `EFFECT_MAPPING` et `STAT_CAPS` | `data/` | Deux sources de vérité ; le commit 2 a corrigé l'une sans que rien ne garantisse la cohérence de l'autre. |
| B9 | Les 35 tests vérifient le **modèle inventé** (« SC plafonne à 90 % », « EC plafonne à 50 % », « puits plus haut → SC plus haut ») | `__tests__/` | Ils figent des hypothèses comme des spécifications. Aucun test sur brisage, transcendance, reliquat (exigés par `CLAUDE.md`). |

---

## 4. Provenance des données

### 4.1 Items

- **Source** : appel HTTP direct à `https://api.dofusdb.fr/items` **à chaque recherche**, côté navigateur. Aucun instantané local, aucune version figée, aucune date d'extraction, aucun cache.
- **Version observable** : `GET /version` renvoie `"3.6.10.11"` ; les items sondés ont `updatedAt = 2026-06-23`. Le code n'enregistre ni l'une ni l'autre.
- **Champs consommés** : `id`, `name.fr`, `level`, `typeId`, `imgUrl` (n'existe pas dans la réponse) puis repli sur `img` (existe), `effects[].effectId/from/to`. **Ignorés** : `characteristic`, `category`, `elementId`, `possibleEffects`, `type.name`, `realWeight`, `criterions`, `enhanceable`.
- **`realWeight` / `weight`** : DofusDB ne renvoie que `realWeight` (10 pour un Gelano, 1 pour une rune) ; il n'est pas utilisé par le code, ce qui est correct (ce n'est pas la densité FM). Aucun champ de densité FM n'existe sur `/items`, `/effects` ni `/characteristics` : la « Densité 15 » affichée sur le site DofusDB provient d'une autre source (calcul du site ou données client) à identifier.

### 4.2 Runes

- Il n'y a **pas de dataset runes**. Les valeurs (+1 / +3 / +10…) et les poids sont écrits à la main dans `EFFECT_MAPPING`. DofusDB expose 105 runes (`typeId = 78`, ex. 1519 Rune Fo `[118, 1, 0]`) qui ne sont jamais interrogées.

### 4.3 Potions, orbes, runes de transcendance

- Absents du code et des données.

### 4.4 Tables statiques

| Table | Fichier | Source déclarée | Source réelle | Version / date |
|---|---|---|---|---|
| `EFFECT_MAPPING` | `effectMapping.ts` | « Poids officiels de la forgemagie Dofus » | aucune URL ; ids partiellement 1.29/Touch | aucune |
| `STAT_CAPS` | `statCaps.ts` | « guides communautaires, tests empiriques Dofus 2.x/Unity » | aucune URL | aucune |
| `ITEM_TYPE_NAMES` | `effectMapping.ts` | — | mémoire | aucune |
| `COMMON_EXO_STATS` | `effectMapping.ts` | — | mémoire | aucune |

Aucune de ces tables ne satisfait l'exigence de `CLAUDE.md` : « dataset figé localement, versionné, avec la version du jeu et la date d'extraction, chaque champ documenté avec sa provenance ».

---

## 5. Écarts entre `docs/plans/` et l'architecture imposée par `CLAUDE.md`

Le seul plan existant, [2026-03-02-simulation-proba-maxweight-design.md](plans/2026-03-02-simulation-proba-maxweight-design.md), fait 20 lignes et décrit trois fonctionnalités UI. Ce n'est pas un plan d'architecture.

| Exigence `CLAUDE.md` | Plan existant | Code existant |
|---|---|---|
| Pipeline `Item → État → Poids → Reliquat → Action rune → SC/SN/EC → Application → Sélection pertes → MAJ reliquat → MAJ objet` | absent | partiel et désordonné : le « reliquat » est recalculé depuis l'état visible, jamais mis à jour comme état propre |
| Deux couches : règles certaines en dur + modèles empiriques dans `empirical_params.json` | absent ; le plan dit au contraire « taux basés sur ratio puits/poids rune » et « EC : perte 50 % » | tout en dur, y compris l'inventé |
| Chaque paramètre avec `value/status/source/note/bounds/default` | absent | absent |
| Panneau « Paramètres avancés », import/export de profils | absent | absent |
| Stratégies interchangeables (lois de sélection des pertes) | absent | un seul modèle figé |
| Statut épistémique explicite dans le code | absent | quelques commentaires « modèle simplifié » (commit 2), mais des « CONFIRMÉ », « Règle fondamentale », « Priorité réaliste Dofus » sans source |
| Dataset figé, versionné, provenance par champ | absent | appels live, tables manuelles |
| Modules potions / orbes / transcendance / brisage | absent | absent |
| Tests unitaires sur brisage, transcendance, reliquat | absent | tests sur le modèle inventé |
| `docs/knowledge/` et `empirical_params.json` cohérents | absent | `docs/knowledge/` non versionné, non relié au code |
| Ne pas mélanger 1.29 / Touch / 2.x / Unity | absent | ids d'effets probablement issus de tables anciennes |
| Identifiants de code en anglais | — | globalement respecté (`poidLigne`, `probaDisplay` en français) |
| Ne rien supprimer de `docs/`, archiver dans `docs/archive/` | — | rien à archiver encore ; dossier absent |

La feature 3 du plan (« Mode Simulation fidèle Dofus ») est en contradiction frontale avec la règle 3 de `CLAUDE.md` (« Ne jamais inventer une formule ») : elle prescrit d'inventer les taux. Le plan doit être archivé, pas amendé.

---

## 6. Verdict : reset ou refonte ?

### 6.1 Analyse

Répartition des 3 565 lignes :

| Couche | Lignes | État |
|---|---|---|
| UI (composants, App, CSS) | ≈ 1 250 | fonctionnelle, réutilisable après retouches de texte et de props |
| Hooks + reducer | ≈ 380 | génériques, réutilisables (undo/redo, recherche/debounce/abort) |
| Types | 150 | à étendre (reliquat, malus, verrou, version, statut) |
| Données | 854 | **à jeter** : 19 ids faux, poids dupliqués, aucune provenance |
| Logique FM | 616 | **à jeter** : probabilités, recul et sélection inventés ; le calcul de puits de planification est récupérable comme module distinct |
| Tests | 335 | à jeter : ils spécifient l'inventé |

Arguments contre un **reset sur feuille blanche** :

- La partie saine (outillage, coquille UI, reducer, client HTTP) représente plusieurs heures de travail sans valeur épistémique à protéger et sans dette : la réécrire n'apporterait rien.
- L'historique git, même court, documente l'évolution des hypothèses (le passage « 101 global → 101 par ligne » est visible dans le diff du commit 2). Il vaut mieux le garder que le perdre.

Arguments contre une **refonte légère** (corriger les ids, brancher `empirical_params.json` sur les formules existantes) :

- Les formules existantes n'ont aucune source : les paramétrer reviendrait à donner une façade scientifique à de l'inventé.
- La notion de puits doit être scindée (planification vs reliquat serveur) : c'est un changement de modèle de données, pas un réglage.
- La table de données doit être régénérée depuis DofusDB (clé `characteristic`), pas patchée à la main.

### 6.2 Décision recommandée

**Refonte structurante dans le dépôt actuel** : on conserve la coquille et on reconstruit le domaine (données, moteur, documentation) selon le pipeline de `CLAUDE.md`. Concrètement, cela ressemble à un reset du dossier `src/logic/`, `src/data/` et du guide théorique, pas du projet.

### 6.3 Ce qui est réutilisable

**Dans les deux scénarios (reset ou refonte)** :

- Outillage : `package.json`, `vite.config.ts`, `tsconfig.*`, `eslint.config.js`, `.claude/launch.json`, thème Tailwind de `src/index.css`.
- `useItemSearch` : debounce, `AbortController`, gestion d'erreur (la fonction `mapEffectsToStats` est à réécrire sur `characteristic`).
- `statsReducer` : mécanique undo/redo et structure d'actions (les actions FM changeront).
- `SimulationLog`, `Header`, `ActionBar`, `ItemSelector`, `PoolCard` : composants d'affichage sans logique métier.
- La convention de tests Vitest et les helpers `makeStat`.
- Les sondes API de cet audit (§3.1, §4) comme point de départ du script d'extraction du dataset.

**Uniquement en refonte** (dépend de la structure actuelle) :

- L'arborescence `src/{types,data,logic,hooks,components,__tests__}` et le découpage `App → hooks → reducer`.
- `computeItemPool` / `computeMaxReachable` / `getStatStatus` comme **module de planification** explicitement renommé et séparé du moteur serveur.
- `getRuneValue` et le concept `RuneTier`.
- Le squelette de `TheoryGuide` (sections, `RuleBox`, `CapsTable`) pour un guide réécrit depuis `docs/knowledge/` avec le statut de chaque affirmation.
- La forme de `STAT_CAPS` (catégorie, note, `absoluteMax`) si elle est régénérée depuis la table de poids et un paramètre `overCap` plutôt qu'écrite à la main.

**À jeter dans les deux cas** :

- `EFFECT_MAPPING` et `COMMON_EXO_STATS` (ids faux).
- `computeOutcomeProbabilities`, `pickRecoilTarget`, `applyRecoil`, `simulateRune` (modèles inventés, non paramétrables).
- `computeRollProbability` (hors périmètre, bug `to = 0`).
- Le texte de `TheoryGuide` et le message « Puits négatif » de `PoolSummary`.
- `docs/plans/2026-03-02-*.md` (à archiver dans `docs/archive/`, pas à supprimer).
- `README.md` (gabarit Vite).
- Les deux fichiers de tests actuels.

### 6.4 Points à trancher ensemble avant tout code

1. **Deux puits ou un seul ?** Garder un « calculateur de planification » (mode actuel, utile aux joueurs) à côté du moteur serveur (reliquat = perte − rune), ou ne garder que le moteur ?
2. **Règle des 101** : global vs par ligne est une `CONTRADICTION` entre les deux docs de `docs/knowledge/`. Proposition : paramètre `overCapScope: 'per_line' | 'global'` dans `empirical_params.json`, statut `CONTRADICTION`, défaut à choisir. Les notes de la session précédente qui présentaient « par ligne » comme une correction acquise doivent être requalifiées.
3. **Stratégie de données** : instantané JSON figé généré par script depuis DofusDB (clé `characteristic`, version `3.6.10.11`, date), ou appels live avec cache ? `CLAUDE.md` impose le premier.
4. **Exo lourd** : PA/PM/PO seulement (documenté) ou seuil de poids (Invocations incluses) ? À mettre en paramètre avec statut `INCONNU`.
5. **Ordre des chantiers** : données → reliquat/pertes (règles certaines + tests) → modèle probabiliste paramétrable → UI paramètres → potions/orbes/transcendance/brisage. À valider.
6. **Hygiène du dépôt** : versionner `CLAUDE.md` et `docs/knowledge/`, retirer `.claude/settings.local.json` de l'index, corriger `docs/plan/` → `docs/plans/` dans `CLAUDE.md`, décider du sort du PDF absent.

---

## Annexe A — Commandes exécutées

```bash
npx tsc -b --pretty false            # exit 0
npx vite build --outDir <scratchpad> # exit 0, 248 kB JS
npx vitest run --reporter=verbose    # 35/35
npx eslint .                         # 1 erreur (runeSimulator.ts:84)
```

Sondes API (lecture seule, 2026-09-05) :

```
GET https://api.dofusdb.fr/version                          → "3.6.10.11"
GET https://api.dofusdb.fr/items?slug.fr[$search]=gelano    → 2469 Gelano : effects [[111,1,0,1]]
GET https://api.dofusdb.fr/items?slug.fr[$search]=strigide  → 14094 Amulette du Strigide (11 effets, cf. §3.1)
GET https://api.dofusdb.fr/items/30942                      → Rune Pa Do Ren : realWeight 1, effects [[220,3,0,50]], aucun champ densité
GET https://api.dofusdb.fr/effects?id[$in][]=…              → table de correspondance §3.1
GET https://api.dofusdb.fr/effects?bonusType=1              → 78 effets bonus, liste des ids réels
GET https://api.dofusdb.fr/characteristics                  → 123 entrées, aucun champ poids/densité
GET https://api.dofusdb.fr/items?typeId=78                  → 105 runes
```

## Annexe B — Correspondance corrigée des identifiants (pour le futur dataset)

Extraite de `GET /effects?bonusType=1` (DofusDB, 3.6.10.11). La clé à retenir est `characteristic`.

| Stat | effectId bonus | characteristic |
|---|---|---|
| PA / PM / PO | 111 / 128 / 117 | 1 / 23 / 19 |
| Vitalité / Sagesse / Force / Int / Chance / Agi | 125 / 124 / 118 / 126 / 123 / 119 | 11 / 12 / 10 / 15 / 13 / 14 |
| Puissance / Puissance pièges / Puissance glyphes | 138 / 226 / 1166 | 25 / 69 / 106 |
| Dommages / Terre / Feu / Eau / Air / Neutre | 112 / 422 / 424 / 426 / 428 / 430 | 16 / 88 / 89 / 90 / 91 / 92 |
| Dommages critiques / poussée / pièges | 418 / 414 / 225 | 86 / 84 / 70 |
| % Critique | 115 | 18 |
| Soins / Renvoi / Invocations / Prospection / Pods / Initiative | 178 / 220 / 182 / 176 / 158 / 174 | 49 / 50 / 26 / 48 / 40 / 44 |
| Tacle / Fuite | 753 / 752 | 79 / 78 |
| Esquive PA / PM ; Retrait PA / PM | 160 / 161 ; 410 / 412 | 27 / 28 ; 82 / 83 |
| % Rés. Terre / Eau / Air / Feu / Neutre | 210 / 211 / 212 / 213 / 214 | 33 / 35 / 36 / 34 / 37 |
| Rés. fixes Terre / Eau / Air / Feu / Neutre | 240 / 241 / 242 / 243 / 244 | 54 / 56 / 57 / 55 / 58 |
| Rés. critiques / poussée | 420 / 416 | 87 / 85 |
| % Dommages mêlée / distance / armes / sorts | 2800 / 2804 / 2808 / 2812 | 125 / 120 / 122 / 123 |
| % Rés. mêlée / distance / armes / sorts | 2803 / 2807 / 2811 / 2815 | 124 / 121 / 142 / 141 |
| Arme de chasse | 795 | 0 |

Les malus correspondants portent un autre `effectId` (ex. 116, 162, 163, 421, 423, 754, 755) mais le **même** `characteristic`, avec `bonusType = -1`.
