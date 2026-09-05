/**
 * Types de l'interface (atelier). Les types du moteur sont dans ./forgemagie.ts.
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
  /** Densité (poids par point), résolue depuis empirical_params.json et les surcharges actives */
  weightPerPoint: number;
  isExo: boolean;
  isForgemeable: boolean;
  /** Verrouillée (objet transcendé) */
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

export type ForgeActionKind = 'rune' | 'transcendence' | 'orb' | 'potion';

/** Entrée dans le Livre de forge */
export interface SimLogEntry {
  id: number;
  kind: ForgeActionKind;
  /** Libellé de l'action, ex. « Pa Vi +15 », « Ta Fo +10 », « Orbe régénérant » */
  actionLabel: string;
  /** Stat ciblée (vide pour un orbe) */
  targetStatName: string;
  targetCharacteristicId: number | null;
  runeValue: number;
  runeWeight: number;
  /** Issue (fournie ou tirée par le modèle) */
  outcome: RuneOutcome;
  /** L'issue a été tirée par le modèle probabiliste (sinon forcée à la main) */
  drawnByModel: boolean;
  modelName?: string;
  /** Tentative refusée par le moteur (plafond, verrou…) */
  refusedReason?: RefusalReason;
  /** Pertes appliquées sur des lignes */
  losses: (LossRecord & { statName: string })[];
  absorbedByResidual: number;
  residualPoolBefore: number;
  residualPoolAfter: number;
}

/** Dernier événement appliqué, pour les micro-interactions (rejouées par clé) */
export interface ForgeEvent {
  id: number;
  kind: ForgeActionKind;
  outcome: RuneOutcome;
  refused: boolean;
  targetCharacteristicId: number | null;
  lostCharacteristicIds: number[];
  residualDelta: number;
}

export type AtelierMode = 'forge' | 'adjust';

export interface AtelierSnapshot {
  stats: SimulatedStat[];
  residualPool: number;
  itemLocked: boolean;
}

/** State of the atelier with undo history */
export interface AtelierState {
  item: Item | null;
  stats: SimulatedStat[];
  /** Reliquat serveur (état propre, ≥ 0) */
  residualPool: number;
  /** Objet transcendé (plus de forgemagie ni d'orbe) */
  itemLocked: boolean;
  history: AtelierSnapshot[];
  future: AtelierSnapshot[];
  mode: AtelierMode;
  selectedCharacteristicId: number | null;
  log: SimLogEntry[];
  logCounter: number;
  lastEvent: ForgeEvent | null;
}

export type AtelierAction =
  | { type: 'SET_ITEM'; item: Item; stats: SimulatedStat[] }
  | { type: 'RESTORE'; state: Partial<AtelierState> }
  | { type: 'UPDATE_STAT'; characteristicId: number; newValue: number; max: number }
  | { type: 'ADD_EXO'; stat: SimulatedStat }
  | { type: 'REMOVE_EXO'; characteristicId: number }
  | { type: 'RESET_TO_PERFECT' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_MODE'; mode: AtelierMode }
  | { type: 'SELECT_LINE'; characteristicId: number | null }
  | { type: 'APPLY_RESULT'; snapshot: AtelierSnapshot; logEntry: SimLogEntry; event: ForgeEvent }
  | { type: 'RESET_RESIDUAL' }
  | { type: 'CLEAR_LOG' };
