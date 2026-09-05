/**
 * Brisage (concassage) — génération de runes à partir d'un objet.
 *
 * Formule portée depuis deux dépôts open source (données communautaires, statut
 * HYPOTHÈSE COMMUNAUTAIRE / MODÈLE EMPIRIQUE ; Papycha rapporte 34 écarts sur 200 essais) :
 *
 *   [K] KamelAkar/Calculateur_Brisage_Dofus — brisage_cli.py, branche main, poussé 2025-04-26
 *       fonction calculate_brissage(), l.397-489 :
 *         poids = ((value * poids_rune * level * 0.0150) + 1) ; poids *= coefficient / 100
 *         nb_runes = poids / poids_rune (si poids_rune ≥ 1) ; focus : poids_focus + 0.5 * poids_others
 *   [I] Icksir/crushing-calculator (MIT) — backend/src/services/calculator.py, main, 2026-05-18
 *       fonction calculate_profit(), l.407-530 :
 *         vr = ((value * density * item_lvl * 0.0150) + 1) ; vr_normal_final = vr * server_coef
 *         count = vr_normal_final / rune_weight ; focus : vr_propio + 0.5 * vr_resto
 *
 * Cohérent avec la formule du forum officiel citée dans docs/knowledge (A [^9]) :
 *   ((3 × jet × niveau × poids / 200) + 1) / poids_rune × coefficient, où 3/200 = 0,015.
 *
 * ÉCARTS ENTRE LES DEUX DÉPÔTS (exposés comme paramètres, pas tranchés silencieusement) :
 *   1. Lignes nulles/négatives : [K] ignorées (`continue`) ; [I] contribuent vr = 1 au total
 *      (donc au focus). → brisage.nonPositiveLineContribution (CONTRADICTION).
 *   2. Pods en mode focus, quand Pods n'est PAS la ligne focus : [I] divise la valeur par 2,5
 *      avant tout calcul ; [K] utilise la valeur brute dans la boucle focus (l.455-467).
 *      → brisage.podsDivisorOnNonFocusLines (CONTRADICTION).
 *   3. Conversion en runes : [K] divise par la densité, sauf densité < 1 où il prend
 *      nb_runes = poids (l.431-432 : Vitalité, Initiative, Pods) ; [I] divise par le poids
 *      de la rune (table RUNE_DB : Vi 1, Ini 1, Pod 2,5). Résultat identique pour Vitalité
 *      et Initiative (poids de rune = 1), différent pour Pods (÷ 1 chez [K], ÷ 2,5 chez [I]).
 *      Ici : division par le poids réel de la rune normale du dataset (valeur × densité),
 *      soit le comportement [I] ; Pods reste donc un cas non tranché.
 *   4. Densités : [K] Renvoi 10, % rés. mêlée/distance 15 ; [I] Renvoi 5, % rés. mêlée/distance 10
 *      (dernières affectations de STAT_DENSITIES). Les densités viennent ici de
 *      empirical_params.json, qui signale ces CONTRADICTION.
 *   5. Partie fractionnaire : [K] la convertit en pourcentage de chance d'une rune
 *      supplémentaire (int(reste)) ; [I] garde un nombre réel arrondi à 2 décimales.
 *      Ici : nombre réel + décomposition (entier, probabilité) exposée, sans arrondir.
 *
 * Tout nombre de cette formule est lu dans empirical_params.json → brisage.
 */

import type { BrisageParams } from '../../data/params';

/** Caractéristiques « d'action » forcées à 1 quand leur valeur est dans [0, 1] ([K] l.418, [I] l.428). */
const ACTION_CHARACTERISTIC_IDS = [1, 23, 19, 26] as const; // PA, PM, Portée, Invocations (DofusDB)
/** Pods (DofusDB characteristic 40). */
const PODS_CHARACTERISTIC_ID = 40;

export interface BrisageLine {
  characteristicId: number;
  value: number;
}

export interface BrisageInput {
  level: number;
  lines: BrisageLine[];
  /** Coefficient serveur en pourcentage (100 = neutre). Entrée utilisateur, pas un paramètre. */
  coefficientPercent: number;
  /** Poids d'une rune normale par caractéristique (valeur de la rune × densité), depuis le dataset. */
  runeUnitWeights: ReadonlyMap<number, number>;
  /** Ligne focalisée (toutes les autres contribuent à focusOtherLinesFactor), ou null. */
  focusCharacteristicId?: number | null;
}

