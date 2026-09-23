/**
 * RÉPARTITION SN/EC — `snSplit = capped_50` (défaut depuis le 2026-09-23).
 *
 * pSN = min(0,50 ; 1 − pSC) : une seule règle, et les quatre ancres « normales » du DevBlog
 * 1.27 tombent EXACTEMENT, ainsi que la variante relayée 34/50/16 et le témoignage Alterya
 * 30/50/20. Voir docs/knowledge/2026-09-23-analyse-simulateur.md §1.
 */
import { describe, it, expect } from 'vitest';
import {
  splitNormal,
  computeOutcomeProbabilities,
  ANCHOR_BEST_REROLL,
  ANCHOR_PERFECT_ROLL,
  ANCHOR_WORST_REROLL,
  ANCHOR_BEST_CREATION,
  type ProbabilityInput,
} from '../../logic/probability';
import { getProbabilityParams, type ProbabilityParams } from '../../data/params';

const params = (over: Partial<ProbabilityParams> = {}): ProbabilityParams => ({ ...getProbabilityParams(), ...over });

describe('splitNormal — capped_50', () => {
  it('le défaut du fichier est capped_50', () => {
    expect(params().snSplit).toBe('capped_50');
  });

  it.each([
    ['ancre 1', ANCHOR_BEST_REROLL],
    ['ancre 2', ANCHOR_PERFECT_ROLL],
    ['ancre 3', ANCHOR_WORST_REROLL],
    ['ancre 4', ANCHOR_BEST_CREATION],
  ])('%s du DevBlog reproduite à partir de son seul pSC', (_, anchor) => {
    const r = splitNormal(anchor.pSC, params());
    expect(r.pSN).toBeCloseTo(anchor.pSN, 12);
    expect(r.pEC).toBeCloseTo(anchor.pEC, 12);
  });

  it.each([
    [0.34, 0.5, 0.16], // variante relayée Yin-Yang
    [0.3, 0.5, 0.2], // témoignage Alterya, remontée d'un PA naturel
  ])('pSC %s → %s / %s', (sc, sn, ec) => {
    const r = splitNormal(sc, params());
    expect(r.pSN).toBeCloseTo(sn, 12);
    expect(r.pEC).toBeCloseTo(ec, 12);
  });

  it('SN jamais au-dessus de 50 %, somme toujours 1', () => {
    for (let sc = 0; sc <= 1.0001; sc += 0.05) {
      const r = splitNormal(sc, params());
      expect(r.pSN).toBeLessThanOrEqual(0.5 + 1e-12);
      expect(r.pSC + r.pSN + r.pEC).toBeCloseTo(1, 12);
    }
  });

  it('ec_share reste disponible : part fixe du complément', () => {
    const r = splitNormal(0.4, params({ snSplit: 'ec_share', ecShare: 0.5 }));
    expect(r.pSN).toBeCloseTo(0.3, 12);
    expect(r.pEC).toBeCloseTo(0.3, 12);
  });
});

describe('official_factors_linear avec capped_50', () => {
  const input = (value: number): ProbabilityInput => ({
    itemLevel: 100,
    line: { value, baseMin: 0, baseMax: 50, isExo: false },
    runeWeight: 1,
    runeValue: 1,
    isHeavyExo: false,
    residualPool: 0,
    weightBudget: 0,
  });

  it("rune facile sur ligne vide : plus d'EC fantôme (65 / 35 / 0 au lieu de 65 / 17,5 / 17,5)", () => {
    const r = computeOutcomeProbabilities(input(0), params());
    expect(r.pSC).toBeCloseTo(0.65, 9);
    expect(r.pSN).toBeCloseTo(0.35, 9);
    expect(r.pEC).toBeCloseTo(0, 9);
  });

  it('ligne presque au jet parfait : 15,5 / 50 / 34,5, proche de l’ancre 3', () => {
    const r = computeOutcomeProbabilities(input(49), params());
    expect(r.pSN).toBeCloseTo(0.5, 9);
    expect(r.pEC).toBeCloseTo(1 - 0.5 - r.pSC, 9);
  });
});
