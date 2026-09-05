/**
 * Journal d'observations : le validateur reflète data/observations/schema.json.
 */
import { describe, it, expect } from 'vitest';
import { validateObservation, validateObservations, type Observation } from '../logic/observations/validate';
import schema from '../../data/observations/schema.json';

const valid = (): Observation => ({
  schemaVersion: 1,
  gameVersion: '3.6.10.11',
  itemId: 14094,
  itemLevel: 200,
  lineStateBefore: [
    { characteristicId: 11, value: 380 },
    { characteristicId: 1, value: 1 },
    { characteristicId: 87, value: -18 },
  ],
  runeId: 1523,
  outcome: 'SN',
  lineStateAfter: [
    { characteristicId: 11, value: 385 },
    { characteristicId: 1, value: 1 },
    { characteristicId: 87, value: -18 },
  ],
  residualVisible: false,
  source: 'capture vidéo, pseudo Test, serveur Draconiros',
  date: '2026-09-05T12:00:00Z',
});

describe('validateObservation', () => {
  it('accepts a complete observation', () => {
    expect(validateObservation(valid())).toEqual({ valid: true, errors: [] });
  });

  it('accepts optional fields when well typed', () => {
    const o: Observation = { ...valid(), residualVisible: true, residualBefore: 2.5, residualAfter: 0, server: 'Draconiros', notes: 'objet neuf' };
    expect(validateObservation(o).valid).toBe(true);
  });

  it('rejects missing required fields, one error each', () => {
    const { schemaVersion: _s, source: _src, ...rest } = valid();
    void _s;
    void _src;
    const r = validateObservation(rest);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.startsWith('schemaVersion'))).toBe(true);
    expect(r.errors.some((e) => e.startsWith('source'))).toBe(true);
  });

  it('rejects unknown fields, bad outcome, bad version, bad date, empty lines', () => {
    const r = validateObservation({ ...valid(), extra: 1, outcome: 'OK', gameVersion: 'unity', date: 'hier', lineStateBefore: [] });
    expect(r.errors).toEqual(
      expect.arrayContaining([
        'extra : champ inconnu',
        'outcome : SC, SN ou EC attendu',
        'gameVersion : chaîne "x.y[.z[.w]]" attendue',
        'date : date-time ISO 8601 attendu',
        'lineStateBefore : tableau non vide attendu',
      ])
    );
  });

  it('rejects residual values when residualVisible is false', () => {
    const r = validateObservation({ ...valid(), residualVisible: false, residualAfter: 3 });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('residualVisible est faux'))).toBe(true);
  });

  it('rejects malformed lines', () => {
    const r = validateObservation({ ...valid(), lineStateAfter: [{ characteristicId: 0, value: 1.5, foo: 1 }] });
    expect(r.errors).toEqual(
      expect.arrayContaining([
        'lineStateAfter[0].foo : champ inconnu',
        'lineStateAfter[0].characteristicId : entier ≥ 1 attendu',
        'lineStateAfter[0].value : entier attendu',
      ])
    );
  });

  it('rejects non-objects', () => {
    expect(validateObservation(null).valid).toBe(false);
    expect(validateObservation([]).valid).toBe(false);
  });
});

describe('validateObservations (fichier)', () => {
  it('validates an array and prefixes errors by index', () => {
    expect(validateObservations([valid(), valid()]).valid).toBe(true);
    const r = validateObservations([valid(), { ...valid(), outcome: 'X' }]);
    expect(r.valid).toBe(false);
    expect(r.errors[0].startsWith('[1] ')).toBe(true);
    expect(validateObservations({}).valid).toBe(false);
  });
});

describe('cohérence avec data/observations/schema.json', () => {
  it('required fields of the schema are exactly those enforced by the validator', () => {
    const required = schema.required as string[];
    const { schemaVersion: _s, ...rest } = valid();
    void _s;
    for (const field of required) {
      const copy: Record<string, unknown> = { ...rest, schemaVersion: 1 };
      delete copy[field];
      const r = validateObservation(copy);
      expect(r.valid, `champ requis ${field}`).toBe(false);
      expect(r.errors.some((e) => e.startsWith(field)), `erreur pour ${field}`).toBe(true);
    }
  });

  it('every schema property is accepted by the validator', () => {
    const props = Object.keys(schema.properties);
    const full: Record<string, unknown> = { ...valid(), residualVisible: true, residualBefore: 1, residualAfter: 1, server: 's', notes: 'n' };
    for (const p of props) expect(p in full, `propriété ${p} couverte`).toBe(true);
    expect(validateObservation(full).valid).toBe(true);
  });
});
