/**
 * Modèle « lookup_table » — INCONNU (empirical_params.json → probability.lookupTable.table).
 *
 * Table éditable { classe de distance au jet max × classe de poids de rune → pSC, pEC },
 * destinée à recueillir les estimations de joueurs expérimentés. Les valeurs par défaut sont
 * un gabarit sans aucune mesure derrière. En exo lourd, le complément de pSC est réparti
 * selon heavyExoEcShare et non selon la cellule.
 */

import type { LookupTableSpec, ProbabilityParams } from '../../../data/params';
import { distanceToMax, splitComplement, type ProbabilityModel } from '../types';

/** Index de la classe contenant x pour des bornes croissantes [b0, b1, …, bn] ; dernière classe si x ≥ bn. */
export function bucketIndex(buckets: number[], x: number): number {
  if (buckets.length < 2) return 0;
  for (let i = 0; i < buckets.length - 1; i++) {
    if (x >= buckets[i] && x < buckets[i + 1]) return i;
  }
  return x < buckets[0] ? 0 : buckets.length - 2;
}

export function lookupCell(table: LookupTableSpec, distance: number, runeWeight: number) {
  const i = Math.min(bucketIndex(table.distanceBuckets, distance), table.cells.length - 1);
  const row = table.cells[i] ?? [];
  const j = Math.min(bucketIndex(table.runeWeightBuckets, runeWeight), row.length - 1);
  return row[j];
}

export const lookupTableModel: ProbabilityModel = {
  name: 'lookup_table',
  compute(input, params: ProbabilityParams) {
    const cell = lookupCell(params.lookupTable, distanceToMax(input.line), input.runeWeight);
    if (!cell) return { pSC: 1, pSN: 0, pEC: 0 };
    if (input.isHeavyExo) return splitComplement(cell.pSC, params.heavyExoEcShare);
    const pSC = Math.min(1, Math.max(0, cell.pSC));
    const pEC = Math.min(1 - pSC, Math.max(0, cell.pEC));
    return { pSC, pSN: Math.max(0, 1 - pSC - pEC), pEC };
  },
};
