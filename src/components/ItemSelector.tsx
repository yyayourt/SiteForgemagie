import { useState, useRef, useEffect } from 'react';
import { useItemSearch, mapEffectsToStats } from '../hooks/useItemSearch';
import type { SearchResult } from '../hooks/useItemSearch';
import type { Item, SimulatedStat } from '../types';

interface Props {
  selectedItem: Item | null;
  onSelect: (item: Item, stats: SimulatedStat[]) => void;
}

export function ItemSelector({ selectedItem, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { results, loading, error, search, clearResults } = useItemSearch();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    search(value);
    setIsOpen(true);
  }

  function handleSelect(result: SearchResult) {
    const stats = mapEffectsToStats(result.rawEffects);
    onSelect(result.item, stats);
    setQuery(result.item.name);
    setIsOpen(false);
    clearResults();
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-dofus-gold-light mb-2">
        Rechercher un item
      </label>
      <div className="flex items-center gap-3">
        {selectedItem?.imgUrl && (
          <img
            src={selectedItem.imgUrl}
            alt={selectedItem.name}
            className="w-10 h-10 rounded border border-dofus-gold/30 bg-dofus-dark"
          />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Ex : Amulette du Strigide, Rhineetle..."
          className="w-full bg-dofus-dark border border-dofus-gold/30 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-dofus-gold transition-colors"
        />
        {loading && (
          <div className="absolute right-3 top-10">
            <div className="w-5 h-5 border-2 border-dofus-gold/30 border-t-dofus-gold rounded-full animate-spin" />
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm mt-2">
          Erreur API : {error}
        </p>
      )}

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-80 overflow-y-auto bg-dofus-panel border border-dofus-gold/30 rounded-lg shadow-xl">
          {results.map((r) => (
            <li
              key={r.item.id}
              onClick={() => handleSelect(r)}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-dofus-panel-light transition-colors border-b border-dofus-gold/10 last:border-0"
            >
              {r.item.imgUrl && (
                <img
                  src={r.item.imgUrl}
                  alt=""
                  className="w-8 h-8 rounded bg-dofus-dark"
                />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-white font-medium truncate block">
                  {r.item.name}
                </span>
                <span className="text-xs text-gray-400">
                  {r.item.typeName} &middot; Niv. {r.item.level}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
