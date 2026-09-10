/**
 * Portée du plancher officiel de 15 % (tutoriel Ankama : « hors tentative d'overmax ou de
 * forgemagie exotique »). Correction du 2026-09-09 : le plancher ne vaut que pour une ligne
 * naturelle qui reste ≤ son jet max. Over et exo non lourd : aucun plancher (INCONNU).
 */
import { describe, it, expect } from 'vitest';
import { computeOutcomeProbabilities, attemptKindOf, officialFloorFor, MIN_SC_NORMAL, MIN_SC_HEAVY_EXO, type ProbabilityInput } from '../../logic/probability';
import { getProbabilityParams, type ProbabilityParams } from '../../data/params';

/** Modèle linéaire volontairement bas : a = 0,05, aucune pente → pSC brut 0,05 partout. */
const low = (): ProbabilityParams => {
  const p = getProbabilityParams();
  return { ...p, model: 'official_factors_linear', officialFactorsLinear: { ...p.officialFactorsLinear, a: 0.05, b: 0, c: 0, d: 0 } };
};

const input = (partial: Partial<ProbabilityInput> = {}): ProbabilityInput => ({
  itemLevel: 200,
  line: { value: 40, baseMax: 50, isExo: false },
  runeWeight: 1,
  runeValue: 1,
  isHeavyExo: false,
  residualPool: 0,
  weightBudget: 0,
  ...partial,
});

describe('attemptKindOf', () => {
  it('normal while the rune keeps the line at or under its max, over as soon as it exceeds it', () => {
    expect(attemptKindOf({ value: 40, baseMax: 50, isExo: false }, 10, false)).toBe('normal');
    expect(attemptKindOf({ value: 40, baseMax: 50, isExo: false }, 11, false)).toBe('over');
    expect(attemptKindOf({ value: 55, baseMax: 50, isExo: false }, 1, false)).toBe('over');
    expect(attemptKindOf({ value: 0, baseMax: 0, isExo: true }, 1, false)).toBe('exo');
    expect(attemptKindOf({ value: 0, baseMax: 0, isExo: true }, 1, true)).toBe('heavy_exo');
  });

  it('floors: 15 % normal, 1 % heavy exo, none for over and plain exo', () => {
    expect(officialFloorFor('normal')).toBe(MIN_SC_NORMAL);
    expect(officialFloorFor('heavy_exo')).toBe(MIN_SC_HEAVY_EXO);
    expect(officialFloorFor('over')).toBe(0);
    expect(officialFloorFor('exo')).toBe(0);
  });
});

describe('plancher 15 % : portée', () => {
  it('normal : never below 15 % even with a model at 5 %', () => {
    expect(computeOutcomeProbabilities(input(), low()).pSC).toBeCloseTo(MIN_SC_NORMAL, 9);
    // la rune qui amène exactement au jet max reste « normale »
    expect(computeOutcomeProbabilities(input({ runeValue: 10 }), low()).pSC).toBeCloseTo(MIN_SC_NORMAL, 9);
  });

  it('over : pSC can be below 15 % (the official text excludes overmax attempts)', () => {
    const r = computeOutcomeProbabilities(input({ runeValue: 11 }), low());
    expect(r.pSC).toBeCloseTo(0.05, 9);
    expect(r.pSC).toBeLessThan(MIN_SC_NORMAL);
    const already = computeOutcomeProbabilities(input({ line: { value: 60, baseMax: 50, isExo: false } }), low());
    expect(already.pSC).toBeCloseTo(0.05, 9);
  });

  it("exo : le modèle ne s'applique plus du tout — le garde-fou le précède (2026-09-10)", () => {
    // Avant : le modèle sortait a = 0,05 (ici) ou 0,15 (défaut du fichier) pour un exotique,
    // parce que distanceToMax renvoyait 0. Le plancher de 1 % ne mordait jamais.
    // Depuis : toute création d'effet passe par exoGuard, quel que soit le modèle et quels
    // que soient ses paramètres — un réglage ne peut plus produire un exo optimiste.
    const exo = computeOutcomeProbabilities(input({ line: { value: 0, baseMax: 0, isExo: true } }), low());
    expect(exo.pSC).toBeCloseTo(MIN_SC_HEAVY_EXO, 9); // borne basse de l'intervalle (ancre 5)
    const p = low();
    const zero = { ...p, officialFactorsLinear: { ...p.officialFactorsLinear, a: 0 } };
    expect(computeOutcomeProbabilities(input({ line: { value: 0, baseMax: 0, isExo: true } }), zero).pSC).toBeCloseTo(MIN_SC_HEAVY_EXO, 9);
    const heavy = computeOutcomeProbabilities(input({ line: { value: 0, baseMax: 0, isExo: true }, isHeavyExo: true }), zero);
    expect(heavy.pSC).toBeCloseTo(MIN_SC_HEAVY_EXO, 9);
  });

  it('the file default (a = 0,15) gives 15 % on an over line, but that is the model, not a floor', () => {
    const p = getProbabilityParams();
    const lowered = { ...p, officialFactorsLinear: { ...p.officialFactorsLinear, d: 0.5 } };
    const r = computeOutcomeProbabilities(input({ line: { value: 60, baseMax: 50, isExo: false }, overCapUsage: 1 }), lowered);
    expect(r.pSC).toBeLessThan(MIN_SC_NORMAL);
  });
});
