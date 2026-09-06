/**
 * Vitrine : sauvegarde puis reprise restituent exactement l'état de l'atelier
 * (lignes, reliquat, verrou, consommation, journal), y compris après un aller-retour JSON.
 */
import { describe, it, expect } from 'vitest';
import { createShowcaseEntry, showcaseToAtelierState, duplicateShowcaseEntry, serializeShowcase, parseShowcase, SHOWCASE_FORMAT } from '../../state/showcase';
import { atelierReducer, initialAtelierState } from '../../state/atelierReducer';
import { computeSessionCost, addConsumption } from '../../state/sessionCost';
import type { AtelierState, SimLogEntry, SimulatedStat } from '../../types';

const stat = (p: Partial<SimulatedStat> & { characteristicId: number }): SimulatedStat => ({
  statName: `Stat ${p.characteristicId}`,
  baseMin: 0,
  baseMax: 0,
  currentValue: 0,
  weightPerPoint: 1,
  isExo: false,
  isForgemeable: true,
  isLocked: false,
  ...p,
});

const logEntry: SimLogEntry = {
  id: 1,
  kind: 'rune',
  actionLabel: 'Pa Vitalité +15',
  targetStatName: 'Vitalité',
  targetCharacteristicId: 11,
  runeValue: 15,
  runeWeight: 3,
  outcome: 'SN',
  drawnByModel: true,
  modelName: 'official_factors_linear',
  losses: [{ characteristicId: 10, pointsLost: 3, weightLost: 3, statName: 'Force' }],
  absorbedByResidual: 0.5,
  residualPoolBefore: 0.5,
  residualPoolAfter: 0,
};

const forged: AtelierState = {
  ...initialAtelierState,
  item: { id: 6924, name: 'Amulette du Strigide', level: 200, typeId: 1, typeName: 'Amulette', imgUrl: 'https://example.invalid/6924.png' },
  stats: [
    stat({ characteristicId: 11, statName: 'Vitalité', baseMin: 251, baseMax: 300, currentValue: 315, weightPerPoint: 0.2 }),
    stat({ characteristicId: 10, statName: 'Force', baseMin: 31, baseMax: 50, currentValue: 47 }),
    stat({ characteristicId: 1, statName: 'PA', baseMin: 0, baseMax: 0, currentValue: 1, weightPerPoint: 100, isExo: true }),
  ],
  residualPool: 2.4,
  itemLocked: false,
  consumed: addConsumption(addConsumption({}, { key: 'rune:1', kind: 'rune', label: 'Rune Pa Vi' }, 4), { key: 'rune:2', kind: 'rune', label: 'Rune Fo' }, 1),
  log: [logEntry],
  logCounter: 1,
  mode: 'adjust',
  selectedCharacteristicId: 10,
};

const source = { ...forged, item: forged.item! };

describe('vitrine — sauvegarde et reprise', () => {
  it('restores exactly lines, residual pool, lock, consumption and log through RESTORE', () => {
    const cost = computeSessionCost(forged.consumed, { 'rune:1': 1000 });
    const entry = createShowcaseEntry(source, cost, new Date('2026-09-06T10:00:00Z'), 'objet de test');
    const resumed = atelierReducer(initialAtelierState, { type: 'RESTORE', state: showcaseToAtelierState(entry) });

    expect(resumed.item).toEqual(forged.item);
    expect(resumed.stats).toEqual(forged.stats);
    expect(resumed.residualPool).toBe(2.4);
    expect(resumed.itemLocked).toBe(false);
    expect(resumed.consumed).toEqual(forged.consumed);
    expect(resumed.log).toEqual(forged.log);
    expect(resumed.logCounter).toBe(1);
    expect(resumed.history).toEqual([]);
    expect(resumed.selectedCharacteristicId).toBe(11);

    expect(entry.savedAt).toBe('2026-09-06T10:00:00.000Z');
    expect(entry.note).toBe('objet de test');
    expect(entry.cost).toEqual({ total: 4000, complete: false });
  });

  it('does not share arrays with the atelier (later edits leave the entry intact)', () => {
    const entry = createShowcaseEntry(source, computeSessionCost(forged.consumed, {}));
    const restored = showcaseToAtelierState(entry);
    restored.stats![0].currentValue = 1;
    restored.consumed!['rune:1'].count = 99;
    expect(entry.stats[0].currentValue).toBe(315);
    expect(entry.consumed['rune:1'].count).toBe(4);
  });

  it('keeps a transcended item locked on resume', () => {
    const locked = { ...source, itemLocked: true, stats: source.stats.map((s) => ({ ...s, isLocked: true })) };
    const entry = createShowcaseEntry(locked, computeSessionCost({}, {}));
    const resumed = atelierReducer(initialAtelierState, { type: 'RESTORE', state: showcaseToAtelierState(entry) });
    expect(resumed.itemLocked).toBe(true);
    expect(resumed.stats.every((s) => s.isLocked)).toBe(true);
    expect(resumed.selectedCharacteristicId).toBeNull();
    expect(entry.cost).toBeNull();
  });

  it('survives an export / import round trip byte for byte', () => {
    const entry = createShowcaseEntry(source, computeSessionCost(forged.consumed, { 'rune:1': 1000, 'rune:2': 250 }));
    const json = serializeShowcase([entry], new Date('2026-09-06T11:00:00Z'));
    const parsed = parseShowcase(json);
    expect(parsed.ok).toBe(true);
    expect(parsed.errors).toEqual([]);
    expect(parsed.entries).toEqual([entry]);
    expect(JSON.parse(json).format).toBe(SHOWCASE_FORMAT);
  });

  it('duplicates with a new id and date, same content', () => {
    const entry = createShowcaseEntry(source, computeSessionCost({}, {}), new Date('2026-09-06T10:00:00Z'));
    const copy = duplicateShowcaseEntry(entry, new Date('2026-09-07T10:00:00Z'));
    expect(copy.id).not.toBe(entry.id);
    expect(copy.savedAt).toBe('2026-09-07T10:00:00.000Z');
    expect(copy.stats).toEqual(entry.stats);
    expect(copy.consumed).toEqual(entry.consumed);
  });

  it('rejects foreign files and reports invalid entries while keeping the valid ones', () => {
    expect(parseShowcase('{').ok).toBe(false);
    expect(parseShowcase('{"format":"forge-profile","entries":[]}').ok).toBe(false);
    const entry = createShowcaseEntry(source, computeSessionCost({}, {}));
    const mixed = JSON.stringify({ format: SHOWCASE_FORMAT, version: 1, exportedAt: '', entries: [entry, { item: null }, { ...entry, id: entry.id }] });
    const r = parseShowcase(mixed);
    expect(r.ok).toBe(true);
    expect(r.entries).toHaveLength(2);
    expect(r.errors).toHaveLength(1);
    expect(new Set(r.entries.map((e) => e.id)).size).toBe(2);
  });
});
