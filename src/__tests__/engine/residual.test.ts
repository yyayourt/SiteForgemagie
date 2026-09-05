/**
 * Reliquat serveur (residualPool) : création, absorption prioritaire, jamais négatif,
 * conservation des fractions, purge paramétrée. Issues SC/SN/EC FOURNIES.
 */
import { describe, it, expect } from 'vitest';
import { applyRune, onItemLeavesWorkshop } from '../../logic/engine';
import { CHAR, getLine, line, makeState, seqRng, testParams } from './helpers';

const uniform = () =>
  testParams({ lossSelection: { strategy: 'uniform', prioritizeOverExo: true } });

describe('applyRune — SC', () => {
  it('applies the rune, no loss, residual unchanged', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 }), line({ characteristicId: CHAR.SAGESSE, value: 30 })], 4.5);
    const r = applyRune(state, { characteristicId: CHAR.FORCE, value: 1 }, 'SC', uniform(), seqRng([0]));
    expect(r.accepted).toBe(true);
    expect(getLine(r.state, CHAR.FORCE).value).toBe(51);
    expect(getLine(r.state, CHAR.SAGESSE).value).toBe(30);
    expect(r.losses).toEqual([]);
    expect(r.lossRequested).toBe(0);
    expect(r.residualPoolAfter).toBe(4.5);
    expect(r.runeWeight).toBe(1); // Force : densité 1
  });

  it('does not mutate the input state', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]);
    applyRune(state, { characteristicId: CHAR.FORCE, value: 1 }, 'SC', uniform(), seqRng([0]));
    expect(getLine(state, CHAR.FORCE).value).toBe(50);
  });
});

describe('applyRune — SN : création du reliquat', () => {
  it('residual = weight actually removed − rune weight (Fo +1 removes 1 Sagesse = 3 → residual 2)', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 }), line({ characteristicId: CHAR.SAGESSE, value: 30 })]);
    const r = applyRune(state, { characteristicId: CHAR.FORCE, value: 1 }, 'SN', uniform(), seqRng([0]));
    expect(r.accepted).toBe(true);
    expect(getLine(r.state, CHAR.FORCE).value).toBe(51);
    expect(getLine(r.state, CHAR.SAGESSE).value).toBe(29);
    expect(r.losses).toEqual([{ characteristicId: CHAR.SAGESSE, pointsLost: 1, weightLost: 3 }]);
    expect(r.lossRequested).toBe(1);
    expect(r.absorbedByResidual).toBe(0);
    expect(r.residualPoolBefore).toBe(0);
    expect(r.residualPoolAfter).toBe(2);
  });

  it('the targeted line is never the victim', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 }), line({ characteristicId: CHAR.SAGESSE, value: 30 })]);
    for (const roll of [0, 0.5, 0.999]) {
      const r = applyRune(state, { characteristicId: CHAR.FORCE, value: 1 }, 'SN', uniform(), seqRng([roll]));
      expect(r.losses.every((l) => l.characteristicId !== CHAR.FORCE)).toBe(true);
    }
  });

  it('a loss larger than one line cascades over several lines', () => {
    // Rune Do +1 = 20 de poids ; Force 2 (2 de poids) puis Sagesse (3/pt)
    const state = makeState([
      line({ characteristicId: CHAR.DOMMAGES, value: 5 }),
      line({ characteristicId: CHAR.FORCE, value: 2 }),
      line({ characteristicId: CHAR.SAGESSE, value: 30 }),
    ]);
    const r = applyRune(state, { characteristicId: CHAR.DOMMAGES, value: 1 }, 'SN', uniform(), seqRng([0]));
    expect(r.losses).toEqual([
      { characteristicId: CHAR.FORCE, pointsLost: 2, weightLost: 2 },
      { characteristicId: CHAR.SAGESSE, pointsLost: 6, weightLost: 18 },
    ]);
    expect(getLine(r.state, CHAR.FORCE).value).toBe(0);
    expect(getLine(r.state, CHAR.SAGESSE).value).toBe(24);
    expect(r.residualPoolAfter).toBe(0);
    expect(r.unabsorbedWeight).toBe(0);
  });
});

