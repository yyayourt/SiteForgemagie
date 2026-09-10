/**
 * MODÈLE probabiliste SC/SN/EC.
 *
 * La formule serveur est SECRÈTE (forum officiel, docs/knowledge). Tout ce qui sort d'ici est
 * un modèle paramétré (empirical_params.json → probability), jamais une reproduction, et
 * l'interface doit toujours l'afficher comme tel.
 */

import type { ProbabilityParams } from '../../data/params';

/**
 * Drapeaux structurels du DevBlog Ankama 1.27 (`SOURCE PRIMAIRE — v1.27` pour leur
 * existence). Ils entrent dans le modèle avec des pentes NULLES
 * (`params.probability.structuralFactors`) et hors du vecteur ajusté a/b/c/d/e : ce sont des
 * faits de mécanique en attente de mesure, pas des degrés de liberté d'ajustement.
 */
export interface StructuralFlags {
  /**
   * La ligne visée est au-delà de 80 % de sa FOURCHETTE (baseMin + 0,8 × (baseMax − baseMin)).
   * « Il s'agit d'un pallier, la difficulté augmente brutalement à 80 % du jet. »
   */
  atOrAbovePalier80: boolean;
  /** Jet fixe (baseMin = baseMax) : le palier ne s'applique pas (SOURCE PRIMAIRE — v1.27). */
  fixedRoll: boolean;
  /** L'objet ne dispose naturellement que d'un seul jet : plus facile à forgemager. */
  singleNaturalRoll: boolean;
  /** Objet éthéré : plus difficile. Toujours faux tant que le dataset n'expose pas la notion. */
  ethereal: boolean;
  /** Nombre de lignes en over ou exotiques, LIGNE VISÉE COMPRISE (le DevBlog l'inclut ici). */
  overExoCount: number;
}

export interface ProbabilityInput {
  /** Niveau de l'objet — facteur cité par Ankama. */
  itemLevel: number;
  /** Ligne visée : proximité du jet max — facteur cité par Ankama. baseMax = 0 pour un exo. */
  line: { value: number; baseMin?: number; baseMax: number; isExo: boolean };
  /** Poids de la rune (valeur × densité). */
  runeWeight: number;
  /** Valeur ajoutée par la rune (points) : décide si la tentative est un overmax. */
  runeValue: number;
  /** Exo lourd (PA/PM/PO) : garde-fou à 1 % au lieu du modèle. */
  isHeavyExo: boolean;
  /** Reliquat serveur (état propre). Aucun modèle certain ne l'utilise. */
  residualPool: number;
  /** Budget de planification (dérivé de l'état visible). Utilisé seulement par pool_ratio_legacy. */
  weightBudget: number;
  /**
   * Usage de la borne d'over/exo APRÈS la rune : cumul (part over + exo) / overCapWeight.
   * 0 = aucun over ni exo, 1 = exactement à la borne. Optionnel : absent = 0. Utilisé par le
   * terme d de official_factors_linear (pente INCONNUE, nulle par défaut).
   */
  overCapUsage?: number;
  /**
   * Qualité globale de l'objet ∈ [0, 1], **hors ligne visée** — facteur cité par Ankama comme
   * LE PLUS IMPORTANT, et absent du modèle jusqu'au 2026-09-10 (terme e).
   * `SOURCE PRIMAIRE — v1.27` : « le jet en cours de modification n'est pas pris en compte
   * dans le calcul de la qualité, afin de limiter l'impact de ce facteur sur les objets
   * bas-niveau ou avec un seul jet. » Optionnel : absent = 0.
   * Voir `itemQualityExcluding` (itemQuality.ts).
   */
  itemQuality?: number;
  /** Drapeaux structurels du DevBlog 1.27. Optionnels : absents = tous neutres. */
  structural?: StructuralFlags;
}

export interface ProbabilityOutput {
  pSC: number;
  pSN: number;
  pEC: number;
}

