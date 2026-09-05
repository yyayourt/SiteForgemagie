import { describe, it, expect } from 'vitest';
import { computeItemPool, getStatStatus, computeMaxReachable } from '../logic/poolCalculator';
import type { SimulatedStat } from '../types';

// Identifiants de caractéristiques DofusDB (data/dataset.json → characteristics)
const CHAR_PA = 1;
const CHAR_FORCE = 10;
const CHAR_VITALITE = 11;

function makeStat(overrides: Partial<SimulatedStat> = {}): SimulatedStat {
  return {
    characteristicId: CHAR_FORCE,
    statName: 'Force',
    baseMin: 30,
    baseMax: 50,
    currentValue: 50,
    weightPerPoint: 1,
    isExo: false,
    isForgemeable: true,
    ...overrides,
  };
}

describe('computeItemPool', () => {
  it('returns zero pool when all stats are at perfect', () => {
    const stats = [
      makeStat({ characteristicId: CHAR_FORCE, baseMax: 50, currentValue: 50, weightPerPoint: 1 }),
      makeStat({ characteristicId: CHAR_VITALITE, baseMax: 300, currentValue: 300, weightPerPoint: 0.2 }),
    ];
    const result = computeItemPool(stats);
    expect(result.poolGained).toBe(0);
    expect(result.poolSpent).toBe(0);
    expect(result.poolRemaining).toBe(0);
    expect(result.baseWeight).toBe(50 * 1 + 300 * 0.2);
  });

  it('calculates pool gained when a line is sacrificed', () => {
    const stats = [
      makeStat({ characteristicId: CHAR_VITALITE, baseMax: 500, currentValue: 0, weightPerPoint: 0.2 }),
    ];
    const result = computeItemPool(stats);
    expect(result.poolGained).toBe(500 * 0.2); // 100
    expect(result.poolSpent).toBe(0);
    expect(result.poolRemaining).toBe(100);
  });

  it('calculates pool spent on over', () => {
    const stats = [
      makeStat({ characteristicId: CHAR_FORCE, baseMax: 50, currentValue: 60, weightPerPoint: 1 }),
    ];
    const result = computeItemPool(stats);
    expect(result.poolGained).toBe(0);
    expect(result.poolSpent).toBe(10); // 10 points over * 1 weight
    expect(result.poolRemaining).toBe(-10);
  });

  it('balances sacrificed lines vs overs', () => {
    const stats = [
      makeStat({ characteristicId: CHAR_VITALITE, baseMax: 500, currentValue: 0, weightPerPoint: 0.2 }), // +100 pool
      makeStat({ characteristicId: CHAR_FORCE, baseMax: 50, currentValue: 80, weightPerPoint: 1 }), // -30 pool
    ];
    const result = computeItemPool(stats);
    expect(result.poolGained).toBe(100);
    expect(result.poolSpent).toBe(30);
    expect(result.poolRemaining).toBe(70);
  });

  it('handles exo stats correctly', () => {
    const stats = [
      makeStat({ characteristicId: CHAR_VITALITE, baseMax: 500, currentValue: 0, weightPerPoint: 0.2 }), // +100 pool
      makeStat({ characteristicId: CHAR_PA, currentValue: 1, weightPerPoint: 100, isExo: true }), // -100 pool
    ];
    const result = computeItemPool(stats);
    expect(result.poolGained).toBe(100);
    expect(result.poolSpent).toBe(100);
    expect(result.poolRemaining).toBe(0);
  });

  it('ignores non-forgeable stats', () => {
    const stats = [
      makeStat({ characteristicId: 999, isForgemeable: false, currentValue: 100 }),
    ];
    const result = computeItemPool(stats);
    expect(result.baseWeight).toBe(0);
    expect(result.poolGained).toBe(0);
  });
});

describe('getStatStatus', () => {
  it('returns "perfect" when at base max', () => {
    expect(getStatStatus(makeStat({ baseMax: 50, currentValue: 50 }))).toBe('perfect');
  });

  it('returns "over" when above base max', () => {
    expect(getStatStatus(makeStat({ baseMax: 50, currentValue: 55 }))).toBe('over');
  });

  it('returns "sacrificed" when below base max', () => {
    expect(getStatStatus(makeStat({ baseMax: 50, currentValue: 30 }))).toBe('sacrificed');
  });

  it('returns "exo" for exo stats', () => {
    expect(getStatStatus(makeStat({ isExo: true }))).toBe('exo');
  });
});

describe('computeMaxReachable (plafonds dérivés de empirical_params.json, lecture par ligne)', () => {
  it('calculates max reachable from pool (Force)', () => {
    // Force : densité 1, cap 101 → absoluteMax = 151. Budget 20 limite à 70.
    const stat = makeStat({ characteristicId: CHAR_FORCE, currentValue: 50, baseMax: 50, weightPerPoint: 1 });
    expect(computeMaxReachable(stat, 20)).toBe(70);
  });

  it('handles fractional weights (Vitalité)', () => {
    // Vitalité : densité 0,2, cap 505 → absoluteMax = 805. Budget 10 limite à 350.
    const stat = makeStat({ characteristicId: CHAR_VITALITE, currentValue: 300, baseMax: 300, weightPerPoint: 0.2 });
    expect(computeMaxReachable(stat, 10)).toBe(350);
  });

  it('returns current value when weight is 0', () => {
    const stat = makeStat({ currentValue: 50, weightPerPoint: 0 });
    expect(computeMaxReachable(stat, 100)).toBe(50);
  });

  it('limits max by per-line cap when cap is tighter than pool (Force cap=151)', () => {
    const stat = makeStat({ characteristicId: CHAR_FORCE, currentValue: 50, baseMax: 50, weightPerPoint: 1 });
    expect(computeMaxReachable(stat, 200)).toBe(151); // 50 + floor(101 / 1)
  });

  it('limits exo PA to floor(101 / 100) = 1', () => {
    const stat = makeStat({ characteristicId: CHAR_PA, currentValue: 1, baseMax: 0, weightPerPoint: 100, isExo: true });
    expect(computeMaxReachable(stat, 200)).toBe(1);
  });

  it('limits exo Vitalité to floor(101 / 0.2) = 505', () => {
    const stat = makeStat({ characteristicId: CHAR_VITALITE, currentValue: 100, baseMax: 0, weightPerPoint: 0.2, isExo: true });
    expect(computeMaxReachable(stat, 10000)).toBe(505);
  });

  it('returns Infinity-bounded max for a characteristic without documented density', () => {
    const stat = makeStat({ characteristicId: 9999, currentValue: 10, baseMax: 10, weightPerPoint: 1 });
    expect(computeMaxReachable(stat, 5)).toBe(15); // seul le budget limite
  });
});
