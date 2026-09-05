/**
 * Runes de transcendance et orbes.
 * SOURCE PRIMAIRE (devblog 2.58) : objet transcendé = plus de forgemagie ni d'orbe.
 * HYPOTHÈSES COMMUNAUTAIRES (paramètres) : refus si over/exo, taux 100 % par rang.
 */
import { describe, it, expect } from 'vitest';
import { applyRune, applyTranscendenceRune, applyRegenerationOrb } from '../../logic/engine';
import { CHAR, getLine, line, makeState, seqRng, testParams } from './helpers';

const params = () => testParams();
const ta = (characteristicId: number, value: number) => ({ characteristicId, value, rank: 'Ta' as const });

describe('applyTranscendenceRune — application', () => {
  it('on a clean item: guaranteed SC, no loss, residual unchanged', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 }), line({ characteristicId: CHAR.SAGESSE, value: 30 })], 3);
    const r = applyTranscendenceRune(state, ta(CHAR.FORCE, 10), params());
    expect(r.accepted).toBe(true);
    expect(r.outcome).toBe('SC');
    expect(r.losses).toEqual([]);
    expect(getLine(r.state, CHAR.FORCE).value).toBe(60);
    expect(getLine(r.state, CHAR.SAGESSE).value).toBe(30);
    expect(r.residualPoolAfter).toBe(3);
  });

  it('creates an exo line when the characteristic is absent', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]);
    const r = applyTranscendenceRune(state, ta(CHAR.SAGESSE, 10), params());
    expect(r.accepted).toBe(true);
    expect(getLine(r.state, CHAR.SAGESSE)).toMatchObject({ value: 10, isExo: true, isLocked: true });
  });

  it('respects the over cap', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]);
    const r = applyTranscendenceRune(state, ta(CHAR.FORCE, 102), testParams({ overCapScope: 'per_line', overCapWeight: 101 }));
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('over_cap_exceeded');
    expect(r.state.itemLocked).toBe(false);
  });
});

describe('SOURCE PRIMAIRE (devblog 2.58) — verrou de l\'objet', () => {
  const transcended = () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 }), line({ characteristicId: CHAR.SAGESSE, value: 30 })]);
    return applyTranscendenceRune(state, ta(CHAR.FORCE, 10), params()).state;
  };

  it('locks the whole item and every line, not only the transcended line', () => {
    const s = transcended();
    expect(s.itemLocked).toBe(true);
    expect(s.lines.every((l) => l.isLocked)).toBe(true);
  });

  it('refuses any further rune, on any line, with any outcome', () => {
    const s = transcended();
    for (const outcome of ['SC', 'SN', 'EC'] as const) {
      const onOther = applyRune(s, { characteristicId: CHAR.SAGESSE, value: 1 }, outcome, params(), seqRng([0]));
      expect(onOther.accepted).toBe(false);
      expect(onOther.reason).toBe('item_locked');
      expect(onOther.state).toBe(s);
    }
    const onSame = applyRune(s, { characteristicId: CHAR.FORCE, value: 1 }, 'SC', params(), seqRng([0]));
    expect(onSame.reason).toBe('item_locked');
  });

  it('refuses a second transcendence rune', () => {
    const again = applyTranscendenceRune(transcended(), ta(CHAR.SAGESSE, 10), params());
    expect(again.accepted).toBe(false);
    expect(again.reason).toBe('item_locked');
  });

  it('refuses a regeneration orb', () => {
    const r = applyRegenerationOrb(transcended(), seqRng([0.5]));
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('item_locked');
  });

  it('the lock is not a parameter: it holds whatever the params say', () => {
    const s = transcended();
    const permissive = testParams({ transcendence: { refuseIfOverOrExo: false } });
    expect(applyRune(s, { characteristicId: CHAR.SAGESSE, value: 1 }, 'SC', permissive, seqRng([0])).reason).toBe('item_locked');
    expect(applyTranscendenceRune(s, ta(CHAR.SAGESSE, 10), permissive).reason).toBe('item_locked');
  });
});

describe('HYPOTHÈSE COMMUNAUTAIRE — refus si over/exo (paramètre refuseIfOverOrExo)', () => {
  it('is refused when the item already has an over', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 51, baseMax: 50 })]);
    const r = applyTranscendenceRune(state, ta(CHAR.SAGESSE, 10), params());
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('transcendence_requires_clean_item');
    expect(r.state).toBe(state);
  });

  it('is refused when the item already has an exo', () => {
    const state = makeState([
      line({ characteristicId: CHAR.FORCE, value: 50 }),
      line({ characteristicId: CHAR.PA, value: 1, baseMin: 0, baseMax: 0, isExo: true }),
    ]);
    expect(applyTranscendenceRune(state, ta(CHAR.FORCE, 10), params()).reason).toBe('transcendence_requires_clean_item');
  });

  it('is accepted on an over item when the parameter is false', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 51, baseMax: 50 })]);
    const r = applyTranscendenceRune(state, ta(CHAR.SAGESSE, 10), testParams({ transcendence: { refuseIfOverOrExo: false } }));
    expect(r.accepted).toBe(true);
  });
});

describe('HYPOTHÈSE COMMUNAUTAIRE — taux par rang (paramètre successRateByRank)', () => {
  it('a rank below 100 % is refused explicitly instead of being drawn (phase 3)', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]);
    const p = testParams({ transcendence: { successRateByRank: { Ta: 100, Pata: 90, Rata: 100 } } });
    const r = applyTranscendenceRune(state, { characteristicId: CHAR.FORCE, value: 15, rank: 'Pata' }, p);
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('transcendence_rate_not_certain');
    expect(applyTranscendenceRune(state, { characteristicId: CHAR.FORCE, value: 10, rank: 'Ta' }, p).accepted).toBe(true);
  });
});

describe('applyRegenerationOrb (HYPOTHÈSE COMMUNAUTAIRE hors verrou)', () => {
  it('re-rolls natural lines within [baseMin, baseMax], removes exos, purges the residual', () => {
    const state = makeState(
      [
        line({ characteristicId: CHAR.FORCE, value: 70, baseMin: 30, baseMax: 50 }), // over
        line({ characteristicId: CHAR.PA, value: 1, baseMin: 0, baseMax: 0, isExo: true }),
      ],
      12
    );
    const r = applyRegenerationOrb(state, seqRng([0.999]));
    expect(r.accepted).toBe(true);
    expect(getLine(r.state, CHAR.FORCE).value).toBe(50); // rng 0.999 → borne haute
    expect(r.state.lines.some((l) => l.characteristicId === CHAR.PA)).toBe(false);
    expect(r.state.residualPool).toBe(0);
    const low = applyRegenerationOrb(state, seqRng([0]));
    expect(getLine(low.state, CHAR.FORCE).value).toBe(30);
  });
});
