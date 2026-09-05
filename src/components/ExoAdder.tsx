import { useState } from 'react';
import { CHARACTERISTICS_WITH_RUNES, getCharacteristicName } from '../data/dataset';
import { getDensity } from '../data/params';
import type { SimulatedStat } from '../types';

interface Props {
  currentStats: SimulatedStat[];
  onAddExo: (characteristicId: number) => void;
}

/**
 * Propose en exo toute caractéristique pour laquelle une rune existe (data/rune-tiers.json)
 * et une densité est documentée (empirical_params.json), sauf celles déjà sur l'objet.
 */
export function ExoAdder({ currentStats, onAddExo }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const currentIds = new Set(currentStats.map((s) => s.characteristicId));
  const availableExos = CHARACTERISTICS_WITH_RUNES
    .filter((id) => !currentIds.has(id) && getDensity(id) !== undefined)
    .map((id) => ({ characteristicId: id, statName: getCharacteristicName(id), density: getDensity(id)! }))
    .sort((a, b) => b.density - a.density || a.statName.localeCompare(b.statName));

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
        <ul className="absolute z-40 mt-1 w-72 max-h-72 overflow-y-auto bg-dofus-panel border border-exo/30 rounded-lg shadow-xl">
          {availableExos.map((exo) => (
            <li
              key={exo.characteristicId}
              onClick={() => {
                onAddExo(exo.characteristicId);
                setIsOpen(false);
              }}
              className="px-4 py-2.5 cursor-pointer hover:bg-dofus-panel-light transition-colors border-b border-exo/10 last:border-0"
            >
              <span className="text-exo font-medium">{exo.statName}</span>
              <span className="text-xs text-gray-400 ml-2">({exo.density}p/pt)</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
