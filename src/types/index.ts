/**
 * Types de l'interface (simulateur). Les types du moteur sont dans ./forgemagie.ts.
 *
 * Clé d'identification d'une ligne de stat : `characteristicId` (champ `characteristic`
 * de DofusDB), jamais `effectId`.
 */

import type { LossRecord, RefusalReason, RuneOutcome } from './forgemagie';

export type { RuneOutcome } from './forgemagie';

/** A single stat line in the simulation (vue UI d'une ItemLine) */
export interface SimulatedStat {
  characteristicId: number;
  statName: string;
  baseMin: number;
  baseMax: number;
  currentValue: number;
  /** Densité (poids par point) figée au chargement depuis empirical_params.json */
  weightPerPoint: number;
  isExo: boolean;
  isForgemeable: boolean;
  /** Verrouillée par une rune de transcendance */
  isLocked: boolean;
}

/** Processed item ready for simulation */
export interface Item {
  id: number;
  name: string;
  level: number;
  typeId: number;
  typeName: string;
  imgUrl: string;
}

/** Budget de poids de planification (src/logic/planning). PAS le reliquat serveur. */
export interface WeightBudget {
  baseWeight: number;
  currentWeight: number;
  /** Poids libéré par les lignes sous leur jet parfait */
  freedWeight: number;
  /** Poids consommé par les overs et les exos */
  spentWeight: number;
  /** freedWeight − spentWeight (peut être négatif : planification, pas reliquat) */
  remainingBudget: number;
  /** Poids max théorique (toutes lignes au plafond) */
  maxTheoreticalWeight: number;
  /** Qualité de l'item : currentWeight / poids du jet parfait en % */
  qualityPercent: number;
  /** Poids total des overs (stats au-dessus du jet parfait) */
  overWeight: number;
  /** Poids total des stats exotiques */
  exoWeight: number;
  /** over + exo */
  overExoTotal: number;
  /** overCapWeight − overExoTotal (lecture « globale », indicatif) */
  overExoBudgetRemaining: number;
}

// ─── Simulation types ───

/** Type de rune appliquée */
export type RuneTier = 'normal' | 'pa' | 'ra';

/** Entrée dans le log de simulation */
export interface SimLogEntry {
  id: number;
  /** Stat ciblée */
  targetStatName: string;
  targetCharacteristicId: number;
  /** Rune utilisée */
  runeTier: RuneTier;
  runeValue: number;
  runeWeight: number;
  /** Issue (fournie manuellement tant que le modèle probabiliste n'existe pas) */
  outcome: RuneOutcome;
  /** Tentative refusée par le moteur (plafond, verrou…) */
  refusedReason?: RefusalReason;
  /** Pertes appliquées sur des lignes */
  losses: (LossRecord & { statName: string })[];
  absorbedByResidual: number;
  residualPoolBefore: number;
  residualPoolAfter: number;
}

/** Mode de l'application */
export type AppMode = 'planning' | 'simulation';

/** State of the simulation with undo history */
export interface SimulationState {
  item: Item | null;
  stats: SimulatedStat[];
  /** Reliquat serveur (état propre, ≥ 0) */
  residualPool: number;
  history: { stats: SimulatedStat[]; residualPool: number }[];
  future: { stats: SimulatedStat[]; residualPool: number }[];
  /** Mode actif */
  mode: AppMode;
  /** Log de simulation (mode simulation uniquement) */
  simulationLog: SimLogEntry[];
  /** Compteur auto-incrémenté pour les IDs de log */
  logCounter: number;
}

/** Actions for the simulation reducer */
export type SimulationAction =
  | { type: 'SET_ITEM'; item: Item; stats: SimulatedStat[] }
  | { type: 'UPDATE_STAT'; characteristicId: number; newValue: number }
  | { type: 'ADD_EXO'; stat: SimulatedStat }
  | { type: 'REMOVE_EXO'; characteristicId: number }
  | { type: 'RESET_TO_PERFECT' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'TOGGLE_MODE' }
  | { type: 'APPLY_RUNE'; stats: SimulatedStat[]; residualPool: number; logEntry: SimLogEntry }
  | { type: 'RESET_RESIDUAL' }
  | { type: 'CLEAR_LOG' };
