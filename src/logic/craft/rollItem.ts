/**
 * Jet de craft d'un objet : chaque ligne naturelle est tirée dans son intervalle
 * [baseMin, baseMax] selon la loi configurée (empirical_params.json → craft.rollDistribution,
 * INCONNU). Fonction pure, RNG injecté : même graine, même jet.
 *
 * Utilisée par l'orbe régénérant (src/logic/engine/orb.ts) et par la saisie rapide
 * « Jet aléatoire » de l'atelier. Elle ne touche ni au reliquat, ni au verrou, ni aux
 * lignes exotiques (absentes du patron : elles n'ont pas d'intervalle de craft), ni aux
 * lignes verrouillées (objet transcendé). L'appelant décide du sort de ces lignes :
 * l'orbe retire les exos et vide le reliquat, la saisie rapide les laisse en place.
 */

import type { ForgemagieItemState, ItemLine, Rng } from '../../types/forgemagie';
import type { CraftParams } from '../../data/params';
import { getRollDistribution } from './rollDistributions';

/** Une ligne est tirable si elle a un intervalle de craft et n'est pas verrouillée. */
export function isRollable(line: Pick<ItemLine, 'isExo' | 'isLocked'>): boolean {
  return !line.isExo && !line.isLocked;
}

export function rollItem(item: ForgemagieItemState, params: CraftParams, rng: Rng): ForgemagieItemState {
  const draw = getRollDistribution(params.rollDistribution);
  const lines = item.lines.map((line) => {
    if (!isRollable(line)) return line;
    const lo = Math.min(line.baseMin, line.baseMax);
    const hi = Math.max(line.baseMin, line.baseMax);
    // Ligne fixe (lo = hi) : aucun aléa consommé, la valeur est imposée
    return { ...line, value: lo === hi ? hi : draw(lo, hi, rng) };
  });
  return { ...item, lines };
}
