/**
 * GARDE-FOU D'EXOTISME — appliqué à TOUT modèle, avant les bornes officielles.
 *
 * ─── Le défaut qu'il corrige (2026-09-10) ───────────────────────────────────────────────
 * `distanceToMax` renvoyait 0 pour toute ligne exotique, ce qui la rendait indiscernable
 * d'une ligne au jet parfait. Avec `a = 0,15`, un exo PA sur objet propre sortait donc à
 * **15 / 0 / 85**. Ce chiffre ne correspondait à AUCUNE source : ni au 1 % du tutoriel
 * officiel Unity, ni au 32 % de l'ancre 4 du DevBlog, ni au plancher normal de 15 % — qui,
 * par le texte même du tutoriel, ne s'applique PAS aux exotiques. Le plancher de 1 %
 * (`MIN_SC_HEAVY_EXO`) ne mordait jamais, puisque 0,15 > 0,01.
 *
 * Sur l'opération la plus coûteuse du jeu, le simulateur était donc quinze fois trop
 * optimiste. C'est un défaut plus grave qu'une imprécision : un joueur brûle des runes.
 *
 * ─── Ce que le garde-fou fait ───────────────────────────────────────────────────────────
 * 1. EXO LOURD (PA, PM, PO) : pSC est **épinglé à 1 %**. Attention à ce que cela veut dire :
 *    le tutoriel Ankama écrit « peut **descendre jusqu'à** 1 % », donc 1 % est un
 *    **plancher attesté**, pas la valeur du cas. Retenir ce plancher COMME valeur, c'est
 *    appliquer au PA/PM/PO exactement la politique `unknownIntervalSampling = worst` que le
 *    point 2 applique aux autres créations d'effet : un exo lourd est une création d'effet
 *    comme une autre, son intervalle théorique va lui aussi de l'ancre 5 (1 %) à l'ancre 4
 *    (32 %), et **rien ne documente où il tombe entre les deux**.
 *    Le partage du complément reste `heavyExoEcShare` (HYPOTHÈSE COMMUNAUTAIRE, 1 par
 *    défaut → 1/0/99, l'ancre 5).
 * 2. AUTRE CRÉATION D'EFFET : aucune estimation ponctuelle n'est renvoyée. Le résultat est
 *    un INTERVALLE explicite marqué `INCONNU`, borné par les ancres 4 et 5 du DevBlog
 *    (32/50/18 → 1/0/99). Mieux vaut une incertitude affichée qu'un chiffre faux.
 * 3. Le reste (normal, overmax) n'est pas touché : le modèle s'applique tel quel.
 *
 * ─── Statuts, sans mélange ──────────────────────────────────────────────────────────────
 * - **1 % est ATTEIGNABLE en exo PA** : `SOURCE PRIMAIRE — Unity` (tutoriel « La
 *   forgemagie », dofus.com/fr/mmorpg/tutoriels/420190 : « Le taux de réussite des
 *   forgemagies exotiques est en revanche automatiquement très faible et peut descendre
 *   jusqu'à 1 % si l'on souhaite ajouter un PA… »). C'est tout ce que la source garantit :
 *   une borne basse, pour une caractéristique nommée.
 * - **1 % EST le taux du PA** : `HYPOTHÈSE COMMUNAUTAIRE` forte, pas un fait. Ce qui la
 *   soutient : le consensus des guides depuis quinze ans, et la densité de 100 — la plus
 *   lourde du jeu — qui place l'opération à l'extrémité difficile de l'intervalle. Ce qui
 *   manque : toute mesure, et toute indication d'Ankama sur la position du PA entre l'ancre
 *   5 (1 %) et l'ancre 4 (32 %).
 * - **PM et Portée** : même clamp, un niveau de preuve en moins — Ankama ne les nomme même
 *   pas. `HEAVY_EXO_VERBATIM` (constraints.ts) porte cette distinction jusqu'à l'interface.
 * - L'USAGE du plancher COMME valeur : décision de projet, identique à
 *   `unknownIntervalSampling = worst`. Ne jamais annoncer mieux que le bas de l'intervalle
 *   sur une opération irréversible et coûteuse, tant qu'aucune mesure Unity n'existe. Choix
 *   délibérément pessimiste, écrit ici pour qu'on puisse le contester.
 * - Les BORNES de l'intervalle : `SOURCE PRIMAIRE — v1.27`, transposition `HYPOTHÈSE`.
 * - Le triplet servant à TIRER une issue en simulation (`sampling`) : **décision de modèle,
 *   pas détail d'affichage**, sortie en paramètre `probability.unknownIntervalSampling`
 *   (`worst` par défaut, `best` et `midpoint` disponibles). Un tirage exige un point ;
 *   prendre le haut de l'intervalle réintroduirait l'optimisme que ce module supprime.
 *   ⚠️ BIAIS ASSUMÉ : tant que ce paramètre vaut `worst`, tout Monte Carlo portant sur une
 *   création d'effet non lourde est **pessimiste par construction** — il ne mesure pas une
 *   incertitude, il mesure la borne basse. L'affichage, lui, montre l'intervalle entier.
 *
 * ─── Ce que le garde-fou n'est PAS ──────────────────────────────────────────────────────
 * Il ne construit AUCUN continuum de difficulté entre 32 % et 1 %. Le DevBlog décrit ce
 * continuum, mais sa forme est inconnue et l'inventer produirait exactement le chiffre
 * faussement précis qu'on cherche à éviter. L'intervalle est l'aveu d'ignorance ; il tiendra
 * jusqu'à ce qu'un dataset Unity le remplace.
 */

