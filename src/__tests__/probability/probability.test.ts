/**
 * MODÈLE probabiliste : bornes SOURCE PRIMAIRE respectées par chaque modèle sur des cas
 * extrêmes, somme = 1, tirage déterministe avec RNG injecté.
 */
import { describe, it, expect } from 'vitest';
import {
  computeOutcomeProbabilities,
  applyOfficialBounds,
  drawOutcome,
  getProbabilityModel,
  isHeavyExo,
  MIN_SC_NORMAL,
  MIN_SC_HEAVY_EXO,
  PROBABILITY_MODEL_NAMES,
  distanceToMax,
  type ProbabilityInput,
} from '../../logic/probability';
import { bucketIndex, lookupCell } from '../../logic/probability/models/lookupTable';
import { getProbabilityParams, type ProbabilityParams } from '../../data/params';
import { seqRng } from '../engine/helpers';

const params = (overrides: Partial<ProbabilityParams> = {}): ProbabilityParams => ({
  ...getProbabilityParams(),
  ...overrides,
});

const input = (partial: Partial<ProbabilityInput> = {}): ProbabilityInput => ({
  itemLevel: 200,
  line: { value: 50, baseMax: 50, isExo: false },
  runeWeight: 1,
  isHeavyExo: false,
  residualPool: 0,
  weightBudget: 0,
  ...partial,
});

const EXTREMES: ProbabilityInput[] = [
  input(),
  input({ line: { value: 0, baseMax: 50, isExo: false } }),
  input({ line: { value: 100, baseMax: 50, isExo: false } }), // over
  input({ itemLevel: 1 }),
  input({ itemLevel: 200, runeWeight: 100 }),
  input({ runeWeight: 0.2, weightBudget: 5000 }),
  input({ runeWeight: 100, weightBudget: -5000 }),
  input({ line: { value: 0, baseMax: 0, isExo: true }, runeWeight: 100, isHeavyExo: true, weightBudget: -100 }),
  input({ line: { value: 1, baseMax: 0, isExo: true }, runeWeight: 51, isHeavyExo: true }),
  input({ line: { value: 0, baseMax: 0, isExo: true }, runeWeight: 5, isHeavyExo: false }),
];

const sum = (p: { pSC: number; pSN: number; pEC: number }) => p.pSC + p.pSN + p.pEC;

describe('bornes SOURCE PRIMAIRE (tutoriel officiel)', () => {
  it('constants are 15 % (normal) and 1 % (heavy exo)', () => {
    expect(MIN_SC_NORMAL).toBe(0.15);
    expect(MIN_SC_HEAVY_EXO).toBe(0.01);
  });

  it('applyOfficialBounds raises pSC to the floor and keeps the SN/EC ratio', () => {
    const r = applyOfficialBounds({ pSC: 0.05, pSN: 0.57, pEC: 0.38 }, false);
    expect(r.pSC).toBeCloseTo(0.15, 9);
    expect(r.pSN / r.pEC).toBeCloseTo(0.57 / 0.38, 9);
    expect(sum(r)).toBeCloseTo(1, 9);
  });

  it('applyOfficialBounds normalises a badly-summing triplet and handles zero', () => {
    expect(sum(applyOfficialBounds({ pSC: 0.5, pSN: 0.5, pEC: 0.5 }, false))).toBeCloseTo(1, 9);
    expect(applyOfficialBounds({ pSC: 0, pSN: 0, pEC: 0 }, false)).toEqual({ pSC: 1, pSN: 0, pEC: 0 });
    const heavy = applyOfficialBounds({ pSC: 0, pSN: 0, pEC: 1 }, true);
    expect(heavy.pSC).toBeCloseTo(0.01, 9);
    expect(heavy.pEC).toBeCloseTo(0.99, 9);
  });

  for (const name of PROBABILITY_MODEL_NAMES) {
    it(`${name} : pSC ≥ 15 % en FM normale, ≥ 1 % en exo lourd, somme = 1, sur des cas extrêmes`, () => {
      for (const i of EXTREMES) {
        const p = computeOutcomeProbabilities(i, params(), name);
        expect(sum(p)).toBeCloseTo(1, 9);
        for (const v of [p.pSC, p.pSN, p.pEC]) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(1);
        }
        expect(p.pSC).toBeGreaterThanOrEqual((i.isHeavyExo ? MIN_SC_HEAVY_EXO : MIN_SC_NORMAL) - 1e-12);
      }
    });
  }

  it('the floor is applied even when a model is deliberately mis-parameterised', () => {
    const p = params({ officialFactorsLinear: { a: -1, b: 0, c: 0, levelNormalizer: 200 } });
    expect(computeOutcomeProbabilities(input(), p).pSC).toBeCloseTo(MIN_SC_NORMAL, 9);
    const legacy = params({ poolRatioLegacy: { ...getProbabilityParams().poolRatioLegacy, minSc: 0 } });
    expect(computeOutcomeProbabilities(input({ weightBudget: -1e6 }), legacy, 'pool_ratio_legacy').pSC).toBeCloseTo(MIN_SC_NORMAL, 9);
  });
});

