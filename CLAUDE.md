# CLAUDE.md — Simulateur de Forgemagie DOFUS 3 / DOFUS Unity

## Objectif du projet

Reproduire aussi fidèlement que possible la logique **serveur** de la Forgemagie de DOFUS 3 (DOFUS Unity, 2026). Ce n'est pas un calculateur de poids simplifié ni un guide : c'est une reconstruction traçable et scientifiquement défendable, couvrant le calcul du poids, le reliquat/puits, l'action des runes, les résultats SC/SN/EC, la sélection des pertes, l'over/exo/overmax, les potions, les orbes régénérants, les runes de transcendance et le brisage.

## Règles épistémiques (non négociables)

1. **Aucune information n'est une vérité absolue sans preuve suffisante.**
2. Toute règle, valeur ou formule utilisée dans le code ou la documentation porte un statut explicite :
   - `SOURCE PRIMAIRE` — devblog/changelog Ankama, interface du jeu, données extraites du client.
   - `MODÈLE EMPIRIQUE` — estimé à partir de données expérimentales reproductibles (N documenté).
   - `HYPOTHÈSE COMMUNAUTAIRE` — affirmation de guides/forums non vérifiée.
   - `CONTRADICTION` — sources fiables en désaccord, non tranché.
   - `INCONNU` — aucune source ; valeur choisie arbitrairement pour faire tourner la simulation.
3. **Ne jamais inventer une formule.** Ne jamais présenter une hypothèse comme un fait. Si une valeur est nécessaire mais inconnue, la placer dans `empirical_params.json` avec le statut `INCONNU` et une note, jamais en dur dans le code.
4. Signaler explicitement les contradictions et incertitudes, dans le code (commentaires) et dans `docs/`.
5. Ne pas mélanger DOFUS 3 / Unity avec DOFUS Retro, Dofus Touch ou les versions 2.x sans le préciser. Les tables de poids 1.29 / Touch / 2.x sont des **sources historiques**, pas des données Unity.
6. Un comportement observé dans le client, un émulateur ou un bot n'est **jamais** une preuve du serveur officiel.

## Ce qui est établi (voir `docs/knowledge/` pour les détails et sources)

- Poids/densité des runes visibles dans l'infobulle en jeu depuis la 2.58 → `SOURCE PRIMAIRE` (à réextraire depuis DofusDB/DDC/client, et à distinguer de `realWeight` et de `weight`).
- Reliquat = perte − rune, purgé à l'équipement/HDV → confirmation communautaire (JeuxOnLine), formule serveur exacte `INCONNU`.
- Règles des runes de transcendance → devblog 2.72 (`SOURCE PRIMAIRE`).
- Formule de brisage → dépôts open source (`KamelAkar/Calculateur_Brisage_Dofus`, `Icksir/crushing-calculator`), à recouper.
- Bornes officielles SC : minimum 15 % en FM normale, jusqu'à 1 % pour exo PA/PM/PO (`SOURCE PRIMAIRE`).
- Orbes régénérants : reset à un jet de craft aléatoire, purge over/exo/reliquat (`HYPOTHÈSE COMMUNAUTAIRE`, à confirmer).

## Ce qui est INCONNU ou CONTRADICTOIRE

- **Formule de probabilité SC/SN/EC** : côté serveur, jamais publiée. Aucun dépôt public ne l'implémente. → modèle paramétrable uniquement.
- **Loi de sélection de la ligne perdue** (uniforme / ∝ poids / ∝ valeur×poids / ∝ déficit) → `INCONNU`.
- **Formule exacte du reliquat côté serveur** → `INCONNU`.
- **Table des poids unitaires par caractéristique** : dérivée par la communauté, pas de champ dédié confirmé dans DofusDB → à extraire du client.
- **Taux des potions élémentaires** : 50/65/80 % vs 85 % post-3.1 → `CONTRADICTION`, à trancher par datamining avant de coder le module potions.
- Le PDF `Algorithme_Forgemagie_DOFUS_3.pdf` (non inclus dans le dépôt ; audité dans `docs/knowledge/audit-forgemagie-dofus3.md`) est un **document d'hypothèses** : ses formules φ/Ω/D sont inventées, ses potions 100/85/50 % sont fausses, ses datasets expérimentaux sont invérifiables. Ne rien en reprendre sans source indépendante.

## Architecture imposée

Pipeline de référence :

```
Item → État des caractéristiques → Calcul du poids → Calcul du reliquat
→ Détermination de l'action de la rune → Calcul SC/SN/EC (modèle paramétrable)
→ Application du résultat → Sélection des pertes (modèle configurable)
→ Mise à jour du reliquat → Mise à jour de l'objet
```

Séparation stricte en deux couches :

- **Règles certaines** (`SOURCE PRIMAIRE`) : codées en dur, couvertes par des tests unitaires.
- **Modèles empiriques / inconnus** : lus depuis `empirical_params.json`, jamais en dur. Chaque entrée a : `value`, `status`, `source`, `note`, `bounds` (min/max), `default`. L'interface expose ces paramètres dans un panneau « Paramètres avancés » avec import/export de profils, pour tester les propositions de joueurs expérimentés.

Les modèles alternatifs (ex. plusieurs lois de sélection des pertes) sont implémentés comme des stratégies interchangeables sélectionnées par la configuration, pas par des `if` dispersés.

## Données de référence

- Sources : DofusDB (`api.dofusdb.fr`), DDC (Dofus-Batteries-Included), doduda. Toutes sont des **données dataminées tierces**, non officielles.
- Le dataset (items, runes, potions, orbes) est figé localement, versionné, avec la version du jeu et la date d'extraction. Chaque champ utilisé est documenté avec sa provenance.
- Ne jamais confondre `weight` (pods), `realWeight` (poids brisage/économie) et la densité FM.

## Conventions de travail

- Répondre et documenter en français ; identifiants de code en anglais.
- Avant toute modification structurante, produire un constat, puis proposer, puis attendre validation.
- Tout changement d'une valeur à statut épistémique doit mettre à jour `docs/knowledge/` et `empirical_params.json` de façon cohérente.
- Ne pas supprimer les documents existants dans `docs/` : les archiver dans `docs/archive/` si obsolètes.
- Tests unitaires obligatoires sur les règles certaines (brisage, transcendance, reliquat).

## Documents à lire en premier

- `docs/knowledge/audit-forgemagie-dofus3.md` — audit du PDF, ce qui est réfuté/confirmé.
- `docs/knowledge/Reconstruction_of_the_DOFUS_3_Unity_Forgemagie_Algorithm__2026_V.md` — rapport de vérification en 17 sections.
- `docs/knowledge/Reverse-Engineering_DOFUS_3_Unity_Forgemagie__Technical_Mapping__1_.md` — protocole, datamining, sources techniques.