import type { ProbabilityParams, UnknownIntervalSampling } from '../../data/params';
import { MIN_SC_HEAVY_EXO } from './constraints';
import { ANCHOR_BEST_CREATION, ANCHOR_WORST_CREATION } from './devblogAnchors';
import { splitComplement, type AttemptKind, type ProbabilityOutput } from './types';

/**
 * Estimation rendue à l'appelant. `point` = le modèle a une réponse ; `interval` = il n'en a
 * pas et l'affiche. Dans les deux cas, `sampling` est le triplet utilisé pour TIRER une issue.
 */
export type ProbabilityEstimate =
  | {
      kind: 'point';
      probabilities: ProbabilityOutput;
      sampling: ProbabilityOutput;
      /**
       * Statut à afficher avec le chiffre.
       * `MODÈLE` : sortie du modèle paramétré.
       * `POLITIQUE` : le chiffre ne vient pas d'un modèle mais d'une décision de projet —
       * retenir la borne basse d'un intervalle non documenté (cas de l'exo lourd).
       */
      status: 'MODÈLE' | 'POLITIQUE';
      attemptKind: AttemptKind;
    }
  | {
      kind: 'interval';
      /** Borne haute : ancre 4, création d'effet au mieux. */
      best: ProbabilityOutput;
      /** Borne basse : ancre 5, création d'effet au pire. */
      worst: ProbabilityOutput;
      sampling: ProbabilityOutput;
      /** Borne effectivement utilisée pour `sampling`, à afficher telle quelle. */
      samplingBound: UnknownIntervalSampling;
      status: 'INCONNU';
      attemptKind: AttemptKind;
    };

/**
 * Triplet d'un exo lourd : SC épinglé au plancher attesté (1 %), complément partagé par
 * `heavyExoEcShare`. Le plancher est primaire ; en faire la valeur est la politique `worst`.
 */
export function heavyExoProbabilities(params: ProbabilityParams): ProbabilityOutput {
  return splitComplement(MIN_SC_HEAVY_EXO, params.heavyExoEcShare);
}

/**
 * Applique le garde-fou. Renvoie `null` si la tentative n'est pas une création d'effet :
 * l'appelant garde alors la sortie de son modèle.
 */
export function guardExoticEstimate(
  attemptKind: AttemptKind,
  params: ProbabilityParams
): ProbabilityEstimate | null {
  if (attemptKind === 'heavy_exo') {
    // `POLITIQUE` et non `SOURCE PRIMAIRE` : la source garantit que 1 % est atteignable,
    // pas que ce soit le taux. Retenir ce plancher comme valeur est la politique `worst`.
    const probabilities = heavyExoProbabilities(params);
    return { kind: 'point', probabilities, sampling: probabilities, status: 'POLITIQUE', attemptKind };
  }
  if (attemptKind === 'exo') {
    const bound = params.unknownIntervalSampling;
    return {
      kind: 'interval',
      best: ANCHOR_BEST_CREATION,
      worst: ANCHOR_WORST_CREATION,
      sampling: samplingFor(bound, ANCHOR_WORST_CREATION, ANCHOR_BEST_CREATION),
      samplingBound: bound,
      status: 'INCONNU',
      attemptKind,
    };
  }
  return null;
}

/**
 * Point de tirage retenu dans l'intervalle. Aucune source ne dit où se situe une tentative
 * entre les deux bornes : ce choix est du projet, jamais de la donnée.
 */
export function samplingFor(
  bound: UnknownIntervalSampling,
  worst: ProbabilityOutput,
  best: ProbabilityOutput
): ProbabilityOutput {
  switch (bound) {
    case 'best':
      return best;
    case 'midpoint':
      return {
        pSC: (worst.pSC + best.pSC) / 2,
        pSN: (worst.pSN + best.pSN) / 2,
        pEC: (worst.pEC + best.pEC) / 2,
      };
    case 'worst':
    default:
      return worst;
  }
}

/** Libellé de la borne de tirage, pour l'interface. */
export const SAMPLING_BOUND_LABEL: Record<UnknownIntervalSampling, string> = {
  worst: 'la borne basse',
  best: 'la borne haute',
  midpoint: 'le milieu de l’intervalle',
};

/**
 * Plafond de pSC applicable à une tentative, ou `null` s'il n'y en a pas.
 * Symétrique de `officialFloorFor` : le plancher empêche de sous-estimer, le plafond
 * empêche de sur-estimer. Seul l'exo lourd en a un — et ce plafond est une POLITIQUE, pas
 * une borne officielle : Ankama n'en publie aucune. Voir `MIN_SC_HEAVY_EXO`.
 */
export function guardCeilingFor(attemptKind: AttemptKind): number | null {
  return attemptKind === 'heavy_exo' ? MIN_SC_HEAVY_EXO : null;
}
