# Données de référence — simulateur de forgemagie DOFUS

Généré le 2026-09-09. Tous les fichiers sont en UTF-8, sans BOM.
Ils sont conçus pour être chargés tels quels par un simulateur : `stats_weights.json` est la table
pivot, `runes.json` et `items_*.json` y renvoient via le champ **`stat_cle`**.

```
stats_weights.json   68 caractéristiques      table pivot (poids unitaire + overmax)
runes.json           105 runes Dofus 2/3 + 54 runes Rétro
items_retro.json     6 078 objets équipables Rétro 1.29/1.39
items_dofus2.json    3 465 objets équipables Dofus 2
```

---

## 1. `stats_weights.json`

Poids unitaire (poids par point de statistique) en **bonus** et en **malus**, plus le plafond d'over,
pour deux versions du jeu.

### Schéma
```jsonc
{ "_meta": { ... },
  "caracteristiques": [ {
    "cle":                          "vitalite",        // clé pivot
    "nom_fr":                       "Vitalité",
    "categorie":                    "primaire",        // primaire|secondaire|dommages|resistance|pa_pm_po|special
    "poids_unitaire_dofus2":        0.2,               // null = ligne inexistante / poids inconnu
    "poids_unitaire_retro":         0.25,
    "poids_unitaire_malus_dofus2":  0.2,               // poids sur un jet négatif
    "poids_unitaire_malus_retro":   0.2,
    "overmax_dofus2":               505,               // plafond d'over retenu
    "overmax_retro":                404,
    "overmax_theorique_dofus2":     505,               // floor(101 / poids_unitaire)
    "overmax_coherent_dofus2":      true,              // retenu == théorique ?
    "effet_id_retro":               125,               // id d'effet 1.29 (décimal)
    "caracteristique_id_dofusdb":   11,                // id de caractéristique DofusDB (Dofus 2/3)
    "sources":                      [ ... ],
    "conflit":                      "texte ou null"
  } ] }
```

### Formules
```
poids_ligne  = valeur_actuelle_de_la_stat × poids_unitaire
poids_rune   = valeur_ajoutée_par_la_rune × poids_unitaire
poids_objet  = Σ poids_ligne   (les lignes de dégâts d'arme sont EXCLUES, cf. §3)
overmax      = floor(101 / poids_unitaire)
```
En Rétro, les poids de rune sont **arrondis à l'entier supérieur** : Rune Vi = 3 × 0,25 = 0,75 → **1**.

