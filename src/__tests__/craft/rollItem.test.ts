/**
 * Jet de craft (src/logic/craft) : borné, déterministe avec graine, indépendant du
 * reliquat et du verrou. La loi est un paramètre INCONNU (craft.rollDistribution).
 */
import { describe, it, expect } from 'vitest';
import { rollItem, computeRollQuality, getRollDistribution } from '../../logic/craft';
import { applyRegenerationOrb } from '../../logic/engine';
import { createSeededRng } from '../../logic/probability';
import { getCraftParams, type CraftParams } from '../../data/params';
import { CHAR, getLine, line, makeState, seqRng } from '../engine/helpers';

const uniform: CraftParams = { rollDistribution: 'uniform' };
const triangular: CraftParams = { rollDistribution: 'triangular' };

const sample = () =>
  makeState(
    [
      line({ characteristicId: CHAR.VITALITE, value: 300, baseMin: 251, baseMax: 300 }),
      line({ characteristicId: CHAR.FORCE, value: 50, baseMin: 31, baseMax: 50 }),
      line({ characteristicId: CHAR.PA, value: 1, baseMin: 1, baseMax: 1 }),
      line({ characteristicId: CHAR.SAGESSE, value: 12, baseMin: 0, baseMax: 0, isExo: true }),
    ],
    7.5
  );

describe('rollItem — bornes', () => {
  it('draws every natural line as an integer within [baseMin, baseMax], for many seeds and both laws', () => {
    for (const params of [uniform, triangular]) {
      for (let seed = 1; seed <= 300; seed++) {
        const r = rollItem(sample(), params, createSeededRng(seed));
        for (const l of r.lines) {
          if (l.isExo) continue;
          expect(Number.isInteger(l.value)).toBe(true);
          expect(l.value).toBeGreaterThanOrEqual(l.baseMin);
          expect(l.value).toBeLessThanOrEqual(l.baseMax);
        }
      }
    }
  });

  it('reaches both ends of the interval (u = 0 → min, u → 1 → max), never beyond', () => {
    const lo = rollItem(sample(), uniform, seqRng([0]));
    const hi = rollItem(sample(), uniform, seqRng([0.999999]));
    expect(getLine(lo, CHAR.VITALITE).value).toBe(251);
    expect(getLine(hi, CHAR.VITALITE).value).toBe(300);
    expect(getLine(lo, CHAR.FORCE).value).toBe(31);
    expect(getLine(hi, CHAR.FORCE).value).toBe(50);
  });

  it('gives a fixed line (min = max) its value without consuming randomness', () => {
    let calls = 0;
    const counting = { next: () => { calls++; return 0.5; } };
    const r = rollItem(makeState([line({ characteristicId: CHAR.PA, value: 1, baseMin: 1, baseMax: 1 })]), uniform, counting);
    expect(getLine(r, CHAR.PA).value).toBe(1);
    expect(calls).toBe(0);
  });

  it('accepts reversed bounds (baseMin > baseMax) and still stays inside the interval', () => {
    const r = rollItem(makeState([line({ characteristicId: CHAR.FORCE, value: 40, baseMin: 50, baseMax: 31 })]), uniform, seqRng([0.5]));
    expect(getLine(r, CHAR.FORCE).value).toBeGreaterThanOrEqual(31);
    expect(getLine(r, CHAR.FORCE).value).toBeLessThanOrEqual(50);
  });
});

describe('rollItem — déterminisme', () => {
  it('same seed → identical roll; different seed → different roll', () => {
    const a = rollItem(sample(), uniform, createSeededRng(42));
    const b = rollItem(sample(), uniform, createSeededRng(42));
    expect(a).toEqual(b);
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => rollItem(sample(), uniform, createSeededRng(s)));
    const distinct = new Set(seeds.map((s) => s.lines.map((l) => l.value).join(',')));
    expect(distinct.size).toBeGreaterThan(1);
  });

  it('dispatches on the configured law: uniform and triangular differ for the same RNG stream', () => {
    // uniform lit u1 = 0.95 → haut de l'intervalle ; triangular lit (u1 + u2) / 2 = 0.5 → milieu
    const u = rollItem(sample(), uniform, seqRng([0.95, 0.05]));
    const t = rollItem(sample(), triangular, seqRng([0.95, 0.05]));
    expect(getLine(u, CHAR.VITALITE).value).toBe(298);
    expect(getLine(t, CHAR.VITALITE).value).toBe(276);
  });

  it('rejects an unknown law instead of silently falling back', () => {
    expect(() => getRollDistribution('gaussian' as never)).toThrow();
  });
});

