/**
 * Objets vus en jeu et lectures d'infobulle : les validateurs reflètent
 * data/observations/item-snapshot.schema.json et data/observations/tooltips/schema.json.
 */
import { describe, it, expect } from 'vitest';
import { validateItemSnapshot, validateItemSnapshots, type ItemSnapshot } from '../logic/observations/validateSnapshot';
import { validateTooltipReading, validateTooltipReadings, densityPerPointOf, type TooltipReading } from '../logic/observations/validateTooltip';
import snapshotSchema from '../../data/observations/item-snapshot.schema.json';
import tooltipSchema from '../../data/observations/tooltips/schema.json';
import tooltips from '../../data/observations/tooltips/tooltips.json';

const snapshot = (): ItemSnapshot => ({
  schemaVersion: 1,
  gameVersion: '3.6.10.11',
  itemId: 6924,
  itemName: 'Amulette du Strigide',
  lines: [
    { characteristicId: 11, value: 405, isExo: false, isOver: true, baseMax: 400 },
    { characteristicId: 1, value: 1, isExo: true, isOver: false },
    { characteristicId: 12, value: 40, isExo: false, isOver: false, baseMax: 40 },
  ],
  source: 'HDV Draconiros, capture hdv-strigide.png, pseudo Test',
  date: '2026-09-08T10:00:00Z',
});

const reading = (): TooltipReading => ({
  schemaVersion: 1,
  runeId: 1523,
  densityRead: 3,
  gameVersion: '3.6.10.11',
  capture: 'tooltips/rune-pa-vi-3.6.10.11.png',
});

describe('item snapshot', () => {
  it('accepts a complete snapshot (the refutation case: exo PA + over 5 vita elsewhere)', () => {
    expect(validateItemSnapshot(snapshot())).toEqual({ valid: true, errors: [] });
  });

  it('requires isExo and isOver on every line, and refuses both true together', () => {
    const s = snapshot();
    (s.lines[0] as Partial<typeof s.lines[0]>).isOver = undefined;
    expect(validateItemSnapshot(s).errors).toContain('lines[0].isOver : booléen attendu');
    const both = snapshot();
    both.lines[1] = { ...both.lines[1], isOver: true };
    expect(validateItemSnapshot(both).errors.some((e) => e.includes('exotique'))).toBe(true);
  });

  it('checks isOver against baseMax when given', () => {
    const s = snapshot();
    s.lines[0] = { ...s.lines[0], value: 400 };
    expect(validateItemSnapshot(s).errors).toContain('lines[0] : isOver vrai mais value ≤ baseMax');
  });

  it('rejects missing source, bad version, unknown fields', () => {
    const errors = validateItemSnapshot({ ...snapshot(), source: ' ', gameVersion: 'unity', extra: 1 }).errors;
    expect(errors).toContain('source : chaîne non vide attendue');
    expect(errors).toContain('gameVersion : chaîne "x.y[.z[.w]]" attendue');
    expect(errors).toContain('extra : champ inconnu');
  });

  it('validates a file and prefixes errors by index', () => {
    expect(validateItemSnapshots([snapshot()]).valid).toBe(true);
    expect(validateItemSnapshots([snapshot(), { itemId: 0 }]).errors.every((e) => e.startsWith('[1] '))).toBe(true);
    expect(validateItemSnapshots({}).valid).toBe(false);
  });

  it('mirrors the JSON schema: required keys and line keys', () => {
    expect(snapshotSchema.required).toEqual(['schemaVersion', 'gameVersion', 'itemId', 'lines', 'source', 'date']);
    expect(snapshotSchema.definitions.line.required).toEqual(['characteristicId', 'value', 'isExo', 'isOver']);
  });
});

describe('tooltip readings', () => {
  it('accepts a complete reading and derives the per-point density', () => {
    expect(validateTooltipReading(reading())).toEqual({ valid: true, errors: [] });
    expect(densityPerPointOf(reading(), 15)).toBeCloseTo(0.2, 9);
    expect(densityPerPointOf({ ...reading(), densityPerPoint: 0.25 }, 10)).toBe(0.25);
  });

  it('requires the capture, a positive density and a game version', () => {
    const errors = validateTooltipReading({ ...reading(), capture: '', densityRead: 0, gameVersion: '3' }).errors;
    expect(errors.some((e) => e.startsWith('capture'))).toBe(true);
    expect(errors).toContain('densityRead : nombre > 0 attendu');
    expect(errors).toContain('gameVersion : chaîne "x.y[.z[.w]]" attendue');
  });

  it('the shipped tooltips.json is a valid (empty) file, and the schema requires the capture', () => {
    expect(validateTooltipReadings(tooltips).valid).toBe(true);
    expect(tooltipSchema.required).toContain('capture');
    expect(validateTooltipReadings([reading(), { runeId: 'x' }]).errors[0].startsWith('[1] ')).toBe(true);
  });
});
