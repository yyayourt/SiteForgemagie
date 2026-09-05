/**
 * ⚠ Ces tests couvrent le MOTEUR PROVISOIRE (modèle inventé, voir runeSimulator.ts).
 * Ils garantissent uniquement que le câblage données → moteur compile et reste cohérent
 * pendant la phase 1. Ils seront remplacés avec le moteur paramétrable en phase 2.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  computeOutcomeProbabilities,
  pickRecoilTarget,
  getRuneValue,
  simulateRune,
} from '../logic/runeSimulator';
import type { SimulatedStat } from '../types';

// Identifiants de caractéristiques DofusDB (data/dataset.json → characteristics)
const CHAR_FORCE = 10;
const CHAR_VITALITE = 11;
const CHAR_SAGESSE = 12;
const CHAR_SOINS = 49;
const CHAR_PA = 1;

// ── computeOutcomeProbabilities ──────────────────────────────────

describe('computeOutcomeProbabilities (modèle provisoire)', () => {
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

  it('heavy exo attempt returns 1/0/99', () => {
    const { pSC, pSN, pEC } = computeOutcomeProbabilities(0, 100, true);
    expect(pSC).toBeCloseTo(0.01);
    expect(pSN).toBe(0);
    expect(pEC).toBeCloseTo(0.99);
  });
});

// ── pickRecoilTarget ─────────────────────────────────────────────

describe('pickRecoilTarget', () => {
  const baseStats: SimulatedStat[] = [
    { characteristicId: CHAR_VITALITE, statName: 'Vitalité', baseMin: 200, baseMax: 300, currentValue: 250, weightPerPoint: 0.2, isExo: false, isForgemeable: true },
    { characteristicId: CHAR_FORCE, statName: 'Force', baseMin: 30, baseMax: 50, currentValue: 40, weightPerPoint: 1, isExo: false, isForgemeable: true },
    { characteristicId: CHAR_SAGESSE, statName: 'Sagesse', baseMin: 20, baseMax: 30, currentValue: 25, weightPerPoint: 3, isExo: false, isForgemeable: true },
  ];

  it('excludes the target stat', () => {
    for (let i = 0; i < 50; i++) {
      const victim = pickRecoilTarget(baseStats, CHAR_VITALITE);
      expect(victim).not.toBeNull();
      expect(victim!.characteristicId).not.toBe(CHAR_VITALITE);
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
      expect(victim!.characteristicId).toBe(CHAR_FORCE);
    }
  });

  it('returns null if no candidates', () => {
    const stats: SimulatedStat[] = [{ ...baseStats[0], currentValue: 0 }];
    expect(pickRecoilTarget(stats, 999)).toBeNull();
  });
});

// ── getRuneValue (data/rune-tiers.json) ─────────────────────────

describe('getRuneValue', () => {
  it('reads Force tiers from the dataset (1 / 3 / 10)', () => {
    expect(getRuneValue(CHAR_FORCE, 'normal')).toBe(1);
    expect(getRuneValue(CHAR_FORCE, 'pa')).toBe(3);
    expect(getRuneValue(CHAR_FORCE, 'ra')).toBe(10);
  });

  it('reads Vitalité tiers from the dataset (5 / 15 / 50)', () => {
    expect(getRuneValue(CHAR_VITALITE, 'normal')).toBe(5);
    expect(getRuneValue(CHAR_VITALITE, 'pa')).toBe(15);
    expect(getRuneValue(CHAR_VITALITE, 'ra')).toBe(50);
  });

  it('falls back to the lower tier when Ra does not exist (Soins : normal + Pa seulement)', () => {
    expect(getRuneValue(CHAR_SOINS, 'normal')).toBe(1);
    expect(getRuneValue(CHAR_SOINS, 'pa')).toBe(3);
    expect(getRuneValue(CHAR_SOINS, 'ra')).toBe(3);
  });

  it('PA has only a normal rune (Ga Pa)', () => {
    expect(getRuneValue(CHAR_PA, 'normal')).toBe(1);
    expect(getRuneValue(CHAR_PA, 'ra')).toBe(1);
  });

  it('returns 0 for unknown characteristic', () => {
    expect(getRuneValue(99999, 'normal')).toBe(0);
  });
});

// ── simulateRune ─────────────────────────────────────────────────

describe('simulateRune', () => {
  const makeStats = (): SimulatedStat[] => [
    { characteristicId: CHAR_VITALITE, statName: 'Vitalité', baseMin: 200, baseMax: 300, currentValue: 300, weightPerPoint: 0.2, isExo: false, isForgemeable: true },
    { characteristicId: CHAR_FORCE, statName: 'Force', baseMin: 30, baseMax: 50, currentValue: 50, weightPerPoint: 1, isExo: false, isForgemeable: true },
    { characteristicId: CHAR_SAGESSE, statName: 'Sagesse', baseMin: 20, baseMax: 30, currentValue: 30, weightPerPoint: 3, isExo: false, isForgemeable: true },
  ];

  it('returns a valid SimulationResult', () => {
    const result = simulateRune(makeStats(), CHAR_FORCE, 'normal', 1);
    expect(result).toHaveProperty('outcome');
    expect(result).toHaveProperty('newStats');
    expect(result).toHaveProperty('logEntry');
    expect(['SC', 'SN', 'EC']).toContain(result.outcome);
  });

  it('log entry has correct metadata (rune weight = value × density from params)', () => {
    const result = simulateRune(makeStats(), CHAR_SAGESSE, 'pa', 42);
    expect(result.logEntry.id).toBe(42);
    expect(result.logEntry.targetCharacteristicId).toBe(CHAR_SAGESSE);
    expect(result.logEntry.targetStatName).toBe('Sagesse');
    expect(result.logEntry.runeTier).toBe('pa');
    expect(result.logEntry.runeValue).toBe(3); // Rune Pa Sa
    expect(result.logEntry.runeWeight).toBe(9); // 3 × densité 3
  });

  it('SC adds rune value with no side effect', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = simulateRune(makeStats(), CHAR_FORCE, 'normal', 1);

    expect(result.outcome).toBe('SC');
    const forceStat = result.newStats.find((s) => s.characteristicId === CHAR_FORCE)!;
    expect(forceStat.currentValue).toBe(51);
    expect(result.logEntry.sideEffect).toBeUndefined();

    vi.restoreAllMocks();
  });

  it('EC does not add rune value', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const result = simulateRune(makeStats(), CHAR_FORCE, 'normal', 1);

    expect(result.outcome).toBe('EC');
    const forceStat = result.newStats.find((s) => s.characteristicId === CHAR_FORCE)!;
    expect(forceStat.currentValue).toBe(50);

    vi.restoreAllMocks();
  });

  it('throws for unknown characteristic', () => {
    expect(() => simulateRune(makeStats(), 99999, 'normal', 1)).toThrow();
  });

  it('does not mutate original stats', () => {
    const stats = makeStats();
    const originalForce = stats.find((s) => s.characteristicId === CHAR_FORCE)!.currentValue;
    simulateRune(stats, CHAR_FORCE, 'normal', 1);
    expect(stats.find((s) => s.characteristicId === CHAR_FORCE)!.currentValue).toBe(originalForce);
  });
});
