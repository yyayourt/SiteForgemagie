import type { SimulatedStat, PoolResult } from '../types';
import { STAT_CAPS } from '../data/statCaps';

/**
 * Valeur de référence pour la règle des 101 en forgemagie Dofus.
 *
 * ATTENTION : la règle des 101 s'applique PAR LIGNE DE STAT, pas en cumul global.
 * Chaque ligne (over ou exo) est indépendante : un item peut avoir exo PA (100p)
 * + exo PM (90p) + over vita (101p) sans enfreindre la règle.
 *
 * Cette constante est utilisée ici uniquement comme indicateur visuel
 * (overExoBudgetRemaining) pour l'affichage, PAS comme contrainte mécanique.
 * Les vrais caps par ligne sont dans STAT_CAPS (maxOverOrExo).
 */
export const OVER_EXO_BUDGET = 101;

/**
 * Calcule le puits (pool) d'un item à partir de ses stats simulées.
 * Inclut : poids max théorique, qualité %, probabilité du jet,
 * et le budget over/exo (règle des 101).
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
    const cap = STAT_CAPS[stat.effectId];

    if (stat.isExo) {
      const ew = stat.currentValue * weight;
      currentWeight += ew;
      poolSpent += ew;
      exoWeight += ew;
      // Max théorique pour cette ligne exo
      const maxExoPoints = cap
        ? (cap.absoluteMax ?? cap.maxOverOrExo)
        : stat.currentValue;
      maxTheoreticalWeight += maxExoPoints * weight;
    } else {
      const baseW = stat.baseMax * weight;
      const currentW = stat.currentValue * weight;
      baseWeight += baseW;
      perfectRollWeight += baseW;
      currentWeight += currentW;

      // Max théorique pour cette ligne naturelle = jet parfait + max over possible
      const maxOverPoints = cap ? cap.maxOverOrExo : 0;
      maxTheoreticalWeight += baseW + maxOverPoints * weight;

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
    overExoBudgetRemaining: round2(OVER_EXO_BUDGET - overExoTotal),
  };
}

/**
 * Calcule la probabilité d'obtenir ce jet ou mieux au craft/drop.
 *
 * Chaque stat est un jet uniforme indépendant entre baseMin et baseMax.
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
 * 1. Le puits restant (poids disponible à redistribuer)
 * 2. Le cap par-ligne (règle des 101 PAR STAT, indépendante des autres)
 *
 * Le vrai max = min(max par puits, cap par-ligne STAT_CAPS)
 */
export function computeMaxReachable(
  stat: SimulatedStat,
  poolRemaining: number
): number {
  if (!stat.isForgemeable || stat.weightPerPoint === 0) return stat.currentValue;

  // Max basé sur le puits
  const maxByPool = stat.currentValue + Math.floor(poolRemaining / stat.weightPerPoint);

  // Max basé sur la règle des 101 PAR LIGNE (chaque stat est indépendante)
  const cap = STAT_CAPS[stat.effectId];
  let maxByCap = Infinity;
  if (cap) {
    if (cap.absoluteMax !== undefined) {
      maxByCap = cap.absoluteMax;
    } else if (stat.isExo) {
      maxByCap = cap.maxOverOrExo;
    } else {
      maxByCap = stat.baseMax + cap.maxOverOrExo;
    }
  }

  return Math.max(stat.currentValue, Math.min(maxByPool, maxByCap));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
