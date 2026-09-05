/**
 * Runes de transcendance.
 *
 * SOURCE PRIMAIRE — devblog officiel mise à jour 2.58 :
 *   https://www.dofus.com/fr/mmorpg/actualites/devblog/billets/1255546
 *   Un objet ayant reçu une rune de transcendance ne peut plus être forgemagé NI
 *   réinitialisé par un orbe régénérant. Ce verrou est codé en dur ici (itemLocked = true,
 *   toutes les lignes verrouillées) et n'est PAS paramétrable. Confirmé par les données
 *   client : chaque rune de transcendance porte l'effet 2825 « Empêche les futures
 *   forgemagies » (data/dataset.json, typeId 211).
 *   (Le devblog 2.72 concerne le migrateur d'objets, pas la transcendance.)
 *
 * HYPOTHÈSES COMMUNAUTAIRES (empirical_params.json → transcendence) :
 *   - refuseIfOverOrExo : refus si l'objet possède déjà un over ou un exo (wiki, guides) ;
 *   - successRateByRank : 100 % par rang selon le wiki ; l'effet 2827 « % de chances de
 *     réussite » existe sur chaque rune mais sa valeur n'est pas dans l'API (à extraire du
 *     client). Tant que le taux vaut 100, la rune est appliquée comme un SC garanti.
 *
 * La borne d'over/exo (overCapWeight / overCapScope) s'applique aussi.
 * Les valeurs des runes (Ta / Pata / Rata) viennent du dataset.
 */

import type { EngineParams, TranscendenceRank } from '../../data/params';
import type { ApplyRuneResult, ForgemagieItemState, Rune } from '../../types/forgemagie';
import { checkOverCap, hasAnyOverOrExo } from './overCap';
import { getLineDensity, runeWeight } from './weights';

export interface TranscendenceRune extends Rune {
  /** Rang de la rune (Ta / Pata / Rata), déduit du nom dans le dataset. */
  rank: TranscendenceRank;
}

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
  rune: TranscendenceRune,
  params: EngineParams
): ApplyRuneResult {
  if (getLineDensity(rune.characteristicId, params) === undefined) {
    return refused(state, 'no_density', 0);
  }
  const weight = runeWeight(rune, params);

  // SOURCE PRIMAIRE (devblog 2.58) : un objet transcendé n'est plus forgemageable,
  // ce qui inclut une seconde rune de transcendance.
  if (state.itemLocked) return refused(state, 'item_locked', weight);

  // HYPOTHÈSE COMMUNAUTAIRE : interdite si over ou exo déjà présent
  if (params.transcendence.refuseIfOverOrExo && hasAnyOverOrExo(state.lines)) {
    return refused(state, 'transcendence_requires_clean_item', weight);
  }

  const successRate = params.transcendence.successRateByRank[rune.rank];
  if (successRate !== 100) {
    // Un taux < 100 relève du modèle probabiliste (phase 3) : refus explicite plutôt
    // qu'un tirage inventé ici.
    return refused(state, 'transcendence_rate_not_certain', weight);
  }

  const lines = state.lines.map((l) => ({ ...l }));
  const existing = lines.find((l) => l.characteristicId === rune.characteristicId);
  if (existing) {
    existing.value += rune.value;
  } else {
    lines.push({
      characteristicId: rune.characteristicId,
      value: rune.value,
      baseMin: 0,
      baseMax: 0,
      isExo: true,
      isLocked: false,
    });
  }

  const after: ForgemagieItemState = { ...state, lines };
  const cap = checkOverCap(after, rune.characteristicId, params);
  if (!cap.allowed) return refused(state, 'over_cap_exceeded', weight);

  // SOURCE PRIMAIRE (devblog 2.58) : verrou de l'objet entier (forgemagie + orbes)
  for (const l of lines) l.isLocked = true;
  const locked: ForgemagieItemState = { ...after, lines, itemLocked: true };

  return {
    accepted: true,
    state: locked,
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
