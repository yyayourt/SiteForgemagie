import type { PoolResult } from '../types';

interface Props {
  pool: PoolResult;
}

export function PoolSummary({ pool }: Props) {
  const {
    baseWeight,
    currentWeight,
    poolGained,
    poolSpent,
    poolRemaining,
    maxTheoreticalWeight,
    qualityPercent,
    rollProbability,
  } = pool;

  // Barre de progression du puits
  const barMax = Math.max(poolGained, 1);
  const spentPercent = Math.min((poolSpent / barMax) * 100, 100);
  const remainingPercent = Math.max(0, 100 - spentPercent);

  const poolColor =
    poolRemaining > 10
      ? 'text-pool-positive'
      : poolRemaining > 0
        ? 'text-pool-zero'
        : 'text-pool-negative';

  // Formatte la probabilité
  const probaDisplay =
    rollProbability >= 0.01
      ? `${(rollProbability * 100).toFixed(1)}%`
      : rollProbability >= 0.0001
        ? `${(rollProbability * 100).toFixed(3)}%`
        : `${(rollProbability * 100).toExponential(1)}`;

  // Couleur qualité
  const qualityColor =
    qualityPercent >= 100
      ? 'text-dofus-gold'
      : qualityPercent >= 90
        ? 'text-pool-positive'
        : qualityPercent >= 70
          ? 'text-pool-zero'
          : 'text-pool-negative';

  return (
    <div className="bg-dofus-panel border border-dofus-gold/20 rounded-xl p-5 space-y-4">
      <h2 className="text-lg font-bold text-dofus-gold">Puits de Forgemagie</h2>

      {/* Main stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <PoolCard label="Poids base" value={baseWeight} color="text-gray-300" />
        <PoolCard label="Poids actuel" value={currentWeight} color="text-white" />
        <PoolCard label="Puits gagné" value={poolGained} color="text-pool-positive" />
        <PoolCard label="Puits utilisé" value={poolSpent} color="text-over" />
        <PoolCard label="Puits restant" value={poolRemaining} color={poolColor} large />
      </div>

      {/* Progress bar */}
      {poolGained > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Utilisation du puits</span>
            <span>{spentPercent.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-dofus-dark rounded-full overflow-hidden">
            <div className="h-full flex">
              <div
                className="bg-over/80 transition-all duration-300"
                style={{ width: `${spentPercent}%` }}
              />
              <div
                className="bg-pool-positive/30 transition-all duration-300"
                style={{ width: `${remainingPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {poolRemaining < 0 && (
        <p className="text-yellow-400 text-sm font-medium">
          Puits négatif ({poolRemaining.toFixed(1)}) — les runes auront moins de chances de passer (SC bas, EC élevé).
        </p>
      )}

      {/* Extra info: max weight, quality, probability */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-dofus-gold/10">
        <div className="bg-dofus-dark rounded-lg p-3" title="Poids si toutes les stats sont au maximum over/exo possible (règle des 101 par ligne)">
          <div className="text-xs text-gray-400 mb-1">Poids max (overs inclus)</div>
          <div className="text-base font-bold font-mono text-gray-300">
            {maxTheoreticalWeight.toFixed(1)}
          </div>
        </div>
        <div className="bg-dofus-dark rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Qualité item</div>
          <div className={`text-base font-bold font-mono ${qualityColor}`}>
            {qualityPercent.toFixed(1)}%
          </div>
        </div>
        <div className="bg-dofus-dark rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Proba ce jet ≥</div>
          <div className="text-base font-bold font-mono text-blue-400">
            {probaDisplay}
          </div>
        </div>
      </div>
    </div>
  );
}

function PoolCard({
  label,
  value,
  color,
  large,
}: {
  label: string;
  value: number;
  color: string;
  large?: boolean;
}) {
  return (
    <div className={`bg-dofus-dark rounded-lg p-3 ${large ? 'border border-dofus-gold/20' : ''}`}>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`${large ? 'text-xl' : 'text-lg'} font-bold font-mono ${color}`}>
        {value.toFixed(1)}
      </div>
    </div>
  );
}
