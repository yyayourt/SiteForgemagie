import { getStatStatus, computeMaxReachable } from '../logic/poolCalculator';
import { computeOutcomeProbabilities } from '../logic/runeSimulator';
import { getAvailableRuneTiers } from '../data/dataset';
import { getStatAbsoluteMax } from '../data/statCaps';
import type { SimulatedStat, AppMode, RuneTier } from '../types';

interface Props {
  stat: SimulatedStat;
  poolRemaining: number;
  mode: AppMode;
  onUpdate: (characteristicId: number, newValue: number) => void;
  onApplyRune?: (characteristicId: number, tier: RuneTier) => void;
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

export function StatRow({ stat, poolRemaining, mode, onUpdate, onApplyRune, onRemoveExo }: Props) {
  const status = getStatStatus(stat);
  const style = STATUS_STYLES[status];

  // Budget effectif depuis la perspective de cette stat
  // (si la stat est déjà en over, on récupère ce poids dans le budget pour calculer le max)
  const effectivePoolForStat =
    stat.currentValue > stat.baseMax
      ? poolRemaining + (stat.currentValue - stat.baseMax) * stat.weightPerPoint
      : stat.currentValue < stat.baseMax
        ? poolRemaining - (stat.baseMax - stat.currentValue) * stat.weightPerPoint
        : poolRemaining;

  const maxReachable = stat.isExo
    ? computeMaxReachable(stat, poolRemaining + stat.currentValue * stat.weightPerPoint)
    : computeMaxReachable({ ...stat, currentValue: stat.baseMax }, Math.max(0, effectivePoolForStat));

  const lineWeight = stat.currentValue * stat.weightPerPoint;
  const absoluteMax = getStatAbsoluteMax(stat);
  const currentOver = stat.isExo
    ? stat.currentValue
    : Math.max(0, stat.currentValue - stat.baseMax);
  const maxOver = absoluteMax === Infinity
    ? null
    : stat.isExo ? absoluteMax : absoluteMax - stat.baseMax;

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
      {mode === 'planning' && (
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
                  const clamped = Math.min(val, maxReachable);
                  onUpdate(stat.characteristicId, Math.max(0, clamped));
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

      {/* ── Mode Simulation : rune apply buttons avec % SC (moteur provisoire) ── */}
      {mode === 'simulation' && onApplyRune && (
        <>
          <div className={`w-16 text-center font-mono text-sm ${style.text} bg-dofus-dark border border-dofus-gold/10 rounded px-1 py-1`}>
            {stat.currentValue}
          </div>
          <div className="flex gap-1">
            {availableTiers.map(({ tier, label, value }) => {
              const runeWeight = value * stat.weightPerPoint;
              const { pSC } = computeOutcomeProbabilities(poolRemaining, runeWeight, stat.isExo);
              const scPercent = Math.round(pSC * 100);
              return (
                <button
                  key={tier}
                  onClick={() => onApplyRune(stat.characteristicId, tier)}
                  className="text-xs px-2.5 py-1.5 rounded bg-dofus-panel-light border border-dofus-gold/20 hover:bg-dofus-gold/20 transition-colors"
                  title={`Passer rune +${value}${label ? ' ' + label : ''} (${scPercent}% SC — modèle provisoire, non fidèle)`}
                >
                  <span className="text-dofus-gold-light">
                    +{value}{label && <span className="ml-0.5 opacity-60">{label}</span>}
                  </span>
                  <span className={`ml-1.5 font-mono ${
                    scPercent >= 70 ? 'text-green-400' : scPercent >= 40 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {scPercent}%
                  </span>
                </button>
              );
            })}
          </div>
        </>
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
        {stat.isForgemeable && (
          <span title="Max atteignable avec le budget de poids actuel" className="text-gray-600">
            ~{maxReachable}
          </span>
        )}
        {stat.isExo && onRemoveExo && (
          <button onClick={() => onRemoveExo(stat.characteristicId)} className="text-red-400 hover:text-red-300 transition-colors" title="Retirer cet exo">&times;</button>
        )}
      </div>
    </div>
  );
}
