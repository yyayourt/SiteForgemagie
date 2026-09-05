/**
 * Étape « Sélection des pertes » : QUELLE ligne perd du poids.
 *
 * La loi réelle est INCONNUE (docs/knowledge : modèles A–E concurrents, aucune expérience
 * publique discriminante). Trois stratégies interchangeables, choisies par
 * empirical_params.json → lossSelection.strategy. Le RNG est injecté : mêmes entrées,
 * même sortie.
 */

import type { LossSelectionStrategyName } from '../../data/params';
import type { ItemLine, Rng } from '../../types/forgemagie';

/** Ligne candidate à une perte, avec sa densité résolue. */
export interface LossCandidate {
  line: ItemLine;
  density: number;
}

export interface LossSelectionStrategy {
  readonly name: LossSelectionStrategyName;
  /** Choisit une candidate parmi une liste non vide. */
  pick(candidates: LossCandidate[], rng: Rng): LossCandidate;
}

/** Tirage pondéré générique ; les poids nuls ou négatifs sont traités comme 0. */
function pickWeighted(candidates: LossCandidate[], weights: number[], rng: Rng): LossCandidate {
  const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
  if (total <= 0) {
    return candidates[Math.min(candidates.length - 1, Math.floor(rng.next() * candidates.length))];
  }
  let roll = rng.next() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= Math.max(0, weights[i]);
    if (roll < 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

/** Modèle A : équiprobable parmi les lignes admissibles (pseudo-code du PDF audité). */
export const uniformStrategy: LossSelectionStrategy = {
  name: 'uniform',
  pick(candidates, rng) {
    return candidates[Math.min(candidates.length - 1, Math.floor(rng.next() * candidates.length))];
  },
};

/** Modèle B : probabilité ∝ densité unitaire de la ligne. */
export const weightedByWeightStrategy: LossSelectionStrategy = {
  name: 'weighted_by_weight',
  pick(candidates, rng) {
    return pickWeighted(candidates, candidates.map((c) => c.density), rng);
  },
};

/** Modèle C : probabilité ∝ valeur × densité (« masse magique » de la ligne). */
export const weightedByValueTimesWeightStrategy: LossSelectionStrategy = {
  name: 'weighted_by_value_times_weight',
  pick(candidates, rng) {
    return pickWeighted(candidates, candidates.map((c) => c.line.value * c.density), rng);
  },
};

const STRATEGIES: Record<LossSelectionStrategyName, LossSelectionStrategy> = {
  uniform: uniformStrategy,
  weighted_by_weight: weightedByWeightStrategy,
  weighted_by_value_times_weight: weightedByValueTimesWeightStrategy,
};

export function getLossSelectionStrategy(name: LossSelectionStrategyName): LossSelectionStrategy {
  const strategy = STRATEGIES[name];
  if (!strategy) throw new Error(`Unknown loss selection strategy: ${name}`);
  return strategy;
}
