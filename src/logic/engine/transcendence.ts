/**
 * Runes de transcendance — règles SOURCE PRIMAIRE (devblog mise à jour 2.72, 2024-06-18,
 * https://www.dofus.com/fr/mmorpg/actualites/devblog/billets/1713137-devblog-mise-jour-2-72 ;
 * résumé dans docs/knowledge R PARTIE 10 et K) :
 *   - succès garanti (100 %), aucune perte sur les autres lignes ;
 *   - refusée si l'objet possède déjà un over ou un exo ;
 *   - la ligne (ou l'objet : paramètre transcendence.lockScope, HYPOTHÈSE COMMUNAUTAIRE)
 *     est verrouillée ensuite : plus aucune rune dessus ;
 *   - soumise à la borne d'over/exo (overCapWeight / overCapScope).
 * Les valeurs des runes (Ta / Pata / Rata) viennent du dataset (typeId 211).
 */

import type { EngineParams } from '../../data/params';
import type { ApplyRuneResult, ForgemagieItemState, Rune } from '../../types/forgemagie';
import { checkOverCap, hasAnyOverOrExo } from './overCap';
import { getLineDensity, runeWeight } from './weights';

function refused(
  state: ForgemagieItemState,
  reason: ApplyRuneResult['reason'],
  weight: number
): ApplyRuneResult {
  return {
    accepted: false,
    reason,
    state,
    outcome: 'SC',
    runeWeight: weight,
    lossRequested: 0,
    absorbedByResidual: 0,
    losses: [],
    unabsorbedWeight: 0,
    residualPoolBefore: state.residualPool,
    residualPoolAfter: state.residualPool,
  };
}

export function applyTranscendenceRune(
  state: ForgemagieItemState,
  rune: Rune,
  params: EngineParams
): ApplyRuneResult {
  if (getLineDensity(rune.characteristicId, params) === undefined) {
    return refused(state, 'no_density', 0);
  }
  const weight = runeWeight(rune, params);

  if (state.itemLocked) return refused(state, 'item_locked', weight);

  const existing = state.lines.find((l) => l.characteristicId === rune.characteristicId);
  if (existing?.isLocked) return refused(state, 'transcendence_line_already_locked', weight);

  // SOURCE PRIMAIRE (devblog 2.72) : interdite si over ou exo déjà présent
  // (une ligne déjà transcendée est elle-même un over : une deuxième transcendance sur
  // une autre ligne est donc refusée ici aussi).
  if (hasAnyOverOrExo(state.lines)) return refused(state, 'transcendence_requires_clean_item', weight);

  // Application : la ligne devient une ligne au-dessus de son jet parfait (over) — ou un exo
  // si absente — mais verrouillée. Le devblog précise que l'over apporté par la transcendance
  // est ajusté au jet théorique par le migrateur d'objets : le résultat est traité ici comme
  // une ligne verrouillée dont la valeur est baseMax + rune (ou rune pour un exo).
  const lines = state.lines.map((l) => ({ ...l }));
  const lockAll = params.transcendence.lockScope === 'item';
  if (existing) {
    const target = lines.find((l) => l.characteristicId === rune.characteristicId)!;
    target.value += rune.value;
    target.isLocked = true;
  } else {
    lines.push({
      characteristicId: rune.characteristicId,
      value: rune.value,
      baseMin: 0,
      baseMax: 0,
      isExo: true,
      isLocked: true,
    });
  }
  if (lockAll) for (const l of lines) l.isLocked = true;

  const after: ForgemagieItemState = { ...state, lines, itemLocked: lockAll };

  const cap = checkOverCap(after, rune.characteristicId, params);
  if (!cap.allowed) return refused(state, 'over_cap_exceeded', weight);

  return {
    accepted: true,
    state: after,
    outcome: 'SC',
    runeWeight: weight,
    lossRequested: 0,
    absorbedByResidual: 0,
    losses: [],
    unabsorbedWeight: 0,
    residualPoolBefore: state.residualPool,
    residualPoolAfter: state.residualPool,
  };
}
