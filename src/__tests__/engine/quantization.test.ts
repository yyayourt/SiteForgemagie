/**
 * QUANTITÉ RETIRÉE sur la ligne qui solde une perte — `lossSelection.quantization`.
 *
 * Défaut `ceil_random_extra` (MODÈLE EMPIRIQUE, N = 6, 2026-09-23) : ceil, plus un point avec
 * la probabilité `exactRatioExtraPointChance` quand perte / densité est un entier exact.
 * Observations Yanis (client 3.6.10.11) rejouées ici, avec les deux issues du tirage.
 */
import { describe, it, expect } from 'vitest';
import { applyRune } from '../../logic/engine';
import { pointsToRemove } from '../../logic/engine/losses';
import { getEngineParams } from '../../data/params';
import { CHAR, getLine, line, makeState, seqRng, testParams } from './helpers';

const draws = { extra: seqRng([0]), none: seqRng([0.99]) };
const withRule = (quantization: 'ceil' | 'ceil_random_extra' | 'strict', chance = 0.67) =>
  testParams({ lossSelection: { quantization, exactRatioExtraPointChance: chance } });

describe('pointsToRemove', () => {
  it('le défaut du fichier est ceil_random_extra à 0,67', () => {
    const p = getEngineParams();
    expect(p.lossSelection.quantization).toBe('ceil_random_extra');
    expect(p.lossSelection.exactRatioExtraPointChance).toBe(0.67);
  });

  it('ratio non entier : ceil, jamais de point en plus, RNG non consommé (Pod → toujours 13 Vi)', () => {
    let calls = 0;
    const rng = { next: () => (calls++, 0) };
    expect(pointsToRemove(2.5, 0.2, withRule('ceil_random_extra', 1), rng)).toBe(13);
    expect(pointsToRemove(2.5, 0.2, withRule('strict'), rng)).toBe(13);
    expect(calls).toBe(0);
  });

  it('ratio entier : 5 ou 6 Vi pour une perte de 1 (« aléatoirement 5 ou 6 »)', () => {
    const p = withRule('ceil_random_extra');
    expect(pointsToRemove(1, 0.2, p, draws.extra)).toBe(6);
    expect(pointsToRemove(1, 0.2, p, draws.none)).toBe(5);
  });

  it('ratio entier en arithmétique exacte même si le flottant dit 27,999… (5,6 / 0,2)', () => {
    expect(pointsToRemove(10 - 4.4, 0.2, withRule('strict'), draws.none)).toBe(29);
    expect(pointsToRemove(10 - 4.4, 0.2, withRule('ceil'), draws.none)).toBe(28);
  });

  it('ceil et strict sont déterministes', () => {
    expect(pointsToRemove(1, 0.1, withRule('ceil'), draws.extra)).toBe(10);
    expect(pointsToRemove(1, 0.1, withRule('strict'), draws.none)).toBe(11);
  });
});

describe('observations rejouées (ceil_random_extra, point en plus tiré)', () => {
  it('08/09 — SN Vi sur Cape Bouffante : −11 ini, reliquat 0,1', () => {
    // Vitalité 37 (36–40), Initiative 166 (151–200) ; Rune Vi +5 = poids 1
    const state = makeState([
      line({ characteristicId: CHAR.VITALITE, value: 37, baseMin: 36, baseMax: 40 }),
      line({ characteristicId: CHAR.INITIATIVE, value: 166, baseMin: 151, baseMax: 200 }),
    ]);
    const p = withRule('ceil_random_extra', 1);
    // tirage 1 : sélection (0,99 → dernière candidate = Initiative) ; tirage 2 : point en plus
    const r = applyRune(state, { characteristicId: CHAR.VITALITE, value: 5 }, 'SN', { ...p, lossSelection: { ...p.lossSelection, prioritizeOverExo: false, strategy: 'uniform' } }, seqRng([0.99, 0]));
    expect(getLine(r.state, CHAR.INITIATIVE).value).toBe(155);
    expect(r.state.residualPool).toBeCloseTo(0.1, 9);
  });

  it('10/09 A1 — EC Ini avec puits 0,2 : −5 vita et puits INCHANGÉ, sans mécanisme de puits partiel', () => {
    const state = makeState([line({ characteristicId: CHAR.VITALITE, value: 60, baseMin: 36, baseMax: 40 })], 0.2);
    const r = applyRune(state, { characteristicId: CHAR.INITIATIVE, value: 10 }, 'EC', withRule('ceil_random_extra', 1), seqRng([0]));
    expect(getLine(r.state, CHAR.VITALITE).value).toBe(55);
    expect(r.state.residualPool).toBeCloseTo(0.2, 9);
  });

  it('A1 sous ceil pur : −4 vita et puits vidé — ce que les observations réfutent', () => {
    const state = makeState([line({ characteristicId: CHAR.VITALITE, value: 60, baseMin: 36, baseMax: 40 })], 0.2);
    const r = applyRune(state, { characteristicId: CHAR.INITIATIVE, value: 10 }, 'EC', withRule('ceil'), seqRng([0]));
    expect(getLine(r.state, CHAR.VITALITE).value).toBe(56);
    expect(r.state.residualPool).toBeCloseTo(0, 9);
  });
});
