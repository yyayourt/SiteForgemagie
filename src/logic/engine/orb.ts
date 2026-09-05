/**
 * Orbes régénérants (typeId 189 dans le dataset).
 *
 * SOURCE PRIMAIRE — devblog 2.58 (https://www.dofus.com/fr/mmorpg/actualites/devblog/billets/1255546) :
 *   un objet ayant reçu une rune de transcendance ne peut plus être réinitialisé par un
 *   orbe. Ce refus est codé en dur (itemLocked).
 *
 * HYPOTHÈSE COMMUNAUTAIRE (docs/knowledge R PARTIE 10, Millenium ; CLAUDE.md « à confirmer ») :
 *   l'orbe réinitialise l'objet à un jet de craft aléatoire et purge over, exo et reliquat.
 *   La loi du jet de craft est INCONNUE : un tirage uniforme entier dans [baseMin, baseMax]
 *   est utilisé ici faute de mieux, avec RNG injecté.
 */

import type { ForgemagieItemState, ItemLine, RefusalReason, Rng } from '../../types/forgemagie';

export interface OrbResult {
  accepted: boolean;
  reason?: RefusalReason;
  state: ForgemagieItemState;
}

export function applyRegenerationOrb(state: ForgemagieItemState, rng: Rng): OrbResult {
  // SOURCE PRIMAIRE (devblog 2.58) : pas d'orbe sur un objet transcendé
  if (state.itemLocked) return { accepted: false, reason: 'item_locked', state };

  // HYPOTHÈSE COMMUNAUTAIRE : jet de craft aléatoire, exos retirés, reliquat purgé
  const lines: ItemLine[] = state.lines
    .filter((l) => !l.isExo)
    .map((l) => {
      const span = l.baseMax - l.baseMin;
      const roll = span > 0 ? l.baseMin + Math.min(span, Math.floor(rng.next() * (span + 1))) : l.baseMax;
      return { ...l, value: roll };
    });

  return { accepted: true, state: { ...state, lines, residualPool: 0 } };
}
