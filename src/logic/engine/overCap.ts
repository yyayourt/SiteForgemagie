/**
 * Borne d'over/exo (empirical_params.json → overCapWeight, HYPOTHÈSE COMMUNAUTAIRE, 101).
 *
 * Règle 1, toujours appliquée quelle que soit la portée (guide Huz : « L'over maximal d'un
 * item ne peut excéder 101 de densité sur une statistique (Ex : 505 vita, 101 agilité) ») :
 *   si la LIGNE VISÉE est en over ou exotique après la rune, son poids au sens de
 *   overCapLineBasis ≤ overCapWeight. total_value (défaut, HYPOTHÈSE COMMUNAUTAIRE) : valeur
 *   totale × densité, donc 505 vita au total quelle que soit la base, et aucune montée en over
 *   d'une ligne dont le jet naturel pèse déjà plus que la borne. over_part : seule la part
 *   au-delà du jet max compte (ancienne lecture).
 *   Une ligne naturelle qui reste ≤ son jet max n'est jamais concernée.
 *
 * Règle 2, selon overCapScope (HYPOTHÈSE COMMUNAUTAIRE, global par défaut) :
 * - global   : la somme des parts over + exo de TOUTES les lignes ≤ overCapWeight
 *              (Huz : « 10 ini et 1 PA », « 55 vita 1 PM » = 101 cumulés) ;
 * - per_line : rien de plus que la règle 1 (chaque ligne a son propre plafond).
 * Le cumul de la règle 2 est toujours mesuré sur la part over (valeur − jet max) et l'exo :
 * l'exemple du guide « 213/200 vita à lisser avant un exo PA » n'a de sens qu'ainsi.
 */

import type { EngineParams } from '../../data/params';
import type { ForgemagieItemState, ItemLine, Rune } from '../../types/forgemagie';
import { withRuneApplied } from './applyRune';
import { lineCapWeight, lineOverWeight } from './weights';

export interface OverCapCheck {
  allowed: boolean;
  /** Poids over/exo pris en compte après application (ligne ou objet selon le scope). */
  overWeightAfter: number;
  /** Poids de la ligne visée au sens de overCapLineBasis (règle 1), 0 si elle n'est ni over ni exo. */
  lineWeightAfter: number;
  cap: number;
}

/**
 * Vérifie que l'état `after` respecte la borne pour la ligne ciblée.
 * `after` est l'état hypothétique une fois la rune appliquée.
 */
export function checkOverCap(
  after: ForgemagieItemState,
  targetCharacteristicId: number,
  params: EngineParams
): OverCapCheck {
  const cap = params.overCapWeight;
  const EPS = 1e-9;

  // Règle 1 : la ligne visée, seule, ne dépasse jamais la borne (mesure : overCapLineBasis)
  const line = after.lines.find((l) => l.characteristicId === targetCharacteristicId);
  const lineWeightAfter = line ? lineCapWeight(line, params) : 0;
  const lineOk = lineWeightAfter <= cap + EPS;
  if (params.overCapScope === 'per_line') {
    return { allowed: lineOk, overWeightAfter: line ? lineOverWeight(line, params) : 0, lineWeightAfter, cap };
  }

  // Règle 2 (global) : le cumul des parts over + exo de l'objet ne dépasse pas la borne non plus
  const overWeightAfter = after.lines.reduce((sum, l) => sum + lineOverWeight(l, params), 0);
  return { allowed: lineOk && overWeightAfter <= cap + EPS, overWeightAfter, lineWeightAfter, cap };
}

/**
 * Plus grande valeur v ∈ [0, rune.value] telle que la rune (characteristicId, v) respecte la
 * borne (règles 1 et 2). Sert à la troncature (overCapExcess.behaviour = truncate) : la rune
 * s'arrête à la borne au lieu d'être refusée. Renvoie 0 si rien ne peut s'appliquer.
 *
 * La contrainte est monotone en v : on calcule un candidat arithmétique puis on redescend
 * tant que checkOverCap le refuse (arrondis), pour rester exactement cohérent avec la vérification.
 */
export function maxApplicableRuneValue(state: ForgemagieItemState, rune: Rune, params: EngineParams): number {
  const density = params.densities.get(rune.characteristicId);
  if (density === undefined || density <= 0 || rune.value <= 0) return 0;
  const cap = params.overCapWeight;
  const line = state.lines.find((l) => l.characteristicId === rune.characteristicId);
  const value = line?.value ?? 0;
  const baseMax = line && !line.isExo ? line.baseMax : 0;
  const isExo = !line || line.isExo;

  // Règle 1 : total de la ligne (ou part over) ≤ borne, sauf si elle reste ≤ jet max
  const maxTotal = params.overCapLineBasis === 'total_value' || isExo ? Math.floor(cap / density + 1e-9) : baseMax + Math.floor(cap / density + 1e-9);
  let candidate = Math.max(isExo ? -Infinity : baseMax - value, maxTotal - value);

  // Règle 2 (global) : la part over de la ligne ≤ borne − parts over/exo des autres lignes
  if (params.overCapScope === 'global') {
    const others = state.lines
      .filter((l) => l.characteristicId !== rune.characteristicId)
      .reduce((sum, l) => sum + lineOverWeight(l, params), 0);
    const room = Math.floor((cap - others) / density + 1e-9);
    candidate = Math.min(candidate, Math.max(isExo ? -Infinity : baseMax - value, baseMax + room - value));
  }

  let v = Math.min(rune.value, Math.floor(candidate));
  while (v > 0 && !checkOverCap(withRuneApplied(state, { characteristicId: rune.characteristicId, value: v }), rune.characteristicId, params).allowed) v--;
  return Math.max(0, v);
}

/** Vrai si au moins une ligne est en over ou exotique (utilisé par la transcendance). */
export function hasAnyOverOrExo(lines: ItemLine[]): boolean {
  return lines.some((l) => (l.isExo ? l.value > 0 : l.value > l.baseMax));
}
