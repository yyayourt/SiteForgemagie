/**
 * Borne d'over/exo (empirical_params.json → overCapWeight, HYPOTHÈSE COMMUNAUTAIRE, 101).
 *
 * Règle 1, toujours appliquée quelle que soit la portée (guide Huz : « L'over maximal d'un
 * item ne peut excéder 101 de densité sur une statistique (Ex : 505 vita, 101 agilité) ») :
 *   la part over (valeur − jet max) ou exo (valeur) de la LIGNE VISÉE, × densité, ≤ overCapWeight.
 *
 * Règle 2, selon overCapScope (HYPOTHÈSE COMMUNAUTAIRE, global par défaut) :
 * - global   : la somme des parts over + exo de TOUTES les lignes ≤ overCapWeight
 *              (Huz : « 10 ini et 1 PA », « 55 vita 1 PM » = 101 cumulés) ;
 * - per_line : rien de plus que la règle 1 (chaque ligne a son propre plafond).
 * En global, la règle 1 découle de la règle 2 ; elle est vérifiée explicitement pour que
 * l'invariant « une ligne seule ≤ 101 » survive à tout changement de la mesure cumulée.
 */

import type { EngineParams } from '../../data/params';
import type { ForgemagieItemState, ItemLine } from '../../types/forgemagie';
import { lineOverWeight } from './weights';

export interface OverCapCheck {
  allowed: boolean;
  /** Poids over/exo pris en compte après application (ligne ou objet selon le scope). */
  overWeightAfter: number;
  cap: number;
}

/**
 * Vérifie que l'état `after` respecte la borne pour la ligne ciblée.
 * `after` est l'état hypothétique une fois la rune appliquée.
 */
export function checkOverCap(
  after: ForgemagieItemState,
  targetCharacteristicId: number,
  params: EngineParams
): OverCapCheck {
  const cap = params.overCapWeight;
  const EPS = 1e-9;

  // Règle 1 : la ligne visée, seule, ne dépasse jamais la borne
  const line = after.lines.find((l) => l.characteristicId === targetCharacteristicId);
  const lineOverAfter = line ? lineOverWeight(line, params) : 0;
  if (params.overCapScope === 'per_line') {
    return { allowed: lineOverAfter <= cap + EPS, overWeightAfter: lineOverAfter, cap };
  }

  // Règle 2 (global) : le cumul de l'objet ne dépasse pas la borne non plus
  const overWeightAfter = after.lines.reduce((sum, l) => sum + lineOverWeight(l, params), 0);
  return { allowed: lineOverAfter <= cap + EPS && overWeightAfter <= cap + EPS, overWeightAfter, cap };
}

/** Vrai si au moins une ligne est en over ou exotique (utilisé par la transcendance). */
export function hasAnyOverOrExo(lines: ItemLine[]): boolean {
  return lines.some((l) => (l.isExo ? l.value > 0 : l.value > l.baseMax));
}
