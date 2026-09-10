/**
 * Accès typé à empirical_params.json : tout ce qui n'est PAS SOURCE PRIMAIRE.
 *
 * Aucune de ces valeurs ne doit être recopiée en dur ailleurs dans le code.
 * Chaque lecture passe par `readParam(path, overrides)` : le panneau « Paramètres avancés »
 * fournit des surcharges (profil) qui s'appliquent sans modifier le fichier.
 * `getEngineParams()` / `getBrisageParams()` / `getProbabilityParams()` construisent les
 * objets consommés par src/logic/* ; sans argument, ils renvoient les valeurs du fichier.
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

/** Surcharges de paramètres : chemin ("params.overCapWeight", "densities.11") → valeur. */
export type ParamOverrides = Readonly<Record<string, unknown>>;

export type OverCapScope = 'per_line' | 'global';
/** Ce que la borne mesure sur une ligne en over/exo : valeur totale (défaut) ou seule la part over. */
export type OverCapLineBasis = 'total_value' | 'over_part';
/** Rune qui dépasserait la borne : tronquée à la borne (défaut) ou refusée entière. */
export type OverCapExcessBehaviour = 'truncate' | 'refuse';
/** Poids retenu pour la perte d'une rune tronquée : rune entière (défaut) ou part appliquée. */
export type OverCapExcessLossBasis = 'full_rune' | 'applied_only';
export type LossSelectionStrategyName =
  | 'uniform'
  | 'weighted_by_weight'
  | 'weighted_by_value_times_weight';
export type NonPositiveLineContribution = 'skip' | 'offset';
export type UnpayableSnBehaviour = 'ec_no_effect' | 'take_all_remaining';
export type TranscendenceRank = 'Ta' | 'Pata' | 'Rata';
/** { "<characteristicId>": { Ta?: n, Pata?: n, Rata?: n } } */
export type TranscendenceThresholds = Record<string, Partial<Record<TranscendenceRank, number>>>;
export type ProbabilityModelName =
  | 'official_factors_linear'
  | 'pool_ratio_legacy'
  | 'lookup_table'
  | 'devblog_1_27';
/** Consommation du reliquat lors d'une perte. Une seule implementation : le comportement actuel. */
export type PoolConsumptionRuleName = 'absorb_first';
/** Loi du jet de craft (INCONNU) : voir src/logic/craft/rollDistributions.ts. */
export type RollDistributionName = 'uniform' | 'triangular';

export const PARAMS_META = {
  schemaVersion: paramsJson.schemaVersion,
  gameVersion: paramsJson.gameVersion,
  updatedAt: paramsJson.updatedAt,
};

// ─── Lecture par chemin ──────────────────────────────────────────────────────

