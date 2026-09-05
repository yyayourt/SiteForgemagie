/**
 * Borne d'over/exo : overCapWeight (HYPOTHÈSE COMMUNAUTAIRE, 101) dans ses deux lectures
 * concurrentes overCapScope = per_line | global (CONTRADICTION).
 */
import { describe, it, expect } from 'vitest';
import { applyRune, checkOverCap, hasAnyOverOrExo, withRuneApplied } from '../../logic/engine';
import { CHAR, line, makeState, seqRng, testParams } from './helpers';

const perLine = () => testParams({ overCapScope: 'per_line', overCapWeight: 101 });
const global = () => testParams({ overCapScope: 'global', overCapWeight: 101 });

describe('per_line', () => {
  it('allows +101 over on Force (densité 1) and refuses +102', () => {
    const base = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]);
    const ok = applyRune(base, { characteristicId: CHAR.FORCE, value: 101 }, 'SC', perLine(), seqRng([0]));
    expect(ok.accepted).toBe(true);
    const ko = applyRune(base, { characteristicId: CHAR.FORCE, value: 102 }, 'SC', perLine(), seqRng([0]));
    expect(ko.accepted).toBe(false);
    expect(ko.reason).toBe('over_cap_exceeded');
  });

  it('handles fractional densities: exo Vitalité 505 allowed (101,0), 506 refused', () => {
    const base = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]);
    expect(applyRune(base, { characteristicId: CHAR.VITALITE, value: 505 }, 'SC', perLine(), seqRng([0])).accepted).toBe(true);
    expect(applyRune(base, { characteristicId: CHAR.VITALITE, value: 506 }, 'SC', perLine(), seqRng([0])).accepted).toBe(false);
  });

  it('lines are independent: over Force 60 + exo PO 51 both allowed', () => {
    const s1 = applyRune(makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]), { characteristicId: CHAR.FORCE, value: 60 }, 'SC', perLine(), seqRng([0]));
    expect(s1.accepted).toBe(true);
    const s2 = applyRune(s1.state, { characteristicId: CHAR.PO, value: 1 }, 'SC', perLine(), seqRng([0]));
    expect(s2.accepted).toBe(true);
  });

  it('the cap is checked even for an EC attempt', () => {
    const base = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]);
    const ko = applyRune(base, { characteristicId: CHAR.FORCE, value: 102 }, 'EC', perLine(), seqRng([0]));
    expect(ko.accepted).toBe(false);
    expect(ko.reason).toBe('over_cap_exceeded');
  });
});

describe('global', () => {
  it('sums over + exo: Force over 60 + exo PO 51 = 111 > 101 refused, 50 + 51 = 101 allowed', () => {
    const over60 = makeState([line({ characteristicId: CHAR.FORCE, value: 110, baseMax: 50 })]);
    const ko = applyRune(over60, { characteristicId: CHAR.PO, value: 1 }, 'SC', global(), seqRng([0]));
    expect(ko.accepted).toBe(false);
    expect(ko.reason).toBe('over_cap_exceeded');

    const over50 = makeState([line({ characteristicId: CHAR.FORCE, value: 100, baseMax: 50 })]);
    const ok = applyRune(over50, { characteristicId: CHAR.PO, value: 1 }, 'SC', global(), seqRng([0]));
    expect(ok.accepted).toBe(true);
  });

  it('natural lines below their max do not count', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 10, baseMax: 50 }), line({ characteristicId: CHAR.SAGESSE, value: 30 })]);
    const r = applyRune(state, { characteristicId: CHAR.PA, value: 1 }, 'SC', global(), seqRng([0]));
    expect(r.accepted).toBe(true);
    const check = checkOverCap(r.state, CHAR.PA, global());
    expect(check.overWeightAfter).toBe(100);
  });
});

describe('checkOverCap / hasAnyOverOrExo', () => {
  it('reports the weight considered and the cap', () => {
    const state = withRuneApplied(makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]), { characteristicId: CHAR.FORCE, value: 30 });
    const c = checkOverCap(state, CHAR.FORCE, perLine());
    expect(c).toEqual({ allowed: true, overWeightAfter: 30, cap: 101 });
  });

  it('hasAnyOverOrExo detects over, exo, and clean items', () => {
    expect(hasAnyOverOrExo([line({ characteristicId: CHAR.FORCE, value: 50 })])).toBe(false);
    expect(hasAnyOverOrExo([line({ characteristicId: CHAR.FORCE, value: 51, baseMax: 50 })])).toBe(true);
    expect(hasAnyOverOrExo([line({ characteristicId: CHAR.PA, value: 1, baseMin: 0, baseMax: 0, isExo: true })])).toBe(true);
    expect(hasAnyOverOrExo([line({ characteristicId: CHAR.PA, value: 0, baseMin: 0, baseMax: 0, isExo: true })])).toBe(false);
  });
});
