/**
 * Étapes « Sélection des pertes → Mise à jour du reliquat » du pipeline.
 *
 * Règles (CLAUDE.md, décision du 2026-09-05) :
 * 1. La perte demandée est d'abord absorbée par le reliquat (residualPool), consommé en
 *    priorité (docs/knowledge R PARTIE 2, HYPOTHÈSE COMMUNAUTAIRE forte).
 * 2. Le reste est retiré sur des lignes choisies par la stratégie de sélection ; sur une
 *    ligne, on retire un nombre ENTIER de points : ceil(reste / densité), borné par ce que
 *    la ligne peut perdre.
 * 3. Reliquat créé = poids réellement retiré − perte demandée restante, jamais négatif
 *    (définition « reliquat = perte − rune », convergence communautaire, A §4.1).
 * 4. Si aucune ligne ne peut absorber le reste, il est perdu (unabsorbedWeight) et le
 *    reliquat n'en est pas affecté (l'appelant décide de l'issue : EC partiel, SN converti).
 * 5. La ligne visée par la rune est candidate comme les autres, une fois son gain appliqué
 *    (SOURCE PRIMAIRE, observations en jeu du 2026-09-09 : SN Ra Vi +50, −28 vita −44 ini).
 *    L'ancienne exclusion de la ligne visée est supprimée et n'est pas paramétrable.
 * 6. BONUS : plancher à 0 (SOURCE PRIMAIRE — v1.27, DevBlog : « les bonus d'un objet peuvent
 *    redescendre jusqu'à 0 au minimum »).
 * 7. MALUS : voir `removablePoints`. Deux règles primaires v1.27, ajoutées le 2026-09-10.
 *
 * L'absorption par le reliquat passe par un SEAM (poolConsumption.ts) : une seule règle
 * aujourd'hui, le comportement actuel.
 */

import type { EngineParams } from '../../data/params';
import type { ForgemagieItemState, ItemLine, LossRecord, Rng } from '../../types/forgemagie';
import { getLossSelectionStrategy, type LossCandidate } from './lossSelection';
import { getPoolConsumptionRule } from './poolConsumption';
import { isOverOrExo } from './weights';

export interface LossApplication {
  state: ForgemagieItemState;
  absorbedByResidual: number;
  losses: LossRecord[];
  unabsorbedWeight: number;
}

/**
 * Une ligne de MALUS : effet naturellement négatif de l'objet (jet maximal naturel < 0).
 * Les lignes exotiques n'en font jamais partie.
 */
export function isMalusLine(line: ItemLine): boolean {
  return !line.isExo && line.baseMax < 0;
}

/** Points qu'une ligne peut perdre quand elle est ciblée comme over/exo (jusqu'au jet parfait / à 0). */
function removablePointsAsOverExo(line: ItemLine): number {
  return line.isExo ? line.value : Math.max(0, line.value - line.baseMax);
}

/**
 * Points qu'une ligne peut perdre.
 *
 * BONUS — jusqu'à 0. `SOURCE PRIMAIRE — v1.27` : « Après un échec, les bonus d'un objet
 * peuvent redescendre jusqu'à 0 au minimum. »
 *
 * MALUS — jusqu'à son jet maximal naturel (`baseMax`), et pas plus loin. Deux phrases du
 * DevBlog s'articulent ici, et elles ne se comprennent qu'ensemble :
 *   • « il est impossible de "puiser" dans les malus, c'est-à-dire les effets négatifs de
 *     l'objet, **à moins que ceux-ci ne soient overmaxés**, car ils joueraient souvent le
 *     rôle de puits sans fonds » ;
 *   • « les malus ne peuvent dépasser le malus maximum naturel ».
 * Un malus « overmaxé » est un malus **meilleur que son jet naturel** (moins négatif que
 * `baseMax`) — c'est la seule lecture qui rend les deux phrases compatibles, et elle est
 * cohérente avec `isOverOrExo`, qui classe déjà une telle ligne en over. On peut donc
 * reprendre ce qui a été gagné au-dessus du naturel, jamais creuser en dessous : sinon le
 * malus redevient le puits sans fond qu'Ankama décrit.
 *
 * Avant le 2026-09-10, `max(0, value)` renvoyait 0 pour toute ligne négative : une ligne de
 * malus n'était donc **jamais** candidate, même overmaxée. Le résultat était voisin pour les
 * malus non overmaxés, mais par accident et non par règle.
 */
