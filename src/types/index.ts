/** Raw effect from DofusDB API */
export interface DofusDBEffect {
  effectId: number;
  from: number;
  to: number;
  characteristic: number;
}

/** Raw item from DofusDB API */
export interface DofusDBItem {
  id: number;
  name: { fr: string; en?: string };
  level: number;
  typeId: number;
  imgUrl?: string;
  img?: string;
  effects: DofusDBEffect[];
}

/** DofusDB API paginated response */
export interface DofusDBResponse {
  data: DofusDBItem[];
  total: number;
  limit: number;
  skip: number;
}

/** Mapped stat info for a rune/effect type */
export interface RuneInfo {
  statName: string;
  weightPerPoint: number;
  isForgemeable: boolean;
  runeNormal?: number;   // value added by a normal rune
  runePa?: number;       // value added by Pa rune
  runeRa?: number;       // value added by Ra rune
}

/** A single stat line in the simulation */
export interface SimulatedStat {
  effectId: number;
  statName: string;
  baseMin: number;
  baseMax: number;
  currentValue: number;
  weightPerPoint: number;
  isExo: boolean;
  isForgemeable: boolean;
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

/** Result of pool calculation (extended) */
export interface PoolResult {
  baseWeight: number;
  currentWeight: number;
  poolGained: number;
  poolSpent: number;
  poolRemaining: number;
  /** Poids max théorique (toutes lignes au max) */
  maxTheoreticalWeight: number;
  /** Qualité de l'item : currentWeight / maxWeight en % */
  qualityPercent: number;
  /** Probabilité d'obtenir ce jet ou mieux (0-1) */
  rollProbability: number;

  // ─── Budget Over/Exo (règle des 101) ───
  /** Poids total des overs (stats au-dessus du jet parfait) */
  overWeight: number;
  /** Poids total des stats exotiques */
  exoWeight: number;
  /** Poids combiné over + exo (ne doit pas dépasser 101) */
  overExoTotal: number;
  /** Budget restant sur les 101 pour overs/exos */
  overExoBudgetRemaining: number;
}

// ─── Simulation types ───

/** Type de rune appliquée */
export type RuneTier = 'normal' | 'pa' | 'ra';

/** Résultat d'une tentative de rune */
export type RuneOutcome = 'SC' | 'SN' | 'EC';

/** Entrée dans le log de simulation */
export interface SimLogEntry {
  id: number;
  /** Stat ciblée */
  targetStatName: string;
  targetEffectId: number;
  /** Rune utilisée */
  runeTier: RuneTier;
  runeValue: number;
  runeWeight: number;
  /** Résultat */
  outcome: RuneOutcome;
  /** Détails du recul (si SN ou EC) */
  sideEffect?: {
    affectedStatName: string;
    affectedEffectId: number;
    pointsLost: number;
  };
  /** Puits restant après cette action */
  poolAfter: number;
}

/** Résultat du moteur de simulation pour une tentative */
export interface SimulationResult {
  outcome: RuneOutcome;
  newStats: SimulatedStat[];
  logEntry: SimLogEntry;
}

/** Mode de l'application */
export type AppMode = 'planning' | 'simulation';

/** State of the simulation with undo history */
export interface SimulationState {
  item: Item | null;
  stats: SimulatedStat[];
  history: SimulatedStat[][];
  future: SimulatedStat[][];
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
  | { type: 'UPDATE_STAT'; effectId: number; newValue: number }
  | { type: 'ADD_EXO'; stat: SimulatedStat }
  | { type: 'REMOVE_EXO'; effectId: number }
  | { type: 'RESET_TO_PERFECT' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'TOGGLE_MODE' }
  | { type: 'APPLY_RUNE'; result: SimulationResult }
  | { type: 'CLEAR_LOG' };
