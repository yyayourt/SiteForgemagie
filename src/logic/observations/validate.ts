/**
 * Validateur du journal d'observations (data/observations/schema.json), sans dépendance.
 * Une observation valide est la seule matière première admissible pour faire passer un
 * paramètre du statut INCONNU / HYPOTHÈSE au statut MODÈLE EMPIRIQUE.
 */

import type { RuneOutcome } from '../../types/forgemagie';

export interface ObservationLine {
  characteristicId: number;
  value: number;
  isExo?: boolean;
}

export interface Observation {
  schemaVersion: 1;
  gameVersion: string;
  itemId: number;
  itemLevel: number;
  lineStateBefore: ObservationLine[];
  runeId: number;
  outcome: RuneOutcome;
  lineStateAfter: ObservationLine[];
  residualVisible: boolean;
  residualBefore?: number | null;
  residualAfter?: number | null;
  source: string;
  date: string;
  server?: string;
  notes?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const OUTCOMES: readonly string[] = ['SC', 'SN', 'EC'];
const ALLOWED_KEYS = new Set([
  'schemaVersion', 'gameVersion', 'itemId', 'itemLevel', 'lineStateBefore', 'runeId', 'outcome',
  'lineStateAfter', 'residualVisible', 'residualBefore', 'residualAfter', 'source', 'date', 'server', 'notes',
]);
const LINE_KEYS = new Set(['characteristicId', 'value', 'isExo']);
const GAME_VERSION = /^[0-9]+(\.[0-9]+){1,3}$/;

function isInt(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x);
}

function validateLines(value: unknown, field: string, errors: string[]): void {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${field} : tableau non vide attendu`);
    return;
  }
  value.forEach((line, i) => {
    const at = `${field}[${i}]`;
    if (typeof line !== 'object' || line === null) {
      errors.push(`${at} : objet attendu`);
      return;
    }
    const l = line as Record<string, unknown>;
    for (const k of Object.keys(l)) if (!LINE_KEYS.has(k)) errors.push(`${at}.${k} : champ inconnu`);
    if (!isInt(l.characteristicId) || l.characteristicId < 1) errors.push(`${at}.characteristicId : entier ≥ 1 attendu`);
    if (!isInt(l.value)) errors.push(`${at}.value : entier attendu`);
    if (l.isExo !== undefined && typeof l.isExo !== 'boolean') errors.push(`${at}.isExo : booléen attendu`);
  });
}

function validateResidual(value: unknown, field: string, errors: string[]): void {
  if (value === undefined || value === null) return;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) errors.push(`${field} : nombre ≥ 0 ou null attendu`);
}

export function validateObservation(input: unknown): ValidationResult {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { valid: false, errors: ['observation : objet attendu'] };
  }
  const o = input as Record<string, unknown>;

  for (const k of Object.keys(o)) if (!ALLOWED_KEYS.has(k)) errors.push(`${k} : champ inconnu`);

  if (o.schemaVersion !== 1) errors.push('schemaVersion : doit valoir 1');
  if (typeof o.gameVersion !== 'string' || !GAME_VERSION.test(o.gameVersion)) errors.push('gameVersion : chaîne "x.y[.z[.w]]" attendue');
  if (!isInt(o.itemId) || o.itemId < 1) errors.push('itemId : entier ≥ 1 attendu');
  if (!isInt(o.itemLevel) || o.itemLevel < 1 || o.itemLevel > 200) errors.push('itemLevel : entier entre 1 et 200 attendu');
  validateLines(o.lineStateBefore, 'lineStateBefore', errors);
  if (!isInt(o.runeId) || o.runeId < 1) errors.push('runeId : entier ≥ 1 attendu');
  if (typeof o.outcome !== 'string' || !OUTCOMES.includes(o.outcome)) errors.push('outcome : SC, SN ou EC attendu');
  validateLines(o.lineStateAfter, 'lineStateAfter', errors);
  if (typeof o.residualVisible !== 'boolean') errors.push('residualVisible : booléen attendu');
  validateResidual(o.residualBefore, 'residualBefore', errors);
  validateResidual(o.residualAfter, 'residualAfter', errors);
  if (o.residualVisible === false && (typeof o.residualBefore === 'number' || typeof o.residualAfter === 'number')) {
    errors.push('residualBefore/residualAfter : doivent être absents ou null quand residualVisible est faux');
  }
  if (typeof o.source !== 'string' || o.source.trim().length === 0) errors.push('source : chaîne non vide attendue');
  if (typeof o.date !== 'string' || Number.isNaN(Date.parse(o.date))) errors.push('date : date-time ISO 8601 attendu');
  if (o.server !== undefined && typeof o.server !== 'string') errors.push('server : chaîne attendue');
  if (o.notes !== undefined && typeof o.notes !== 'string') errors.push('notes : chaîne attendue');

  return { valid: errors.length === 0, errors };
}

/** Valide un fichier d'observations (tableau). Les erreurs sont préfixées par l'index. */
export function validateObservations(input: unknown): ValidationResult {
  if (!Array.isArray(input)) return { valid: false, errors: ['fichier : tableau d\'observations attendu'] };
  const errors: string[] = [];
  input.forEach((obs, i) => {
    for (const e of validateObservation(obs).errors) errors.push(`[${i}] ${e}`);
  });
  return { valid: errors.length === 0, errors };
}