function nodeAt(path: string): unknown {
  let node: unknown = paramsJson;
  for (const part of path.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

/** Entrée complète d'un paramètre (valeur du fichier, statut, source…). */
export function getParamEntry<T = unknown>(path: string): ParamEntry<T> | undefined {
  const node = nodeAt(path);
  if (typeof node === 'object' && node !== null && 'value' in node && 'status' in node) return node as ParamEntry<T>;
  return undefined;
}

/** Valeur effective d'un paramètre : surcharge si présente, sinon valeur du fichier. */
export function readParam<T>(path: string, overrides?: ParamOverrides): T {
  if (overrides && path in overrides) return overrides[path] as T;
  const entry = getParamEntry<T>(path);
  if (!entry) throw new Error(`Paramètre inconnu : ${path}`);
  return entry.value;
}

// ─── Densités ────────────────────────────────────────────────────────────────

/** Densités du fichier par characteristicId (les clés commençant par `$` sont des commentaires). */
export const DENSITIES: ReadonlyMap<number, DensityParam> = new Map(
  Object.entries(paramsJson.densities as Record<string, DensityParam | string>)
    .filter((entry): entry is [string, DensityParam] => !entry[0].startsWith('$'))
    .map(([id, param]) => [Number(id), param])
);

/** Poids par point d'une caractéristique (surcharges honorées), ou undefined si non documenté. */
export function getDensity(characteristicId: number, overrides?: ParamOverrides): number | undefined {
  const path = `densities.${characteristicId}`;
  if (overrides && path in overrides) return overrides[path] as number;
  return DENSITIES.get(characteristicId)?.value;
}

export function getDensityParam(characteristicId: number): DensityParam | undefined {
  return DENSITIES.get(characteristicId);
}

/** Carte characteristicId → densité effective. */
export function getDensityMap(overrides?: ParamOverrides): ReadonlyMap<number, number> {
  return new Map([...DENSITIES.keys()].map((id) => [id, getDensity(id, overrides)!]));
}

/** Caractéristiques dotées d'une densité (donc pesables dans le budget de poids). */
export const CHARACTERISTICS_WITH_DENSITY: readonly number[] = [...DENSITIES.keys()];

// ─── Bornes d'over/exo ───────────────────────────────────────────────────────

/** Poids maximal d'over/exo (HYPOTHÈSE COMMUNAUTAIRE, défaut 101). */
export const OVER_CAP_WEIGHT: number = readParam<number>('params.overCapWeight');
/** Portée de la borne : par ligne ou globale (CONTRADICTION, défaut per_line provisoire). */
export const OVER_CAP_SCOPE: OverCapScope = readParam<OverCapScope>('params.overCapScope');

export function getOverCapWeight(overrides?: ParamOverrides): number {
  return readParam<number>('params.overCapWeight', overrides);
}
/** Plafond PAR OBJET du cumul over/exo (INCONNU, initialise a 101 : comportement inchange). */
export function getObjectNonNaturalCap(overrides?: ParamOverrides): number {
  return readParam<number>('params.objectNonNaturalCap', overrides);
}
export function getOverCapScope(overrides?: ParamOverrides): OverCapScope {
  return readParam<OverCapScope>('params.overCapScope', overrides);
}
export function getOverCapLineBasis(overrides?: ParamOverrides): OverCapLineBasis {
  return readParam<OverCapLineBasis>('params.overCapLineBasis', overrides);
}

// ─── Moteur (règles + reliquat) ──────────────────────────────────────────────

/** Paramètres du moteur de forgemagie (src/logic/engine). Tous non certains. */
export interface EngineParams {
  /** characteristicId → poids par point */
  densities: ReadonlyMap<number, number>;
  /** Plafond PAR EFFET (DevBlog 1.27) : ce que peut peser une ligne en over/exo. */
  overCapWeight: number;
  /**
   * Plafond PAR OBJET des puissances non-naturelles (DevBlog 1.27, plafond DISTINCT dont
   * Ankama ne donne pas la valeur). INCONNU, encadre [100 ; 190[, initialise a 101.
   */
  objectNonNaturalCap: number;
  overCapScope: OverCapScope;
  /** HYPOTHÈSE COMMUNAUTAIRE : la borne s'applique à la valeur totale d'une ligne en over (505 vita), pas à sa part over. */
  overCapLineBasis: OverCapLineBasis;
  overCapExcess: {
    /** HYPOTHÈSE COMMUNAUTAIRE : la rune s'arrête à la borne au lieu d'être refusée. */
    behaviour: OverCapExcessBehaviour;
    /** INCONNU : perte mesurée sur la rune entière ou sur la part appliquée. */
    lossBasis: OverCapExcessLossBasis;
  };
  lossSelection: {
    strategy: LossSelectionStrategyName;
    prioritizeOverExo: boolean;
    /** INCONNU, jamais observé : SN dont la perte ne peut pas être payée. */
    unpayableSn: UnpayableSnBehaviour;
  };
  residualPool: {
    resetOnEquipOrMarket: boolean;
    /** Informatif (CONTRADICTION) : le client affiche-t-il le reliquat ? Sans effet sur le moteur. */
    visibleInClient: boolean;
    /** SEAM : regle de consommation du reliquat. Une seule implementation aujourd'hui. */
    poolConsumptionRule: PoolConsumptionRuleName;
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

export function getEngineParams(overrides?: ParamOverrides): EngineParams {
  const r = <T,>(p: string) => readParam<T>(p, overrides);
  return {
    densities: getDensityMap(overrides),
    overCapWeight: r<number>('params.overCapWeight'),
    objectNonNaturalCap: r<number>('params.objectNonNaturalCap'),
    overCapScope: r<OverCapScope>('params.overCapScope'),
    overCapLineBasis: r<OverCapLineBasis>('params.overCapLineBasis'),
    overCapExcess: {
      behaviour: r<OverCapExcessBehaviour>('params.overCapExcess.behaviour'),
      lossBasis: r<OverCapExcessLossBasis>('params.overCapExcess.lossBasis'),
    },
    lossSelection: {
      strategy: r<LossSelectionStrategyName>('params.lossSelection.strategy'),
      prioritizeOverExo: r<boolean>('params.lossSelection.prioritizeOverExo'),
      unpayableSn: r<UnpayableSnBehaviour>('params.lossSelection.unpayableSn'),
    },
    residualPool: {
      resetOnEquipOrMarket: r<boolean>('params.residualPool.resetOnEquipOrMarket'),
      visibleInClient: r<boolean>('params.residualPool.visibleInClient'),
      poolConsumptionRule: r<PoolConsumptionRuleName>('params.residualPool.poolConsumptionRule'),
    },
    transcendence: {
      refuseIfExo: r<boolean>('params.transcendence.refuseIfExo'),
      refuseIfOver: r<boolean>('params.transcendence.refuseIfOver'),
      maxCurrentValueByRank: { ...r<TranscendenceThresholds>('params.transcendence.maxCurrentValueByRank') },
      successRateByRank: { ...r<Record<TranscendenceRank, number>>('params.transcendence.successRateByRank') },
    },
  };
}

// ─── Jet de craft (src/logic/craft) ──────────────────────────────────────────

/** Paramètres du jet de craft : loi de tirage d'une ligne dans [baseMin, baseMax]. INCONNU. */
export interface CraftParams {
  rollDistribution: RollDistributionName;
}

export function getCraftParams(overrides?: ParamOverrides): CraftParams {
  return { rollDistribution: readParam<RollDistributionName>('params.craft.rollDistribution', overrides) };
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

export function getBrisageParams(overrides?: ParamOverrides): BrisageParams {
  const r = <T,>(p: string) => readParam<T>(`params.brisage.${p}`, overrides);
  return {
    densities: getDensityMap(overrides),
    levelFactor: r<number>('levelFactor'),
    constantOffset: r<number>('constantOffset'),
    focusOtherLinesFactor: r<number>('focusOtherLinesFactor'),
    podsDivisor: r<number>('podsDivisor'),
    forceOneForActionStats: r<boolean>('forceOneForActionStats'),
    podsDivisorOnNonFocusLines: r<boolean>('podsDivisorOnNonFocusLines'),
    nonPositiveLineContribution: r<NonPositiveLineContribution>('nonPositiveLineContribution'),
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

/**
 * Facteurs de difficulté cités par le DevBlog Ankama 1.27 : leur EXISTENCE est
 * SOURCE PRIMAIRE — v1.27, leur pente est INCONNUE et vaut 0. Ils sont tenus hors du
 * vecteur ajusté (a/b/c/d/e) pour qu'un ajustement ne les emporte pas avec lui.
 */
export interface StructuralFactors {
  /** Palier FRANC à 80 % de la fourchette du jet : retiré en bloc, pas de montée continue. */
  palier80: number;
  /** SOURCE PRIMAIRE — v1.27 : « si le bonus a un jet fixe, ce facteur n'est pas pris en compte ». */
  fixedRollExempt: boolean;
  /** Objet à un seul jet naturel : plus facile (ajouté à pSC). */
  singleNaturalRoll: number;
  /** Objet éthéré : plus difficile (retiré de pSC). */
  ethereal: number;
  /** Par ligne en over/exo, LIGNE VISÉE COMPRISE : plus difficile (retiré de pSC). */
  overExoCount: number;
}

/** Poids du mélange qui produit le scalaire de difficulté du modèle devblog_1_27. */
export interface DevblogDifficultyWeights {
  rollQuality: number;
  itemQuality: number;
  level: number;
  overCapUsage: number;
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
  /**
   * Vecteur de paramètres AJUSTÉS. d : pente selon l'usage de la borne over/exo après la
   * rune ; e : pente selon la qualité globale de l'objet, hors ligne visée (DevBlog 1.27,
   * facteur le plus important). Tous INCONNU, 0 par défaut pour d et e = sans effet.
   */
  officialFactorsLinear: { a: number; b: number; c: number; d: number; e: number; levelNormalizer: number };
  /** Facteurs structurels du DevBlog 1.27, HORS du vecteur ajusté, pentes nulles. */
  structuralFactors: StructuralFactors;
  /** Poids de difficulté du modèle devblog_1_27 (INCONNU : seul leur ORDRE est sourcé). */
  devblog127: { difficultyWeights: DevblogDifficultyWeights };
  poolRatioLegacy: PoolRatioLegacyCoefficients;
  lookupTable: LookupTableSpec;
}

export function getProbabilityParams(overrides?: ParamOverrides): ProbabilityParams {
  const r = <T,>(p: string) => readParam<T>(`params.probability.${p}`, overrides);
  return {
    model: r<ProbabilityModelName>('model'),
    heavyExoCharacteristics: [...r<number[]>('heavyExoCharacteristics')],
    ecShare: r<number>('ecShare'),
    heavyExoEcShare: r<number>('heavyExoEcShare'),
    officialFactorsLinear: {
      a: r<number>('officialFactorsLinear.a'),
      b: r<number>('officialFactorsLinear.b'),
      c: r<number>('officialFactorsLinear.c'),
      d: r<number>('officialFactorsLinear.d'),
      e: r<number>('officialFactorsLinear.e'),
      levelNormalizer: r<number>('officialFactorsLinear.levelNormalizer'),
    },
    structuralFactors: {
      palier80: r<number>('structuralFactors.palier80'),
      fixedRollExempt: r<boolean>('structuralFactors.fixedRollExempt'),
      singleNaturalRoll: r<number>('structuralFactors.singleNaturalRoll'),
      ethereal: r<number>('structuralFactors.ethereal'),
      overExoCount: r<number>('structuralFactors.overExoCount'),
    },
    devblog127: { difficultyWeights: { ...r<DevblogDifficultyWeights>('devblog127.difficultyWeights') } },
    poolRatioLegacy: { ...r<PoolRatioLegacyCoefficients>('poolRatioLegacy.coefficients') },
    lookupTable: JSON.parse(JSON.stringify(r<LookupTableSpec>('lookupTable.table'))),
  };
}
