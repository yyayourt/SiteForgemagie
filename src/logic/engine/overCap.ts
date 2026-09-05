/**
 * Borne d'over/exo. Deux lectures concurrentes (empirical_params.json → overCapScope,
 * statut CONTRADICTION) :
 * - per_line : chaque ligne dispose de son propre plafond overCapWeight ;
 * - global   : la somme des poids over + exo de l'objet est plafonnée à overCapWeight.
 * overCapWeight : HYPOTHÈSE COMMUNAUTAIRE (borne pratique 101).
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

  if (params.overCapScope === 'per_line') {
    const line = after.lines.find((l) => l.characteristicId === targetCharacteristicId);
    const overWeightAfter = line ? lineOverWeight(line, params) : 0;
    return { allowed: overWeightAfter <= cap + EPS, overWeightAfter, cap };
  }

  const overWeightAfter = after.lines.reduce((sum, l) => sum + lineOverWeight(l, params), 0);
  return { allowed: overWeightAfter <= cap + EPS, overWeightAfter, cap };
}

/** Vrai si au moins une ligne est en over ou exotique (utilisé par la transcendance). */
export function hasAnyOverOrExo(lines: ItemLine[]): boolean {
  return lines.some((l) => (l.isExo ? l.value > 0 : l.value > l.baseMax));
}
