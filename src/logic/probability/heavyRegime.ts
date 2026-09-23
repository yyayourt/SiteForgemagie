/**
 * RÉGIME « 1 % / SUCCÈS CRITIQUE SEULEMENT » — qu'est-ce qui le déclenche ?
 *
 * Deux règles, sélectionnées par `params.probability.heavyExoRule` (stratégies
 * interchangeables, CLAUDE.md) :
 *
 * - `characteristic_list` (2026-09-10 → 2026-09-16) : seule la liste
 *   `heavyExoCharacteristics` (PA, PM, PO, Invocations) compte. Un exo % Dommages distance
 *   est un exo léger à tous ses points.
 * - `cumulative_weight` (défaut depuis le 2026-09-16) : la liste, OU un **poids non naturel
 *   de la ligne APRÈS la rune** ≥ `heavyExoWeightThreshold` (30). Un exo % Dommages distance
 *   (densité 15) est léger au 1ᵉʳ point (15) et passe en régime 1 % au 2ᵉ (30).
 *
 * STATUT de la règle `cumulative_weight` : `HYPOTHÈSE COMMUNAUTAIRE`. Deux sources
 * indépendantes convergent — Fashionista Smithmagic Lab (Unity 3.6.10.10, R5) : « A line
 * that stands 30 weight or more past the item's own roll only passes on a critical success
 * … and % spell damage from its second point » ; témoignage de Yanis (2026-09-16, joueur,
 * sans capture donc pas R1) : « à partir du deuxième on passe à 30 de puits donc 1 % ».
 * Aucune source Ankama. Réfutation : des SN observés au 2ᵉ point d'un % Do.
 *
 * La liste reste consultée sous les deux règles : PA (100), PM (90), PO (51) et Invocations
 * (30) dépassent 30 dès le 1ᵉʳ point, les deux règles coïncident donc pour eux — la liste
 * n'est qu'un garde-fou contre une densité mal renseignée.
 *
 * `heavyExoIncludeOvermax` (INCONNU, faux) : Fashionista écrit « past the item's own roll »,
 * ce qui couvre littéralement l'overmax d'une ligne naturelle. Personne d'autre ne le dit.
 */

import type { ProbabilityParams } from '../../data/params';

export interface HeavyRegimeQuery {
  characteristicId: number;
  /** Ligne exotique (absente du patron). */
  isExo: boolean;
  /**
   * Poids NON NATUREL de la ligne après la rune : exo → valeur totale × densité ;
   * ligne naturelle → max(0, valeur − jet max) × densité. Voir `nonNaturalLineWeightAfter`.
   */
  nonNaturalWeightAfter: number;
}

/** Exo lourd au sens de la LISTE seule (règle `characteristic_list`, et garde-fou de l'autre). */
export function isHeavyExo(characteristicId: number, isExo: boolean, params: ProbabilityParams): boolean {
  return isExo && params.heavyExoCharacteristics.includes(characteristicId);
}

/**
 * Ce qui fait entrer la tentative dans le régime « SC seul », ou `null` si elle n'y est pas.
 * - `list` : caractéristique de la liste (PA, PM, PO, Invocations). pSC = 1 %, plancher du
 *   tutoriel ; mesuré à 1,11 % sur l'exo PM d'un Gelano (Fek 10 000 runes, Dasech 8 949).
 * - `cumulative` : poids non naturel de la ligne ≥ seuil (2ᵉ point d'un % Do…). pSC =
 *   `cumulativeRegimeSc`, mesuré à 3,4 % sans aucun SN (Waveformer, bêta 3.6, 10–15 k runes).
 * La liste a priorité : un PA reste `list` quel que soit son poids.
 */
export type HeavyRegimeTrigger = 'list' | 'cumulative';

export function heavyRegimeTriggerOf(q: HeavyRegimeQuery, params: ProbabilityParams): HeavyRegimeTrigger | null {
  if (isHeavyExo(q.characteristicId, q.isExo, params)) return 'list';
  if (params.heavyExoRule !== 'cumulative_weight') return null;
  if (!q.isExo && !params.heavyExoIncludeOvermax) return null;
  return q.nonNaturalWeightAfter >= params.heavyExoWeightThreshold ? 'cumulative' : null;
}

/** La tentative relève-t-elle du régime « SC seul » ? Applique la règle choisie. */
export function isHeavyRegime(q: HeavyRegimeQuery, params: ProbabilityParams): boolean {
  return heavyRegimeTriggerOf(q, params) !== null;
}

/**
 * Poids non naturel d'une ligne après application de `runeValue` points. Pour une ligne
 * naturelle, seule la part au-delà du jet max compte (« past the item's own roll »).
 */
export function nonNaturalLineWeightAfter(
  line: { value: number; baseMax: number; isExo: boolean },
  runeValue: number,
  density: number
): number {
  const after = line.value + Math.max(0, runeValue);
  const nonNatural = line.isExo ? after : Math.max(0, after - line.baseMax);
  return Math.max(0, nonNatural) * Math.max(0, density);
}
