/**
 * Budget de poids de planification (src/logic/planning) — dérivé de l'état visible,
 * sans lien avec le reliquat serveur.
 */
import { describe, it, expect } from 'vitest';
import { computeWeightBudget, getStatStatus, computeMaxReachable } from '../../logic/planning/weightBudget';
import type { SimulatedStat } from '../../types';
import { CHAR } from '../engine/helpers';

function makeStat(overrides: Partial<SimulatedStat> = {}): SimulatedStat {
  return {
    characteristicId: CHAR.FORCE,
    statName: 'Force',
    baseMin: 30,
    baseMax: 50,
    currentValue: 50,
    weightPerPoint: 1,
    isExo: false,
    isForgemeable: true,
    isLocked: false,
    ...overrides,
  };
}

describe('computeWeightBudget', () => {
  it('zero budget at perfect roll', () => {
    const b = computeWeightBudget([
      makeStat(),
      makeStat({ characteristicId: CHAR.VITALITE, baseMax: 300, currentValue: 300, weightPerPoint: 0.2 }),
    ]);
    expect(b.freedWeight).toBe(0);
    expect(b.spentWeight).toBe(0);
    expect(b.remainingBudget).toBe(0);
    expect(b.baseWeight).toBe(50 + 60);
  });

  it('a sacrificed line frees weight', () => {
    const b = computeWeightBudget([makeStat({ characteristicId: CHAR.VITALITE, baseMax: 500, currentValue: 0, weightPerPoint: 0.2 })]);
    expect(b.freedWeight).toBe(100);
    expect(b.remainingBudget).toBe(100);
  });

  it('overs and exos spend weight; the budget can go negative (planning, not residual)', () => {
    const b = computeWeightBudget([
      makeStat({ currentValue: 60 }),
      makeStat({ characteristicId: CHAR.PA, baseMin: 0, baseMax: 0, currentValue: 1, weightPerPoint: 100, isExo: true }),
    ]);
    expect(b.overWeight).toBe(10);
    expect(b.exoWeight).toBe(100);
    expect(b.spentWeight).toBe(110);
    expect(b.remainingBudget).toBe(-110);
    expect(b.overExoTotal).toBe(110);
  });

  it('ignores non-forgeable stats', () => {
    const b = computeWeightBudget([makeStat({ characteristicId: 999, isForgemeable: false, currentValue: 100 })]);
    expect(b.baseWeight).toBe(0);
  });
});

describe('getStatStatus', () => {
  it('classifies perfect / over / sacrificed / exo', () => {
    expect(getStatStatus(makeStat())).toBe('perfect');
    expect(getStatStatus(makeStat({ currentValue: 55 }))).toBe('over');
    expect(getStatStatus(makeStat({ currentValue: 30 }))).toBe('sacrificed');
    expect(getStatStatus(makeStat({ isExo: true }))).toBe('exo');
  });
});

describe('computeMaxReachable', () => {
  it('is bounded by the remaining budget', () => {
    expect(computeMaxReachable(makeStat(), 20)).toBe(70);
  });

  it('is bounded by the per-line cap derived from empirical_params.json (Force : 101 au total, lecture valeur totale)', () => {
    expect(computeMaxReachable(makeStat(), 1000)).toBe(101);
  });

  it('exo Vitalité is capped at floor(101 / 0,2) = 505', () => {
    expect(computeMaxReachable(makeStat({ characteristicId: CHAR.VITALITE, baseMin: 0, baseMax: 0, currentValue: 100, weightPerPoint: 0.2, isExo: true }), 10000)).toBe(505);
  });

  it('returns the current value when the density is 0', () => {
    expect(computeMaxReachable(makeStat({ weightPerPoint: 0 }), 100)).toBe(50);
  });
});
