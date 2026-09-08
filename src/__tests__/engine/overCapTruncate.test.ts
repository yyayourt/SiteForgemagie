/**
 * Troncature à la borne d'over/exo (overCapExcess.behaviour, HYPOTHÈSE COMMUNAUTAIRE) :
 * « Ra Vi (+50) sur 480 vita passe jusqu'à 505 ». Perte d'une rune tronquée : lossBasis (INCONNU).
 */
import { describe, it, expect } from 'vitest';
import { applyRune, maxApplicableRuneValue } from '../../logic/engine';
import { overCapUsageAfter } from '../../logic/probability';
import { CHAR, getLine, line, makeState, seqRng, testParams } from './helpers';

const vita = (value: number, baseMax = 400, residualPool = 0) =>
  makeState([line({ characteristicId: CHAR.VITALITE, value, baseMin: baseMax - 49, baseMax })], residualPool);
const raVi = { characteristicId: CHAR.VITALITE, value: 50 };

describe('maxApplicableRuneValue', () => {
  it('480/400 vita : Ra Vi (+50) → 25 applicables (505) ; à 505 → 0 ; à 455 → 50 entiers', () => {
    expect(maxApplicableRuneValue(vita(480), raVi, testParams())).toBe(25);
    expect(maxApplicableRuneValue(vita(505), raVi, testParams())).toBe(0);
    expect(maxApplicableRuneValue(vita(455), raVi, testParams())).toBe(50);
  });

  it('a natural line under its max can always be raised at least to its max (40 sagesse = 120 > 101)', () => {
    const sag = makeState([line({ characteristicId: CHAR.SAGESSE, value: 35, baseMin: 31, baseMax: 40 })]);
    expect(maxApplicableRuneValue(sag, { characteristicId: CHAR.SAGESSE, value: 10 }, testParams())).toBe(5);
  });

  it('global cumul : exo PM (90) leaves 11 → 55 vita of over ; a Ra Vi on 360/350 gives 45', () => {
    const state = makeState([
      line({ characteristicId: CHAR.VITALITE, value: 360, baseMin: 301, baseMax: 350 }),
      line({ characteristicId: CHAR.PM, value: 1, baseMin: 0, baseMax: 0, isExo: true }),
    ]);
    expect(maxApplicableRuneValue(state, raVi, testParams())).toBe(45);
    // exo PA (100) sur 213/200 vita : 2,6 déjà pris → rien ne tient
    expect(maxApplicableRuneValue(vita(213, 200), { characteristicId: CHAR.PA, value: 1 }, testParams())).toBe(0);
  });

  it('over_part basis : 400/400 vita, Ra Vi → 50 entiers (505 d’over possibles)', () => {
    expect(maxApplicableRuneValue(vita(400), raVi, testParams({ overCapLineBasis: 'over_part' }))).toBe(50);
  });
});

describe('applyRune — truncate (défaut)', () => {
  it('the file default is truncate / full_rune', () => {
    expect(testParams().overCapExcess).toEqual({ behaviour: 'truncate', lossBasis: 'full_rune' });
  });

  it('SC forcé : Ra Vi sur 480 → 505, acceptée, tronquée, appliedValue 25, aucune perte', () => {
    const r = applyRune(vita(480), raVi, 'SC', testParams(), seqRng([0]));
    expect(r.accepted).toBe(true);
    expect(r.truncated).toBe(true);
    expect(r.appliedValue).toBe(25);
    expect(getLine(r.state, CHAR.VITALITE).value).toBe(505);
    expect(r.losses).toEqual([]);
  });

  it('at 505 already: refused, nothing can apply', () => {
    const r = applyRune(vita(505), raVi, 'SC', testParams(), seqRng([0]));
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('over_cap_exceeded');
  });

  it('SN : loss on the FULL rune (10), absorbed by the residual first (full_rune, default)', () => {
    const r = applyRune(vita(480, 400, 10), raVi, 'SN', testParams(), seqRng([0]));
    expect(r.accepted).toBe(true);
    expect(getLine(r.state, CHAR.VITALITE).value).toBe(505);
    expect(r.lossRequested).toBe(10);
    expect(r.absorbedByResidual).toBe(10);
    expect(r.losses).toEqual([]);
    expect(r.residualPoolAfter).toBe(0);
  });

  it('SN : applied_only counts only the 25 vita that landed (5), so a residual of 5 covers it', () => {
    const p = testParams({ overCapExcess: { lossBasis: 'applied_only' } });
    const r = applyRune(vita(480, 400, 5), raVi, 'SN', p, seqRng([0]));
    expect(r.lossRequested).toBe(5);
    expect(r.absorbedByResidual).toBe(5);
    expect(r.residualPoolAfter).toBe(0);
    expect(getLine(r.state, CHAR.VITALITE).value).toBe(505);
  });

  it('SN without residual : the full rune weight (10) is taken on another line, the truncated line keeps 505', () => {
    const state = makeState([
      line({ characteristicId: CHAR.VITALITE, value: 480, baseMin: 351, baseMax: 400 }),
      line({ characteristicId: CHAR.FORCE, value: 50 }),
    ]);
    const r = applyRune(state, raVi, 'SN', testParams(), seqRng([0]));
    expect(r.accepted).toBe(true);
    expect(getLine(r.state, CHAR.VITALITE).value).toBe(505);
    expect(r.losses).toEqual([{ characteristicId: CHAR.FORCE, pointsLost: 10, weightLost: 10 }]);
  });

  it('EC : nothing applied, loss measured on the full rune × ecLossFactor', () => {
    const r = applyRune(vita(480, 400, 10), raVi, 'EC', testParams({ ecLossFactor: 1 }), seqRng([0]));
    expect(r.appliedValue).toBe(0);
    expect(getLine(r.state, CHAR.VITALITE).value).toBe(480);
    expect(r.lossRequested).toBe(10);
  });

  it('a rune that fits entirely is not marked truncated', () => {
    const r = applyRune(vita(455), raVi, 'SC', testParams(), seqRng([0]));
    expect(r.truncated).toBe(false);
    expect(r.appliedValue).toBe(50);
  });

  it('usage of the cap is measured on the truncated rune: 480 + 25 → 505 vita = 21 of over', () => {
    expect(overCapUsageAfter(vita(480), raVi, testParams())).toBeCloseTo(21 / 101, 9);
  });
});

describe('applyRune — refuse (option)', () => {
  it('refuses the whole rune as before', () => {
    const p = testParams({ overCapExcess: { behaviour: 'refuse' } });
    const r = applyRune(vita(480), raVi, 'SC', p, seqRng([0]));
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('over_cap_exceeded');
    expect(applyRune(vita(455), raVi, 'SC', p, seqRng([0])).accepted).toBe(true);
  });
});
