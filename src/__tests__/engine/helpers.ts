import { getEngineParams, type EngineParams } from '../../data/params';
import type { ForgemagieItemState, ItemLine, Rng } from '../../types/forgemagie';

// Identifiants de caractéristiques DofusDB (data/dataset.json → characteristics)
export const CHAR = {
  PA: 1,
  FORCE: 10,
  VITALITE: 11,
  SAGESSE: 12,
  CHANCE: 13,
  DOMMAGES: 16,
  PM: 23,
  PO: 19,
  INVOCATIONS: 26,
  PODS: 40,
  INITIATIVE: 44,
} as const;

/** RNG déterministe : renvoie les valeurs dans l'ordre, puis boucle. */
export function seqRng(values: number[]): Rng {
  let i = 0;
  return {
    next() {
      const v = values[i % values.length];
      i++;
      return v;
    },
  };
}

export function line(partial: Partial<ItemLine> & { characteristicId: number }): ItemLine {
  const baseMax = partial.baseMax ?? partial.value ?? 0;
  return {
    value: baseMax,
    baseMin: partial.baseMin ?? baseMax,
    baseMax,
    isExo: false,
    isLocked: false,
    ...partial,
  };
}

export function makeState(
  lines: ItemLine[],
  residualPool = 0,
  extra: Partial<ForgemagieItemState> = {}
): ForgemagieItemState {
  return { level: 200, lines, residualPool, itemLocked: false, ...extra };
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

/** Paramètres du fichier empirical_params.json, avec surcharges de test. */
export function testParams(overrides: DeepPartial<EngineParams> = {}): EngineParams {
  const base = getEngineParams();
  return {
    ...base,
    ...overrides,
    densities: (overrides.densities as EngineParams['densities']) ?? base.densities,
    lossSelection: { ...base.lossSelection, ...overrides.lossSelection },
    residualPool: { ...base.residualPool, ...overrides.residualPool },
    transcendence: {
      ...base.transcendence,
      ...overrides.transcendence,
      successRateByRank: {
        ...base.transcendence.successRateByRank,
        ...(overrides.transcendence?.successRateByRank ?? {}),
      },
    } as EngineParams['transcendence'],
  };
}

export function getLine(state: ForgemagieItemState, characteristicId: number): ItemLine {
  const l = state.lines.find((x) => x.characteristicId === characteristicId);
  if (!l) throw new Error(`line ${characteristicId} missing`);
  return l;
}
