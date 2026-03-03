# Design : Probabilité, Poids max, Mode Simulation

## Feature 1 : Probabilité du jet
- P(ligne) = (baseMax - currentValue + 1) / (baseMax - baseMin + 1)
- P(item) = produit de toutes les P(ligne) non-exo
- Affiché dans PoolSummary

## Feature 2 : Poids max théorique
- maxWeight = Σ(baseMax × weightPerPoint) pour toutes lignes forgeables
- Qualité item = currentWeight / maxWeight en %
- Affiché dans PoolSummary

## Feature 3 : Mode Simulation fidèle Dofus
- 3 résultats : SC (succès critique), SN (succès neutre), EC (échec critique)
- Taux basés sur ratio puits/poids rune
- Recul SN : poids rune retiré d'une ligne random pondérée
- Recul EC : rune ne passe pas + perte 50% poids rune sur ligne random
- Toggle mode planning/simulation dans l'UI
- Log visuel des tentatives
- Compteur de runes consommées
