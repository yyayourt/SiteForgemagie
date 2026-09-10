/**
 * Point d'entrée du MODÈLE probabiliste SC/SN/EC.
 *
 *   estimateOutcome(input, params)
 *     = bornes officielles( garde-fou d'exotisme( modèle choisi(input, params) ) )
 *
 * Trois étapes, dans cet ordre et jamais un autre :
 *   1. le MODÈLE propose un triplet (INCONNU, paramétré) ;
 *   2. le GARDE-FOU D'EXOTISME (exoGuard.ts) le remplace pour toute création d'effet — par
 *      1 % pour un exo lourd, par un INTERVALLE explicite sinon ;
 *   3. les BORNES OFFICIELLES (constraints.ts) relèvent pSC au plancher primaire s'il y en a un.
 *
 * La formule serveur est secrète : la sortie est une estimation paramétrée, à afficher comme
 * telle (nom du modèle + statut). `estimateOutcome` porte ce statut ;
 * `computeOutcomeProbabilities` n'en renvoie que le triplet, pour la simulation.
 */

import type { ProbabilityModelName, ProbabilityParams } from '../../data/params';
import type { Rng, RuneOutcome } from '../../types/forgemagie';
import { applyOfficialBounds } from './constraints';
import { guardExoticEstimate, type ProbabilityEstimate } from './exoGuard';
import { devblog127Model } from './models/devblog127';
import { lookupTableModel } from './models/lookupTable';
import { officialFactorsLinearModel } from './models/officialFactorsLinear';
import { poolRatioLegacyModel } from './models/poolRatioLegacy';
import { attemptKindOf, type ProbabilityInput, type ProbabilityModel, type ProbabilityOutput } from './types';

export type {
  ProbabilityInput,
  ProbabilityModel,
  ProbabilityOutput,
  AttemptKind,
  StructuralFlags,
} from './types';
export {
  distanceToMax,
  splitComplement,
  attemptKindOf,
  structuralFlagsOf,
  NEUTRAL_STRUCTURAL_FLAGS,
} from './types';
export {
  applyOfficialBounds,
  officialFloorFor,
  isHeavyExoRateVerbatim,
  MIN_SC_NORMAL,
  MIN_SC_HEAVY_EXO,
  HEAVY_EXO_VERBATIM,
} from './constraints';
export {
  guardExoticEstimate,
  guardCeilingFor,
  heavyExoProbabilities,
  samplingFor,
  SAMPLING_BOUND_LABEL,
  type ProbabilityEstimate,
} from './exoGuard';
export {
  ANCHOR_BEST_REROLL,
  ANCHOR_PERFECT_ROLL,
  ANCHOR_WORST_REROLL,
  ANCHOR_BEST_CREATION,
  ANCHOR_WORST_CREATION,
  NORMAL_ANCHORS,
  MAX_SN,
} from './devblogAnchors';
export { itemQualityExcluding, naturalLineCount, overExoLineCount } from './itemQuality';
export { createSeededRng, mathRandomRng } from './rng';
export { overCapUsageAfter } from './overCapUsage';
export { officialFactorsLinearModel, poolRatioLegacyModel, lookupTableModel, devblog127Model };

const MODELS: Record<ProbabilityModelName, ProbabilityModel> = {
  official_factors_linear: officialFactorsLinearModel,
  pool_ratio_legacy: poolRatioLegacyModel,
  lookup_table: lookupTableModel,
  devblog_1_27: devblog127Model,
};

/**
 * Libellés d'affichage. Un modèle daté PORTE SA DATE : c'est ce qui empêche de prendre les
 * chiffres de 2010 pour une mesure Unity.
 */
export const PROBABILITY_MODEL_LABELS: Record<ProbabilityModelName, string> = {
  official_factors_linear: 'facteurs officiels (linéaire)',
  pool_ratio_legacy: 'ratio de puits (ancien)',
  lookup_table: 'table éditable',
  devblog_1_27: 'ancres DevBlog 1.27 (2010)',
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

/**
 * Estimation complète : triplet OU intervalle, avec son statut et la nature de la tentative.
 * C'est ce que l'interface doit afficher — jamais un point là où le garde-fou rend un
 * intervalle.
 */
export function estimateOutcome(
  input: ProbabilityInput,
  params: ProbabilityParams,
  modelName: ProbabilityModelName = params.model
): ProbabilityEstimate {
  const attemptKind = attemptKindOf(input.line, input.runeValue, input.isHeavyExo);

  // Garde-fou d'exotisme : il PRÉCÈDE le modèle sur toute création d'effet.
  const guarded = guardExoticEstimate(attemptKind, params);
  if (guarded) return guarded;

  const raw = getProbabilityModel(modelName).compute(input, params);
  const probabilities = applyOfficialBounds(raw, attemptKind);
  return { kind: 'point', probabilities, sampling: probabilities, status: 'MODÈLE', attemptKind };
}

/**
 * Triplet utilisé pour TIRER une issue. Pour une création d'effet non lourde, c'est la borne
 * choisie par `probability.unknownIntervalSampling` (`worst` par défaut : ancre 5). Un tirage
 * exige un point, et prendre le haut de l'intervalle réintroduirait l'optimisme que le
 * garde-fou supprime.
 *
 * ⚠️ Le Monte Carlo passe par ici : sur une création d'effet non lourde, il hérite du biais
 * de ce paramètre et n'explore PAS l'intervalle. Voir exoGuard.ts.
 *
 * Conserve la signature d'avant le 2026-09-10 pour tous les appelants qui n'ont besoin que
 * d'un triplet (Monte Carlo, tirage d'issue).
 */
export function computeOutcomeProbabilities(
  input: ProbabilityInput,
  params: ProbabilityParams,
  modelName: ProbabilityModelName = params.model
): ProbabilityOutput {
  return estimateOutcome(input, params, modelName).sampling;
}

/** Tirage d'une issue selon les probabilités, avec RNG injecté. */
export function drawOutcome(probabilities: ProbabilityOutput, rng: Rng): RuneOutcome {
  const roll = rng.next();
  if (roll < probabilities.pSC) return 'SC';
  if (roll < probabilities.pSC + probabilities.pSN) return 'SN';
  return 'EC';
}
