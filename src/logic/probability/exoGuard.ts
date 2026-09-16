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
 * 1. RÉGIME 1 % (« exo lourd » : liste PA/PM/PO/Invocations, OU ligne dont le poids non
 *    naturel après la rune atteint 30 — heavyRegime.ts) : pSC est **épinglé à 1 %**.
 *    Attention à ce que cela veut dire : le tutoriel Ankama écrit « peut **descendre
 *    jusqu'à** 1 % », donc 1 % est un **plancher attesté**, pas la valeur du cas. Retenir ce
 *    plancher COMME valeur est une politique de projet (borne basse d'un intervalle qui va
 *    théoriquement, comme pour toute création d'effet, de l'ancre 5 (1 %) à l'ancre 4
 *    (32 %) — **rien ne documente où il tombe entre les deux**). Ce que cette politique a
 *    pour elle : le consensus des guides, et le poids (≥ 30) qui place l'opération à
 *    l'extrémité difficile.
 *    Le partage du complément reste `heavyExoEcShare` (HYPOTHÈSE COMMUNAUTAIRE, 1 par
 *    défaut → 1/0/99, l'ancre 5).
 * 2. AUTRE CRÉATION D'EFFET (exo léger) : aucune estimation ponctuelle n'est renvoyée. Le
 *    résultat est un INTERVALLE explicite marqué `INCONNU`, borné par les ancres 4 et 5 du
 *    DevBlog (32/50/18 → 1/0/99). Mieux vaut une incertitude affichée qu'un chiffre faux.
 * 3. Le reste (normal, overmax) n'est pas touché : le modèle s'applique tel quel.
 *
 * ─── Statuts, sans mélange ──────────────────────────────────────────────────────────────
 * - **1 % est ATTEIGNABLE en exo PA** : `SOURCE PRIMAIRE — Unity` (tutoriel « La
 *   forgemagie », dofus.com/fr/mmorpg/tutoriels/420190 : « Le taux de réussite des
 *   forgemagies exotiques est en revanche automatiquement très faible et peut descendre
 *   jusqu'à 1 % si l'on souhaite ajouter un PA ou un PM exotique, par exemple »). C'est tout
 *   ce que la source garantit : une borne basse, pour deux caractéristiques nommées.
 * - **1 % EST le taux du PA** : `HYPOTHÈSE COMMUNAUTAIRE` forte, pas un fait. Ce qui la
 *   soutient : le consensus des guides depuis quinze ans, et la densité de 100 — la plus
 *   lourde du jeu — qui place l'opération à l'extrémité difficile de l'intervalle. Ce qui
 *   manque : toute mesure, et toute indication d'Ankama sur la position du PA entre l'ancre
 *   5 (1 %) et l'ancre 4 (32 %).
 * - **PM** : nommé lui aussi par le tutoriel (« un PA ou un PM exotique », verbatim recoupé
 *   le 2026-09-14) — même niveau de preuve que le PA.
 * - **Portée et Invocations** : même clamp, un niveau de preuve en moins — Ankama ne les
 *   nomme pas ; seule la convergence des guides les range avec le PA et le PM.
 *   `HEAVY_EXO_VERBATIM` (constraints.ts) porte cette distinction jusqu'à l'interface.
 * - L'USAGE du plancher COMME valeur (régime 1 %) : décision de projet, pessimiste,
 *   écrite ici pour qu'on puisse la contester. Elle tient parce que le bas de l'intervalle
 *   est attesté (PA, PM) ou soutenu par consensus (PO, Invocations, poids ≥ 30).
 * - Les BORNES de l'intervalle : `SOURCE PRIMAIRE — v1.27`, transposition `HYPOTHÈSE`.
 * - Le triplet servant à TIRER une issue en simulation (`sampling`) pour un exo LÉGER :
 *   **décision de modèle, pas détail d'affichage**, sortie en paramètre
 *   `probability.unknownIntervalSampling`. `best` par défaut depuis le 2026-09-16 (ancre 4,
 *   32/50/18 — le chiffre d'Ankama pour la création d'effet FACILE, ce que les sources et le
 *   témoignage décrivent pour un exo léger ; décision de Yanis contre la politique du pire).
 *   `worst` (défaut du 2026-09-10 au 2026-09-16) et `midpoint` restent disponibles.
 *   ⚠️ BIAIS ASSUMÉ : quel que soit le réglage, tout Monte Carlo portant sur une création
 *   d'effet non lourde mesure la borne choisie, pas une incertitude. L'affichage, lui,
 *   montre l'intervalle entier.
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
 * `heavyExoEcShare`. Le plancher est primaire ; en faire la valeur est une politique de projet.
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
    // pas que ce soit le taux. Retenir ce plancher comme valeur est une politique de projet.
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
