# Page Savoir « Comprendre · Dossier » — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la page « Savoir » (un long mur de texte + tableaux) par deux onglets, Comprendre (pédagogique, sections à ossature fixe, schéma, exemples, glossaire) et Dossier (paramètres repliables, recherche, « Aide-nous à mesurer »), avec sommaire latéral.

**Architecture:** Contenu typé dans `src/content/` (transcrit de la fiche de faits, rien d'autre), composants dans `src/components/knowledge/`, page d'orchestration `src/pages/KnowledgePage.tsx`. Les tableaux restent générés depuis `PARAM_REGISTRY` (empirical_params.json) ; les chiffres cités en prose sont lus en direct par chemin de paramètre.

**Tech Stack:** React 19, TypeScript 5.9, Tailwind 4 (tokens `src/styles/theme.css`), Vitest 4 + @testing-library/react + jsdom.

**Spec:** `docs/superpowers/specs/2026-09-23-savoir-refonte-design.md`
**Source de contenu unique :** `docs/superpowers/specs/2026-09-23-savoir-faits.md` (fiche de faits sourcés)

## Global Constraints

- Aucun changement dans `empirical_params.json`, `src/logic/`, `src/hooks/useAtelier.ts`, `src/state/`, `docs/knowledge/`.
- Aucun texte de contenu inventé : toute phrase de `src/content/knowledge.ts` et `glossary.ts` vient de la fiche de faits (reformulation courte permise, sens et statut inchangés). Aucune formule, valeur ou exemple ajouté.
- Chaque item affiché porte son statut (`StatusBadge`). `POLITIQUE` n'est pas un statut : un item « politique » prend le statut du paramètre concerné et mentionne « choix de projet » dans le texte.
- Un chiffre qui est un paramètre est lu en direct (`readParam(path, overrides)`), pas écrit en dur, sauf dans un exemple d'observation daté où il est la donnée observée.
- Textes en français ; identifiants en anglais ; classes Tailwind écrites en toutes lettres.
- Tests de composants : `// @vitest-environment jsdom` en tête, `afterEach(cleanup)` ; les composants qui appellent `useParams()` sont rendus sous `<ParamsProvider>` (`src/app/ParamsProvider.tsx`).
- Commandes : `npx vitest run <fichier>`, `npx tsc -b`, `npm run lint`. Serveur de dev déjà lancé sur http://localhost:5199.
- Commits terminés par une ligne vide puis `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

---

### Task 1: Modèle de contenu et contenu transcrit

**Files:**
- Rewrite: `src/content/knowledge.ts`
- Create: `src/content/glossary.ts`
- Test: `src/__tests__/content/knowledge.test.ts`

**Interfaces (Produces):**

```ts
// src/content/knowledge.ts
import type { EpistemicStatus } from '../data/params';

/** Une affirmation affichée : texte court + statut + source (chemin de fichier ou de paramètre). */
export interface KnowledgeItem {
  text: string;
  status: EpistemicStatus;
  source: string;
  /** Paramètre dont la valeur est affichée en direct après le texte (ex. 'densities.11') */
  param?: string;
}

export interface KnowledgeExample {
  title: string;          // ex. « Cape Bouffante, 2026-09-08 »
  lines: string[];        // les données observées, telles que documentées
  status: EpistemicStatus;
  source: string;         // ex. « data/observations/observations.json, captures 2026-09-08 »
  params?: string[];      // chemins de paramètres utilisés dans le calcul, lus en direct
}

export interface UnderstandSection {
  id: 'poids' | 'chances' | 'pertes' | 'over-exo' | 'transcendance' | 'craft-orbes' | 'brisage' | 'potions';
  title: string;
  brief: KnowledgeItem[];     // 2 à 4
  steps: KnowledgeItem[];     // 2 à 5
  example: KnowledgeExample | null; // null = « Aucun exemple documenté »
  certain: KnowledgeItem[];
  uncertain: KnowledgeItem[];
  /** Sections du registre (ParamDescriptor.section) à ouvrir dans le Dossier */
  dossierSections: string[];
}

export interface RunePathStep { label: string; detail: string; sectionId: UnderstandSection['id'] }

export const UNDERSTAND_SECTIONS: UnderstandSection[];
export const RUNE_PATH: RunePathStep[];
/** Chemin de paramètre → « ce qu'il faudrait observer en jeu » (fiche § Aide-nous à mesurer) */
export const MEASUREMENTS: Record<string, string>;

// src/content/glossary.ts
export interface GlossaryEntry { id: string; term: string; definition: string; status?: EpistemicStatus }
export const GLOSSARY: GlossaryEntry[];
```

Transcription (source = fiche de faits) :
- Sections 1 → 8 de la fiche → `UNDERSTAND_SECTIONS` dans cet ordre, ids ci-dessus. « En bref » → `brief`, « Comment ça marche » → `steps`, « Exemple » → `example`, « Sûr » → `certain`, « Pas sûr » → `uncertain`, « Paramètres liés » → `dossierSections` (noms de sections du registre ; `over-exo` inclut `overCap`, `objectNonNaturalCap` et `probability`).
- Mise en forme : phrases courtes pour joueurs, **sans** les références de ligne (`EP:1557`, `S2:50`…) dans `text` ; la référence lisible va dans `source` (ex. « observation en jeu 2026-09-10 (docs/knowledge/sources/S2) », « devblog 2.58 », « paramètre params.probability.snSplit »). Quand une puce de la fiche cumule deux statuts, choisir le plus faible (ordre : INCONNU < CONTRADICTION < HYPOTHÈSE COMMUNAUTAIRE < MODÈLE EMPIRIQUE < SOURCE PRIMAIRE) et le dire dans le texte si utile.
- Valeurs de paramètres dans `text` : remplacer le nombre par `param` (ex. text « Vitalité : », param `densities.11`). Constantes du moteur non paramétrables (15 %, 1 %) : écrites en clair (elles sont SOURCE PRIMAIRE et codées en dur).
- « Parcours d'une rune » de la fiche → `RUNE_PATH` (5-6 étapes). « Glossaire » → `GLOSSARY` (ids en kebab-case). « Aide-nous à mesurer » → `MEASUREMENTS` : une entrée par chemin qui a un protocole documenté (texte de la fiche) ; ceux « protocole non documenté » ne sont pas mis (le composant affichera la mention).
- Ignorer la section « Prose périmée » (elle sert à ne pas reprendre l'ancien texte).

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/content/knowledge.test.ts
import { describe, it, expect } from 'vitest';
import { UNDERSTAND_SECTIONS, RUNE_PATH, MEASUREMENTS } from '../../content/knowledge';
import { GLOSSARY } from '../../content/glossary';
import { PARAM_BY_PATH, PARAM_REGISTRY } from '../../data/paramRegistry';

const STATUSES = ['SOURCE PRIMAIRE', 'MODÈLE EMPIRIQUE', 'HYPOTHÈSE COMMUNAUTAIRE', 'CONTRADICTION', 'INCONNU'];
const REGISTRY_SECTIONS = new Set(PARAM_REGISTRY.map((d) => d.section));

describe('contenu Comprendre', () => {
  it('huit sections dans l’ordre prévu', () => {
    expect(UNDERSTAND_SECTIONS.map((s) => s.id)).toEqual(['poids', 'chances', 'pertes', 'over-exo', 'transcendance', 'craft-orbes', 'brisage', 'potions']);
  });

  it.each(UNDERSTAND_SECTIONS.map((s) => [s.id, s] as const))('%s : ossature complète', (_id, s) => {
    expect(s.brief.length).toBeGreaterThanOrEqual(2);
    expect(s.brief.length).toBeLessThanOrEqual(4);
    expect(s.steps.length).toBeGreaterThanOrEqual(2);
    expect(s.certain.length + s.uncertain.length).toBeGreaterThan(0);
    expect(s.dossierSections.length).toBeGreaterThan(0);
    for (const sec of s.dossierSections) expect(REGISTRY_SECTIONS.has(sec)).toBe(true);
  });

  it('chaque item a un statut valide, une source, et un paramètre existant s’il en cite un', () => {
    const items = UNDERSTAND_SECTIONS.flatMap((s) => [...s.brief, ...s.steps, ...s.certain, ...s.uncertain]);
    for (const it of items) {
      expect(STATUSES).toContain(it.status);
      expect(it.source.length).toBeGreaterThan(0);
      expect(it.text).not.toMatch(/\b(EP|ERR|ANA|S1|S2|REC|OBS):\d/); // pas de références de ligne brutes
      if (it.param) expect(PARAM_BY_PATH.has(it.param)).toBe(true);
    }
    for (const s of UNDERSTAND_SECTIONS) {
      if (!s.example) continue;
      expect(STATUSES).toContain(s.example.status);
      for (const p of s.example.params ?? []) expect(PARAM_BY_PATH.has(p)).toBe(true);
    }
  });

  it('parcours d’une rune : 5 à 6 étapes pointant vers des sections existantes', () => {
    expect(RUNE_PATH.length).toBeGreaterThanOrEqual(5);
    expect(RUNE_PATH.length).toBeLessThanOrEqual(6);
    const ids = new Set(UNDERSTAND_SECTIONS.map((s) => s.id));
    for (const step of RUNE_PATH) expect(ids.has(step.sectionId)).toBe(true);
  });

  it('mesures : clés = paramètres INCONNU ou CONTRADICTION du registre', () => {
    for (const path of Object.keys(MEASUREMENTS)) {
      const d = PARAM_BY_PATH.get(path);
      expect(d, path).toBeDefined();
      expect(['INCONNU', 'CONTRADICTION']).toContain(d!.entry.status);
    }
  });
});

describe('glossaire', () => {
  it('12 à 20 termes, ids uniques, définitions non vides', () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(12);
    expect(GLOSSARY.length).toBeLessThanOrEqual(20);
    expect(new Set(GLOSSARY.map((g) => g.id)).size).toBe(GLOSSARY.length);
    for (const g of GLOSSARY) expect(g.definition.length).toBeGreaterThan(10);
  });
});
```

- [ ] **Step 2: Run to see it fail** — `npx vitest run src/__tests__/content/knowledge.test.ts` → FAIL (exports manquants).
- [ ] **Step 3: Write the content** (transcription ci-dessus). L'ancien `KNOWLEDGE_SECTIONS` est supprimé ; `KnowledgePage.tsx` l'importe encore → le laisser compiler en ajoutant temporairement `export const KNOWLEDGE_SECTIONS = [] as { id: string; title: string; paramSections: string[]; prose: string[]; certain?: string[] }[];` marqué `// TEMPORAIRE : supprimé en Task 5` (la page n'affichera que le tableau des inconnus d'ici là).
- [ ] **Step 4: Run to see it pass** — même commande → PASS ; puis `npx tsc -b`, `npm run lint`, `npx vitest run`.
- [ ] **Step 5: Commit** — `git commit -m "Savoir : contenu Comprendre transcrit de la fiche de faits, glossaire, mesures"`

---

### Task 2: Routage `#savoir/dossier`, coquille de page, onglets, sommaire

**Files:**
- Modify: `src/App.tsx` (`pageFromHash`)
- Create: `src/components/knowledge/KnowledgeToc.tsx`
- Create: `src/components/knowledge/knowledgeTab.ts`
- Test: `src/__tests__/components/knowledgeTab.test.ts`, `src/__tests__/components/KnowledgeToc.test.tsx`

**Interfaces (Produces):**

```ts
// src/components/knowledge/knowledgeTab.ts
export type KnowledgeTab = 'comprendre' | 'dossier';
/** '#savoir' | '#savoir/comprendre' → 'comprendre' ; '#savoir/dossier…' → 'dossier' */
export function tabFromHash(hash: string): KnowledgeTab;
export function hashForTab(tab: KnowledgeTab, anchor?: string): string; // '#savoir' | '#savoir/dossier' (+ '/' + anchor)
/** Ancre éventuelle : '#savoir/dossier/probability' → 'probability' */
export function anchorFromHash(hash: string): string | null;

// src/components/knowledge/KnowledgeToc.tsx
export interface TocEntry { id: string; label: string }
export function KnowledgeToc(props: { entries: TocEntry[]; activeId: string | null; onNavigate: (id: string) => void }): JSX.Element;
/** Hook : id de la section visible (IntersectionObserver sur document.getElementById(id)) */
export function useActiveSection(ids: string[]): string | null;
```

- `App.tsx` : `pageFromHash` → `const h = window.location.hash.replace('#', '').split('/')[0];` (reste inchangé). Vérifier que `navigate('savoir')` écrit toujours `#savoir`.
- `KnowledgeToc` : `<nav aria-label="Sommaire">` ; ≥ 1024 px `lg:sticky lg:top-4` liste de boutons stylés en lien (`aria-current="true"` sur l'actif, style `text-molten-text`) ; < 1024 px enveloppé dans `<details>` « Sommaire ». `onNavigate` appelle `document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })` dans la page.
- `useActiveSection` : IntersectionObserver (`rootMargin: '0px 0px -70% 0px'`) ; si `IntersectionObserver` est absent (jsdom), renvoie le premier id.

- [ ] **Step 1: Failing tests**

```ts
// src/__tests__/components/knowledgeTab.test.ts
import { describe, it, expect } from 'vitest';
import { anchorFromHash, hashForTab, tabFromHash } from '../../components/knowledge/knowledgeTab';

describe('onglets Savoir dans le hash', () => {
  it('lit l’onglet', () => {
    expect(tabFromHash('#savoir')).toBe('comprendre');
    expect(tabFromHash('#savoir/comprendre')).toBe('comprendre');
    expect(tabFromHash('#savoir/dossier')).toBe('dossier');
    expect(tabFromHash('#savoir/dossier/probability')).toBe('dossier');
    expect(tabFromHash('')).toBe('comprendre');
  });
  it('écrit l’onglet et l’ancre', () => {
    expect(hashForTab('comprendre')).toBe('#savoir');
    expect(hashForTab('dossier')).toBe('#savoir/dossier');
    expect(hashForTab('dossier', 'probability')).toBe('#savoir/dossier/probability');
  });
  it('lit l’ancre', () => {
    expect(anchorFromHash('#savoir/dossier/probability')).toBe('probability');
    expect(anchorFromHash('#savoir/dossier')).toBeNull();
  });
});
```

```tsx
// @vitest-environment jsdom
// src/__tests__/components/KnowledgeToc.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { KnowledgeToc } from '../../components/knowledge/KnowledgeToc';

afterEach(cleanup);

describe('KnowledgeToc', () => {
  it('marque l’entrée active et navigue au clic', () => {
    const onNavigate = vi.fn();
    render(<KnowledgeToc entries={[{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Bêta' }]} activeId="b" onNavigate={onNavigate} />);
    const links = screen.getAllByRole('button', { name: 'Bêta' });
    expect(links[0].getAttribute('aria-current')).toBe('true');
    fireEvent.click(screen.getAllByRole('button', { name: 'Alpha' })[0]);
    expect(onNavigate).toHaveBeenCalledWith('a');
  });
});
```

(Les entrées du sommaire sont des `<button>` stylés en lien : un `<a href="#id">` casserait le routeur par hash de `App.tsx`.)

- [ ] **Step 2: See them fail.** **Step 3: Implement.** **Step 4: See them pass** + `npx tsc -b`, `npm run lint`.
- [ ] **Step 5: Commit** — `git commit -m "Savoir : onglets dans le hash, sommaire lateral"`

---

### Task 3: Onglet Dossier (tableaux repliables, recherche, mesures)

**Files:**
- Create: `src/components/knowledge/ParamTable.tsx`
- Create: `src/components/knowledge/DossierTab.tsx`
- Create: `src/components/knowledge/MeasureCards.tsx`
- Create: `src/components/knowledge/dossierModel.ts`
- Test: `src/__tests__/components/dossierModel.test.ts`, `src/__tests__/components/DossierTab.test.tsx`

**Interfaces (Produces):**

```ts
// src/components/knowledge/dossierModel.ts
import type { ParamDescriptor } from '../../data/paramRegistry';
export interface DossierGroup { id: string; label: string; items: ParamDescriptor[] }
/** Groupes dans l'ordre SECTION_ORDER puis les sections restantes du registre (ex. objectNonNaturalCap) ; les densités sont éclatées en sous-groupes par famille (id `densities-<category>`, label `Densités · <CATEGORY_LABELS>`) ; filtre sans accents sur label, path, note, source ; groupes vides retirés. */
export function buildDossierGroups(registry: readonly ParamDescriptor[], query: string): DossierGroup[];
export function unknownParams(registry: readonly ParamDescriptor[]): ParamDescriptor[]; // INCONNU ou CONTRADICTION

// ParamTable.tsx
export function ParamTable(props: { items: ParamDescriptor[] }): JSX.Element | null;
// DossierTab.tsx
export function DossierTab(props: { focusSection?: string | null }): JSX.Element;
// MeasureCards.tsx
export function MeasureCards(): JSX.Element;
```

- Réutiliser `normalizeSearch` de `src/components/atelier/paletteModel.ts` pour le filtre ; `getStatCategory`/`CATEGORY_LABELS`/`CATEGORY_ORDER` de `src/data/statCaps.ts` pour les densités (id numérique = dernier segment du chemin `densities.N`).
- `ParamTable` : reprend l'ancien `ParamTable` de `KnowledgePage.tsx` (valeur lue avec `readParam(d.path, overrides)`, mention « profil actif »), mais colonnes Règle · Valeur · Statut seulement ; chaque ligne a un bouton « détails » (`aria-expanded`) qui déplie une ligne pleine largeur : note, source, bornes (`d.entry.bounds`), défaut (`d.entry.default`), chemin (`d.path` en `font-mono`).
- `DossierTab` : en haut, `<input type="search" aria-label="Rechercher un paramètre">` ; pour chaque groupe `<section id={'dossier-' + g.id}>` titre + `ParamTable` ; listes potions/orbes (reprendre les `<ul>` de l'ancienne page) sous les groupes `potions` et `craft` ; « Aucun paramètre ne correspond. » si vide ; puis `<section id="dossier-mesurer">` avec `MeasureCards` et `PARAM_NOTES`. Si `focusSection` est donné, `scrollIntoView` sur `dossier-<focusSection>` au montage.
- `MeasureCards` : une carte par `unknownParams(PARAM_REGISTRY)` : libellé (+ sous-groupe), `StatusBadge`, valeur actuelle, « À observer : » + `MEASUREMENTS[path]` sinon `d.entry.note` (tronqué à 280 caractères avec « … » et un bouton « lire la suite » qui déplie), sinon « protocole non documenté ».

- [ ] **Step 1: Failing tests**

```ts
// src/__tests__/components/dossierModel.test.ts
import { describe, it, expect } from 'vitest';
import { buildDossierGroups, unknownParams } from '../../components/knowledge/dossierModel';
import { PARAM_REGISTRY } from '../../data/paramRegistry';

describe('dossierModel', () => {
  it('tous les paramètres apparaissent une fois sans filtre', () => {
    const groups = buildDossierGroups(PARAM_REGISTRY, '');
    const paths = groups.flatMap((g) => g.items.map((d) => d.path));
    expect(paths.length).toBe(PARAM_REGISTRY.length);
    expect(new Set(paths).size).toBe(PARAM_REGISTRY.length);
  });
  it('densités éclatées par famille', () => {
    const ids = buildDossierGroups(PARAM_REGISTRY, '').map((g) => g.id);
    expect(ids.some((id) => id.startsWith('densities-'))).toBe(true);
    expect(ids).not.toContain('densities');
  });
  it('filtre sans accents et retire les groupes vides', () => {
    const groups = buildDossierGroups(PARAM_REGISTRY, 'vitalite');
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.every((g) => g.items.length > 0)).toBe(true);
    expect(buildDossierGroups(PARAM_REGISTRY, 'zzzz-aucun')).toEqual([]);
  });
  it('inconnus = INCONNU ou CONTRADICTION', () => {
    const u = unknownParams(PARAM_REGISTRY);
    expect(u.length).toBeGreaterThan(0);
    expect(u.every((d) => d.entry.status === 'INCONNU' || d.entry.status === 'CONTRADICTION')).toBe(true);
  });
});
```

```tsx
// @vitest-environment jsdom
// src/__tests__/components/DossierTab.test.tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ParamsProvider } from '../../app/ParamsProvider';
import { DossierTab } from '../../components/knowledge/DossierTab';
import { unknownParams } from '../../components/knowledge/dossierModel';
import { PARAM_REGISTRY } from '../../data/paramRegistry';

afterEach(cleanup);
const show = () => render(<ParamsProvider><DossierTab /></ParamsProvider>);

describe('DossierTab', () => {
  it('une carte « à mesurer » par paramètre INCONNU ou CONTRADICTION', () => {
    show();
    expect(screen.getAllByTestId('measure-card').length).toBe(unknownParams(PARAM_REGISTRY).length);
  });
  it('la recherche filtre et annonce l’absence de résultat', () => {
    show();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher un paramètre' }), { target: { value: 'zzzz-aucun' } });
    expect(screen.getByText('Aucun paramètre ne correspond.')).toBeTruthy();
  });
  it('une ligne se déplie pour montrer source et chemin', () => {
    show();
    const btn = screen.getAllByRole('button', { name: /détails/ })[0];
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });
});
```

(`MeasureCards` : chaque carte porte `data-testid="measure-card"`.)

- [ ] **Step 2: See them fail.** **Step 3: Implement.** **Step 4: See them pass** + `npx tsc -b`, `npm run lint`, `npx vitest run`.
- [ ] **Step 5: Commit** — `git commit -m "Savoir : onglet Dossier (tableaux repliables, recherche, mesures a faire)"`

---

### Task 4: Onglet Comprendre (sections, schéma, glossaire)

**Files:**
- Create: `src/components/knowledge/UnderstandTab.tsx`
- Create: `src/components/knowledge/RunePathDiagram.tsx`
- Create: `src/components/knowledge/KnowledgeItemList.tsx`
- Test: `src/__tests__/components/UnderstandTab.test.tsx`

**Interfaces (Produces):**

```ts
export function KnowledgeItemList(props: { items: KnowledgeItem[]; ordered?: boolean }): JSX.Element; // chaque item : StatusBadge + texte + valeur live du param (readParam + fmt) ; source en title/petit texte
export function RunePathDiagram(props: { onNavigate: (sectionId: string) => void }): JSX.Element;
export function UnderstandTab(props: { onNavigate: (id: string) => void; onOpenDossier: (section: string) => void }): JSX.Element;
```

- `UnderstandTab` rend, dans l'ordre : `<section id="parcours">` (titre « Le parcours d'une rune » + `RunePathDiagram`), puis pour chaque `UNDERSTAND_SECTIONS` une `<section id={s.id} aria-labelledby=…>` :
  - titre `h2` ;
  - « En bref » : `KnowledgeItemList` sur fond `well` ;
  - « Comment ça marche » : `KnowledgeItemList ordered` ;
  - « Exemple » : encadré (`border-l-2 border-molten-text/60`) avec titre, lignes, `StatusBadge`, source, et valeurs live des `params` ; ou « Aucun exemple documenté. » en `text-ash-3` ;
  - « Sûr » / « Pas sûr » : grille 2 colonnes (`md:grid-cols-2`), titres avec pastille ;
  - bouton « Voir le dossier → » qui appelle `onOpenDossier(s.dossierSections[0])` ;
  - puis `<section id="glossaire">` : `<dl>` du `GLOSSARY` (terme `dt` avec `id={'g-' + g.id}`, définition `dd`, badge si `status`).
- `RunePathDiagram` : suite horizontale (≥ 768 px) / verticale (mobile) de boutons numérotés reliés par des flèches (`→` / `↓`, `aria-hidden`), label + détail court ; clic → `onNavigate(step.sectionId)`.
- Formatage des valeurs live : reprendre `fmt` de l'ancienne page (déplacer dans `src/components/knowledge/format.ts`, exporté, réutilisé par `ParamTable`).

- [ ] **Step 1: Failing test**

```tsx
// @vitest-environment jsdom
// src/__tests__/components/UnderstandTab.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ParamsProvider } from '../../app/ParamsProvider';
import { UnderstandTab } from '../../components/knowledge/UnderstandTab';
import { UNDERSTAND_SECTIONS, RUNE_PATH } from '../../content/knowledge';
import { GLOSSARY } from '../../content/glossary';

afterEach(cleanup);
const show = (onNavigate = vi.fn(), onOpenDossier = vi.fn()) => {
  render(<ParamsProvider><UnderstandTab onNavigate={onNavigate} onOpenDossier={onOpenDossier} /></ParamsProvider>);
  return { onNavigate, onOpenDossier };
};

describe('UnderstandTab', () => {
  it('une section par thème + parcours + glossaire', () => {
    show();
    for (const s of UNDERSTAND_SECTIONS) expect(document.getElementById(s.id)).toBeTruthy();
    expect(document.getElementById('parcours')).toBeTruthy();
    expect(document.getElementById('glossaire')).toBeTruthy();
    expect(screen.getAllByRole('term').length).toBe(GLOSSARY.length);
  });
  it('le schéma navigue vers la section de l’étape', () => {
    const { onNavigate } = show();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(RUNE_PATH[0].label) }));
    expect(onNavigate).toHaveBeenCalledWith(RUNE_PATH[0].sectionId);
  });
  it('« Voir le dossier » ouvre la section de paramètres liée', () => {
    const { onOpenDossier } = show();
    fireEvent.click(screen.getAllByRole('button', { name: /Voir le dossier/ })[0]);
    expect(onOpenDossier).toHaveBeenCalledWith(UNDERSTAND_SECTIONS[0].dossierSections[0]);
  });
  it('les sections sans exemple le disent', () => {
    show();
    const without = UNDERSTAND_SECTIONS.filter((s) => s.example === null).length;
    expect(screen.queryAllByText('Aucun exemple documenté.').length).toBe(without);
  });
});
```

- [ ] **Step 2: See it fail.** **Step 3: Implement.** **Step 4: See it pass** + `npx tsc -b`, `npm run lint`.
- [ ] **Step 5: Commit** — `git commit -m "Savoir : onglet Comprendre (parcours, sections, exemples, glossaire)"`

---

### Task 5: Assemblage de `KnowledgePage`, nettoyage, vérification visuelle

**Files:**
- Rewrite: `src/pages/KnowledgePage.tsx`
- Modify: `src/content/knowledge.ts` (retirer `KNOWLEDGE_SECTIONS` temporaire)
- Test: `src/__tests__/components/KnowledgePage.test.tsx`

`KnowledgePage` :
- État `tab` initialisé par `tabFromHash(window.location.hash)`, synchronisé sur `hashchange` ; changer d'onglet → `window.location.hash = hashForTab(tab)` (le routeur d'App reste sur `savoir` grâce au premier segment).
- En-tête : titre « Ce que l'on sait, et comment on le sait », une phrase d'intro, `<details open>` « Les cinq statuts » (badges + `STATUS_DESCRIPTION`), versions (`PARAMS_META`, `DATASET_META` comme avant), onglets `role="tablist"` (Comprendre · Dossier) au style des onglets de `SidePanel` de l'atelier.
- Grille : `lg:grid-cols-[220px_minmax(0,1fr)]`, `max-w-[1200px]` ; à gauche `KnowledgeToc` (entrées : Comprendre → parcours, 8 sections, glossaire ; Dossier → groupes de `buildDossierGroups(PARAM_REGISTRY, '')` + « À mesurer ») et `useActiveSection(ids)`.
- `onOpenDossier(section)` : passe à l'onglet dossier avec `focusSection = section` (hash `hashForTab('dossier', section)`) ; `DossierTab` reçoit `focusSection={anchorFromHash(hash)}`.

- [ ] **Step 1: Failing test**

```tsx
// @vitest-environment jsdom
// src/__tests__/components/KnowledgePage.test.tsx
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ParamsProvider } from '../../app/ParamsProvider';
import { KnowledgePage } from '../../pages/KnowledgePage';

afterEach(cleanup);
beforeEach(() => { window.location.hash = '#savoir'; });
const show = () => render(<ParamsProvider><KnowledgePage /></ParamsProvider>);

describe('KnowledgePage', () => {
  it('ouvre Comprendre par défaut, Dossier depuis le hash', () => {
    show();
    expect(screen.getByRole('tab', { name: 'Comprendre' }).getAttribute('aria-selected')).toBe('true');
    cleanup();
    window.location.hash = '#savoir/dossier';
    show();
    expect(screen.getByRole('tab', { name: 'Dossier' }).getAttribute('aria-selected')).toBe('true');
  });
  it('cliquer un onglet écrit le hash', () => {
    show();
    fireEvent.click(screen.getByRole('tab', { name: 'Dossier' }));
    expect(window.location.hash).toBe('#savoir/dossier');
  });
});
```

- [ ] **Step 2-4:** fail → implement → pass ; `npx tsc -b`, `npm run lint`, `npx vitest run` tous propres ; `grep -rn KNOWLEDGE_SECTIONS src` vide.
- [ ] **Step 5: Visual verification** (serveur déjà lancé, http://localhost:5199/#savoir ; outils Playwright MCP via ToolSearch) : 1440×900 et 390×844, onglet Comprendre puis Dossier ; captures `.playwright-mcp/savoir-apres-{comprendre,dossier}-{1440,390}.png` regardées ; vérifier : sommaire collant qui suit le défilement, schéma cliquable, « Voir le dossier » ouvre la bonne section, recherche « reliquat » filtre, une ligne se déplie, console sans erreur, pas de débordement horizontal à 390.
- [ ] **Step 6: Commit** — `git commit -m "Savoir en deux onglets : Comprendre et Dossier, sommaire lateral"`

---

## Self-review

- Spec §3.1 → Tasks 2, 5 ; §3.2 → Task 2 ; §3.3 → Tasks 1, 4 ; §3.4 → Task 3 ; §4 fichiers → Tasks 1-5 ; §5 tests → Tasks 1-5.
- Noms cohérents : `UNDERSTAND_SECTIONS`, `RUNE_PATH`, `MEASUREMENTS`, `GLOSSARY`, `KnowledgeItem`, `tabFromHash`/`hashForTab`/`anchorFromHash`, `buildDossierGroups`/`unknownParams`, `KnowledgeToc`/`useActiveSection`, `fmt` (déplacé dans `format.ts` en Task 4 ; Task 3 `ParamTable` peut l'y créer en premier — **décision : Task 3 crée `src/components/knowledge/format.ts` avec `fmt`, Task 4 le réutilise**).
- Task 2 : le test du sommaire utilise des `button` (pas des liens), conformément à la décision écrite dans la tâche.
