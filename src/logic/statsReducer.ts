import type { SimulationState, SimulationAction, SimulatedStat } from '../types';
import { getStatAbsoluteMax } from '../data/statCaps';

const MAX_HISTORY = 100;

export const initialState: SimulationState = {
  item: null,
  stats: [],
  residualPool: 0,
  history: [],
  future: [],
  mode: 'planning',
  simulationLog: [],
  logCounter: 0,
};

/**
 * Reducer de l'interface : lignes visibles + reliquat serveur (état propre, jamais
 * dérivé des lignes), undo/redo, mode planning/simulation, journal.
 */
export function simulationReducer(
  state: SimulationState,
  action: SimulationAction
): SimulationState {
  switch (action.type) {
    case 'SET_ITEM':
      return {
        ...initialState,
        item: action.item,
        stats: action.stats,
      };

    case 'UPDATE_STAT': {
      const newStats = state.stats.map((s) => {
        if (s.characteristicId !== action.characteristicId || s.isLocked) return s;
        const max = getStatAbsoluteMax(s);
        return { ...s, currentValue: Math.max(0, Math.min(max, action.newValue)) };
      });
      return pushHistory(state, newStats, state.residualPool);
    }

    case 'ADD_EXO': {
      if (state.stats.some((s) => s.characteristicId === action.stat.characteristicId)) {
        return state;
      }
      return pushHistory(state, [...state.stats, action.stat], state.residualPool);
    }

    case 'REMOVE_EXO': {
      const newStats = state.stats.filter(
        (s) => !(s.characteristicId === action.characteristicId && s.isExo)
      );
      return pushHistory(state, newStats, state.residualPool);
    }

    case 'RESET_TO_PERFECT': {
      const newStats = state.stats
        .filter((s) => !s.isExo)
        .map((s) => ({ ...s, currentValue: s.baseMax, isLocked: false }));
      return {
        ...pushHistory(state, newStats, 0),
        simulationLog: [],
        logCounter: 0,
      };
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      return {
        ...state,
        stats: previous.stats,
        residualPool: previous.residualPool,
        history: state.history.slice(0, -1),
        future: [{ stats: state.stats, residualPool: state.residualPool }, ...state.future],
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        ...state,
        stats: next.stats,
        residualPool: next.residualPool,
        history: [...state.history, { stats: state.stats, residualPool: state.residualPool }],
        future: state.future.slice(1),
      };
    }

    case 'TOGGLE_MODE': {
      const newMode = state.mode === 'planning' ? 'simulation' : 'planning';
      return {
        ...state,
        mode: newMode,
        simulationLog: newMode === 'simulation' ? [] : state.simulationLog,
        logCounter: newMode === 'simulation' ? 0 : state.logCounter,
      };
    }

    case 'APPLY_RUNE': {
      return {
        ...pushHistory(state, action.stats, action.residualPool),
        simulationLog: [...state.simulationLog, action.logEntry],
        logCounter: state.logCounter + 1,
      };
    }

    case 'RESET_RESIDUAL':
      return pushHistory(state, state.stats, 0);

    case 'CLEAR_LOG':
      return {
        ...state,
        simulationLog: [],
        logCounter: 0,
      };

    default:
      return state;
  }
}

/** Push current snapshot to history, clear future (new branch) */
function pushHistory(
  state: SimulationState,
  newStats: SimulatedStat[],
  newResidualPool: number
): SimulationState {
  const history = [...state.history, { stats: state.stats, residualPool: state.residualPool }];
  if (history.length > MAX_HISTORY) {
    history.shift();
  }
  return {
    ...state,
    stats: newStats,
    residualPool: newResidualPool,
    history,
    future: [],
  };
}
