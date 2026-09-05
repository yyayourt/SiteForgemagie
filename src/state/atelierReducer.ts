/**
 * État de l'atelier (interface) : lignes visibles, reliquat serveur (état propre, jamais
 * dérivé des lignes), verrou de transcendance, undo/redo, sélection, journal, dernier
 * événement pour les micro-interactions.
 *
 * Aucune règle de forgemagie ici : les résultats viennent de src/logic/engine et sont
 * appliqués tels quels via APPLY_RESULT.
 */

import type { AtelierState, AtelierAction, AtelierSnapshot } from '../types';

const MAX_HISTORY = 100;

export const initialAtelierState: AtelierState = {
  item: null,
  stats: [],
  residualPool: 0,
  itemLocked: false,
  history: [],
  future: [],
  mode: 'forge',
  selectedCharacteristicId: null,
  log: [],
  logCounter: 0,
  lastEvent: null,
};

function snapshotOf(state: AtelierState): AtelierSnapshot {
  return { stats: state.stats, residualPool: state.residualPool, itemLocked: state.itemLocked };
}

function pushHistory(state: AtelierState, next: AtelierSnapshot): AtelierState {
  const history = [...state.history, snapshotOf(state)];
  if (history.length > MAX_HISTORY) history.shift();
  return { ...state, ...next, history, future: [] };
}

export function atelierReducer(state: AtelierState, action: AtelierAction): AtelierState {
  switch (action.type) {
    case 'SET_ITEM':
      return {
        ...initialAtelierState,
        item: action.item,
        stats: action.stats,
        selectedCharacteristicId: action.stats.find((s) => s.isForgemeable && !s.isLocked)?.characteristicId ?? null,
      };

    case 'RESTORE':
      return { ...initialAtelierState, ...action.state, history: [], future: [], lastEvent: null };

    case 'UPDATE_STAT': {
      const newStats = state.stats.map((s) => {
        if (s.characteristicId !== action.characteristicId || s.isLocked) return s;
        return { ...s, currentValue: Math.max(0, Math.min(action.max, action.newValue)) };
      });
      return pushHistory(state, { stats: newStats, residualPool: state.residualPool, itemLocked: state.itemLocked });
    }

    case 'ADD_EXO': {
      if (state.stats.some((s) => s.characteristicId === action.stat.characteristicId)) return state;
      return {
        ...pushHistory(state, { stats: [...state.stats, action.stat], residualPool: state.residualPool, itemLocked: state.itemLocked }),
        selectedCharacteristicId: action.stat.characteristicId,
      };
    }

    case 'REMOVE_EXO': {
      const newStats = state.stats.filter((s) => !(s.characteristicId === action.characteristicId && s.isExo));
      return {
        ...pushHistory(state, { stats: newStats, residualPool: state.residualPool, itemLocked: state.itemLocked }),
        selectedCharacteristicId:
          state.selectedCharacteristicId === action.characteristicId
            ? (newStats[0]?.characteristicId ?? null)
            : state.selectedCharacteristicId,
      };
    }

    case 'RESET_TO_PERFECT': {
      const newStats = state.stats
        .filter((s) => !s.isExo)
        .map((s) => ({ ...s, currentValue: s.baseMax, isLocked: false }));
      return {
        ...pushHistory(state, { stats: newStats, residualPool: 0, itemLocked: false }),
        log: [],
        logCounter: 0,
        lastEvent: null,
      };
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      return {
        ...state,
        ...previous,
        history: state.history.slice(0, -1),
        future: [snapshotOf(state), ...state.future],
        lastEvent: null,
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        ...state,
        ...next,
        history: [...state.history, snapshotOf(state)],
        future: state.future.slice(1),
        lastEvent: null,
      };
    }

    case 'SET_MODE':
      return { ...state, mode: action.mode, lastEvent: null };

    case 'SELECT_LINE':
      return { ...state, selectedCharacteristicId: action.characteristicId };

    case 'APPLY_RESULT':
      return {
        ...pushHistory(state, action.snapshot),
        log: [...state.log, action.logEntry],
        logCounter: state.logCounter + 1,
        lastEvent: action.event,
      };

    case 'RESET_RESIDUAL':
      return pushHistory(state, { stats: state.stats, residualPool: 0, itemLocked: state.itemLocked });

    case 'CLEAR_LOG':
      return { ...state, log: [], logCounter: 0, lastEvent: null };

    default:
      return state;
  }
}
