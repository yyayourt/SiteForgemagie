/* eslint-disable react-refresh/only-export-components -- fournisseur/contexte et hook partagés volontairement dans le même fichier */
/**
 * Carnet de prix de l'utilisateur : prix unitaire (kamas) par consommable, clé stable
 * (`rune:<runeId>`, `orb`, `potion:<id>`). Vide par défaut, mémorisé localement, jamais
 * fourni par l'application. Sert au coût de session et au coût figé dans la vitrine.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadJson, saveJson, STORAGE_KEYS } from '../state/persistence';
import { isValidPrice, type PriceBook } from '../state/sessionCost';

interface PricesApi {
  prices: PriceBook;
  /** null efface le prix (prix inconnu) */
  setPrice: (key: string, value: number | null) => void;
  clearPrices: () => void;
  pricedCount: number;
}

const PricesContext = createContext<PricesApi | null>(null);

function sanitize(raw: unknown): Record<string, number> {
  if (typeof raw !== 'object' || raw === null) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) if (isValidPrice(v)) out[k] = v;
  return out;
}

export function PricesProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<Record<string, number>>(() => sanitize(loadJson<unknown>(STORAGE_KEYS.prices)));

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    saveJson(STORAGE_KEYS.prices, prices);
  }, [prices]);

  const setPrice = useCallback((key: string, value: number | null) => {
    setPrices((p) => {
      if (value === null || !isValidPrice(value)) {
        if (!(key in p)) return p;
        const next = { ...p };
        delete next[key];
        return next;
      }
      return p[key] === value ? p : { ...p, [key]: value };
    });
  }, []);
  const clearPrices = useCallback(() => setPrices({}), []);

  const value = useMemo<PricesApi>(() => ({ prices, setPrice, clearPrices, pricedCount: Object.keys(prices).length }), [prices, setPrice, clearPrices]);
  return <PricesContext.Provider value={value}>{children}</PricesContext.Provider>;
}

export function usePrices(): PricesApi {
  const ctx = useContext(PricesContext);
  if (!ctx) throw new Error('usePrices doit être utilisé sous <PricesProvider>');
  return ctx;
}
