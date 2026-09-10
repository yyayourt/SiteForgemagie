# ⛔ CORPUS CONTAMINÉ — archivé le 2026-09-10, ne pas s'en servir

Ce dossier était `docs/dofus-forgemagie-recherche/`. Il est archivé, **pas supprimé**
(règle de `CLAUDE.md`), parce qu'il documente d'où vient une erreur — et parce que tant
qu'il était à sa place, une session future pouvait le relire et se recontaminer.

## Ce qui l'invalide

Le DevBlog Ankama original « La nouvelle forgemagie » (v1.27, 2010) a été retrouvé le
2026-09-10 : `docs/knowledge/sources/S1-devblog-ankama-1.27.md`. Confronté au texte
d'origine, ce corpus porte **deux erreurs de fond**, toutes deux héritées du relais
Guilde Yin-Yang (voir `docs/knowledge/sources/genealogie.md`).

### 1. Le triplet `1/22/77` n'existe pas

Présenté ici comme « le seul chiffre officiel qui dise que le puits change le triplet de
probabilité » (`ALGORITHME.md:532-533`) et compté comme **cible de calibration atteinte ✅**
(`ALGORITHME.md:553`, `1136`, `1282`, `1413`).

Il ne figure **ni dans le texte français ni dans la traduction allemande** du DevBlog, et
aucun autre relais ne le porte. C'est une fabrication.

> **Toute calibration qui le prend pour cible est invalide** — pas approximative : invalide,
> parce qu'elle ajuste des paramètres sur une donnée qui n'a jamais existé.

### 2. L'ancre « jet parfait » est `43/50/7`, pas `34/50/16`

Ce corpus retient `34/50/16` **par défaut** (`ALGORITHME.md:266-268`, paramètre
`p_jet_parfait`) et présente la divergence comme non tranchable (`README.md:83`,
`sources/datasets.md:97`, `:399`).

Elle est tranchée : l'original donne **43/50/7**. ExiTeD et Alterya avaient raison,
Yin-Yang recopiait faux.

### 3. Corollaire — « l'exo, c'est 1 %, jamais de succès neutre »

`sources/createurs.md:134` et `:221`, `sources/datasets.md:415` (noté ★★★). L'ancre 4 du
DevBlog, `32/50/18` — « les probabilités maximums en création d'effet » —, n'a été reprise
par **aucun** guide en quinze ans. Le 1 % est un **plancher**, et le succès neutre existe
en création d'effet jusqu'à 50 %.

## Ce que le dépôt en a retenu

`src/` n'a jamais été contaminé : `empirical_params.json` avait explicitement refusé de
reprendre ces triplets. La contamination était entièrement documentaire.

Arbitrages : `docs/knowledge/arbitrages-2026-09-10.md` §4.2 et §4.3.
Écarts complets : `docs/knowledge/deltas-2026-09-10.md`.
Ordre de préséance appliqué : `docs/knowledge/hierarchie-preuves.md`.

## Ce qui reste utilisable

Rien, en tant que spécification. Les protocoles expérimentaux qu'il décrit (§ Protocoles
A à D) restent des idées de collecte valables, mais elles sont reprises et corrigées dans
les documents ci-dessus. **Ne rien recopier d'ici sans revérifier contre S1.**
