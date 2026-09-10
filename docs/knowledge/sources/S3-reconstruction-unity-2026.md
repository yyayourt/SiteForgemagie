# S3 — Reconstruction de l'algorithme de Forgemagie, DOFUS 3 / Unity (2026)

## Identité

| Champ | Valeur |
|---|---|
| **Fichier** | `docs/knowledge/Reconstruction_of_the_DOFUS_3_Unity_Forgemagie_Algorithm__2026_V.md` |
| **Nature** | **Rapport de compilation** (17 parties) : recherche documentaire agrégeant sources officielles, guides, dépôts open-source et wikis, avec verdicts par affirmation |
| **Auteur** | non signé, produit pour le projet |
| **Date d'entrée au dépôt** | commit `da87c77` (« Phase 0 : hygiène du dépôt avant refonte ») — **antérieur au 2026-09-10** |
| **Version de jeu couverte** | **hétérogène** : compile 1.29, 2.x, Touch, Unity 3.0/3.1. Chaque affirmation porte une version différente |
| **Méthode d'obtention** | recherche web + lecture de dépôts publics ; aucune donnée de première main |
| **Abréviation dans le dépôt** | **`R`** (voir `empirical_params.json`, `$comment` de tête) |
| **Rang de fiabilité** | **compilateur** — n'a pas de rang propre. Chaque affirmation hérite du rang de la source citée : R2 quand il cite le tutoriel Ankama, R5 quand il cite Millenium ou Gamosaurus |

## Statut — n'est pas une source

> **Ce document n'apporte aucune preuve de première main.** Sa valeur est celle d'un
> **index critique** : il attribue des verdicts (CONFIRMÉ / TRÈS PROBABLE / NON DÉMONTRÉ /
> FAUX) aux affirmations du corpus, et il identifie les recopies.

Le citer comme « source » d'une valeur est une **erreur de méthode** : il faut remonter à la
source qu'il cite, et lui appliquer le rang correspondant.

## Apports validés, déjà intégrés au dépôt

Ce document est **la base documentaire actuelle** d'`empirical_params.json` : ses parties
sont référencées dans presque toutes les notes de paramètres (`R PARTIE 2`, `R PARTIE 6`,
`R Key Findings 5`…). Ses apports sont donc déjà arbitrés dans `../errata.md` et n'ont pas
à être réingérés.

Ses contributions les plus solides, parce qu'elles s'appuient sur R2 (tutoriel officiel
Unity) :

- les **deux bornes primaires** SC 15 % / exo 1 %, citées verbatim → codées en dur dans
  `src/logic/probability/constraints.ts` ;
- le constat central, **négatif et robuste** : *aucune formule SC/SN/EC n'existe dans une
  source publique, aucun dépôt ne l'implémente* → justifie toute l'architecture « modèle
  paramétrable » du projet ;
- la démolition du PDF `Algorithme_Forgemagie_DOFUS_3.pdf` (formules φ/Ω/D inventées,
  datasets invérifiables, potions 100/85/50 fausses).

## Affirmations à ne PAS reprendre

| Affirmation de S3 | Pourquoi elle tombe | Autorité qui tranche |
|---|---|---|
| « Les probabilités du DevBlog circulent depuis un vieux guide (Alterya citant forgemagie.net), **une seule source d'origine recopiée**, à traiter comme un exemple ancien et non comme la loi » (PARTIE 3, Caveats) | **Le DevBlog original a été retrouvé (S1).** Ce ne sont plus des chiffres de relais : ce sont des chiffres d'Ankama. Le raisonnement « une seule source recopiée » ne s'applique plus à leur *authenticité* — seulement à leur *actualité* (v1.27) | S1 (R3) |
| « Transcendance : devblog **2.72** » | Erreur de version : le devblog fondateur est **2.58** | déjà corrigé, `../errata.md` (2026-09-05) |
| « Potions : **50/65/80 %** confirmé verbatim par Dofus Pages » et recommandation de le coder en dur | Contredit par S4 §G (65 % retiré en 3.1, conversion à 85 %) et par l'observation Unity (aucun taux affiché, deux paliers seulement) | S2/S4 → `CONTRADICTION`, arbitrage 4.5 |
| « % Dommages/Résistance mêlée-distance = **15** » | Lu **10** en infobulle Unity le 2026-09-08 | R1 (observation) |
| « Coup critique 10, Soins 10 » présentés comme « Élevée » sur la foi du changelog 2.29 | Correct, mais le rang est R2-relais (jeuxonline), pas primaire direct | `../errata.md` (2026-09-08) |
| « Exo PA/PM/PO ≈ 1 % : **implémentable en dur (constante)** » (tableau final) | Le DevBlog établit que 1 % est un **plancher**, pas une constante | S1, arbitrage 4.3 |
| Plafond « **101 global pour over+exo** », présenté comme un plafond unique | Le DevBlog décrit **deux** plafonds distincts | S1, arbitrage 4.1 |

## Rôle dans la hiérarchie

Aucun rang propre. À utiliser comme **carte du corpus** et comme mémoire des verdicts, jamais
comme autorité. Quand S3 et S1 divergent sur ce que dit Ankama, **S1 gagne** : S3 ne faisait
que rapporter des relais.
