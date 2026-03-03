import { useState } from 'react';
import { COMMON_EXO_STATS, EFFECT_MAPPING } from '../data/effectMapping';
import type { SimulatedStat } from '../types';

interface Props {
  currentStats: SimulatedStat[];
  onAddExo: (effectId: number) => void;
}

export function ExoAdder({ currentStats, onAddExo }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // Filtre les stats exo qui ne sont pas déjà sur l'item
  const currentEffectIds = new Set(currentStats.map((s) => s.effectId));
  const availableExos = COMMON_EXO_STATS.filter(
    (exo) => !currentEffectIds.has(exo.effectId) && EFFECT_MAPPING[exo.effectId]
  );

  if (availableExos.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm px-4 py-2 rounded-lg bg-exo/20 border border-exo/30 text-exo hover:bg-exo/30 transition-colors"
      >
        + Ajouter un Exo
      </button>

      {isOpen && (
        <ul className="absolute z-40 mt-1 w-64 max-h-60 overflow-y-auto bg-dofus-panel border border-exo/30 rounded-lg shadow-xl">
          {availableExos.map((exo) => {
            const mapping = EFFECT_MAPPING[exo.effectId]!;
            return (
              <li
                key={exo.effectId}
                onClick={() => {
                  onAddExo(exo.effectId);
                  setIsOpen(false);
                }}
                className="px-4 py-2.5 cursor-pointer hover:bg-dofus-panel-light transition-colors border-b border-exo/10 last:border-0"
              >
                <span className="text-exo font-medium">{exo.statName}</span>
                <span className="text-xs text-gray-400 ml-2">
                  ({mapping.weightPerPoint}p/pt)
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
