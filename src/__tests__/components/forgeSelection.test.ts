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
  it("garde le palier choisi s'il existe, sinon le premier disponible", () => {
    expect(resolveTier([{ tier: 'normal' }, { tier: 'pa' }], 'pa')).toBe('pa');
    expect(resolveTier([{ tier: 'pa' }, { tier: 'ra' }], 'normal')).toBe('pa');
    expect(resolveTier([], 'ra')).toBe('normal');
  });
});

describe('tierClick', () => {
  it("premier clic arme, second clic sur le même palier de la même ligne fusionne", () => {
    const first = tierClick(null, 11, 'pa');
    expect(first).toEqual({ armed: { characteristicId: 11, tier: 'pa' }, fire: false });
    expect(tierClick(first.armed, 11, 'pa').fire).toBe(true);
  });
  it("un autre palier ou une autre ligne ré-arme sans fusionner", () => {
    const armed = { characteristicId: 11, tier: 'pa' as const };
    expect(tierClick(armed, 11, 'ra')).toEqual({ armed: { characteristicId: 11, tier: 'ra' }, fire: false });
    expect(tierClick(armed, 10, 'pa').fire).toBe(false);
  });
});

describe('exoToDropOnRetarget', () => {
  const stats = [stat(11), stat(1, { isExo: true, baseMin: 0, baseMax: 0, currentValue: 0 }), stat(23, { isExo: true, baseMin: 0, baseMax: 0, currentValue: 1 })];
  it("retire un exo resté à 0 quand on vise ailleurs", () => {
    expect(exoToDropOnRetarget(stats, 1, 11)).toBe(1);
  });
  it("ne retire rien si l'exo a une valeur, si on revise la même ligne, ou si la cible courante est naturelle", () => {
    expect(exoToDropOnRetarget(stats, 23, 11)).toBeNull();
    expect(exoToDropOnRetarget(stats, 1, 1)).toBeNull();
    expect(exoToDropOnRetarget(stats, 11, 1)).toBeNull();
    expect(exoToDropOnRetarget(stats, null, 1)).toBeNull();
  });
});

describe('nextLineId', () => {
  const stats = [stat(11), stat(10, { isLocked: true }), stat(12), stat(13, { isForgemeable: false })];
  it("saute les lignes verrouillées ou non forgeables et reste borné", () => {
    expect(nextLineId(stats, 11, 1)).toBe(12);
    expect(nextLineId(stats, 12, 1)).toBe(12);
    expect(nextLineId(stats, 12, -1)).toBe(11);
    expect(nextLineId(stats, 11, -1)).toBe(11);
  });
  it("sans cible : première ligne en descendant, dernière en montant", () => {
    expect(nextLineId(stats, null, 1)).toBe(11);
    expect(nextLineId(stats, null, -1)).toBe(12);
    expect(nextLineId([], null, 1)).toBeNull();
  });
});
