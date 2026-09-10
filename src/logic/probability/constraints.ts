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

/**
 * `SOURCE PRIMAIRE — Unity` : **1 % est ATTEIGNABLE** en exo lourd.
 *
 * Le tutoriel écrit « peut **descendre jusqu'à** 1 % » : c'est un **plancher**, pas une
 * valeur. Le moteur, lui, en fait aussi un **plafond** — et cela n'est pas primaire.
 * C'est l'application au cas de l'exo lourd de la même politique conservatrice que
 * `probability.unknownIntervalSampling` applique aux autres créations d'effet : retenir la
 * **borne basse** d'un intervalle dont on ne sait pas où l'on tombe.
 *
 * L'intervalle est le même que pour toute création d'effet : ancre 5 (1 %) à ancre 4
 * (32 %), v1.27. **Rien ne documente où le PA tombe entre les deux.** Le consensus
 * communautaire et la densité de 100 — la plus lourde du jeu, donc l'extrémité difficile —
 * rendent le bas de l'intervalle très plausible, ce qui en fait une
 * `HYPOTHÈSE COMMUNAUTAIRE` forte, jamais un fait.
 *
 * Le nom `MIN_` dit ce que la source garantit ; l'usage en plafond est une décision de
 * projet, écrite ici pour être contestable.
 */
export const MIN_SC_HEAVY_EXO = 0.01;

/**
 * Caractéristiques pour lesquelles Ankama **nomme** l'exotique en citant le 1 % : le **PA**
 * (caractéristique 1), et lui seul — « peut descendre jusqu'à 1 % si l'on souhaite ajouter
 * un PA… ».
 *
 * ⚠️ Ce qui est verbatim, c'est **l'ATTEIGNABILITÉ du 1 % pour le PA**, pas le fait que ce
 * soit le taux du PA en toutes circonstances (voir `MIN_SC_HEAVY_EXO`). La distinction que
 * cette constante porte est donc : pour le PA, on sait que la borne basse existe ; pour le
 * PM (23) et la Portée (19), on ne sait même pas cela — aucune source primaire ne les nomme,
 * seule la convergence des guides les range avec le PA.
 *
 * Le clamp est identique pour les trois ; deux niveaux de preuve différents le justifient.
 *
 * Réserve : la citation se termine par des points de suspension. Le PM et la PO figurent
 * peut-être dans la partie élidée ; on ne le sait pas, donc on ne l'affirme pas.
 */
export const HEAVY_EXO_VERBATIM: readonly number[] = [1];

/** Ankama nomme-t-il cette caractéristique en citant le 1 %, ou est-elle rangée là par convergence ? */
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
