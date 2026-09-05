import type { WeightBudget } from '../types';

interface Props {
  budget: WeightBudget;
  /** Reliquat serveur (état propre du moteur), affiché en mode simulation */
  residualPool?: number;
  showResidual?: boolean;
}

/**
 * Résumé du BUDGET DE POIDS de planification (dérivé de l'état visible) et, en mode
 * simulation, du RELIQUAT SERVEUR (état propre). Deux notions, deux blocs.
 */
export function PoolSummary({ budget, residualPool = 0, showResidual = false }: Props) {
  const {
    baseWeight,
    currentWeight,
    freedWeight,
    spentWeight,
    remainingBudget,
    maxTheoreticalWeight,
    qualityPercent,
  } = budget;

  const barMax = Math.max(freedWeight, 1);
  const spentPercent = Math.min((spentWeight / barMax) * 100, 100);
  const remainingPercent = Math.max(0, 100 - spentPercent);

  const budgetColor =
    remainingBudget > 10
      ? 'text-pool-positive'
      : remainingBudget > 0
        ? 'text-pool-zero'
        : 'text-pool-negative';

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
      <h2 className="text-lg font-bold text-dofus-gold">
        Budget de poids
        <span className="ml-2 text-xs font-normal text-gray-500" title="Calculé depuis les lignes visibles. Ce n'est pas le reliquat serveur.">
          planification
        </span>
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card label="Poids base" value={baseWeight} color="text-gray-300" />
        <Card label="Poids actuel" value={currentWeight} color="text-white" />
        <Card label="Poids libéré" value={freedWeight} color="text-pool-positive" />
        <Card label="Poids consommé" value={spentWeight} color="text-over" />
        <Card label="Budget restant" value={remainingBudget} color={budgetColor} large />
      </div>

      {freedWeight > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Utilisation du budget</span>
            <span>{spentPercent.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-dofus-dark rounded-full overflow-hidden">
            <div className="h-full flex">
              <div className="bg-over/80 transition-all duration-300" style={{ width: `${spentPercent}%` }} />
              <div className="bg-pool-positive/30 transition-all duration-300" style={{ width: `${remainingPercent}%` }} />
            </div>
          </div>
        </div>
      )}

      {remainingBudget < 0 && (
        <p className="text-yellow-400 text-sm font-medium">
          Budget négatif ({remainingBudget.toFixed(1)}) : les overs/exos planifiés pèsent plus que le poids libéré.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-dofus-gold/10">
        <div className="bg-dofus-dark rounded-lg p-3" title="Poids si toutes les lignes sont au plafond over/exo (empirical_params.json, lecture par ligne)">
          <div className="text-xs text-gray-400 mb-1">Poids max (plafonds inclus)</div>
          <div className="text-base font-bold font-mono text-gray-300">{maxTheoreticalWeight.toFixed(1)}</div>
        </div>
        <div className="bg-dofus-dark rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Qualité item</div>
          <div className={`text-base font-bold font-mono ${qualityColor}`}>{qualityPercent.toFixed(1)}%</div>
        </div>
        {showResidual && (
          <div className="bg-dofus-dark rounded-lg p-3 border border-blue-500/30" title="Reliquat serveur : créé par un SN/EC (perte − rune), consommé en priorité, jamais négatif. État propre, indépendant du budget ci-dessus.">
            <div className="text-xs text-blue-300 mb-1">Reliquat serveur</div>
            <div className="text-base font-bold font-mono text-blue-300">{residualPool.toFixed(2)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, color, large }: { label: string; value: number; color: string; large?: boolean }) {
  return (
    <div className={`bg-dofus-dark rounded-lg p-3 ${large ? 'border border-dofus-gold/20' : ''}`}>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`${large ? 'text-xl' : 'text-lg'} font-bold font-mono ${color}`}>{value.toFixed(1)}</div>
    </div>
  );
}
