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

const REFUSAL_LABELS: Record<string, string> = {
  item_locked: 'objet verrouillé',
  line_locked: 'ligne verrouillée',
  no_density: 'densité inconnue',
  over_cap_exceeded: "plafond d'over/exo dépassé",
  transcendence_requires_clean_item: 'transcendance : over/exo présent',
  transcendence_line_already_locked: 'transcendance : ligne déjà verrouillée',
};

export function SimulationLog({ log, onClear }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  const stats = useMemo(() => {
    const applied = log.filter((e) => !e.refusedReason);
    return {
      total: applied.length,
      sc: applied.filter((e) => e.outcome === 'SC').length,
      sn: applied.filter((e) => e.outcome === 'SN').length,
      ec: applied.filter((e) => e.outcome === 'EC').length,
      refused: log.length - applied.length,
    };
  }, [log]);

  if (log.length === 0) {
    return (
      <div className="bg-dofus-panel border border-dofus-gold/20 rounded-xl p-5">
        <h2 className="text-lg font-bold text-dofus-gold mb-3">Journal de forgemagie</h2>
        <p className="text-gray-500 text-sm text-center py-4">
          Choisis une rune et une issue (SC / SN / EC) pour voir l'effet du moteur ici
        </p>
      </div>
    );
  }

  return (
    <div className="bg-dofus-panel border border-dofus-gold/20 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-dofus-gold">Journal de forgemagie</h2>
        <button
          onClick={onClear}
          className="text-xs px-3 py-1 rounded bg-dofus-dark border border-dofus-gold/20 text-gray-400 hover:text-white transition-colors"
        >
          Vider le journal
        </button>
      </div>

      <div className="flex gap-4 text-sm">
        <span className="text-gray-400">
          Runes : <span className="text-white font-mono">{stats.total}</span>
        </span>
        <span className="text-green-400">SC : <span className="font-mono">{stats.sc}</span></span>
        <span className="text-yellow-400">SN : <span className="font-mono">{stats.sn}</span></span>
        <span className="text-red-400">EC : <span className="font-mono">{stats.ec}</span></span>
        {stats.refused > 0 && (
          <span className="text-gray-500">Refusées : <span className="font-mono">{stats.refused}</span></span>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
        {log.map((entry) => {
          const s = OUTCOME_STYLES[entry.outcome];
          const refused = entry.refusedReason !== undefined;
          return (
            <div
              key={entry.id}
              className={`${refused ? 'bg-dofus-dark border-gray-600/30' : `${s.bg} border ${s.border}`} border rounded px-3 py-1.5 flex items-center gap-3 text-sm`}
            >
              <span className="text-gray-500 font-mono text-xs w-6">#{entry.id}</span>
              <span className={`font-bold ${refused ? 'text-gray-500' : s.text} w-6`}>{s.label}</span>

              <span className="text-gray-300 flex-1">
                <span className="text-white">{entry.targetStatName}</span>
                <span className="text-gray-500">
                  {' '}+{entry.runeValue}{TIER_LABELS[entry.runeTier]} ({entry.runeWeight.toFixed(1)}p)
                </span>

                {refused && (
                  <span className="text-gray-500"> — refusée : {REFUSAL_LABELS[entry.refusedReason!] ?? entry.refusedReason}</span>
                )}

                {!refused && entry.outcome !== 'EC' && <span className="text-green-400/70"> ✓</span>}

                {entry.absorbedByResidual > 0 && (
                  <span className="text-blue-300/80"> · reliquat absorbe {entry.absorbedByResidual.toFixed(1)}</span>
                )}

                {entry.losses.map((l, i) => (
                  <span key={i} className="text-red-400/70">
                    {' '}→ {l.statName} −{l.pointsLost} ({l.weightLost.toFixed(1)}p)
                  </span>
                ))}
              </span>

              <span className="text-gray-500 font-mono text-xs" title="Reliquat serveur après cette action">
                r:{entry.residualPoolAfter.toFixed(2)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
