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
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
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
