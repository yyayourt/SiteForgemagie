/**
 * BUDGET DE POIDS DE PLANIFICATION (weightBudget).
 *
 * Calculé à la volée depuis l'état VISIBLE de l'objet : « combien de poids je libère si
 * je sacrifie telle ligne, combien j'en consomme en over/exo ». C'est un outil de
 * planification pour le joueur.
 *
 * Ce module ne partage AUCUN code avec le moteur (src/logic/engine) et ne connaît pas
 * le reliquat serveur (residualPool), qui est un état propre et non dérivable.
 *
 * Bornes d'over/exo : OVER_CAP_WEIGHT (HYPOTHÈSE COMMUNAUTAIRE). overExoTotal est mesuré sur
 * la part over (valeur − jet max) et l'exo ; overExoBudgetRemaining = borne − cumul, ce que
 * la jauge « over/exo utilisé » affiche (portée overCapScope : HYPOTHÈSE COMMUNAUTAIRE,
 * global par défaut). computeMaxReachable reçoit le plafond de ligne calculé par l'appelant
 * selon la portée active (src/data/statCaps → getStatAbsoluteMaxInContext).
 */

import type { SimulatedStat, WeightBudget } from '../../types';
import { getMaxOverOrExo, getStatAbsoluteMax } from '../../data/statCaps';
import { getOverCapWeight, type ParamOverrides } from '../../data/params';

/**
 * `overrides` : surcharges de paramètres (profil du panneau « Paramètres avancés »).
 * Sans argument, valeurs de empirical_params.json — comportement inchangé.
 */
export function computeWeightBudget(stats: SimulatedStat[], overrides?: ParamOverrides): WeightBudget {
  let baseWeight = 0;
  let currentWeight = 0;
  let freedWeight = 0;
  let spentWeight = 0;
  let perfectRollWeight = 0;
  let maxTheoreticalWeight = 0;
  let overWeight = 0;
  let exoWeight = 0;

  for (const stat of stats) {
    if (!stat.isForgemeable) continue;

    const weight = stat.weightPerPoint;
    const maxOver = getMaxOverOrExo(stat.characteristicId, overrides);

    if (stat.isExo) {
      const ew = stat.currentValue * weight;
      currentWeight += ew;
      spentWeight += ew;
      exoWeight += ew;
      maxTheoreticalWeight += (maxOver ?? stat.currentValue) * weight;
    } else {
      const baseW = stat.baseMax * weight;
      const currentW = stat.currentValue * weight;
      baseWeight += baseW;
      perfectRollWeight += baseW;
      currentWeight += currentW;
      maxTheoreticalWeight += baseW + (maxOver ?? 0) * weight;

      if (stat.currentValue < stat.baseMax) {
        freedWeight += (stat.baseMax - stat.currentValue) * weight;
      } else if (stat.currentValue > stat.baseMax) {
        const ow = (stat.currentValue - stat.baseMax) * weight;
        spentWeight += ow;
        overWeight += ow;
      }
    }
  }

  const overExoTotal = round2(overWeight + exoWeight);
  const qualityPercent =
    perfectRollWeight > 0 ? round2((currentWeight / perfectRollWeight) * 100) : 0;

  return {
    baseWeight: round2(baseWeight),
    currentWeight: round2(currentWeight),
    freedWeight: round2(freedWeight),
    spentWeight: round2(spentWeight),
    remainingBudget: round2(freedWeight - spentWeight),
    maxTheoreticalWeight: round2(maxTheoreticalWeight),
    qualityPercent,
    overWeight: round2(overWeight),
    exoWeight: round2(exoWeight),
    overExoTotal,
    overExoBudgetRemaining: round2(getOverCapWeight(overrides) - overExoTotal),
  };
}

/** Statut visuel d'une ligne. */
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
 * Maximum atteignable pour une ligne en planification :
 * min(max permis par le budget restant, plafond de la ligne).
 * `absoluteMax` : plafond selon la portée active (getStatAbsoluteMaxInContext) ; à défaut,
 * plafond de la ligne seule (lecture par ligne, comportement historique).
 */
export function computeMaxReachable(
  stat: SimulatedStat,
  remainingBudget: number,
  overrides?: ParamOverrides,
  absoluteMax?: number
): number {
  if (!stat.isForgemeable || stat.weightPerPoint === 0) return stat.currentValue;

  const maxByBudget = stat.currentValue + Math.floor(remainingBudget / stat.weightPerPoint);
  const maxByCap = absoluteMax ?? getStatAbsoluteMax(stat, overrides);

  return Math.max(stat.currentValue, Math.min(maxByBudget, maxByCap));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
