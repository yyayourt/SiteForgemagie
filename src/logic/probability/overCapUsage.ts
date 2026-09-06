/**
 * Usage de la borne d'over/exo APRÈS une rune : cumul (part over + exo) de l'objet
 * hypothétique / overCapWeight. Même mesure que le moteur (engine/overCap, lecture
 * cumulée) : part over = (valeur − jet max) × densité, exo = valeur × densité.
 *
 * Sert au terme d du modèle official_factors_linear (INCONNU, 0 par défaut) et à
 * l'affichage « borne après la rune » de l'atelier. Peut dépasser 1 : le moteur refuserait
 * alors la rune ; le modèle borne lui-même le terme à [0, 1].
 */

import type { EngineParams } from '../../data/params';
import type { ForgemagieItemState, Rune } from '../../types/forgemagie';
import { withRuneApplied } from '../engine/applyRune';
import { lineOverWeight } from '../engine/weights';

export function overCapUsageAfter(state: ForgemagieItemState, rune: Rune, engineParams: EngineParams): number {
  if (engineParams.overCapWeight <= 0) return 0;
  const after = withRuneApplied(state, rune);
  const total = after.lines.reduce((sum, l) => sum + lineOverWeight(l, engineParams), 0);
  return Math.max(0, total / engineParams.overCapWeight);
}
