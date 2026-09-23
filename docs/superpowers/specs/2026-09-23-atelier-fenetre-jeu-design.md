# Refonte de l'atelier : « fenêtre façon jeu » et palette de runes

Date : 2026-09-23 · Statut : validé par Yanis (sections 1 et 2), en attente de relecture de la spec.

## 1. Constat (état avant refonte)

- Trois colonnes (`AtelierPage.tsx`) : jauges à gauche (Crucible, BudgetScale, SessionCost,
  ~1 000 px de haut, surtout vides), objet au centre (un tiers de l'écran), panneau
  « Frapper » à droite, Livre de forge pleine largeur en bas.
- Paragraphes explicatifs permanents sous chaque bloc ; ils pèsent autant que les chiffres.
- Tenter une rune = trois zones (ligne au centre → palier à droite → bouton plus bas).
- Exo = `<select>` texte (~50 caractéristiques, sans icône) + bouton « Créer la ligne » +
  palier + tenter : quatre étapes. En jeu, un exo n'est que la pose d'une rune d'une
  caractéristique absente.
- Orbe / Transcendance / Potion : onglets séparés du panneau « Frapper ».

## 2. Objectif

Une page plus propre, proche du geste en jeu, rapide à exécuter à la souris comme au
clavier. **Refonte purement présentationnelle** : aucun changement du moteur
(`src/logic/`), de `useAtelier`, de `empirical_params.json` ni des statuts épistémiques.

## 3. Structure

```
┌──────────────┬───────────────────────────────┬──────────────────┐
│ Historique│Budget│Coût │ [img] Nom · niv · % · Reliquat ▮▮▯ │ 🔍 filtrer…      │
│ (liste compacte)│ Annuler Rétablir ⋯           │ Sur l'objet      │
│                 │ lignes de l'objet             │ Spéciales ✦      │
│                 │ ▶ ligne visée [+5][+15][+50]  │ …familles…       │
│                 │ slot : rune · barre SC/SN/EC  │ Objets FM        │
│                 │ [ Fusionner ␣ ]  Forcer SC SN EC │ (Orbe, Transc., Potion) │
└──────────────┴───────────────────────────────┴──────────────────┘
```

- **≥ 1 280 px** : trois colonnes `260px | 1fr | 300px`.
- **1 024–1 279 px** : enclume + palette côte à côte, panneau d'onglets en dessous.
- **< 1 024 px** : une colonne — enclume, palette (repliable), onglets.

### 3.1 Colonne gauche : `SidePanel` (nouveau)
Onglets `Historique · Budget · Coût`.
- *Historique* : `ForgeLog` en variante compacte (une ligne par frappe : pastille
  SC/SN/EC colorée, rune, pertes, reliquat après). « Vider » reste disponible.
- *Budget* : `BudgetScale` sans ses paragraphes (→ `InfoTip`).
- *Coût* : `SessionCost` sans ses paragraphes (→ `InfoTip`).

### 3.2 Centre : `ItemSlab` allégé
- En-tête : image, nom, niveau, qualité du jet, **reliquat en jauge horizontale compacte**
  (`Crucible` en variante `compact`, animation d'événement conservée, badge de statut
  conservé).
- Barre d'outils : Annuler, Rétablir, puis un menu `⋯` regroupant Forger/Ajuster, Objet
  neuf, Sauvegarder dans la vitrine, Tout au max, Tout au min, Jet aléatoire.
- Lignes (`ItemLine`) : inchangées sur le fond ; la ligne visée affiche en plus ses paliers.
- **Slot** (`ForgeSlot`, nouveau, extrait d'`ActionPanel`) sous les lignes : icône de la
  rune choisie, `OutcomeEstimate` en barre, note de borne over/exo, bouton **Fusionner**,
  rangée Forcer SC/SN/EC. Pour Orbe/Transcendance, le slot affiche l'action
  correspondante à la place.

### 3.3 Colonne droite : `RunePalette` (nouveau, remplace `ExoPicker` et les onglets)
- Champ de filtre (texte, insensible aux accents) en tête ; `/` le focalise.
- **Une tuile par caractéristique** (`RuneIcon` + nom court + densité en infobulle),
  pour toutes les caractéristiques de `CHARACTERISTICS_WITH_RUNES` ayant une densité.
- Groupes, dans l'ordre : *Sur l'objet* ; puis les familles `CATEGORY_LABELS`
  (`special` en premier, marqué ✦ quand `isHeavyExo(cid, true, probabilityParams)` (logic/probability/heavyRegime.ts) est vrai) ; enfin
  *Objets FM* : Orbe, Transcendance (active seulement si la ligne visée en a une), Potion
  (désactivée, badge `CONTRADICTION`).
- Tuile d'une caractéristique absente : liseré turquoise `exo` (--color-exo).
- Objet transcendé ou mode Ajuster : les tuiles de runes sont désactivées avec la même
  raison qu'aujourd'hui (message dans le slot). En mode Ajuster, cliquer une tuile absente
  ajoute l'exo à 0 (comportement actuel de l'`ExoPicker` d'`ItemSlab`).

## 4. Interactions

| Geste | Effet |
|---|---|
| Clic tuile présente | `selectLine(cid)` |
| Clic tuile absente (mode Forger) | `addExo(cid)` puis `selectLine(cid)` |
| Viser une autre ligne alors qu'un exo créé est encore à 0 | `removeExo` de cet exo (nettoyage d'interface, pas une règle du jeu) |
| Clic palier dans la ligne visée | sélectionne le palier ; **2ᵉ clic sur le même palier = Fusionner** |
| `↑` / `↓` | ligne précédente / suivante (lignes forgeables) |
| `1` `2` `3` | palier 1/2/3 s'il existe |
| `Espace` | Fusionner (= `attemptRune`) |
| `/` | focus du filtre de la palette |
| `Ctrl+Z` / `Ctrl+Y` | annuler / rétablir (existant) |
| `?` | aide des raccourcis |

Les raccourcis sont ignorés quand le focus est dans un `input`, `textarea`, `select` ou un
élément `contenteditable`, et quand une touche modificatrice autre que Ctrl (pour Z/Y) est
enfoncée. Hook dédié : `useForgeShortcuts`.

Le palier choisi est remonté d'`ActionPanel` vers `AtelierPage` (état partagé entre
`ItemLine`, `ForgeSlot` et les raccourcis).

