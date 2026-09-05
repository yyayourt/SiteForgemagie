/**
 * Plafonds d'over/exo par caractéristique, DÉRIVÉS de empirical_params.json :
 *   maxOverOrExo = floor(overCapWeight / densité)
 *
 * Rien n'est écrit à la main ici. Statut du résultat : celui des deux paramètres
 * (overCapWeight : HYPOTHÈSE COMMUNAUTAIRE ; densité : voir chaque entrée).
 * Ce sont des plafonds arithmétiques, pas nécessairement des limites de gameplay
 * (docs/knowledge, audit §9). Le calcul ci-dessous est celui de la lecture « par ligne » ;
 * la lecture « globale » (overCapScope) est appliquée par le moteur.
 *
 * Toutes les fonctions acceptent des surcharges de paramètres (profil du panneau
 * « Paramètres avancés ») ; sans argument, elles utilisent les valeurs du fichier.
 */

import { getCharacteristicName } from './dataset';
import {
  DENSITIES,
  getDensity,
  getOverCapWeight,
  type EpistemicStatus,
  type ParamOverrides,
} from './params';

export type StatCapCategory =
  | 'special' // PA, PM, PO, Invocations
  | 'primary' // Vitalité, Sagesse, Force, Int, Chance, Agi, Puissance, Puissance pièges
  | 'damage' // Dommages fixes, élémentaires, critiques, poussée, pièges
  | 'percent_dmg' // % Dommages catégoriels
  | 'resistance' // Résistances fixes et %
  | 'utility'; // reste

export interface StatCapInfo {
  characteristicId: number;
  statName: string;
  weightPerPoint: number;
  /** floor(overCapWeight / weightPerPoint) */
  maxOverOrExo: number;
  category: StatCapCategory;
  status: EpistemicStatus;
  note: string;
}

const CATEGORY_BY_CHARACTERISTIC: Record<StatCapCategory, readonly number[]> = {
  special: [1, 23, 19, 26],
  primary: [11, 12, 10, 15, 13, 14, 25, 69],
  damage: [16, 88, 89, 90, 91, 92, 86, 84, 70],
  percent_dmg: [125, 120, 122, 123],
  resistance: [33, 34, 35, 36, 37, 54, 55, 56, 57, 58, 87, 85, 124, 121, 142, 141],
  utility: [],
};

/** Famille d'affichage d'une caractéristique (glyphe, regroupement du guide). */
export function getStatCategory(characteristicId: number): StatCapCategory {
  for (const [category, ids] of Object.entries(CATEGORY_BY_CHARACTERISTIC)) {
    if (ids.includes(characteristicId)) return category as StatCapCategory;
  }
  return 'utility';
}

export function getMaxOverOrExo(characteristicId: number, overrides?: ParamOverrides): number | undefined {
  const density = getDensity(characteristicId, overrides);
  if (density === undefined || density <= 0) return undefined;
  return Math.floor(getOverCapWeight(overrides) / density);
}

/** Table dérivée, pour affichage (état des connaissances). */
export function buildStatCaps(overrides?: ParamOverrides): StatCapInfo[] {
  const cap = getOverCapWeight(overrides);
  return [...DENSITIES.entries()].map(([id, param]) => {
    const density = getDensity(id, overrides) ?? param.value;
    return {
      characteristicId: id,
      statName: getCharacteristicName(id),
      weightPerPoint: density,
      maxOverOrExo: density > 0 ? Math.floor(cap / density) : 0,
      category: getStatCategory(id),
      status: param.status,
      note: param.note,
    };
  });
}

export const STAT_CAPS: readonly StatCapInfo[] = buildStatCaps();

export const CATEGORY_LABELS: Record<StatCapCategory, string> = {
  special: 'Stats spéciales (PA / PM / PO / Invocations)',
  primary: 'Caractéristiques primaires',
  damage: 'Dommages',
  percent_dmg: '% Dommages',
  resistance: 'Résistances',
  utility: 'Utilitaires',
};

export const CATEGORY_ORDER: StatCapCategory[] = [
  'special',
  'primary',
  'damage',
  'percent_dmg',
  'resistance',
  'utility',
];

/**
 * Valeur maximale atteignable sur une ligne (lecture « par ligne » de la borne) :
 * - exo : maxOverOrExo
 * - naturelle : baseMax + maxOverOrExo
 * - sans densité documentée : Infinity (aucune contrainte connue)
 */
export function getStatAbsoluteMax(
  stat: { characteristicId: number; baseMax: number; isExo: boolean },
  overrides?: ParamOverrides
): number {
  const maxOver = getMaxOverOrExo(stat.characteristicId, overrides);
  if (maxOver === undefined) return Infinity;
  return stat.isExo ? maxOver : stat.baseMax + maxOver;
}
