import type {
  SimulatedStat,
  RuneTier,
  RuneOutcome,
  SimLogEntry,
  SimulationResult,
} from '../types';
import { EFFECT_MAPPING } from '../data/effectMapping';
import { getStatAbsoluteMax } from '../data/statCaps';
import { computeItemPool } from './poolCalculator';

/**
 * Moteur de simulation de forgemagie fidèle aux mécaniques Dofus.
 *
 * 3 résultats possibles :
 * - SC (Succès Critique) : la rune passe, aucune perte sur les autres stats
 * - SN (Succès Neutre)   : la rune passe, mais une autre stat perd du poids équivalent
 * - EC (Échec Critique)   : la rune ne passe pas, une stat random perd du poids
 *
 * Note : les probabilités SC/SN/EC et le recul utilisent un modèle simplifié.
 * Voir les commentaires de computeOutcomeProbabilities() et applyRecoil()
 * pour les détails et les écarts avec la théorie FM communautaire.
 */

/**
 * Seuil de poids à partir duquel une rune exo a un comportement spécial :
 * 1% de SC, 0% de SN, 99% de EC.
 * Concerne PA (100), PM (90), PO (51), Invocations (30).
 */
const EXO_HEAVY_THRESHOLD = 30;

/**
 * Calcule les taux de SC/SN/EC en fonction du ratio puits/poids de rune.
 *
 * ⚠ MODÈLE SIMPLIFIÉ — Ne reflète pas les mécaniques exactes de Dofus.
 * En théorie FM communautaire, le puits n'influence PAS directement les probabilités
 * de SC/SN/EC. Les taux dépendraient plutôt de la densité de l'item et du type de rune.
 * Ankama ne publie aucune formule officielle.
 * Ce modèle utilise le ratio puits/rune comme approximation plausible pour la simulation.
 *
 * Cas spécial CONFIRMÉ : pour les runes exo lourdes (PA, PM, PO, Invocations),
 * le taux est fixe : 1% SC, 0% SN, 99% EC.
 */
export function computeOutcomeProbabilities(
  poolRemaining: number,
  runeWeight: number,
  isExoAttempt: boolean = false
): { pSC: number; pSN: number; pEC: number } {
  if (runeWeight <= 0) return { pSC: 1, pSN: 0, pEC: 0 };

  // Exo lourd : 1% SC, pas de SN, 99% EC
  if (isExoAttempt && runeWeight >= EXO_HEAVY_THRESHOLD) {
    return { pSC: 0.01, pSN: 0, pEC: 0.99 };
  }

  const ratio = poolRemaining / runeWeight;

  let pSC: number;
  let pEC: number;

  if (ratio >= 0) {
    // Puits positif : la rune devrait passer facilement
    // SC entre 50% (ratio=0) et 90% (ratio très élevé)
    pSC = Math.min(50 + ratio * 5, 90) / 100;
    // EC minimal à 5%, descend quand ratio augmente
    pEC = Math.max(5 - ratio * 0.5, 1) / 100;
  } else {
    // Puits négatif : on force contre le reliquat
    // SC descend avec le puits négatif, minimum 5%
    pSC = Math.max(50 + ratio * 5, 5) / 100;
    // EC augmente, max 50%
    pEC = Math.min(10 - ratio * 3, 50) / 100;
  }

  // SN = le reste
  const pSN = Math.max(0, 1 - pSC - pEC);

  return { pSC, pSN, pEC };
}

/**
 * Tire un résultat aléatoire (SC/SN/EC) selon les probabilités.
 */
export function rollOutcome(pSC: number, pSN: number): RuneOutcome {
  const roll = Math.random();
  if (roll < pSC) return 'SC';
  if (roll < pSC + pSN) return 'SN';
  return 'EC';
}

/**
 * Choisit une stat victime du recul.
 *
 * Priorité réaliste Dofus :
 * 1. Les stats en OVER (au-dessus du jet parfait) sont ciblées en premier
 * 2. Sinon, pondération par le poids actuel de chaque ligne
 *
 * Exclut la stat ciblée par la rune et les stats à 0.
 */
