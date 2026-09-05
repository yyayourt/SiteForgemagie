# Dataset de référence

Données **figées** générées par `scripts/extract-dataset.ts` (`npm run extract-dataset`) depuis l'API DofusDB. L'application ne fait **aucun appel réseau** : elle lit uniquement ces fichiers.

| Fichier | Contenu | Taille indicative |
|---|---|---|
| `dataset.json` | méta, effets, caractéristiques, types d'objets, runes, runes de transcendance, potions, orbes | ~100 kB |
| `items.json` | tous les objets équipables (séparé pour ne pas alourdir le bundle ; chargé à la demande) | ~5 MB |
| `rune-tiers.json` | paliers de runes réellement existants par caractéristique (dérivé de `dataset.json`) | ~11 kB |

## Statut épistémique

- **Source** : `https://api.dofusdb.fr` — données **dataminées tierces**, non officielles. Version du jeu et date d'extraction dans `meta` de chaque fichier (`gameVersion` = `GET /version`, `extractedAt` = horodatage du script).
- **Ce que le dataset ne contient PAS** :
  - **Aucune densité / poids de forgemagie.** Vérifié sur `/items`, `/effects`, `/characteristics` : aucun champ. La « Densité » affichée sur le site DofusDB n'est pas exposée par son API. Les densités vivent dans `empirical_params.json` (statut `HYPOTHÈSE COMMUNAUTAIRE` ou `CONTRADICTION`).
  - **Aucun taux pour les potions de forgemagie** : leurs effets (`effectId 700`) n'encodent pas le pourcentage de dommages conservés.
  - Aucune règle de forgemagie (probabilités, reliquat, pertes) : ce sont des données d'objets, rien d'autre.

## Provenance champ par champ

### `dataset.json`

| Champ | Endpoint DofusDB | Champ source | Transformation |
|---|---|---|---|
| `meta.gameVersion` | `GET /version` | corps brut | aucune |
| `meta.extractedAt` | — | `new Date()` du script | ISO 8601 |
| `meta.counts`, `meta.notes` | — | script | dénombrements et avertissements |
| `effects[]` | `GET /effects?bonusType[$in][]=1&bonusType[$in][]=-1` | `id`, `characteristic`, `bonusType`, `category`, `description.fr` | filtré sur `characteristic > 0` ; `labelFr` = description nettoyée des marqueurs `#1`, `{{~1~2 à }}`, `{{~ps}}` (pluriel gardé), `{{~zs}}` |
| `characteristics[]` | `GET /characteristics` | `id`, `keyword`, `name.fr` | filtré sur `id > 0` |
| `itemSuperTypes[]` | `GET /item-super-types` | `id`, `name.fr` | aucune |
| `itemTypes[]` | `GET /item-types` | `id`, `superTypeId`, `name.fr` | aucune |
| `runes[]` | `GET /items?typeId=78` | `id`, `name.fr`, `level`, `realWeight`, `effects[]` | `effects[].value` = `from` (DofusDB code une valeur fixe par `from = v, to = 0`) |
| `transcendenceRunes[]` | `GET /items?typeId=211` | idem | idem ; les effets `2825/2826/2827` (characteristic 0) sont des marqueurs de règle, conservés bruts |
| `potions[]` | `GET /items?typeId=26` | `id`, `name.fr`, `level`, `description.fr`, `effects[]` | effets bruts (`effectId`, `from`, `to`) |
| `orbs[]` | `GET /items?typeId=189` | idem | idem |

### `items.json`

Sélection : objets dont le type appartient aux **super-types** 1 Amulette, 2 Arme, 3 Anneau, 4 Ceinture, 5 Bottes, 7 Bouclier, 10 Chapeau, 11 Cape, 13 Dofus/Trophée/Prysmaradite (3 371 objets au 2026-09-05). Le champ `enhanceable` de DofusDB est conservé mais **n'est pas un critère fiable** (vrai sur des ressources).

| Champ | Champ source | Transformation |
|---|---|---|
| `id`, `nameFr`, `level`, `typeId`, `img`, `enhanceable` | `id`, `name.fr`, `level`, `typeId`, `img`, `enhanceable` | aucune |
| `effects[]` | `effects[]` → `effectId`, `characteristic`, `from`, `to` | **`to = 0` signifie valeur fixe `from`** (ex. `[111, 1, 0]` = 1 PA). Les malus ont un `effectId` distinct (`bonusType = -1` dans `effects` de `dataset.json`) et des valeurs négatives (`[421, -16, -20]`). |
| `possibleEffects[]` | `possibleEffects[]` → `effectId`, `diceNum`, `diceSide`, `value` | dés bruts du client ; `from`/`to` y sont `null`, ne pas les utiliser pour les intervalles |

Champs volontairement **ignorés** : `realWeight` (poids d'inventaire/économie, sans rapport avec la densité FM), `weight` (absent de l'API), `criterions`, `recipeIds`, `price`, `itemSet`.

### `rune-tiers.json`

Dérivé de `dataset.json → runes` : pour chaque `characteristicId`, les runes disponibles par palier. Le palier est **déduit du nom** (`Rune X` → `normal`, `Rune Pa X` → `pa`, `Rune Ra X` → `ra`) : l'API ne fournit pas d'information de palier. `unclassified[]` liste les runes exclues et pourquoi (Rune de Signature : aucun effet ; Rune de chasse : characteristic 0).

Ce fichier remplace les valeurs `runeNormal / runePa / runeRa` autrefois écrites à la main : un palier absent ici n'existe pas en jeu (ex. pas de Ra pour Soins, Tacle, Fuite, Retrait, % résistances).

## Clé de jointure

La clé stable est **`characteristicId`** (champ `characteristic` de DofusDB), pas `effectId` : un même `characteristicId` est porté par un effet bonus et un effet malus distincts, et les `effectId` ont été la source d'erreurs de l'ancien code (19 identifiants faux, voir `docs/audit-projet-existant.md` §3.1).

## Régénération

```bash
npm run extract-dataset
```

Nécessite Node ≥ 22.6 (`--experimental-strip-types`). Environ 90 requêtes espacées de 120 ms. Après régénération, comparer `meta.gameVersion` et `meta.counts` avec la version précédente et noter tout changement dans `docs/knowledge/`.
