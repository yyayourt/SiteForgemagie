import { describe, it, expect } from 'vitest';
import { computeItemPool, getStatStatus, computeMaxReachable } from '../logic/poolCalculator';
import type { SimulatedStat } from '../types';

function makeStat(overrides: Partial<SimulatedStat> = {}): SimulatedStat {
  return {
    effectId: 118,
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
      makeStat({ effectId: 118, baseMax: 50, currentValue: 50, weightPerPoint: 1 }),
      makeStat({ effectId: 125, baseMax: 300, currentValue: 300, weightPerPoint: 0.2 }),
    ];
    const result = computeItemPool(stats);
    expect(result.poolGained).toBe(0);
    expect(result.poolSpent).toBe(0);
    expect(result.poolRemaining).toBe(0);
    expect(result.baseWeight).toBe(50 * 1 + 300 * 0.2);
  });

  it('calculates pool gained when a line is sacrificed', () => {
    const stats = [
      makeStat({ effectId: 125, baseMax: 500, currentValue: 0, weightPerPoint: 0.2 }),
    ];
    const result = computeItemPool(stats);
    expect(result.poolGained).toBe(500 * 0.2); // 100
    expect(result.poolSpent).toBe(0);
    expect(result.poolRemaining).toBe(100);
  });

  it('calculates pool spent on over', () => {
    const stats = [
      makeStat({ effectId: 118, baseMax: 50, currentValue: 60, weightPerPoint: 1 }),
    ];
    const result = computeItemPool(stats);
    expect(result.poolGained).toBe(0);
    expect(result.poolSpent).toBe(10); // 10 points over * 1 weight
    expect(result.poolRemaining).toBe(-10);
  });

  it('balances sacrificed lines vs overs', () => {
    const stats = [
      makeStat({ effectId: 125, baseMax: 500, currentValue: 0, weightPerPoint: 0.2 }), // +100 pool
      makeStat({ effectId: 118, baseMax: 50, currentValue: 80, weightPerPoint: 1 }), // -30 pool
    ];
    const result = computeItemPool(stats);
    expect(result.poolGained).toBe(100);
    expect(result.poolSpent).toBe(30);
    expect(result.poolRemaining).toBe(70);
  });

  it('handles exo stats correctly', () => {
    const stats = [
      makeStat({ effectId: 125, baseMax: 500, currentValue: 0, weightPerPoint: 0.2 }), // +100 pool
      makeStat({ effectId: 111, currentValue: 1, weightPerPoint: 100, isExo: true }), // -100 pool
    ];
    const result = computeItemPool(stats);
    expect(result.poolGained).toBe(100);
    expect(result.poolSpent).toBe(100);
    expect(result.poolRemaining).toBe(0);
  });

  it('ignores non-forgeable stats', () => {
    const stats = [
      makeStat({ effectId: 999, isForgemeable: false, currentValue: 100 }),
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

describe('computeMaxReachable', () => {
  it('calculates max reachable from pool (Force effectId=118)', () => {
    // Force: baseMax=50, cap=101 over → absoluteMax=151. Pool=20 limits to 70.
    const stat = makeStat({ effectId: 118, currentValue: 50, baseMax: 50, weightPerPoint: 1 });
    const result = computeMaxReachable(stat, 20);
    expect(result).toBe(70); // puits limits: 50 + 20/1 = 70 < 151 cap
  });

  it('handles fractional weights (Vitalité effectId=125)', () => {
    // Vitalité: baseMax=300, cap=505 over → absoluteMax=805. Pool=10 limits to 350.
    const stat = makeStat({ effectId: 125, currentValue: 300, baseMax: 300, weightPerPoint: 0.2 });
    const result = computeMaxReachable(stat, 10);
    expect(result).toBe(350); // puits limits: 300 + floor(10/0.2) = 350 < 805 cap
  });

  it('returns current value when weight is 0', () => {
    const stat = makeStat({ currentValue: 50, weightPerPoint: 0 });
    const result = computeMaxReachable(stat, 100);
    expect(result).toBe(50);
  });

  it('limits max by per-line cap when cap is tighter than pool (Force cap=151)', () => {
    // Force (effectId=118): baseMax=50, maxOver=101 → absoluteMax=151.
    // Pool allows +200, but per-line cap limits to 151.
    const stat = makeStat({ effectId: 118, currentValue: 50, baseMax: 50, weightPerPoint: 1 });
    const result = computeMaxReachable(stat, 200);
    expect(result).toBe(151); // per-line cap limits: 50 + 101 = 151
  });

  it('limits exo PA to absoluteMax of 1', () => {
    // PA exo (effectId=111): absoluteMax=1, weightPerPoint=100
    const stat = makeStat({ effectId: 111, currentValue: 1, baseMax: 0, weightPerPoint: 100, isExo: true });
    const result = computeMaxReachable(stat, 200);
    expect(result).toBe(1); // absoluteMax=1 caps at 1
  });

  it('limits exo Vitalité to maxOverOrExo=505', () => {
    // Exo vitalité (effectId=125): no absoluteMax, maxOverOrExo=505
    const stat = makeStat({ effectId: 125, currentValue: 100, baseMax: 0, weightPerPoint: 0.2, isExo: true });
    const result = computeMaxReachable(stat, 10000);
    expect(result).toBe(505); // per-line cap for exo = maxOverOrExo = 505
  });
});
