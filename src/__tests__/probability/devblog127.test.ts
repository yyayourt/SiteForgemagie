/**
 * Modèle `devblog_1_27` (P3, 2026-09-10).
 *
 * Ce que ces tests garantissent :
 *   1. la courbe passe EXACTEMENT par les trois ancres du régime normal ;
 *   2. le SN ne dépasse jamais 50 % (SOURCE PRIMAIRE — v1.27) ;
 *   3. le modèle n'est JAMAIS le défaut — c'est un garde-fou contre la confusion entre des
 *      chiffres de 2010 et une mesure Unity ;
 *   4. son libellé porte sa version.
 */
import { describe, it, expect } from 'vitest';
import {
  ANCHOR_BEST_REROLL,
  ANCHOR_PERFECT_ROLL,
  ANCHOR_WORST_REROLL,
  MAX_SN,
  PROBABILITY_MODEL_LABELS,
  computeOutcomeProbabilities,
  devblog127Model,
  type ProbabilityInput,
} from '../../logic/probability';
import { interpolateAnchors } from '../../logic/probability/models/devblog127';
import { getProbabilityParams } from '../../data/params';

/** Comparaison de triplets à la précision flottante près (l'interpolation cumule des arrondis). */
function expectTriplet(actual: { pSC: number; pSN: number; pEC: number }, expected: { pSC: number; pSN: number; pEC: number }) {
  expect(actual.pSC).toBeCloseTo(expected.pSC, 12);
  expect(actual.pSN).toBeCloseTo(expected.pSN, 12);
  expect(actual.pEC).toBeCloseTo(expected.pEC, 12);
}

const input = (partial: Partial<ProbabilityInput> = {}): ProbabilityInput => ({
  itemLevel: 0,
  line: { value: 0, baseMin: 0, baseMax: 50, isExo: false },
  runeWeight: 1,
  runeValue: 1,
  isHeavyExo: false,
  residualPool: 0,
  weightBudget: 0,
  ...partial,
});

describe('interpolation des ancres', () => {
  it('passe exactement par les trois ancres du régime normal', () => {
    expectTriplet(interpolateAnchors(0), ANCHOR_BEST_REROLL); // 66/34/0
    expectTriplet(interpolateAnchors(0.5), ANCHOR_PERFECT_ROLL); // 43/50/7
    expectTriplet(interpolateAnchors(1), ANCHOR_WORST_REROLL); // 15/50/35
  });

  it('interpole entre les ancres et reste monotone décroissante en SC', () => {
    const quarter = interpolateAnchors(0.25);
    expect(quarter.pSC).toBeCloseTo((0.66 + 0.43) / 2, 12);
    let previous = 1;
    for (let d = 0; d <= 1.0001; d += 0.05) {
      const r = interpolateAnchors(d);
      expect(r.pSC).toBeLessThanOrEqual(previous + 1e-12);
      previous = r.pSC;
    }
  });

  it('somme toujours à 1 et borne le SN à 50 %', () => {
    for (let d = 0; d <= 1.0001; d += 0.05) {
      const r = interpolateAnchors(d);
      expect(r.pSC + r.pSN + r.pEC).toBeCloseTo(1, 12);
      expect(r.pSN).toBeLessThanOrEqual(MAX_SN + 1e-12);
    }
  });

  it('borne la difficulté hors de [0, 1] au lieu d’extrapoler', () => {
    expectTriplet(interpolateAnchors(-5), ANCHOR_BEST_REROLL);
    expectTriplet(interpolateAnchors(42), ANCHOR_WORST_REROLL);
  });
});

describe('modèle branché', () => {
  it("une ligne vide sur objet propre de niveau 0 retombe sur l'ancre 1 (cas le plus facile)", () => {
    expectTriplet(computeOutcomeProbabilities(input(), getProbabilityParams(), 'devblog_1_27'), ANCHOR_BEST_REROLL);
  });

  it('une ligne au jet parfait est plus difficile quand la qualité globale monte', () => {
    const p = getProbabilityParams();
    const atMax = input({ line: { value: 50, baseMin: 0, baseMax: 50, isExo: false }, runeValue: 0 });
    const simple = computeOutcomeProbabilities(atMax, p, 'devblog_1_27');
    const complex = computeOutcomeProbabilities({ ...atMax, itemQuality: 1, itemLevel: 200 }, p, 'devblog_1_27');
    expect(complex.pSC).toBeLessThan(simple.pSC);
    // objet parfait, haut niveau, ligne au parfait : l'ancre 3, le minimum du DevBlog
    expectTriplet(complex, ANCHOR_WORST_REROLL);
  });
});

describe('garde-fous de présentation', () => {
  it("n'est JAMAIS le modèle par défaut du fichier", () => {
    expect(getProbabilityParams().model).not.toBe('devblog_1_27');
  });

  it('porte sa version dans son nom et dans son libellé', () => {
    expect(devblog127Model.name).toBe('devblog_1_27');
    expect(PROBABILITY_MODEL_LABELS.devblog_1_27).toMatch(/1\.27/);
    expect(PROBABILITY_MODEL_LABELS.devblog_1_27).toMatch(/2010/);
  });
});
