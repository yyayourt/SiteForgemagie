import type {
  SimulatedStat,
  RuneTier,
  RuneOutcome,
  SimLogEntry,
  SimulationResult,
} from '../types';
import { getRuneTiers } from '../data/dataset';
import { getDensity } from '../data/params';
import { getStatAbsoluteMax } from '../data/statCaps';
import { computeItemPool } from './poolCalculator';

/**
 * ⚠ MOTEUR PROVISOIRE — À JETER (docs/audit-projet-existant.md §2.4, §3.3 R4–R9).
 *
 * Les probabilités SC/SN/EC, le recul en EC (50 % du poids), la loi de sélection de la
 * ligne perdue et l'absence d'absorption par le reliquat sont des modèles INVENTÉS,
 * sans source, et contredisent la borne primaire « SC ≥ 15 % en FM normale ».
 * En phase 1 (dataset), ce fichier n'est modifié que pour compiler avec la nouvelle
 * couche données (clé characteristicId, densités et paliers de runes issus des
 * fichiers de référence). Il sera remplacé par le moteur paramétrable en phase 2.
 */

/**
 * ⚠ INCONNU, codé en dur à titre provisoire (à migrer dans empirical_params.json en phase 2).
 * Seuil de poids à partir duquel une rune exo suit 1 % SC / 0 % SN / 99 % EC.
 */
const EXO_HEAVY_THRESHOLD = 30;

/**
 * Calcule les taux de SC/SN/EC en fonction du ratio budget/poids de rune.
 *
 * ⚠ FORMULE INVENTÉE (statut INCONNU). Ne reflète pas les mécaniques de DOFUS.
 * Seul le « 1 % SC pour un exo PA/PM/PO » est SOURCE PRIMAIRE (tutoriel Ankama) ;
 * le partage 0 % SN / 99 % EC, le seuil de 30 et l'inclusion des Invocations ne
 * sont pas établis.
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
    pSC = Math.min(50 + ratio * 5, 90) / 100;
    pEC = Math.max(5 - ratio * 0.5, 1) / 100;
  } else {
    pSC = Math.max(50 + ratio * 5, 5) / 100;
    pEC = Math.min(10 - ratio * 3, 50) / 100;
  }

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
 * ⚠ Priorité over/exo = HYPOTHÈSE COMMUNAUTAIRE ; pondération ∝ valeur × poids =
 * modèle C parmi A/B/C/D, INCONNU (à rendre interchangeable en phase 2).
 */
export function pickRecoilTarget(
  stats: SimulatedStat[],
  excludeCharacteristicId: number
): SimulatedStat | null {
  const candidates = stats.filter(
    (s) => s.characteristicId !== excludeCharacteristicId && s.currentValue > 0 && s.isForgemeable
  );

  if (candidates.length === 0) return null;

  const overCandidates = candidates.filter(
    (s) => s.isExo || s.currentValue > s.baseMax
  );

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
 * ⚠ Arrondi ceil() et absence d'absorption par le reliquat : INCONNU / contraire aux docs.
 */
function applyRecoil(
  stats: SimulatedStat[],
  victimCharacteristicId: number,
  weightToLose: number
): { newStats: SimulatedStat[]; pointsLost: number } {
  const victim = stats.find((s) => s.characteristicId === victimCharacteristicId);
  const pointsLost =
    victim && victim.weightPerPoint > 0
      ? Math.min(Math.ceil(weightToLose / victim.weightPerPoint), victim.currentValue)
      : 0;

  return {
    newStats: stats.map((s) =>
      s.characteristicId === victimCharacteristicId
        ? { ...s, currentValue: s.currentValue - pointsLost }
        : s
    ),
    pointsLost,
  };
}

/**
 * Valeur ajoutée par une rune d'un palier donné, d'après data/rune-tiers.json.
 * Repli sur le palier inférieur si le palier demandé n'existe pas ; 0 si aucune rune.
 */
export function getRuneValue(characteristicId: number, tier: RuneTier): number {
  const tiers = getRuneTiers(characteristicId);
  if (!tiers) return 0;

  switch (tier) {
    case 'normal':
      return tiers.normal?.value ?? 0;
    case 'pa':
      return tiers.pa?.value ?? tiers.normal?.value ?? 0;
    case 'ra':
      return tiers.ra?.value ?? tiers.pa?.value ?? tiers.normal?.value ?? 0;
  }
}

/**
 * Simule l'application d'une rune sur un item (moteur provisoire, voir en-tête).
 */
export function simulateRune(
  stats: SimulatedStat[],
  targetCharacteristicId: number,
  tier: RuneTier,
  logId: number
): SimulationResult {
  const targetStat = stats.find((s) => s.characteristicId === targetCharacteristicId);
  if (!targetStat) {
    throw new Error(`Stat ${targetCharacteristicId} not found`);
  }

  const density = getDensity(targetCharacteristicId);
  if (density === undefined) {
    throw new Error(`No density for characteristic ${targetCharacteristicId}`);
  }

  const runeValue = getRuneValue(targetCharacteristicId, tier);
  const runeWeight = runeValue * density;

  const pool = computeItemPool(stats);

  const { pSC, pSN } = computeOutcomeProbabilities(
    pool.poolRemaining,
    runeWeight,
    targetStat.isExo
  );

  const outcome = rollOutcome(pSC, pSN);

  let newStats = [...stats.map((s) => ({ ...s }))];
  let sideEffect: SimLogEntry['sideEffect'] = undefined;

  const applyGain = (list: SimulatedStat[]) =>
    list.map((s) => {
      if (s.characteristicId !== targetCharacteristicId) return s;
      const max = getStatAbsoluteMax(s);
      return { ...s, currentValue: Math.min(s.currentValue + runeValue, max) };
    });

  switch (outcome) {
    case 'SC': {
      newStats = applyGain(newStats);
      break;
    }

    case 'SN': {
      newStats = applyGain(newStats);
      const victim = pickRecoilTarget(newStats, targetCharacteristicId);
      if (victim) {
        const { newStats: afterRecoil, pointsLost } = applyRecoil(
          newStats,
          victim.characteristicId,
          runeWeight
        );
        newStats = afterRecoil;
        sideEffect = {
          affectedStatName: victim.statName,
          affectedCharacteristicId: victim.characteristicId,
          pointsLost,
        };
      }
      break;
    }

    case 'EC': {
      const victim = pickRecoilTarget(newStats, targetCharacteristicId);
      if (victim) {
        const recoilWeight = runeWeight * 0.5; // ⚠ INVENTÉ (audit R7)
        const { newStats: afterRecoil, pointsLost } = applyRecoil(
          newStats,
          victim.characteristicId,
          recoilWeight
        );
        newStats = afterRecoil;
        sideEffect = {
          affectedStatName: victim.statName,
          affectedCharacteristicId: victim.characteristicId,
          pointsLost,
        };
      }
      break;
    }
  }

  const poolAfter = computeItemPool(newStats);

  const logEntry: SimLogEntry = {
    id: logId,
    targetStatName: targetStat.statName,
    targetCharacteristicId,
    runeTier: tier,
    runeValue,
    runeWeight,
    outcome,
    sideEffect,
    poolAfter: poolAfter.poolRemaining,
  };

  return { outcome, newStats, logEntry };
}
