# Atelier « fenêtre façon jeu » — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refaire la page Atelier en trois colonnes « façon jeu » (onglets Historique/Budget/Coût · enclume + slot de fusion · palette de runes), remplacer le `<select>` d'exo par une palette d'icônes, ajouter paliers dans la ligne, raccourcis clavier et barre SC/SN/EC.

**Architecture:** Refonte présentationnelle seulement. La logique d'interface pure (palette, sélection, raccourcis) vit dans de petits modules testés (`paletteModel.ts`, `forgeSelection.ts`, `useForgeShortcuts.ts`) ; les composants React les consomment. `useAtelier`, `src/logic/`, `empirical_params.json` ne changent pas.

**Tech Stack:** React 19, TypeScript 5.9, Tailwind 4 (tokens de `src/styles/theme.css`), Vitest 4 + @testing-library/react + jsdom.

**Spec:** `docs/superpowers/specs/2026-09-23-atelier-fenetre-jeu-design.md`

## Global Constraints

- Aucun changement dans `src/logic/`, `src/hooks/useAtelier.ts`, `src/state/`, `empirical_params.json`.
- Tout badge de statut visible aujourd'hui (`StatusBadge`, `ModelBadge`) reste visible ; seuls les paragraphes passent dans `InfoTip`. Aucun texte d'avertissement n'est supprimé (déplacé mot pour mot).
- Textes d'interface en français ; identifiants en anglais.
- `OutcomeEstimate.test.tsx` reste vert sans modification.
- Tests de composants : en-tête `// @vitest-environment jsdom`, `afterEach(cleanup)`.
- Classes Tailwind écrites en toutes lettres (pas d'interpolation `text-${x}`), cf. `statColors.ts`.
- Commandes : `npx vitest run <fichier>`, `npx tsc -b`, `npm run lint`.

---

### Task 1: Modèle de la palette (groupes + filtre sans accents)

**Files:**
- Create: `src/components/atelier/paletteModel.ts`
- Test: `src/__tests__/components/paletteModel.test.ts`

**Interfaces:**
- Produces:
  - `normalizeSearch(s: string): string`
  - `interface PaletteTile { characteristicId: number; name: string; density: number; onItem: boolean; heavy: boolean }`
  - `interface PaletteGroup { key: 'on_item' | StatCapCategory; label: string; tiles: PaletteTile[] }`
  - `buildPaletteGroups(opts: { characteristicIds: readonly number[]; presentIds: ReadonlySet<number>; densityOf: (cid: number) => number | undefined; heavyIds: readonly number[]; query: string; nameOf: (cid: number) => string }): PaletteGroup[]`

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/components/paletteModel.test.ts
import { describe, it, expect } from 'vitest';
import { buildPaletteGroups, normalizeSearch } from '../../components/atelier/paletteModel';

// Ids réels (statCaps.ts) : 1 PA et 23 PM = special ; 11 et 10 = primary.
const NAMES: Record<number, string> = { 1: 'PA', 23: 'PM', 11: 'Vitalité', 10: 'Force', 999: 'Sans densité' };
const DENSITY: Record<number, number> = { 1: 100, 23: 90, 11: 0.2, 10: 1 };
const base = {
  characteristicIds: [1, 23, 11, 10, 999],
  presentIds: new Set([11]),
  densityOf: (cid: number) => DENSITY[cid],
  heavyIds: [1, 23],
  query: '',
  nameOf: (cid: number) => NAMES[cid],
};

describe('normalizeSearch', () => {
  it('retire accents et casse', () => {
    expect(normalizeSearch('  VitALITÉ ')).toBe('vitalite');
  });
});

describe('buildPaletteGroups', () => {
  it("met « Sur l'objet » en premier, puis les familles dans l'ordre special → primary", () => {
    const groups = buildPaletteGroups(base);
    expect(groups.map((g) => g.key)).toEqual(['on_item', 'special', 'primary']);
    expect(groups[0].tiles.map((t) => t.characteristicId)).toEqual([11]);
    expect(groups[2].tiles.map((t) => t.characteristicId)).toEqual([10]); // 11 n'est pas dupliqué
  });

  it('ignore les caractéristiques sans densité', () => {
    const all = buildPaletteGroups(base).flatMap((g) => g.tiles.map((t) => t.characteristicId));
    expect(all).not.toContain(999);
  });

  it("marque ✦ (heavy) seulement les exos lourds absents de l'objet", () => {
    const groups = buildPaletteGroups({ ...base, presentIds: new Set([11, 23]) });
    const tiles = groups.flatMap((g) => g.tiles);
    expect(tiles.find((t) => t.characteristicId === 1)?.heavy).toBe(true);
    expect(tiles.find((t) => t.characteristicId === 23)?.heavy).toBe(false);
  });

  it('filtre sans accents et retire les groupes vides', () => {
    const groups = buildPaletteGroups({ ...base, query: 'vitalite' });
    expect(groups.map((g) => g.key)).toEqual(['on_item']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/paletteModel.test.ts`
Expected: FAIL (module `paletteModel` introuvable).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/components/atelier/paletteModel.ts
/**
 * Modèle de la palette de runes : une tuile par caractéristique dotée d'une rune et d'une
 * densité, groupée par famille d'affichage (statCaps.ts). Logique pure, testée à part du
 * rendu. Le marqueur « lourd » reprend la liste du moteur (probabilityParams.heavyExoCharacteristics)
 * et ne concerne que les caractéristiques ABSENTES de l'objet : c'est un exo potentiel.
 */
import { CATEGORY_LABELS, getStatCategory, type StatCapCategory } from '../../data/statCaps';

export interface PaletteTile {
  characteristicId: number;
  name: string;
  density: number;
  onItem: boolean;
  heavy: boolean;
}

export interface PaletteGroup {
  key: 'on_item' | StatCapCategory;
  label: string;
  tiles: PaletteTile[];
}

const CATEGORY_ORDER: StatCapCategory[] = ['special', 'primary', 'damage', 'percent_dmg', 'resistance', 'utility'];

export function normalizeSearch(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function buildPaletteGroups(opts: {
  characteristicIds: readonly number[];
  presentIds: ReadonlySet<number>;
  densityOf: (cid: number) => number | undefined;
  heavyIds: readonly number[];
  query: string;
  nameOf: (cid: number) => string;
}): PaletteGroup[] {
  const q = normalizeSearch(opts.query);
  const tiles: PaletteTile[] = [];
  for (const cid of opts.characteristicIds) {
    const density = opts.densityOf(cid);
    if (density === undefined) continue;
    const name = opts.nameOf(cid);
    if (q && !normalizeSearch(name).includes(q)) continue;
    const onItem = opts.presentIds.has(cid);
    tiles.push({ characteristicId: cid, name, density, onItem, heavy: !onItem && opts.heavyIds.includes(cid) });
  }
  const byName = (a: PaletteTile, b: PaletteTile) => a.name.localeCompare(b.name, 'fr');

  const groups: PaletteGroup[] = [{ key: 'on_item', label: "Sur l'objet", tiles: tiles.filter((t) => t.onItem).sort(byName) }];
  for (const category of CATEGORY_ORDER) {
    groups.push({
      key: category,
      label: CATEGORY_LABELS[category],
      tiles: tiles.filter((t) => !t.onItem && getStatCategory(t.characteristicId) === category).sort(byName),
    });
  }
  return groups.filter((g) => g.tiles.length > 0);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/paletteModel.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/atelier/paletteModel.ts src/__tests__/components/paletteModel.test.ts
git commit -m "Palette de runes : modele de groupes et filtre sans accents"
```

---

### Task 2: Logique de sélection (palier, double clic armé, exo à 0, navigation)

**Files:**
- Create: `src/components/atelier/forgeSelection.ts`
- Test: `src/__tests__/components/forgeSelection.test.ts`

**Interfaces:**
- Produces:
  - `type SlotKind = 'rune' | 'transcendence' | 'orb' | 'potion'`
  - `type ArmedTier = { characteristicId: number; tier: RuneTier } | null`
  - `resolveTier(options: readonly { tier: RuneTier }[], chosen: RuneTier): RuneTier`
  - `tierClick(armed: ArmedTier, characteristicId: number, tier: RuneTier): { armed: ArmedTier; fire: boolean }`
  - `exoToDropOnRetarget(stats: readonly SimulatedStat[], currentId: number | null, nextId: number): number | null`
  - `nextLineId(stats: readonly SimulatedStat[], currentId: number | null, dir: 1 | -1): number | null`

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/components/forgeSelection.test.ts
import { describe, it, expect } from 'vitest';
import { exoToDropOnRetarget, nextLineId, resolveTier, tierClick } from '../../components/atelier/forgeSelection';
import type { SimulatedStat } from '../../types';

const stat = (characteristicId: number, extra: Partial<SimulatedStat> = {}): SimulatedStat => ({
  characteristicId,
  statName: `#${characteristicId}`,
  baseMin: 1,
  baseMax: 10,
  currentValue: 10,
  weightPerPoint: 1,
  isExo: false,
  isForgemeable: true,
  isLocked: false,
  ...extra,
});

describe('resolveTier', () => {
  it('garde le palier choisi s’il existe, sinon le premier disponible', () => {
    expect(resolveTier([{ tier: 'normal' }, { tier: 'pa' }], 'pa')).toBe('pa');
    expect(resolveTier([{ tier: 'pa' }, { tier: 'ra' }], 'normal')).toBe('pa');
    expect(resolveTier([], 'ra')).toBe('normal');
  });
});

describe('tierClick', () => {
  it('premier clic arme, second clic sur le même palier de la même ligne fusionne', () => {
    const first = tierClick(null, 11, 'pa');
    expect(first).toEqual({ armed: { characteristicId: 11, tier: 'pa' }, fire: false });
    expect(tierClick(first.armed, 11, 'pa').fire).toBe(true);
  });
  it('un autre palier ou une autre ligne ré-arme sans fusionner', () => {
    const armed = { characteristicId: 11, tier: 'pa' as const };
    expect(tierClick(armed, 11, 'ra')).toEqual({ armed: { characteristicId: 11, tier: 'ra' }, fire: false });
    expect(tierClick(armed, 10, 'pa').fire).toBe(false);
  });
});

describe('exoToDropOnRetarget', () => {
  const stats = [stat(11), stat(1, { isExo: true, baseMin: 0, baseMax: 0, currentValue: 0 }), stat(23, { isExo: true, baseMin: 0, baseMax: 0, currentValue: 1 })];
  it('retire un exo resté à 0 quand on vise ailleurs', () => {
    expect(exoToDropOnRetarget(stats, 1, 11)).toBe(1);
  });
  it('ne retire rien si l’exo a une valeur, si on revise la même ligne, ou si la cible courante est naturelle', () => {
    expect(exoToDropOnRetarget(stats, 23, 11)).toBeNull();
    expect(exoToDropOnRetarget(stats, 1, 1)).toBeNull();
    expect(exoToDropOnRetarget(stats, 11, 1)).toBeNull();
    expect(exoToDropOnRetarget(stats, null, 1)).toBeNull();
  });
});

describe('nextLineId', () => {
  const stats = [stat(11), stat(10, { isLocked: true }), stat(12), stat(13, { isForgemeable: false })];
  it('saute les lignes verrouillées ou non forgeables et reste borné', () => {
    expect(nextLineId(stats, 11, 1)).toBe(12);
    expect(nextLineId(stats, 12, 1)).toBe(12);
    expect(nextLineId(stats, 12, -1)).toBe(11);
    expect(nextLineId(stats, 11, -1)).toBe(11);
  });
  it('sans cible : première ligne en descendant, dernière en montant', () => {
    expect(nextLineId(stats, null, 1)).toBe(11);
    expect(nextLineId(stats, null, -1)).toBe(12);
    expect(nextLineId([], null, 1)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/forgeSelection.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/components/atelier/forgeSelection.ts
/**
 * Logique d'interface de l'atelier, pure et testée : palier effectif, double clic « armé »
 * sur un palier de ligne, nettoyage d'un exo créé puis abandonné à 0, navigation clavier.
 * Ce sont des choix d'INTERFACE, pas des règles du jeu : en jeu, une ligne exotique n'existe
 * qu'après une frappe ; ici elle est créée à 0 pour afficher la prévision, d'où le nettoyage.
 */
import type { RuneTier, SimulatedStat } from '../../types';

export type SlotKind = 'rune' | 'transcendence' | 'orb' | 'potion';

export type ArmedTier = { characteristicId: number; tier: RuneTier } | null;

/** Palier effectif : le choisi s'il existe pour cette ligne, sinon le premier disponible. */
export function resolveTier(options: readonly { tier: RuneTier }[], chosen: RuneTier): RuneTier {
  return options.some((o) => o.tier === chosen) ? chosen : (options[0]?.tier ?? 'normal');
}

/** Premier clic sur un palier : l'arme. Second clic sur le même palier de la même ligne : fusionne. */
export function tierClick(armed: ArmedTier, characteristicId: number, tier: RuneTier): { armed: ArmedTier; fire: boolean } {
  const fire = armed !== null && armed.characteristicId === characteristicId && armed.tier === tier;
  return { armed: { characteristicId, tier }, fire };
}

/** Exo à retirer quand la cible change : la cible courante est un exo encore à 0. */
export function exoToDropOnRetarget(stats: readonly SimulatedStat[], currentId: number | null, nextId: number): number | null {
  if (currentId === null || currentId === nextId) return null;
  const current = stats.find((s) => s.characteristicId === currentId);
  return current && current.isExo && current.currentValue === 0 ? currentId : null;
}

/** Ligne suivante/précédente parmi les lignes forgeables et non verrouillées, sans boucler. */
export function nextLineId(stats: readonly SimulatedStat[], currentId: number | null, dir: 1 | -1): number | null {
  const ids = stats.filter((s) => s.isForgemeable && !s.isLocked).map((s) => s.characteristicId);
  if (ids.length === 0) return null;
  const idx = currentId === null ? -1 : ids.indexOf(currentId);
  if (idx === -1) return dir === 1 ? ids[0] : ids[ids.length - 1];
  return ids[Math.min(ids.length - 1, Math.max(0, idx + dir))];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/forgeSelection.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/atelier/forgeSelection.ts src/__tests__/components/forgeSelection.test.ts
git commit -m "Atelier : logique de selection (palier arme, exo a zero, navigation)"
```

---

### Task 3: Hook de raccourcis clavier

**Files:**
- Create: `src/hooks/useForgeShortcuts.ts`
- Test: `src/__tests__/components/useForgeShortcuts.test.tsx`

**Interfaces:**
- Produces:
  - `interface ForgeShortcutHandlers { onMove(dir: 1 | -1): void; onTier(index: 0 | 1 | 2): void; onFuse(): void; onFocusSearch(): void; onToggleHelp(): void }`
  - `isEditableTarget(target: EventTarget | null): boolean`
  - `useForgeShortcuts(handlers: ForgeShortcutHandlers, enabled: boolean): void`
- Note : Ctrl+Z / Ctrl+Y restent gérés par `App.tsx` (inchangé). Espace appelle `preventDefault` pour ne pas activer en plus le bouton qui a le focus.

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
// src/__tests__/components/useForgeShortcuts.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, cleanup, fireEvent } from '@testing-library/react';
import { useForgeShortcuts, type ForgeShortcutHandlers } from '../../hooks/useForgeShortcuts';

afterEach(cleanup);

const handlers = (): ForgeShortcutHandlers => ({
  onMove: vi.fn(),
  onTier: vi.fn(),
  onFuse: vi.fn(),
  onFocusSearch: vi.fn(),
  onToggleHelp: vi.fn(),
});

describe('useForgeShortcuts', () => {
  it('flèches, 1/2/3, Espace, / et ?', () => {
    const h = handlers();
    renderHook(() => useForgeShortcuts(h, true));
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    fireEvent.keyDown(window, { key: '2' });
    fireEvent.keyDown(window, { key: ' ' });
    fireEvent.keyDown(window, { key: '/' });
    fireEvent.keyDown(window, { key: '?' });
    expect(h.onMove).toHaveBeenNthCalledWith(1, 1);
    expect(h.onMove).toHaveBeenNthCalledWith(2, -1);
    expect(h.onTier).toHaveBeenCalledWith(1);
    expect(h.onFuse).toHaveBeenCalledTimes(1);
    expect(h.onFocusSearch).toHaveBeenCalledTimes(1);
    expect(h.onToggleHelp).toHaveBeenCalledTimes(1);
  });

  it('Espace empêche l’action par défaut (bouton focalisé, défilement)', () => {
    renderHook(() => useForgeShortcuts(handlers(), true));
    const ev = new KeyboardEvent('keydown', { key: ' ', cancelable: true, bubbles: true });
    window.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  it('ignoré dans un champ de saisie, avec un modificateur, ou désactivé', () => {
    const h = handlers();
    const { rerender } = renderHook(({ on }) => useForgeShortcuts(h, on), { initialProps: { on: true } });
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: ' ' });
    fireEvent.keyDown(window, { key: '1', ctrlKey: true });
    rerender({ on: false });
    fireEvent.keyDown(window, { key: ' ' });
    expect(h.onFuse).not.toHaveBeenCalled();
    expect(h.onTier).not.toHaveBeenCalled();
    input.remove();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/useForgeShortcuts.test.tsx`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/hooks/useForgeShortcuts.ts
/**
 * Raccourcis de l'atelier : ↑/↓ ligne, 1/2/3 palier, Espace fusionner, / filtre de la
 * palette, ? aide. Ignorés dans un champ de saisie et avec Ctrl/Meta/Alt (Ctrl+Z/Y restent
 * dans App.tsx). Espace est intercepté (preventDefault) : sinon il activerait aussi le
 * bouton focalisé — la touche Entrée garde ce rôle.
 */
import { useEffect, useRef } from 'react';

export interface ForgeShortcutHandlers {
  onMove(dir: 1 | -1): void;
  onTier(index: 0 | 1 | 2): void;
  onFuse(): void;
  onFocusSearch(): void;
  onToggleHelp(): void;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
}

export function useForgeShortcuts(handlers: ForgeShortcutHandlers, enabled: boolean): void {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      const h = ref.current;
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); h.onMove(1); break;
        case 'ArrowUp': e.preventDefault(); h.onMove(-1); break;
        case '1': h.onTier(0); break;
        case '2': h.onTier(1); break;
        case '3': h.onTier(2); break;
        case ' ': e.preventDefault(); h.onFuse(); break;
        case '/': e.preventDefault(); h.onFocusSearch(); break;
        case '?': h.onToggleHelp(); break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/useForgeShortcuts.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useForgeShortcuts.ts src/__tests__/components/useForgeShortcuts.test.tsx
git commit -m "Atelier : hook de raccourcis clavier"
```

---

### Task 4: Composant `RunePalette`

**Files:**
- Create: `src/components/atelier/RunePalette.tsx`
- Test: `src/__tests__/components/RunePalette.test.tsx`

**Interfaces:**
- Consumes: `buildPaletteGroups`, `PaletteTile` (Task 1) ; `SlotKind` (Task 2) ; `RuneIcon` ; `getRepresentativeRuneImg`, `CHARACTERISTICS_WITH_RUNES`, `getCharacteristicName` (`data/dataset`).
- Produces: `RunePalette(props: RunePaletteProps)` avec
  ```ts
  interface RunePaletteProps {
    stats: readonly SimulatedStat[];
    densityOf: (cid: number) => number | undefined;
    heavyIds: readonly number[];
    selectedId: number | null;
    slotKind: SlotKind;
    mode: AtelierMode;
    /** Pas d'objet, ou objet transcendé : tout est désactivé */
    disabled: boolean;
    canTranscend: boolean;
    onPickCharacteristic: (characteristicId: number, onItem: boolean) => void;
    onPickSlot: (kind: 'orb' | 'transcendence') => void;
    searchRef?: Ref<HTMLInputElement>;
  }
  ```

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
// src/__tests__/components/RunePalette.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { RunePalette } from '../../components/atelier/RunePalette';
import { getCharacteristicName } from '../../data/dataset';
import { getDensity } from '../../data/params';
import type { SimulatedStat } from '../../types';

afterEach(cleanup);

const VITA = 11;
const PA = 1;
const vitality: SimulatedStat = {
  characteristicId: VITA, statName: getCharacteristicName(VITA), baseMin: 16, baseMax: 20, currentValue: 20,
  weightPerPoint: 0.2, isExo: false, isForgemeable: true, isLocked: false,
};

const setup = (over: Partial<Parameters<typeof RunePalette>[0]> = {}) => {
  const props = {
    stats: [vitality],
    densityOf: (cid: number) => getDensity(cid),
    heavyIds: [1, 23],
    selectedId: VITA,
    slotKind: 'rune' as const,
    mode: 'forge' as const,
    disabled: false,
    canTranscend: false,
    onPickCharacteristic: vi.fn(),
    onPickSlot: vi.fn(),
    ...over,
  };
  render(<RunePalette {...props} />);
  return props;
};

describe('RunePalette', () => {
  it("tuile absente de l'objet → onPickCharacteristic(cid, false)", () => {
    const p = setup();
    fireEvent.click(screen.getByRole('button', { name: getCharacteristicName(PA) }));
    expect(p.onPickCharacteristic).toHaveBeenCalledWith(PA, false);
  });

  it("tuile présente → onPickCharacteristic(cid, true), marquée comme visée", () => {
    const p = setup();
    const tile = screen.getByRole('button', { name: getCharacteristicName(VITA) });
    expect(tile.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(tile);
    expect(p.onPickCharacteristic).toHaveBeenCalledWith(VITA, true);
  });

  it('le filtre sans accents masque les autres tuiles', () => {
    setup();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'vitalite' } });
    expect(screen.queryByRole('button', { name: getCharacteristicName(PA) })).toBeNull();
  });

  it('potion toujours désactivée ; transcendance selon canTranscend ; orbe → onPickSlot', () => {
    const p = setup();
    expect((screen.getByRole('button', { name: /Potion/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /Transcendance/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Orbe/ }));
    expect(p.onPickSlot).toHaveBeenCalledWith('orb');
  });

  it('mode Ajuster : tuile présente désactivée, tuile absente active', () => {
    setup({ mode: 'adjust' });
    expect((screen.getByRole('button', { name: getCharacteristicName(VITA) }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: getCharacteristicName(PA) }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('désactivée : tout est grisé', () => {
    setup({ disabled: true });
    expect((screen.getByRole('button', { name: getCharacteristicName(PA) }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /Orbe/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/RunePalette.test.tsx`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/atelier/RunePalette.tsx
import { useMemo, useState, type ReactNode, type Ref } from 'react';
import type { AtelierMode, SimulatedStat } from '../../types';
import { CHARACTERISTICS_WITH_RUNES, getCharacteristicName, getRepresentativeRuneImg } from '../../data/dataset';
import { StatusBadge } from '../shell/Badges';
import { RuneIcon } from './RuneIcon';
import { buildPaletteGroups, type PaletteTile } from './paletteModel';
import type { SlotKind } from './forgeSelection';

export interface RunePaletteProps {
  stats: readonly SimulatedStat[];
  densityOf: (cid: number) => number | undefined;
  heavyIds: readonly number[];
  selectedId: number | null;
  slotKind: SlotKind;
  mode: AtelierMode;
  /** Pas d'objet, ou objet transcendé : tout est désactivé */
  disabled: boolean;
  canTranscend: boolean;
  onPickCharacteristic: (characteristicId: number, onItem: boolean) => void;
  onPickSlot: (kind: 'orb' | 'transcendence') => void;
  searchRef?: Ref<HTMLInputElement>;
}

/**
 * La palette : l'inventaire de runes de l'atelier. Une tuile par caractéristique ; poser la
 * rune d'une caractéristique absente crée l'exo, comme en jeu. Orbe, transcendance et potion
 * sont des tuiles « Objets FM ». La potion reste désactivée : taux de conservation en
 * CONTRADICTION, module non modélisé.
 */
export function RunePalette(props: RunePaletteProps) {
  const { stats, densityOf, heavyIds, selectedId, slotKind, mode, disabled, canTranscend, onPickCharacteristic, onPickSlot, searchRef } = props;
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const groups = useMemo(() => {
    const presentIds = new Set(stats.map((s) => s.characteristicId));
    return buildPaletteGroups({ characteristicIds: CHARACTERISTICS_WITH_RUNES, presentIds, densityOf, heavyIds, query, nameOf: getCharacteristicName });
  }, [stats, densityOf, heavyIds, query]);

  const tileDisabled = (t: PaletteTile) => {
    if (disabled) return true;
    if (mode === 'adjust') return t.onItem;
    const line = stats.find((s) => s.characteristicId === t.characteristicId);
    return !!line && (!line.isForgemeable || line.isLocked);
  };

  const fmTile = (label: string, active: boolean, isDisabled: boolean, onClick?: () => void, badge?: ReactNode) => (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-pressed={active}
      className={`btn-well flex items-center justify-between gap-2 px-2.5 py-2 text-[13px] ${active ? 'ring-1 ring-molten-text/60' : ''}`}
    >
      <span>{label}</span>
      {badge}
    </button>
  );

  return (
    <section className="surface-iron p-3 sm:p-4 flex flex-col gap-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]" aria-labelledby="palette-title">
      <div className="flex items-center gap-2">
        <h2 id="palette-title" className="text-[16px] text-ash">Runes</h2>
        <button type="button" className="lg:hidden ml-auto btn-well px-2 py-1 text-xs" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed}>
          {collapsed ? 'Afficher' : 'Replier'}
        </button>
      </div>

      <div className={`${collapsed ? 'hidden lg:flex' : 'flex'} flex-col gap-3 min-h-0`}>
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer… ( / )"
          aria-label="Filtrer les runes"
          className="well rounded-control px-3 py-1.5 text-sm text-ash"
        />

        <div className="overflow-y-auto min-h-0 pr-1 flex flex-col gap-3">
          {groups.map((g) => (
            <div key={g.key}>
              <h3 className="text-[11px] uppercase tracking-wide text-ash-3 mb-1.5">{g.label}</h3>
              <div className="grid grid-cols-4 gap-1.5">
                {g.tiles.map((t) => {
                  const selected = t.characteristicId === selectedId && slotKind === 'rune';
                  return (
                    <button
                      key={t.characteristicId}
                      type="button"
                      aria-label={t.name}
                      aria-pressed={selected}
                      disabled={tileDisabled(t)}
                      onClick={() => onPickCharacteristic(t.characteristicId, t.onItem)}
                      title={`${t.name} · ${t.density} poids par point${t.onItem ? '' : ' · exo'}${t.heavy ? ' · exo lourd' : ''}`}
                      className={`relative grid justify-items-center gap-0.5 rounded-[10px] border px-1 py-1.5 text-[10.5px] leading-tight transition-colors disabled:opacity-40
                        ${selected ? 'border-molten-text bg-[rgb(255_194_92/0.08)]' : t.onItem ? 'border-iron-edge hover:border-ash-3' : 'border-exo/40 hover:border-exo'}`}
                    >
                      <RuneIcon characteristicId={t.characteristicId} img={getRepresentativeRuneImg(t.characteristicId)} size={30} />
                      <span className={`w-full truncate text-center ${t.onItem ? 'text-ash-2' : 'text-exo'}`}>{t.name}</span>
                      {t.heavy && <span className="absolute top-0.5 right-1 text-[10px] text-exo" aria-hidden="true">✦</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {groups.length === 0 && <p className="text-xs text-ash-3">Aucune rune ne correspond.</p>}

          <div>
            <h3 className="text-[11px] uppercase tracking-wide text-ash-3 mb-1.5">Objets FM</h3>
            <div className="grid gap-1.5">
              {fmTile('Orbe régénérant', slotKind === 'orb', disabled || mode !== 'forge', () => onPickSlot('orb'))}
              {fmTile('Transcendance', slotKind === 'transcendence', disabled || mode !== 'forge' || !canTranscend, () => onPickSlot('transcendence'))}
              {fmTile('Potion', false, true, undefined, <StatusBadge status="CONTRADICTION" />)}
            </div>
          </div>
          <p className="text-[11px] text-ash-3"><span className="text-exo">violet</span> : exo · <span className="text-exo">✦</span> exo lourd (régime 1 %)</p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/RunePalette.test.tsx`
Expected: PASS (6 tests). Si `getCharacteristicName(1)` et une autre caractéristique partagent un nom préfixé, le `name` exact de `getByRole` les distingue.

- [ ] **Step 5: Commit**

```bash
git add src/components/atelier/RunePalette.tsx src/__tests__/components/RunePalette.test.tsx
git commit -m "Atelier : palette de runes (tuiles par famille, filtre, objets FM)"
```

---

### Task 5: `OutcomeEstimate` en barre, notes dans `InfoTip`

**Files:**
- Modify: `src/components/atelier/OutcomeEstimate.tsx` (rendu, lignes ~54–110)
- Test: `src/__tests__/components/OutcomeEstimate.test.tsx` (inchangé, doit rester vert)

**Interfaces:**
- Consumes: `InfoTip` (`shell/Badges`).
- Produces: même signature `OutcomeEstimate(props: OutcomeEstimateProps)`, mêmes `data-testid`.

- [ ] **Step 1: Run the existing test (baseline)**

Run: `npx vitest run src/__tests__/components/OutcomeEstimate.test.tsx`
Expected: PASS.

- [ ] **Step 2: Add the bar helper and rewrite the two branches**

Ajouter sous `const pct = …` :

```tsx
/** Barre empilée SC/SN/EC : largeurs = probabilités. Purement visuelle (aria-hidden). */
function OutcomeBar({ sc, sn, ec, thin = false }: { sc: number; sn: number; ec: number; thin?: boolean }) {
  return (
    <div className={`flex w-full ${thin ? 'h-1.5' : 'h-2.5'} rounded-full overflow-hidden roll-track`} aria-hidden="true">
      <span className="bg-sc" style={{ width: `${sc * 100}%` }} />
      <span className="bg-sn" style={{ width: `${sn * 100}%` }} />
      <span className="bg-ec" style={{ width: `${ec * 100}%` }} />
    </div>
  );
}
```

Remplacer le bloc `estimate.kind === 'point' ? (…) : (…)` par :

```tsx
      {estimate.kind === 'point' ? (
        <div className="mt-2.5 tnum" data-testid="point-triplet">
          <OutcomeBar sc={estimate.probabilities.pSC} sn={estimate.probabilities.pSN} ec={estimate.probabilities.pEC} />
          <div className="grid grid-cols-3 gap-1.5 mt-1.5 text-center">
            <div><b className="font-display text-[17px] text-sc">{pct(estimate.probabilities.pSC)}</b> <small className="text-[11px] text-ash-3">SC</small></div>
            <div><b className="font-display text-[17px] text-sn">{pct(estimate.probabilities.pSN)}</b> <small className="text-[11px] text-ash-3">SN</small></div>
            <div><b className="font-display text-[17px] text-ec">{pct(estimate.probabilities.pEC)}</b> <small className="text-[11px] text-ash-3">EC</small></div>
          </div>
        </div>
      ) : (
        <div className="mt-2.5">
          <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 items-center text-[10.5px] text-ash-3">
            <span>meilleure création</span><OutcomeBar thin sc={estimate.best.pSC} sn={estimate.best.pSN} ec={estimate.best.pEC} />
            <span>pire création</span><OutcomeBar thin sc={estimate.worst.pSC} sn={estimate.worst.pSN} ec={estimate.worst.pEC} />
          </div>
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 mt-2 m-0 items-baseline" data-testid="interval-ranges">
            <dt className="text-[11px] text-ash-3">succès critique</dt>
            <dd className="m-0 font-display text-[15px] text-sc tnum whitespace-nowrap" data-testid="range-sc">{pct(estimate.worst.pSC)} – {pct(estimate.best.pSC)}</dd>
            <dt className="text-[11px] text-ash-3">succès neutre</dt>
            <dd className="m-0 font-display text-[15px] text-sn tnum whitespace-nowrap" data-testid="range-sn">{pct(estimate.worst.pSN)} – {pct(estimate.best.pSN)}</dd>
            <dt className="text-[11px] text-ash-3">échec critique</dt>
            <dd className="m-0 font-display text-[15px] text-ec tnum whitespace-nowrap" data-testid="range-ec">{pct(estimate.best.pEC)} – {pct(estimate.worst.pEC)}</dd>
          </dl>
        </div>
      )}
```

- [ ] **Step 3: Move the three notes into InfoTips**

Pour chacune des trois notes (`interval-note`, les deux `heavy-exo-note`) : garder le `<p …data-testid=…>` et son texte **à l'identique**, retirer seulement `mt-2` de sa classe, et l'envelopper ainsi (exemple pour la note d'intervalle) :

```tsx
      {estimate.kind === 'interval' && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-molten-text">
          <StatusBadge status="INCONNU" />
          <span>intervalle, pas un chiffre</span>
          <InfoTip label="Pourquoi un intervalle">
            <p className="m-0 leading-snug" data-testid="interval-note">
              {/* contenu actuel inchangé, y compris <StatusBadge status="INCONNU" /> */}
            </p>
          </InfoTip>
        </div>
      )}
```

Pour les deux notes d'exo lourd, même gabarit avec respectivement `<StatusBadge status="MODÈLE EMPIRIQUE" />` + « régime SC seul (poids cumulé) » et `<StatusBadge status="HYPOTHÈSE COMMUNAUTAIRE" />` + « exo lourd : plancher 1 % », label `InfoTip` « D'où vient ce taux ». Le badge reste visible hors de l'infobulle ; le `<p>` garde aussi son badge intérieur (le test lit `note.textContent`).

Ajouter `InfoTip` à l'import : `import { InfoTip, ModelBadge, StatusBadge } from '../shell/Badges';`

- [ ] **Step 4: Run test to verify it still passes**

Run: `npx vitest run src/__tests__/components/OutcomeEstimate.test.tsx`
Expected: PASS (tous). `<details>` garde son contenu dans le DOM : `getByTestId` le trouve.

- [ ] **Step 5: Commit**

```bash
git add src/components/atelier/OutcomeEstimate.tsx
git commit -m "Prevision SC/SN/EC en barre, notes dans les infobulles"
```

---

### Task 6: Reliquat compact, Livre de forge compact, Budget/Coût allégés, `SidePanel`

**Files:**
- Modify: `src/components/atelier/Crucible.tsx` (remplacement du rendu)
- Modify: `src/components/atelier/ForgeLog.tsx` (conteneur et grille)
- Modify: `src/components/atelier/BudgetScale.tsx` (conteneur, dernier paragraphe)
- Modify: `src/components/atelier/SessionCost.tsx` (conteneur)
- Create: `src/components/atelier/SidePanel.tsx`

**Interfaces:**
- Produces: `SidePanel({ atelier }: { atelier: AtelierApi })` ; `Crucible` garde ses props `{ residualPool, event }`.

- [ ] **Step 1: Crucible → jauge horizontale**

Remplacer le `return (…)` de `Crucible` par (les trois `<p>` de l'`InfoTip` restent identiques ; la phrase « Ce qui a fondu… » y est ajoutée) :

```tsx
  const width = Math.max(heightPercent, residualPool > 0 ? 3 : 0);
  return (
    <div className="flex items-center gap-2.5 min-w-[220px]" role="group" aria-labelledby="crucible-title">
      <span id="crucible-title" className="text-sm text-ash-2">Reliquat</span>
      <div className="relative h-2 flex-1 min-w-[80px] rounded-full roll-track overflow-hidden" role="img" aria-label={`Reliquat : ${residualPool.toFixed(1)} de poids en fusion`}>
        <div className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,var(--color-ember),var(--color-molten))] transition-[width] duration-500" style={{ width: `${width}%` }} />
      </div>
      <b key={boilKey} className={`font-display font-bold text-xl tnum text-molten-text ${boilKey > 0 ? 'value-bump' : ''}`}>{residualPool.toFixed(1)}</b>
      <StatusBadge status="HYPOTHÈSE COMMUNAUTAIRE" />
      <InfoTip label="Ce qu'est le reliquat">
        {/* trois <p> actuels inchangés */}
        <p className="m-0 mt-2">Ce qui a fondu lors des dernières pertes, et que le moteur reprend avant de toucher une ligne. Échelle de la jauge : 0 à {scale}.</p>
      </InfoTip>
    </div>
  );
```

- [ ] **Step 2: BudgetScale, SessionCost, ForgeLog sans surface propre**

- `BudgetScale.tsx` : `<section className="surface-iron p-4 sm:p-5" …>` → `<section …>` (sans classe). Déplacer le dernier `<p className="text-xs text-ash-3 mt-2 leading-snug">La balance dit ce que vous planifiez ; le creuset, ce que le serveur retient.</p>` en fin du premier `InfoTip` (`<p className="m-0 mt-2">La balance dit ce que vous planifiez ; le reliquat, ce que le serveur retient.</p>`) et supprimer l'original.
- `SessionCost.tsx` : `<section className="surface-iron p-4 sm:p-5" …>` → `<section …>` ; `<h2 id="cost-title" className="text-[17px] text-ash">` → `className="sr-only"` (l'onglet porte le titre).
- `ForgeLog.tsx` :
  - `<section className="surface-iron p-4 sm:p-5" …>` → `<section …>` ;
  - `<h2 id="log-title" …>Livre de forge</h2>` → `className="sr-only"` ; supprimer le `<span>` « chaque frappe, telle que le moteur l'a appliquée » ;
  - `<div className="ml-auto flex items-center gap-4 …">` → `className="w-full flex items-center gap-3 text-[12px] text-ash-2 tnum"` ;
  - `<ol className="… grid gap-2 sm:grid-cols-2 xl:grid-cols-3 max-h-[380px] …">` → `className="m-0 p-0 list-none grid gap-1.5 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1"` ;
  - `<li className="well rounded-control grid grid-cols-[34px_1fr_auto] gap-2.5 items-center px-3 py-2.5 text-[13px] …">` → `grid-cols-[26px_1fr_auto] gap-2 px-2 py-2 text-[12.5px]` ; pastille `w-[30px] h-[30px]` → `w-[24px] h-[24px]`.
  - Message vide : « Le livre est vierge. Fusionnez une rune : chaque issue s'inscrit ici avec sa perte et le reliquat. »

- [ ] **Step 3: Create SidePanel**

```tsx
// src/components/atelier/SidePanel.tsx
import { useState } from 'react';
import type { AtelierApi } from '../../hooks/useAtelier';
import { ForgeLog } from './ForgeLog';
import { BudgetScale } from './BudgetScale';
import { SessionCost } from './SessionCost';

type SideTab = 'log' | 'budget' | 'cost';
const TABS: { id: SideTab; label: string }[] = [
  { id: 'log', label: 'Historique' },
  { id: 'budget', label: 'Budget' },
  { id: 'cost', label: 'Coût' },
];

/** Colonne gauche : historique des frappes, budget de planification, coût de la session. */
export function SidePanel({ atelier }: { atelier: AtelierApi }) {
  const [tab, setTab] = useState<SideTab>('log');
  return (
    <section className="surface-iron p-3 sm:p-4 flex flex-col gap-3 xl:sticky xl:top-4" aria-label="Historique, budget et coût">
      <div className="well rounded-control p-0.5 grid grid-cols-3 gap-0.5" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-1 py-1.5 rounded-[8px] text-[12.5px] ${tab === t.id ? 'bg-iron-2 text-ash shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]' : 'text-ash-2 hover:text-ash'}`}
          >
            {t.label}
            {t.id === 'log' && atelier.log.length > 0 && <span className="ml-1 text-ash-3 tnum">{atelier.log.length}</span>}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'log' && <ForgeLog log={atelier.log} lastEvent={atelier.lastEvent} onClear={atelier.clearLog} />}
        {tab === 'budget' && <BudgetScale budget={atelier.budget} />}
        {tab === 'cost' && <SessionCost consumed={atelier.consumed} onReset={atelier.resetSession} />}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Type-check and run all tests**

Run: `npx tsc -b && npx vitest run`
Expected: pas d'erreur de type ; tous les tests PASS. (`AtelierPage` utilise encore l'ancien layout : c'est voulu, il est remplacé en Task 8.)

- [ ] **Step 5: Commit**

```bash
git add src/components/atelier/Crucible.tsx src/components/atelier/ForgeLog.tsx src/components/atelier/BudgetScale.tsx src/components/atelier/SessionCost.tsx src/components/atelier/SidePanel.tsx
git commit -m "Atelier : reliquat compact, historique compact, panneau lateral a onglets"
```

---

### Task 7: `ForgeSlot`, paliers dans la ligne, `ItemSlab` allégé

**Files:**
- Create: `src/components/atelier/ForgeSlot.tsx`
- Modify: `src/components/atelier/ItemLine.tsx` (props + rangée de paliers)
- Modify: `src/components/atelier/ItemSlab.tsx` (en-tête, menu `⋯`, props, `children`)

**Interfaces:**
- Consumes: `SlotKind`, `ArmedTier` (Task 2) ; `OutcomeEstimate` (Task 5) ; `Crucible` (Task 6) ; `RuneOption` (`hooks/useAtelier`).
- Produces:
  ```ts
  // ForgeSlot
  interface ForgeSlotProps {
    atelier: AtelierApi;
    slotKind: SlotKind;
    tier: RuneTier;
    onFuse: () => void;
    showHelp: boolean;
    onToggleHelp: () => void;
  }
  // ItemLine — props ajoutées (optionnelles)
  tiers?: RuneOption[]; activeTier?: RuneTier; armedTier?: RuneTier | null; onTierClick?: (tier: RuneTier) => void;
  // ItemSlab — props
  interface Props {
    atelier: AtelierApi;
    onSaveToShowcase?: () => boolean;
    onSelectLine: (characteristicId: number) => void;
    tierOptions: RuneOption[];
    activeTier: RuneTier;
    armed: ArmedTier;
    onTierClick: (tier: RuneTier) => void;
    children?: ReactNode; // le slot, rendu sous les lignes
  }
  ```

- [ ] **Step 1: ItemLine — paliers sur la ligne visée**

Ajouter à `Props` :

```ts
  /** Paliers de rune, affichés seulement sur la ligne visée en mode forger */
  tiers?: RuneOption[];
  activeTier?: RuneTier;
  /** Palier armé (1er clic) : le clic suivant sur lui fusionne */
  armedTier?: RuneTier | null;
  onTierClick?: (tier: RuneTier) => void;
```

Imports : `import type { SimulatedStat, AtelierMode, ForgeEvent, RuneTier } from '../../types';` et `import type { RuneOption } from '../../hooks/useAtelier';`. Déstructurer les nouvelles props. Juste avant `</li>`, ajouter :

```tsx
      {selected && mode === 'forge' && tiers && tiers.length > 0 && onTierClick && (
        <div className="col-span-full flex flex-wrap justify-end gap-1.5 pt-1" role="group" aria-label={`Paliers de rune ${stat.statName}`}>
          {tiers.map((o, i) => {
            const armed = armedTier === o.tier;
            return (
              <button
                key={o.tier}
                type="button"
                onClick={(e) => { e.stopPropagation(); onTierClick(o.tier); }}
                aria-pressed={activeTier === o.tier}
                title={`${o.nameFr} : +${o.value}, poids ${o.weight.toFixed(1)} · touche ${i + 1} · ${armed ? 'cliquer encore pour fusionner' : 'cliquer pour choisir, encore pour fusionner'}`}
                className={`btn-well inline-flex items-center gap-1.5 px-2 py-1 text-[13px] tnum ${activeTier === o.tier ? 'text-ash border-molten-text/60' : 'text-ash-2'} ${armed ? 'ring-2 ring-molten-text/70' : ''}`}
              >
                <RuneIcon characteristicId={stat.characteristicId} img={o.img} size={18} />
                <b className="font-display">+{o.value}</b>
                {armed && <span className="text-[10px] text-molten-text">fusionner</span>}
              </button>
            );
          })}
        </div>
      )}
```

- [ ] **Step 2: Create ForgeSlot**

Le contenu vient d'`ActionPanel.tsx` (sections Rune, Transcendance, Orbe, Potion) ; les textes d'avertissement sont conservés, les paragraphes longs passent dans des `InfoTip`.

```tsx
// src/components/atelier/ForgeSlot.tsx
import { Fragment, type ReactNode } from 'react';
import type { AtelierApi } from '../../hooks/useAtelier';
import type { RuneOutcome, RuneTier } from '../../types';
import { FM_ORBS, FM_POTIONS } from '../../data/dataset';
import { getParamEntry } from '../../data/params';
import { InfoTip, StatusBadge } from '../shell/Badges';
import { OutcomeEstimate } from './OutcomeEstimate';
import { RuneIcon } from './RuneIcon';
import type { SlotKind } from './forgeSelection';

interface Props {
  atelier: AtelierApi;
  slotKind: SlotKind;
  tier: RuneTier;
  onFuse: () => void;
  showHelp: boolean;
  onToggleHelp: () => void;
}

const OUTCOMES: { outcome: RuneOutcome; cls: string; title: string }[] = [
  { outcome: 'SC', cls: 'text-sc hover:border-sc', title: 'Forcer un succès critique : la rune passe sans perte' },
  { outcome: 'SN', cls: 'text-sn hover:border-sn', title: "Forcer un succès neutre : la rune passe, perte = poids de la rune, reliquat consommé d'abord, ligne visée candidate" },
  { outcome: 'EC', cls: 'text-ec hover:border-ec', title: 'Forcer un échec critique : la rune ne passe pas, perte égale au poids de la rune (observé en jeu)' },
];

const SHORTCUTS: [string, string][] = [
  ['↑ ↓', 'changer de ligne'],
  ['1 2 3', 'choisir le palier'],
  ['Espace', 'fusionner'],
  ['/', 'filtrer les runes'],
  ['Ctrl+Z / Ctrl+Y', 'annuler / rétablir'],
  ['?', 'afficher cette aide'],
];

/** Le slot de fusion, sous les lignes : rune posée, prévision, Fusionner, Forcer. */
export function ForgeSlot({ atelier, slotKind, tier, onFuse, showHelp, onToggleHelp }: Props) {
  const { selected, item, itemLocked, mode } = atelier;
  const lockNote = getParamEntry<boolean>('params.transcendence.refuseIfOver');
  const rollLaw = getParamEntry<string>('params.craft.rollDistribution');
  if (!item) return null;

  const options = selected ? atelier.runeOptions(selected.characteristicId) : [];
  const option = options.find((o) => o.tier === tier);
  const estimate = selected && option ? atelier.estimate(selected.characteristicId, tier) : null;

  let body: ReactNode;
  if (itemLocked) {
    body = <p className="text-sm text-locked">Objet transcendé : plus aucune forgemagie ni orbe possible (devblog 2.58).</p>;
  } else if (mode !== 'forge') {
    body = <p className="text-sm text-ash-3">Mode « Ajuster » : réglez les lignes à la main. Cliquez une rune absente de la palette pour ajouter un exo à 0. Repassez en « Forger » (menu ⋯) pour fusionner.</p>;
  } else if (slotKind === 'orb') {
    body = (
      <div className="grid gap-2">
        <p className="m-0 flex flex-wrap items-center gap-1.5 text-[13px] text-ash-2">
          Remet l'objet à un jet de craft aléatoire, retire les exos, vide le reliquat.
          <StatusBadge status="HYPOTHÈSE COMMUNAUTAIRE" />
          <InfoTip label="Loi du jet de l'orbe">
            <p className="m-0">La loi du jet est un paramètre <StatusBadge status={rollLaw?.status ?? 'INCONNU'} /> (« {atelier.craftParams.rollDistribution} », section « Jet de craft » des paramètres), le même que pour « Jet aléatoire ». Le refus sur un objet transcendé est <StatusBadge status="SOURCE PRIMAIRE" />.</p>
            <ul className="m-0 mt-2 p-0 list-none">{FM_ORBS.filter((o) => !o.nameFr.includes('(lié)')).map((o) => <li key={o.id}>{o.nameFr} · niv. {o.level}</li>)}</ul>
          </InfoTip>
        </p>
        <button type="button" className="btn-cta w-full py-3 text-[18px]" onClick={() => atelier.applyOrb()}>Réinitialiser avec un orbe</button>
      </div>
    );
  } else if (slotKind === 'transcendence') {
    const runes = selected ? atelier.transcendenceOptions(selected.characteristicId) : [];
    body = (
      <div className="grid gap-2">
        <p className="m-0 flex flex-wrap items-center gap-1.5 text-[13px] text-ash-2">
          Se pose sans perte puis verrouille l'objet. <StatusBadge status="SOURCE PRIMAIRE" />
          <InfoTip label="Règles de la transcendance">
            <p className="m-0">Devblog 2.58 : plus aucune forgemagie ni orbe après la pose. Le refus si un over ou un exo est déjà présent est une <StatusBadge status={lockNote?.status ?? 'HYPOTHÈSE COMMUNAUTAIRE'} />.</p>
          </InfoTip>
        </p>
        {runes.map((r) => (
          <button key={r.runeId} type="button" onClick={() => selected && atelier.applyTranscendence(selected.characteristicId, r.runeId)} className="btn-cta flex items-center justify-between px-4 py-2.5 text-[15px]" title={`${r.nameFr}, niveau ${r.level}`}>
            <span>{r.nameFr.replace(/^Rune /, '')}</span>
            <span className="tnum">+{r.value} {selected?.statName}</span>
          </button>
        ))}
        {runes.length === 0 && <p className="text-sm text-ash-3">Aucune rune de transcendance pour cette ligne dans le dataset.</p>}
      </div>
    );
  } else if (slotKind === 'potion') {
    body = (
      <p className="m-0 text-[13px] text-ash-2">
        Potions non modélisées : la part de dégâts conservée est une <StatusBadge status="CONTRADICTION" /> entre les sources.{' '}
        {FM_POTIONS.length} potions au dataset.
      </p>
    );
  } else if (!selected) {
    body = <p className="text-sm text-ash-3">Cliquez une ligne ou une rune de la palette pour la viser.</p>;
  } else if (options.length === 0) {
    body = <p className="text-sm text-ash-3">Aucune rune de forgemagie n'existe pour {selected.statName}.</p>;
  } else {
    const applicable = estimate?.applicableValue ?? 0;
    body = (
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {option && <RuneIcon characteristicId={selected.characteristicId} img={option.img} size={30} title={option.nameFr} />}
            <span className="text-[14px] text-ash">{option?.nameFr}</span>
            <span className="text-xs text-ash-3 tnum">+{option?.value} · {option?.weight.toFixed(1)} poids</span>
          </div>
          {estimate && (
            <>
              <OutcomeEstimate estimate={estimate.estimate} model={estimate.model} isHeavyExo={estimate.isHeavyExo} heavyByWeight={estimate.heavyByWeight} characteristicId={selected.characteristicId} />
              <p className={`m-0 mt-1.5 flex items-center gap-1.5 text-[11px] tnum ${estimate.overCapUsage > 1 ? 'text-ec' : estimate.overCapUsage >= 0.85 ? 'text-molten-text' : 'text-ash-3'}`}>
                {applicable <= 0
                  ? 'Dépasserait la borne over/exo : la rune sera refusée.'
                  : option && applicable < option.value
                    ? `Tronquée à +${applicable} sur ${option.value} (${Math.round(estimate.overCapUsage * 100)} % de la borne).`
                    : `Borne over/exo après la rune : ${Math.round(estimate.overCapUsage * 100)} %.`}
                <InfoTip label="À propos de cette prévision">
                  <p className="m-0">Estimation d'un modèle paramétré, pas la formule du serveur. Seuls le plancher de quinze pour cent en forgemagie normale et le plancher d'un pour cent en exo PA/PM sont officiels.</p>
                  <p className="m-0 mt-2">Troncature : hypothèse « la rune s'arrête à la limite ».{atelier.probabilityParams.model === 'official_factors_linear' && atelier.probabilityParams.officialFactorsLinear.d !== 0 ? ` Pente d = ${atelier.probabilityParams.officialFactorsLinear.d}.` : ''}</p>
                </InfoTip>
              </p>
            </>
          )}
        </div>
        <div className="grid gap-1.5">
          <button type="button" className="btn-cta w-full py-3 text-[19px]" onClick={onFuse} title="Tirer l'issue avec le modèle actif, puis l'appliquer au moteur (Espace)">
            Fusionner <kbd className="ml-1 text-[11px] opacity-70">␣</kbd>
          </button>
          <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-1 items-center text-[11px] text-ash-3">
            <span title="Mode étude : imposer l'issue pour observer l'effet exact du moteur">Forcer</span>
            {OUTCOMES.map((o) => (
              <button key={o.outcome} type="button" onClick={() => atelier.forceRune(selected.characteristicId, tier, o.outcome)} className={`btn-well py-1 font-semibold text-[12px] tnum ${o.cls}`} title={o.title}>
                {o.outcome}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-slab-edge/60" aria-label="Fusion">
      {body}
      <div className="mt-2 flex justify-end">
        <button type="button" onClick={onToggleHelp} aria-expanded={showHelp} className="text-[11px] text-ash-3 hover:text-ash">⌨ raccourcis (?)</button>
      </div>
      {showHelp && (
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[12px] text-ash-2 m-0">
          {SHORTCUTS.map(([k, v]) => (<Fragment key={k}><dt><kbd className="font-mono text-ash">{k}</kbd></dt><dd className="m-0">{v}</dd></Fragment>))}
        </dl>
      )}
    </div>
  );
}
```

- [ ] **Step 3: ItemSlab — en-tête, menu ⋯, props**

Changer l'interface `Props` comme dans **Interfaces** ci-dessus (import `type ReactNode` depuis `react`, `RuneOption` depuis `../../hooks/useAtelier`, `RuneTier` depuis `../../types`, `ArmedTier` depuis `./forgeSelection`, `Crucible` depuis `./Crucible`). Retirer l'import d'`ExoPicker`.

a) Dans l'en-tête, après le bloc `<div className="ml-auto text-right">…% du jet parfait…</div>`, ajouter une ligne pleine largeur :

```tsx
        <div className="basis-full"><Crucible residualPool={atelier.residualPool} event={lastEvent} /></div>
```

b) Remplacer les blocs « Mode et outils » **et** « Saisie rapide du jet » par une seule barre ; le bloc « Qualité du jet » (span + barre + `InfoTip`) est conservé tel quel à droite :

```tsx
      <div className="flex flex-wrap items-center gap-2 py-3">
        <button type="button" onClick={atelier.undo} disabled={!atelier.canUndo} className="btn-well px-3 py-1.5 text-sm" title="Annuler (Ctrl+Z)">Annuler</button>
        <button type="button" onClick={atelier.redo} disabled={!atelier.canRedo} className="btn-well px-3 py-1.5 text-sm" title="Rétablir (Ctrl+Y)">Rétablir</button>
        {mode === 'adjust' && <span className="text-[11px] px-2 py-0.5 rounded-full border border-model text-model">mode Ajuster</span>}
        <details className="relative">
          <summary className="btn-well px-3 py-1.5 text-sm list-none cursor-pointer select-none" aria-label="Plus d'outils">⋯</summary>
          <div className="surface-iron absolute z-30 left-0 top-10 w-64 p-2 grid gap-1 shadow-panel text-sm">
            <div className="inline-flex p-0.5 rounded-control well" role="group" aria-label="Mode de l'atelier">
              {/* les deux boutons Forger / Ajuster actuels, inchangés */}
            </div>
            <button type="button" onClick={atelier.resetToPerfect} className="btn-well px-3 py-1.5 text-left">Objet neuf</button>
            <button type="button" onClick={atelier.setAllToMax} disabled={itemLocked} className="btn-well px-3 py-1.5 text-left">Jet : tout au max</button>
            <button type="button" onClick={atelier.setAllToMin} disabled={itemLocked} className="btn-well px-3 py-1.5 text-left">Jet : tout au min</button>
            <button type="button" onClick={() => atelier.rollRandom()} disabled={itemLocked} className="btn-well px-3 py-1.5 text-left" title={`Loi « ${craftParams.rollDistribution} » (paramètre INCONNU) ; exos et reliquat intacts`}>Jet aléatoire</button>
            {onSaveToShowcase && (
              <button type="button" onClick={() => { if (onSaveToShowcase()) setSavedTick((t) => t + 1); }} className="btn-well px-3 py-1.5 text-left">Sauvegarder dans la vitrine</button>
            )}
          </div>
        </details>
        {savedTick > 0 && <span key={savedTick} className="entry-forged text-xs text-over" role="status">Figé dans la vitrine</span>}
        {/* bloc « Qualité du jet » existant, avec sa classe ml-auto */}
      </div>
```

c) Dans `stats.map(...)`, passer à `ItemLine` :

```tsx
              onSelect={onSelectLine}
              tiers={selectedId === stat.characteristicId ? tierOptions : undefined}
              activeTier={activeTier}
              armedTier={armed && armed.characteristicId === stat.characteristicId ? armed.tier : null}
              onTierClick={onTierClick}
```

d) Supprimer les deux blocs de pied (`mode === 'adjust' && … <ExoPicker …/>` et le `<p>` d'aide en mode forger) et rendre `{children}` à leur place.

- [ ] **Step 4: Type-check**

Run: `npx tsc -b`
Expected: erreurs **uniquement** dans `src/pages/AtelierPage.tsx` (props d'`ItemSlab` manquantes) — corrigées en Task 8. Aucune autre erreur.

- [ ] **Step 5: Commit**

```bash
git add src/components/atelier/ForgeSlot.tsx src/components/atelier/ItemLine.tsx src/components/atelier/ItemSlab.tsx
git commit -m "Atelier : slot de fusion, paliers dans la ligne, barre d'outils repliee"
```

---

### Task 8: Assemblage `AtelierPage`, suppression d'`ActionPanel` / `ExoPicker`, vérification visuelle

**Files:**
- Modify: `src/pages/AtelierPage.tsx` (réécriture)
- Delete: `src/components/atelier/ActionPanel.tsx`, `src/components/atelier/ExoPicker.tsx`

**Interfaces:**
- Consumes: tout ce qui précède.

- [ ] **Step 1: Rewrite AtelierPage**

```tsx
// src/pages/AtelierPage.tsx
import { useCallback, useMemo, useRef, useState } from 'react';
import type { AtelierApi } from '../hooks/useAtelier';
import type { RuneTier } from '../types';
import { useParams } from '../app/ParamsProvider';
import { getDensity } from '../data/params';
import { ItemSlab } from '../components/atelier/ItemSlab';
import { ForgeSlot } from '../components/atelier/ForgeSlot';
import { RunePalette } from '../components/atelier/RunePalette';
import { SidePanel } from '../components/atelier/SidePanel';
import { exoToDropOnRetarget, nextLineId, resolveTier, tierClick, type ArmedTier, type SlotKind } from '../components/atelier/forgeSelection';
import { useForgeShortcuts } from '../hooks/useForgeShortcuts';

interface Props {
  atelier: AtelierApi;
  onSaveToShowcase: () => boolean;
}

/**
 * L'atelier, « fenêtre façon jeu » : historique/budget/coût à gauche, l'objet et le slot de
 * fusion au centre, la palette de runes à droite. ≥ 1280 px : trois colonnes ; 1024–1279 :
 * objet + palette, onglets dessous ; < 1024 : une colonne.
 */
export function AtelierPage({ atelier, onSaveToShowcase }: Props) {
  const { overrides } = useParams();
  const [chosenTier, setChosenTier] = useState<RuneTier>('normal');
  const [armed, setArmed] = useState<ArmedTier>(null);
  const [slotKind, setSlotKind] = useState<SlotKind>('rune');
  const [showHelp, setShowHelp] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { selected, stats, selectedId, item, itemLocked, mode } = atelier;
  const options = useMemo(() => (selected ? atelier.runeOptions(selected.characteristicId) : []), [selected, atelier]);
  const tier = resolveTier(options, chosenTier);
  const canForge = !!item && !itemLocked && mode === 'forge';
  const densityOf = useCallback((cid: number) => getDensity(cid, overrides), [overrides]);

  /** Change de cible ; un exo créé puis laissé à 0 est retiré (choix d'interface). */
  const retarget = useCallback(
    (cid: number) => {
      const drop = exoToDropOnRetarget(stats, selectedId, cid);
      if (drop !== null) atelier.removeExo(drop);
      atelier.selectLine(cid);
      setSlotKind('rune');
      setArmed(null);
    },
    [atelier, stats, selectedId]
  );

  const pickCharacteristic = useCallback(
    (cid: number, onItem: boolean) => {
      if (mode === 'adjust') {
        if (!onItem) atelier.addExo(cid);
        return;
      }
      if (onItem) return retarget(cid);
      const drop = exoToDropOnRetarget(stats, selectedId, cid);
      if (drop !== null) atelier.removeExo(drop);
      atelier.addExo(cid); // ADD_EXO vise la nouvelle ligne
      setSlotKind('rune');
      setArmed(null);
    },
    [atelier, mode, retarget, stats, selectedId]
  );

  const fuse = useCallback(
    (withTier: RuneTier = tier) => {
      if (!canForge || !selected || slotKind !== 'rune' || options.length === 0) return;
      atelier.attemptRune(selected.characteristicId, withTier);
    },
    [atelier, canForge, selected, slotKind, options.length, tier]
  );

  const onTierClick = useCallback(
    (t: RuneTier) => {
      if (!selected) return;
      const r = tierClick(armed, selected.characteristicId, t);
      setArmed(r.armed);
      setChosenTier(t);
      setSlotKind('rune');
      if (r.fire) fuse(t);
    },
    [armed, selected, fuse]
  );

  useForgeShortcuts(
    {
      onMove: (dir) => {
        const id = nextLineId(stats, selectedId, dir);
        if (id !== null && id !== selectedId) retarget(id);
      },
      onTier: (i) => {
        const o = options[i];
        if (o) { setChosenTier(o.tier); setArmed(null); }
      },
      onFuse: () => fuse(),
      onFocusSearch: () => searchRef.current?.focus(),
      onToggleHelp: () => setShowHelp((v) => !v),
    },
    !!item
  );

  const canTranscend = !!selected && atelier.transcendenceOptions(selected.characteristicId).length > 0;

  return (
    <div className="grid gap-5 px-4 sm:px-7 py-6 max-w-[1480px] mx-auto grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[260px_minmax(0,1fr)_300px] items-start">
      <aside className="order-3 lg:col-span-2 xl:col-span-1 xl:order-1 min-w-0">
        <SidePanel atelier={atelier} />
      </aside>

      <div className="order-1 xl:order-2 min-w-0">
        <ItemSlab
          atelier={atelier}
          onSaveToShowcase={item ? onSaveToShowcase : undefined}
          onSelectLine={retarget}
          tierOptions={options}
          activeTier={tier}
          armed={armed}
          onTierClick={onTierClick}
        >
          <ForgeSlot atelier={atelier} slotKind={slotKind} tier={tier} onFuse={() => fuse()} showHelp={showHelp} onToggleHelp={() => setShowHelp((v) => !v)} />
        </ItemSlab>
      </div>

      <aside className="order-2 xl:order-3 min-w-0">
        <RunePalette
          stats={stats}
          densityOf={densityOf}
          heavyIds={atelier.probabilityParams.heavyExoCharacteristics}
          selectedId={selectedId}
          slotKind={slotKind}
          mode={mode}
          disabled={!item || itemLocked}
          canTranscend={canTranscend}
          onPickCharacteristic={pickCharacteristic}
          onPickSlot={(kind) => { setSlotKind(kind); setArmed(null); }}
          searchRef={searchRef}
        />
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: Delete the replaced components**

```bash
git rm src/components/atelier/ActionPanel.tsx src/components/atelier/ExoPicker.tsx
grep -rn "ActionPanel\|ExoPicker" src
```
Expected: `grep` ne renvoie rien.

- [ ] **Step 3: Type-check, lint, full test suite**

Run: `npx tsc -b && npm run lint && npx vitest run`
Expected: 0 erreur de type, 0 erreur de lint, tous les tests PASS.

- [ ] **Step 4: Visual verification in the browser**

Run: `npx vite --port 5199 --strictPort` (en arrière-plan), puis avec Playwright :
1. 1440×900 : chercher « Cape Bouffante Royale », la poser ; capture pleine page. Attendu : trois colonnes, reliquat dans l'en-tête, paliers sur la ligne visée, palette à droite.
2. Cliquer la tuile PA de la palette : une ligne « exo à poser » apparaît et est visée ; la prévision montre 1 / 0 / 99. Cliquer la tuile Vitalité : la ligne PA à 0 disparaît.
3. Clavier : `↓`, `2`, `Espace` → une entrée s'ajoute à l'Historique.
4. Clic `+15` puis `+15` sur la ligne visée → une frappe ; un seul clic → rien, le bouton affiche « fusionner ».
5. Tuile PM puis tuile d'une caractéristique légère (ex. Dommages distance) : la prévision passe en deux barres « meilleure / pire création ».
6. 1100×900 et 390×844 : captures ; rien ne déborde horizontalement.

- [ ] **Step 5: Commit**

```bash
git add src/pages/AtelierPage.tsx
git commit -m "Atelier en fenetre facon jeu : palette de runes, slot de fusion, raccourcis"
```

---

## Self-review (fait à l'écriture)

- Couverture de la spec : §3.1 → Task 6 ; §3.2 → Tasks 6–7 ; §3.3 → Tasks 1, 4 ; §4 → Tasks 2, 3, 8 ; §5 → Task 5 ; §6 → contrainte globale + Tasks 5–7 (textes déplacés, badges gardés) ; §7 fichiers → Tasks 1–8 ; §8 tests → Tasks 1–5 + étape visuelle Task 8.
- Noms cohérents : `SlotKind`, `ArmedTier`, `resolveTier`, `tierClick`, `exoToDropOnRetarget`, `nextLineId`, `buildPaletteGroups`, `useForgeShortcuts` identiques d'une tâche à l'autre.
- `ItemSlab` casse `AtelierPage` entre Task 7 et Task 8 : signalé à l'étape 4 de Task 7.
