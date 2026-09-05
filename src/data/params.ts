/**
 * Accès typé à empirical_params.json : tout ce qui n'est PAS SOURCE PRIMAIRE.
 *
 * Aucune de ces valeurs ne doit être recopiée en dur ailleurs dans le code.
 * `getEngineParams()` / `getBrisageParams()` / `getProbabilityParams()` construisent les
 * objets consommés par src/logic/* ; les tests peuvent les surcharger.
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
export type NonPositiveLineContribution = 'skip' | 'offset';
export type TranscendenceRank = 'Ta' | 'Pata' | 'Rata';
/** { "<characteristicId>": { Ta?: n, Pata?: n, Rata?: n } } */
export type TranscendenceThresholds = Record<string, Partial<Record<TranscendenceRank, number>>>;
export type ProbabilityModelName = 'official_factors_linear' | 'pool_ratio_legacy' | 'lookup_table';

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
export const RESIDUAL_VISIBLE_PARAM = p.residualPool.visibleInClient as ParamEntry<boolean>;
export const TRANSCENDENCE_REFUSE_EXO_PARAM = p.transcendence.refuseIfExo as ParamEntry<boolean>;
export const TRANSCENDENCE_REFUSE_OVER_PARAM = p.transcendence.refuseIfOver as ParamEntry<boolean>;
export const TRANSCENDENCE_THRESHOLDS_PARAM = p.transcendence
  .maxCurrentValueByRank as unknown as ParamEntry<TranscendenceThresholds>;
export const TRANSCENDENCE_SUCCESS_RATE_PARAM = p.transcendence.successRateByRank as ParamEntry<
  Record<TranscendenceRank, number>
>;

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

// ─── Moteur (règles + reliquat) ──────────────────────────────────────────────

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
    /** Informatif (CONTRADICTION) : le client affiche-t-il le reliquat ? Sans effet sur le moteur. */
    visibleInClient: boolean;
  };
  transcendence: {
    /** HYPOTHÈSE COMMUNAUTAIRE (JeuxOnLine, annonce 2.49) : refus si un exo est présent. */
    refuseIfExo: boolean;
    /** HYPOTHÈSE COMMUNAUTAIRE (Millenium, guides) : refus si un over est présent. */
    refuseIfOver: boolean;
    /** INCONNU : valeur max de la ligne avant pose, par caractéristique et rang. Vide = aucun seuil. */
    maxCurrentValueByRank: TranscendenceThresholds;
    successRateByRank: Record<TranscendenceRank, number>;
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
      visibleInClient: RESIDUAL_VISIBLE_PARAM.value,
    },
    transcendence: {
      refuseIfExo: TRANSCENDENCE_REFUSE_EXO_PARAM.value,
      refuseIfOver: TRANSCENDENCE_REFUSE_OVER_PARAM.value,
      maxCurrentValueByRank: { ...TRANSCENDENCE_THRESHOLDS_PARAM.value },
      successRateByRank: { ...TRANSCENDENCE_SUCCESS_RATE_PARAM.value },
    },
  };
}

// ─── Brisage ─────────────────────────────────────────────────────────────────

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

// ─── Modèle probabiliste SC/SN/EC (src/logic/probability) ────────────────────

export interface LookupTableCell {
  pSC: number;
  pEC: number;
}

export interface LookupTableSpec {
  /** Bornes croissantes des classes de distance au jet max (∈ [0, 1]). */
  distanceBuckets: number[];
  /** Bornes croissantes des classes de poids de rune. */
  runeWeightBuckets: number[];
  /** cells[distanceIndex][runeWeightIndex] */
  cells: LookupTableCell[][];
}

export interface PoolRatioLegacyCoefficients {
  baseSc: number;
  slopeSc: number;
  maxSc: number;
  minSc: number;
  baseEcPositive: number;
  slopeEcPositive: number;
  minEc: number;
  baseEcNegative: number;
  slopeEcNegative: number;
  maxEc: number;
}

/** Paramètres du MODÈLE probabiliste. Tous INCONNU sauf heavyExoCharacteristics et heavyExoEcShare. */
export interface ProbabilityParams {
  model: ProbabilityModelName;
  /** Caractéristiques dont l'exo relève du plancher 1 % (SOURCE PRIMAIRE pour PA/PM/PO). */
  heavyExoCharacteristics: readonly number[];
  /** Part du complément (1 − pSC) allant à l'EC en FM normale (INCONNU). */
  ecShare: number;
  /** Part du complément allant à l'EC en exo lourd (HYPOTHÈSE COMMUNAUTAIRE, 1 = pas de SN). */
  heavyExoEcShare: number;
  officialFactorsLinear: { a: number; b: number; c: number; levelNormalizer: number };
  poolRatioLegacy: PoolRatioLegacyCoefficients;
  lookupTable: LookupTableSpec;
}

const pr = p.probability;

export function getProbabilityParams(): ProbabilityParams {
  const linear = pr.officialFactorsLinear;
  return {
    model: (pr.model as ParamEntry<ProbabilityModelName>).value,
    heavyExoCharacteristics: [...(pr.heavyExoCharacteristics as ParamEntry<number[]>).value],
    ecShare: (pr.ecShare as ParamEntry<number>).value,
    heavyExoEcShare: (pr.heavyExoEcShare as ParamEntry<number>).value,
    officialFactorsLinear: {
      a: (linear.a as ParamEntry<number>).value,
      b: (linear.b as ParamEntry<number>).value,
      c: (linear.c as ParamEntry<number>).value,
      levelNormalizer: (linear.levelNormalizer as ParamEntry<number>).value,
    },
    poolRatioLegacy: { ...(pr.poolRatioLegacy.coefficients as ParamEntry<PoolRatioLegacyCoefficients>).value },
    lookupTable: JSON.parse(JSON.stringify((pr.lookupTable.table as unknown as ParamEntry<LookupTableSpec>).value)),
  };
}
