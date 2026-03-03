import { useState, useCallback, useRef } from 'react';
import type { DofusDBItem, DofusDBResponse, Item, SimulatedStat } from '../types';
import { EFFECT_MAPPING, ITEM_TYPE_NAMES } from '../data/effectMapping';

const API_BASE = 'https://api.dofusdb.fr';

/** Résultat de recherche avec les données brutes pour affichage */
export interface SearchResult {
  item: Item;
  rawEffects: DofusDBItem['effects'];
}

/**
 * Hook pour rechercher des items via l'API DofusDB.
 * Inclut un debounce automatique et la gestion d'erreurs.
 */
export function useItemSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    // Debounce 300ms
    timeoutRef.current = setTimeout(async () => {
      // Abort previous request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const url = `${API_BASE}/items?slug.fr[$search]=${encodeURIComponent(query.trim())}&$limit=25&$sort[level]=-1`;
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data: DofusDBResponse = await response.json();

        const mapped: SearchResult[] = data.data
          .filter((item) => item.effects && item.effects.length > 0)
          .map((raw) => ({
            item: mapRawItem(raw),
            rawEffects: raw.effects,
          }));

        setResults(mapped);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError((err as Error).message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clearResults };
}

/** Convertit un item brut DofusDB en Item propre */
function mapRawItem(raw: DofusDBItem): Item {
  return {
    id: raw.id,
    name: raw.name?.fr ?? `Item #${raw.id}`,
    level: raw.level,
    typeId: raw.typeId,
    typeName: ITEM_TYPE_NAMES[raw.typeId] ?? 'Équipement',
    imgUrl: raw.imgUrl ?? raw.img ?? '',
  };
}

/**
 * Convertit les effects bruts DofusDB en SimulatedStats pour la simulation.
 * Seules les stats dont on connaît le poids sont incluses.
 */
export function mapEffectsToStats(effects: DofusDBItem['effects']): SimulatedStat[] {
  const stats: SimulatedStat[] = [];

  for (const effect of effects) {
    const mapping = EFFECT_MAPPING[effect.effectId];
    if (!mapping) continue; // effectId inconnu → on skip

    // Ignore les malus (from < 0 ou to < 0 avec from > to)
    if (effect.to < 0 && effect.from < 0) continue;

    const baseMin = Math.min(Math.abs(effect.from), Math.abs(effect.to));
    const baseMax = Math.max(Math.abs(effect.from), Math.abs(effect.to));

    stats.push({
      effectId: effect.effectId,
      statName: mapping.statName,
      baseMin,
      baseMax,
      currentValue: baseMax, // Commence au jet parfait
      weightPerPoint: mapping.weightPerPoint,
      isExo: false,
      isForgemeable: mapping.isForgemeable,
    });
  }

  return stats;
}
