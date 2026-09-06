/**
 * Stratégies de sélection des pertes, avec RNG fixé. Chacune est une HYPOTHÈSE (INCONNU) :
 * ces tests vérifient le câblage, pas la fidélité au serveur.
 */
import { describe, it, expect } from 'vitest';
import {
  applyRune,
  getLossSelectionStrategy,
  uniformStrategy,
  weightedByWeightStrategy,
  weightedByValueTimesWeightStrategy,
  type LossCandidate,
} from '../../logic/engine';
import { CHAR, getLine, line, makeState, seqRng, testParams } from './helpers';

const candidates: LossCandidate[] = [
  { line: line({ characteristicId: CHAR.FORCE, value: 100 }), density: 1 }, // masse 100
  { line: line({ characteristicId: CHAR.SAGESSE, value: 10 }), density: 3 }, // masse 30
];

describe('uniform', () => {
  it('picks by index: rng 0 → first, rng 0.99 → last', () => {
    expect(uniformStrategy.pick(candidates, seqRng([0])).line.characteristicId).toBe(CHAR.FORCE);
    expect(uniformStrategy.pick(candidates, seqRng([0.99])).line.characteristicId).toBe(CHAR.SAGESSE);
  });
});

describe('weighted_by_weight (∝ densité)', () => {
  it('total 4 : roll < 1 → Force, roll ≥ 1 → Sagesse', () => {
    expect(weightedByWeightStrategy.pick(candidates, seqRng([0.1])).line.characteristicId).toBe(CHAR.FORCE); // 0.4
    expect(weightedByWeightStrategy.pick(candidates, seqRng([0.5])).line.characteristicId).toBe(CHAR.SAGESSE); // 2
  });
});

describe('weighted_by_value_times_weight (∝ valeur × densité)', () => {
  it('total 130 : roll < 100 → Force, roll ≥ 100 → Sagesse', () => {
    expect(weightedByValueTimesWeightStrategy.pick(candidates, seqRng([0.5])).line.characteristicId).toBe(CHAR.FORCE); // 65
    expect(weightedByValueTimesWeightStrategy.pick(candidates, seqRng([0.9])).line.characteristicId).toBe(CHAR.SAGESSE); // 117
  });
});

describe('getLossSelectionStrategy', () => {
  it('resolves the three names and rejects unknown ones', () => {
    expect(getLossSelectionStrategy('uniform').name).toBe('uniform');
    expect(getLossSelectionStrategy('weighted_by_weight').name).toBe('weighted_by_weight');
    expect(getLossSelectionStrategy('weighted_by_value_times_weight').name).toBe('weighted_by_value_times_weight');
    expect(() => getLossSelectionStrategy('nope' as never)).toThrow();
  });
});

describe('prioritizeOverExo (HYPOTHÈSE COMMUNAUTAIRE)', () => {
  const overExoItem = () =>
    makeState([
      line({ characteristicId: CHAR.SAGESSE, value: 30 }), // naturelle, première dans l'ordre
      line({ characteristicId: CHAR.FORCE, value: 55, baseMax: 50 }), // over de 5
      line({ characteristicId: CHAR.PO, value: 1, baseMin: 0, baseMax: 0, isExo: true }), // exo (51 : reste sous la borne globale avec l'over)
      line({ characteristicId: CHAR.VITALITE, value: 300 }), // cible
    ]);

  it('true : over/exo lines are hit first, and an over line only loses its over part', () => {
    const params = testParams({ lossSelection: { strategy: 'uniform', prioritizeOverExo: true } });
    // Rune Vi +5 = 1 de poids ; candidates over/exo dans l'ordre : Force (over), PO (exo) ; rng 0 → Force
    const r = applyRune(overExoItem(), { characteristicId: CHAR.VITALITE, value: 5 }, 'SN', params, seqRng([0]));
    expect(r.losses).toEqual([{ characteristicId: CHAR.FORCE, pointsLost: 1, weightLost: 1 }]);
    expect(getLine(r.state, CHAR.SAGESSE).value).toBe(30);
  });

  it('true : a loss bigger than the over part continues on the next candidates', () => {
    const params = testParams({ lossSelection: { strategy: 'uniform', prioritizeOverExo: true } });
    // Rune Do +1 = 20 (ligne 10/11 : pas d'over) ; Force over = 5 (5 de poids) puis PO exo (51) → PO saute entier, reliquat 36
    const state = makeState([
      line({ characteristicId: CHAR.DOMMAGES, value: 10, baseMax: 11 }),
      line({ characteristicId: CHAR.FORCE, value: 55, baseMax: 50 }),
      line({ characteristicId: CHAR.PO, value: 1, baseMin: 0, baseMax: 0, isExo: true }),
    ]);
    const r = applyRune(state, { characteristicId: CHAR.DOMMAGES, value: 1 }, 'SN', params, seqRng([0, 0]));
    expect(r.losses).toEqual([
      { characteristicId: CHAR.FORCE, pointsLost: 5, weightLost: 5 },
      { characteristicId: CHAR.PO, pointsLost: 1, weightLost: 51 },
    ]);
    expect(getLine(r.state, CHAR.FORCE).value).toBe(50);
    expect(getLine(r.state, CHAR.PO).value).toBe(0);
    expect(r.residualPoolAfter).toBe(36);
  });

  it('false : the first candidate in item order can be a natural line', () => {
    const params = testParams({ lossSelection: { strategy: 'uniform', prioritizeOverExo: false } });
    const r = applyRune(overExoItem(), { characteristicId: CHAR.VITALITE, value: 5 }, 'SN', params, seqRng([0]));
    expect(r.losses[0].characteristicId).toBe(CHAR.SAGESSE);
  });

  it('an exo line cannot lose more than its value', () => {
    const params = testParams({ lossSelection: { strategy: 'uniform', prioritizeOverExo: true } });
    const state = makeState([
      line({ characteristicId: CHAR.SAGESSE, value: 30 }),
      line({ characteristicId: CHAR.PO, value: 1, baseMin: 0, baseMax: 0, isExo: true }), // 51
    ]);
    // Rune Sa +1 = 3 ; seule candidate over/exo : PO → perd 1 (51) → reliquat 48
    const r = applyRune(state, { characteristicId: CHAR.SAGESSE, value: 1 }, 'SN', params, seqRng([0]));
    expect(r.losses).toEqual([{ characteristicId: CHAR.PO, pointsLost: 1, weightLost: 51 }]);
    expect(r.residualPoolAfter).toBe(48);
  });
});

describe('strategy selection through params', () => {
  it('weighted_by_value_times_weight favours the heavy line for the same rng', () => {
    const state = makeState([
      line({ characteristicId: CHAR.VITALITE, value: 300 }),
      line({ characteristicId: CHAR.FORCE, value: 100 }), // masse 100
      line({ characteristicId: CHAR.SAGESSE, value: 10 }), // masse 30
    ]);
    const heavy = testParams({ lossSelection: { strategy: 'weighted_by_value_times_weight', prioritizeOverExo: false } });
    const uni = testParams({ lossSelection: { strategy: 'uniform', prioritizeOverExo: false } });
    // rng 0.6 : pondéré → roll 78 < 100 → Force ; uniforme → index 1 → Sagesse
    expect(applyRune(state, { characteristicId: CHAR.VITALITE, value: 5 }, 'SN', heavy, seqRng([0.6])).losses[0].characteristicId).toBe(CHAR.FORCE);
    expect(applyRune(state, { characteristicId: CHAR.VITALITE, value: 5 }, 'SN', uni, seqRng([0.6])).losses[0].characteristicId).toBe(CHAR.SAGESSE);
  });
});
