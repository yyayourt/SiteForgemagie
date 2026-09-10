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
 * Portée du plancher de 15 % (correction du 2026-09-09, errata) : il vaut UNIQUEMENT pour
 * une ligne naturelle qui reste ≤ son jet max après la rune. Une tentative d'overmax ou
 * un exo non lourd n'ont AUCUN plancher officiel : 0 est autorisé, la valeur réelle est
 * INCONNUE et vient entièrement du modèle. L'exo lourd (PA/PM/PO) garde le plancher 1 %.
 *
 * Ces deux nombres sont les seules constantes autorisées en dur dans src/logic/probability.
 */

import type { AttemptKind, ProbabilityOutput } from './types';

/** SOURCE PRIMAIRE : plancher de SC en forgemagie normale (hors overmax / exotique). */
export const MIN_SC_NORMAL = 0.15;

/** SOURCE PRIMAIRE : taux de SC d'un exo lourd (« jusqu'à 1 % »). */
export const MIN_SC_HEAVY_EXO = 0.01;

/**
 * Caractéristiques pour lesquelles le 1 % est VERBATIM dans le tutoriel Ankama : le **PA**
 * (caractéristique 1), et lui seul — « peut descendre jusqu'à 1 % si l'on souhaite ajouter
 * un PA… ».
 *
 * Le PM (23) et la Portée (19) subissent le MÊME garde-fou dans le moteur
 * (`params.heavyExoCharacteristics`), mais par **extrapolation communautaire convergente**,
 * pas par citation : aucune source primaire ne les nomme. Le clamp est identique,
 * l'étiquette ne doit pas l'être — c'est ce que cette constante permet à l'interface.
 *
 * Réserve : la citation se termine par des points de suspension. Le PM et la PO figurent
 * peut-être dans la partie élidée ; on ne le sait pas, donc on ne l'affirme pas.
 */
export const HEAVY_EXO_VERBATIM: readonly number[] = [1];

/** Le taux de 1 % est-il verbatim pour cette caractéristique, ou extrapolé ? */
export function isHeavyExoRateVerbatim(characteristicId: number): boolean {
  return HEAVY_EXO_VERBATIM.includes(characteristicId);
}

/**
 * Applique le plancher de SC puis renormalise SN/EC en conservant leur rapport.
 * Retourne toujours un triplet dans [0, 1] de somme 1.
 */
/** Plancher officiel de SC selon la nature de la tentative (0 = aucun plancher, INCONNU). */
export function officialFloorFor(kind: AttemptKind): number {
  switch (kind) {
    case 'normal':
      return MIN_SC_NORMAL;
    case 'heavy_exo':
      return MIN_SC_HEAVY_EXO;
    case 'over':
    case 'exo':
      return 0;
  }
}

export function applyOfficialBounds(raw: ProbabilityOutput, kind: AttemptKind): ProbabilityOutput {
  const floor = officialFloorFor(kind);

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
