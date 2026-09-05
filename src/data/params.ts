/**
 * Accès typé à empirical_params.json : tout ce qui n'est PAS SOURCE PRIMAIRE.
 *
 * Aucune de ces valeurs ne doit être recopiée en dur ailleurs dans le code.
 * Le panneau « Paramètres avancés » (phase ultérieure) permettra de les surcharger ;
 * pour l'instant seules les valeurs du fichier sont exposées.
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
  bounds: { min?: number; max?: number; enum?: readonly string[] };
  default: T;
}

export interface DensityParam extends ParamEntry<number> {
  /** Nom documentaire (le nom d'affichage vient du dataset) */
  name: string;
}

export type OverCapScope = 'per_line' | 'global';

export const PARAMS_META = {
  schemaVersion: paramsJson.schemaVersion,
  updatedAt: paramsJson.updatedAt,
};

export const OVER_CAP_WEIGHT_PARAM = paramsJson.params.overCapWeight as ParamEntry<number>;
export const OVER_CAP_SCOPE_PARAM = paramsJson.params.overCapScope as ParamEntry<OverCapScope>;

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
