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
 * NON CERTAIN (empirical_params.json → transcendence), dans l'ordre de vérification :
 *   1. verrou objet (SOURCE PRIMAIRE ci-dessus) ;
 *   2. refuseIfExo  — HYPOTHÈSE COMMUNAUTAIRE (JeuxOnLine, relais de l'annonce 2.49) ;
 *   3. refuseIfOver — HYPOTHÈSE COMMUNAUTAIRE (Millenium, guides) ;
 *   4. maxCurrentValueByRank — INCONNU (seuils communautaires, à extraire des effets
 *      2825-2827 du client) ; vide = aucun seuil appliqué ;
 *   5. successRateByRank — HYPOTHÈSE COMMUNAUTAIRE (100 % selon le wiki) ; un taux < 100
 *      relève du modèle probabiliste et est refusé explicitement ici ;
 *   6. application, puis borne d'over/exo (overCapWeight / overCapScope).
 */

import type { EngineParams, TranscendenceRank } from '../../data/params';
import type { ApplyRuneResult, ForgemagieItemState, Rune } from '../../types/forgemagie';
import { checkOverCap } from './overCap';
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
  const t = params.transcendence;

  // 1. SOURCE PRIMAIRE (devblog 2.58) : un objet transcendé n'est plus forgemageable,
  //    ce qui inclut une seconde rune de transcendance.
  if (state.itemLocked) return refused(state, 'item_locked', weight);

  // 2. HYPOTHÈSE COMMUNAUTAIRE : refus si un exo est présent
  if (t.refuseIfExo && state.lines.some((l) => l.isExo && l.value > 0)) {
    return refused(state, 'transcendence_has_exo', weight);
  }

  // 3. HYPOTHÈSE COMMUNAUTAIRE : refus si un over est présent
  if (t.refuseIfOver && state.lines.some((l) => !l.isExo && l.value > l.baseMax)) {
    return refused(state, 'transcendence_has_over', weight);
  }

  // 4. INCONNU : seuil de valeur courante par rang (aucun seuil si non renseigné)
  const existing = state.lines.find((l) => l.characteristicId === rune.characteristicId);
  const threshold = t.maxCurrentValueByRank[String(rune.characteristicId)]?.[rune.rank];
  if (threshold !== undefined && (existing?.value ?? 0) > threshold) {
    return refused(state, 'transcendence_threshold_exceeded', weight);
  }

  // 5. HYPOTHÈSE COMMUNAUTAIRE : taux de réussite par rang
  if (t.successRateByRank[rune.rank] !== 100) {
    return refused(state, 'transcendence_rate_not_certain', weight);
  }

  // 6. Application
  const lines = state.lines.map((l) => ({ ...l }));
  const target = lines.find((l) => l.characteristicId === rune.characteristicId);
  if (target) {
    target.value += rune.value;
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
