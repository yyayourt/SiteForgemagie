/**
 * Terme d du modèle official_factors_linear : proximité de la borne over/exo (INCONNU).
 * d = 0 (défaut) → strictement aucun effet ; d > 0 → pSC brut baisse avec l'usage de la
 * borne après la rune, puis les planchers officiels s'appliquent toujours.
 */
import { describe, it, expect } from 'vitest';
import { computeOutcomeProbabilities, overCapUsageAfter, MIN_SC_NORMAL, type ProbabilityInput } from '../../logic/probability';
import { buildProbabilityInput } from '../../logic/probability/monteCarlo';
import { getProbabilityParams, type ProbabilityParams } from '../../data/params';
import { CHAR, line, makeState, testParams } from '../engine/helpers';

const withD = (d: number): ProbabilityParams => {
  const p = getProbabilityParams();
  return { ...p, officialFactorsLinear: { ...p.officialFactorsLinear, d } };
};

const input = (partial: Partial<ProbabilityInput> = {}): ProbabilityInput => ({
  itemLevel: 200,
  line: { value: 25, baseMax: 50, isExo: false },
  runeWeight: 1,
  isHeavyExo: false,
  residualPool: 0,
  weightBudget: 0,
  ...partial,
});

describe('overCapUsageAfter — mesure', () => {
  it('is the over+exo cumul after the rune, over the cap: cape 370/350 vita + exo PM → 94 / 101', () => {
    const state = makeState([line({ characteristicId: CHAR.VITALITE, value: 370, baseMin: 251, baseMax: 350 })]);
    expect(overCapUsageAfter(state, { characteristicId: CHAR.PM, value: 1 }, testParams())).toBeCloseTo(94 / 101, 9);
  });

  it('is 0 without over nor exo, and exceeds 1 when the rune would break the cap', () => {
    const clean = makeState([line({ characteristicId: CHAR.FORCE, value: 40, baseMax: 50 })]);
    expect(overCapUsageAfter(clean, { characteristicId: CHAR.FORCE, value: 5 }, testParams())).toBe(0);
    const over = makeState([line({ characteristicId: CHAR.VITALITE, value: 213, baseMax: 200 })]);
    expect(overCapUsageAfter(over, { characteristicId: CHAR.PA, value: 1 }, testParams())).toBeCloseTo(102.6 / 101, 9);
  });

  it('is fed to the Monte Carlo input', () => {
    const state = makeState([line({ characteristicId: CHAR.VITALITE, value: 370, baseMin: 251, baseMax: 350 })]);
    const i = buildProbabilityInput(state, { characteristicId: CHAR.PM, value: 1 }, testParams(), getProbabilityParams(), 0);
    expect(i.overCapUsage).toBeCloseTo(94 / 101, 9);
  });
});

describe('official_factors_linear — terme d', () => {
  it('file default is d = 0: identical output whatever the cap usage', () => {
    expect(getProbabilityParams().officialFactorsLinear.d).toBe(0);
    const p = getProbabilityParams();
    const a = computeOutcomeProbabilities(input({ overCapUsage: 0 }), p);
    const b = computeOutcomeProbabilities(input({ overCapUsage: 1 }), p);
    const c = computeOutcomeProbabilities(input(), p);
    expect(a).toEqual(b);
    expect(a).toEqual(c);
  });

  it('d = 0.3 lowers raw pSC by 0.3 × usage, clamped to [0, 1] usage', () => {
    const p = withD(0.3);
    const base = computeOutcomeProbabilities(input({ overCapUsage: 0 }), p).pSC; // 0.15 + 0.5 × 0.5 = 0.40
    expect(base).toBeCloseTo(0.4, 9);
    expect(computeOutcomeProbabilities(input({ overCapUsage: 0.5 }), p).pSC).toBeCloseTo(0.25, 9);
    expect(computeOutcomeProbabilities(input({ overCapUsage: 1 }), p).pSC).toBeCloseTo(MIN_SC_NORMAL, 9); // 0.10 relevé au plancher
    expect(computeOutcomeProbabilities(input({ overCapUsage: 5 }), p).pSC).toBeCloseTo(MIN_SC_NORMAL, 9); // borné à 1
  });

  it('official floors still apply after the term (never below 15 % / 1 %)', () => {
    const p = withD(1);
    const normal = computeOutcomeProbabilities(input({ overCapUsage: 1 }), p);
    expect(normal.pSC).toBeCloseTo(MIN_SC_NORMAL, 9);
    expect(normal.pSC + normal.pSN + normal.pEC).toBeCloseTo(1, 9);
    const heavy = computeOutcomeProbabilities(input({ line: { value: 0, baseMax: 0, isExo: true }, isHeavyExo: true, overCapUsage: 1 }), p);
    expect(heavy.pSC).toBeGreaterThanOrEqual(0.01 - 1e-9);
  });
});
