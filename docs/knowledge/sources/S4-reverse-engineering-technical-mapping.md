# S4 — Reverse-engineering DOFUS 3 / Unity, cartographie technique

## Identité

| Champ | Valeur |
|---|---|
| **Fichier** | `docs/knowledge/Reverse-Engineering_DOFUS_3_Unity_Forgemagie__Technical_Mapping__1_.md` |
| **Nature** | **Rapport technique de compilation** : noms internes, protocole, outillage d'extraction, inventaire des dépôts publics |
| **Date d'entrée au dépôt** | commit `da87c77` (Phase 0) — **antérieur au 2026-09-10** |
| **Méthode d'obtention** | recherche documentaire sur dépôts publics, forums techniques (RaGEZONE, Cadernis), registres de paquets. **Aucun dump réalisé, aucun client ouvert** |
| **Rang de fiabilité** | **R4** sur l'outillage et le protocole ; **R6 (obsolète)** sur ses conclusions relatives au reliquat |

## Périmètre de validité — re-scopé le 2026-09-10

> **La version couverte par ce document n'est pas homogène.** C'est le point le plus
> important de cette fiche.

| Section | Version réellement couverte | Statut au 2026-09-10 |
|---|---|---|
| §B outillage (Il2CppDumper, AssetStudio, BepInEx, DDC, doduda, cytrus-v6) | Unity 3.x | **valide** |
| §A protocole `com.ankama.dofus.server.game.protocol.*`, build IL2CPP, protobuf | Unity 3.x | **valide** |
| §A `magicPoolStatus`, `ExchangeCraftResultMagicWithObjectDescMessage`, `craftResult` | **DOFUS 2.x — ActionScript** | valide **pour 2.x**, non confirmé sous Unity (le document le dit lui-même) |
| §A/§D « **le reliquat n'est pas exposé au client** ; le client ne reçoit qu'un sens de variation » | **DOFUS 2.x** | **OBSOLÈTE pour Unity** — voir arbitrage 4.4 |
| §I plan de datamining, étape 7 (« sniffer une session de FM pour capter `magicPoolStatus` ») | 2.x | **caduc pour le reliquat** — la valeur est à l'écran |
| §C émulateurs (Stump, Symbioz, Desperion, Mambo, Giny…) | 1.29 / 2.x | valide, **et sans valeur probante** (CLAUDE.md : un émulateur n'est jamais une preuve du serveur) |
| §F champs DofusDB (`weight`, `realWeight`, absence de champ densité FM) | Unity | **valide**, confirmé par le résultat négatif de datamining du 2026-09-08 |
| §G potions : « 65 % retiré en 3.1, armes converties à 85 % » (Fandom) vs « 50/65/80 maintenu » (wiki-dofus.eu) | 3.1 vs 2.x | **valide comme constat de contradiction** — arbitrage 4.5 |

## Apports négatifs — les plus utiles

Ce document vaut surtout par ses **résultats négatifs**, qui sont solides parce qu'ils
résultent d'une fouille méthodique et non d'une supposition :

- **§D** : aucune implémentation publique (client, émulateur, bot, module FM) ne contient la
  formule SC/SN/EC. Les modules FM communautaires (SmithMagic d'ExiTeD) sont des
  **surcouches d'affichage** au-dessus du module Ankama : ils lisent des poids et calculent
  un puits, ils ne calculent pas de probabilité.
- **§E** : aucune fonction publique de type `removeRandomStat` / `selectLoss` ne reconstruit
  la loi de sélection de la ligne perdue.
- **§F/§H·6** : la table de densités unitaires **n'est exposée par aucune API de
  datamining** ; elle est dérivée par la communauté. Confirmé indépendamment le 2026-09-08.

Ces trois résultats justifient l'architecture du projet (couche probabiliste paramétrable) et
**ne sont pas remis en cause** par les sources du 10/09/2026.

## Ce qui devient caduc

L'observation S2 (D1 et D3) montre que le client Unity **affiche** le reliquat avec ses
décimales, et journalise chaque tentative avec les mentions `+ reliquat` / `- reliquat`.

En conséquence :

1. La conclusion « le simulateur ne peut pas *lire* le reliquat, il ne peut qu'observer son
   sens de variation » décrit **le protocole 2.x**, et **n'est plus la contrainte pertinente
   pour Unity**.
2. Le chemin de collecte recommandé par S4 (sniffing protobuf, dump IL2CPP) **n'est plus
   nécessaire pour le reliquat**. Il reste pertinent pour les zones que l'écran n'expose pas :
   noms de messages, valeurs d'enum, emplacement de la table de poids dans le client,
   probabilités affichées ou non.
3. La zone inconnue §H·5 (« formule exacte de calcul du reliquat côté serveur ») est
   **partiellement close** : la formule `puits = (puits + poids des pertes) − poids de la
   rune` est vérifiée deux fois en Unity (S2). Ce qui reste inconnu, c'est la **règle de
   consommation** (anomalie A1), pas la règle de création.

Aucune de ces révisions ne se fait au détriment de S4 : le document annonçait lui-même son
seuil de décision — *« si le sniffing révèle un champ numérique de reliquat […], réviser la
conclusion »*. L'écran a fait mieux que le sniffing.

## Rôle dans la hiérarchie

**R4** pour tout ce qui touche l'outillage, le protocole et les dépôts : c'est la meilleure
carte technique du corpus, et rien ne la remplace.
**R6 (périmé)** pour ses affirmations sur ce que le client expose : sur ce point précis, S2
(R1) tranche contre lui.
