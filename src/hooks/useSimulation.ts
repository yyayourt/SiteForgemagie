import { useReducer, useMemo, useCallback } from 'react';
import type { Item, SimulatedStat, RuneTier } from '../types';
import { simulationReducer, initialState } from '../logic/statsReducer';
import { computeItemPool } from '../logic/poolCalculator';
import { simulateRune } from '../logic/runeSimulator';
import { EFFECT_MAPPING } from '../data/effectMapping';

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
    (effectId: number, newValue: number) => {
      dispatch({ type: 'UPDATE_STAT', effectId, newValue });
    },
    []
  );

  const addExo = useCallback(
    (effectId: number) => {
      const mapping = EFFECT_MAPPING[effectId];
      if (!mapping) return;

      const exoStat: SimulatedStat = {
        effectId,
        statName: mapping.statName,
        baseMin: 0,
        baseMax: 0,
        currentValue: 1,
        weightPerPoint: mapping.weightPerPoint,
        isExo: true,
        isForgemeable: mapping.isForgemeable,
      };

      dispatch({ type: 'ADD_EXO', stat: exoStat });
    },
    []
  );

  const removeExo = useCallback(
    (effectId: number) => {
      dispatch({ type: 'REMOVE_EXO', effectId });
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
    (targetEffectId: number, tier: RuneTier) => {
      const result = simulateRune(
        state.stats,
        targetEffectId,
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
