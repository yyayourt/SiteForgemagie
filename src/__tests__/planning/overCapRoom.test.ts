/**
 * Plafonds de ligne selon la portée de la borne (overCapScope) : en global, ce que les
 * autres lignes consomment déjà réduit la place d'une ligne ; en per_line, non.
 */
import { describe, it, expect } from 'vitest';
import { getLineOverRoom, getStatAbsoluteMaxInContext, getTotalOverExoWeight, type OverCapLine } from '../../data/statCaps';
import { getOverCapScope } from '../../data/params';
import { CHAR } from '../engine/helpers';

const l = (p: Partial<OverCapLine> & { characteristicId: number; currentValue: number }): OverCapLine => ({
  baseMax: p.currentValue,
  isExo: false,
  isForgemeable: true,
  ...p,
});

const global = { 'params.overCapScope': 'global', 'params.overCapWeight': 101 } as const;
const perLine = { 'params.overCapScope': 'per_line', 'params.overCapWeight': 101 } as const;

describe('borne d\'over/exo — portée', () => {
  it('the file default is global (HYPOTHÈSE COMMUNAUTAIRE, guide Huz)', () => {
    expect(getOverCapScope()).toBe('global');
  });

  it('measures the over part (value − max) and exos, never the whole line', () => {
    const lines = [l({ characteristicId: CHAR.VITALITE, currentValue: 213, baseMax: 200 }), l({ characteristicId: CHAR.PM, currentValue: 1, baseMax: 0, isExo: true })];
    expect(getTotalOverExoWeight(lines)).toBeCloseTo(13 * 0.2 + 90, 9);
  });

  it('global: a PM exo (90) leaves 11 of weight, so 55 points of over on Vitalité (règle 1 en laisserait 155)', () => {
    const vita = l({ characteristicId: CHAR.VITALITE, currentValue: 350, baseMax: 350 });
    const pm = l({ characteristicId: CHAR.PM, currentValue: 1, baseMax: 0, isExo: true });
    expect(getLineOverRoom(vita, [vita, pm], global)).toBe(55);
    expect(getStatAbsoluteMaxInContext(vita, [vita, pm], global)).toBe(405);
    // et réciproquement, l'over vita 370/350 (4) laisse 97 : un PA (100) n'entre pas, un PM (90) oui
    const over = { ...vita, currentValue: 370 };
    const pa = l({ characteristicId: CHAR.PA, currentValue: 0, baseMax: 0, isExo: true });
    expect(getLineOverRoom(pa, [over, pa], global)).toBe(0);
    expect(getLineOverRoom({ ...pm, currentValue: 0 }, [over, pm], global)).toBe(1);
  });

  it('per_line: other lines do not matter, but the line total is capped at 505 vita (base 350 → +155)', () => {
    const vita = l({ characteristicId: CHAR.VITALITE, currentValue: 350, baseMax: 350 });
    const pm = l({ characteristicId: CHAR.PM, currentValue: 1, baseMax: 0, isExo: true });
    expect(getLineOverRoom(vita, [vita, pm], perLine)).toBe(155);
    expect(getStatAbsoluteMaxInContext(vita, [vita, pm], perLine)).toBe(505);
  });

  it('total_value: the room depends on the base (400 → +105, 500 → +5, 520 → 0) ; over_part gives +505 regardless', () => {
    const at = (baseMax: number) => l({ characteristicId: CHAR.VITALITE, currentValue: baseMax, baseMax });
    expect(getLineOverRoom(at(400), [at(400)], global)).toBe(105);
    expect(getLineOverRoom(at(500), [at(500)], global)).toBe(5);
    expect(getLineOverRoom(at(520), [at(520)], global)).toBe(0);
    expect(getStatAbsoluteMaxInContext(at(520), [at(520)], global)).toBe(520);
    const overPart = { ...global, 'params.overCapLineBasis': 'over_part' } as const;
    expect(getLineOverRoom(at(400), [at(400)], overPart)).toBe(505);
  });

  it('never goes negative, ignores non-forgeable lines, undefined without density', () => {
    const pa = l({ characteristicId: CHAR.PA, currentValue: 1, baseMax: 0, isExo: true });
    const pm = l({ characteristicId: CHAR.PM, currentValue: 0, baseMax: 0, isExo: true });
    expect(getLineOverRoom(pm, [pa, pm], global)).toBe(0);
    const inert = l({ characteristicId: CHAR.PM, currentValue: 1, baseMax: 0, isExo: true, isForgemeable: false });
    expect(getLineOverRoom({ ...pa, currentValue: 0 }, [pa, inert], global)).toBe(1);
    expect(getLineOverRoom(l({ characteristicId: 999999, currentValue: 5 }), [], global)).toBeUndefined();
  });
});
