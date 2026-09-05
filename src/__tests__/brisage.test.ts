/**
 * Brisage — formule commune aux dépôts KamelAkar et Icksir :
 *   vr = valeur × densité × niveau × 0,015 + 1 ; × coefficient/100 ; ÷ poids d'une rune.
 * Les écarts entre dépôts sont couverts par des paramètres (voir brisage.ts).
 */
import { describe, it, expect } from 'vitest';
import { computeBrisage, lineCrushingWeight } from '../logic/brisage/brisage';
import { getBrisageParams, getDensity, type BrisageParams } from '../data/params';
import { getRuneTiers } from '../data/dataset';
import { CHAR } from './engine/helpers';

/** Poids d'une rune normale = valeur × densité (Force 1×1, Sagesse 1×3, PA 1×100, Vi 5×0,2, Pod 10×0,25) */
const UNITS = new Map<number, number>([
  [CHAR.FORCE, 1],
  [CHAR.SAGESSE, 3],
  [CHAR.PA, 100],
  [CHAR.VITALITE, 1],
  [CHAR.PODS, 2.5],
  [CHAR.CHANCE, 1],
]);

const params = (overrides: Partial<BrisageParams> = {}): BrisageParams => ({ ...getBrisageParams(), ...overrides });

describe('lineCrushingWeight', () => {
  it('Force 100, niveau 200 → 100 × 1 × 200 × 0,015 + 1 = 301', () => {
    expect(lineCrushingWeight({ characteristicId: CHAR.FORCE, value: 100 }, 200, params(), { applyPodsDivisor: true })).toBeCloseTo(301, 9);
  });

  it('returns null for a non-positive line (skip) or constantOffset (offset)', () => {
    const l = { characteristicId: CHAR.CHANCE, value: -10 };
    expect(lineCrushingWeight(l, 200, params({ nonPositiveLineContribution: 'skip' }), { applyPodsDivisor: true })).toBeNull();
    expect(lineCrushingWeight(l, 200, params({ nonPositiveLineContribution: 'offset' }), { applyPodsDivisor: true })).toBe(1);
  });

  it('forces PA in [0, 1] to 1 when forceOneForActionStats is true, skips it otherwise', () => {
    const pa0 = { characteristicId: CHAR.PA, value: 0 };
    expect(lineCrushingWeight(pa0, 200, params({ forceOneForActionStats: true }), { applyPodsDivisor: true })).toBeCloseTo(301, 9);
    expect(lineCrushingWeight(pa0, 200, params({ forceOneForActionStats: false }), { applyPodsDivisor: true })).toBeNull();
  });
});

describe('computeBrisage sans focus', () => {
  it('Force 100 → 301 runes Fo ; Sagesse 30 → 271 / 3 = 90 runes + 33 % (partie fractionnaire)', () => {
    const r = computeBrisage(
      { level: 200, lines: [{ characteristicId: CHAR.FORCE, value: 100 }, { characteristicId: CHAR.SAGESSE, value: 30 }], coefficientPercent: 100, runeUnitWeights: UNITS },
      params()
    );
    const fo = r.yields.find((y) => y.characteristicId === CHAR.FORCE)!;
    const sa = r.yields.find((y) => y.characteristicId === CHAR.SAGESSE)!;
    expect(fo.runes).toBeCloseTo(301, 9);
    expect(fo.guaranteedRunes).toBe(301);
    expect(fo.extraRuneProbability).toBeCloseTo(0, 9);
    expect(sa.crushingWeight).toBeCloseTo(271, 9);
    expect(sa.runes).toBeCloseTo(271 / 3, 9);
    expect(sa.guaranteedRunes).toBe(90);
    expect(sa.extraRuneProbability).toBeCloseTo(1 / 3, 9);
  });

  it('the coefficient scales linearly (50 % → half)', () => {
    const at100 = computeBrisage({ level: 200, lines: [{ characteristicId: CHAR.FORCE, value: 100 }], coefficientPercent: 100, runeUnitWeights: UNITS }, params());
    const at50 = computeBrisage({ level: 200, lines: [{ characteristicId: CHAR.FORCE, value: 100 }], coefficientPercent: 50, runeUnitWeights: UNITS }, params());
    expect(at50.yields[0].runes).toBeCloseTo(at100.yields[0].runes / 2, 9);
  });

  it('Vitalité 300 → 300 × 0,2 × 200 × 0,015 + 1 = 181 runes Vi (rune de poids 1)', () => {
    const r = computeBrisage({ level: 200, lines: [{ characteristicId: CHAR.VITALITE, value: 300 }], coefficientPercent: 100, runeUnitWeights: UNITS }, params());
    expect(r.yields[0].runes).toBeCloseTo(181, 9);
  });

  it('Pods 100 : valeur ÷ 2,5 → 40 × 0,25 × 200 × 0,015 + 1 = 31, ÷ poids de rune 2,5 = 12,4 (comportement Icksir)', () => {
    const r = computeBrisage({ level: 200, lines: [{ characteristicId: CHAR.PODS, value: 100 }], coefficientPercent: 100, runeUnitWeights: UNITS }, params());
    expect(r.yields[0].crushingWeight).toBeCloseTo(31, 9);
    expect(r.yields[0].runes).toBeCloseTo(12.4, 9);
  });

  it('PA 1 → 301 / 100 = 3,01 runes Ga Pa', () => {
    const r = computeBrisage({ level: 200, lines: [{ characteristicId: CHAR.PA, value: 1 }], coefficientPercent: 100, runeUnitWeights: UNITS }, params());
    expect(r.yields[0].runes).toBeCloseTo(3.01, 9);
    expect(r.yields[0].guaranteedRunes).toBe(3);
  });

  it('ignores lines without rune unit weight or density', () => {
    const r = computeBrisage({ level: 200, lines: [{ characteristicId: 9999, value: 10 }], coefficientPercent: 100, runeUnitWeights: UNITS }, params());
    expect(r.yields).toEqual([]);
  });
});

