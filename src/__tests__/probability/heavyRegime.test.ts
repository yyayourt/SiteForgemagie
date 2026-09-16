/**
 * RÉGIME 1 % PAR POIDS CUMULÉ (2026-09-16) — règle `cumulative_weight`, heavyRegime.ts.
 *
 * Ce que la règle fige (HYPOTHÈSE COMMUNAUTAIRE : Fashionista + témoignage Yanis) :
 *   « le premier % Do passe comme une rune exo facile, bien au-delà de 1 % ; à partir du
 *     deuxième on passe à 30 de puits donc 1 % ».
 * Réfutation prévue : des SN observés au 2ᵉ point d'un % Do.
 */
import { describe, it, expect } from 'vitest';
import {
  estimateOutcome,
  isHeavyExo,
  isHeavyRegime,
  nonNaturalLineWeightAfter,
  ANCHOR_BEST_CREATION,
  ANCHOR_WORST_CREATION,
  type ProbabilityInput,
} from '../../logic/probability';
import { simulateRuneAttempts } from '../../logic/probability/monteCarlo';
import { createSeededRng } from '../../logic/probability';
import { getProbabilityParams, type ProbabilityParams } from '../../data/params';
import { CHAR, line, makeState, testParams } from '../engine/helpers';

const DO_DISTANCE = 120; // % Dommages distance, densité 15
const params = (over: Partial<ProbabilityParams> = {}): ProbabilityParams => ({ ...getProbabilityParams(), ...over });

describe('nonNaturalLineWeightAfter', () => {
  it('exo : valeur totale après la rune × densité', () => {
    expect(nonNaturalLineWeightAfter({ value: 0, baseMax: 0, isExo: true }, 1, 15)).toBe(15);
    expect(nonNaturalLineWeightAfter({ value: 1, baseMax: 0, isExo: true }, 1, 15)).toBe(30);
  });
  it('ligne naturelle : seule la part au-delà du jet max compte (« past the item’s own roll »)', () => {
    expect(nonNaturalLineWeightAfter({ value: 40, baseMax: 50, isExo: false }, 5, 1)).toBe(0);
    expect(nonNaturalLineWeightAfter({ value: 48, baseMax: 50, isExo: false }, 5, 1)).toBe(3);
  });
});

describe('règle cumulative_weight (défaut du fichier)', () => {
  it('le défaut du fichier est cumulative_weight, seuil 30, overmax exclu', () => {
    const p = params();
    expect(p.heavyExoRule).toBe('cumulative_weight');
    expect(p.heavyExoWeightThreshold).toBe(30);
    expect(p.heavyExoIncludeOvermax).toBe(false);
  });

  it('% Do distance : 1ᵉʳ point (15) = exo léger, 2ᵉ point (30) = régime 1 %, 3ᵉ aussi', () => {
    const p = params();
    const q = (value: number) => ({
      characteristicId: DO_DISTANCE,
      isExo: true,
      nonNaturalWeightAfter: nonNaturalLineWeightAfter({ value, baseMax: 0, isExo: true }, 1, 15),
    });
    expect(isHeavyRegime(q(0), p)).toBe(false);
    expect(isHeavyRegime(q(1), p)).toBe(true);
    expect(isHeavyRegime(q(2), p)).toBe(true);
    // la liste, elle, ne connaît pas cette caractéristique
    expect(isHeavyExo(DO_DISTANCE, true, p)).toBe(false);
  });

  it('la liste reste un garde-fou : PA/PM/PO/Invocations sont lourds même avec un poids renseigné à 0', () => {
    const p = params();
    for (const id of [CHAR.PA, CHAR.PM, CHAR.PO, CHAR.INVOCATIONS]) {
      expect(isHeavyRegime({ characteristicId: id, isExo: true, nonNaturalWeightAfter: 0 }, p)).toBe(true);
    }
  });

  it('overmax : exclu par défaut, inclus avec heavyExoIncludeOvermax', () => {
    const q = { characteristicId: CHAR.VITALITE, isExo: false, nonNaturalWeightAfter: 30 };
    expect(isHeavyRegime(q, params())).toBe(false);
    expect(isHeavyRegime(q, params({ heavyExoIncludeOvermax: true }))).toBe(true);
    // et jamais sous le seuil
    expect(isHeavyRegime({ ...q, nonNaturalWeightAfter: 29.9 }, params({ heavyExoIncludeOvermax: true }))).toBe(false);
  });

  it('le seuil est paramétrable et inclut l’égalité (« 30 weight or more »)', () => {
    const q = { characteristicId: DO_DISTANCE, isExo: true, nonNaturalWeightAfter: 30 };
    expect(isHeavyRegime(q, params({ heavyExoWeightThreshold: 30 }))).toBe(true);
    expect(isHeavyRegime(q, params({ heavyExoWeightThreshold: 31 }))).toBe(false);
  });
});

describe('règle characteristic_list (ancienne, sélectionnable)', () => {
  it('ignore le poids : un % Do distance reste léger à tous ses points', () => {
    const p = params({ heavyExoRule: 'characteristic_list' });
    expect(isHeavyRegime({ characteristicId: DO_DISTANCE, isExo: true, nonNaturalWeightAfter: 45 }, p)).toBe(false);
    expect(isHeavyRegime({ characteristicId: CHAR.PA, isExo: true, nonNaturalWeightAfter: 0 }, p)).toBe(true);
  });
});

describe('de bout en bout : estimation et Monte Carlo sur % Do distance', () => {
  const engine = testParams();
  const rune = { characteristicId: DO_DISTANCE, value: 1 };
  const input = (isHeavyExo: boolean, value: number): ProbabilityInput => ({
    itemLevel: 200,
    line: { value, baseMin: 0, baseMax: 0, isExo: true },
    runeWeight: 15,
    runeValue: 1,
    isHeavyExo,
    residualPool: 0,
    weightBudget: 0,
  });

  it('1ᵉʳ point : intervalle INCONNU tiré sur la borne haute (32/50/18)', () => {
    const e = estimateOutcome(input(false, 0), params());
    expect(e.kind).toBe('interval');
    expect(e.sampling).toEqual(ANCHOR_BEST_CREATION);
  });

  it('2ᵉ point : point POLITIQUE 1/0/99', () => {
    const e = estimateOutcome(input(true, 1), params());
    expect(e.kind).toBe('point');
    expect(e.status).toBe('POLITIQUE');
    expect(e.sampling).toEqual(ANCHOR_WORST_CREATION);
  });

  it('Monte Carlo : la ligne absente est tirée à 32/50/18, la ligne à +1 est tirée à 1/0/99', () => {
    // le dataset porte bien la densité 15 pour cette caractéristique
    expect(engine.densities.get(DO_DISTANCE)).toBe(15);
    const empty = makeState([line({ characteristicId: CHAR.VITALITE, value: 300, baseMin: 200, baseMax: 300 })]);
    const first = simulateRuneAttempts(empty, rune, engine, params(), createSeededRng(1), { runs: 200 });
    expect(first.probabilities).toEqual(ANCHOR_BEST_CREATION);

    const withOne = makeState([
      line({ characteristicId: CHAR.VITALITE, value: 300, baseMin: 200, baseMax: 300 }),
      line({ characteristicId: DO_DISTANCE, value: 1, baseMin: 0, baseMax: 0, isExo: true }),
    ]);
    const second = simulateRuneAttempts(withOne, rune, engine, params(), createSeededRng(1), { runs: 200 });
    expect(second.probabilities).toEqual(ANCHOR_WORST_CREATION);
  });
});
