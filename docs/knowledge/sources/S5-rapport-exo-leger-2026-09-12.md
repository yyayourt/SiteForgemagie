# S5 — Rapport de recherche « Comportement probabiliste de l'exo léger (poids < 30) » (2026-09-12)

## Identité

| Champ | Valeur |
|---|---|
| **Fichier** | `docs/knowledge/compass_artifact_wf-ff2d2364-857e-5303-ba98-ae1eb5fe767d_text_markdown.md` (nom d'export ; renommage proposé, `../2026-09-14-exo-leger.md` §4) |
| **Nature** | **Rapport de compilation** : revue de sources web sur le régime probabiliste des exos non PA/PM/PO, avec taxonomie A–E par statut |
| **Auteur** | non signé, produit pour le projet à la demande de Yanis |
| **Date** | 2026-09-12 (déposé non suivi dans `docs/knowledge/`) |
| **Version de jeu couverte** | **hétérogène** : Unity 3.6.10.x (Fashionista, Akaheif, Dafous), 2.x (Papycha, Alterya 2012, Gryfox 2022, tofus), Touch (tuto « F à E ») |
| **Méthode d'obtention** | recherche web par extraits ; **dofus.com et YouTube lus en snippets seulement** (fetch bloqué, 429/login-wall) — le rapport le déclare lui-même |
| **Abréviation dans le dépôt** | **`L`** (dans `../2026-09-14-exo-leger.md`) |
| **Rang de fiabilité** | **compilateur** — aucun rang propre ; chaque affirmation hérite du rang de la source citée (R2 pour le tutoriel Ankama, R5 pour les guides, R6 pour Touch, aucun rang pour les vidéos non transcrites) |

## Statut — n'est pas une source

Même règle que S3 : citer `L` comme source d'une valeur est une erreur de méthode. Remonter à
la source citée, lui appliquer son rang.

## Apports validés

- **Verbatim du tutoriel Ankama complété** (A1) : « …si l'on souhaite ajouter un PA **ou un
  PM** exotique, par exemple » — le PM est nommé. Recoupé le 2026-09-14 par deux relais
  citant la phrase intégrale → `HEAVY_EXO_VERBATIM = [1, 23]`.
- **Fashionista Smithmagic Lab** identifié comme source Unity (3.6.10.10) sur le régime des
  exos, avec un verbatim qui ouvre une lecture concurrente (poids cumulé de la ligne, « % spell
  damage from its second point ») → `CONTRADICTION` C2.
- **Constat négatif robuste** (E) : aucun taux SC/SN/EC chiffré et vérifiable pour l'exo léger
  dans les sources publiques → l'intervalle `INCONNU` du garde-fou est la bonne sortie.
- **Pistes de calibration** nommées (Akaheif, « 100 tentatives EXO », Unity) → protocole §5.

## Affirmations à ne PAS reprendre

| Affirmation de L | Pourquoi elle tombe | Autorité qui tranche |
|---|---|---|
| « Le code actuel … retombe sur la formule FM normale … SC jusqu'à 50 % » (TL;DR, Reco 1) | Périmé : depuis P2 (2026-09-10) l'exo non lourd est un intervalle `INCONNU`, jamais un point de modèle | code + tests (`exoGuard.test.ts`) ; `../errata.md` 2026-09-14 |
| A5 « Ordre des pertes » étiqueté **FAIT CONFIRMÉ (source officielle)** | Sources réelles : tofus.fr, Dafous = R5 | `hierarchie-preuves.md` |
| A2 « % Résistance mêlée / distance : 30 → 15 » | Lu **10** en infobulle Unity le 2026-09-08 | R1 |
| A3 « Over max +6 » comme fait indépendant | `floor(101/15)` — dérivé d'`overCapWeight`, pas une confirmation | `statCaps.ts` |
| Reco 2 : courbe pSC « décroissante avec les points posés, croissante avec le reliquat » à encoder dans `empirical_params.json` | Formule inventée, zéro chiffre (CLAUDE.md règle 3) ; la « dépendance au reliquat » est une surlecture d'Alterya (C3) | `../2026-09-14-exo-leger.md` §2 |
| C8 table poids → % | Spéculation auto-déclarée, source unique, non relue, concerne les overs | `INCONNU`, refus de coder |

## Rôle dans la hiérarchie

Aucun rang propre. Carte du corpus « exo léger » ; ses verdicts sont ré-arbitrés dans
`../2026-09-14-exo-leger.md`.
