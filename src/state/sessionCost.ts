/**
 * Coût de session : compteur des consommables dépensés (runes par type, orbes, potions) et
 * total en kamas à partir des prix unitaires saisis par l'utilisateur.
 *
 * Aucun prix n'est fourni par l'application : le carnet de prix est vide par défaut et
 * mémorisé localement. Le total n'additionne que les lignes dont le prix est renseigné ;
 * tant qu'une ligne consommée n'a pas de prix, le total est signalé « incomplet ».
 */

import type { ConsumableRef, ForgeActionKind, SessionConsumption } from '../types';

/** Carnet de prix : clé de consommable → prix unitaire en kamas. Clé absente = prix inconnu. */
export type PriceBook = Readonly<Record<string, number>>;

export interface SessionCostLine {
  key: string;
  kind: ForgeActionKind;
  label: string;
  count: number;
  unitPrice: number | null;
  /** count × unitPrice, ou null sans prix */
  subtotal: number | null;
}

export interface SessionCostSummary {
  lines: SessionCostLine[];
  /** Somme des sous-totaux connus (les lignes sans prix ne comptent pas) */
  total: number;
  /** Nombre total de consommables (toutes lignes) */
  totalCount: number;
  pricedLines: number;
  unpricedLines: number;
  /** Vrai si chaque ligne consommée a un prix */
  complete: boolean;
}

const KIND_ORDER: Record<ForgeActionKind, number> = { rune: 0, transcendence: 1, orb: 2, potion: 3 };

/** Nouveau compteur avec un consommable de plus (sans muter l'entrée). */
export function addConsumption(consumed: SessionConsumption, ref: ConsumableRef, count = 1): SessionConsumption {
  const previous = consumed[ref.key];
  return { ...consumed, [ref.key]: { ...ref, count: (previous?.count ?? 0) + count } };
}

export function isValidPrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function computeSessionCost(consumed: SessionConsumption, prices: PriceBook): SessionCostSummary {
  const lines: SessionCostLine[] = Object.values(consumed)
    .filter((c) => c.count > 0)
    .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.label.localeCompare(b.label, 'fr'))
    .map((c) => {
      const price = prices[c.key];
      const unitPrice = isValidPrice(price) ? price : null;
      return { key: c.key, kind: c.kind, label: c.label, count: c.count, unitPrice, subtotal: unitPrice === null ? null : unitPrice * c.count };
    });
  const pricedLines = lines.filter((l) => l.subtotal !== null).length;
  return {
    lines,
    total: lines.reduce((sum, l) => sum + (l.subtotal ?? 0), 0),
    totalCount: lines.reduce((sum, l) => sum + l.count, 0),
    pricedLines,
    unpricedLines: lines.length - pricedLines,
    complete: lines.length > 0 && pricedLines === lines.length,
  };
}

const kamasFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/** « 12 500 K » */
export function formatKamas(n: number): string {
  return `${kamasFormat.format(Math.round(n))} K`;
}
