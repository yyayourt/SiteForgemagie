import { StatRow } from './StatRow';
import { ExoAdder } from './ExoAdder';
import type { SimulatedStat, AppMode, RuneTier, RuneOutcome } from '../types';
import type { RuneEstimate } from '../hooks/useSimulation';

interface Props {
  stats: SimulatedStat[];
  remainingBudget: number;
  mode: AppMode;
  onUpdate: (characteristicId: number, newValue: number) => void;
  onApplyRune: (characteristicId: number, tier: RuneTier, outcome: RuneOutcome) => void;
  onDrawRune?: (characteristicId: number, tier: RuneTier) => void;
  estimateRune?: (characteristicId: number, tier: RuneTier) => RuneEstimate | null;
  onAddExo: (characteristicId: number) => void;
  onRemoveExo: (characteristicId: number) => void;
}

export function StatsSimulator({
  stats,
  remainingBudget,
  mode,
  onUpdate,
  onApplyRune,
  onDrawRune,
  estimateRune,
  onAddExo,
  onRemoveExo,
}: Props) {
  const normalStats = stats.filter((s) => !s.isExo);
  const exoStats = stats.filter((s) => s.isExo);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-dofus-gold">Caractéristiques</h2>
        {mode === 'simulation' && (
          <span className="text-xs px-2 py-0.5 rounded bg-exo/20 text-exo border border-exo/30" title="SC/SN/EC : issue choisie à la main, ou tirée par un MODÈLE paramétré (INCONNU). La formule serveur est secrète.">
            Mode Simulation
          </span>
        )}
      </div>

      <div className="space-y-2">
        {normalStats.map((stat) => (
          <StatRow
            key={stat.characteristicId}
            stat={stat}
            remainingBudget={remainingBudget}
            mode={mode}
            onUpdate={onUpdate}
            onApplyRune={onApplyRune}
            onDrawRune={onDrawRune}
            estimateRune={estimateRune}
          />
        ))}
      </div>

      {exoStats.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-exo mt-4">Stats Exotiques</h3>
          {exoStats.map((stat) => (
            <StatRow
              key={stat.characteristicId}
              stat={stat}
              remainingBudget={remainingBudget}
              mode={mode}
              onUpdate={onUpdate}
              onApplyRune={onApplyRune}
              onDrawRune={onDrawRune}
              estimateRune={estimateRune}
              onRemoveExo={onRemoveExo}
            />
          ))}
        </div>
      )}

      <ExoAdder currentStats={stats} onAddExo={onAddExo} />
    </div>
  );
}
