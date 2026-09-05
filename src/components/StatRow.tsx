import { getStatStatus, computeMaxReachable } from '../logic/planning/weightBudget';
import { getAvailableRuneTiers } from '../data/dataset';
import { getStatAbsoluteMax } from '../data/statCaps';
import type { SimulatedStat, AppMode, RuneTier, RuneOutcome } from '../types';

interface Props {
  stat: SimulatedStat;
  remainingBudget: number;
  mode: AppMode;
  onUpdate: (characteristicId: number, newValue: number) => void;
  onApplyRune?: (characteristicId: number, tier: RuneTier, outcome: RuneOutcome) => void;
  onRemoveExo?: (characteristicId: number) => void;
}

const STATUS_STYLES = {
  perfect: { bg: 'bg-dofus-dark', text: 'text-green-400', label: 'Parfait' },
  normal: { bg: 'bg-dofus-dark', text: 'text-gray-300', label: '' },
  over: { bg: 'bg-over-bg', text: 'text-over', label: 'OVER' },
  exo: { bg: 'bg-exo-bg', text: 'text-exo', label: 'EXO' },
  sacrificed: { bg: 'bg-dofus-dark', text: 'text-sacrificed', label: 'Sacrifié' },
};

const TIER_LABELS: Record<RuneTier, string> = { normal: '', pa: 'Pa', ra: 'Ra' };

/** Issues fournies manuellement : aucun modèle probabiliste avant la phase 3. */
const OUTCOMES: { outcome: RuneOutcome; cls: string; title: string }[] = [
  { outcome: 'SC', cls: 'text-green-400 hover:bg-green-900/40', title: 'Succès critique : la rune passe sans perte' },
  { outcome: 'SN', cls: 'text-yellow-400 hover:bg-yellow-900/40', title: 'Succès neutre : la rune passe, perte = poids de la rune (reliquat consommé en priorité)' },
  { outcome: 'EC', cls: 'text-red-400 hover:bg-red-900/40', title: 'Échec critique : la rune ne passe pas, perte (paramètre ecLossFactor)' },
];

