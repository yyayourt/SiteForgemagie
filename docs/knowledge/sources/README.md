# Fiches de source — `docs/knowledge/sources/`

Une fiche par document du corpus : nature, date, **version de jeu couverte**, méthode
d'obtention, rang de fiabilité. Créé le 2026-09-10 lors de l'ingestion des sources
mentionnées dans la demande du même jour.

L'ordre de préséance entre ces rangs est fixé par
[`../hierarchie-preuves.md`](../hierarchie-preuves.md). **Toute résolution de contradiction
doit citer ce document.**

| Fiche | Source | Version couverte | Rang |
|---|---|---|---|
| [S2](S2-observation-jeu-2026-09-10.md) | Observation directe en jeu, 10/09/2026 | **Unity 3.6.10.11** | **R1** |
| [S1](S1-devblog-ankama-1.27.md) | DevBlog Ankama « La nouvelle forgemagie » | **1.27 (2010)** | **R3** |
| [S3](S3-reconstruction-unity-2026.md) | Rapport de reconstruction (17 sections) | compilation 1.29 → 3.1 | **R4/R5** (compilateur) |
| [S4](S4-reverse-engineering-technical-mapping.md) | Rapport de rétro-ingénierie technique | protocole 2.x + outillage Unity | **R4** (technique), **R6** sur le reliquat |
| [Généalogie](genealogie.md) | Arbre de dérivation des sources communautaires | 2010 → 2026 | — |

## Avertissement de classement (2026-09-10)

Deux des quatre documents présentés comme « nouvelles sources » **ne sont pas neufs** :
`Reconstruction_of_the_DOFUS_3_Unity_Forgemagie_Algorithm__2026_V.md` et
`Reverse-Engineering_DOFUS_3_Unity_Forgemagie__Technical_Mapping__1_.md` sont versionnés
depuis le commit `da87c77` (« Phase 0 : hygiène du dépôt avant refonte ») et sont déjà la
base documentaire d'`empirical_params.json`, où ils sont abrégés `R`. Ils sont fichés ici
pour compléter le classement, **pas réingérés** : leurs affirmations sont déjà arbitrées
dans `../errata.md`.

Les deux documents réellement nouveaux sont S1 (DevBlog) et S2 (observation du 10/09/2026).

## Emplacement réel des fichiers

La demande situait les quatre sources dans `docs/sources/raw/`. **Ce dossier n'existe pas.**
Emplacements constatés le 2026-09-10 :

| Nom annoncé | Chemin réel | Suivi git |
|---|---|---|
| `claude_devblog-ankama-source-primaire.md` | `docs/Devblog ankama source primaire.md` | non suivi |
| `claude_observation-jeu-2026-09-10.md` | `docs/Observation jeu 2026 09 10.md` | non suivi |
| `Reconstruction_DOFUS3_Unity_Forgemagie_2026.md` | `docs/knowledge/Reconstruction_of_the_DOFUS_3_Unity_Forgemagie_Algorithm__2026_V.md` | suivi (`da87c77`) |
| `Reverse-Engineering_DOFUS3_Unity_Technical_Mapping.md` | `docs/knowledge/Reverse-Engineering_DOFUS_3_Unity_Forgemagie__Technical_Mapping__1_.md` | suivi (`da87c77`) |

Aucun fichier n'a été déplacé : le rangement est une proposition (§P8 de
[`../arbitrages-2026-09-10.md`](../arbitrages-2026-09-10.md)), en attente de validation.

## Corpus arrivé en même temps, hors périmètre de cette ingestion

Deux arborescences non suivies sont apparues avec les sources et **ne sont pas fichées ici**
faute de mandat, mais sont citées par les arbitrages :

- `docs/dofus-forgemagie-recherche/` — bundle de recherche **antérieur au DevBlog**, calibré
  sur `34/50/16` et sur le triplet inexistant `1/22/77`. Corpus **corrompu** (§4.2).
  **Archivé le 2026-09-10** dans `docs/archive/2026-09-10-dofus-forgemagie-recherche/`, avec
  une note de mise en garde.
- `docs/forgemagie-dropin/` — bundle **postérieur au DevBlog**, qui intègre déjà `43/50/7`,
  `32/50/18` et la suppression de `1/22/77`. Non audité : laissé en place, avec un
  `AVERTISSEMENT.md` signalant que son sous-dossier `_recherche/` contient encore des copies
  périmées du corpus contaminé.
