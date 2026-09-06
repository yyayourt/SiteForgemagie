/**
 * Étape « Calcul du poids » du pipeline (CLAUDE.md).
 * Poids d'une ligne = valeur × densité(characteristicId), densité lue dans
 * empirical_params.json (HYPOTHÈSE COMMUNAUTAIRE / CONTRADICTION selon la caractéristique).
 */

import type { EngineParams } from '../../data/params';
import type { ItemLine, Rune } from '../../types/forgemagie';

export function getLineDensity(characteristicId: number, params: EngineParams): number | undefined {
  return params.densities.get(characteristicId);
}

/** Poids d'une rune = valeur ajoutée × densité. */
export function runeWeight(rune: Rune, params: EngineParams): number {
  const density = getLineDensity(rune.characteristicId, params);
  if (density === undefined) throw new Error(`No density for characteristic ${rune.characteristicId}`);
  return rune.value * density;
}

/** Poids actuel d'une ligne (valeur × densité). 0 si densité inconnue. */
export function lineWeight(line: ItemLine, params: EngineParams): number {
  const density = getLineDensity(line.characteristicId, params) ?? 0;
  return line.value * density;
}

/** Poids au-delà du jet parfait (over) ou poids total pour un exo. 0 si la ligne est naturelle et ≤ baseMax. */
export function lineOverWeight(line: ItemLine, params: EngineParams): number {
  const density = getLineDensity(line.characteristicId, params) ?? 0;
  const overPoints = line.isExo ? line.value : Math.max(0, line.value - line.baseMax);
  return overPoints * density;
}

/**
 * Poids d'une ligne au sens de la borne par ligne (overCapLineBasis) : 0 si la ligne n'est
 * ni en over ni exotique ; sinon son poids TOTAL (total_value, défaut : 505 vita au total)
 * ou seulement sa part over (over_part).
 */
export function lineCapWeight(line: ItemLine, params: EngineParams): number {
  if (!isOverOrExo(line)) return 0;
  return params.overCapLineBasis === 'total_value' ? lineWeight(line, params) : lineOverWeight(line, params);
}

/** Vrai si la ligne est en over (naturelle au-dessus de baseMax) ou exotique avec valeur > 0. */
export function isOverOrExo(line: ItemLine): boolean {
  return line.isExo ? line.value > 0 : line.value > line.baseMax;
}
