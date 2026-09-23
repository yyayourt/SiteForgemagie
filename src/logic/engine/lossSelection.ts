/**
 * Étape « Sélection des pertes » : QUELLE ligne perd du poids.
 *
 * La loi réelle est INCONNUE (docs/knowledge : modèles A–E concurrents, aucune expérience
 * publique discriminante). Trois stratégies interchangeables, choisies par
 * empirical_params.json → lossSelection.strategy. Le RNG est injecté : mêmes entrées,
 * même sortie.
 */

import type { LossSelectionStrategyName } from '../../data/params';
import type { ItemLine, Rng } from '../../types/forgemagie';

/** Ligne candidate à une perte, avec sa densité résolue. */
export interface LossCandidate {
  line: ItemLine;
  density: number;
  /** Poids de la plus petite rune de la caractéristique (params.runeQuantum). */
  quantum?: number;
}

/** Contexte d'un tirage de ligne, pour les stratégies qui dépendent de la perte en cours. */
export interface LossSelectionContext {
  /** Poids restant à retirer au moment du tirage (après le puits et les lignes déjà touchées). */
  deficit: number;
  /** Forme de la stratégie weighted_by_deficit_ratio (params.lossSelection.deficitRatio). */
  shape: { heavyExponent: number; lightExponent: number; floor: number };
}

export interface LossSelectionStrategy {
  readonly name: LossSelectionStrategyName;
  /** Choisit une candidate parmi une liste non vide. */
  pick(candidates: LossCandidate[], rng: Rng, context?: LossSelectionContext): LossCandidate;
}

/** Tirage pondéré générique ; les poids nuls ou négatifs sont traités comme 0. */
function pickWeighted(candidates: LossCandidate[], weights: number[], rng: Rng): LossCandidate {
  const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
  if (total <= 0) {
    return candidates[Math.min(candidates.length - 1, Math.floor(rng.next() * candidates.length))];
  }
  let roll = rng.next() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= Math.max(0, weights[i]);
    if (roll < 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

/** Modèle A : équiprobable parmi les lignes admissibles (pseudo-code du PDF audité). */
export const uniformStrategy: LossSelectionStrategy = {
  name: 'uniform',
  pick(candidates, rng) {
    return candidates[Math.min(candidates.length - 1, Math.floor(rng.next() * candidates.length))];
  },
};

/** Modèle B : probabilité ∝ densité unitaire de la ligne. */
export const weightedByWeightStrategy: LossSelectionStrategy = {
  name: 'weighted_by_weight',
  pick(candidates, rng) {
    return pickWeighted(candidates, candidates.map((c) => c.density), rng);
  },
};

/** Modèle C : probabilité ∝ valeur × densité (« masse magique » de la ligne). */
export const weightedByValueTimesWeightStrategy: LossSelectionStrategy = {
  name: 'weighted_by_value_times_weight',
  pick(candidates, rng) {
    return pickWeighted(candidates, candidates.map((c) => c.line.value * c.density), rng);
  },
};

/**
 * Modèle D : poids ∝ f(r), r = quantum de la ligne / déficit restant (« ce qui doit être enlevé »).
 *
 * SOURCE PRIMAIRE — v1.27 (DevBlog, qualitatif) : « Le choix des bonus qui sont perdus est
 * aléatoire. Si un bonus est trop puissant par rapport à ce qui doit être enlevé, il a une
 * chance d'être épargné par la baisse, mais ce n'est pas systématique. […] (comme par exemple
 * en perdant 1 PA en tentant d'ajouter une rune Ine). » Trois contraintes en découlent :
 *   1. on compare la ligne au DÉFICIT restant (après le puits), pas à la rune ;
 *   2. seules les lignes TROP LOURDES sont épargnées : règle ASYMÉTRIQUE ;
 *   3. jamais impossible (1 PA pour une rune Ine, ratio 100:1) : PLANCHER > 0.
 * Témoignages convergents (Alterya 2012, JOL 2012/2017, tutoriel Touch 2018, DekaPhobia/Banjore
 * 2025, fil « Priorité en forgemagie » 24/01/2026) : lignes « de poids équivalent » touchées en
 * priorité, PA « extrêmement rare » avec une petite rune, lignes légères touchées normalement
 * (« 3 agi pour une Pa Ine »).
 *
 * Forme retenue (HYPOTHÈSE paramétrable, recherche du 2026-09-23) :
 *   r > 1 (ligne trop lourde) : f = r^(−kH)        kH = heavyExponent, défaut 1
 *   r ≤ 1 (ligne plus légère) : f = r^(kL)         kL = lightExponent, défaut 0,25
 *   w = ε + (1 − ε) · f                            ε  = floor, défaut 0,03
 * Ordre de grandeur : rune de poids 1 sur Vi / Fo / PA → PA touché ≈ 2 % (uniforme : 33 %).
 *
 * Quantum = poids de la plus petite rune de la caractéristique (Vi = Ini = 1, Pod = 2,5, PA =
 * 100) : Vi et Ini sont traitées comme des runes de poids 1, pas 0,2 (fil du 24/01/2026).
 */
export function deficitRatioWeight(
  quantum: number,
  deficit: number,
  shape: { heavyExponent: number; lightExponent: number; floor: number }
): number {
  const eps = Math.min(1, Math.max(0, shape.floor));
  if (!(quantum > 0) || !(deficit > 0)) return 1;
  const r = quantum / deficit;
  const f = r > 1 ? Math.pow(r, -shape.heavyExponent) : Math.pow(r, shape.lightExponent);
  return eps + (1 - eps) * f;
}

export const weightedByDeficitRatioStrategy: LossSelectionStrategy = {
  name: 'weighted_by_deficit_ratio',
  pick(candidates, rng, context) {
    if (!context) return uniformStrategy.pick(candidates, rng);
    return pickWeighted(
      candidates,
      candidates.map((c) => deficitRatioWeight(c.quantum ?? c.density, context.deficit, context.shape)),
      rng
    );
  },
};

const STRATEGIES: Record<LossSelectionStrategyName, LossSelectionStrategy> = {
  uniform: uniformStrategy,
  weighted_by_weight: weightedByWeightStrategy,
  weighted_by_value_times_weight: weightedByValueTimesWeightStrategy,
  weighted_by_deficit_ratio: weightedByDeficitRatioStrategy,
};

export function getLossSelectionStrategy(name: LossSelectionStrategyName): LossSelectionStrategy {
  const strategy = STRATEGIES[name];
  if (!strategy) throw new Error(`Unknown loss selection strategy: ${name}`);
  return strategy;
}
