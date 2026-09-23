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
