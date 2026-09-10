# Prompts à envoyer à Claude Code

## Prompt 1 — audit de l'existant (à envoyer en premier)

> J'ai un simulateur de forgemagie Dofus 3 déjà commencé dans ce repo. Je viens d'ajouter
> un dossier de recherche dans `docs/forgemagie/`.
>
> Avant de toucher à quoi que ce soit :
> 0. Lis `docs/forgemagie/DEVBLOG-ANKAMA-ORIGINAL.md` en entier (c'est court, et c'est la
>    SEULE source primaire — tous les guides communautaires en dérivent, plusieurs faux).
> 1. Lis `docs/forgemagie/CLAUDE-FM.md` en entier.
> 2. Lis les sections 1, 2, 5, 6 et 7 de `docs/forgemagie/ALGORITHME.md` (modèle d'état,
>    poids, puits, pertes, règles dures). Ignore le reste pour l'instant.
> 3. Lis mon code existant.
>
> Puis produis-moi **uniquement un rapport d'écart**, dans `docs/forgemagie/AUDIT.md` :
> - ce que mon implémentation fait déjà correctement,
> - chaque divergence avec la spec, avec le fichier et la ligne, classée
>   `bug` / `simplification assumée` / `choix différent mais défendable`,
> - les constantes de proba que j'ai codées en dur et qui devraient migrer dans `ModelParams`,
> - si j'utilise par erreur des valeurs Rétro (1.29) là où il faut du Dofus 2/3.
>
> **N'écris aucun code, ne modifie aucun fichier existant.** Juste le rapport.
> Si un point de la spec est marqué `[SUPP]` et que mon choix diffère, dis-le mais ne
> tranche pas : c'est à calibrer, pas à décréter.

## Prompt 2 — après lecture de l'audit

> On applique l'audit dans cet ordre :
> 1. d'abord les `bug` du **moteur d'état** (poids, puits, over/exo, caps, pertes) — c'est
>    la partie certaine, elle doit être exacte ;
> 2. ensuite l'extraction de toutes les constantes de proba dans `ModelParams` ;
> 3. seulement après, le modèle de probabilité.
>
> Un commit par point. Après chaque changement du modèle de proba, exécute la suite de
> tests et montre-moi l'écart aux 5 ancres officielles avant/après.
>
> `docs/forgemagie/reference/fm_sim.py` est une implémentation de référence autonome
> (stdlib pure, 49 tests verts). Tu peux t'en inspirer ou en reprendre des morceaux,
> mais **ne remplace pas mon architecture par la sienne** — c'est un point de comparaison,
> pas un modèle à copier.

## Prompt 3 — quand tu veux avancer sur la calibration

> Lis `docs/forgemagie/ALGORITHME.md` §12 (protocole de calibration) et §11 (incertitudes).
> Construis-moi le pipeline de calibration : format du journal de tentatives (CSV),
> le loader, l'estimateur, et un script qui ajuste `ModelParams` sur un journal réel
> et me sort l'écart aux ancres avant/après.
> Rien à collecter encore — je veux juste que le tuyau existe pour le jour où j'aurai
> des données.

---

## Ce que tu ne devrais PAS faire

- **Traiter un guide communautaire comme une source.** `DEVBLOG-ANKAMA-ORIGINAL.md` est
  la source primaire ; tout le reste est secondaire et parfois faux (ancre 2 donnée à
  34/50/16 au lieu de 43/50/7, triplet « 1/22/77 » purement inventé, « l'exo c'est 1 % »
  présenté comme universel alors que c'est un plancher). Une calibration faite sur un
  relais est à refaire.
- Envoyer `_recherche/` dans le contexte par défaut. Ces fichiers contiennent des tables
  **contradictoires entre elles** (c'est leur intérêt : ils documentent les désaccords).
  Claude Code y piochera une valeur au hasard s'il les lit sans la spec. Ils sont là pour
  être consultés à la demande, quand une question précise se pose.
- Demander « implémente la forgemagie » d'un bloc. Le moteur d'état et le modèle de proba
  ont des niveaux de certitude opposés ; les traiter ensemble, c'est graver des hypothèses
  dans du code qu'on croira ensuite fiable.