export interface ProbabilityModel {
  readonly name: ProbabilityParams['model'];
  /** Probabilités BRUTES du modèle, avant garde-fou et bornes officielles. Somme = 1. */
  compute(input: ProbabilityInput, params: ProbabilityParams): ProbabilityOutput;
}

/**
 * Nature d'une tentative, au sens du tutoriel officiel : le plancher de 15 % vaut « hors
 * tentative d'overmax ou de forgemagie exotique ».
 * - normal : ligne naturelle qui reste ≤ son jet max après la rune ;
 * - over : ligne naturelle qui dépasse (ou dépasse déjà) son jet max ;
 * - exo : ligne exotique hors PA/PM/PO ;
 * - heavy_exo : exo PA/PM/PO (garde-fou officiel à 1 %).
 */
export type AttemptKind = 'normal' | 'over' | 'exo' | 'heavy_exo';

export function attemptKindOf(line: ProbabilityInput['line'], runeValue: number, isHeavyExo: boolean): AttemptKind {
  if (isHeavyExo) return 'heavy_exo';
  if (line.isExo) return 'exo';
  return line.value + Math.max(0, runeValue) > line.baseMax ? 'over' : 'normal';
}

/**
 * Distance normalisée au jet maximal : 0 = ligne au jet parfait, 1 = ligne vide.
 *
 * Renvoie **`null` quand la notion n'a pas de sens** : ligne exotique (aucun jet naturel) ou
 * ligne sans fourchette positive. Correction du 2026-09-10 : la fonction renvoyait 0 dans ces
 * cas, ce qui les rendait indiscernables d'un jet parfait — c'est-à-dire du cas le PLUS
 * difficile. Pour un exo, cela produisait un pSC de 15 % là où le tutoriel officiel donne 1 %
 * (voir exoGuard.ts) ; pour un jet fixe, cela appliquait la difficulté maximale alors que le
 * DevBlog exempte explicitement les jets fixes de ce facteur.
 *
 * Un modèle qui reçoit `null` doit décider quoi faire du facteur, jamais le confondre avec 0.
 */
export function distanceToMax(line: ProbabilityInput['line']): number | null {
  if (line.isExo || line.baseMax <= 0) return null;
  return Math.min(1, Math.max(0, (line.baseMax - line.value) / line.baseMax));
}

/** Répartit le complément de pSC entre SN et EC selon la part d'EC, en bornant dans [0, 1]. */
export function splitComplement(pSC: number, ecShare: number): ProbabilityOutput {
  const sc = Math.min(1, Math.max(0, pSC));
  const share = Math.min(1, Math.max(0, ecShare));
  const rest = 1 - sc;
  return { pSC: sc, pSN: rest * (1 - share), pEC: rest * share };
}

/** Drapeaux neutres : aucun effet, quelles que soient les pentes. */
export const NEUTRAL_STRUCTURAL_FLAGS: StructuralFlags = {
  atOrAbovePalier80: false,
  fixedRoll: false,
  singleNaturalRoll: false,
  ethereal: false,
  overExoCount: 0,
};

/**
 * Drapeaux structurels d'une tentative, déduits de la ligne visée et de l'objet.
 * Le palier est évalué sur la valeur AVANT la rune (« le jet que l'on modifie ») ;
 * l'évaluation après la rune est une lecture concurrente, INCONNU.
 */
export function structuralFlagsOf(
  line: ProbabilityInput['line'],
  item: { naturalLineCount: number; overExoCount: number; ethereal?: boolean }
): StructuralFlags {
  const baseMin = line.baseMin ?? 0;
  const fixedRoll = !line.isExo && line.baseMax > 0 && baseMin === line.baseMax;
  const threshold = baseMin + 0.8 * (line.baseMax - baseMin);
  return {
    atOrAbovePalier80: !line.isExo && line.baseMax > 0 && !fixedRoll && line.value >= threshold,
    fixedRoll,
    singleNaturalRoll: item.naturalLineCount <= 1,
    ethereal: item.ethereal ?? false,
    overExoCount: item.overExoCount,
  };
}
