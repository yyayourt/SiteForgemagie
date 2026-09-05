/**
 * Accès typé à empirical_params.json : tout ce qui n'est PAS SOURCE PRIMAIRE.
 *
 * Aucune de ces valeurs ne doit être recopiée en dur ailleurs dans le code.
 * `getEngineParams()` / `getBrisageParams()` construisent les objets consommés par
 * src/logic/engine et src/logic/brisage ; les tests peuvent les surcharger.
 */

import paramsJson from '../../empirical_params.json';

export type EpistemicStatus =
  | 'SOURCE PRIMAIRE'
  | 'MODÈLE EMPIRIQUE'
  | 'HYPOTHÈSE COMMUNAUTAIRE'
  | 'CONTRADICTION'
  | 'INCONNU';

export interface ParamEntry<T> {
  value: T;
  status: EpistemicStatus;
  source: string;
  note: string;
  bounds: { min?: number; max?: number; enum?: readonly (string | boolean)[] };
  default: T;
}

export interface DensityParam extends ParamEntry<number> {
  /** Nom documentaire (le nom d'affichage vient du dataset) */
  name: string;
}

export type OverCapScope = 'per_line' | 'global';
export type LossSelectionStrategyName =
  | 'uniform'
  | 'weighted_by_weight'
  | 'weighted_by_value_times_weight';
export type TranscendenceLockScope = 'line' | 'item';
export type NonPositiveLineContribution = 'skip' | 'offset';

export const PARAMS_META = {
  schemaVersion: paramsJson.schemaVersion,
  gameVersion: paramsJson.gameVersion,
  updatedAt: paramsJson.updatedAt,
};

const p = paramsJson.params;

export const OVER_CAP_WEIGHT_PARAM = p.overCapWeight as ParamEntry<number>;
export const OVER_CAP_SCOPE_PARAM = p.overCapScope as ParamEntry<OverCapScope>;
export const EC_LOSS_FACTOR_PARAM = p.ecLossFactor as ParamEntry<number>;
export const LOSS_STRATEGY_PARAM = p.lossSelection.strategy as ParamEntry<LossSelectionStrategyName>;
export const PRIORITIZE_OVER_EXO_PARAM = p.lossSelection.prioritizeOverExo as ParamEntry<boolean>;
export const RESIDUAL_RESET_PARAM = p.residualPool.resetOnEquipOrMarket as ParamEntry<boolean>;
export const TRANSCENDENCE_LOCK_SCOPE_PARAM = p.transcendence.lockScope as ParamEntry<TranscendenceLockScope>;

/** Poids maximal d'over/exo (HYPOTHÈSE COMMUNAUTAIRE, défaut 101). */
export const OVER_CAP_WEIGHT: number = OVER_CAP_WEIGHT_PARAM.value;

/** Portée de la borne : par ligne ou globale (CONTRADICTION, défaut per_line provisoire). */
export const OVER_CAP_SCOPE: OverCapScope = OVER_CAP_SCOPE_PARAM.value;

/** Densités par characteristicId (les clés commençant par `$` sont des commentaires). */
export const DENSITIES: ReadonlyMap<number, DensityParam> = new Map(
  Object.entries(paramsJson.densities as Record<string, DensityParam | string>)
    .filter((entry): entry is [string, DensityParam] => !entry[0].startsWith('$'))
    .map(([id, param]) => [Number(id), param])
);

/** Poids par point d'une caractéristique, ou undefined si aucune densité n'est documentée. */
export function getDensity(characteristicId: number): number | undefined {
  return DENSITIES.get(characteristicId)?.value;
}

export function getDensityParam(characteristicId: number): DensityParam | undefined {
  return DENSITIES.get(characteristicId);
}

/** Caractéristiques dotées d'une densité (donc pesables dans le budget de poids). */
export const CHARACTERISTICS_WITH_DENSITY: readonly number[] = [...DENSITIES.keys()];

// ─── Objets de paramètres consommés par les moteurs ──────────────────────────

/** Paramètres du moteur de forgemagie (src/logic/engine). Tous non certains. */
export interface EngineParams {
  /** characteristicId → poids par point */
  densities: ReadonlyMap<number, number>;
  overCapWeight: number;
  overCapScope: OverCapScope;
  /** Perte en EC = ecLossFactor × poids de la rune (INCONNU) */
  ecLossFactor: number;
  lossSelection: {
    strategy: LossSelectionStrategyName;
    prioritizeOverExo: boolean;
  };
  residualPool: {
    resetOnEquipOrMarket: boolean;
  };
  transcendence: {
    lockScope: TranscendenceLockScope;
  };
}

export function getEngineParams(): EngineParams {
  return {
    densities: new Map([...DENSITIES.entries()].map(([id, d]) => [id, d.value])),
    overCapWeight: OVER_CAP_WEIGHT_PARAM.value,
    overCapScope: OVER_CAP_SCOPE_PARAM.value,
    ecLossFactor: EC_LOSS_FACTOR_PARAM.value,
    lossSelection: {
      strategy: LOSS_STRATEGY_PARAM.value,
      prioritizeOverExo: PRIORITIZE_OVER_EXO_PARAM.value,
    },
    residualPool: {
      resetOnEquipOrMarket: RESIDUAL_RESET_PARAM.value,
    },
    transcendence: {
      lockScope: TRANSCENDENCE_LOCK_SCOPE_PARAM.value,
    },
  };
}

/** Paramètres de la formule de brisage (src/logic/brisage). */
export interface BrisageParams {
  densities: ReadonlyMap<number, number>;
  levelFactor: number;
  constantOffset: number;
  focusOtherLinesFactor: number;
  podsDivisor: number;
  forceOneForActionStats: boolean;
  podsDivisorOnNonFocusLines: boolean;
  nonPositiveLineContribution: NonPositiveLineContribution;
}

const b = p.brisage;

export function getBrisageParams(): BrisageParams {
  return {
    densities: new Map([...DENSITIES.entries()].map(([id, d]) => [id, d.value])),
    levelFactor: (b.levelFactor as ParamEntry<number>).value,
    constantOffset: (b.constantOffset as ParamEntry<number>).value,
    focusOtherLinesFactor: (b.focusOtherLinesFactor as ParamEntry<number>).value,
    podsDivisor: (b.podsDivisor as ParamEntry<number>).value,
    forceOneForActionStats: (b.forceOneForActionStats as ParamEntry<boolean>).value,
    podsDivisorOnNonFocusLines: (b.podsDivisorOnNonFocusLines as ParamEntry<boolean>).value,
    nonPositiveLineContribution: (b.nonPositiveLineContribution as ParamEntry<NonPositiveLineContribution>).value,
  };
}
