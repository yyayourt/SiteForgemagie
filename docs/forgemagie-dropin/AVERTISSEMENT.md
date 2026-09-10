# ⚠️ Bundle non audité — lu le 2026-09-10, pas intégré

`docs/forgemagie-dropin/` est arrivé avec les sources du 2026-09-10. Il n'est **pas** archivé,
parce qu'il ne porte pas le défaut qui a fait archiver `docs/dofus-forgemagie-recherche/`.
Il n'est pas non plus intégré au corpus, parce qu'il n'a pas été fiché.

## Ce qui a été vérifié

Ce bundle est **postérieur** à la redécouverte du DevBlog original et en intègre déjà les
corrections. Vérifié par lecture directe :

| Point | État dans ce bundle |
|---|---|
| Ancre « jet parfait » | **43/50/7** retenu ; `34/50/16` explicitement marqué faux (`ALGORITHME.md:26`, `:1391`) |
| Triplet `1/22/77` | explicitement **SUPPRIMÉ** du corpus, « il n'existe pas » (`ALGORITHME.md:27`, `:324`, `:626`, `:1136`, `:1392`) |
| « L'exo, c'est 1 % » | corrigé en **plancher**, l'ancre 4 `32/50/18` reprise (`ALGORITHME.md:28`, `:1122`, `:1131`) |
| Consigne de codage | « Ne pas coder *exo = 1 %* : laisser le plancher produire le 1 % » (`ALGORITHME.md:1135`) |

Sur ces quatre points, il est d'accord avec les arbitrages du 2026-09-10.

## ⛔ Ce qui reste périmé à l'intérieur

**`docs/forgemagie/_recherche/` contient des copies du corpus contaminé**, non corrigées :

- `_recherche/datasets.md:97` — « Alterya donne 43/50/7, Yin-Yang donne 34/50/16 », présenté
  comme une divergence ouverte ;
- `_recherche/datasets.md:399` — même divergence, listée comme question à trancher ;
- `_recherche/datasets.md:415` — « SN lors d'un exo PA/PM/PO : **0 %**, ★★★ » ;
- `_recherche/createurs.md` — « l'exo : 1 % **fixe**, **jamais** de succès neutre ».

Ces fichiers sont les mêmes que ceux archivés dans
`docs/archive/2026-09-10-dofus-forgemagie-recherche/sources/`. Le bundle principal les
contredit ; ses annexes ne l'ont pas suivi.

> **Ne rien reprendre de `_recherche/` sans revérifier contre**
> `docs/knowledge/sources/S1-devblog-ankama-1.27.md`.

## Ce qui n'a pas été vérifié

Tout le reste : `fm_sim.py`, `test_fm_sim.py`, la calibration, les protocoles, les
affirmations sur les densités et le reliquat. Ce bundle propose sa propre implémentation de
référence en Python, indépendante du moteur TypeScript du dépôt — **rien n'a été comparé**.

Tant qu'une fiche de source n'aura pas été écrite dans `docs/knowledge/sources/`, ce bundle
n'a **aucun rang** dans la hiérarchie des preuves (`docs/knowledge/hierarchie-preuves.md`) et
ne peut justifier aucune valeur.
