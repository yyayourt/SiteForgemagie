/**
 * Registre plat de empirical_params.json : chaque entrée { value, status, source, note, bounds,
 * default } devient un descripteur adressable par chemin ("params.overCapWeight",
 * "densities.11", "params.probability.officialFactorsLinear.a").
 *
 * Sert au panneau « Paramètres avancés » (édition, bornes, défaut, profils) et à la page
 * « État des connaissances » (tableaux par section). Les valeurs effectives sont lues par
 * src/data/params.ts via `readParam(path, overrides)`.
 */

import paramsJson from '../../empirical_params.json';
import type { EpistemicStatus, ParamEntry } from './params';

export type ParamKind = 'number' | 'boolean' | 'enum' | 'json';

export interface ParamDescriptor {
  path: string;
  /** Section d'affichage : 'overCap' | 'ecLoss' | 'lossSelection' | 'residualPool' | 'transcendence' | 'craft' | 'probability' | 'brisage' | 'densities' */
  section: string;
  /** Sous-groupe éventuel (ex. officialFactorsLinear) */
  subgroup?: string;
  key: string;
  label: string;
  kind: ParamKind;
  options?: readonly (string | boolean)[];
  min?: number;
  max?: number;
  entry: ParamEntry<unknown>;
  /** $comment du groupe parent, si présent */
  groupComment?: string;
}

export const SECTION_LABELS: Record<string, string> = {
  overCap: 'Borne des over et exo',
  ecLoss: 'Échec critique',
  lossSelection: 'Sélection des pertes',
  residualPool: 'Reliquat',
  transcendence: 'Transcendance',
  craft: 'Jet de craft',
  probability: 'Modèle probabiliste',
  brisage: 'Brisage',
  densities: 'Densités (poids par point)',
};

export const SECTION_ORDER = ['densities', 'overCap', 'lossSelection', 'ecLoss', 'residualPool', 'transcendence', 'craft', 'probability', 'brisage'];

function isEntry(node: unknown): node is ParamEntry<unknown> {
  return (
    typeof node === 'object' && node !== null && 'value' in node && 'status' in node && 'default' in node
  );
}

function kindOf(entry: ParamEntry<unknown>): { kind: ParamKind; options?: readonly (string | boolean)[] } {
  if (entry.bounds?.enum) return { kind: 'enum', options: entry.bounds.enum };
  if (typeof entry.default === 'boolean') return { kind: 'boolean' };
  if (typeof entry.default === 'number') return { kind: 'number' };
  return { kind: 'json' };
}

function sectionOf(pathParts: string[]): { section: string; subgroup?: string } {
  if (pathParts[0] === 'densities') return { section: 'densities' };
  const [, first, second] = pathParts;
  if (first === 'overCapWeight' || first === 'overCapScope' || first === 'overCapLineBasis') return { section: 'overCap' };
  if (first === 'ecLossFactor') return { section: 'ecLoss' };
  if (pathParts.length > 3) return { section: first, subgroup: second };
  return { section: first };
}

function humanize(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}

function walk(node: unknown, path: string[], out: ParamDescriptor[], groupComment?: string): void {
  if (typeof node !== 'object' || node === null) return;
  const obj = node as Record<string, unknown>;
  const comment = typeof obj.$comment === 'string' ? obj.$comment : groupComment;
  for (const [key, child] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    const childPath = [...path, key];
    if (isEntry(child)) {
      const { section, subgroup } = sectionOf(childPath);
      const { kind, options } = kindOf(child);
      const name = (child as { name?: string }).name;
      out.push({
        path: childPath.join('.'),
        section,
        subgroup,
        key,
        label: section === 'densities' && name ? name : humanize(key),
        kind,
        options,
        min: child.bounds?.min,
        max: child.bounds?.max,
        entry: child,
        groupComment: comment,
      });
    } else {
      walk(child, childPath, out, comment);
    }
  }
}

function buildRegistry(): ParamDescriptor[] {
  const out: ParamDescriptor[] = [];
  walk(paramsJson.densities, ['densities'], out);
  walk(paramsJson.params, ['params'], out);
  return out;
}

export const PARAM_REGISTRY: readonly ParamDescriptor[] = buildRegistry();
export const PARAM_BY_PATH: ReadonlyMap<string, ParamDescriptor> = new Map(PARAM_REGISTRY.map((d) => [d.path, d]));

/** Notes libres du fichier (hors paramètres). */
export const PARAM_NOTES: readonly string[] = paramsJson.notes;

export const STATUS_ORDER: EpistemicStatus[] = [
  'SOURCE PRIMAIRE',
  'MODÈLE EMPIRIQUE',
  'HYPOTHÈSE COMMUNAUTAIRE',
  'CONTRADICTION',
  'INCONNU',
];

/** Vérifie une valeur candidate contre le type et les bornes du descripteur. */
export function validateParamValue(d: ParamDescriptor, value: unknown): { ok: boolean; reason?: string } {
  switch (d.kind) {
    case 'number': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return { ok: false, reason: 'nombre attendu' };
      if (d.min !== undefined && value < d.min) return { ok: false, reason: `minimum ${d.min}` };
      if (d.max !== undefined && value > d.max) return { ok: false, reason: `maximum ${d.max}` };
      return { ok: true };
    }
    case 'boolean':
      return typeof value === 'boolean' ? { ok: true } : { ok: false, reason: 'booléen attendu' };
    case 'enum':
      return d.options?.includes(value as string | boolean) ? { ok: true } : { ok: false, reason: `valeurs possibles : ${d.options?.join(', ')}` };
    case 'json': {
      if (typeof value !== 'object' || value === null) return { ok: false, reason: 'objet ou tableau JSON attendu' };
      // Bornes numériques appliquées aux feuilles numériques
      const leaves: number[] = [];
      const collect = (v: unknown) => {
        if (typeof v === 'number') leaves.push(v);
        else if (typeof v === 'object' && v !== null) Object.values(v as object).forEach(collect);
      };
      collect(value);
      if (d.min !== undefined && leaves.some((n) => n < d.min!)) return { ok: false, reason: `minimum ${d.min}` };
      if (d.max !== undefined && leaves.some((n) => n > d.max!)) return { ok: false, reason: `maximum ${d.max}` };
      return { ok: true };
    }
  }
}

export function isDefaultValue(d: ParamDescriptor, value: unknown): boolean {
  return JSON.stringify(value) === JSON.stringify(d.entry.default);
}
