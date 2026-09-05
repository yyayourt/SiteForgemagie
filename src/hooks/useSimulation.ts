import { useReducer, useMemo, useCallback } from 'react';
import type { Item, SimulatedStat, RuneTier, RuneOutcome, SimLogEntry } from '../types';
import type { ForgemagieItemState, Rng } from '../types/forgemagie';
import { simulationReducer, initialState } from '../logic/statsReducer';
import { computeWeightBudget } from '../logic/planning/weightBudget';
import { applyRune as engineApplyRune } from '../logic/engine';
import {
  computeOutcomeProbabilities,
  drawOutcome,
  isHeavyExo,
  mathRandomRng,
  type ProbabilityOutput,
} from '../logic/probability';
import { getCharacteristicName, getRuneTiers } from '../data/dataset';
import { getDensity, getEngineParams, getProbabilityParams } from '../data/params';

/** RNG de l'application (le moteur et le modèle exigent un RNG injecté ; les tests fournissent le leur). */
const appRng: Rng = mathRandomRng;

/** Valeur ajoutée par une rune d'un palier donné (data/rune-tiers.json), repli sur le palier inférieur. */
export function getRuneValue(characteristicId: number, tier: RuneTier): number {
  const tiers = getRuneTiers(characteristicId);
  if (!tiers) return 0;
  switch (tier) {
    case 'normal':
      return tiers.normal?.value ?? 0;
    case 'pa':
      return tiers.pa?.value ?? tiers.normal?.value ?? 0;
    case 'ra':
      return tiers.ra?.value ?? tiers.pa?.value ?? tiers.normal?.value ?? 0;
  }
}

/** Estimation du MODÈLE probabiliste pour une rune, avec le nom du modèle (à afficher comme tel). */
export interface RuneEstimate extends ProbabilityOutput {
  model: string;
  isHeavyExo: boolean;
}

/** Vue UI → état moteur. */
function toEngineState(stats: SimulatedStat[], residualPool: number, level: number): ForgemagieItemState {
  return {
    level,
    residualPool,
    itemLocked: stats.length > 0 && stats.every((s) => s.isLocked),
    lines: stats.map((s) => ({
      characteristicId: s.characteristicId,
      value: s.currentValue,
      baseMin: s.baseMin,
      baseMax: s.baseMax,
      isExo: s.isExo,
      isLocked: s.isLocked,
    })),
  };
}

/** État moteur → vue UI, en conservant les métadonnées d'affichage. */
function fromEngineState(state: ForgemagieItemState, previous: SimulatedStat[]): SimulatedStat[] {
  return state.lines.map((line) => {
    const prev = previous.find((s) => s.characteristicId === line.characteristicId);
    return {
      characteristicId: line.characteristicId,
      statName: prev?.statName ?? getCharacteristicName(line.characteristicId),
      baseMin: line.baseMin,
      baseMax: line.baseMax,
      currentValue: line.value,
      weightPerPoint: prev?.weightPerPoint ?? getDensity(line.characteristicId) ?? 0,
      isExo: line.isExo,
      isForgemeable: prev?.isForgemeable ?? true,
      isLocked: line.isLocked,
    };
  });
}

/**
 * Hook principal : lignes visibles, reliquat serveur, budget de planification, actions.
 * L'issue SC/SN/EC est soit FOURNIE par l'interface, soit TIRÉE par le modèle probabiliste
 * (paramétré, statut INCONNU), jamais présentée comme la formule du serveur.
 */
