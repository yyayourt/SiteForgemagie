import { useState, useCallback, useRef } from 'react';
import type { Item, SimulatedStat } from '../types';
import {
  loadItems,
  getEffectRef,
  getCharacteristicName,
  getItemTypeName,
  type DatasetItem,
  type DatasetItemEffect,
} from '../data/dataset';
import { getDensity } from '../data/params';

const MAX_RESULTS = 25;

/** Résultat de recherche avec les effets bruts du dataset */
export interface SearchResult {
  item: Item;
  rawEffects: DatasetItemEffect[];
}

/** Minuscules, sans accents, pour une recherche tolérante */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Recherche d'objets dans le dataset local (data/items.json).
 * Aucun appel réseau : le fichier est chargé une fois, à la première recherche.
 */
export function useItemSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsRef = useRef<DatasetItem[] | null>(null);
  const loadingRef = useRef<Promise<DatasetItem[]> | null>(null);

  const ensureItems = useCallback(async (): Promise<DatasetItem[]> => {
    if (itemsRef.current) return itemsRef.current;
    if (!loadingRef.current) {
      setLoading(true);
      loadingRef.current = loadItems()
        .then((items) => {
          itemsRef.current = items;
          return items;
        })
        .finally(() => setLoading(false));
    }
    return loadingRef.current;
  }, []);

  const search = useCallback(
    (query: string) => {
      const q = normalize(query);
      if (q.length < 2) {
        setResults([]);
        setError(null);
        return;
      }
      ensureItems()
        .then((items) => {
          const matched = items
            .filter((it) => it.effects.length > 0 && normalize(it.nameFr).includes(q))
            .sort((a, b) => b.level - a.level)
            .slice(0, MAX_RESULTS)
            .map((raw) => ({ item: mapRawItem(raw), rawEffects: raw.effects }));
          setResults(matched);
          setError(null);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : String(err));
          setResults([]);
        });
    },
    [ensureItems]
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clearResults };
}

/** Convertit un objet du dataset en Item propre */
function mapRawItem(raw: DatasetItem): Item {
  return {
    id: raw.id,
    name: raw.nameFr || `Item #${raw.id}`,
    level: raw.level,
    typeId: raw.typeId,
    typeName: getItemTypeName(raw.typeId),
    imgUrl: raw.img,
  };
}

/**
 * Convertit les effets d'un objet en SimulatedStats.
 *
 * - Jointure par `characteristicId` via la table `effects` du dataset.
 * - Seules les lignes bonus (bonusType = 1) dotées d'une densité documentée sont gardées.
 *   Les malus et les effets sans densité sont ignorés pour l'instant (à traiter dans la
 *   phase moteur : un malus a un poids, cf. docs/knowledge « malus ÷2 »).
 * - Convention DofusDB : `to = 0` signifie valeur fixe égale à `from`.
 */
export function mapEffectsToStats(effects: DatasetItemEffect[]): SimulatedStat[] {
  const stats: SimulatedStat[] = [];
  const seen = new Set<number>();

  for (const effect of effects) {
    const ref = getEffectRef(effect.effectId);
    if (!ref || ref.bonusType !== 1) continue;
    const density = getDensity(ref.characteristicId);
    if (density === undefined) continue;
    if (seen.has(ref.characteristicId)) continue;
    seen.add(ref.characteristicId);

    const isFixed = effect.to === 0;
    const baseMin = isFixed ? effect.from : Math.min(effect.from, effect.to);
    const baseMax = isFixed ? effect.from : Math.max(effect.from, effect.to);

    stats.push({
      characteristicId: ref.characteristicId,
      statName: getCharacteristicName(ref.characteristicId),
      baseMin,
      baseMax,
      currentValue: baseMax, // Commence au jet parfait
      weightPerPoint: density,
      isExo: false,
      isForgemeable: true,
    });
  }

  return stats;
}
