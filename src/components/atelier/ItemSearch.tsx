import { useEffect, useId, useRef, useState } from 'react';
import { useItemSearch, mapEffectsToStats, type SearchResult } from '../../hooks/useItemSearch';
import type { Item, SimulatedStat } from '../../types';

interface Props {
  onSelect: (item: Item, stats: SimulatedStat[]) => void;
  currentItemName?: string;
}

/**
 * Recherche d'objet dans le dataset local. Liste déroulante au clavier (flèches, Entrée,
 * Échap). Les icônes d'objets viennent de DofusDB (assets Ankama, usage communautaire).
 */
export function ItemSearch({ onSelect, currentItemName }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const { results, loading, error, search, clearResults } = useItemSearch();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // L'index actif est borné par la liste courante (pas d'effet : dérivation au rendu)
  const activeIndex = results.length === 0 ? 0 : Math.min(active, results.length - 1);

  function choose(r: SearchResult) {
    onSelect(r.item, mapEffectsToStats(r.rawEffects));
    setQuery('');
    setOpen(false);
    clearResults();
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % results.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[activeIndex]); }
    else if (e.key === 'Escape') { setOpen(false); }
  }

  const showList = open && Boolean(results.length > 0 || loading || error || (query.trim().length >= 2 && !loading));

  return (
    <div ref={wrapperRef} className="relative">
      <label className="flex items-center gap-2.5 rounded-full border border-iron-edge bg-iron px-3.5 py-2 text-ash-2 focus-within:border-molten-text transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="shrink-0"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
        <span className="sr-only">Rechercher un objet à poser sur l'enclume</span>
        <input
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[activeIndex] ? `${listId}-${results[activeIndex].item.id}` : undefined}
          value={query}
          placeholder={currentItemName ? `${currentItemName} — chercher un autre objet…` : "Poser un objet sur l'enclume…"}
          onChange={(e) => { setQuery(e.target.value); search(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          className="w-full bg-transparent border-0 outline-none text-ash placeholder:text-ash-3"
        />
        {loading && <span className="embers w-4 h-4 shrink-0" aria-hidden="true" />}
      </label>

      {showList && (
        <div id={listId} role="listbox" className="surface-iron absolute z-40 mt-2 w-full max-h-80 overflow-y-auto p-1">
          {error && <p className="px-3 py-2 text-sm text-ec">Le dataset local n'a pas pu être chargé : {error}</p>}
          {!error && loading && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-ash-3">Le creuset chauffe : chargement des 3 371 objets du dataset local…</p>
          )}
          {!error && !loading && results.length === 0 && query.trim().length >= 2 && (
            <p className="px-3 py-2 text-sm text-ash-3">Aucun objet ne porte ce nom. Essayez une partie du nom, sans accent si besoin.</p>
          )}
          {results.map((r, i) => (
            <button
              key={r.item.id}
              id={`${listId}-${r.item.id}`}
              type="button"
              role="option"
              aria-selected={i === activeIndex}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(r)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-control text-left ${i === activeIndex ? 'bg-iron-2 text-ash' : 'text-ash-2 hover:bg-iron-2'}`}
            >
              {r.item.imgUrl ? (
                <img src={r.item.imgUrl} alt="" width={32} height={32} className="w-8 h-8 rounded bg-well shrink-0" loading="lazy" />
              ) : (
                <span className="w-8 h-8 rounded bg-well shrink-0" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r.item.name}</span>
                <span className="block text-xs text-ash-3">{r.item.typeName} · niveau {r.item.level}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