## 5. Prévision : `OutcomeEstimate` en barre

- Forme `point` : barre empilée SC/SN/EC (largeurs = probabilités), chiffres dessous.
- Forme `interval` : deux barres fines empilées, « meilleure création » (`best`) et
  « pire création » (`worst`) ; chiffres « a – b » dessous. (Remplace la zone hachurée
  envisagée : deux triplets complets sont plus lisibles et ne suggèrent pas de loi entre
  les bornes, qui est INCONNUE.)
- Badge du modèle (`ModelBadge`) et `StatusBadge` conservés, visibles.
- Paragraphes (note d'intervalle, note exo lourd, « estimation d'un modèle paramétré ») →
  `InfoTip` à côté du badge. Le texte est conservé mot pour mot.
- `data-testid` existants conservés (`point-triplet`, `interval-ranges`, `range-sc`,
  `range-sn`, `range-ec`, `interval-note`, `heavy-exo-note`) ; les notes restent dans le
  DOM (contenu de l'`InfoTip`) pour que `OutcomeEstimate.test.tsx` passe sans
  modification de fond.

## 6. Règle épistémique appliquée à l'interface

Alléger ≠ supprimer. Tout badge de statut visible aujourd'hui reste visible ; seuls les
paragraphes explicatifs passent derrière `(?)`. Aucun texte d'avertissement n'est
supprimé.

## 7. Fichiers

- Nouveaux : `components/atelier/RunePalette.tsx`, `components/atelier/ForgeSlot.tsx`,
  `components/atelier/SidePanel.tsx`, `hooks/useForgeShortcuts.ts`.
- Modifiés : `pages/AtelierPage.tsx`, `ItemSlab.tsx`, `ItemLine.tsx`,
  `OutcomeEstimate.tsx`, `ForgeLog.tsx`, `Crucible.tsx`, `BudgetScale.tsx`,
  `SessionCost.tsx`.
- Supprimés : `ActionPanel.tsx`, `ExoPicker.tsx` (contenu
  redistribué, historique git conservé).

## 8. Tests

- `OutcomeEstimate.test.tsx` : doit rester vert.
- Nouveaux : `RunePalette` (regroupement, filtre sans accents, tuile absente → callbacks
  `addExo` + `selectLine`, potion désactivée) ; `useForgeShortcuts` (ignoré dans un
  champ, `1/2/3`, `Espace`) ; nettoyage de l'exo à 0 au changement de cible.
- Vérification visuelle via le serveur Vite à 1 440, 1 100 et 390 px de large.

## 9. Hors périmètre

Pages Vitrine, Monte Carlo, Savoir, tiroir Paramètres ; thème « Forge de nuit » (tokens
de `theme.css` réutilisés tels quels) ; drag-and-drop de rune (possible plus tard).
