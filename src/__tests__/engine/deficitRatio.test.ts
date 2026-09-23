/**
 * SÉLECTION DE LA LIGNE QUI PERD — stratégie `weighted_by_deficit_ratio` (défaut 2026-09-23).
 *
 * Contraintes du DevBlog 1.27 (qualitatif, SOURCE PRIMAIRE — v1.27) : comparaison au déficit
 * restant, seules les lignes TROP LOURDES épargnées, jamais impossible. Valeurs : INCONNU.
 */
import { describe, it, expect } from 'vitest';
import { applyLoss } from '../../logic/engine/losses';
import { deficitRatioWeight } from '../../logic/engine/lossSelection';
import { getEngineParams } from '../../data/params';
import { createSeededRng } from '../../logic/probability';
import { CHAR, line, makeState, testParams } from './helpers';

const shape = { heavyExponent: 1, lightExponent: 0.25, floor: 0.03 };

describe('quantum = poids de la plus petite rune', () => {
  const q = getEngineParams().runeQuantum;
  it('Vi = Ini = 1, Pod = 2,5, Fo = 1, PA = 100', () => {
    expect(q.get(CHAR.VITALITE)).toBeCloseTo(1, 9);
    expect(q.get(CHAR.INITIATIVE)).toBeCloseTo(1, 9);
    expect(q.get(CHAR.PODS)).toBeCloseTo(2.5, 9);
    expect(q.get(CHAR.FORCE)).toBeCloseTo(1, 9);
    expect(q.get(CHAR.PA)).toBeCloseTo(100, 9);
  });
});

describe('deficitRatioWeight', () => {
  it('le défaut du fichier est weighted_by_deficit_ratio', () => {
    expect(getEngineParams().lossSelection.strategy).toBe('weighted_by_deficit_ratio');
  });

  it('maximal (= 1) quand le quantum égale le déficit', () => {
    expect(deficitRatioWeight(3, 3, shape)).toBeCloseTo(1, 12);
  });

  it('asymétrique : trop lourd ×10 bien plus pénalisé que trop léger ×10', () => {
    const heavy = deficitRatioWeight(10, 1, shape);
    const light = deficitRatioWeight(1, 10, shape);
    expect(heavy).toBeLessThan(0.15);
    expect(light).toBeGreaterThan(0.5);
  });

  it('jamais nul : un PA reste possible pour une rune Ine (DevBlog)', () => {
    expect(deficitRatioWeight(100, 1, shape)).toBeGreaterThan(0.03);
    expect(deficitRatioWeight(1e9, 1, shape)).toBeGreaterThanOrEqual(0.03);
  });

  it('floor = 0 et pentes nulles : retombe sur l’uniforme côté léger', () => {
    expect(deficitRatioWeight(1, 10, { heavyExponent: 1, lightExponent: 0, floor: 0 })).toBeCloseTo(1, 12);
  });
});

describe('expérience C réduite : objet Vi + Fo + PA, puits 0, perte de poids 1', () => {
  const state = makeState([
    line({ characteristicId: CHAR.VITALITE, value: 200, baseMin: 150, baseMax: 200 }),
    line({ characteristicId: CHAR.FORCE, value: 50, baseMin: 40, baseMax: 50 }),
    line({ characteristicId: CHAR.PA, value: 1, baseMin: 1, baseMax: 1 }),
  ]);
  const hitRate = (strategy: 'weighted_by_deficit_ratio' | 'uniform') => {
    const p = testParams({ lossSelection: { strategy, prioritizeOverExo: false } });
    const rng = createSeededRng(42);
    let pa = 0;
    const runs = 20000;
    for (let i = 0; i < runs; i++) {
      if (applyLoss(state, 1, p, rng).losses.some((l) => l.characteristicId === CHAR.PA)) pa++;
    }
    return pa / runs;
  };

  it('PA touché ≈ 2 % (au lieu de 33 % en uniforme)', () => {
    const rate = hitRate('weighted_by_deficit_ratio');
    expect(rate).toBeGreaterThan(0.01);
    expect(rate).toBeLessThan(0.035);
    expect(hitRate('uniform')).toBeGreaterThan(0.3);
  });
});