export function useSimulation() {
  const [state, dispatch] = useReducer(simulationReducer, initialState);

  const budget = useMemo(() => computeWeightBudget(state.stats), [state.stats]);

  const selectItem = useCallback((item: Item, stats: SimulatedStat[]) => {
    dispatch({ type: 'SET_ITEM', item, stats });
  }, []);

  const updateStat = useCallback((characteristicId: number, newValue: number) => {
    dispatch({ type: 'UPDATE_STAT', characteristicId, newValue });
  }, []);

  const addExo = useCallback((characteristicId: number) => {
    const density = getDensity(characteristicId);
    if (density === undefined) return;
    dispatch({
      type: 'ADD_EXO',
      stat: {
        characteristicId,
        statName: getCharacteristicName(characteristicId),
        baseMin: 0,
        baseMax: 0,
        currentValue: 1,
        weightPerPoint: density,
        isExo: true,
        isForgemeable: true,
        isLocked: false,
      },
    });
  }, []);

  const removeExo = useCallback((characteristicId: number) => {
    dispatch({ type: 'REMOVE_EXO', characteristicId });
  }, []);

  const resetToPerfect = useCallback(() => dispatch({ type: 'RESET_TO_PERFECT' }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const toggleMode = useCallback(() => dispatch({ type: 'TOGGLE_MODE' }), []);
  const clearLog = useCallback(() => dispatch({ type: 'CLEAR_LOG' }), []);

  /** Estimation du modèle probabiliste pour une rune sur une ligne (affichage). */
  const estimateRune = useCallback(
    (targetCharacteristicId: number, tier: RuneTier): RuneEstimate | null => {
      const target = state.stats.find((s) => s.characteristicId === targetCharacteristicId);
      if (!target) return null;
      const runeValue = getRuneValue(targetCharacteristicId, tier);
      if (runeValue <= 0) return null;
      const probabilityParams = getProbabilityParams();
      const heavy = isHeavyExo(targetCharacteristicId, target.isExo, probabilityParams);
      const probs = computeOutcomeProbabilities(
        {
          itemLevel: state.item?.level ?? 0,
          line: { value: target.currentValue, baseMax: target.baseMax, isExo: target.isExo },
          runeWeight: runeValue * target.weightPerPoint,
          isHeavyExo: heavy,
          residualPool: state.residualPool,
          weightBudget: budget.remainingBudget,
        },
        probabilityParams
      );
      return { ...probs, model: probabilityParams.model, isHeavyExo: heavy };
    },
    [state.stats, state.item, state.residualPool, budget.remainingBudget]
  );

  const applyRune = useCallback(
    (targetCharacteristicId: number, tier: RuneTier, outcome: RuneOutcome) => {
      const target = state.stats.find((s) => s.characteristicId === targetCharacteristicId);
      if (!target) return;
      const runeValue = getRuneValue(targetCharacteristicId, tier);
      if (runeValue <= 0) return;

      const engineState = toEngineState(state.stats, state.residualPool, state.item?.level ?? 0);
      const result = engineApplyRune(
        engineState,
        { characteristicId: targetCharacteristicId, value: runeValue },
        outcome,
        getEngineParams(),
        appRng
      );

      const newStats = result.accepted ? fromEngineState(result.state, state.stats) : state.stats;
      const logEntry: SimLogEntry = {
        id: state.logCounter + 1,
        targetStatName: target.statName,
        targetCharacteristicId,
        runeTier: tier,
        runeValue,
        runeWeight: result.runeWeight,
        outcome,
        refusedReason: result.accepted ? undefined : result.reason,
        losses: result.losses.map((l) => ({
          ...l,
          statName:
            state.stats.find((s) => s.characteristicId === l.characteristicId)?.statName ??
            getCharacteristicName(l.characteristicId),
        })),
        absorbedByResidual: result.absorbedByResidual,
        residualPoolBefore: result.residualPoolBefore,
        residualPoolAfter: result.residualPoolAfter,
      };

      dispatch({ type: 'APPLY_RUNE', stats: newStats, residualPool: result.state.residualPool, logEntry });
      return result;
    },
    [state.stats, state.residualPool, state.item, state.logCounter]
  );

  /** Tire l'issue avec le modèle probabiliste puis l'applique au moteur. */
  const drawAndApplyRune = useCallback(
    (targetCharacteristicId: number, tier: RuneTier) => {
      const estimate = estimateRune(targetCharacteristicId, tier);
      if (!estimate) return;
      const outcome = drawOutcome(estimate, appRng);
      return applyRune(targetCharacteristicId, tier, outcome);
    },
    [estimateRune, applyRune]
  );

  return {
    item: state.item,
    stats: state.stats,
    budget,
    residualPool: state.residualPool,
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
    drawAndApplyRune,
    estimateRune,
    clearLog,
  };
}
