/**
 * Lois de tirage d'une ligne de craft dans [lo, hi] (entiers inclus).
 *
 * INCONNU — la loi réelle du jet de craft n'est pas publique (empirical_params.json →
 * craft.rollDistribution). Chaque loi est une stratégie interchangeable choisie par la
 * configuration, jamais par un `if` dispersé.
 *
 * - uniform : chaque entier de [lo, hi] est équiprobable. Défaut, faute de mieux.
 * - triangular : moyenne de deux tirages uniformes, favorise le milieu de l'intervalle.
 *   SANS SOURCE : fournie uniquement pour tester une hypothèse de joueur.
 */

import type { Rng } from '../../types/forgemagie';
import type { RollDistributionName } from '../../data/params';

/** Tire un entier dans [lo, hi] (lo ≤ hi). */
export type RollDistribution = (lo: number, hi: number, rng: Rng) => number;

/** Projette u ∈ [0, 1) sur un entier de [lo, hi], borné même si u atteint 1 par arrondi. */
function toInteger(u: number, lo: number, hi: number): number {
  const span = hi - lo;
  return lo + Math.min(span, Math.max(0, Math.floor(u * (span + 1))));
}

export const uniformDistribution: RollDistribution = (lo, hi, rng) => toInteger(rng.next(), lo, hi);

export const triangularDistribution: RollDistribution = (lo, hi, rng) => toInteger((rng.next() + rng.next()) / 2, lo, hi);

const DISTRIBUTIONS: Record<RollDistributionName, RollDistribution> = {
  uniform: uniformDistribution,
  triangular: triangularDistribution,
};

export function getRollDistribution(name: RollDistributionName): RollDistribution {
  const d = DISTRIBUTIONS[name];
  if (!d) throw new Error(`Loi de jet inconnue : ${name}`);
  return d;
}