describe('rollItem — ce qui ne bouge pas', () => {
  it('leaves exo lines, locked lines, residual pool, lock flag and line order untouched, without mutating the input', () => {
    const input = makeState(
      [
        line({ characteristicId: CHAR.FORCE, value: 40, baseMin: 31, baseMax: 50 }),
        line({ characteristicId: CHAR.SAGESSE, value: 12, baseMin: 0, baseMax: 0, isExo: true }),
        line({ characteristicId: CHAR.VITALITE, value: 280, baseMin: 251, baseMax: 300, isLocked: true }),
      ],
      7.5
    );
    const frozen = JSON.parse(JSON.stringify(input));
    const r = rollItem(input, uniform, createSeededRng(9));
    expect(input).toEqual(frozen);
    expect(r).not.toBe(input);
    expect(r.residualPool).toBe(7.5);
    expect(r.itemLocked).toBe(false);
    expect(r.lines.map((l) => l.characteristicId)).toEqual([CHAR.FORCE, CHAR.SAGESSE, CHAR.VITALITE]);
    expect(getLine(r, CHAR.SAGESSE)).toEqual(getLine(input, CHAR.SAGESSE));
    expect(getLine(r, CHAR.VITALITE).value).toBe(280);
  });

  it('is what the regeneration orb uses: same seed → same natural roll, plus exo removal and residual purge', () => {
    const state = sample();
    const rolled = rollItem({ ...state, lines: state.lines.filter((l) => !l.isExo) }, getCraftParams(), createSeededRng(77));
    const orb = applyRegenerationOrb(state, createSeededRng(77), getCraftParams());
    expect(orb.accepted).toBe(true);
    expect(orb.state.lines).toEqual(rolled.lines);
    expect(orb.state.residualPool).toBe(0);
    expect(orb.state.lines.some((l) => l.isExo)).toBe(false);
  });

  it('the file default is uniform (INCONNU)', () => {
    expect(getCraftParams().rollDistribution).toBe('uniform');
  });
});

describe('computeRollQuality — position pondérée par densité', () => {
  const densities = new Map<number, number>([
    [CHAR.VITALITE, 0.2],
    [CHAR.FORCE, 1],
    [CHAR.PA, 100],
  ]);

  it('is 1 at the perfect roll, 0 at the minimum roll', () => {
    const max = sample().lines;
    expect(computeRollQuality(max, densities)?.position).toBe(1);
    const min = max.map((l) => (l.isExo ? l : { ...l, value: l.baseMin }));
    expect(computeRollQuality(min, densities)?.position).toBe(0);
  });

  it('weights each point of the interval by its density (Vitalité 49 pts × 0.2 = 9.8 ; Force 19 pts × 1 = 19)', () => {
    const lines = sample().lines.map((l) => (l.characteristicId === CHAR.VITALITE ? { ...l, value: l.baseMin } : l));
    const q = computeRollQuality(lines, densities)!;
    expect(q.weightMax).toBeCloseTo(9.8 + 19, 6);
    expect(q.weightAchieved).toBeCloseTo(19, 6);
    expect(q.position).toBeCloseTo(19 / 28.8, 6);
    expect(q.rolledLines).toBe(2);
  });

  it('clamps over lines to the interval, ignores exos and fixed lines, returns null when nothing is rollable', () => {
    const over = sample().lines.map((l) => (l.characteristicId === CHAR.FORCE ? { ...l, value: 90 } : l));
    expect(computeRollQuality(over, densities)?.position).toBe(1);
    const fixedOnly = [line({ characteristicId: CHAR.PA, value: 1, baseMin: 1, baseMax: 1 }), line({ characteristicId: CHAR.SAGESSE, value: 30, baseMin: 0, baseMax: 0, isExo: true })];
    expect(computeRollQuality(fixedOnly, densities)).toBeNull();
  });
});
