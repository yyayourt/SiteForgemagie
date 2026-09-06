/**
 * Borne d'over/exo : overCapWeight (HYPOTHÈSE COMMUNAUTAIRE, 101) dans ses deux lectures
 * overCapScope = global (défaut, HYPOTHÈSE COMMUNAUTAIRE : guide Huz, exemples « 10 ini et
 * 1 PA », « 55 vita 1 PM » = 101 cumulés) | per_line (option).
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

describe("global (défaut) — exemples du guide Huz, borne mesurée sur la part over et l'exo", () => {
  const capeVita = (value: number, baseMax = 350) => line({ characteristicId: CHAR.VITALITE, value, baseMin: 251, baseMax });

  it('the file default is global', () => {
    expect(testParams().overCapScope).toBe('global');
  });

  it('cape 370/350 vita (over 4) + exo PM (90) = 94 → accepted', () => {
    const r = applyRune(makeState([capeVita(370)]), { characteristicId: CHAR.PM, value: 1 }, 'SC', testParams(), seqRng([0]));
    expect(r.accepted).toBe(true);
    expect(checkOverCap(r.state, CHAR.PM, testParams()).overWeightAfter).toBeCloseTo(94, 9);
  });

  it('then a Rune Vi (+5 vita, 1 of weight) → 95, still accepted', () => {
    const withPm = applyRune(makeState([capeVita(370)]), { characteristicId: CHAR.PM, value: 1 }, 'SC', testParams(), seqRng([0])).state;
    const r = applyRune(withPm, { characteristicId: CHAR.VITALITE, value: 5 }, 'SC', testParams(), seqRng([0]));
    expect(r.accepted).toBe(true);
    expect(checkOverCap(r.state, CHAR.VITALITE, testParams()).overWeightAfter).toBeCloseTo(95, 9);
  });

  it('exo PA on an item at 213/200 vita → refused (100 + 2,6 = 102,6 > 101)', () => {
    const r = applyRune(makeState([capeVita(213, 200)]), { characteristicId: CHAR.PA, value: 1 }, 'SC', testParams(), seqRng([0]));
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('over_cap_exceeded');
    // lissé à 200/200 (conseil de Huz), le PA passe
    expect(applyRune(makeState([capeVita(200, 200)]), { characteristicId: CHAR.PA, value: 1 }, 'SC', testParams(), seqRng([0])).accepted).toBe(true);
  });

  it('measures the over portion, not the whole line: 213/200 vita weighs 42,6 but only 2,6 counts, so an exo PM (90) fits', () => {
    const r = applyRune(makeState([capeVita(213, 200)]), { characteristicId: CHAR.PM, value: 1 }, 'SC', testParams(), seqRng([0]));
    expect(r.accepted).toBe(true);
    expect(checkOverCap(r.state, CHAR.PM, testParams()).overWeightAfter).toBeCloseTo(92.6, 9);
  });

  it('refutation pointer: exo PA + over ≥ 2 of weight elsewhere is exactly what global forbids and per_line allows', () => {
    const state = makeState([capeVita(211, 200), line({ characteristicId: CHAR.PA, value: 1, baseMin: 0, baseMax: 0, isExo: true })]);
    expect(checkOverCap(state, CHAR.PA, global()).allowed).toBe(false);
    expect(checkOverCap(state, CHAR.PA, perLine()).allowed).toBe(true);
  });
});

describe("règle 1 (Huz) : « l’over maximal ne peut excéder 101 de densité sur une statistique », dans les deux portées", () => {
  const vita = (value: number) => makeState([line({ characteristicId: CHAR.VITALITE, value, baseMin: 351, baseMax: 400 })]);

  it.each([global(), perLine()])("505 vita d’over (101,0) accepté, 506 refusé ; agilité +101 accepté, +102 refusé", (p) => {
    expect(applyRune(vita(400), { characteristicId: CHAR.VITALITE, value: 505 }, 'SC', p, seqRng([0])).accepted).toBe(true);
    expect(applyRune(vita(400), { characteristicId: CHAR.VITALITE, value: 506 }, 'SC', p, seqRng([0])).accepted).toBe(false);
    const agi = makeState([line({ characteristicId: CHAR.CHANCE, value: 50 })]);
    expect(applyRune(agi, { characteristicId: CHAR.CHANCE, value: 101 }, 'SC', p, seqRng([0])).accepted).toBe(true);
    expect(applyRune(agi, { characteristicId: CHAR.CHANCE, value: 102 }, 'SC', p, seqRng([0])).accepted).toBe(false);
  });

  it.each([global(), perLine()])('à 900/400 vita (+500 = 100,0), une Rune Vi (+5) passe encore, une Ra Vi (+50) est refusée', (p) => {
    expect(applyRune(vita(900), { characteristicId: CHAR.VITALITE, value: 5 }, 'SC', p, seqRng([0])).accepted).toBe(true);
    const ra = applyRune(vita(900), { characteristicId: CHAR.VITALITE, value: 50 }, 'SC', p, seqRng([0]));
    expect(ra.accepted).toBe(false);
    expect(ra.reason).toBe('over_cap_exceeded');
  });

  it('un exo suit la même borne par ligne : exo Vitalité 505 accepté, 506 refusé (global)', () => {
    const base = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]);
    expect(applyRune(base, { characteristicId: CHAR.VITALITE, value: 505 }, 'SC', global(), seqRng([0])).accepted).toBe(true);
    expect(applyRune(base, { characteristicId: CHAR.VITALITE, value: 506 }, 'SC', global(), seqRng([0])).accepted).toBe(false);
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
