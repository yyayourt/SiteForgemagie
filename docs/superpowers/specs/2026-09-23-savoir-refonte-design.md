# Refonte de la page « Savoir » : Comprendre · Dossier

Date : 2026-09-23 · Statut : validé par Yanis (sections 1 et 2, exécution enchaînée).
Source de contenu unique : `docs/superpowers/specs/2026-09-23-savoir-faits.md` (fiche de faits sourcés).

## 1. Constat

- `KnowledgePage.tsx` : ~25 000 px de haut, aucun sommaire. Chaque section = 2-3 paragraphes
  puis un tableau de paramètres dont chaque ligne porte une note de provenance de recherche.
  Le tableau des densités fait plusieurs écrans.
- Aucun exemple concret, aucun schéma : le mécanisme reste abstrait.
- Prose de `src/content/knowledge.ts` partiellement périmée (exo lourd, plancher 1 %, SN, etc. —
  liste exacte dans la fiche de faits, section « Prose périmée »).

## 2. Objectif

Deux onglets : **Comprendre** (joueurs : expliquer le mécanisme) et **Dossier** (contributeurs :
paramètres, sources, inconnus). Même sommaire latéral collant dans les deux. Aucun changement de
`empirical_params.json`, du moteur (`src/logic/`), de `useAtelier` ni de `src/state/`.

## 3. Structure

### 3.1 En-tête (commun)
Titre « Ce que l'on sait, et comment on le sait », une phrase d'intro, légende des 5 statuts
(repliable, `<details>` ouvert par défaut sur grand écran), versions (paramètres, dataset),
onglets `Comprendre · Dossier` (`role="tablist"`).

Onglet dans l'URL : `#savoir` = Comprendre, `#savoir/dossier` = Dossier. `App.tsx` :
`pageFromHash` lit le premier segment (`h.split('/')[0]`) ; la page lit le second.

### 3.2 Sommaire latéral (`KnowledgeToc`)
≥ 1024 px : colonne gauche 220 px, `sticky`, liens d'ancre, section courante surlignée
(IntersectionObserver). < 1024 px : sommaire replié en `<details>` en haut du contenu.

### 3.3 Onglet Comprendre (`UnderstandTab`)
0. **Le parcours d'une rune** (`RunePathDiagram`) : 5-6 étapes cliquables (liens vers les
   sections) — contenu : fiche § « Parcours d'une rune ».
1-8. Une section par thème : Poids · Chances · Pertes et reliquat · Over et exo · Transcendance ·
   Jet de craft et orbes · Brisage · Potions. Ossature identique :
   - **En bref** (puces) ;
   - **Comment ça marche** (étapes numérotées) ;
   - **Exemple** (encadré ; observation datée + fichier + badge ; « Aucun exemple documenté »
     s'il n'y en a pas) ;
   - **Sûr / Pas sûr** (deux colonnes, chaque ligne avec son `StatusBadge`) ;
   - lien **« Voir le dossier »** → `#savoir/dossier` + ancre de la section de paramètres.
9. **Glossaire** : liste de définitions (`<dl>`), ancres par terme.

Règle de contenu : tout texte vient de la fiche de faits. Les puces et exemples portent leur statut.
Quand un chiffre est un paramètre, il est lu en direct (`readParam(path, overrides)`) et suivi de
son badge, pas écrit en dur.

### 3.4 Onglet Dossier (`DossierTab`)
- Champ de recherche (insensible aux accents) filtrant les lignes de tous les tableaux par
  libellé, chemin, note et source.
- Une section par groupe du registre (`SECTION_ORDER`, puis tout groupe restant), titre
  `SECTION_LABELS`. Densités groupées par famille (`getStatCategory` / `CATEGORY_LABELS`).
- `ParamTable` : colonnes Règle · Valeur · Statut ; clic sur une ligne → déplie note, source,
  bornes, défaut (`<details>` par ligne ou bouton `aria-expanded`). Mention « profil actif »
  conservée quand la valeur diffère du fichier.
- Listes des potions et orbes du dataset conservées dans leurs sections.
- **Aide-nous à mesurer** : une carte par paramètre `INCONNU` ou `CONTRADICTION`
  (générée depuis le registre, donc exhaustive) : libellé, badge, valeur actuelle, « Ce qu'il
  faudrait observer » = texte de la fiche (table `MEASUREMENTS` par chemin), sinon la note du
  paramètre, sinon « protocole non documenté ». Puis les notes hors paramètres (`PARAM_NOTES`).

## 4. Fichiers

- `src/content/knowledge.ts` : réécrit — `UNDERSTAND_SECTIONS` (id, title, brief[], steps[],
  example | null, certain[], uncertain[], dossierSections[]), `RUNE_PATH`, `MEASUREMENTS`
  (chemin → texte). Items de liste = `{ text, status, source }` ; un item peut référencer un
  paramètre (`param?: string`) dont la valeur est lue en direct.
- `src/content/glossary.ts` : `GLOSSARY` (`{ id, term, definition, status? }`).
- `src/pages/KnowledgePage.tsx` : en-tête + onglets + orchestration.
- `src/components/knowledge/` : `KnowledgeToc.tsx`, `UnderstandTab.tsx`, `DossierTab.tsx`,
  `ParamTable.tsx`, `RunePathDiagram.tsx`, `MeasureCards.tsx`.
- `src/App.tsx` : `pageFromHash` sur le premier segment.

## 5. Tests

- Contenu : chaque section de `UNDERSTAND_SECTIONS` a brief, steps, certain ou uncertain non
  vides, `dossierSections` existant dans le registre ; tout `param` référencé existe
  (`PARAM_BY_PATH`) ; chaque item a un statut valide.
- `MeasureCards` : autant de cartes que de paramètres INCONNU/CONTRADICTION du registre.
- `DossierTab` : la recherche filtre (sans accents) et affiche « aucun résultat » si vide.
- `KnowledgePage` : onglet selon le hash ; clic onglet change le hash.
- Vérification visuelle 1440 / 390 px, console sans erreur.

## 6. Hors périmètre
Valeurs et statuts des paramètres ; `docs/knowledge/` (on lit, on ne modifie pas) ; autres pages.
