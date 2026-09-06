/**
 * Vitrine : liste locale des objets figés (localStorage), avec sauvegarde, duplication,
 * suppression, note, export et import JSON. Les transformations sont dans
 * src/state/showcase.ts (pures, testées) ; ce hook ne fait que porter l'état.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { loadJson, saveJson, STORAGE_KEYS } from '../state/persistence';
import {
  createShowcaseEntry,
  duplicateShowcaseEntry,
  parseShowcase,
  serializeShowcase,
  SHOWCASE_FORMAT,
  SHOWCASE_VERSION,
  type ShowcaseEntry,
  type ShowcaseSource,
} from '../state/showcase';
import type { SessionCostSummary } from '../state/sessionCost';

function loadEntries(): ShowcaseEntry[] {
  const raw = loadJson<unknown>(STORAGE_KEYS.showcase);
  if (!raw) return [];
  // Même lecteur tolérant que l'import : un stockage corrompu ne casse pas l'app
  return parseShowcase(JSON.stringify(raw)).entries;
}

export function useShowcase() {
  const [entries, setEntries] = useState<ShowcaseEntry[]>(loadEntries);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    saveJson(STORAGE_KEYS.showcase, { format: SHOWCASE_FORMAT, version: SHOWCASE_VERSION, exportedAt: new Date().toISOString(), entries });
  }, [entries]);

  const save = useCallback((source: ShowcaseSource, cost: SessionCostSummary, note = ''): ShowcaseEntry => {
    const entry = createShowcaseEntry(source, cost, new Date(), note);
    setEntries((list) => [entry, ...list]);
    return entry;
  }, []);

  const remove = useCallback((id: string) => setEntries((list) => list.filter((e) => e.id !== id)), []);

  const duplicate = useCallback((id: string) => {
    setEntries((list) => {
      const i = list.findIndex((e) => e.id === id);
      if (i < 0) return list;
      const copy = duplicateShowcaseEntry(list[i]);
      return [...list.slice(0, i + 1), copy, ...list.slice(i + 1)];
    });
  }, []);

  const updateNote = useCallback((id: string, note: string) => {
    setEntries((list) => list.map((e) => (e.id === id ? { ...e, note } : e)));
  }, []);

  const exportJson = useCallback(() => serializeShowcase(entries), [entries]);

  /** Fusionne un export : les entrées dont l'identifiant existe déjà sont ignorées. */
  const importJson = useCallback(
    (text: string): { ok: boolean; added: number; skipped: number; errors: string[] } => {
      const r = parseShowcase(text);
      if (!r.ok) return { ok: false, added: 0, skipped: 0, errors: r.errors };
      const known = new Set(entries.map((e) => e.id));
      const fresh = r.entries.filter((e) => !known.has(e.id));
      // Le calcul est fait hors du réducteur d'état (React peut l'invoquer deux fois en développement)
      setEntries((list) => [...fresh.filter((e) => !list.some((x) => x.id === e.id)), ...list]);
      return { ok: true, added: fresh.length, skipped: r.entries.length - fresh.length, errors: r.errors };
    },
    [entries]
  );

  return { entries, save, remove, duplicate, updateNote, exportJson, importJson };
}

export type ShowcaseApi = ReturnType<typeof useShowcase>;