export function StatRow({ stat, remainingBudget, mode, onUpdate, onApplyRune, onRemoveExo }: Props) {
  const status = getStatStatus(stat);
  const style = STATUS_STYLES[status];

  // Budget effectif depuis la perspective de cette stat
  const effectiveBudgetForStat =
    stat.currentValue > stat.baseMax
      ? remainingBudget + (stat.currentValue - stat.baseMax) * stat.weightPerPoint
      : stat.currentValue < stat.baseMax
        ? remainingBudget - (stat.baseMax - stat.currentValue) * stat.weightPerPoint
        : remainingBudget;

  const maxReachable = stat.isExo
    ? computeMaxReachable(stat, remainingBudget + stat.currentValue * stat.weightPerPoint)
    : computeMaxReachable({ ...stat, currentValue: stat.baseMax }, Math.max(0, effectiveBudgetForStat));

  const lineWeight = stat.currentValue * stat.weightPerPoint;
  const absoluteMax = getStatAbsoluteMax(stat);
  const currentOver = stat.isExo ? stat.currentValue : Math.max(0, stat.currentValue - stat.baseMax);
  const maxOver = absoluteMax === Infinity ? null : stat.isExo ? absoluteMax : absoluteMax - stat.baseMax;

  // Paliers de runes réellement existants (data/rune-tiers.json)
  const availableTiers = getAvailableRuneTiers(stat.characteristicId).map(({ tier, info }) => ({
    tier,
    label: TIER_LABELS[tier],
    value: info.value,
  }));

  return (
    <div className={`${style.bg} border border-dofus-gold/10 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3 transition-colors`}>
      {/* Stat name + badge */}
      <div className="flex items-center gap-2 min-w-[180px]">
        <span className={`font-medium ${style.text}`}>{stat.statName}</span>
        {style.label && (
          <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
            status === 'over' ? 'bg-over/20 text-over'
              : status === 'exo' ? 'bg-exo/20 text-exo'
              : 'bg-gray-600/30 text-gray-400'
          }`}>
            {style.label}
          </span>
        )}
        {stat.isLocked && (
          <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-dofus-gold/20 text-dofus-gold" title="Objet transcendé : plus de forgemagie ni d'orbe (devblog 2.58)">
            🔒
          </span>
        )}
      </div>

      {/* Base range */}
      <div className="text-xs text-gray-500 min-w-[80px]">
        {stat.isExo
          ? 'Exotique'
          : stat.baseMin === stat.baseMax
            ? <>Base : {stat.baseMax}</>
            : <>Base : {stat.baseMin}–{stat.baseMax}</>}
      </div>

      {/* ── Mode Planning : stepper + quick rune buttons ── */}
      {mode === 'planning' && !stat.isLocked && (
        <>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdate(stat.characteristicId, stat.currentValue - 1)}
              disabled={stat.currentValue <= 0}
              className="w-7 h-7 rounded bg-dofus-panel-light border border-dofus-gold/20 text-white hover:bg-dofus-gold/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
            >-</button>
            <input
              type="number"
              value={stat.currentValue}
              min={0}
              max={maxReachable}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  onUpdate(stat.characteristicId, Math.max(0, Math.min(val, maxReachable)));
                }
              }}
              className={`w-16 text-center bg-dofus-dark border border-dofus-gold/20 rounded px-1 py-1 text-sm font-mono ${style.text} focus:outline-none focus:border-dofus-gold`}
            />
            <button
              onClick={() => onUpdate(stat.characteristicId, Math.min(stat.currentValue + 1, maxReachable))}
              disabled={stat.currentValue >= maxReachable}
              className="w-7 h-7 rounded bg-dofus-panel-light border border-dofus-gold/20 text-white hover:bg-dofus-gold/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
            >+</button>
          </div>
          {availableTiers.length > 1 && (
            <div className="flex gap-1">
              {availableTiers.map(({ tier, label, value }) => {
                const wouldExceedCap = stat.currentValue + value > maxReachable;
                return (
                  <button
                    key={tier}
                    onClick={() => onUpdate(stat.characteristicId, Math.min(stat.currentValue + value, maxReachable))}
                    disabled={wouldExceedCap}
                    className="text-xs px-2 py-1 rounded bg-dofus-panel-light border border-dofus-gold/15 text-dofus-gold-light hover:bg-dofus-gold/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={wouldExceedCap ? `Budget insuffisant (max ~${maxReachable})` : `+${value} (Rune ${label || 'normale'})`}
                  >
                    +{value}{label && <span className="ml-0.5 opacity-60">{label}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Mode Simulation : issue choisie manuellement, moteur déterministe ── */}
      {mode === 'simulation' && onApplyRune && !stat.isLocked && (
        <>
          <div className={`w-16 text-center font-mono text-sm ${style.text} bg-dofus-dark border border-dofus-gold/10 rounded px-1 py-1`}>
            {stat.currentValue}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableTiers.map(({ tier, label, value }) => (
              <div key={tier} className="flex items-center rounded border border-dofus-gold/20 bg-dofus-panel-light overflow-hidden">
                <span className="text-xs px-2 text-dofus-gold-light" title={`Rune +${value}${label ? ' ' + label : ''} — poids ${(value * stat.weightPerPoint).toFixed(1)}`}>
                  +{value}{label && <span className="ml-0.5 opacity-60">{label}</span>}
                </span>
                {OUTCOMES.map(({ outcome, cls, title }) => (
                  <button
                    key={outcome}
                    onClick={() => onApplyRune(stat.characteristicId, tier, outcome)}
                    className={`text-xs font-mono font-bold px-2 py-1.5 border-l border-dofus-gold/20 transition-colors ${cls}`}
                    title={title}
                  >
                    {outcome}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {mode === 'simulation' && stat.isLocked && (
        <span className="text-xs text-gray-500">Verrouillée : plus aucune rune possible</span>
      )}

      {/* Weight + max info */}
      <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
        <span title="Poids de cette ligne">{lineWeight.toFixed(1)}p</span>
        {stat.isForgemeable && maxOver !== null && (
          <span
            title={`Plafond par ligne (empirical_params.json) — over max: +${maxOver} | Max: ${absoluteMax}`}
            className={currentOver >= maxOver ? 'text-red-400 font-semibold' : currentOver > 0 ? 'text-over' : 'text-gray-600'}
          >
            +{currentOver}/{maxOver}
          </span>
        )}
        {stat.isForgemeable && mode === 'planning' && (
          <span title="Max atteignable avec le budget de poids actuel" className="text-gray-600">
            ~{maxReachable}
          </span>
        )}
        {stat.isExo && onRemoveExo && !stat.isLocked && (
          <button onClick={() => onRemoveExo(stat.characteristicId)} className="text-red-400 hover:text-red-300 transition-colors" title="Retirer cet exo">&times;</button>
        )}
      </div>
    </div>
  );
}
