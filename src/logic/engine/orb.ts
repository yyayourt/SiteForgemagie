/**
 * Orbes régénérants (typeId 189 dans le dataset).
 *
 * SOURCE PRIMAIRE — devblog 2.58 (https://www.dofus.com/fr/mmorpg/actualites/devblog/billets/1255546) :
 *   un objet ayant reçu une rune de transcendance ne peut plus être réinitialisé par un
 *   orbe. Ce refus est codé en dur (itemLocked).
 *
 * HYPOTHÈSE COMMUNAUTAIRE (docs/knowledge R PARTIE 10, Millenium ; CLAUDE.md « à confirmer ») :
 *   l'orbe réinitialise l'objet à un jet de craft aléatoire et purge over, exo et reliquat.
 *   La loi du jet de craft est INCONNUE : elle vient de empirical_params.json →
 *   craft.rollDistribution et le tirage est délégué à src/logic/craft/rollItem (RNG injecté).
 */

import type { ForgemagieItemState, RefusalReason, Rng } from '../../types/forgemagie';
import type { CraftParams } from '../../data/params';
import { rollItem } from '../craft/rollItem';

export interface OrbResult {
  accepted: boolean;
  reason?: RefusalReason;
  state: ForgemagieItemState;
}

export function applyRegenerationOrb(state: ForgemagieItemState, rng: Rng, craft: CraftParams): OrbResult {
  // SOURCE PRIMAIRE (devblog 2.58) : pas d'orbe sur un objet transcendé
  if (state.itemLocked) return { accepted: false, reason: 'item_locked', state };

  // HYPOTHÈSE COMMUNAUTAIRE : exos retirés, jet de craft retiré (loi = paramètre), reliquat purgé
  const natural = { ...state, lines: state.lines.filter((l) => !l.isExo) };
  const rolled = rollItem(natural, craft, rng);
  return { accepted: true, state: { ...rolled, residualPool: 0 } };
}
