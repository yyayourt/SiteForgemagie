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
import observations from '../../data/observations/observations.json';
import snapshots from '../../data/observations/item-snapshots.json';
import { validateObservations } from '../logic/observations/validate';
import { getRuneTiers } from '../data/dataset';

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

  it('the shipped item-snapshots.json (Cape du Wa Wabbit, 2026-09-09) is valid and shows a classic over', () => {
    expect(validateItemSnapshots(snapshots)).toEqual({ valid: true, errors: [] });
    const vita = snapshots[0].lines.find((l) => l.characteristicId === 11)!;
    expect(vita.isOver).toBe(true);
    expect(vita.value - vita.baseMax!).toBe(133);
    expect(snapshots[0].transcended).toBe(false);
  });

  it('mirrors the JSON schema: required keys and line keys', () => {
    expect(snapshotSchema.required).toEqual(['schemaVersion', 'gameVersion', 'itemId', 'lines', 'source', 'date']);
    expect(snapshotSchema.definitions.line.required).toEqual(['characteristicId', 'value', 'isExo', 'isOver']);
  });
});

function getRuneTiersIndex() {
  const ids = [27, 28, 82, 83, 69, 70, 121, 124];
  return Object.fromEntries(ids.map((id) => [id, getRuneTiers(id)!]));
}

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

  it('the shipped observations.json (Cape Bouffante, 2026-09-08) is valid, deduced-before flagged, residual arithmetic consistent', () => {
    expect(validateObservations(observations)).toEqual({ valid: true, errors: [] });
    const o = observations[0];
    expect(o.lineStateBeforeDeduced).toBe(true);
    // 11 initiative × 0,1 − rune Vi (1) = 0,1 = reliquat affiché
    const iniBefore = o.lineStateBefore.find((l) => l.characteristicId === 44)!.value;
    const iniAfter = o.lineStateAfter.find((l) => l.characteristicId === 44)!.value;
    expect((iniBefore - iniAfter) * 0.1 - 1).toBeCloseTo(o.residualAfter!, 9);
  });

  it('the shipped tooltips.json (readings of 2026-09-08) is valid and matches the densities file', () => {
    expect(validateTooltipReadings(tooltips).valid).toBe(true);
    expect(tooltips.length).toBe(8);
    for (const t of tooltips) {
      const entry = Object.values(getRuneTiersIndex()).find((e) => e.normal?.runeId === t.runeId);
      expect(entry, `rune ${t.runeId} absente des paliers`).toBeDefined();
    }
    expect(tooltipSchema.required).toContain('capture');
    expect(validateTooltipReadings([reading(), { runeId: 'x' }]).errors[0].startsWith('[1] ')).toBe(true);
  });
});
