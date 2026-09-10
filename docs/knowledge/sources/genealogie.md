# Généalogie des sources — la racine et ses relais

**Mise à jour du 2026-09-10.** Jusqu'à cette date, le corpus du projet traitait les
probabilités du DevBlog comme *« une seule source d'origine recopiée »* dont l'original était
**perdu** (S3, PARTIE 3 et Caveats). L'original a été retrouvé : la généalogie change de
nature. On ne compare plus des relais entre eux ; **on peut désormais mesurer l'erreur de
chaque relais par rapport à la racine.**

## L'arbre

```
                    ┌─────────────────────────────────────────────┐
                    │  RACINE — DevBlog Ankama « La nouvelle       │
                    │  forgemagie », v1.27, 2010                   │
                    │  SOURCE PRIMAIRE — v1.27   (rang R3)         │
                    │  5 ancres : 66/34/0 · 43/50/7 · 15/50/35     │
                    │             32/50/18 · 1/0/99                │
                    └───────────────────────┬─────────────────────┘
                                            │ (seconde main)
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
        ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
        │ ExiTeD            │   │ Guilde Yin-Yang   │   │ Alterya           │
        │ forgemagie.net    │   │                   │   │                   │
        │ + module          │   │  ancre 2 :        │   │  ancre 2 :        │
        │   SmithMagic      │   │  34/50/16  ✗      │   │  43/50/7   ✓      │
        │ ancre 2 : 43/50/7 │   │  + « 1/22/77 »    │   │  (cite            │
        │            ✓      │   │    INEXISTANT ✗   │   │   forgemagie.net) │
        └─────────┬─────────┘   └─────────┬─────────┘   └─────────┬─────────┘
                  │                       │                       │
                  └───────────┬───────────┴───────────┬───────────┘
                              ▼                       ▼
                 ┌──────────────────────┐  ┌──────────────────────────┐
                 │ Guides 2.x / Unity   │  │ bundle « dofus-          │
                 │ Millenium, dofastuces│  │ forgemagie-recherche »   │
                 │ Huzounet, Gamosaurus │  │ défaut = 34/50/16 ✗      │
                 │ JeuxOnLine, Tofus,   │  │ calibré sur 1/22/77 ✗    │
                 │ wikis                │  │ → CORROMPU, ARCHIVÉ      │
                 └──────────┬───────────┘  └──────────────────────────┘
                            ▼
                 ┌──────────────────────┐
                 │ S3 « Reconstruction »│  compile les relais,
                 │ (rang : celui de sa  │  ne remonte pas à la racine
                 │  source citée)       │
                 └──────────────────────┘
```

## Le relais fautif — démonstration

| Ancre | Racine (S1, verbatim) | ExiTeD / Alterya | Yin-Yang | Écart Yin-Yang |
|---|---|---|---|---|
| 1 — remontage, meilleur cas | **66 / 34 / 0** | 66 / 34 / 0 | 66 / 34 / 0 | — |
| 2 — vers le jet parfait | **43 / 50 / 7** | **43 / 50 / 7** ✓ | **34 / 50 / 16** ✗ | SC −9, EC +9 |
| 3 — remontage, minimum | **15 / 50 / 35** | 15 / 50 / 35 | 15 / 50 / 35 | — |
| 4 — **création d'effet, au mieux** | **32 / 50 / 18** | *absente* | *absente* | **jamais relayée** |
| 5 — création d'effet, au pire | **1 / 0 / 99** | 1 / 0 / 99 | 1 / 0 / 99 | — |
| « exo **avec puits** » | *n'existe pas* | *absent* | **1 / 22 / 77** ✗ | **fabriqué** |

Deux fautes distinctes, du même relais :

1. **Une déformation** : `43/50/7` devient `34/50/16`. Les deux chiffres modifiés
   (43 → 34, 7 → 16) sont exactement les chiffres qui bougent, le 50 restant intact ;
   la somme reste 100, ce qui rend l'erreur **indétectable par contrôle interne**. C'est
   précisément pourquoi elle a survécu 15 ans.
2. **Une fabrication** : le triplet `1/22/77` présenté comme « exo avec puits ». Il ne figure
   ni dans le texte FR ni dans la traduction allemande. Aucun autre relais ne le porte.

Et **une omission collective** : l'ancre 4 (`32/50/18`, création d'effet au mieux) n'a été
reprise par **aucun** guide en quinze ans. C'est elle qui rendait visible que « l'exo, c'est
1 % » est un plancher et non une constante ; son absence explique la croyance communautaire.

