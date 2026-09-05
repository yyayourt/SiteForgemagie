/**
 * Hook central de l'atelier : lignes visibles, reliquat serveur, budget de planification,
 * actions (rune, transcendance, orbe), estimation du modèle probabiliste, Monte Carlo,
 * persistance locale. Toutes les règles viennent de src/logic ; l'issue d'une rune est
 * soit tirée par le MODÈLE (statut INCONNU), soit forcée à la main.
 */

import { useReducer, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Item, SimulatedStat, RuneTier, RuneOutcome, SimLogEntry, ForgeEvent, AtelierMode, AtelierState } from '../types';
import type { ApplyRuneResult, ForgemagieItemState, Rng } from '../types/forgemagie';
import { atelierReducer, initialAtelierState } from '../state/atelierReducer';
import { loadJson, saveJson, STORAGE_KEYS } from '../state/persistence';
import { computeWeightBudget } from '../logic/planning/weightBudget';
import { applyRune, applyTranscendenceRune, applyRegenerationOrb } from '../logic/engine';
import {
  computeOutcomeProbabilities,
  drawOutcome,
  isHeavyExo,
  mathRandomRng,
  createSeededRng,
  type ProbabilityOutput,
} from '../logic/probability';
import { simulateRuneAttempts, type MonteCarloResult } from '../logic/probability/monteCarlo';
import { getAvailableRuneTiers, getCharacteristicName, getTranscendenceRunes, type TranscendenceRuneInfo } from '../data/dataset';
import { getDensity, getEngineParams, getProbabilityParams, type ParamOverrides, type ProbabilityModelName } from '../data/params';
import { getStatAbsoluteMax } from '../data/statCaps';
import { useParams } from '../app/ParamsProvider';

const appRng: Rng = mathRandomRng;

export interface RuneOption {
  tier: RuneTier;
  label: string;
  value: number;
  weight: number;
}

/** Estimation du MODÈLE probabiliste pour une rune, avec le nom du modèle (à afficher comme tel). */
export interface RuneEstimate extends ProbabilityOutput {
  model: ProbabilityModelName;
  isHeavyExo: boolean;
}

const TIER_LABELS: Record<RuneTier, string> = { normal: '', pa: 'Pa', ra: 'Ra' };

