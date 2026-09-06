/**
 * Vitrine : objets figés depuis l'atelier (lignes finales, over/exo, reliquat courant,
 * consommation de la session, coût si des prix sont renseignés, journal replié, date, note).
 *
 * Fonctions pures : création depuis l'état de l'atelier, retour vers un état d'atelier
 * (« Reprendre » restitue exactement lignes, reliquat, verrou, consommation et journal),
 * duplication, sérialisation et lecture tolérante d'un fichier JSON exporté.
 */

import type { AtelierState, Item, SessionConsumption, SimLogEntry, SimulatedStat } from '../types';
import { PARAMS_META } from '../data/params';
import type { SessionCostSummary } from './sessionCost';

export const SHOWCASE_FORMAT = 'forge-showcase';
export const SHOWCASE_VERSION = 1;

export interface ShowcaseCost {
  /** Somme des lignes dont le prix était renseigné au moment de la sauvegarde */
  total: number;
  /** Faux si au moins une ligne consommée n'avait pas de prix */
  complete: boolean;
}

export interface ShowcaseEntry {
  id: string;
  /** ISO 8601 */
  savedAt: string;
  note: string;
  gameVersion: string;
  item: Item;
  stats: SimulatedStat[];
  residualPool: number;
  itemLocked: boolean;
  consumed: SessionConsumption;
  /** null si aucune ligne consommée n'avait de prix */
  cost: ShowcaseCost | null;
  log: SimLogEntry[];
  logCounter: number;
}

export interface ShowcaseFile {
  format: typeof SHOWCASE_FORMAT;
  version: number;
  exportedAt: string;
  entries: ShowcaseEntry[];
}

export type ShowcaseSource = Pick<AtelierState, 'stats' | 'residualPool' | 'itemLocked' | 'consumed' | 'log' | 'logCounter'> & { item: Item };

export function newShowcaseId(now: Date = new Date()): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${now.getTime().toString(36)}-${rand}`;
}

/** Fige l'objet courant. Les tableaux sont copiés : la vitrine ne partage rien avec l'atelier. */
export function createShowcaseEntry(source: ShowcaseSource, cost: SessionCostSummary, now: Date = new Date(), note = ''): ShowcaseEntry {
  return {
    id: newShowcaseId(now),
    savedAt: now.toISOString(),
    note,
    gameVersion: PARAMS_META.gameVersion,
    item: { ...source.item },
    stats: source.stats.map((s) => ({ ...s })),
    residualPool: source.residualPool,
    itemLocked: source.itemLocked,
    consumed: Object.fromEntries(Object.entries(source.consumed).map(([k, v]) => [k, { ...v }])),
    cost: cost.pricedLines > 0 ? { total: cost.total, complete: cost.complete } : null,
    log: source.log.map((e) => ({ ...e, losses: e.losses.map((l) => ({ ...l })) })),
    logCounter: source.logCounter,
  };
}

/** État d'atelier à restaurer (RESTORE) pour reprendre l'objet tel qu'il était. */
export function showcaseToAtelierState(entry: ShowcaseEntry): Partial<AtelierState> {
  return {
    item: { ...entry.item },
    stats: entry.stats.map((s) => ({ ...s })),
    residualPool: entry.residualPool,
    itemLocked: entry.itemLocked,
    consumed: Object.fromEntries(Object.entries(entry.consumed).map(([k, v]) => [k, { ...v }])),
    log: entry.log.map((e) => ({ ...e, losses: e.losses.map((l) => ({ ...l })) })),
    logCounter: entry.logCounter,
    mode: 'forge',
    selectedCharacteristicId: entry.stats.find((s) => s.isForgemeable && !s.isLocked)?.characteristicId ?? null,
  };
}

export function duplicateShowcaseEntry(entry: ShowcaseEntry, now: Date = new Date()): ShowcaseEntry {
  const copy = JSON.parse(JSON.stringify(entry)) as ShowcaseEntry;
  return { ...copy, id: newShowcaseId(now), savedAt: now.toISOString(), note: entry.note ? `${entry.note} (copie)` : 'copie' };
}

export function serializeShowcase(entries: readonly ShowcaseEntry[], now: Date = new Date()): string {
  const file: ShowcaseFile = { format: SHOWCASE_FORMAT, version: SHOWCASE_VERSION, exportedAt: now.toISOString(), entries: [...entries] };
  return JSON.stringify(file, null, 2);
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function sanitizeStat(raw: unknown): SimulatedStat | null {
  if (!isObj(raw) || !isNum(raw.characteristicId) || !isNum(raw.currentValue)) return null;
  return {
    characteristicId: raw.characteristicId,
    statName: typeof raw.statName === 'string' ? raw.statName : `Caractéristique #${raw.characteristicId}`,
    baseMin: isNum(raw.baseMin) ? raw.baseMin : 0,
    baseMax: isNum(raw.baseMax) ? raw.baseMax : 0,
    currentValue: raw.currentValue,
    weightPerPoint: isNum(raw.weightPerPoint) ? raw.weightPerPoint : 0,
    isExo: raw.isExo === true,
    isForgemeable: raw.isForgemeable !== false,
    isLocked: raw.isLocked === true,
  };
}

