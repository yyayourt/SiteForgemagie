/**
 * Accès typé au dataset de référence figé (data/*.json).
 *
 * Statut : données dataminées TIERCES (DofusDB), non officielles. Voir data/README.md
 * pour la provenance de chaque champ. Aucune densité de forgemagie ici : voir params.ts.
 *
 * Clé de jointure : `characteristicId` (champ `characteristic` de DofusDB), jamais `effectId`.
 */

import datasetJson from '../../data/dataset.json';
import runeTiersJson from '../../data/rune-tiers.json';
import type { RuneTier } from '../types';

export interface EffectRef {
  effectId: number;
  characteristicId: number;
  /** 1 = bonus, -1 = malus */
  bonusType: number;
  category: number;
  labelFr: string;
}

export interface RuneTierInfo {
  runeId: number;
  nameFr: string;
  /** Valeur ajoutée par la rune (ex. Rune Pa Vi → 15) */
  value: number;
}

export interface RuneTiersEntry {
  nameFr: string;
  normal?: RuneTierInfo;
  pa?: RuneTierInfo;
  ra?: RuneTierInfo;
}

export interface DatasetItemEffect {
  effectId: number;
  characteristicId: number;
  from: number;
  /** 0 = valeur fixe égale à `from` (convention DofusDB) */
  to: number;
}

export interface DatasetItem {
  id: number;
  nameFr: string;
  level: number;
  typeId: number;
  img: string;
  enhanceable: boolean | null;
  effects: DatasetItemEffect[];
}

export const DATASET_META = datasetJson.meta;

const effectById = new Map<number, EffectRef>(
  datasetJson.effects.map((e) => [e.effectId, e as EffectRef])
);

/** Nom d'affichage par caractéristique : libellé de l'effet bonus (ex. « % Dommages distance »). */
const characteristicName = new Map<number, string>();
for (const c of datasetJson.characteristics) {
  characteristicName.set(c.id, c.nameFr);
}
for (const e of datasetJson.effects) {
  if (e.bonusType === 1 && !characteristicName.get(e.characteristicId)?.startsWith('%')) {
    // Le libellé d'effet est plus précis que le nom de caractéristique
    // (« Distance (%) » désigne à la fois % dommages et % résistance).
    characteristicName.set(e.characteristicId, e.labelFr);
  }
}

const itemTypeName = new Map<number, string>(datasetJson.itemTypes.map((t) => [t.id, t.nameFr]));

const runeTiers = runeTiersJson.tiers as Record<string, RuneTiersEntry>;

export function getEffectRef(effectId: number): EffectRef | undefined {
  return effectById.get(effectId);
}

export function getCharacteristicName(characteristicId: number): string {
  return characteristicName.get(characteristicId) ?? `Caractéristique #${characteristicId}`;
}

export function getItemTypeName(typeId: number): string {
  return itemTypeName.get(typeId) ?? 'Équipement';
}

export function getRuneTiers(characteristicId: number): RuneTiersEntry | undefined {
  return runeTiers[String(characteristicId)];
}

/** Caractéristiques pour lesquelles au moins une rune de forgemagie existe. */
export const CHARACTERISTICS_WITH_RUNES: readonly number[] = Object.keys(runeTiers).map(Number);

const TIER_ORDER: RuneTier[] = ['normal', 'pa', 'ra'];

/** Paliers réellement existants pour une caractéristique, dans l'ordre normal → Pa → Ra. */
export function getAvailableRuneTiers(
  characteristicId: number
): { tier: RuneTier; info: RuneTierInfo }[] {
  const entry = getRuneTiers(characteristicId);
  if (!entry) return [];
  return TIER_ORDER.flatMap((tier) => {
    const info = entry[tier];
    return info ? [{ tier, info }] : [];
  });
}

/** Chargement différé de la liste des objets (fichier volumineux, chunk séparé). */
export async function loadItems(): Promise<DatasetItem[]> {
  const mod = await import('../../data/items.json');
  return mod.default.items as DatasetItem[];
}