describe('applyRune — absorption prioritaire par le reliquat', () => {
  it('a residual ≥ loss absorbs everything, no line loses', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 }), line({ characteristicId: CHAR.SAGESSE, value: 30 })], 5);
    const r = applyRune(state, { characteristicId: CHAR.FORCE, value: 1 }, 'SN', uniform(), seqRng([0]));
    expect(r.absorbedByResidual).toBe(1);
    expect(r.losses).toEqual([]);
    expect(r.residualPoolAfter).toBe(4);
    expect(getLine(r.state, CHAR.SAGESSE).value).toBe(30);
  });

  it('a partial residual absorbs its share, the rest hits a line and rebuilds the residual', () => {
    // Rune Sa +1 = 3 ; reliquat 0,5 → reste 2,5 ; Force (1/pt) perd ceil(2,5) = 3 → reliquat 0,5
    const state = makeState([line({ characteristicId: CHAR.SAGESSE, value: 30 }), line({ characteristicId: CHAR.FORCE, value: 50 })], 0.5);
    const r = applyRune(state, { characteristicId: CHAR.SAGESSE, value: 1 }, 'SN', uniform(), seqRng([0]));
    expect(r.absorbedByResidual).toBe(0.5);
    expect(r.losses).toEqual([{ characteristicId: CHAR.FORCE, pointsLost: 3, weightLost: 3 }]);
    expect(getLine(r.state, CHAR.FORCE).value).toBe(47);
    expect(r.residualPoolAfter).toBeCloseTo(0.5, 9);
  });

  it('keeps fractional residuals (0,7 absorbed, 0,3 left → 1 Sagesse removed → residual 2,7)', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 }), line({ characteristicId: CHAR.SAGESSE, value: 30 })], 0.7);
    const r = applyRune(state, { characteristicId: CHAR.FORCE, value: 1 }, 'EC', uniform(), seqRng([0]));
    expect(r.absorbedByResidual).toBeCloseTo(0.7, 9);
    expect(r.losses).toEqual([{ characteristicId: CHAR.SAGESSE, pointsLost: 1, weightLost: 3 }]);
    expect(r.residualPoolAfter).toBeCloseTo(2.7, 9);
  });
});

describe('applyRune — EC', () => {
  it('does not apply the rune and loses ecLossFactor × rune weight (default 1)', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 }), line({ characteristicId: CHAR.SAGESSE, value: 30 })]);
    const r = applyRune(state, { characteristicId: CHAR.FORCE, value: 1 }, 'EC', uniform(), seqRng([0]));
    expect(r.accepted).toBe(true);
    expect(getLine(r.state, CHAR.FORCE).value).toBe(50);
    expect(r.lossRequested).toBe(1);
    expect(getLine(r.state, CHAR.SAGESSE).value).toBe(29);
    expect(r.residualPoolAfter).toBe(2);
  });

  it('honours a custom ecLossFactor', () => {
    const params = testParams({ ecLossFactor: 0.5, lossSelection: { strategy: 'uniform' } });
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 }), line({ characteristicId: CHAR.SAGESSE, value: 30 })]);
    const r = applyRune(state, { characteristicId: CHAR.FORCE, value: 1 }, 'EC', params, seqRng([0]));
    expect(r.lossRequested).toBe(0.5);
    expect(r.residualPoolAfter).toBe(2.5);
  });
});

describe('residual never negative', () => {
  it('when no line can absorb the loss, residual stays ≥ 0 and the loss is reported unabsorbed', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })], 0.25);
    const r = applyRune(state, { characteristicId: CHAR.FORCE, value: 1 }, 'EC', uniform(), seqRng([0]));
    expect(r.absorbedByResidual).toBe(0.25);
    expect(r.unabsorbedWeight).toBeCloseTo(0.75, 9);
    expect(r.residualPoolAfter).toBe(0);
    expect(r.residualPoolAfter).toBeGreaterThanOrEqual(0);
  });

  it('a big loss on an item with many small lines never drives the residual below 0', () => {
    const state = makeState([
      line({ characteristicId: CHAR.PA, value: 1 }),
      line({ characteristicId: CHAR.FORCE, value: 3 }),
      line({ characteristicId: CHAR.SAGESSE, value: 2 }),
    ]);
    const r = applyRune(state, { characteristicId: CHAR.PA, value: 1 }, 'EC', uniform(), seqRng([0, 0.9, 0.3]));
    expect(r.residualPoolAfter).toBeGreaterThanOrEqual(0);
    expect(r.losses.reduce((s, l) => s + l.weightLost, 0)).toBeLessThanOrEqual(100);
  });
});

describe('refusals', () => {
  it('refuses a rune on a locked line', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50, isLocked: true })]);
    const r = applyRune(state, { characteristicId: CHAR.FORCE, value: 1 }, 'SC', uniform(), seqRng([0]));
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('line_locked');
    expect(r.state).toBe(state);
  });

  it('refuses any rune on a locked item', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })], 0, { itemLocked: true });
    const r = applyRune(state, { characteristicId: CHAR.SAGESSE, value: 1 }, 'SC', uniform(), seqRng([0]));
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('item_locked');
  });

  it('refuses a rune without documented density', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]);
    const r = applyRune(state, { characteristicId: 9999, value: 1 }, 'SC', uniform(), seqRng([0]));
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('no_density');
  });
});

describe('residual reset on equip / market (HYPOTHÈSE COMMUNAUTAIRE, paramètre)', () => {
  it('resets to 0 when resetOnEquipOrMarket is true', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })], 12.5);
    const params = testParams({ residualPool: { resetOnEquipOrMarket: true } });
    expect(onItemLeavesWorkshop(state, 'equip', params).residualPool).toBe(0);
    expect(onItemLeavesWorkshop(state, 'market', params).residualPool).toBe(0);
  });

  it('keeps the residual when resetOnEquipOrMarket is false', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })], 12.5);
    const params = testParams({ residualPool: { resetOnEquipOrMarket: false } });
    expect(onItemLeavesWorkshop(state, 'equip', params).residualPool).toBe(12.5);
  });
});
