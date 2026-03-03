import { describe, it, expect, vi } from 'vitest';
import {
  computeOutcomeProbabilities,
  pickRecoilTarget,
  getRuneValue,
  simulateRune,
} from '../logic/runeSimulator';
import type { SimulatedStat } from '../types';

// ── computeOutcomeProbabilities ──────────────────────────────────

describe('computeOutcomeProbabilities', () => {
  it('returns 100% SC for zero rune weight', () => {
    const { pSC, pSN, pEC } = computeOutcomeProbabilities(10, 0);
    expect(pSC).toBe(1);
    expect(pSN).toBe(0);
    expect(pEC).toBe(0);
  });

  it('probabilities always sum to 1', () => {
    const cases = [
      [0, 5],
      [10, 5],
      [50, 10],
      [-20, 5],
      [-100, 3],
      [100, 1],
    ];
    for (const [pool, weight] of cases) {
      const { pSC, pSN, pEC } = computeOutcomeProbabilities(pool, weight);
      expect(pSC + pSN + pEC).toBeCloseTo(1, 5);
      expect(pSC).toBeGreaterThanOrEqual(0);
      expect(pSN).toBeGreaterThanOrEqual(0);
      expect(pEC).toBeGreaterThanOrEqual(0);
    }
  });

  it('higher pool → higher SC probability', () => {
    const low = computeOutcomeProbabilities(5, 10);
    const high = computeOutcomeProbabilities(50, 10);
    expect(high.pSC).toBeGreaterThan(low.pSC);
  });

  it('negative pool → higher EC probability', () => {
    const positive = computeOutcomeProbabilities(10, 5);
    const negative = computeOutcomeProbabilities(-20, 5);
    expect(negative.pEC).toBeGreaterThan(positive.pEC);
  });

  it('SC caps at 90%', () => {
    const { pSC } = computeOutcomeProbabilities(10000, 1);
    expect(pSC).toBeLessThanOrEqual(0.9);
  });

  it('EC caps at 50%', () => {
    const { pEC } = computeOutcomeProbabilities(-10000, 1);
    expect(pEC).toBeLessThanOrEqual(0.5);
  });
});

// ── pickRecoilTarget ─────────────────────────────────────────────

describe('pickRecoilTarget', () => {
  const baseStats: SimulatedStat[] = [
    { effectId: 125, statName: 'Vitalité', baseMin: 200, baseMax: 300, currentValue: 250, weightPerPoint: 0.2, isExo: false, isForgemeable: true },
    { effectId: 118, statName: 'Force', baseMin: 30, baseMax: 50, currentValue: 40, weightPerPoint: 1, isExo: false, isForgemeable: true },
    { effectId: 126, statName: 'Sagesse', baseMin: 20, baseMax: 30, currentValue: 25, weightPerPoint: 3, isExo: false, isForgemeable: true },
  ];

  it('excludes the target stat', () => {
    for (let i = 0; i < 50; i++) {
      const victim = pickRecoilTarget(baseStats, 125);
      expect(victim).not.toBeNull();
      expect(victim!.effectId).not.toBe(125);
    }
  });

  it('excludes stats with currentValue 0', () => {
    const stats: SimulatedStat[] = [
      { ...baseStats[0], currentValue: 0 },
      { ...baseStats[1] },
      { ...baseStats[2], currentValue: 0 },
    ];
    for (let i = 0; i < 20; i++) {
      const victim = pickRecoilTarget(stats, 999);
      expect(victim).not.toBeNull();
      expect(victim!.effectId).toBe(118); // only one with value > 0
    }
  });

  it('returns null if no candidates', () => {
    const stats: SimulatedStat[] = [
      { ...baseStats[0], currentValue: 0 },
    ];
    const victim = pickRecoilTarget(stats, 999);
    expect(victim).toBeNull();
  });
});

// ── getRuneValue ─────────────────────────────────────────────────

describe('getRuneValue', () => {
  it('returns normal rune value for tier normal', () => {
    // effectId 118 = Force, runeNormal=1, runePa=3, runeRa=10
    const value = getRuneValue(118, 'normal');
    expect(value).toBe(1);
  });

  it('returns Pa rune value for tier pa', () => {
    const value = getRuneValue(118, 'pa');
    expect(value).toBe(3);
  });

  it('returns Ra rune value for tier ra', () => {
    const value = getRuneValue(118, 'ra');
    expect(value).toBe(10);
  });

  it('returns 0 for unknown effectId', () => {
    const value = getRuneValue(99999, 'normal');
    expect(value).toBe(0);
  });
});

// ── simulateRune ─────────────────────────────────────────────────

describe('simulateRune', () => {
  const makeStats = (): SimulatedStat[] => [
    { effectId: 125, statName: 'Vitalité', baseMin: 200, baseMax: 300, currentValue: 300, weightPerPoint: 0.2, isExo: false, isForgemeable: true },
    { effectId: 118, statName: 'Force', baseMin: 30, baseMax: 50, currentValue: 50, weightPerPoint: 1, isExo: false, isForgemeable: true },
    { effectId: 126, statName: 'Sagesse', baseMin: 20, baseMax: 30, currentValue: 30, weightPerPoint: 3, isExo: false, isForgemeable: true },
  ];

  it('returns a valid SimulationResult', () => {
    const result = simulateRune(makeStats(), 118, 'normal', 1);
    expect(result).toHaveProperty('outcome');
    expect(result).toHaveProperty('newStats');
    expect(result).toHaveProperty('logEntry');
    expect(['SC', 'SN', 'EC']).toContain(result.outcome);
  });

  it('log entry has correct metadata', () => {
    const result = simulateRune(makeStats(), 118, 'pa', 42);
    expect(result.logEntry.id).toBe(42);
    expect(result.logEntry.targetEffectId).toBe(118);
    expect(result.logEntry.targetStatName).toBe('Force');
    expect(result.logEntry.runeTier).toBe('pa');
    expect(result.logEntry.runeValue).toBe(3); // Pa Force = 3
    expect(result.logEntry.runeWeight).toBe(3); // 3 * 1 weight
  });

  it('SC adds rune value with no side effect', () => {
    // Mock random to always return 0 (= SC since pSC > 0)
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const stats = makeStats();
    const result = simulateRune(stats, 118, 'normal', 1);

    expect(result.outcome).toBe('SC');
    const forceStat = result.newStats.find((s) => s.effectId === 118)!;
    expect(forceStat.currentValue).toBe(51); // 50 + 1
    expect(result.logEntry.sideEffect).toBeUndefined();

    vi.restoreAllMocks();
  });

  it('EC does not add rune value', () => {
    // Mock random to always return 0.99 (= EC since pEC is last range)
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const stats = makeStats();
    const result = simulateRune(stats, 118, 'normal', 1);

    expect(result.outcome).toBe('EC');
    const forceStat = result.newStats.find((s) => s.effectId === 118)!;
    expect(forceStat.currentValue).toBe(50); // unchanged

    vi.restoreAllMocks();
  });

  it('throws for unknown effectId', () => {
    expect(() => simulateRune(makeStats(), 99999, 'normal', 1)).toThrow();
  });

  it('does not mutate original stats', () => {
    const stats = makeStats();
    const originalForce = stats.find((s) => s.effectId === 118)!.currentValue;
    simulateRune(stats, 118, 'normal', 1);
    expect(stats.find((s) => s.effectId === 118)!.currentValue).toBe(originalForce);
  });
});
