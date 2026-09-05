/**
 * Bornes SOURCE PRIMAIRE appliquées APRÈS tout modèle.
 *
 * Tutoriel officiel Ankama « La forgemagie »
 * (https://www.dofus.com/fr/mmorpg/tutoriels/420190-forgemagie), cité verbatim dans
 * docs/knowledge (Reconstruction, Key Findings 3) :
 *   « le taux de Succès Critique le plus faible lors de l'utilisation d'une rune, hors
 *     tentative d'overmax ou de forgemagie exotique, est de 15 % »
 *   « Le taux de réussite des forgemagies exotiques est en revanche automatiquement très
 *     faible et peut descendre jusqu'à 1 % si l'on souhaite ajouter un PA… »
 *
 * Seuls facteurs cités par Ankama dans le même tutoriel : le NIVEAU DE L'OBJET et la
 * PROXIMITÉ DU JET MAXIMAL. Aucune formule n'est publiée.
 *
 * Ces deux nombres sont les seules constantes autorisées en dur dans src/logic/probability.
 */

import type { ProbabilityOutput } from './types';

/** SOURCE PRIMAIRE : plancher de SC en forgemagie normale (hors overmax / exotique). */
export const MIN_SC_NORMAL = 0.15;

/** SOURCE PRIMAIRE : plancher de SC pour un exo lourd (« jusqu'à 1 % »). */
export const MIN_SC_HEAVY_EXO = 0.01;

/**
 * Applique le plancher de SC puis renormalise SN/EC en conservant leur rapport.
 * Retourne toujours un triplet dans [0, 1] de somme 1.
 */
export function applyOfficialBounds(raw: ProbabilityOutput, isHeavyExo: boolean): ProbabilityOutput {
  const floor = isHeavyExo ? MIN_SC_HEAVY_EXO : MIN_SC_NORMAL;

  let pSC = clamp01(raw.pSC);
  let pSN = clamp01(raw.pSN);
  let pEC = clamp01(raw.pEC);

  // Normalisation préalable (un modèle mal paramétré peut ne pas sommer à 1)
  const total = pSC + pSN + pEC;
  if (total <= 0) {
    return { pSC: 1, pSN: 0, pEC: 0 };
  }
  pSC /= total;
  pSN /= total;
  pEC /= total;

  if (pSC < floor) {
    const rest = 1 - floor;
    const restRaw = pSN + pEC;
    if (restRaw > 0) {
      pSN = rest * (pSN / restRaw);
      pEC = rest * (pEC / restRaw);
    } else {
      pSN = rest;
      pEC = 0;
    }
    pSC = floor;
  }

  return { pSC, pSN, pEC };
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}
