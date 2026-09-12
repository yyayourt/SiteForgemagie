# Archive

Documents conservés pour l'historique mais **plus applicables**. Ne pas s'en servir comme spécification.

| Fichier | Date | Pourquoi archivé |
|---|---|---|
| `patches/0001-icones-runes-dofusdb-couleurs.patch` | 2026-09-12 | Patch git (`format-patch`) produit le 2026-09-10 sur une base antérieure, **appliqué le 2026-09-12** (icônes DofusDB des runes, teintes par famille : `src/data/statColors.ts`, `src/components/atelier/RuneIcon.tsx`). Deux hunks (`ActionPanel.tsx`, `useAtelier.ts`) résolus à la main via `git apply --3way`. Conservé pour la traçabilité de l'origine des URL `img` ; le code vivant fait foi. |
| `2026-09-10-dofus-forgemagie-recherche/` | 2026-09-10 | Bundle de recherche **calibré sur des valeurs invalidées** : le triplet « 1/22/77 » (exo avec puits), qui ne figure ni dans le texte FR ni dans la traduction DE du DevBlog Ankama, y est compté comme cible de calibration atteinte ; l'ancre « jet parfait » y vaut `34/50/16` par défaut, valeur du relais Yin-Yang, alors que l'original donne `43/50/7`. Voir `2026-09-10-dofus-forgemagie-recherche/AVERTISSEMENT.md` et `docs/knowledge/arbitrages-2026-09-10.md` §4.2. |
| `2026-03-02-simulation-proba-maxweight-design.md` | 2026-03-02 | Design initial de trois fonctionnalités UI. Sa « Feature 3 » prescrit des taux SC/SN/EC « basés sur ratio puits/poids rune » et une perte EC de 50 % du poids de la rune : formules inventées, contraires à la règle 3 de `CLAUDE.md` (ne jamais inventer une formule). Réfuté par `docs/audit-projet-existant.md` §5. |
