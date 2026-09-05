/**
 * Runes de transcendance — devblog 2.72 (SOURCE PRIMAIRE) : SC garanti, refusée si over/exo,
 * ligne verrouillée ensuite. Portée du verrou : paramètre transcendence.lockScope.
 */
import { describe, it, expect } from 'vitest';
import { applyRune, applyTranscendenceRune } from '../../logic/engine';
import { CHAR, getLine, line, makeState, seqRng, testParams } from './helpers';

const params = () => testParams({ transcendence: { lockScope: 'line' } });

describe('applyTranscendenceRune', () => {
  it('on a clean item: guaranteed SC, no loss, residual unchanged, line locked', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 }), line({ characteristicId: CHAR.SAGESSE, value: 30 })], 3);
    const r = applyTranscendenceRune(state, { characteristicId: CHAR.FORCE, value: 10 }, params());
    expect(r.accepted).toBe(true);
    expect(r.outcome).toBe('SC');
    expect(r.losses).toEqual([]);
    expect(getLine(r.state, CHAR.FORCE).value).toBe(60);
    expect(getLine(r.state, CHAR.FORCE).isLocked).toBe(true);
    expect(getLine(r.state, CHAR.SAGESSE).isLocked).toBe(false);
    expect(r.residualPoolAfter).toBe(3);
    expect(r.state.itemLocked).toBe(false);
  });

  it('is refused when the item already has an over', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 51, baseMax: 50 })]);
    const r = applyTranscendenceRune(state, { characteristicId: CHAR.SAGESSE, value: 10 }, params());
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('transcendence_requires_clean_item');
    expect(r.state).toBe(state);
  });

  it('is refused when the item already has an exo', () => {
    const state = makeState([
      line({ characteristicId: CHAR.FORCE, value: 50 }),
      line({ characteristicId: CHAR.PA, value: 1, baseMin: 0, baseMax: 0, isExo: true }),
    ]);
    const r = applyTranscendenceRune(state, { characteristicId: CHAR.FORCE, value: 10 }, params());
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('transcendence_requires_clean_item');
  });

  it('a locked line refuses any further rune, other lines still accept', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 }), line({ characteristicId: CHAR.SAGESSE, value: 30 })]);
    const t = applyTranscendenceRune(state, { characteristicId: CHAR.FORCE, value: 10 }, params());
    const onLocked = applyRune(t.state, { characteristicId: CHAR.FORCE, value: 1 }, 'SC', params(), seqRng([0]));
    expect(onLocked.accepted).toBe(false);
    expect(onLocked.reason).toBe('line_locked');
    const onOther = applyRune(t.state, { characteristicId: CHAR.SAGESSE, value: 1 }, 'SC', params(), seqRng([0]));
    expect(onOther.accepted).toBe(true);
  });

  it('a locked line is never picked as a loss victim', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 }), line({ characteristicId: CHAR.SAGESSE, value: 30 })]);
    const t = applyTranscendenceRune(state, { characteristicId: CHAR.FORCE, value: 10 }, params());
    // Force est maintenant over (60 > 50) ET verrouillée : elle ne doit pas absorber la perte
    const r = applyRune(t.state, { characteristicId: CHAR.SAGESSE, value: 1 }, 'SN', testParams({ lossSelection: { strategy: 'uniform', prioritizeOverExo: true } }), seqRng([0]));
    expect(r.losses.every((l) => l.characteristicId !== CHAR.FORCE)).toBe(true);
  });

  it('cannot be applied twice on the same line', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]);
    const t = applyTranscendenceRune(state, { characteristicId: CHAR.FORCE, value: 10 }, params());
    const again = applyTranscendenceRune(t.state, { characteristicId: CHAR.FORCE, value: 10 }, params());
    expect(again.accepted).toBe(false);
    expect(again.reason).toBe('transcendence_line_already_locked');
  });

  it('respects the over cap', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]);
    const r = applyTranscendenceRune(state, { characteristicId: CHAR.FORCE, value: 102 }, testParams({ overCapScope: 'per_line', overCapWeight: 101 }));
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('over_cap_exceeded');
  });

  it('lockScope = item locks the whole item', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 }), line({ characteristicId: CHAR.SAGESSE, value: 30 })]);
    const itemScope = testParams({ transcendence: { lockScope: 'item' } });
    const t = applyTranscendenceRune(state, { characteristicId: CHAR.FORCE, value: 10 }, itemScope);
    expect(t.state.itemLocked).toBe(true);
    expect(t.state.lines.every((l) => l.isLocked)).toBe(true);
    const r = applyRune(t.state, { characteristicId: CHAR.SAGESSE, value: 1 }, 'SC', itemScope, seqRng([0]));
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('item_locked');
  });
});
