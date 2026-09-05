/**
 * Runes de transcendance et orbes.
 * SOURCE PRIMAIRE (devblog 2.58) : objet transcendé = plus de forgemagie ni d'orbe.
 * Non certain (paramètres, dans l'ordre) : refuseIfExo, refuseIfOver, maxCurrentValueByRank,
 * successRateByRank.
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

describe("SOURCE PRIMAIRE (devblog 2.58) — verrou de l'objet", () => {
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
    expect(applyRune(s, { characteristicId: CHAR.FORCE, value: 1 }, 'SC', params(), seqRng([0])).reason).toBe('item_locked');
  });

  it('refuses a second transcendence rune, before any hypothesis check', () => {
    const permissive = testParams({ transcendence: { refuseIfExo: false, refuseIfOver: false } });
    const again = applyTranscendenceRune(transcended(), ta(CHAR.SAGESSE, 10), permissive);
    expect(again.accepted).toBe(false);
    expect(again.reason).toBe('item_locked');
  });

  it('refuses a regeneration orb', () => {
    const r = applyRegenerationOrb(transcended(), seqRng([0.5]));
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('item_locked');
  });
});

describe('ordre des vérifications : verrou → exo → over → seuil → application', () => {
  const overAndExo = () =>
    makeState([
      line({ characteristicId: CHAR.FORCE, value: 51, baseMax: 50 }),
      line({ characteristicId: CHAR.PA, value: 1, baseMin: 0, baseMax: 0, isExo: true }),
    ]);

  it('exo is reported before over', () => {
    const r = applyTranscendenceRune(overAndExo(), ta(CHAR.SAGESSE, 10), params());
    expect(r.reason).toBe('transcendence_has_exo');
  });

  it('over is reported when refuseIfExo is off', () => {
    const r = applyTranscendenceRune(overAndExo(), ta(CHAR.SAGESSE, 10), testParams({ transcendence: { refuseIfExo: false } }));
    expect(r.reason).toBe('transcendence_has_over');
  });

  it('threshold is reported when both refusals are off', () => {
    const p = testParams({
      transcendence: { refuseIfExo: false, refuseIfOver: false, maxCurrentValueByRank: { [String(CHAR.FORCE)]: { Ta: 40 } } },
    });
    const r = applyTranscendenceRune(overAndExo(), ta(CHAR.FORCE, 10), p);
    expect(r.reason).toBe('transcendence_threshold_exceeded');
  });

  it('application happens when everything is off', () => {
    const p = testParams({ transcendence: { refuseIfExo: false, refuseIfOver: false } });
    const r = applyTranscendenceRune(overAndExo(), ta(CHAR.SAGESSE, 10), p);
    expect(r.accepted).toBe(true);
    expect(r.state.itemLocked).toBe(true);
  });
});

describe('HYPOTHÈSES COMMUNAUTAIRES — refuseIfExo / refuseIfOver', () => {
  it('refuseIfExo alone refuses an exo item but accepts an over item', () => {
    const p = testParams({ transcendence: { refuseIfExo: true, refuseIfOver: false } });
    const exo = makeState([line({ characteristicId: CHAR.FORCE, value: 50 }), line({ characteristicId: CHAR.PA, value: 1, baseMin: 0, baseMax: 0, isExo: true })]);
    const over = makeState([line({ characteristicId: CHAR.FORCE, value: 51, baseMax: 50 })]);
    expect(applyTranscendenceRune(exo, ta(CHAR.FORCE, 10), p).reason).toBe('transcendence_has_exo');
    expect(applyTranscendenceRune(over, ta(CHAR.SAGESSE, 10), p).accepted).toBe(true);
  });

  it('refuseIfOver alone refuses an over item but accepts an exo item', () => {
    const p = testParams({ transcendence: { refuseIfExo: false, refuseIfOver: true } });
    const exo = makeState([line({ characteristicId: CHAR.FORCE, value: 50 }), line({ characteristicId: CHAR.PA, value: 1, baseMin: 0, baseMax: 0, isExo: true })]);
    const over = makeState([line({ characteristicId: CHAR.FORCE, value: 51, baseMax: 50 })]);
    expect(applyTranscendenceRune(over, ta(CHAR.SAGESSE, 10), p).reason).toBe('transcendence_has_over');
    expect(applyTranscendenceRune(exo, ta(CHAR.FORCE, 10), p).accepted).toBe(true);
  });

  it('an exo line at 0 does not count as an exo', () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 50 }), line({ characteristicId: CHAR.PA, value: 0, baseMin: 0, baseMax: 0, isExo: true })]);
    expect(applyTranscendenceRune(state, ta(CHAR.FORCE, 10), params()).accepted).toBe(true);
  });
});

describe('INCONNU — maxCurrentValueByRank', () => {
  it('no threshold configured (default): nothing is refused on that ground', () => {
    const state = makeState([line({ characteristicId: CHAR.INITIATIVE, value: 5000 })]);
    expect(applyTranscendenceRune(state, ta(CHAR.INITIATIVE, 100), params()).accepted).toBe(true);
  });

  it('a configured threshold refuses a line above it, per rank, and accepts at or below', () => {
    const p = testParams({ transcendence: { maxCurrentValueByRank: { [String(CHAR.INITIATIVE)]: { Ta: 210, Pata: 410 } } } });
    const at211 = makeState([line({ characteristicId: CHAR.INITIATIVE, value: 211 })]);
    const at210 = makeState([line({ characteristicId: CHAR.INITIATIVE, value: 210 })]);
    expect(applyTranscendenceRune(at211, ta(CHAR.INITIATIVE, 100), p).reason).toBe('transcendence_threshold_exceeded');
    expect(applyTranscendenceRune(at210, ta(CHAR.INITIATIVE, 100), p).accepted).toBe(true);
    expect(applyTranscendenceRune(at211, { characteristicId: CHAR.INITIATIVE, value: 150, rank: 'Pata' }, p).accepted).toBe(true);
    // Rata non renseigné → aucun seuil
    expect(applyTranscendenceRune(at211, { characteristicId: CHAR.INITIATIVE, value: 200, rank: 'Rata' }, p).accepted).toBe(true);
  });
});

describe('HYPOTHÈSE COMMUNAUTAIRE — successRateByRank', () => {
  it('a rank below 100 % is refused explicitly instead of being drawn', () => {
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
        line({ characteristicId: CHAR.FORCE, value: 70, baseMin: 30, baseMax: 50 }),
        line({ characteristicId: CHAR.PA, value: 1, baseMin: 0, baseMax: 0, isExo: true }),
      ],
      12
    );
    const r = applyRegenerationOrb(state, seqRng([0.999]));
    expect(r.accepted).toBe(true);
    expect(getLine(r.state, CHAR.FORCE).value).toBe(50);
    expect(r.state.lines.some((l) => l.characteristicId === CHAR.PA)).toBe(false);
    expect(r.state.residualPool).toBe(0);
    expect(getLine(applyRegenerationOrb(state, seqRng([0])).state, CHAR.FORCE).value).toBe(30);
  });
});
