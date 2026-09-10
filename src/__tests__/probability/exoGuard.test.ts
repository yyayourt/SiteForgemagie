/**
 * GARDE-FOU D'EXOTISME (P2, 2026-09-10) — test de non-régression.
 *
 * Le défaut corrigé : `distanceToMax` renvoyait 0 pour une ligne exotique, donc le modèle
 * sortait `a` = 0,15 et un exo PA sur objet propre s'affichait à **15 / 0 / 85**. Le tutoriel
 * officiel Ankama (SOURCE PRIMAIRE — Unity) donne 1 %. Le simulateur était quinze fois trop
 * optimiste sur l'opération la plus coûteuse du jeu.
 *
 * L'invariant testé ici n'est pas « le modèle est bien réglé » : c'est « aucun réglage ne
 * peut rendre un exo lourd optimiste ». D'où les paramètres adverses.
 */
import { describe, it, expect } from 'vitest';
import {
  computeOutcomeProbabilities,
  estimateOutcome,
  MIN_SC_HEAVY_EXO,
  ANCHOR_BEST_CREATION,
  ANCHOR_WORST_CREATION,
  PROBABILITY_MODEL_NAMES,
  type ProbabilityInput,
} from '../../logic/probability';
import { getProbabilityParams, type ProbabilityParams } from '../../data/params';

const params = (over: Partial<ProbabilityParams> = {}): ProbabilityParams => ({ ...getProbabilityParams(), ...over });

/** Paramètres délibérément optimistes : si le garde-fou tient ici, il tient partout. */
const adversarial = (): ProbabilityParams => {
  const p = getProbabilityParams();
  return { ...p, officialFactorsLinear: { ...p.officialFactorsLinear, a: 1, b: 1, c: 0, d: 0, e: 0 } };
};

const input = (partial: Partial<ProbabilityInput> = {}): ProbabilityInput => ({
  itemLevel: 200,
  line: { value: 0, baseMin: 0, baseMax: 0, isExo: true },
  runeWeight: 100,
  runeValue: 1,
  isHeavyExo: true,
  residualPool: 0,
  weightBudget: 0,
  ...partial,
});

describe('exo lourd (PA/PM/PO) : plafonné à 1 %', () => {
  it("un exo PA sur objet propre ne sort JAMAIS au-dessus de 1 % de SC — l'invariant de P2", () => {
    expect(computeOutcomeProbabilities(input(), params()).pSC).toBeLessThanOrEqual(MIN_SC_HEAVY_EXO + 1e-12);
  });

  it('… quel que soit le modèle actif', () => {
    for (const name of PROBABILITY_MODEL_NAMES) {
      const r = computeOutcomeProbabilities(input(), params(), name);
      expect(r.pSC, `modèle ${name}`).toBeLessThanOrEqual(MIN_SC_HEAVY_EXO + 1e-12);
    }
  });

  it('… et quels que soient les paramètres, même délibérément optimistes', () => {
    for (const name of PROBABILITY_MODEL_NAMES) {
      const r = computeOutcomeProbabilities(input(), adversarial(), name);
      expect(r.pSC, `modèle ${name}`).toBeLessThanOrEqual(MIN_SC_HEAVY_EXO + 1e-12);
    }
  });

  it('le SC est épinglé à 1 % : plancher officiel et plafond du garde-fou coïncident', () => {
    expect(computeOutcomeProbabilities(input(), params()).pSC).toBeCloseTo(MIN_SC_HEAVY_EXO, 12);
  });

  it("reproduit l'ancre 5 (1/0/99) avec heavyExoEcShare = 1, valeur du fichier", () => {
    const r = computeOutcomeProbabilities(input(), params());
    expect(r).toEqual(ANCHOR_WORST_CREATION);
  });

  it('le partage du complément reste paramétrable (heavyExoEcShare est une HYPOTHÈSE, pas le 1 %)', () => {
    const r = computeOutcomeProbabilities(input(), params({ heavyExoEcShare: 0.5 }));
    expect(r.pSC).toBeCloseTo(MIN_SC_HEAVY_EXO, 12);
    expect(r.pSN).toBeCloseTo(0.495, 12);
    expect(r.pEC).toBeCloseTo(0.495, 12);
  });

  it("l'estimation est un POINT marqué POLITIQUE : la source garantit un plancher, pas une valeur", () => {
    const e = estimateOutcome(input(), params());
    expect(e.kind).toBe('point');
    // Le tutoriel dit « peut descendre jusqu'à 1 % » : 1 % est ATTEIGNABLE. En faire la
    // valeur est la politique `worst`, pas une lecture de la source.
    expect(e.status).toBe('POLITIQUE');
    expect(e.attemptKind).toBe('heavy_exo');
  });
});

describe('exo non lourd : un INTERVALLE, jamais un point', () => {
  const lightExo = () => input({ isHeavyExo: false, runeWeight: 5 });

  it("l'estimation est un intervalle marqué INCONNU, borné par les ancres 4 et 5", () => {
    const e = estimateOutcome(lightExo(), params());
    expect(e.kind).toBe('interval');
    expect(e.status).toBe('INCONNU');
    if (e.kind !== 'interval') throw new Error('unreachable');
    expect(e.best).toEqual(ANCHOR_BEST_CREATION); // 32/50/18
    expect(e.worst).toEqual(ANCHOR_WORST_CREATION); // 1/0/99
  });

  it('aucun continuum entre 32 % et 1 % : les bornes ne dépendent ni du modèle ni des paramètres', () => {
    for (const name of PROBABILITY_MODEL_NAMES) {
      const e = estimateOutcome(lightExo(), adversarial(), name);
      if (e.kind !== 'interval') throw new Error(`modèle ${name} : intervalle attendu`);
      expect(e.best).toEqual(ANCHOR_BEST_CREATION);
      expect(e.worst).toEqual(ANCHOR_WORST_CREATION);
    }
  });

  it('le tirage utilise la borne BASSE : un intervalle ne doit pas réintroduire un optimisme', () => {
    expect(computeOutcomeProbabilities(lightExo(), params())).toEqual(ANCHOR_WORST_CREATION);
  });

  it("le SN existe en création d'effet : la borne haute n'est pas à 0 (ancre 4 inédite)", () => {
    const e = estimateOutcome(lightExo(), params());
    if (e.kind !== 'interval') throw new Error('unreachable');
    expect(e.best.pSN).toBeCloseTo(0.5, 12);
  });
});

describe("le reste n'est pas touché par le garde-fou", () => {
  const natural = (v: number) =>
    input({ line: { value: v, baseMin: 0, baseMax: 50, isExo: false }, isHeavyExo: false, runeValue: 1, runeWeight: 1 });

  it('une ligne naturelle reste une estimation de MODÈLE', () => {
    const e = estimateOutcome(natural(25), params());
    expect(e.kind).toBe('point');
    expect(e.status).toBe('MODÈLE');
    expect(e.attemptKind).toBe('normal');
  });

  it('un overmax reste une estimation de MODÈLE, sans plancher officiel', () => {
    const e = estimateOutcome(natural(50), params());
    expect(e.attemptKind).toBe('over');
    expect(e.status).toBe('MODÈLE');
  });
});
