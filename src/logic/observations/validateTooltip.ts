/**
 * Validateur des lectures d'infobulle (data/observations/tooltips/schema.json), sans
 * dépendance. Une densité lue dans le client (affichage 2.58+) est la seule matière
 * admissible pour passer une entrée de `densities` en SOURCE PRIMAIRE : aucune API de
 * datamining ne l'expose (rapport de croisement 2026-09-07, §7).
 */

export interface TooltipReading {
  schemaVersion: 1;
  runeId: number;
  /** Densité affichée pour la rune entière (Rune Pa Vi +15 → 3). */
  densityRead: number;
  /** Densité par point déduite, facultative. */
  densityPerPoint?: number;
  gameVersion: string;
  capture: string;
  date?: string;
  source?: string;
  notes?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ALLOWED_KEYS = new Set(['schemaVersion', 'runeId', 'densityRead', 'densityPerPoint', 'gameVersion', 'capture', 'date', 'source', 'notes']);
const GAME_VERSION = /^[0-9]+(\.[0-9]+){1,3}$/;

const isPositive = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;

export function validateTooltipReading(input: unknown): ValidationResult {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { valid: false, errors: ['lecture : objet attendu'] };
  }
  const o = input as Record<string, unknown>;
  for (const k of Object.keys(o)) if (!ALLOWED_KEYS.has(k)) errors.push(`${k} : champ inconnu`);

  if (o.schemaVersion !== 1) errors.push('schemaVersion : doit valoir 1');
  if (typeof o.runeId !== 'number' || !Number.isInteger(o.runeId) || o.runeId < 1) errors.push('runeId : entier ≥ 1 attendu');
  if (!isPositive(o.densityRead)) errors.push('densityRead : nombre > 0 attendu');
  if (o.densityPerPoint !== undefined && !isPositive(o.densityPerPoint)) errors.push('densityPerPoint : nombre > 0 attendu');
  if (typeof o.gameVersion !== 'string' || !GAME_VERSION.test(o.gameVersion)) errors.push('gameVersion : chaîne "x.y[.z[.w]]" attendue');
  if (typeof o.capture !== 'string' || o.capture.trim().length === 0) errors.push('capture : chaîne non vide attendue (capture d\'écran obligatoire)');
  if (o.date !== undefined && (typeof o.date !== 'string' || Number.isNaN(Date.parse(o.date)))) errors.push('date : date-time ISO 8601 attendu');
  if (o.source !== undefined && typeof o.source !== 'string') errors.push('source : chaîne attendue');
  if (o.notes !== undefined && typeof o.notes !== 'string') errors.push('notes : chaîne attendue');

  return { valid: errors.length === 0, errors };
}

/** Densité par point d'une lecture : la valeur fournie, sinon densityRead / valeur de la rune. */
export function densityPerPointOf(reading: TooltipReading, runeValue: number): number {
  if (reading.densityPerPoint !== undefined) return reading.densityPerPoint;
  if (runeValue <= 0) throw new Error(`valeur de rune invalide : ${runeValue}`);
  return reading.densityRead / runeValue;
}

/** Valide un fichier (tableau de lectures). Les erreurs sont préfixées par l'index. */
export function validateTooltipReadings(input: unknown): ValidationResult {
  if (!Array.isArray(input)) return { valid: false, errors: ['fichier : tableau de lectures attendu'] };
  const errors: string[] = [];
  input.forEach((r, i) => {
    for (const e of validateTooltipReading(r).errors) errors.push(`[${i}] ${e}`);
  });
  return { valid: errors.length === 0, errors };
}
