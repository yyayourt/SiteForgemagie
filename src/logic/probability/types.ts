/**
 * MODÈLE probabiliste SC/SN/EC.
 *
 * La formule serveur est SECRÈTE (forum officiel, docs/knowledge). Tout ce qui sort d'ici est
 * un modèle paramétré (empirical_params.json → probability), jamais une reproduction, et
 * l'interface doit toujours l'afficher comme tel.
 */

import type { ProbabilityParams } from '../../data/params';

export interface ProbabilityInput {
  /** Niveau de l'objet — facteur cité par Ankama. */
  itemLevel: number;
  /** Ligne visée : proximité du jet max — facteur cité par Ankama. baseMax = 0 pour un exo. */
  line: { value: number; baseMax: number; isExo: boolean };
  /** Poids de la rune (valeur × densité). */
  runeWeight: number;
  /** Exo lourd (PA/PM/PO) : plancher officiel 1 % au lieu de 15 %. */
  isHeavyExo: boolean;
  /** Reliquat serveur (état propre). Aucun modèle certain ne l'utilise. */
  residualPool: number;
  /** Budget de planification (dérivé de l'état visible). Utilisé seulement par pool_ratio_legacy. */
  weightBudget: number;
  /**
   * Usage de la borne d'over/exo APRÈS la rune : cumul (part over + exo) / overCapWeight.
   * 0 = aucun over ni exo, 1 = exactement à la borne. Optionnel : absent = 0. Utilisé par le
   * terme d de official_factors_linear (INCONNU, nul par défaut).
   */
  overCapUsage?: number;
}

export interface ProbabilityOutput {
  pSC: number;
  pSN: number;
  pEC: number;
}

export interface ProbabilityModel {
  readonly name: ProbabilityParams['model'];
  /** Probabilités BRUTES du modèle, avant les bornes officielles. Somme = 1. */
  compute(input: ProbabilityInput, params: ProbabilityParams): ProbabilityOutput;
}

/** Distance normalisée au jet maximal : 0 = ligne au jet parfait (ou exo), 1 = ligne vide. */
export function distanceToMax(line: ProbabilityInput['line']): number {
  if (line.isExo || line.baseMax <= 0) return 0;
  return Math.min(1, Math.max(0, (line.baseMax - line.value) / line.baseMax));
}

/** Répartit le complément de pSC entre SN et EC selon la part d'EC, en bornant dans [0, 1]. */
export function splitComplement(pSC: number, ecShare: number): ProbabilityOutput {
  const sc = Math.min(1, Math.max(0, pSC));
  const share = Math.min(1, Math.max(0, ecShare));
  const rest = 1 - sc;
  return { pSC: sc, pSN: rest * (1 - share), pEC: rest * share };
}