### Provenance et fiabilité
| Source | Version | Fiabilité | Ce qu'elle apporte |
|---|---|---|---|
| `dmUtils/SmithMagic` — `src/enums/RuneWeightEnum.as` | Dofus 2 | 🔵 code de mod | **La seule source qui donne les poids de MALUS** (jets négatifs) |
| `StarLoco-Game` — `JobAction.getPwrPerEffet()` / `getOverPerEffet()` | Rétro 1.39 | 🔵 code d'émulateur | Poids ET overmax par effet, mutuellement cohérents |
| `Araknemu` — `data/constant/Effect.java` | Rétro 1.29 | 🔵 code d'émulateur documenté | Table complète id d'effet → nom → type |
| `lilgallon/dofus-tools` — `js/runes.js` | Dofus 2 | 🟡 table codée en dur | Poids affiché des 95 runes de l'encyclopédie |
| `api.dofusdb.fr` (`typeId=78`) | Dofus 3 | 🔵 données de jeu | id, nom, caractéristique et valeur des 105 runes |
| xixou.io, JeuxOnLine art. 235, forum Ankama (Schoup#6591), alterya | mixte | 🟠 communautaire | Recoupement, règles d'arrondi Rétro |

**38 des 68 caractéristiques portent un champ `conflit` non nul.** Les divergences les plus lourdes :

| Stat | Valeurs concurrentes | Retenu | Note |
|---|---|---|---|
| Vitalité | 0,20 (D2, Rune Vi = +5) / 0,25 (Rétro, Rune Vi = +3) | les deux, par version | overmax 505 vs 404 |
| Dommages Pièges | **15** (SmithMagic + StarLoco, over = 6) / 5 (lilgallon) | 15 | lilgallon capte « Pi » par heuristique de nom |
| % Coups Critiques | 10 (D2) / **30** (Rétro, over = 3) | par version | SmithMagic (mod D2) dit pourtant 30 |
| Soins | 10 (D2) / **20** (Rétro, over = 5) / 15 (xixou) | par version | non tranché entre 15 et 20 pour le Rétro |
| Renvoi de dommages | 10 / 30 / 3 | **10** | ⚠️ non résolu |
| Rune de chasse | −1 (lilgallon) / +5 (SmithMagic) | **−1** | ⚠️ non résolu |
| Portée | 51 / 50 (JOL) | 51 | |
| Fuite, Tacle | 4 / 5 (xixou Rétro) | 4 | pas de rune Fui/Tac en Rétro |

### Exceptions volontaires au calcul `floor(101/coef)`
Trois lignes ont un overmax **fixé par l'émulateur** et non calculé :
`echec_critique` = 0 (D2 et Rétro), `pm` = 0 et `portee` = 0 en Rétro
(→ **aucun over PM ni PO possible en 1.29**, alors que le PA autorise +1). Toutes les autres
lignes sont cohérentes avec la formule.

---

## 2. `runes.json`

Deux jeux séparés, car les runes **ne portent pas les mêmes valeurs** selon la version.

```jsonc
{ "_meta": { ... },
  "runes_dofus2": [ {                 // 105 runes
    "id": 1523, "nom": "Rune Vi", "categorie": "simple",   // simple | Pa (×3) | Ra (×10)
    "stat_id": 11,                    // id de caractéristique DofusDB
    "stat_nom": "Vitalité", "stat_cle": "vitalite",
    "valeur": 5,                      // points ajoutés par la rune
    "poids_unitaire": 0.2, "poids_unitaire_malus": 0.2,
    "poids_rune": 1.0,                // valeur × poids_unitaire
    "poids_rune_lilgallon": 1.0,      // poids affiché par dofus-tools, pour recoupement
    "overmax": 505, "sources": [...], "conflit": null } ],
  "runes_retro": [ {                  // 54 runes
    "id": 1523, "nom": "Rune Vi", "niveau": 10,
    "stat_id": 125,                   // id d'EFFET 1.29 (décimal)
    "valeur": 3,
    "poids_rune_theorique": 0.75, "poids_rune": 1,   // arrondi supérieur
    "overmax": 404, ... } ] }
```

### Provenance
- **Dofus 2/3** : `api.dofusdb.fr/items?typeId=78` (105 runes, id + nom FR + caractéristique + valeur),
  poids recalculé depuis `stats_weights.json`, puis **recoupé ligne à ligne** avec la table
  `lilgallon/dofus-tools` → **0 divergence** sur les 95 runes communes.
- **Rétro** : table `item_template` (type 78) des dumps SQL `StarLoco-Game`, valeurs identiques dans
  `Ancestra-Evolutive` et `Nao/RubrumBDD`.

### Contrôles effectués
- `poids_rune == valeur × poids_unitaire` : **0 écart** sur les 105 runes Dofus 2.
- Arrondis Rétro : 6 runes concernées, toutes conformes au post de `Schoup#6591`
  (Vi 0,75 → 1 ; Pa Vi 2,5 → 3 ; **Ra Vi 7,5 → 8**) et étendues à Pod/Pa Pod.
- `overmax == floor(101 / poids_unitaire)` : conforme partout sauf Ga Pme et Po (overmax 0, cf. §1).

### Pièges à connaître
- **1 Ra = 10 unités, 1 Pa = 3 unités** → 1 Ra ≠ 3 Pa en valeur de stat.
- **Le même id peut désigner deux runes différentes selon la version** : `7436` = « Rune Do Per »
  (% dommages, effet 138) en Rétro, mais « Rune Pui » (Puissance, carac 25) en Dofus 2.
  Idem `7446` (Rune Pi ↔ Rune Do Pi), `10618/10619` (Do Per ↔ Pui).
- La Rune Vi vaut **+3** en Rétro et **+5** en Dofus 2 (Pa Vi +10/+15, Ra Vi +30/+50).
- **Aucune rune** Fuite, Tacle, Esquive PA/PM, Retrait PA/PM, Dommages élémentaires, ni
  Do Per Mé/Di/Ar/So dans les dumps Rétro → ces lignes ne sont pas forgeables en 1.29.
- « Ga Po n'existe pas en 1.29 » : confirmé, aucune rune Ga Po dans les dumps (la Rune Po, poids 51, existe).
- `Rune de Signature` (7508) et `Rune de chasse` (10057) n'ont pas de caractéristique exploitable.

---

## 3. `items_retro.json` — 6 078 objets équipables, 26 557 effets

Source : `StarLoco-Game/db-init/04-game.sql`, table `item_template`, champ `statsTemplate`
(format `effetHex#minHex#maxHex#param3#dés`). Recoupé avec `Ancestra-Evolutive` et `Nao` :
mêmes lignes. Le mapping id d'effet → libellé provient d'**`Araknemu/data/constant/Effect.java`**
(énumération 1.29 complète) croisé avec `StarLoco/SpellEffect.java`.

```jsonc
{ "items": [ {
  "id": 1511, "nom": "Neuf Queues", "type_id": 6, "type": "Épée", "niveau": 80,
  "pods": 20, "panoplie_id": null, "conditions": "CS>99&CA>99&CV>99", "arme_infos": "9;1;1;20;20;9;0",
  "effets": [ {
    "effet_id": 118, "stat": "Force", "stat_cle": "force",
    "categorie": "stat",            // stat | arme | malus | autre | sort | monture | familier | special | inconnu
    "jet_min": 9, "jet_max": 9, "param3": 0, "des": "0d0+9",
    "forgemageable": true, "anomalie_jet": null } ] } ] }
```

Répartition par type : Épée 586, Marteau 548, Bâton 547, Dagues 538, Baguette 531, Arc 527,
Pelle 516, Hache 504, Coiffe 297, Anneau 233, Cape 208, Amulette 199, Bottes 194, Ceinture 179,
Bouclier 164, Familier 81, Fantôme de familier 77, Trophée 75, Outil 35, Sac à dos 17, Dofus 13,
Faux 5, Pioche 4.

### Points importants pour le simulateur
- **13 546 effets sont marqués `forgemageable: true`** ; ce sont les seuls à compter dans le poids.
- Les effets **91–101 et 108** (`ARMES_EFFECT_IDS` de l'émulateur) sont les lignes de dégâts d'arme :
  `categorie: "arme"`, exclues du poids de forgemagie.
- `jet_max = 0` dans le template signifie « pas de jet » : la valeur est fixe, `jet_max` est alors
  recopié depuis `jet_min` (ou depuis la constante des dés).
- **Correction d'ordre appliquée** : le `Constant.java` de StarLoco nomme 240 = R_FEU, 241 = R_NEU…
  ce qui contredit les runes de sa propre base (7455 « Ré Terre » → effet 240). L'ordre retenu est
  celui des runes et d'Araknemu : **240 Terre, 241 Eau, 242 Air, 243 Feu, 244 Neutre** (identique à 210–214).

### Anomalies connues
- **329 effets ont `jet_min > jet_max`** (`anomalie_jet: true`). 328 portent l'effet 983 (objet vivant /
  kraméléhone) où les champs encodent des paramètres et non un jet — non forgemageables, ignorables.
  Un seul cas réel : *Pelle du Trodortu* (id 5658), dés corrompus `1d-2+8`.
- 172 objets n'ont aucun effet (objets d'apparat, coquilles).
- 11 occurrences d'effets non identifiés (ids 1000, 723, 10, 148), aucune sur une ligne de stat.
- Niveaux de 1 à **229** : la base contient du contenu de serveur privé au-delà du plafond 1.29
  (niveau 200). Filtrer sur `niveau <= 200` si l'on veut du 1.29 strict.

