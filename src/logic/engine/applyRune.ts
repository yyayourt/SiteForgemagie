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
 * - Borne d'over/exo (overCapWeight / overCapLineBasis / overCapScope) : si la rune la
 *   dépasserait, elle est TRONQUÉE à la borne (overCapExcess.behaviour = truncate, HYPOTHÈSE
 *   COMMUNAUTAIRE : « Ra Vi sur 480 vita passe jusqu'à 505 ») ou refusée entière (refuse).
 *   Refus dans tous les cas si plus rien ne peut s'appliquer. La perte d'une rune tronquée
 *   est mesurée sur la rune entière ou sur la part appliquée (overCapExcess.lossBasis, INCONNU).
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
import { maxApplicableRuneValue } from './overCap';
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
    appliedValue: 0,
    truncated: false,
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

  // Borne d'over/exo : troncature à la borne, ou refus
  const applicable = maxApplicableRuneValue(state, rune, params);
  if (applicable <= 0) return refused(state, outcome, 'over_cap_exceeded', weight);
  if (applicable < rune.value && params.overCapExcess.behaviour === 'refuse') return refused(state, outcome, 'over_cap_exceeded', weight);
  const truncated = applicable < rune.value;
  const appliedRune: Rune = { characteristicId: rune.characteristicId, value: applicable };
  const hypothetical = withRuneApplied(state, appliedRune);
  // Poids retenu pour la perte : rune entière (défaut) ou part appliquée (overCapExcess.lossBasis)
  const lossWeight = truncated && params.overCapExcess.lossBasis === 'applied_only' ? runeWeight(appliedRune, params) : weight;

  const residualPoolBefore = state.residualPool;

  // ── Application du résultat ──
  switch (outcome) {
    case 'SC': {
      return {
        accepted: true,
        state: hypothetical,
        outcome,
        runeWeight: weight,
        appliedValue: applicable,
        truncated,
        lossRequested: 0,
        absorbedByResidual: 0,
        losses: [],
        unabsorbedWeight: 0,
        residualPoolBefore,
        residualPoolAfter: hypothetical.residualPool,
      };
    }

    case 'SN': {
      const loss = applyLoss(hypothetical, lossWeight, rune.characteristicId, params, rng);
      return {
        accepted: true,
        state: loss.state,
        outcome,
        runeWeight: weight,
        appliedValue: applicable,
        truncated,
        lossRequested: lossWeight,
        absorbedByResidual: loss.absorbedByResidual,
        losses: loss.losses,
        unabsorbedWeight: loss.unabsorbedWeight,
        residualPoolBefore,
        residualPoolAfter: loss.state.residualPool,
      };
    }

    case 'EC': {
      const lossRequested = lossWeight * params.ecLossFactor;
      const loss = applyLoss(state, lossRequested, rune.characteristicId, params, rng);
      return {
        accepted: true,
        state: loss.state,
        outcome,
        runeWeight: weight,
        appliedValue: 0,
        truncated,
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
