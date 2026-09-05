import { useReducer, useMemo, useCallback } from 'react';
import type { Item, SimulatedStat, RuneTier } from '../types';
import { simulationReducer, initialState } from '../logic/statsReducer';
import { computeItemPool } from '../logic/poolCalculator';
import { simulateRune } from '../logic/runeSimulator';
import { getCharacteristicName } from '../data/dataset';
import { getDensity } from '../data/params';

/**
 * Hook principal de simulation de forgemagie.
 * Fournit l'état, les actions, le calcul de puits, et le mode simulation.
 */
export function useSimulation() {
  const [state, dispatch] = useReducer(simulationReducer, initialState);

  const pool = useMemo(() => computeItemPool(state.stats), [state.stats]);

  const selectItem = useCallback(
    (item: Item, stats: SimulatedStat[]) => {
      dispatch({ type: 'SET_ITEM', item, stats });
    },
    []
  );

  const updateStat = useCallback(
    (characteristicId: number, newValue: number) => {
      dispatch({ type: 'UPDATE_STAT', characteristicId, newValue });
    },
    []
  );

  const addExo = useCallback(
    (characteristicId: number) => {
      const density = getDensity(characteristicId);
      if (density === undefined) return;

      const exoStat: SimulatedStat = {
        characteristicId,
        statName: getCharacteristicName(characteristicId),
        baseMin: 0,
        baseMax: 0,
        currentValue: 1,
        weightPerPoint: density,
        isExo: true,
        isForgemeable: true,
      };

      dispatch({ type: 'ADD_EXO', stat: exoStat });
    },
    []
  );

  const removeExo = useCallback(
    (characteristicId: number) => {
      dispatch({ type: 'REMOVE_EXO', characteristicId });
    },
    []
  );

  const resetToPerfect = useCallback(() => {
    dispatch({ type: 'RESET_TO_PERFECT' });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const toggleMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_MODE' });
  }, []);

  const applyRune = useCallback(
    (targetCharacteristicId: number, tier: RuneTier) => {
      const result = simulateRune(
        state.stats,
        targetCharacteristicId,
        tier,
        state.logCounter + 1
      );
      dispatch({ type: 'APPLY_RUNE', result });
      return result;
    },
    [state.stats, state.logCounter]
  );

  const clearLog = useCallback(() => {
    dispatch({ type: 'CLEAR_LOG' });
  }, []);

  return {
    item: state.item,
    stats: state.stats,
    pool,
    mode: state.mode,
    simulationLog: state.simulationLog,
    canUndo: state.history.length > 0,
    canRedo: state.future.length > 0,
    selectItem,
    updateStat,
    addExo,
    removeExo,
    resetToPerfect,
    undo,
    redo,
    toggleMode,
    applyRune,
    clearLog,
  };
}
