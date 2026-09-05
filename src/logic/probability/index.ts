/**
 * Point d'entrée du MODÈLE probabiliste SC/SN/EC.
 *
 *   computeOutcomeProbabilities(input, params)
 *     = bornes officielles( modèle choisi(input, params) )
 *
 * La formule serveur est secrète : la sortie est une estimation paramétrée, à afficher
 * comme telle (nom du modèle + statut INCONNU).
 */

import type { ProbabilityModelName, ProbabilityParams } from '../../data/params';
import type { Rng, RuneOutcome } from '../../types/forgemagie';
import { applyOfficialBounds } from './constraints';
import { lookupTableModel } from './models/lookupTable';
import { officialFactorsLinearModel } from './models/officialFactorsLinear';
import { poolRatioLegacyModel } from './models/poolRatioLegacy';
import type { ProbabilityInput, ProbabilityModel, ProbabilityOutput } from './types';

export type { ProbabilityInput, ProbabilityModel, ProbabilityOutput } from './types';
export { distanceToMax, splitComplement } from './types';
export { applyOfficialBounds, MIN_SC_NORMAL, MIN_SC_HEAVY_EXO } from './constraints';
export { createSeededRng, mathRandomRng } from './rng';
export { officialFactorsLinearModel, poolRatioLegacyModel, lookupTableModel };

const MODELS: Record<ProbabilityModelName, ProbabilityModel> = {
  official_factors_linear: officialFactorsLinearModel,
  pool_ratio_legacy: poolRatioLegacyModel,
  lookup_table: lookupTableModel,
};

export function getProbabilityModel(name: ProbabilityModelName): ProbabilityModel {
  const model = MODELS[name];
  if (!model) throw new Error(`Unknown probability model: ${name}`);
  return model;
}

export const PROBABILITY_MODEL_NAMES = Object.keys(MODELS) as ProbabilityModelName[];

/** Exo lourd = ligne exotique dont la caractéristique figure dans heavyExoCharacteristics. */
export function isHeavyExo(characteristicId: number, isExo: boolean, params: ProbabilityParams): boolean {
  return isExo && params.heavyExoCharacteristics.includes(characteristicId);
}

/** Probabilités finales (modèle puis bornes SOURCE PRIMAIRE). Somme = 1. */
export function computeOutcomeProbabilities(
  input: ProbabilityInput,
  params: ProbabilityParams,
  modelName: ProbabilityModelName = params.model
): ProbabilityOutput {
  const raw = getProbabilityModel(modelName).compute(input, params);
  return applyOfficialBounds(raw, input.isHeavyExo);
}

/** Tirage d'une issue selon les probabilités, avec RNG injecté. */
export function drawOutcome(probabilities: ProbabilityOutput, rng: Rng): RuneOutcome {
  const roll = rng.next();
  if (roll < probabilities.pSC) return 'SC';
  if (roll < probabilities.pSC + probabilities.pSN) return 'SN';
  return 'EC';
}