function sanitizeEntry(raw: unknown, index: number, now: Date): { entry?: ShowcaseEntry; error?: string } {
  if (!isObj(raw)) return { error: `entrée ${index + 1} : pas un objet` };
  const item = raw.item;
  if (!isObj(item) || !isNum(item.id) || typeof item.name !== 'string') return { error: `entrée ${index + 1} : objet (item) manquant ou invalide` };
  if (!Array.isArray(raw.stats)) return { error: `entrée ${index + 1} : lignes (stats) manquantes` };
  const stats = raw.stats.map(sanitizeStat).filter((s): s is SimulatedStat => s !== null);
  if (stats.length !== raw.stats.length) return { error: `entrée ${index + 1} : une ligne est invalide` };
  const consumed: SessionConsumption = {};
  if (isObj(raw.consumed)) {
    for (const [key, v] of Object.entries(raw.consumed)) {
      if (isObj(v) && isNum(v.count) && typeof v.label === 'string' && typeof v.kind === 'string') {
        consumed[key] = { key, kind: v.kind as SessionConsumption[string]['kind'], label: v.label, count: v.count };
      }
    }
  }
  const cost = isObj(raw.cost) && isNum(raw.cost.total) ? { total: raw.cost.total, complete: raw.cost.complete === true } : null;
  const log = Array.isArray(raw.log) ? (raw.log.filter(isObj) as unknown as SimLogEntry[]) : [];
  return {
    entry: {
      id: typeof raw.id === 'string' && raw.id ? raw.id : newShowcaseId(now),
      savedAt: typeof raw.savedAt === 'string' ? raw.savedAt : now.toISOString(),
      note: typeof raw.note === 'string' ? raw.note : '',
      gameVersion: typeof raw.gameVersion === 'string' ? raw.gameVersion : 'inconnue',
      item: {
        id: item.id,
        name: item.name,
        level: isNum(item.level) ? item.level : 0,
        typeId: isNum(item.typeId) ? item.typeId : 0,
        typeName: typeof item.typeName === 'string' ? item.typeName : 'Équipement',
        imgUrl: typeof item.imgUrl === 'string' ? item.imgUrl : '',
      },
      stats,
      residualPool: isNum(raw.residualPool) && raw.residualPool >= 0 ? raw.residualPool : 0,
      itemLocked: raw.itemLocked === true,
      consumed,
      cost,
      log,
      logCounter: isNum(raw.logCounter) ? raw.logCounter : log.length,
    },
  };
}

/** Lecture tolérante d'un export : les entrées invalides sont signalées, les valides gardées. */
export function parseShowcase(json: string, now: Date = new Date()): { ok: boolean; entries: ShowcaseEntry[]; errors: string[] } {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, entries: [], errors: ['JSON illisible'] };
  }
  if (!isObj(raw) || raw.format !== SHOWCASE_FORMAT || !Array.isArray(raw.entries)) {
    return { ok: false, entries: [], errors: [`fichier attendu : format « ${SHOWCASE_FORMAT} » avec une liste « entries »`] };
  }
  const errors: string[] = [];
  if (raw.version !== SHOWCASE_VERSION) errors.push(`version ${String(raw.version)} lue avec le lecteur v${SHOWCASE_VERSION}`);
  const entries: ShowcaseEntry[] = [];
  const seen = new Set<string>();
  raw.entries.forEach((e, i) => {
    const r = sanitizeEntry(e, i, now);
    if (r.error) errors.push(r.error);
    if (r.entry) {
      if (seen.has(r.entry.id)) r.entry.id = newShowcaseId(now);
      seen.add(r.entry.id);
      entries.push(r.entry);
    }
  });
  return { ok: entries.length > 0, entries, errors };
}