describe('computeBrisage avec focus', () => {
  const lines = [
    { characteristicId: CHAR.FORCE, value: 100 }, // 301
    { characteristicId: CHAR.SAGESSE, value: 30 }, // 271
  ];

  it('focus Force : 301 + 0,5 × 271 = 436,5 runes Fo, une seule sortie', () => {
    const r = computeBrisage({ level: 200, lines, coefficientPercent: 100, runeUnitWeights: UNITS, focusCharacteristicId: CHAR.FORCE }, params());
    expect(r.focusCharacteristicId).toBe(CHAR.FORCE);
    expect(r.yields).toHaveLength(1);
    expect(r.yields[0].runes).toBeCloseTo(436.5, 9);
  });

  it('focus Sagesse : (271 + 0,5 × 301) / 3', () => {
    const r = computeBrisage({ level: 200, lines, coefficientPercent: 100, runeUnitWeights: UNITS, focusCharacteristicId: CHAR.SAGESSE }, params());
    expect(r.yields[0].runes).toBeCloseTo((271 + 150.5) / 3, 9);
  });

  it('focusOtherLinesFactor is a parameter', () => {
    const r = computeBrisage({ level: 200, lines, coefficientPercent: 100, runeUnitWeights: UNITS, focusCharacteristicId: CHAR.FORCE }, params({ focusOtherLinesFactor: 0 }));
    expect(r.yields[0].runes).toBeCloseTo(301, 9);
  });

  it('écart dépôts — nonPositiveLineContribution : skip (KamelAkar) vs offset (Icksir)', () => {
    const withMalus = [...lines, { characteristicId: CHAR.CHANCE, value: -10 }];
    const skip = computeBrisage({ level: 200, lines: withMalus, coefficientPercent: 100, runeUnitWeights: UNITS, focusCharacteristicId: CHAR.FORCE }, params({ nonPositiveLineContribution: 'skip' }));
    const offset = computeBrisage({ level: 200, lines: withMalus, coefficientPercent: 100, runeUnitWeights: UNITS, focusCharacteristicId: CHAR.FORCE }, params({ nonPositiveLineContribution: 'offset' }));
    expect(skip.yields[0].runes).toBeCloseTo(436.5, 9);
    expect(offset.yields[0].runes).toBeCloseTo(436.5 + 0.5, 9);
  });

  it('écart dépôts — podsDivisorOnNonFocusLines : Icksir (true) vs KamelAkar (false)', () => {
    const withPods = [{ characteristicId: CHAR.FORCE, value: 100 }, { characteristicId: CHAR.PODS, value: 100 }];
    const icksir = computeBrisage({ level: 200, lines: withPods, coefficientPercent: 100, runeUnitWeights: UNITS, focusCharacteristicId: CHAR.FORCE }, params({ podsDivisorOnNonFocusLines: true }));
    const kamel = computeBrisage({ level: 200, lines: withPods, coefficientPercent: 100, runeUnitWeights: UNITS, focusCharacteristicId: CHAR.FORCE }, params({ podsDivisorOnNonFocusLines: false }));
    // Pods 100 : divisé → 31 ; brut → 100 × 0,25 × 200 × 0,015 + 1 = 76
    expect(icksir.yields[0].runes).toBeCloseTo(301 + 0.5 * 31, 9);
    expect(kamel.yields[0].runes).toBeCloseTo(301 + 0.5 * 76, 9);
  });

  it('returns no yield when the focus line is absent', () => {
    const r = computeBrisage({ level: 200, lines, coefficientPercent: 100, runeUnitWeights: UNITS, focusCharacteristicId: CHAR.PA }, params());
    expect(r.yields).toEqual([]);
  });
});

describe('invariant Pods : brisage.podsDivisor = poids d\'une Rune Pod (+10 × densities.40)', () => {
  it('holds for the values of empirical_params.json and data/rune-tiers.json', () => {
    const podRune = getRuneTiers(CHAR.PODS)?.normal;
    expect(podRune).toBeDefined();
    expect(podRune!.value).toBe(10);
    const density = getDensity(CHAR.PODS);
    expect(density).toBeDefined();
    expect(podRune!.value * density!).toBeCloseTo(2.5, 9);
    expect(getBrisageParams().podsDivisor).toBeCloseTo(podRune!.value * density!, 9);
  });
});
