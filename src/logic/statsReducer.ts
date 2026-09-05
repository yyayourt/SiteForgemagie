import type { SimulationState, SimulationAction, SimulatedStat } from '../types';
import { getStatAbsoluteMax } from '../data/statCaps';

const MAX_HISTORY = 100;

export const initialState: SimulationState = {
  item: null,
  stats: [],
  history: [],
  future: [],
  mode: 'planning',
  simulationLog: [],
  logCounter: 0,
};

/**
 * Reducer pour la simulation de forgemagie.
 * Gère les modifications de stats avec undo/redo complet,
 * le mode planning/simulation, et le log de FM.
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
        if (s.effectId !== action.effectId) return s;
        const max = getStatAbsoluteMax(s);
        return { ...s, currentValue: Math.max(0, Math.min(max, action.newValue)) };
      });
      return pushHistory(state, newStats);
    }

    case 'ADD_EXO': {
      if (state.stats.some((s) => s.effectId === action.stat.effectId)) {
        return state;
      }
      const newStats = [...state.stats, action.stat];
      return pushHistory(state, newStats);
    }

    case 'REMOVE_EXO': {
      const newStats = state.stats.filter(
        (s) => !(s.effectId === action.effectId && s.isExo)
      );
      return pushHistory(state, newStats);
    }

    case 'RESET_TO_PERFECT': {
      const newStats = state.stats
        .filter((s) => !s.isExo)
        .map((s) => ({ ...s, currentValue: s.baseMax }));
      return {
        ...pushHistory(state, newStats),
        simulationLog: [],
        logCounter: 0,
      };
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      return {
        ...state,
        stats: previous,
        history: newHistory,
        future: [state.stats, ...state.future],
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        ...state,
        stats: next,
        history: [...state.history, state.stats],
        future: newFuture,
      };
    }

    case 'TOGGLE_MODE': {
      const newMode = state.mode === 'planning' ? 'simulation' : 'planning';
      return {
        ...state,
        mode: newMode,
        // Clear log when switching to simulation mode
        simulationLog: newMode === 'simulation' ? [] : state.simulationLog,
        logCounter: newMode === 'simulation' ? 0 : state.logCounter,
      };
    }

    case 'APPLY_RUNE': {
      const { result } = action;
      // Safety clamp : toutes les stats respectent le max théorique (règle des 101)
      const clampedStats = result.newStats.map((s) => {
        const max = getStatAbsoluteMax(s);
        return s.currentValue > max ? { ...s, currentValue: max } : s;
      });
      return {
        ...pushHistory(state, clampedStats),
        simulationLog: [...state.simulationLog, result.logEntry],
        logCounter: state.logCounter + 1,
      };
    }

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

/** Push current stats to history, clear future (new branch) */
function pushHistory(
  state: SimulationState,
  newStats: SimulatedStat[]
): SimulationState {
  const history = [...state.history, state.stats];
  if (history.length > MAX_HISTORY) {
    history.shift();
  }
  return {
    ...state,
    stats: newStats,
    history,
    future: [],
  };
}
