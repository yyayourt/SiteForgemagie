/**
 * Monte Carlo : N passages d'une même rune sur un même état de départ.
 *
 * Sert à comparer les modèles probabilistes entre eux (et, plus tard, avec des observations
 * réelles — data/observations/). Le tirage de l'issue passe par le modèle choisi ; l'effet
 * de l'issue passe par le moteur déterministe (src/logic/engine). RNG injecté : une graine
 * donnée reproduit exactement la même distribution.
 */

import type { EngineParams, ProbabilityModelName, ProbabilityParams } from '../../data/params';
import type { ForgemagieItemState, Rng, Rune, RuneOutcome } from '../../types/forgemagie';
import { applyRune } from '../engine';
import { computeOutcomeProbabilities, drawOutcome, isHeavyExo } from './index';
import type { ProbabilityInput, ProbabilityOutput } from './types';
import { overCapUsageAfter } from './overCapUsage';

export interface MonteCarloOptions {
  runs: number;
  /** Budget de planification à fournir au modèle (0 si non pertinent). */
  weightBudget?: number;
  modelName?: ProbabilityModelName;
}

export interface FinalStateBucket {
  count: number;
  state: ForgemagieItemState;
}

export interface MonteCarloResult {
  runs: number;
  model: ProbabilityModelName;
  /** Probabilités théoriques du modèle pour cet état de départ. */
  probabilities: ProbabilityOutput;
  /** Issues tirées. */
  outcomes: Record<RuneOutcome, number>;
  frequencies: Record<RuneOutcome, number>;
  /** Tentatives refusées par le moteur (plafond, verrou…). */
  refused: number;
  /** États finaux distincts, clé = lignes + reliquat sérialisés. */
  finalStates: Map<string, FinalStateBucket>;
}

export function stateKey(state: ForgemagieItemState): string {
  const lines = [...state.lines]
    .sort((a, b) => a.characteristicId - b.characteristicId)
    .map((l) => `${l.characteristicId}:${l.value}${l.isExo ? 'x' : ''}${l.isLocked ? 'L' : ''}`)
    .join(',');
  return `${lines}|r=${Math.round(state.residualPool * 1000) / 1000}`;
}

export function buildProbabilityInput(
  state: ForgemagieItemState,
  rune: Rune,
  engineParams: EngineParams,
  probabilityParams: ProbabilityParams,
  weightBudget: number
): ProbabilityInput {
  const line = state.lines.find((l) => l.characteristicId === rune.characteristicId);
  const isExo = line ? line.isExo : true;
  const density = engineParams.densities.get(rune.characteristicId) ?? 0;
  return {
    itemLevel: state.level,
    line: { value: line?.value ?? 0, baseMax: line?.baseMax ?? 0, isExo },
    runeWeight: rune.value * density,
    isHeavyExo: isHeavyExo(rune.characteristicId, isExo, probabilityParams),
    residualPool: state.residualPool,
    weightBudget,
    overCapUsage: overCapUsageAfter(state, rune, engineParams),
  };
}

export function simulateRuneAttempts(
  state: ForgemagieItemState,
  rune: Rune,
  engineParams: EngineParams,
  probabilityParams: ProbabilityParams,
  rng: Rng,
  options: MonteCarloOptions
): MonteCarloResult {
  const model = options.modelName ?? probabilityParams.model;
  const input = buildProbabilityInput(state, rune, engineParams, probabilityParams, options.weightBudget ?? 0);
  const probabilities = computeOutcomeProbabilities(input, probabilityParams, model);

  const outcomes: Record<RuneOutcome, number> = { SC: 0, SN: 0, EC: 0 };
  const finalStates = new Map<string, FinalStateBucket>();
  let refused = 0;

  for (let i = 0; i < options.runs; i++) {
    const outcome = drawOutcome(probabilities, rng);
    outcomes[outcome]++;
    const result = applyRune(state, rune, outcome, engineParams, rng);
    if (!result.accepted) refused++;
    const key = stateKey(result.state);
    const bucket = finalStates.get(key);
    if (bucket) bucket.count++;
    else finalStates.set(key, { count: 1, state: result.state });
  }

  const n = Math.max(1, options.runs);
  return {
    runs: options.runs,
    model,
    probabilities,
    outcomes,
    frequencies: { SC: outcomes.SC / n, SN: outcomes.SN / n, EC: outcomes.EC / n },
    refused,
    finalStates,
  };
}