export function pickRecoilTarget(
  stats: SimulatedStat[],
  excludeEffectId: number
): SimulatedStat | null {
  const candidates = stats.filter(
    (s) => s.effectId !== excludeEffectId && s.currentValue > 0 && s.isForgemeable
  );

  if (candidates.length === 0) return null;

  // Priorité : stats over (au-dessus de baseMax ou exo avec value > 0)
  const overCandidates = candidates.filter(
    (s) => s.isExo || s.currentValue > s.baseMax
  );

  // Si des stats sont en over, cibler parmi elles en priorité
  const pool = overCandidates.length > 0 ? overCandidates : candidates;

  const totalWeight = pool.reduce(
    (sum, s) => sum + s.currentValue * s.weightPerPoint,
    0
  );

  if (totalWeight <= 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  let roll = Math.random() * totalWeight;
  for (const stat of pool) {
    roll -= stat.currentValue * stat.weightPerPoint;
    if (roll <= 0) return stat;
  }

  return pool[pool.length - 1];
}

/**
 * Applique le recul : retire du poids sur la stat victime.
 * Retourne le nombre de points effectivement perdus.
 *
 * ⚠ MODÈLE SIMPLIFIÉ :
 * - En EC, le recul appliqué = 50% du poids de la rune. Ce ratio n'est pas
 *   confirmé par la théorie FM (certains guides parlent de perte totale, d'autres partielle).
 * - Le puits n'absorbe PAS le recul ici (le recul touche toujours une stat visible).
 *   En théorie FM, certains guides suggèrent que le puits peut absorber une partie
 *   du recul (SN avec puits positif = aucune stat visible ne baisse). Ce point
 *   reste débattu dans la communauté.
 */
function applyRecoil(
  stats: SimulatedStat[],
  victimEffectId: number,
  weightToLose: number
): { newStats: SimulatedStat[]; pointsLost: number } {
  return {
    newStats: stats.map((s) => {
      if (s.effectId !== victimEffectId) return s;

      const pointsToLose =
        s.weightPerPoint > 0
          ? Math.ceil(weightToLose / s.weightPerPoint)
          : 0;
      const actualLoss = Math.min(pointsToLose, s.currentValue);

      return { ...s, currentValue: s.currentValue - actualLoss };
    }),
    pointsLost: (() => {
      const victim = stats.find((s) => s.effectId === victimEffectId);
      if (!victim || victim.weightPerPoint <= 0) return 0;
      const pointsToLose = Math.ceil(weightToLose / victim.weightPerPoint);
      return Math.min(pointsToLose, victim.currentValue);
    })(),
  };
}

/**
 * Résout la valeur d'une rune en fonction de son tier.
 */
export function getRuneValue(effectId: number, tier: RuneTier): number {
  const mapping = EFFECT_MAPPING[effectId];
  if (!mapping) return 0;

  switch (tier) {
    case 'normal':
      return mapping.runeNormal ?? 1;
    case 'pa':
      return mapping.runePa ?? mapping.runeNormal ?? 1;
    case 'ra':
      return mapping.runeRa ?? mapping.runePa ?? mapping.runeNormal ?? 1;
  }
}

/**
 * Simule l'application d'une rune sur un item.
 * C'est la fonction principale du moteur.
 */
export function simulateRune(
  stats: SimulatedStat[],
  targetEffectId: number,
  tier: RuneTier,
  logId: number
): SimulationResult {
  const targetStat = stats.find((s) => s.effectId === targetEffectId);
  if (!targetStat) {
    throw new Error(`Stat ${targetEffectId} not found`);
  }

  const mapping = EFFECT_MAPPING[targetEffectId];
  if (!mapping) {
    throw new Error(`No mapping for effectId ${targetEffectId}`);
  }

  const runeValue = getRuneValue(targetEffectId, tier);
  const runeWeight = runeValue * mapping.weightPerPoint;

  // Calcul du puits actuel
  const pool = computeItemPool(stats);

  // Calcul des probabilités (gère le cas spécial exo lourd)
  const { pSC, pSN } = computeOutcomeProbabilities(
    pool.poolRemaining,
    runeWeight,
    targetStat.isExo
  );

  // Tirage aléatoire
  const outcome = rollOutcome(pSC, pSN);

  let newStats = [...stats.map((s) => ({ ...s }))];
  let sideEffect: SimLogEntry['sideEffect'] = undefined;

  switch (outcome) {
    case 'SC': {
      // La rune passe, aucun recul — clamp au max théorique (règle des 101)
      newStats = newStats.map((s) => {
        if (s.effectId !== targetEffectId) return s;
        const max = getStatAbsoluteMax(s);
        return { ...s, currentValue: Math.min(s.currentValue + runeValue, max) };
      });
      break;
    }

    case 'SN': {
      // La rune passe, mais recul sur une autre stat — clamp au max théorique
      newStats = newStats.map((s) => {
        if (s.effectId !== targetEffectId) return s;
        const max = getStatAbsoluteMax(s);
        return { ...s, currentValue: Math.min(s.currentValue + runeValue, max) };
      });

      const victim = pickRecoilTarget(newStats, targetEffectId);
      if (victim) {
        const { newStats: afterRecoil, pointsLost } = applyRecoil(
          newStats,
          victim.effectId,
          runeWeight
        );
        newStats = afterRecoil;
        sideEffect = {
          affectedStatName: victim.statName,
          affectedEffectId: victim.effectId,
          pointsLost,
        };
      }
      break;
    }

    case 'EC': {
      // La rune ne passe pas + recul réduit sur une autre stat
      const victim = pickRecoilTarget(newStats, targetEffectId);
      if (victim) {
        const recoilWeight = runeWeight * 0.5; // EC = 50% du poids perdu
        const { newStats: afterRecoil, pointsLost } = applyRecoil(
          newStats,
          victim.effectId,
          recoilWeight
        );
        newStats = afterRecoil;
        sideEffect = {
          affectedStatName: victim.statName,
          affectedEffectId: victim.effectId,
          pointsLost,
        };
      }
      break;
    }
  }

  // Calcul du puits après
  const poolAfter = computeItemPool(newStats);

  const logEntry: SimLogEntry = {
    id: logId,
    targetStatName: targetStat.statName,
    targetEffectId,
    runeTier: tier,
    runeValue,
    runeWeight,
    outcome,
    sideEffect,
    poolAfter: poolAfter.poolRemaining,
  };

  return { outcome, newStats, logEntry };
}