function removablePoints(line: ItemLine): number {
  if (isMalusLine(line)) {
    const naturalWorst = Math.min(line.baseMin, line.baseMax);
    // Borne de sécurité : on ne descend jamais sous le malus maximum naturel.
    return Math.max(0, Math.min(line.value - line.baseMax, line.value - naturalWorst));
  }
  return Math.max(0, line.value);
}

function candidatesOf(lines: ItemLine[], params: EngineParams, overExoOnly: boolean): LossCandidate[] {
  const out: LossCandidate[] = [];
  for (const line of lines) {
    if (line.isLocked) continue;
    const density = params.densities.get(line.characteristicId);
    if (density === undefined || density <= 0) continue;
    if (overExoOnly) {
      if (!isOverOrExo(line) || removablePointsAsOverExo(line) <= 0) continue;
    } else if (removablePoints(line) <= 0) {
      continue;
    }
    out.push({ line, density });
  }
  return out;
}

/**
 * Applique une perte de `lossWeight` (poids) à l'état. Toute ligne non verrouillée est candidate.
 * `runeWeight` n'est utilisé que par le seam de consommation du reliquat ; il vaut `lossWeight`
 * par défaut, ce qui est le cas de toutes les tentatives sauf une rune tronquée facturée sur
 * la part appliquée.
 */
export function applyLoss(
  state: ForgemagieItemState,
  lossWeight: number,
  params: EngineParams,
  rng: Rng,
  runeWeight: number = lossWeight
): LossApplication {
  const EPS = 1e-9;
  let remaining = Math.max(0, lossWeight);
  let residual = state.residualPool;
  const losses: LossRecord[] = [];
  const lines = state.lines.map((l) => ({ ...l }));

  // 1. Absorption par le reliquat (SEAM : poolConsumption.ts, une seule règle aujourd'hui)
  const absorbedByResidual = getPoolConsumptionRule(params.residualPool.poolConsumptionRule).absorb({
    residual,
    lossRequested: remaining,
    runeWeight,
  });
  residual -= absorbedByResidual;
  remaining -= absorbedByResidual;

  const strategy = getLossSelectionStrategy(params.lossSelection.strategy);

  // 2. Retrait sur des lignes, tant qu'il reste du poids à perdre et des candidates
  while (remaining > EPS) {
    let overExoPhase = false;
    let candidates: LossCandidate[] = [];
    if (params.lossSelection.prioritizeOverExo) {
      candidates = candidatesOf(lines, params, true);
      overExoPhase = candidates.length > 0;
    }
    if (candidates.length === 0) {
      candidates = candidatesOf(lines, params, false);
    }
    if (candidates.length === 0) break;

    const picked = strategy.pick(candidates, rng);
    const maxPoints = overExoPhase
      ? removablePointsAsOverExo(picked.line)
      : removablePoints(picked.line);
    const wanted = Math.ceil(remaining / picked.density - EPS);
    const points = Math.min(wanted, maxPoints);
    if (points <= 0) break;

    const weightLost = points * picked.density;
    picked.line.value -= points;
    losses.push({ characteristicId: picked.line.characteristicId, pointsLost: points, weightLost });

    if (weightLost >= remaining - EPS) {
      // 3. Reliquat créé = surplus retiré au-delà de la perte demandée, jamais négatif
      residual += Math.max(0, weightLost - remaining);
      remaining = 0;
    } else {
      remaining -= weightLost;
    }
  }

  return {
    state: { ...state, lines, residualPool: Math.max(0, residual) },
    absorbedByResidual,
    losses,
    unabsorbedWeight: remaining > EPS ? remaining : 0,
  };
}
