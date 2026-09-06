/**
 * Plafonds d'over/exo par caractéristique, DÉRIVÉS de empirical_params.json :
 *   maxOverOrExo = floor(overCapWeight / densité)
 * = valeur TOTALE maximale d'une ligne en over ou en exo (overCapLineBasis = total_value,
 * défaut : 505 vita, 101 agilité, 33 sagesse), ou marge d'over au-delà du jet max
 * (over_part). Une ligne dont le jet max pèse déjà plus que la borne n'a aucune marge d'over
 * en total_value.
 *
 * Rien n'est écrit à la main ici. Statut du résultat : celui des deux paramètres
 * (overCapWeight : HYPOTHÈSE COMMUNAUTAIRE ; densité : voir chaque entrée).
 * Ce sont des plafonds arithmétiques, pas nécessairement des limites de gameplay
 * (docs/knowledge, audit §9). `getMaxOverOrExo` est le plafond d'une ligne SEULE (lecture
 * « par ligne », ou lecture globale sans autre over/exo) ; `getLineOverRoom` tient compte
 * de la portée active (overCapScope, HYPOTHÈSE COMMUNAUTAIRE : global par défaut) et de
 * ce que les autres lignes consomment déjà. Le moteur applique la même règle (engine/overCap).
 *
 * Toutes les fonctions acceptent des surcharges de paramètres (profil du panneau
 * « Paramètres avancés ») ; sans argument, elles utilisent les valeurs du fichier.
 */

import { getCharacteristicName } from './dataset';
import {
  DENSITIES,
  getDensity,
  getOverCapLineBasis,
  getOverCapScope,
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
 * Marge d'over d'une ligne SEULE (points au-delà du jet max qu'elle peut porter) :
 * - exo : maxOverOrExo (toute sa valeur est de l'over)
 * - naturelle, total_value : max(0, maxOverOrExo − baseMax) ; over_part : maxOverOrExo
 * - sans densité documentée : undefined
 */
export function getLineOverRoomAlone(
  stat: { characteristicId: number; baseMax: number; isExo: boolean },
  overrides?: ParamOverrides
): number | undefined {
  const maxOver = getMaxOverOrExo(stat.characteristicId, overrides);
  if (maxOver === undefined) return undefined;
  if (stat.isExo) return maxOver;
  return getOverCapLineBasis(overrides) === 'total_value' ? Math.max(0, maxOver - stat.baseMax) : maxOver;
}

/**
 * Valeur maximale atteignable sur une ligne SEULE (règle 1 de la borne) :
 * - exo : maxOverOrExo
 * - naturelle : baseMax + marge d'over (total_value : max(baseMax, maxOverOrExo))
 * - sans densité documentée : Infinity (aucune contrainte connue)
 */
export function getStatAbsoluteMax(
  stat: { characteristicId: number; baseMax: number; isExo: boolean },
  overrides?: ParamOverrides
): number {
  const room = getLineOverRoomAlone(stat, overrides);
  if (room === undefined) return Infinity;
  return stat.isExo ? room : stat.baseMax + room;
}

export interface OverCapLine {
  characteristicId: number;
  currentValue: number;
  baseMax: number;
  isExo: boolean;
  isForgemeable: boolean;
}

/** Poids over (valeur − jet max) ou exo (valeur entière) d'une ligne, × densité. Jamais négatif. */
export function getLineOverExoWeight(line: OverCapLine, overrides?: ParamOverrides): number {
  const density = getDensity(line.characteristicId, overrides) ?? 0;
  const points = line.isExo ? Math.max(0, line.currentValue) : Math.max(0, line.currentValue - line.baseMax);
  return points * density;
}

/** Cumul over + exo de l'objet, mesuré sur la part over et l'exo (même règle que le moteur en scope global). */
export function getTotalOverExoWeight(lines: readonly OverCapLine[], overrides?: ParamOverrides): number {
  return lines.filter((l) => l.isForgemeable).reduce((sum, l) => sum + getLineOverExoWeight(l, overrides), 0);
}

/**
 * Points d'over (ou d'exo) qu'une ligne peut porter au maximum dans le contexte de l'objet :
 * - règle 1 (toujours) : marge de la ligne seule (getLineOverRoomAlone) ;
 * - règle 2 (scope global) : en plus, floor((overCapWeight − parts over/exo des AUTRES lignes) / densité).
 * Jamais négatif ; undefined sans densité documentée.
 */
export function getLineOverRoom(stat: OverCapLine, allLines: readonly OverCapLine[], overrides?: ParamOverrides): number | undefined {
  const density = getDensity(stat.characteristicId, overrides);
  const alone = getLineOverRoomAlone(stat, overrides);
  if (density === undefined || density <= 0 || alone === undefined) return undefined;
  if (getOverCapScope(overrides) === 'per_line') return alone;
  const cap = getOverCapWeight(overrides);
  const others = getTotalOverExoWeight(allLines.filter((l) => l.characteristicId !== stat.characteristicId), overrides);
  return Math.max(0, Math.min(alone, Math.floor((cap - others + 1e-9) / density)));
}

/** Valeur maximale atteignable sur une ligne dans le contexte de l'objet (portée active). */
export function getStatAbsoluteMaxInContext(stat: OverCapLine, allLines: readonly OverCapLine[], overrides?: ParamOverrides): number {
  const room = getLineOverRoom(stat, allLines, overrides);
  if (room === undefined) return Infinity;
  return stat.isExo ? room : stat.baseMax + room;
}