## Règle qui en découle

> **Toute valeur dont la seule origine remonte à Yin-Yang est suspecte.**
> Deux fautes avérées sur les six chiffres qu'il transmet, dont une **fabrication pure**.
> Ce n'est plus un relais imparfait : c'est un relais non fiable.
>
> Corollaire pour les autres relais : ExiTeD et Alterya sont **vérifiés exacts** sur les
> ancres qu'ils transmettent — mais uniquement sur celles-là. Cela ne transfère aucune
> autorité au reste de leur contenu (poids, seuils, ordres de perte), qui n'a pas été
> confronté à une racine.

## Réévaluation des valeurs du dépôt qui remontent à cette racine

Aucune valeur du dépôt n'est reprise **littéralement** d'un relais : `empirical_params.json`
a explicitement refusé les triplets (`ecShare`, note ligne 256 : *« aucune […] ne sont pas
utilisables »*). Le dépôt s'est donc protégé de la contamination directe. Mais deux
paramètres ont été **calibrés en visant** ces valeurs :

| Paramètre | Fichier:ligne | Calibré sur | Racine réelle | Verdict |
|---|---|---|---|---|
| `officialFactorsLinear.b` = 0,5 | `empirical_params.json:288` | « pour qu'une ligne vide donne ≈ 65 %, **écho du 66 % d'un vieux guide** » | **Ancre 1 = 66/34/0, authentique**, v1.27 | **Calibration numériquement saine, justification à corriger** : la note dénigre une valeur qui est d'Ankama. Ne change pas la valeur, change son étiquette |
| `officialFactorsLinear.a` = 0,15 | `empirical_params.json:277` | « posé égal au plancher officiel de 15 % pour qu'une ligne au jet parfait soit au minimum » | **Ancre 2 = 43/50/7** : au jet parfait, le meilleur cas est **43 %**, pas 15 % | **Calibration fausse.** Confusion entre *le plancher absolu du système* (ancre 3, objet complexe haut niveau) et *le cas d'une ligne au jet parfait sur objet simple* (ancre 2). Voir arbitrage §4.2 |
| `ecShare` = 0,5 | `empirical_params.json:253` | rien — « posé arbitrairement » | Ancres 2, 3, 4 : **SN = 50 dans les trois cas** | La valeur 0,5 est celle de la **part d'EC**, pas du SN. Le SN produit vaut 0,5 × (1 − pSC), donc 42,5 % à pSC = 0,15 : proche de 50 par coïncidence, sans en avoir la structure |
| `heavyExoEcShare` = 1 | `empirical_params.json:264` | « guides : exo PA/PM/PO = 1 % SC, 0 % SN, 99 % EC » | **Ancre 5**, authentique, mais c'est le **pire cas** de la création d'effet, pas son régime général | Voir arbitrage §4.3 |
| Aucune valeur | — | `1/22/77` | **n'existe pas** | Le dépôt `src/` est **indemne**. Seul `docs/archive/2026-09-10-dofus-forgemagie-recherche/` est contaminé |

## Sources contaminées à isoler

| Fichier | Contamination | Action proposée |
|---|---|---|
| `docs/archive/2026-09-10-dofus-forgemagie-recherche/ALGORITHME.md:266-268` | défaut `p_jet_parfait = 34/50/16` | **archivé le 2026-09-10** |
| `docs/archive/2026-09-10-dofus-forgemagie-recherche/ALGORITHME.md:532-533,553,1136,1282,1413` | calibration et « validation » sur `1/22/77` | **archivé le 2026-09-10** |
| `docs/archive/2026-09-10-dofus-forgemagie-recherche/README.md:83` | présente la divergence 43 vs 34 comme non tranchable | **archivé le 2026-09-10** |
| `docs/archive/2026-09-10-dofus-forgemagie-recherche/sources/createurs.md:134,221` | « exo : 1 % **fixe**, **jamais** de succès neutre » | **archivé le 2026-09-10** |
| `docs/archive/2026-09-10-dofus-forgemagie-recherche/sources/datasets.md:97,399,415` | divergence 43/34 non tranchée ; « SN lors d'un exo = 0 % ★★★ » | **archivé le 2026-09-10** |

`docs/forgemagie-dropin/` est **postérieur** au DevBlog et intègre déjà les corrections
(43/50/7, 32/50/18, suppression de 1/22/77). Non contaminé, mais **non audité** : il n'entre
pas dans le corpus tant qu'il n'a pas été fiché.
