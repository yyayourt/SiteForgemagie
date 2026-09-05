# Simulateur de Forgemagie — DOFUS 3 / DOFUS Unity

## Objectif

Reconstruire aussi fidèlement que possible la logique **serveur** de la Forgemagie de DOFUS 3 (DOFUS Unity) : calcul du poids des lignes, budget de planification (`weightBudget`), reliquat serveur (`residualPool` = perte − rune, jamais négatif, créé par un SN/EC et consommé en priorité), action des runes, issues SC/SN/EC, sélection des pertes, over/exo/overmax, potions, orbes régénérants, runes de transcendance et brisage. Ce n'est ni un calculateur de poids simplifié ni un guide : c'est une reconstruction traçable, où chaque nombre sait d'où il vient.

## Règles épistémiques

Aucune valeur n'est un fait sans preuve. Chaque règle, valeur ou formule porte un statut explicite : `SOURCE PRIMAIRE` (devblog, interface du jeu, données client), `MODÈLE EMPIRIQUE` (données expérimentales reproductibles, N documenté), `HYPOTHÈSE COMMUNAUTAIRE` (guides et forums, non vérifié), `CONTRADICTION` (sources fiables en désaccord) ou `INCONNU`. Les règles certaines sont codées en dur et testées ; tout le reste vit dans `empirical_params.json` avec sa valeur, son statut, sa source, ses bornes et sa valeur par défaut, et reste modifiable depuis l'interface. Aucune formule n'est inventée pour « faire tourner » la simulation sans être marquée comme telle. Le détail des règles est dans `CLAUDE.md` ; l'état des connaissances dans `docs/knowledge/` ; l'audit de départ dans `docs/audit-projet-existant.md`.

## Structure

- `src/` — application React 19 + TypeScript + Vite 7 + Tailwind 4 (`data/` tables dérivées du dataset, `logic/` moteur, `hooks/` et `components/` interface, `__tests__/` tests Vitest).
- `data/` — dataset de référence figé (généré par `scripts/`, jamais interrogé en direct par l'application), avec version du jeu, date d'extraction et provenance de chaque champ.
- `empirical_params.json` — paramètres non certains, exposés dans le panneau « Paramètres avancés ».
- `docs/knowledge/` — audits et rapports de reconstruction ; `docs/plans/` — plans en cours ; `docs/archive/` — documents obsolètes conservés pour l'historique.

Commandes : `npm run dev`, `npm run build`, `npm test`, `npm run lint`.
