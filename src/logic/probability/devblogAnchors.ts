/**
 * Les cinq ancres de probabilités du DevBlog Ankama « La nouvelle forgemagie ».
 *
 * STATUT : `SOURCE PRIMAIRE — v1.27`. Ce sont les chiffres publiés par Ankama en 2010, à la
 * suite de la version 1.27 (archive : web.archive.org/web/20101118084715/
 * http://devblog.dofus.com/fr/billets/61-nouvelle-forgemagie.html). Fiche de source :
 * docs/knowledge/sources/S1-devblog-ankama-1.27.md.
 *
 * ⚠️ LEUR TRANSPOSITION À UNITY EST UNE `HYPOTHÈSE`, jamais une source primaire pour la
 * version courante. Argument en sa faveur, à citer chaque fois qu'on s'en sert : le 15 % de
 * l'ancre 3 et le 1 % de l'ancre 5 sont repris À L'IDENTIQUE dans le tutoriel Ankama actuel
 * (SOURCE PRIMAIRE — Unity), donc deux des cinq bornes ont traversé seize ans et le portage
 * Unity. Argument contre, à citer aussi : deux bornes reconduites ne disent rien des trois
 * autres, ni de la forme de la courbe entre elles.
 *
 * Codées en dur parce que ce sont des FAITS HISTORIQUES, pas des réglages : elles n'ont pas
 * leur place dans empirical_params.json, qui n'accueille que ce qui est ajustable.
 * Ce qui est ajustable, c'est la façon de s'en servir (params.probability.devblog127).
 */

import type { ProbabilityOutput } from './types';

/** Un triplet d'ancre, exprimé en fractions de 1 (le DevBlog les donne en pourcents entiers). */
function anchor(sc: number, sn: number, ec: number): ProbabilityOutput {
  return { pSC: sc / 100, pSN: sn / 100, pEC: ec / 100 };
}

/**
 * Ancre 1 — « Les meilleures probabilités atteignables (remontage d'un effet simple comme la
 * vitalité sur un objet normal pour un maître forgemage) ».
 */
export const ANCHOR_BEST_REROLL = anchor(66, 34, 0);

/**
 * Ancre 2 — « Les meilleures probabilités (bonus simples sur objets simples) pour tenter
 * d'atteindre un jet parfait ». C'est l'ancre que le relais Yin-Yang donnait à tort 34/50/16 ;
 * l'original dit 43/50/7 (docs/knowledge/sources/genealogie.md).
 */
export const ANCHOR_PERFECT_ROLL = anchor(43, 50, 7);

/**
 * Ancre 3 — « Les probabilités minimums (bonus maximums sur objets complexes haut-niveau) en
 * remontage d'effets pour un maître qui utilise des runes de puissance suffisante ».
 * Son SC de 15 % est reconduit tel quel par le tutoriel Unity : voir constraints.ts.
 */
export const ANCHOR_WORST_REROLL = anchor(15, 50, 35);

/**
 * Ancre 4 — « Les probabilités maximums en création d'effet pour un maître ».
 * JAMAIS reprise par aucun guide communautaire en quinze ans : c'est son omission qui a fait
 * croire que « l'exo, c'est 1 % » était une constante. C'est le PLAFOND de la création d'effet.
 */
export const ANCHOR_BEST_CREATION = anchor(32, 50, 18);

/**
 * Ancre 5 — « Les probabilités minimums en création d'effet pour un maître ».
 * C'est le PLANCHER de la création d'effet, atteint sur les cas extrêmes (PA, PM, PO sur objet
 * déjà chargé). Son SC de 1 % est reconduit par le tutoriel Unity (« peut descendre jusqu'à
 * 1 % » — formulation de plancher, jamais de constante).
 */
export const ANCHOR_WORST_CREATION = anchor(1, 0, 99);

/**
 * Les trois ancres du régime NORMAL (remontage et overmax), ordonnées par difficulté
 * croissante. Le modèle devblog_1_27 interpole entre elles ; le régime de création d'effet
 * est traité à part par exoGuard.ts, borné par les ancres 4 et 5.
 */
export const NORMAL_ANCHORS: readonly { difficulty: number; probabilities: ProbabilityOutput }[] = [
  { difficulty: 0, probabilities: ANCHOR_BEST_REROLL },
  { difficulty: 0.5, probabilities: ANCHOR_PERFECT_ROLL },
  { difficulty: 1, probabilities: ANCHOR_WORST_REROLL },
];

/**
 * SOURCE PRIMAIRE — v1.27 : « Les chances d'obtenir un succès partiel sont au maximum de
 * 50 %. Elles sont proches de ce maximum dans la majorité des cas : elles diminuent si la
 * transformation est très facile, au profit du succès critique, ou si la transformation est
 * très difficile, au profit de l'échec critique. »
 *
 * Les ancres respectent ce plafond (34 → 50 → 50 → 50 → 0) ; la contrainte est appliquée
 * explicitement pour qu'un réglage ne puisse pas la violer.
 */
export const MAX_SN = 0.5;
