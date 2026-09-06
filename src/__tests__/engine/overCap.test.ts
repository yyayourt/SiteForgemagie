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
  it('allows Force 50 → 101 (densité 1, valeur totale) and refuses 102', () => {
    const base = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]);
    const ok = applyRune(base, { characteristicId: CHAR.FORCE, value: 51 }, 'SC', perLine(), seqRng([0]));
    expect(ok.accepted).toBe(true);
    const ko = applyRune(base, { characteristicId: CHAR.FORCE, value: 52 }, 'SC', perLine(), seqRng([0]));
    expect(ko.accepted).toBe(false);
    expect(ko.reason).toBe('over_cap_exceeded');
  });

  it('handles fractional densities: exo Vitalité 505 allowed (101,0), 506 refused', () => {
    const base = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]);
    expect(applyRune(base, { characteristicId: CHAR.VITALITE, value: 505 }, 'SC', perLine(), seqRng([0])).accepted).toBe(true);
    expect(applyRune(base, { characteristicId: CHAR.VITALITE, value: 506 }, 'SC', perLine(), seqRng([0])).accepted).toBe(false);
  });

  it('lines are independent: Force 50 → 90 (over 40) + exo PO 51 both allowed', () => {
    const s1 = applyRune(makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]), { characteristicId: CHAR.FORCE, value: 40 }, 'SC', perLine(), seqRng([0]));
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

describe("règle 1 (Huz, lecture valeur totale) : « 505 vita, 101 agilité » au TOTAL de la ligne, quelle que soit la base", () => {
  const vita = (value: number, baseMax: number) => makeState([line({ characteristicId: CHAR.VITALITE, value, baseMin: baseMax - 49, baseMax })]);

  it('the file default measures the whole line (total_value)', () => {
    expect(testParams().overCapLineBasis).toBe('total_value');
  });

  it.each([global(), perLine()])('base 400 : +105 → 505 accepté, +106 → 506 refusé ; base 200 : +305 accepté, +306 refusé', (p) => {
    expect(applyRune(vita(400, 400), { characteristicId: CHAR.VITALITE, value: 105 }, 'SC', p, seqRng([0])).accepted).toBe(true);
    expect(applyRune(vita(400, 400), { characteristicId: CHAR.VITALITE, value: 106 }, 'SC', p, seqRng([0])).accepted).toBe(false);
    expect(applyRune(vita(200, 200), { characteristicId: CHAR.VITALITE, value: 305 }, 'SC', p, seqRng([0])).accepted).toBe(true);
    expect(applyRune(vita(200, 200), { characteristicId: CHAR.VITALITE, value: 306 }, 'SC', p, seqRng([0])).accepted).toBe(false);
  });

  it('base 500 : +5 accepté (505), +6 refusé ; base 520 (104 de poids) : aucun over possible', () => {
    expect(applyRune(vita(500, 500), { characteristicId: CHAR.VITALITE, value: 5 }, 'SC', testParams(), seqRng([0])).accepted).toBe(true);
    expect(applyRune(vita(500, 500), { characteristicId: CHAR.VITALITE, value: 6 }, 'SC', testParams(), seqRng([0])).accepted).toBe(false);
    const heavy = applyRune(vita(520, 520), { characteristicId: CHAR.VITALITE, value: 5 }, 'SC', testParams(), seqRng([0]));
    expect(heavy.accepted).toBe(false);
    expect(heavy.reason).toBe('over_cap_exceeded');
  });

  it('a natural line that stays at or under its max is never concerned, even above 101 of weight (40 sagesse = 120)', () => {
    const sag = makeState([line({ characteristicId: CHAR.SAGESSE, value: 35, baseMin: 31, baseMax: 40 })]);
    expect(applyRune(sag, { characteristicId: CHAR.SAGESSE, value: 5 }, 'SC', testParams(), seqRng([0])).accepted).toBe(true);
    expect(applyRune(sag, { characteristicId: CHAR.SAGESSE, value: 6 }, 'SC', testParams(), seqRng([0])).accepted).toBe(false);
  });

  it('agilité (densité 1) : 101 au total accepté, 102 refusé ; exo Vitalité 505 accepté, 506 refusé', () => {
    const agi = makeState([line({ characteristicId: CHAR.CHANCE, value: 50 })]);
    expect(applyRune(agi, { characteristicId: CHAR.CHANCE, value: 51 }, 'SC', testParams(), seqRng([0])).accepted).toBe(true);
    expect(applyRune(agi, { characteristicId: CHAR.CHANCE, value: 52 }, 'SC', testParams(), seqRng([0])).accepted).toBe(false);
    const base = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]);
    expect(applyRune(base, { characteristicId: CHAR.VITALITE, value: 505 }, 'SC', testParams(), seqRng([0])).accepted).toBe(true);
    expect(applyRune(base, { characteristicId: CHAR.VITALITE, value: 506 }, 'SC', testParams(), seqRng([0])).accepted).toBe(false);
  });

  it("over_part (option) restores the former reading: base 400 vita, +505 accepted, +506 refused", () => {
    const p = testParams({ overCapLineBasis: 'over_part' });
    expect(applyRune(vita(400, 400), { characteristicId: CHAR.VITALITE, value: 505 }, 'SC', p, seqRng([0])).accepted).toBe(true);
    expect(applyRune(vita(400, 400), { characteristicId: CHAR.VITALITE, value: 506 }, 'SC', p, seqRng([0])).accepted).toBe(false);
  });

  it('the object cumul (rule 2) still counts only the over part: 370/350 vita (74 total, 4 over) + exo PM = 94 accepted', () => {
    const r = applyRune(vita(370, 350), { characteristicId: CHAR.PM, value: 1 }, 'SC', testParams(), seqRng([0]));
    expect(r.accepted).toBe(true);
    expect(checkOverCap(r.state, CHAR.PM, testParams())).toMatchObject({ overWeightAfter: 94, lineWeightAfter: 90 });
  });
});

describe('checkOverCap / hasAnyOverOrExo', () => {
  it('reports the weight considered and the cap', () => {
    const state = withRuneApplied(makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]), { characteristicId: CHAR.FORCE, value: 30 });
    const c = checkOverCap(state, CHAR.FORCE, perLine());
    expect(c).toEqual({ allowed: true, overWeightAfter: 30, lineWeightAfter: 80, cap: 101 });
  });

  it('hasAnyOverOrExo detects over, exo, and clean items', () => {
    expect(hasAnyOverOrExo([line({ characteristicId: CHAR.FORCE, value: 50 })])).toBe(false);
    expect(hasAnyOverOrExo([line({ characteristicId: CHAR.FORCE, value: 51, baseMax: 50 })])).toBe(true);
    expect(hasAnyOverOrExo([line({ characteristicId: CHAR.PA, value: 1, baseMin: 0, baseMax: 0, isExo: true })])).toBe(true);
    expect(hasAnyOverOrExo([line({ characteristicId: CHAR.PA, value: 0, baseMin: 0, baseMax: 0, isExo: true })])).toBe(false);
  });
});
