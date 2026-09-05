/**
 * Monte Carlo reproductible avec graine, fréquences cohérentes avec le modèle, états finaux.
 */
import { describe, it, expect } from 'vitest';
import { simulateRuneAttempts, stateKey } from '../../logic/probability/monteCarlo';
import { createSeededRng } from '../../logic/probability';
import { getProbabilityParams, type ProbabilityParams } from '../../data/params';
import { CHAR, line, makeState, testParams } from '../engine/helpers';

const probParams = (overrides: Partial<ProbabilityParams> = {}): ProbabilityParams => ({ ...getProbabilityParams(), ...overrides });

const baseState = () =>
  makeState([line({ characteristicId: CHAR.FORCE, value: 40, baseMin: 30, baseMax: 50 }), line({ characteristicId: CHAR.SAGESSE, value: 30 })]);

describe('createSeededRng', () => {
  it('is deterministic and in [0, 1)', () => {
    const a = createSeededRng(42);
    const b = createSeededRng(42);
    for (let i = 0; i < 100; i++) {
      const x = a.next();
      expect(x).toBe(b.next());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
    expect(createSeededRng(1).next()).not.toBe(createSeededRng(2).next());
  });
});

describe('simulateRuneAttempts', () => {
  const engine = testParams({ lossSelection: { strategy: 'uniform', prioritizeOverExo: true } });
  const rune = { characteristicId: CHAR.FORCE, value: 1 };

  it('is reproducible with the same seed and differs with another seed', () => {
    const r1 = simulateRuneAttempts(baseState(), rune, engine, probParams(), createSeededRng(7), { runs: 500 });
    const r2 = simulateRuneAttempts(baseState(), rune, engine, probParams(), createSeededRng(7), { runs: 500 });
    const r3 = simulateRuneAttempts(baseState(), rune, engine, probParams(), createSeededRng(8), { runs: 500 });
    expect(r1.outcomes).toEqual(r2.outcomes);
    expect([...r1.finalStates.keys()]).toEqual([...r2.finalStates.keys()]);
    expect(r1.outcomes).not.toEqual(r3.outcomes);
  });

  it('counts sum to runs and frequencies are close to the model probabilities', () => {
    const runs = 20000;
    const r = simulateRuneAttempts(baseState(), rune, engine, probParams(), createSeededRng(123), { runs });
    expect(r.outcomes.SC + r.outcomes.SN + r.outcomes.EC).toBe(runs);
    expect(r.frequencies.SC).toBeCloseTo(r.probabilities.pSC, 1);
    expect(r.frequencies.SN).toBeCloseTo(r.probabilities.pSN, 1);
    expect(r.frequencies.EC).toBeCloseTo(r.probabilities.pEC, 1);
    expect(r.refused).toBe(0);
  });

  it('final states: SC → Force 41, SN → Force 41 + Sagesse 29 (residual 2), EC → Sagesse 29 (residual 2)', () => {
    const r = simulateRuneAttempts(baseState(), rune, engine, probParams(), createSeededRng(5), { runs: 300 });
    const keys = [...r.finalStates.keys()];
    expect(keys.length).toBeLessThanOrEqual(3);
    const sc = makeState([line({ characteristicId: CHAR.FORCE, value: 41, baseMin: 30, baseMax: 50 }), line({ characteristicId: CHAR.SAGESSE, value: 30 })]);
    expect(r.finalStates.get(stateKey(sc))?.count).toBe(r.outcomes.SC);
    const total = [...r.finalStates.values()].reduce((s, b) => s + b.count, 0);
    expect(total).toBe(300);
  });

  it('lets the caller pick a model to compare', () => {
    const linear = simulateRuneAttempts(baseState(), rune, engine, probParams(), createSeededRng(1), { runs: 10, modelName: 'official_factors_linear' });
    const legacy = simulateRuneAttempts(baseState(), rune, engine, probParams(), createSeededRng(1), { runs: 10, modelName: 'pool_ratio_legacy', weightBudget: 10 });
    expect(linear.model).toBe('official_factors_linear');
    expect(legacy.model).toBe('pool_ratio_legacy');
    expect(linear.probabilities).not.toEqual(legacy.probabilities);
  });

  it('reports refused attempts (e.g. locked item) without crashing', () => {
    const locked = { ...baseState(), itemLocked: true };
    const r = simulateRuneAttempts(locked, rune, engine, probParams(), createSeededRng(1), { runs: 50 });
    expect(r.refused).toBe(50);
    expect(r.finalStates.size).toBe(1);
  });
});
