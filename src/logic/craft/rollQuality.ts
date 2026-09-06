/**
 * Qualité d'un jet : position moyenne des lignes naturelles dans leur intervalle de craft,
 * chaque point de l'intervalle étant pondéré par la densité de sa caractéristique.
 *
 *   quality = Σ (clamp(value, min, max) − min) × densité  /  Σ (max − min) × densité
 *
 * soit la part du poids de craft maximal effectivement atteinte. Indicateur de
 * planification, pas une règle du jeu : il ignore over, exotiques et reliquat (la valeur
 * est bornée à l'intervalle) et les lignes fixes (min = max), qui n'ont pas de jet.
 */

export interface RollQualityLine {
  characteristicId: number;
  value: number;
  baseMin: number;
  baseMax: number;
  isExo: boolean;
}

export interface RollQuality {
  /** Position pondérée dans [0, 1] */
  position: number;
  /** Poids de craft atteint et poids de craft maximal (mêmes unités que le budget) */
  weightAchieved: number;
  weightMax: number;
  /** Lignes ayant un intervalle de jet (min < max) et une densité connue */
  rolledLines: number;
}

export function computeRollQuality(
  lines: readonly RollQualityLine[],
  densities: ReadonlyMap<number, number>
): RollQuality | null {
  let achieved = 0;
  let max = 0;
  let rolledLines = 0;
  for (const line of lines) {
    if (line.isExo) continue;
    const density = densities.get(line.characteristicId);
    if (density === undefined) continue;
    const lo = Math.min(line.baseMin, line.baseMax);
    const hi = Math.max(line.baseMin, line.baseMax);
    if (hi <= lo) continue;
    const clamped = Math.min(hi, Math.max(lo, line.value));
    achieved += (clamped - lo) * density;
    max += (hi - lo) * density;
    rolledLines++;
  }
  if (rolledLines === 0 || max <= 0) return null;
  return { position: achieved / max, weightAchieved: achieved, weightMax: max, rolledLines };
}
