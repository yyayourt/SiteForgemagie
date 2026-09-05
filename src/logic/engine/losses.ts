/**
 * Étapes « Sélection des pertes → Mise à jour du reliquat » du pipeline.
 *
 * Règles (CLAUDE.md, décision du 2026-09-05) :
 * 1. La perte demandée est d'abord absorbée par le reliquat (residualPool), consommé en
 *    priorité (docs/knowledge R PARTIE 2, HYPOTHÈSE COMMUNAUTAIRE forte).
 * 2. Le reste est retiré sur des lignes choisies par la stratégie de sélection ; sur une
 *    ligne, on retire un nombre ENTIER de points : ceil(reste / densité), borné par ce que
 *    la ligne peut perdre.
 * 3. Reliquat créé = poids réellement retiré − perte demandée restante, jamais négatif
 *    (définition « reliquat = perte − rune », convergence communautaire, A §4.1).
 * 4. Si aucune ligne ne peut absorber le reste, il est perdu (unabsorbedWeight) et le
 *    reliquat n'en est pas affecté.
 */

import type { EngineParams } from '../../data/params';
import type { ForgemagieItemState, ItemLine, LossRecord, Rng } from '../../types/forgemagie';
import { getLossSelectionStrategy, type LossCandidate } from './lossSelection';
import { isOverOrExo } from './weights';

export interface LossApplication {
  state: ForgemagieItemState;
  absorbedByResidual: number;
  losses: LossRecord[];
  unabsorbedWeight: number;
}

/** Points qu'une ligne peut perdre quand elle est ciblée comme over/exo (jusqu'au jet parfait / à 0). */
function removablePointsAsOverExo(line: ItemLine): number {
  return line.isExo ? line.value : Math.max(0, line.value - line.baseMax);
}

/** Points qu'une ligne peut perdre en général (jusqu'à 0). */
function removablePoints(line: ItemLine): number {
  return Math.max(0, line.value);
}

function candidatesOf(
  lines: ItemLine[],
  excludeCharacteristicId: number | null,
  params: EngineParams,
  overExoOnly: boolean
): LossCandidate[] {
  const out: LossCandidate[] = [];
  for (const line of lines) {
    if (line.characteristicId === excludeCharacteristicId) continue;
    if (line.isLocked) continue;
    const density = params.densities.get(line.characteristicId);
    if (density === undefined || density <= 0) continue;
    if (overExoOnly) {
      if (!isOverOrExo(line) || removablePointsAsOverExo(line) <= 0) continue;
    } else if (removablePoints(line) <= 0) {
      continue;
    }
    out.push({ line, density });
  }
  return out;
}

/**
 * Applique une perte de `lossWeight` (poids) à l'état.
 * `excludeCharacteristicId` : ligne à ne jamais cibler (la ligne visée par la rune), ou null.
 */
export function applyLoss(
  state: ForgemagieItemState,
  lossWeight: number,
  excludeCharacteristicId: number | null,
  params: EngineParams,
  rng: Rng
): LossApplication {
  const EPS = 1e-9;
  let remaining = Math.max(0, lossWeight);
  let residual = state.residualPool;
  const losses: LossRecord[] = [];
  const lines = state.lines.map((l) => ({ ...l }));

  // 1. Absorption prioritaire par le reliquat
  const absorbedByResidual = Math.min(residual, remaining);
  residual -= absorbedByResidual;
  remaining -= absorbedByResidual;

  const strategy = getLossSelectionStrategy(params.lossSelection.strategy);

  // 2. Retrait sur des lignes, tant qu'il reste du poids à perdre et des candidates
  while (remaining > EPS) {
    let overExoPhase = false;
    let candidates: LossCandidate[] = [];
    if (params.lossSelection.prioritizeOverExo) {
      candidates = candidatesOf(lines, excludeCharacteristicId, params, true);
      overExoPhase = candidates.length > 0;
    }
    if (candidates.length === 0) {
      candidates = candidatesOf(lines, excludeCharacteristicId, params, false);
    }
    if (candidates.length === 0) break;

    const picked = strategy.pick(candidates, rng);
    const maxPoints = overExoPhase
      ? removablePointsAsOverExo(picked.line)
      : removablePoints(picked.line);
    const wanted = Math.ceil(remaining / picked.density - EPS);
    const points = Math.min(wanted, maxPoints);
    if (points <= 0) break;

    const weightLost = points * picked.density;
    picked.line.value -= points;
    losses.push({ characteristicId: picked.line.characteristicId, pointsLost: points, weightLost });

    if (weightLost >= remaining - EPS) {
      // 3. Reliquat créé = surplus retiré au-delà de la perte demandée, jamais négatif
      residual += Math.max(0, weightLost - remaining);
      remaining = 0;
    } else {
      remaining -= weightLost;
    }
  }

  return {
    state: { ...state, lines, residualPool: Math.max(0, residual) },
    absorbedByResidual,
    losses,
    unabsorbedWeight: remaining > EPS ? remaining : 0,
  };
}
