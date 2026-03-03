import { StatRow } from './StatRow';
import { ExoAdder } from './ExoAdder';
import type { SimulatedStat, AppMode, RuneTier } from '../types';

interface Props {
  stats: SimulatedStat[];
  poolRemaining: number;
  mode: AppMode;
  onUpdate: (effectId: number, newValue: number) => void;
  onApplyRune: (effectId: number, tier: RuneTier) => void;
  onAddExo: (effectId: number) => void;
  onRemoveExo: (effectId: number) => void;
}

export function StatsSimulator({
  stats,
  poolRemaining,
  mode,
  onUpdate,
  onApplyRune,
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
          <span className="text-xs px-2 py-0.5 rounded bg-exo/20 text-exo border border-exo/30">
            Mode Simulation
          </span>
        )}
      </div>

      {/* Stats normales */}
      <div className="space-y-2">
        {normalStats.map((stat) => (
          <StatRow
            key={stat.effectId}
            stat={stat}
            poolRemaining={poolRemaining}
            mode={mode}
            onUpdate={onUpdate}
            onApplyRune={onApplyRune}
          />
        ))}
      </div>

      {/* Stats exotiques */}
      {exoStats.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-exo mt-4">
            Stats Exotiques
          </h3>
          {exoStats.map((stat) => (
            <StatRow
              key={stat.effectId}
              stat={stat}
              poolRemaining={poolRemaining}
              mode={mode}
              onUpdate={onUpdate}
              onApplyRune={onApplyRune}
              onRemoveExo={onRemoveExo}
            />
          ))}
        </div>
      )}

      {/* Add exo button */}
      <ExoAdder currentStats={stats} onAddExo={onAddExo} />
    </div>
  );
}