export interface RuneYield {
  characteristicId: number;
  /** Nombre réel de runes ("10,2 runes = 80 % d'avoir 10, 20 % d'avoir 11", R PARTIE 9). */
  runes: number;
  guaranteedRunes: number;
  /** Probabilité d'une rune supplémentaire (partie fractionnaire). */
  extraRuneProbability: number;
  /** Poids de brisage de la ligne après coefficient. */
  crushingWeight: number;
}

export interface BrisageResult {
  focusCharacteristicId: number | null;
  yields: RuneYield[];
}

/** Poids de brisage d'une ligne avant coefficient : value × densité × niveau × levelFactor + constantOffset. */
export function lineCrushingWeight(
  line: BrisageLine,
  level: number,
  params: BrisageParams,
  options: { applyPodsDivisor: boolean }
): number | null {
  let value = line.value;
  if (
    params.forceOneForActionStats &&
    (ACTION_CHARACTERISTIC_IDS as readonly number[]).includes(line.characteristicId) &&
    value >= 0 &&
    value <= 1
  ) {
    value = 1;
  }
  if (value <= 0) {
    return params.nonPositiveLineContribution === 'offset' ? params.constantOffset : null;
  }
  const density = params.densities.get(line.characteristicId);
  if (density === undefined) return null;
  if (options.applyPodsDivisor && line.characteristicId === PODS_CHARACTERISTIC_ID) {
    value = value / params.podsDivisor;
  }
  return value * density * level * params.levelFactor + params.constantOffset;
}

function toYield(characteristicId: number, crushingWeight: number, runeUnitWeight: number): RuneYield {
  const runes = crushingWeight / runeUnitWeight;
  const guaranteed = Math.floor(runes + 1e-9);
  return {
    characteristicId,
    runes,
    guaranteedRunes: guaranteed,
    extraRuneProbability: Math.max(0, Math.min(1, runes - guaranteed)),
    crushingWeight,
  };
}

export function computeBrisage(input: BrisageInput, params: BrisageParams): BrisageResult {
  const coef = input.coefficientPercent / 100;
  const focusId = input.focusCharacteristicId ?? null;

  // ── Sans focus : chaque ligne produit ses propres runes ([K] l.414-439, [I] mode normal) ──
  if (focusId === null) {
    const yields: RuneYield[] = [];
    for (const line of input.lines) {
      const w = lineCrushingWeight(line, input.level, params, { applyPodsDivisor: true });
      if (w === null || line.value <= 0) continue;
      const unit = input.runeUnitWeights.get(line.characteristicId);
      if (unit === undefined || unit <= 0) continue;
      yields.push(toYield(line.characteristicId, w * coef, unit));
    }
    return { focusCharacteristicId: null, yields };
  }

  // ── Avec focus : 100 % de la ligne focus + focusOtherLinesFactor × les autres ──
  const focusLine = input.lines.find((l) => l.characteristicId === focusId);
  const unit = input.runeUnitWeights.get(focusId);
  if (!focusLine || unit === undefined || unit <= 0) {
    return { focusCharacteristicId: focusId, yields: [] };
  }

  let focusWeight = 0;
  let othersWeight = 0;
  for (const line of input.lines) {
    const isFocus = line.characteristicId === focusId;
    const w = lineCrushingWeight(line, input.level, params, {
      // Écart 2 : Pods non focalisé divisé ([I] l.431) ou brut ([K] l.455-467).
      // Ligne focus Pods : [I] divise la valeur avant la formule ET le total après
      // (l.431 puis l.506-507) ; [K] ne divise que le total (l.475-477). Comportement [I] ici.
      applyPodsDivisor: isFocus ? true : params.podsDivisorOnNonFocusLines,
    });
    if (w === null) continue;
    if (isFocus) focusWeight += w;
    else othersWeight += w;
  }

  let total = (focusWeight + params.focusOtherLinesFactor * othersWeight) * coef;
  if (focusId === PODS_CHARACTERISTIC_ID) total = total / params.podsDivisor;

  return { focusCharacteristicId: focusId, yields: [toYield(focusId, total, unit)] };
}
