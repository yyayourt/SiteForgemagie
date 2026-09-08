/**
 * Validateur des objets vus en jeu (data/observations/item-snapshot.schema.json), sans
 * dépendance. Un objet observé en HDV ou en inventaire est une preuve par l'existant :
 * il peut réfuter une lecture de la borne 101 (portée, base de mesure) sans tentative.
 */

export interface SnapshotLine {
  characteristicId: number;
  value: number;
  isExo: boolean;
  isOver: boolean;
  baseMax?: number;
}

export interface ItemSnapshot {
  schemaVersion: 1;
  gameVersion: string;
  itemId: number;
  itemName?: string;
  lines: SnapshotLine[];
  transcended?: boolean;
  source: string;
  date: string;
  server?: string;
  notes?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ALLOWED_KEYS = new Set(['schemaVersion', 'gameVersion', 'itemId', 'itemName', 'lines', 'transcended', 'source', 'date', 'server', 'notes']);
const LINE_KEYS = new Set(['characteristicId', 'value', 'isExo', 'isOver', 'baseMax']);
const GAME_VERSION = /^[0-9]+(\.[0-9]+){1,3}$/;

const isInt = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x);

export function validateItemSnapshot(input: unknown): ValidationResult {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { valid: false, errors: ['snapshot : objet attendu'] };
  }
  const o = input as Record<string, unknown>;
  for (const k of Object.keys(o)) if (!ALLOWED_KEYS.has(k)) errors.push(`${k} : champ inconnu`);

  if (o.schemaVersion !== 1) errors.push('schemaVersion : doit valoir 1');
  if (typeof o.gameVersion !== 'string' || !GAME_VERSION.test(o.gameVersion)) errors.push('gameVersion : chaîne "x.y[.z[.w]]" attendue');
  if (!isInt(o.itemId) || o.itemId < 1) errors.push('itemId : entier ≥ 1 attendu');
  if (o.itemName !== undefined && typeof o.itemName !== 'string') errors.push('itemName : chaîne attendue');

  if (!Array.isArray(o.lines) || o.lines.length === 0) {
    errors.push('lines : tableau non vide attendu');
  } else {
    o.lines.forEach((line, i) => {
      const at = `lines[${i}]`;
      if (typeof line !== 'object' || line === null) {
        errors.push(`${at} : objet attendu`);
        return;
      }
      const l = line as Record<string, unknown>;
      for (const k of Object.keys(l)) if (!LINE_KEYS.has(k)) errors.push(`${at}.${k} : champ inconnu`);
      if (!isInt(l.characteristicId) || l.characteristicId < 1) errors.push(`${at}.characteristicId : entier ≥ 1 attendu`);
      if (!isInt(l.value)) errors.push(`${at}.value : entier attendu`);
      if (typeof l.isExo !== 'boolean') errors.push(`${at}.isExo : booléen attendu`);
      if (typeof l.isOver !== 'boolean') errors.push(`${at}.isOver : booléen attendu`);
      if (l.isExo === true && l.isOver === true) errors.push(`${at} : une ligne exotique n'est pas « over » (isExo et isOver ne peuvent pas être vrais ensemble)`);
      if (l.baseMax !== undefined && !isInt(l.baseMax)) errors.push(`${at}.baseMax : entier attendu`);
      if (isInt(l.baseMax) && isInt(l.value) && l.isExo === false && l.isOver === true && l.value <= l.baseMax) {
        errors.push(`${at} : isOver vrai mais value ≤ baseMax`);
      }
    });
  }

  if (o.transcended !== undefined && typeof o.transcended !== 'boolean') errors.push('transcended : booléen attendu');
  if (typeof o.source !== 'string' || o.source.trim().length === 0) errors.push('source : chaîne non vide attendue');
  if (typeof o.date !== 'string' || Number.isNaN(Date.parse(o.date))) errors.push('date : date-time ISO 8601 attendu');
  if (o.server !== undefined && typeof o.server !== 'string') errors.push('server : chaîne attendue');
  if (o.notes !== undefined && typeof o.notes !== 'string') errors.push('notes : chaîne attendue');

  return { valid: errors.length === 0, errors };
}

/** Valide un fichier (tableau d'objets vus). Les erreurs sont préfixées par l'index. */
export function validateItemSnapshots(input: unknown): ValidationResult {
  if (!Array.isArray(input)) return { valid: false, errors: ["fichier : tableau d'objets vus attendu"] };
  const errors: string[] = [];
  input.forEach((s, i) => {
    for (const e of validateItemSnapshot(s).errors) errors.push(`[${i}] ${e}`);
  });
  return { valid: errors.length === 0, errors };
}
