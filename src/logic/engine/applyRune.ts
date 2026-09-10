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
 *        retirée sur des lignes (stratégie configurable), LIGNE VISÉE COMPRISE après
 *        application de son gain (SOURCE PRIMAIRE, observations 2026-09-09).
 * - EC : rune non appliquée, perte = poids de la rune EXACTEMENT (SOURCE PRIMAIRE,
 *        observations 2026-09-09 : 10,0 sur deux Ra Vi ; l'ancien paramètre ecLossFactor
 *        est supprimé), même mécanique d'absorption. Si l'objet ne peut pas tout payer,
 *        l'EC retire tout ce qui reste puis s'arrête ; à lignes et reliquat nuls, « Échec »
 *        sans effet, rune consommée (SOURCE PRIMAIRE : −30 vita = 6,0 pour 10 demandés).
 * - SN IMPOSSIBLE : « rien ne se passe » — aucun gain, aucune perte, reliquat inchangé
 *        (SOURCE PRIMAIRE — v1.27 ; défaut `no_effect` de lossSelection.unpayableSn).
 *        LA RUNE EST CONSOMMÉE : le résultat est `accepted`, donc le compteur de coût de
 *        session la décompte. Le DevBlog ne dit rien du sort de la rune ; c'est aligné sur
 *        l'échec sans effet observé en jeu le 2026-09-09 (« rune consommée », SOURCE
 *        PRIMAIRE pour l'EC), donc INCONNU pour ce cas précis.
 *        Voir la note sur la PORTÉE de cette règle plus bas.
 * - Une rune sur une ligne verrouillée (transcendance) ou un objet verrouillé est refusée.
 * - Borne d'over/exo (overCapWeight / overCapLineBasis / overCapScope) : si la rune la
 *   dépasserait, elle est TRONQUÉE à la borne (overCapExcess.behaviour = truncate, HYPOTHÈSE
 *   COMMUNAUTAIRE : « Ra Vi sur 480 vita passe jusqu'à 505 ») ou refusée entière (refuse).
 *   Refus dans tous les cas si plus rien ne peut s'appliquer. La perte d'une rune tronquée
 *   est mesurée sur la rune entière ou sur la part appliquée (overCapExcess.lossBasis, INCONNU).
 *
 * ─── PORTÉE DE LA RÈGLE « rien ne se passe » (arbitrage du 2026-09-10) ────────────────────
 * Le DevBlog 1.27 énonce la règle ET son déclencheur :
 *   « Le jet modifié augmente, et UN AUTRE jet diminue. Si ce résultat n'est pas possible
 *     (objet qui ne dispose que d'un seul jet par exemple), rien ne se passe en cas de
 *     succès partiel. »
 * La RÈGLE (« rien ne se passe ») est reprise telle quelle : c'est une SOURCE PRIMAIRE, et
 * elle remplace l'ancien défaut `ec_no_effect`, qui était un choix de projet sans source.
 *
 * Le DÉCLENCHEUR, lui, n'est PAS repris littéralement, et c'est délibéré. « Un AUTRE jet »
 * suppose que la ligne visée ne peut pas payer — vrai en 1.27, FAUX en Unity : l'observation
 * du 2026-09-09 (SOURCE PRIMAIRE — Unity, rang R1) montre la ligne visée perdre après son
 * gain, et le reliquat absorbe lui aussi. En Unity, un objet mono-jet peut donc payer son
 * propre succès neutre. Appliquer le déclencheur de 1.27 contredirait une source de rang
 * supérieur (docs/knowledge/hierarchie-preuves.md, règles 1 et 3).
 *
 * Le déclencheur retenu est donc la condition GÉNÉRALE qu'Ankama énonce — « si ce résultat
 * n'est pas possible » — mesurée avec les règles de paiement d'Unity : la perte ne peut pas
 * être couverte, ni par le reliquat, ni par une ligne, ligne visée comprise.
 *
 * Conséquence observable sur un objet mono-jet : le gain est appliqué puis repris sur la
 * même ligne, donc le résultat NET est nul — ce que le DevBlog décrit comme « rien ne se
 * passe ». Les deux sources s'accordent sur l'observable ; elles divergent sur le chemin.
 * Ce qui reste INCONNU : l'écart de quantification (la perte reprise peut dépasser le gain
 * et créer du reliquat).
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
    snConvertedToEc: false,
    snNoOp: false,
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
        snConvertedToEc: false,
        snNoOp: false,
        residualPoolBefore,
        residualPoolAfter: hypothetical.residualPool,
      };
    }

    case 'SN': {
      // La ligne visée, gain appliqué, est candidate comme les autres (SOURCE PRIMAIRE)
      const loss = applyLoss(hypothetical, lossWeight, params, rng, weight);
      if (loss.unabsorbedWeight > 0 && params.lossSelection.unpayableSn === 'no_effect') {
        // « Si ce résultat n'est pas possible, rien ne se passe » (SOURCE PRIMAIRE — v1.27) :
        // aucun gain, aucune perte, reliquat intact. L'objet ressort strictement identique.
        // `accepted: true` → la rune EST consommée et comptée dans le coût de session
        // (aligné sur l'échec sans effet observé, INCONNU pour ce cas). Le journal l'affiche
        // « Échec », seul libellé attesté en jeu pour une tentative sans effet.
        return {
          accepted: true,
          state,
          outcome,
          runeWeight: weight,
          appliedValue: 0,
          truncated,
          lossRequested: lossWeight,
          absorbedByResidual: 0,
          losses: [],
          unabsorbedWeight: lossWeight,
          snConvertedToEc: false,
          snNoOp: true,
          residualPoolBefore,
          residualPoolAfter: state.residualPool,
        };
      }
      if (loss.unabsorbedWeight > 0 && params.lossSelection.unpayableSn === 'ec_no_effect') {
        // SN impayable (INCONNU, jamais observé) : converti en échec sans effet, rune consommée
        return {
          accepted: true,
          state,
          outcome: 'EC',
          runeWeight: weight,
          appliedValue: 0,
          truncated,
          lossRequested: lossWeight,
          absorbedByResidual: 0,
          losses: [],
          unabsorbedWeight: lossWeight,
          snConvertedToEc: true,
          snNoOp: false,
          residualPoolBefore,
          residualPoolAfter: state.residualPool,
        };
      }
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
        snConvertedToEc: false,
        snNoOp: false,
        residualPoolBefore,
        residualPoolAfter: loss.state.residualPool,
      };
    }

    case 'EC': {
      // Perte = poids de la rune, exactement (SOURCE PRIMAIRE) ; tout ce qui reste si l'objet ne peut pas payer
      const lossRequested = lossWeight;
      const loss = applyLoss(state, lossRequested, params, rng, weight);
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
        snConvertedToEc: false,
        snNoOp: false,
        residualPoolBefore,
        residualPoolAfter: loss.state.residualPool,
      };
    }
  }
}
