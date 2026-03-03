import { useRef, useEffect, useMemo } from 'react';
import type { SimLogEntry } from '../types';

interface Props {
  log: SimLogEntry[];
  onClear: () => void;
}

const OUTCOME_STYLES = {
  SC: { bg: 'bg-green-900/40', border: 'border-green-600/30', text: 'text-green-400', label: 'SC' },
  SN: { bg: 'bg-yellow-900/30', border: 'border-yellow-600/30', text: 'text-yellow-400', label: 'SN' },
  EC: { bg: 'bg-red-900/30', border: 'border-red-600/30', text: 'text-red-400', label: 'EC' },
};

const TIER_LABELS = {
  normal: '',
  pa: ' Pa',
  ra: ' Ra',
};

export function SimulationLog({ log, onClear }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entry
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  // Stats cumulées
  const stats = useMemo(() => {
    const total = log.length;
    const sc = log.filter((e) => e.outcome === 'SC').length;
    const sn = log.filter((e) => e.outcome === 'SN').length;
    const ec = log.filter((e) => e.outcome === 'EC').length;
    const successRate = total > 0 ? ((sc + sn) / total) * 100 : 0;
    return { total, sc, sn, ec, successRate };
  }, [log]);

  if (log.length === 0) {
    return (
      <div className="bg-dofus-panel border border-dofus-gold/20 rounded-xl p-5">
        <h2 className="text-lg font-bold text-dofus-gold mb-3">Log de Forgemagie</h2>
        <p className="text-gray-500 text-sm text-center py-4">
          Passe une rune pour voir les résultats ici
        </p>
      </div>
    );
  }

  return (
    <div className="bg-dofus-panel border border-dofus-gold/20 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-dofus-gold">Log de Forgemagie</h2>
        <button
          onClick={onClear}
          className="text-xs px-3 py-1 rounded bg-dofus-dark border border-dofus-gold/20 text-gray-400 hover:text-white transition-colors"
        >
          Vider le log
        </button>
      </div>

      {/* Compteurs */}
      <div className="flex gap-4 text-sm">
        <span className="text-gray-400">
          Runes : <span className="text-white font-mono">{stats.total}</span>
        </span>
        <span className="text-green-400">
          SC : <span className="font-mono">{stats.sc}</span>
        </span>
        <span className="text-yellow-400">
          SN : <span className="font-mono">{stats.sn}</span>
        </span>
        <span className="text-red-400">
          EC : <span className="font-mono">{stats.ec}</span>
        </span>
        <span className="text-gray-400">
          Taux réussite : <span className="text-white font-mono">{stats.successRate.toFixed(0)}%</span>
        </span>
      </div>

      {/* Log entries */}
      <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
        {log.map((entry) => {
          const s = OUTCOME_STYLES[entry.outcome];
          return (
            <div
              key={entry.id}
              className={`${s.bg} border ${s.border} rounded px-3 py-1.5 flex items-center gap-3 text-sm`}
            >
              {/* # */}
              <span className="text-gray-500 font-mono text-xs w-6">#{entry.id}</span>

              {/* Outcome badge */}
              <span className={`font-bold ${s.text} w-6`}>{s.label}</span>

              {/* Description */}
              <span className="text-gray-300 flex-1">
                <span className="text-white">{entry.targetStatName}</span>
                <span className="text-gray-500">
                  {' '}+{entry.runeValue}{TIER_LABELS[entry.runeTier]}
                </span>

                {entry.outcome !== 'EC' && (
                  <span className="text-green-400/70"> ✓</span>
                )}

                {entry.sideEffect && (
                  <span className="text-red-400/70">
                    {' '}→ {entry.sideEffect.affectedStatName} -{entry.sideEffect.pointsLost}
                  </span>
                )}
              </span>

              {/* Pool after */}
              <span className="text-gray-500 font-mono text-xs">
                p:{entry.poolAfter.toFixed(1)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