function toEngineState(stats: SimulatedStat[], residualPool: number, itemLocked: boolean, level: number): ForgemagieItemState {
  return {
    level,
    residualPool,
    itemLocked,
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

function fromEngineState(state: ForgemagieItemState, previous: SimulatedStat[], overrides: ParamOverrides): SimulatedStat[] {
  return state.lines.map((line) => {
    const prev = previous.find((s) => s.characteristicId === line.characteristicId);
    return {
      characteristicId: line.characteristicId,
      statName: prev?.statName ?? getCharacteristicName(line.characteristicId),
      baseMin: line.baseMin,
      baseMax: line.baseMax,
      currentValue: line.value,
      weightPerPoint: getDensity(line.characteristicId, overrides) ?? prev?.weightPerPoint ?? 0,
      isExo: line.isExo,
      isForgemeable: prev?.isForgemeable ?? true,
      isLocked: line.isLocked,
    };
  });
}

type PersistedAtelier = Pick<AtelierState, 'item' | 'stats' | 'residualPool' | 'itemLocked' | 'mode' | 'selectedCharacteristicId' | 'log' | 'logCounter'>;

export function useAtelier() {
  const { overrides } = useParams();
  const [state, dispatch] = useReducer(atelierReducer, initialAtelierState, (init) => {
    const saved = loadJson<PersistedAtelier>(STORAGE_KEYS.atelier);
    return saved && saved.item ? { ...init, ...saved } : init;
  });

  // Persistance (après le premier rendu)
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const persisted: PersistedAtelier = {
      item: state.item,
      stats: state.stats,
      residualPool: state.residualPool,
      itemLocked: state.itemLocked,
      mode: state.mode,
      selectedCharacteristicId: state.selectedCharacteristicId,
      log: state.log,
      logCounter: state.logCounter,
    };
    saveJson(STORAGE_KEYS.atelier, persisted);
  }, [state.item, state.stats, state.residualPool, state.itemLocked, state.mode, state.selectedCharacteristicId, state.log, state.logCounter]);

  // Densités effectives (surcharges actives) appliquées aux lignes affichées
  const stats = useMemo(
    () => state.stats.map((s) => ({ ...s, weightPerPoint: getDensity(s.characteristicId, overrides) ?? s.weightPerPoint })),
    [state.stats, overrides]
  );
  const budget = useMemo(() => computeWeightBudget(stats, overrides), [stats, overrides]);
  const engineParams = useMemo(() => getEngineParams(overrides), [overrides]);
  const probabilityParams = useMemo(() => getProbabilityParams(overrides), [overrides]);
  const level = state.item?.level ?? 0;

  const engineState = useMemo(
    () => toEngineState(stats, state.residualPool, state.itemLocked, level),
    [stats, state.residualPool, state.itemLocked, level]
  );

  const selected = stats.find((s) => s.characteristicId === state.selectedCharacteristicId) ?? null;

  // ─── Sélection, édition ───
  const selectItem = useCallback((item: Item, itemStats: SimulatedStat[]) => dispatch({ type: 'SET_ITEM', item, stats: itemStats }), []);
  const selectLine = useCallback((characteristicId: number | null) => dispatch({ type: 'SELECT_LINE', characteristicId }), []);
  const setMode = useCallback((mode: AtelierMode) => dispatch({ type: 'SET_MODE', mode }), []);
  const updateStat = useCallback(
    (characteristicId: number, newValue: number) => {
      const stat = stats.find((s) => s.characteristicId === characteristicId);
      if (!stat) return;
      dispatch({ type: 'UPDATE_STAT', characteristicId, newValue, max: getStatAbsoluteMax(stat, overrides) });
    },
    [stats, overrides]
  );
  const addExo = useCallback(
    (characteristicId: number) => {
      const density = getDensity(characteristicId, overrides);
      if (density === undefined) return;
      dispatch({
        type: 'ADD_EXO',
        stat: {
          characteristicId,
          statName: getCharacteristicName(characteristicId),
          baseMin: 0,
          baseMax: 0,
          currentValue: 0,
          weightPerPoint: density,
          isExo: true,
          isForgemeable: true,
          isLocked: false,
        },
      });
    },
    [overrides]
  );
  const removeExo = useCallback((characteristicId: number) => dispatch({ type: 'REMOVE_EXO', characteristicId }), []);
  const resetToPerfect = useCallback(() => dispatch({ type: 'RESET_TO_PERFECT' }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const clearLog = useCallback(() => dispatch({ type: 'CLEAR_LOG' }), []);
  const resetResidual = useCallback(() => dispatch({ type: 'RESET_RESIDUAL' }), []);

  // ─── Runes ───
  const runeOptions = useCallback(
    (characteristicId: number): RuneOption[] => {
      const density = getDensity(characteristicId, overrides) ?? 0;
      return getAvailableRuneTiers(characteristicId).map(({ tier, info }) => ({
        tier,
        label: TIER_LABELS[tier],
        value: info.value,
        weight: info.value * density,
      }));
    },
    [overrides]
  );

  const estimate = useCallback(
    (characteristicId: number, tier: RuneTier): RuneEstimate | null => {
      const target = stats.find((s) => s.characteristicId === characteristicId);
      const option = runeOptions(characteristicId).find((o) => o.tier === tier);
      if (!target || !option || option.value <= 0) return null;
      const heavy = isHeavyExo(characteristicId, target.isExo, probabilityParams);
      const probs = computeOutcomeProbabilities(
        {
          itemLevel: level,
          line: { value: target.currentValue, baseMax: target.baseMax, isExo: target.isExo },
          runeWeight: option.weight,
          isHeavyExo: heavy,
          residualPool: state.residualPool,
          weightBudget: budget.remainingBudget,
        },
        probabilityParams
      );
      return { ...probs, model: probabilityParams.model, isHeavyExo: heavy };
    },
    [stats, runeOptions, probabilityParams, level, state.residualPool, budget.remainingBudget]
  );

  const commit = useCallback(
    (result: ApplyRuneResult, entry: Omit<SimLogEntry, 'id' | 'refusedReason' | 'losses' | 'absorbedByResidual' | 'residualPoolBefore' | 'residualPoolAfter' | 'outcome'> & { outcome: RuneOutcome }) => {
      const newStats = result.accepted ? fromEngineState(result.state, stats, overrides) : stats;
      const logEntry: SimLogEntry = {
        ...entry,
        id: state.logCounter + 1,
        refusedReason: result.accepted ? undefined : result.reason,
        losses: result.losses.map((l) => ({
          ...l,
          statName: stats.find((s) => s.characteristicId === l.characteristicId)?.statName ?? getCharacteristicName(l.characteristicId),
        })),
        absorbedByResidual: result.absorbedByResidual,
        residualPoolBefore: result.residualPoolBefore,
        residualPoolAfter: result.residualPoolAfter,
      };
      const event: ForgeEvent = {
        id: state.logCounter + 1,
        kind: entry.kind,
        outcome: entry.outcome,
        refused: !result.accepted,
        targetCharacteristicId: entry.targetCharacteristicId,
        lostCharacteristicIds: result.losses.map((l) => l.characteristicId),
        residualDelta: result.residualPoolAfter - result.residualPoolBefore,
      };
      dispatch({
        type: 'APPLY_RESULT',
        snapshot: { stats: newStats, residualPool: result.state.residualPool, itemLocked: result.state.itemLocked },
        logEntry,
        event,
      });
      return result;
    },
    [stats, overrides, state.logCounter]
  );

  const forceRune = useCallback(
    (characteristicId: number, tier: RuneTier, outcome: RuneOutcome, drawnByModel = false) => {
      const target = stats.find((s) => s.characteristicId === characteristicId);
      const option = runeOptions(characteristicId).find((o) => o.tier === tier);
      if (!target || !option) return;
      const result = applyRune(engineState, { characteristicId, value: option.value }, outcome, engineParams, appRng);
      return commit(result, {
        kind: 'rune',
        actionLabel: `${option.label ? option.label + ' ' : ''}${target.statName} +${option.value}`,
        targetStatName: target.statName,
        targetCharacteristicId: characteristicId,
        runeValue: option.value,
        runeWeight: result.runeWeight,
        outcome,
        drawnByModel,
        modelName: drawnByModel ? probabilityParams.model : undefined,
      });
    },
    [stats, runeOptions, engineState, engineParams, commit, probabilityParams.model]
  );

  const attemptRune = useCallback(
    (characteristicId: number, tier: RuneTier) => {
      const est = estimate(characteristicId, tier);
      if (!est) return;
      return forceRune(characteristicId, tier, drawOutcome(est, appRng), true);
    },
    [estimate, forceRune]
  );

  // ─── Transcendance ───
  const transcendenceOptions = useCallback((characteristicId: number): TranscendenceRuneInfo[] => getTranscendenceRunes(characteristicId), []);

  const applyTranscendence = useCallback(
    (characteristicId: number, runeId: number) => {
      const rune = getTranscendenceRunes(characteristicId).find((r) => r.runeId === runeId);
      if (!rune) return;
      const target = stats.find((s) => s.characteristicId === characteristicId);
      const result = applyTranscendenceRune(engineState, { characteristicId, value: rune.value, rank: rune.rank }, engineParams);
      return commit(result, {
        kind: 'transcendence',
        actionLabel: `${rune.nameFr.replace(/^Rune /, '')} +${rune.value}`,
        targetStatName: target?.statName ?? getCharacteristicName(characteristicId),
        targetCharacteristicId: characteristicId,
        runeValue: rune.value,
        runeWeight: result.runeWeight,
        outcome: 'SC',
        drawnByModel: false,
      });
    },
    [stats, engineState, engineParams, commit]
  );

  // ─── Orbe ───
  const applyOrb = useCallback(
    (seed?: number) => {
      const rng = seed === undefined ? appRng : createSeededRng(seed);
      const r = applyRegenerationOrb(engineState, rng);
      const asRuneResult: ApplyRuneResult = {
        accepted: r.accepted,
        reason: r.reason,
        state: r.state,
        outcome: 'SC',
        runeWeight: 0,
        lossRequested: 0,
        absorbedByResidual: 0,
        losses: [],
        unabsorbedWeight: 0,
        residualPoolBefore: engineState.residualPool,
        residualPoolAfter: r.state.residualPool,
      };
      return commit(asRuneResult, {
        kind: 'orb',
        actionLabel: 'Orbe régénérant',
        targetStatName: '',
        targetCharacteristicId: null,
        runeValue: 0,
        runeWeight: 0,
        outcome: 'SC',
        drawnByModel: false,
      });
    },
    [engineState, commit]
  );

  // ─── Monte Carlo ───
  const runMonteCarlo = useCallback(
    (characteristicId: number, tier: RuneTier, runs: number, seed: number, modelName?: ProbabilityModelName): MonteCarloResult | null => {
      const option = runeOptions(characteristicId).find((o) => o.tier === tier);
      if (!option) return null;
      return simulateRuneAttempts(
        engineState,
        { characteristicId, value: option.value },
        engineParams,
        probabilityParams,
        createSeededRng(seed),
        { runs, weightBudget: budget.remainingBudget, modelName }
      );
    },
    [runeOptions, engineState, engineParams, probabilityParams, budget.remainingBudget]
  );

  return {
    item: state.item,
    stats,
    residualPool: state.residualPool,
    itemLocked: state.itemLocked,
    mode: state.mode,
    selectedId: state.selectedCharacteristicId,
    selected,
    log: state.log,
    lastEvent: state.lastEvent,
    canUndo: state.history.length > 0,
    canRedo: state.future.length > 0,
    budget,
    engineParams,
    probabilityParams,
    selectItem,
    selectLine,
    setMode,
    updateStat,
    addExo,
    removeExo,
    resetToPerfect,
    undo,
    redo,
    clearLog,
    resetResidual,
    runeOptions,
    estimate,
    attemptRune,
    forceRune,
    transcendenceOptions,
    applyTranscendence,
    applyOrb,
    runMonteCarlo,
  };
}

export type AtelierApi = ReturnType<typeof useAtelier>;
