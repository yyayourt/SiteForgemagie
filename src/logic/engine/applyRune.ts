/**
 * Point d'entrée du moteur : applyRune(state, rune, outcome, params, rng).
 *
 * Pipeline (CLAUDE.md) :
 *   Item → État des caractéristiques → Calcul du poids → Calcul du reliquat
 *   → Détermination de l'action de la rune → [SC/SN/EC : FOURNI, pas de tirage ici]
 *   → Application du résultat → Sélection des pertes → MAJ du reliquat → MAJ de l'objet
 *
 * L'issue (outcome) est un ARGUMENT : ce module ne contient aucun modèle probabiliste.
 * Le modèle SC/SN/EC paramétrable arrive en phase 3.
 *
 * Règles appliquées :
 * - SC : rune appliquée, aucune perte, reliquat inchangé (tutoriel Ankama, A §5).
 * - SN : rune appliquée, perte = poids de la rune, absorbée d'abord par le reliquat puis
 *        retirée sur des lignes (stratégie configurable).
 * - EC : rune non appliquée, perte = ecLossFactor × poids de la rune (ecLossFactor :
 *        INCONNU, empirical_params.json), même mécanique d'absorption.
 * - Une rune sur une ligne verrouillée (transcendance) ou un objet verrouillé est refusée.
 * - La tentative est refusée si l'application dépasserait la borne d'over/exo
 *   (overCapWeight / overCapScope), quelle que soit l'issue fournie.
 */

import type { EngineParams } from '../../data/params';
import type {
  ApplyRuneResult,
  ForgemagieItemState,
  ItemLine,
  Rune,
  RuneOutcome,
  Rng,
} from '../../types/forgemagie';
import { applyLoss } from './losses';
import { checkOverCap } from './overCap';
import { getLineDensity, runeWeight } from './weights';

function refused(
  state: ForgemagieItemState,
  outcome: RuneOutcome,
  reason: ApplyRuneResult['reason'],
  weight: number
): ApplyRuneResult {
  return {
    accepted: false,
    reason,
    state,
    outcome,
    runeWeight: weight,
    lossRequested: 0,
    absorbedByResidual: 0,
    losses: [],
    unabsorbedWeight: 0,
    residualPoolBefore: state.residualPool,
    residualPoolAfter: state.residualPool,
  };
}

/** État hypothétique après application de la rune (SC ou SN). Crée la ligne exo si absente. */
export function withRuneApplied(state: ForgemagieItemState, rune: Rune): ForgemagieItemState {
  const lines: ItemLine[] = state.lines.map((l) => ({ ...l }));
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
  return { ...state, lines };
}

export function applyRune(
  state: ForgemagieItemState,
  rune: Rune,
  outcome: RuneOutcome,
  params: EngineParams,
  rng: Rng
): ApplyRuneResult {
  // ── Détermination de l'action de la rune ──
  if (getLineDensity(rune.characteristicId, params) === undefined) {
    return refused(state, outcome, 'no_density', 0);
  }
  const weight = runeWeight(rune, params);

  if (state.itemLocked) return refused(state, outcome, 'item_locked', weight);
  const existing = state.lines.find((l) => l.characteristicId === rune.characteristicId);
  if (existing?.isLocked) return refused(state, outcome, 'line_locked', weight);

  // La tentative elle-même est conditionnée par la borne d'over/exo
  const hypothetical = withRuneApplied(state, rune);
  const cap = checkOverCap(hypothetical, rune.characteristicId, params);
  if (!cap.allowed) return refused(state, outcome, 'over_cap_exceeded', weight);

  const residualPoolBefore = state.residualPool;

  // ── Application du résultat ──
  switch (outcome) {
    case 'SC': {
      return {
        accepted: true,
        state: hypothetical,
        outcome,
        runeWeight: weight,
        lossRequested: 0,
        absorbedByResidual: 0,
        losses: [],
        unabsorbedWeight: 0,
        residualPoolBefore,
        residualPoolAfter: hypothetical.residualPool,
      };
    }

    case 'SN': {
      const loss = applyLoss(hypothetical, weight, rune.characteristicId, params, rng);
      return {
        accepted: true,
        state: loss.state,
        outcome,
        runeWeight: weight,
        lossRequested: weight,
        absorbedByResidual: loss.absorbedByResidual,
        losses: loss.losses,
        unabsorbedWeight: loss.unabsorbedWeight,
        residualPoolBefore,
        residualPoolAfter: loss.state.residualPool,
      };
    }

    case 'EC': {
      const lossRequested = weight * params.ecLossFactor;
      const loss = applyLoss(state, lossRequested, rune.characteristicId, params, rng);
      return {
        accepted: true,
        state: loss.state,
        outcome,
        runeWeight: weight,
        lossRequested,
        absorbedByResidual: loss.absorbedByResidual,
        losses: loss.losses,
        unabsorbedWeight: loss.unabsorbedWeight,
        residualPoolBefore,
        residualPoolAfter: loss.state.residualPool,
      };
    }
  }
}
