/**
 * Modèle « devblog_1_27 » — interpolation des ancres du DevBlog Ankama de 2010.
 *
 * ⚠️ **CE MODÈLE N'EST JAMAIS LE DÉFAUT, ET SON NOM PORTE SA VERSION.**
 * Un modèle qui reproduit exactement cinq chiffres officiels inspire une confiance que sa
 * source ne justifie pas : ces chiffres datent de la version 1.27 (2010) et leur
 * transposition à Unity 3.6 est une `HYPOTHÈSE`, pas une mesure. Le nommer `devblog_1_27`
 * plutôt que « ancres officielles » est la seule protection efficace contre cette confusion —
 * un nom daté ne peut pas être pris pour une mesure Unity. Toute sortie doit être affichée
 * avec cette version (voir `PROBABILITY_MODEL_LABELS` dans index.ts).
 *
 * ─── Ce que le modèle reproduit ─────────────────────────────────────────────────────────
 * Interpolation linéaire par morceaux des ancres du régime NORMAL, le long d'un scalaire de
 * difficulté D ∈ [0, 1] :
 *
 *   D = 0    → 66 / 34 /  0   (ancre 1 : meilleures probabilités atteignables)
 *   D = 0,5  → 43 / 50 /  7   (ancre 2 : meilleur cas pour atteindre un jet parfait)
 *   D = 1    → 15 / 50 / 35   (ancre 3 : minimum en remontage, objet complexe haut-niveau)
 *
 * Le SN suit la « cloche » décrite par Ankama : « Les chances d'obtenir un succès partiel
 * sont au maximum de 50 %. Elles sont proches de ce maximum dans la majorité des cas : elles
 * diminuent si la transformation est très facile, au profit du succès critique, ou si la
 * transformation est très difficile, au profit de l'échec critique. » Les ancres portent
 * elles-mêmes la montée 34 → 50 ; la redescente vers 0 appartient au régime de création
 * d'effet (ancre 5), traité par le garde-fou. Le plafond de 50 % est appliqué explicitement
 * pour qu'aucun réglage ne puisse le violer.
 *
 * ─── Les cinq ancres sont couvertes, mais pas au même endroit ────────────────────────────
 * Ancres 1 à 3 : ici, dans la courbe.
 * Ancres 4 (32/50/18) et 5 (1/0/99) : dans `exoGuard.ts`, comme BORNES de l'intervalle rendu
 * pour toute création d'effet. Le modèle n'a donc pas de branche exotique — elle serait du
 * code mort, le garde-fou s'appliquant avant lui à toutes les créations d'effet.
 *
 * ─── Ce qui est primaire et ce qui ne l'est pas ─────────────────────────────────────────
 * Les ancres fixent la COURBE : que vaut le triplet à une difficulté donnée.
 * `params.devblog127.difficultyWeights` fixe la POSITION sur la courbe : à quelle difficulté
 * correspond une situation donnée. Les deux sont indépendants, et **seule la courbe est
 * primaire**. Les poids ne sont sourcés que par leur ORDRE (« par ordre décroissant
 * d'importance : qualité globale de l'objet, qualité du jet modifié, niveau de l'objet ») ;
 * leurs valeurs sont arbitraires et portent le statut `INCONNU`.
 */

import type { ProbabilityParams } from '../../../data/params';
import { MAX_SN, NORMAL_ANCHORS } from '../devblogAnchors';
import { distanceToMax, NEUTRAL_STRUCTURAL_FLAGS, type ProbabilityModel, type ProbabilityOutput } from '../types';

export const devblog127Model: ProbabilityModel = {
  name: 'devblog_1_27',
  compute(input, params: ProbabilityParams) {
    return interpolateAnchors(difficultyOf(input, params));
  },
};

/**
 * Scalaire de difficulté D ∈ [0, 1], mélange pondéré des facteurs cités par Ankama.
 * `distance = null` (exo, jet fixe) neutralise le terme de qualité du jet plutôt que de le
 * lire comme un jet parfait.
 */
function difficultyOf(
  input: Parameters<ProbabilityModel['compute']>[0],
  params: ProbabilityParams
): number {
  const w = params.devblog127.difficultyWeights;
  const distance = distanceToMax(input.line);
  const rollDifficulty = distance === null ? 0 : 1 - distance;
  const level = params.officialFactorsLinear.levelNormalizer > 0
    ? clamp01(Math.max(0, input.itemLevel) / params.officialFactorsLinear.levelNormalizer)
    : 0;
  const f = input.structural ?? NEUTRAL_STRUCTURAL_FLAGS;
  const s = params.structuralFactors;
  const palierApplies = f.atOrAbovePalier80 && !(s.fixedRollExempt && f.fixedRoll);

  const base =
    w.rollQuality * rollDifficulty +
    w.itemQuality * clamp01(input.itemQuality ?? 0) +
    w.level * level +
    w.overCapUsage * clamp01(input.overCapUsage ?? 0);

  // Mêmes drapeaux structurels que le modèle linéaire, mêmes pentes nulles par défaut :
  // ils augmentent la difficulté ici au lieu de baisser pSC là-bas, effet identique.
  const structural =
    (palierApplies ? s.palier80 : 0) +
    (f.ethereal ? s.ethereal : 0) +
    s.overExoCount * Math.max(0, f.overExoCount) -
    (f.singleNaturalRoll ? s.singleNaturalRoll : 0);

  return clamp01(base + structural);
}

/** Interpolation linéaire par morceaux entre les ancres, SN plafonné à 50 %. */
export function interpolateAnchors(difficulty: number): ProbabilityOutput {
  const d = clamp01(difficulty);
  const anchors = NORMAL_ANCHORS;
  let lo = anchors[0];
  let hi = anchors[anchors.length - 1];
  for (let i = 0; i < anchors.length - 1; i++) {
    if (d >= anchors[i].difficulty && d <= anchors[i + 1].difficulty) {
      lo = anchors[i];
      hi = anchors[i + 1];
      break;
    }
  }
  const span = hi.difficulty - lo.difficulty;
  const t = span > 0 ? (d - lo.difficulty) / span : 0;
  const mix = (a: number, b: number) => a + (b - a) * t;

  const pSC = mix(lo.probabilities.pSC, hi.probabilities.pSC);
  const pSN = Math.min(MAX_SN, mix(lo.probabilities.pSN, hi.probabilities.pSN));
  // L'EC absorbe le reste : la somme vaut 1 par construction, y compris si le plafond de SN
  // a mordu (ce que les ancres ne provoquent jamais, mais un réglage pourrait).
  return { pSC, pSN, pEC: Math.max(0, 1 - pSC - pSN) };
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}
