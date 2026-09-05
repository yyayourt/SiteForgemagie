import type { SimulatedStat, PoolResult } from '../types';
import { getMaxOverOrExo, getStatAbsoluteMax } from '../data/statCaps';
import { OVER_CAP_WEIGHT } from '../data/params';

/**
 * ⚠ TERMINOLOGIE (décision du 2026-09-05) : ce module calcule un BUDGET DE POIDS
 * de planification (weightBudget), dérivé de l'état visible de l'objet :
 *   poolGained = Σ (baseMax − current) × densité sur les lignes sacrifiées
 *   poolSpent  = Σ poids des overs et des exos
 * Ce n'est PAS le reliquat serveur (residualPool = perte − rune, jamais négatif,
 * créé par un SN/EC). Les identifiants `pool*` seront renommés lors de la refonte
 * du moteur ; ils sont conservés ici pour limiter la portée de la phase 1.
 *
 * La borne d'over/exo (OVER_CAP_WEIGHT, statut HYPOTHÈSE COMMUNAUTAIRE) et sa portée
 * (overCapScope, CONTRADICTION) viennent de empirical_params.json. Ce fichier applique
 * la lecture « par ligne » ; overExoBudgetRemaining est un indicateur de la lecture
 * « globale », affiché à titre d'information seulement.
 */

/**
 * Calcule le budget de poids d'un item à partir de ses stats simulées.
 * Inclut : poids max théorique, qualité %, probabilité du jet,
 * et le budget over/exo global.
 */
export function computeItemPool(stats: SimulatedStat[]): PoolResult {
  let baseWeight = 0;
  let currentWeight = 0;
  let poolGained = 0;
  let poolSpent = 0;
  let perfectRollWeight = 0; // poids au jet parfait (base de la qualité %)
  let maxTheoreticalWeight = 0; // poids si tous les overs/exos actuels sont au max
  let overWeight = 0;
  let exoWeight = 0;

  for (const stat of stats) {
    if (!stat.isForgemeable) continue;

    const weight = stat.weightPerPoint;
    const maxOver = getMaxOverOrExo(stat.characteristicId);

    if (stat.isExo) {
      const ew = stat.currentValue * weight;
      currentWeight += ew;
      poolSpent += ew;
      exoWeight += ew;
      // Max théorique pour cette ligne exo
      const maxExoPoints = maxOver ?? stat.currentValue;
      maxTheoreticalWeight += maxExoPoints * weight;
    } else {
      const baseW = stat.baseMax * weight;
      const currentW = stat.currentValue * weight;
      baseWeight += baseW;
      perfectRollWeight += baseW;
      currentWeight += currentW;

      // Max théorique pour cette ligne naturelle = jet parfait + max over possible
      maxTheoreticalWeight += baseW + (maxOver ?? 0) * weight;

      if (stat.currentValue < stat.baseMax) {
        poolGained += (stat.baseMax - stat.currentValue) * weight;
      } else if (stat.currentValue > stat.baseMax) {
        const ow = (stat.currentValue - stat.baseMax) * weight;
        poolSpent += ow;
        overWeight += ow;
      }
    }
  }

  const overExoTotal = round2(overWeight + exoWeight);

  // La qualité reste relative au jet parfait (100% = jet parfait sans over)
  const qualityPercent =
    perfectRollWeight > 0
      ? round2((currentWeight / perfectRollWeight) * 100)
      : 0;

  const rollProbability = computeRollProbability(stats);

  return {
    baseWeight: round2(baseWeight),
    currentWeight: round2(currentWeight),
    poolGained: round2(poolGained),
    poolSpent: round2(poolSpent),
    poolRemaining: round2(poolGained - poolSpent),
    maxTheoreticalWeight: round2(maxTheoreticalWeight),
    qualityPercent,
    rollProbability,
    overWeight: round2(overWeight),
    exoWeight: round2(exoWeight),
    overExoTotal,
    overExoBudgetRemaining: round2(OVER_CAP_WEIGHT - overExoTotal),
  };
}

/**
 * Calcule la probabilité d'obtenir ce jet ou mieux au craft/drop.
 *
 * ⚠ INCONNU : suppose un jet uniforme et indépendant par ligne, loi non documentée.
 * Hors périmètre de la forgemagie serveur ; conservé tel quel en phase 1.
 * P(ligne ≥ currentValue) = (baseMax - currentValue + 1) / (baseMax - baseMin + 1)
 * P(item) = Π P(ligne) pour toutes les lignes non-exo avec baseMax > baseMin
 */
export function computeRollProbability(stats: SimulatedStat[]): number {
  let probability = 1;

  for (const stat of stats) {
    if (stat.isExo) continue;
    if (!stat.isForgemeable) continue;

    const range = stat.baseMax - stat.baseMin + 1;
    if (range <= 1) continue; // stat fixe, P=1

    // Clamp currentValue dans la plage [baseMin, baseMax] pour le calcul
    const effectiveValue = Math.min(Math.max(stat.currentValue, stat.baseMin), stat.baseMax);
    const favorableOutcomes = stat.baseMax - effectiveValue + 1;
    probability *= favorableOutcomes / range;
  }

  return probability;
}

/**
 * Détermine le statut visuel d'une ligne de stat.
 */
export function getStatStatus(
  stat: SimulatedStat
): 'normal' | 'over' | 'exo' | 'sacrificed' | 'perfect' {
  if (stat.isExo) return 'exo';
  if (stat.currentValue > stat.baseMax) return 'over';
  if (stat.currentValue < stat.baseMax) return 'sacrificed';
  if (stat.currentValue === stat.baseMax) return 'perfect';
  return 'normal';
}

/**
 * Calcule le maximum atteignable pour une ligne donnée,
 * en considérant DEUX contraintes :
 * 1. Le budget de poids restant (poids disponible à redistribuer)
 * 2. Le plafond par ligne (getStatAbsoluteMax, dérivé de empirical_params.json)
 *
 * Le vrai max = min(max par budget, plafond par ligne)
 */
export function computeMaxReachable(
  stat: SimulatedStat,
  poolRemaining: number
): number {
  if (!stat.isForgemeable || stat.weightPerPoint === 0) return stat.currentValue;

  // Max basé sur le budget de poids
  const maxByPool = stat.currentValue + Math.floor(poolRemaining / stat.weightPerPoint);

  // Max basé sur le plafond par ligne
  const maxByCap = getStatAbsoluteMax(stat);

  return Math.max(stat.currentValue, Math.min(maxByPool, maxByCap));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