---

## 4. `items_dofus2.json` — 3 465 objets équipables, 19 664 effets

Source principale : [`Aissoquatre/Easy-data--Datas`](https://github.com/Aissoquatre/Easy-data--Datas)
(`json/*.json`, scrap de l'encyclopédie Ankama, libellés FR avec jets « X à Y »).
13 doublons supprimés.

```jsonc
{ "items": [ {
  "id": 15742, "nom": "Casque des égarés", "type": "Chapeau", "niveau": 200,
  "panoplie_id": 355, "panoplie": "Panoplie des égarés", "conditions": [],
  "effets": [ {
    "libelle": "Vitalité", "stat": "Vitalité", "stat_cle": "vitalite",
    "categorie": "stat", "jet_min": 251, "jet_max": 300,
    "forgemageable": true, "poids_unitaire": 0.2, "overmax": 505 } ] } ] }
```

- **17 918 / 17 999 lignes de stat mappées (99,6 %)** vers `stat_cle`. Les 81 non mappées sont des
  bonus de sort nominatifs (« +1 % Critique sur le sort Bluff ») — `categorie: "inconnu"`.
- Les lignes entre parenthèses (`(dommages Neutre)`, `(vol Feu)`, `(PV rendus)`) sont les dégâts
  d'arme → `categorie: "arme"`, non forgemageables.
- Les « Titre : … », « Incarnation Niveau #5 », « Arme de chasse » → `categorie: "special"`, sans jets.
- Types : Chapeau 476, Bottes 348, Cape 345, Anneau 325, Ceinture 325, Amulette 310, Trophée 255,
  Bouclier 185, armes 841, Sac à dos 26, Pierre d'âme 24, Dofus 17, outils 13.
- Aucun `jet_min > jet_max`, ids uniques, niveaux 1–200.

### Source secondaire (non fusionnée, disponible)
[`dofuslab/dofuslab`](https://github.com/dofuslab/dofuslab) — `server/app/database/data/items.json`
+ `weapons.json` : 3 244 objets, structure `{stat, minStat, maxStat}` propre, noms en 6 langues,
mise à jour plus récente (fichiers de traduction datés 2024-12).
**Mais sa liste de stats ne contient pas les Pods** — d'où le choix d'Easy-data comme source primaire.
Fichiers déjà téléchargés dans `/tmp/dl/dl_*.json` si besoin de fusionner.

---

## 5. Ce qui manque / limites

1. **Dofus 3 (contenu 2024-2026)** : `items_dofus2.json` s'arrête au dernier scrap d'Easy-data
   (niveau max 200, pas de contenu récent). `api.dofusdb.fr` expose 21 776 objets mais **le proxy
   de cette session bloque `api.dofusdb.fr`, `dofapi.fr`, `api.dofusdu.de` et `dofus.com` en accès
   direct** ; seuls GitHub (`raw.githubusercontent.com`, `git clone`) et l'outil WebFetch passent.
   Les 105 runes Dofus 3 ont pu être extraites via WebFetch, pas les 21 776 objets.
2. **Familiers et montures Dofus 2** absents d'`items_dofus2.json` (présents en Rétro).
   `dofuslab` fournit `pets.json` (144) et `mounts.json` (308) si besoin.
3. **Poids du Renvoi de dommages non tranché** (10 / 30 / 3) et **Rune de chasse** (−1 / +5).
4. **Poids de malus incomplets** : `RuneWeightEnum.as` ne définit un malus que pour ~25 stats ;
   ailleurs `poids_unitaire_malus == poids_unitaire` par défaut (hypothèse, pas une donnée).
5. **Aucun taux de réussite** dans ces fichiers : les probabilités de SC/SN/EC, le puits/reliquat et
   les règles d'exo restent des modèles empiriques — voir `../sources/mecaniques.md` §2 à §6.
   Aucune formule officielle Ankama n'existe publiquement.
6. **Résistances PvP** : poids connus uniquement côté Rétro (StarLoco), inconnus en Dofus 2.
7. **`resistance_magique` / `resistance_physique`** (effets 183/184) : aucun poids trouvé dans
   aucune source, réputées non forgemageables.

## 6. Fichiers de provenance conservés
`lilgallon_runes.js`, `lilgallon_forgemagie.js`, `lilgallon_runecomplete.js`,
`runes_weights_lilgallon.csv/.txt` — extraits bruts de `lilgallon/dofus-tools`, gardés pour
audit du recoupement (§2). Ils sont **remplacés** par `runes.json` pour l'usage applicatif.
