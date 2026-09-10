/**
 * Usage de la borne d'over/exo APRÈS une rune : cumul (part over + exo) de l'objet
 * hypothétique / objectNonNaturalCap (le plafond PAR OBJET, distinct du plafond par effet
 * depuis la scission du 2026-09-10 ; les deux valent 101 par défaut, la mesure est donc
 * inchangée). Même mesure que le moteur (engine/overCap, lecture
 * cumulée) : part over = (valeur − jet max) × densité, exo = valeur × densité.
 *
 * Sert au terme d du modèle official_factors_linear (INCONNU, 0 par défaut) et à
 * l'affichage « borne après la rune » de l'atelier. Avec overCapExcess.behaviour = truncate,
 * la rune est mesurée telle qu'elle s'appliquerait (tronquée), donc l'usage reste ≤ 1 ; en
 * refuse, il peut dépasser 1 (rune refusée) et le modèle borne le terme à [0, 1].
 */

import type { EngineParams } from '../../data/params';
import type { ForgemagieItemState, Rune } from '../../types/forgemagie';
import { withRuneApplied } from '../engine/applyRune';
import { maxApplicableRuneValue } from '../engine/overCap';
import { lineOverWeight } from '../engine/weights';

export function overCapUsageAfter(state: ForgemagieItemState, rune: Rune, engineParams: EngineParams): number {
  if (engineParams.objectNonNaturalCap <= 0) return 0;
  const applied = engineParams.overCapExcess.behaviour === 'truncate' ? { ...rune, value: maxApplicableRuneValue(state, rune, engineParams) } : rune;
  const after = withRuneApplied(state, applied);
  const total = after.lines.reduce((sum, l) => sum + lineOverWeight(l, engineParams), 0);
  return Math.max(0, total / engineParams.objectNonNaturalCap);
}
