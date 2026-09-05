/**
 * Reliquat serveur (residualPool) : état propre de l'objet, ≥ 0.
 *
 * Sa purge lors de l'équipement, de la mise en HDV ou de l'échange est une
 * HYPOTHÈSE COMMUNAUTAIRE (empirical_params.json → residualPool.resetOnEquipOrMarket ;
 * JeuxOnLine la confirme, l'audit la classe D). Elle n'est appliquée que si le paramètre
 * est vrai.
 */

import type { EngineParams } from '../../data/params';
import type { ForgemagieItemState } from '../../types/forgemagie';

export type ResidualResetEvent = 'equip' | 'market' | 'trade';

/** État après un événement susceptible de purger le reliquat. */
export function onItemLeavesWorkshop(
  state: ForgemagieItemState,
  _event: ResidualResetEvent,
  params: EngineParams
): ForgemagieItemState {
  if (!params.residualPool.resetOnEquipOrMarket) return state;
  return { ...state, residualPool: 0 };
}

/** Garde-fou : un reliquat ne peut pas être négatif. */
export function normalizeResidual(value: number): number {
  return value > 0 ? value : 0;
}
