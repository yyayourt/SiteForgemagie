/**
 * Coût de session : le total n'additionne que les lignes dont le prix est renseigné,
 * et le compteur suit l'historique (undo rend la rune, refus ne consomme rien).
 */
import { describe, it, expect } from 'vitest';
import { addConsumption, computeSessionCost, formatKamas } from '../../state/sessionCost';
import { atelierReducer, initialAtelierState } from '../../state/atelierReducer';
import type { AtelierState, ConsumableRef, ForgeEvent, SimLogEntry } from '../../types';

const paVi: ConsumableRef = { key: 'rune:1', kind: 'rune', label: 'Rune Pa Vi' };
const fo: ConsumableRef = { key: 'rune:2', kind: 'rune', label: 'Rune Fo' };
const orb: ConsumableRef = { key: 'orb', kind: 'orb', label: 'Orbe régénérant' };

describe('computeSessionCost', () => {
  it('sums only priced lines and flags the total as incomplete otherwise', () => {
    let consumed = addConsumption({}, paVi, 3);
    consumed = addConsumption(consumed, fo, 2);
    consumed = addConsumption(consumed, orb);
    const partial = computeSessionCost(consumed, { 'rune:1': 1500 });
    expect(partial.total).toBe(4500);
    expect(partial.totalCount).toBe(6);
    expect(partial.pricedLines).toBe(1);
    expect(partial.unpricedLines).toBe(2);
    expect(partial.complete).toBe(false);
    expect(partial.lines.find((l) => l.key === 'rune:2')?.subtotal).toBeNull();

    const full = computeSessionCost(consumed, { 'rune:1': 1500, 'rune:2': 200, orb: 50000 });
    expect(full.total).toBe(4500 + 400 + 50000);
    expect(full.complete).toBe(true);
  });

  it('ignores invalid prices (negative, NaN) as if absent, and is empty without consumption', () => {
    const consumed = addConsumption({}, paVi, 2);
    expect(computeSessionCost(consumed, { 'rune:1': -5 }).pricedLines).toBe(0);
    expect(computeSessionCost(consumed, { 'rune:1': Number.NaN }).pricedLines).toBe(0);
    const empty = computeSessionCost({}, { 'rune:1': 1500 });
    expect(empty.lines).toEqual([]);
    expect(empty.total).toBe(0);
    expect(empty.complete).toBe(false);
  });

  it('orders runes before transcendence, orbs and potions', () => {
    let consumed = addConsumption({}, orb);
    consumed = addConsumption(consumed, { key: 'rune:9', kind: 'transcendence', label: 'Rune Ta Fo' });
    consumed = addConsumption(consumed, fo);
    expect(computeSessionCost(consumed, {}).lines.map((l) => l.kind)).toEqual(['rune', 'transcendence', 'orb']);
  });

  it('formats kamas with a French thousands separator', () => {
    const narrowSpaces = new RegExp('[' + String.fromCharCode(8239, 160) + ']', 'g');
    expect(formatKamas(12500).replace(narrowSpaces, ' ')).toBe('12 500 K');
  });
});

describe('compteur de consommation dans le reducer', () => {
  const entry = (id: number, refused = false): SimLogEntry => ({
    id,
    kind: 'rune',
    actionLabel: 'Pa Vitalité +15',
    targetStatName: 'Vitalité',
    targetCharacteristicId: 11,
    runeValue: 15,
    runeWeight: 3,
    outcome: 'SN',
    drawnByModel: false,
    refusedReason: refused ? 'over_cap_exceeded' : undefined,
    losses: [],
    absorbedByResidual: 0,
    residualPoolBefore: 0,
    residualPoolAfter: 0,
  });
  const event = (id: number): ForgeEvent => ({ id, kind: 'rune', outcome: 'SN', refused: false, targetCharacteristicId: 11, lostCharacteristicIds: [], residualDelta: 0 });
  const withItem: AtelierState = { ...initialAtelierState, item: { id: 1, name: 'Objet', level: 200, typeId: 1, typeName: 'Amulette', imgUrl: '' } };
  const apply = (s: AtelierState, id: number, refused = false) =>
    atelierReducer(s, { type: 'APPLY_RESULT', snapshot: { stats: s.stats, residualPool: 0, itemLocked: false, consumed: s.consumed }, logEntry: entry(id, refused), event: event(id), consumable: paVi });

  it('counts accepted actions, not refused ones; undo gives the rune back; reset zeroes and stays undoable', () => {
    let s = apply(withItem, 1);
    s = apply(s, 2);
    expect(s.consumed['rune:1'].count).toBe(2);
    s = apply(s, 3, true);
    expect(s.consumed['rune:1'].count).toBe(2);
    s = atelierReducer(s, { type: 'UNDO' });
    s = atelierReducer(s, { type: 'UNDO' });
    expect(s.consumed['rune:1'].count).toBe(1);
    s = atelierReducer(s, { type: 'REDO' });
    expect(s.consumed['rune:1'].count).toBe(2);
    s = atelierReducer(s, { type: 'RESET_SESSION' });
    expect(s.consumed).toEqual({});
    s = atelierReducer(s, { type: 'UNDO' });
    expect(s.consumed['rune:1'].count).toBe(2);
  });

  it('starts from zero when a new item is placed on the anvil', () => {
    const s = apply(withItem, 1);
    const next = atelierReducer(s, { type: 'SET_ITEM', item: { ...withItem.item!, id: 2 }, stats: [] });
    expect(next.consumed).toEqual({});
  });
});