describe('official_factors_linear', () => {
  it('uses only distance to max and item level: pSC grows with distance, unchanged by budget or residual', () => {
    const p = params();
    const atMax = computeOutcomeProbabilities(input({ line: { value: 50, baseMax: 50, isExo: false } }), p);
    const half = computeOutcomeProbabilities(input({ line: { value: 25, baseMax: 50, isExo: false } }), p);
    const empty = computeOutcomeProbabilities(input({ line: { value: 0, baseMax: 50, isExo: false } }), p);
    expect(atMax.pSC).toBeLessThan(half.pSC);
    expect(half.pSC).toBeLessThan(empty.pSC);
    const other = computeOutcomeProbabilities(input({ line: { value: 25, baseMax: 50, isExo: false }, weightBudget: 1000, residualPool: 50 }), p);
    expect(other).toEqual(half);
  });

  it('a, b, c and levelNormalizer are parameters: pSC = a + b·distance − c·level/normalizer before bounds', () => {
    const p = params({ officialFactorsLinear: { a: 0.2, b: 0.4, c: 0.1, levelNormalizer: 200 }, ecShare: 0.25 });
    const r = computeOutcomeProbabilities(input({ line: { value: 25, baseMax: 50, isExo: false }, itemLevel: 100 }), p);
    // 0.2 + 0.4 × 0.5 − 0.1 × 0.5 = 0.35 ; complément 0.65 → EC 25 %, SN 75 %
    expect(r.pSC).toBeCloseTo(0.35, 9);
    expect(r.pEC).toBeCloseTo(0.65 * 0.25, 9);
    expect(r.pSN).toBeCloseTo(0.65 * 0.75, 9);
  });

  it('heavy exo uses heavyExoEcShare (1 → no SN)', () => {
    const r = computeOutcomeProbabilities(input({ line: { value: 0, baseMax: 0, isExo: true }, runeWeight: 100, isHeavyExo: true }), params());
    expect(r.pSN).toBeCloseTo(0, 9);
    expect(r.pSC + r.pEC).toBeCloseTo(1, 9);
  });
});

describe('pool_ratio_legacy (comparaison seulement)', () => {
  it('reproduces the old formula before bounds: budget 0 → 50 % SC, 5 % EC', () => {
    const raw = getProbabilityModel('pool_ratio_legacy').compute(input({ weightBudget: 0, runeWeight: 5 }), params());
    expect(raw.pSC).toBeCloseTo(0.5, 9);
    expect(raw.pEC).toBeCloseTo(0.05, 9);
  });

  it('raw minSc (5 %) violates the official floor, which the bounds then restore', () => {
    const i = input({ weightBudget: -1e6, runeWeight: 1 });
    const raw = getProbabilityModel('pool_ratio_legacy').compute(i, params());
    expect(raw.pSC).toBeLessThan(MIN_SC_NORMAL);
    expect(computeOutcomeProbabilities(i, params(), 'pool_ratio_legacy').pSC).toBeCloseTo(MIN_SC_NORMAL, 9);
  });
});

describe('lookup_table', () => {
  it('bucketIndex resolves half-open intervals and clamps outside', () => {
    const b = [0, 0.05, 0.2, 0.5, 1];
    expect(bucketIndex(b, 0)).toBe(0);
    expect(bucketIndex(b, 0.05)).toBe(1);
    expect(bucketIndex(b, 0.49)).toBe(2);
    expect(bucketIndex(b, 0.5)).toBe(3);
    expect(bucketIndex(b, 1)).toBe(3);
    expect(bucketIndex(b, 5)).toBe(3);
    expect(bucketIndex(b, -1)).toBe(0);
  });

  it('reads the configured cell', () => {
    const p = params();
    p.lookupTable.cells[2][1] = { pSC: 0.33, pEC: 0.11 };
    const cell = lookupCell(p.lookupTable, 0.3, 5);
    expect(cell).toEqual({ pSC: 0.33, pEC: 0.11 });
    const r = computeOutcomeProbabilities(input({ line: { value: 35, baseMax: 50, isExo: false }, runeWeight: 5 }), p, 'lookup_table');
    expect(r.pSC).toBeCloseTo(0.33, 9);
    expect(r.pEC).toBeCloseTo(0.11, 9);
    expect(r.pSN).toBeCloseTo(0.56, 9);
  });
});

describe('utilitaires', () => {
  it('distanceToMax: 0 at max or exo, 1 when empty, clamped for over', () => {
    expect(distanceToMax({ value: 50, baseMax: 50, isExo: false })).toBe(0);
    expect(distanceToMax({ value: 0, baseMax: 50, isExo: false })).toBe(1);
    expect(distanceToMax({ value: 25, baseMax: 50, isExo: false })).toBe(0.5);
    expect(distanceToMax({ value: 80, baseMax: 50, isExo: false })).toBe(0);
    expect(distanceToMax({ value: 3, baseMax: 0, isExo: true })).toBe(0);
  });

  it('isHeavyExo follows heavyExoCharacteristics and requires an exo', () => {
    const p = params();
    expect(isHeavyExo(1, true, p)).toBe(true);
    expect(isHeavyExo(1, false, p)).toBe(false);
    expect(isHeavyExo(26, true, p)).toBe(false); // Invocations : pas dans la liste
    expect(isHeavyExo(26, true, params({ heavyExoCharacteristics: [1, 23, 19, 26] }))).toBe(true);
  });

  it('drawOutcome is deterministic with an injected RNG', () => {
    const probs = { pSC: 0.2, pSN: 0.5, pEC: 0.3 };
    expect(drawOutcome(probs, seqRng([0.1]))).toBe('SC');
    expect(drawOutcome(probs, seqRng([0.2]))).toBe('SN');
    expect(drawOutcome(probs, seqRng([0.69]))).toBe('SN');
    expect(drawOutcome(probs, seqRng([0.7]))).toBe('EC');
    expect(drawOutcome(probs, seqRng([0.999]))).toBe('EC');
  });

  it('getProbabilityModel rejects unknown names', () => {
    expect(() => getProbabilityModel('nope' as never)).toThrow();
  });
});
