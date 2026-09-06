import type { SimulatedStat, AtelierMode, ForgeEvent } from '../../types';
import { getStatCategory } from '../../data/statCaps';
import { RuneGlyph } from './RuneGlyph';

interface Props {
  stat: SimulatedStat;
  mode: AtelierMode;
  selected: boolean;
  /** Plafond d'over/exo de la ligne (points), null si aucune densité */
  maxOver: number | null;
  /** Max atteignable en ajustement (budget + plafond) */
  maxReachable: number;
  event: ForgeEvent | null;
  onSelect: (characteristicId: number) => void;
  onUpdate: (characteristicId: number, value: number) => void;
  onRemoveExo?: (characteristicId: number) => void;
}

type Tone = 'natural' | 'over' | 'exo' | 'zero' | 'sacrificed' | 'locked';

function toneOf(stat: SimulatedStat): Tone {
  if (stat.isLocked) return 'locked';
  if (stat.currentValue === 0) return 'zero';
  if (stat.isExo) return 'exo';
  if (stat.currentValue > stat.baseMax) return 'over';
  if (stat.currentValue < stat.baseMax) return 'sacrificed';
  return 'natural';
}

const TONE_TEXT: Record<Tone, string> = {
  natural: 'text-ash',
  over: 'text-over',
  exo: 'text-exo',
  zero: 'text-zero',
  sacrificed: 'text-ash-2',
  locked: 'text-locked',
};

const TONE_BADGE: Record<Tone, { label: string; cls: string } | null> = {
  natural: null,
  over: { label: 'over', cls: 'border-over text-over' },
  exo: { label: 'exo', cls: 'border-exo text-exo' },
  zero: { label: 'éteinte', cls: 'border-zero text-zero' },
  sacrificed: { label: 'sous le jet', cls: 'border-ash-3 text-ash-2' },
  locked: { label: 'transcendée', cls: 'border-locked text-locked' },
};

const SPARKS = [
  { dx: '12px', dy: '-36px', delay: '0s' },
  { dx: '28px', dy: '-22px', delay: '.05s' },
  { dx: '-18px', dy: '-30px', delay: '.1s' },
  { dx: '40px', dy: '-8px', delay: '.08s' },
];

/**
 * Une ligne de l'objet, gravée sur la dalle. En mode « forger », cliquer la ligne la
 * sélectionne comme cible ; en mode « ajuster », la valeur s'édite directement.
 * Les micro-interactions (frappe, perte, refus) sont rejouées par clé d'événement.
 */
export function ItemLine({ stat, mode, selected, maxOver, maxReachable, event, onSelect, onUpdate, onRemoveExo }: Props) {
  const tone = toneOf(stat);
  const text = TONE_TEXT[tone];
  const badge = TONE_BADGE[tone];
  const weight = stat.currentValue * stat.weightPerPoint;
  const currentOver = stat.isExo ? stat.currentValue : Math.max(0, stat.currentValue - stat.baseMax);

  const span = Math.max(1, stat.baseMax - stat.baseMin);
  const rollPercent = stat.isExo ? (stat.currentValue > 0 ? 100 : 0) : Math.min(100, Math.max(0, ((stat.currentValue - stat.baseMin) / span) * 100));
  const overPercent = maxOver && maxOver > 0 ? Math.min(100, (currentOver / maxOver) * 100) : 0;

  const isTarget = event?.targetCharacteristicId === stat.characteristicId;
  const struck = isTarget && !event.refused && event.outcome !== 'EC';
  const refused = isTarget && event.refused;
  const lost = !!event && event.lostCharacteristicIds.includes(stat.characteristicId);
  const fxClass = struck ? (event.outcome === 'SC' ? 'line-struck line-struck-sc' : 'line-struck') : refused ? 'line-refused' : lost ? 'line-lost' : '';

  const inputId = `line-${stat.characteristicId}`;
  const selectable = mode === 'forge' && !stat.isLocked && stat.isForgemeable;

  return (
    <li
      key={event?.id ?? 'idle'}
      className={`relative grid items-center gap-x-3 gap-y-1 px-2 sm:px-3 py-2.5 rounded-[10px] border-b border-[rgb(255_255_255/0.035)] last:border-b-0 transition-colors
        grid-cols-[28px_minmax(0,1fr)_auto] sm:grid-cols-[34px_minmax(140px,1.1fr)_84px_minmax(110px,1.3fr)_104px]
        ${selected ? 'bg-[rgb(255_194_92/0.06)] ring-1 ring-molten-text/40' : selectable ? 'hover:bg-[rgb(255_255_255/0.025)]' : ''}
        ${fxClass}`}
      aria-current={selected ? 'true' : undefined}
    >
      {struck && (
        <span className="absolute left-[58%] top-[40%] pointer-events-none" aria-hidden="true">
          {SPARKS.map((s, i) => (
            <i key={i} className="spark" style={{ ['--dx' as string]: s.dx, ['--dy' as string]: s.dy, animationDelay: s.delay }} />
          ))}
        </span>
      )}

      {/* Glyphe */}
      <span className={`grid place-items-center ${tone === 'natural' ? 'text-ash-3' : text} opacity-80`} aria-hidden="true">
        <RuneGlyph category={getStatCategory(stat.characteristicId)} size={22} />
      </span>

      {/* Nom, badge, base */}
      <div className="min-w-0">
        {selectable ? (
          <button
            type="button"
            onClick={() => onSelect(stat.characteristicId)}
            className={`font-display font-semibold text-[17px] soft text-left leading-tight ${text} hover:underline decoration-molten-text/40 underline-offset-4`}
            aria-pressed={selected}
          >
            {stat.statName}
          </button>
        ) : (
          <span className={`font-display font-semibold text-[17px] soft leading-tight ${text}`}>{stat.statName}</span>
        )}
        {badge && (
          <span className={`ml-2 align-middle text-[11px] px-1.5 py-px rounded-full border ${badge.cls}`}>{badge.label}</span>
        )}
        <span className="block text-xs text-ash-3 tnum">
          {stat.isExo ? 'ajoutée par forgemagie' : stat.baseMin === stat.baseMax ? `jet fixe ${stat.baseMax}` : `jet ${stat.baseMin} à ${stat.baseMax}`}
        </span>
      </div>

      {/* Valeur */}
      <div className="text-right">
        {mode === 'adjust' && !stat.isLocked ? (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdate(stat.characteristicId, stat.currentValue - 1)}
              disabled={stat.currentValue <= 0}
              aria-label={`Retirer 1 ${stat.statName}`}
              className="btn-well w-7 h-7 text-base leading-none"
            >−</button>
            <label htmlFor={inputId} className="sr-only">Valeur de {stat.statName}</label>
            <input
              id={inputId}
              type="number"
              inputMode="numeric"
              value={stat.currentValue}
              min={0}
              max={maxReachable}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v)) onUpdate(stat.characteristicId, Math.max(0, Math.min(v, maxReachable)));
              }}
              className={`w-16 text-center bg-well border border-iron-edge rounded-control py-1 font-display font-bold text-lg tnum ${text}`}
            />
            <button
              type="button"
              onClick={() => onUpdate(stat.characteristicId, Math.min(stat.currentValue + 1, maxReachable))}
              disabled={stat.currentValue >= maxReachable}
              aria-label={`Ajouter 1 ${stat.statName}`}
              className="btn-well w-7 h-7 text-base leading-none"
            >+</button>
          </div>
        ) : (
          <span key={`${stat.currentValue}-${event?.id ?? 0}`} className={`font-display font-bold text-2xl tnum ${text} ${isTarget && !event.refused ? 'value-bump' : ''}`}>
            {stat.currentValue}
          </span>
        )}
      </div>

      {/* Barres de jet et d'over */}
      <div className="col-span-3 sm:col-span-1 sm:col-start-4" title={stat.isExo ? 'Ligne exotique : tout son poids est de l\'over' : `Position dans le jet ${stat.baseMin} à ${stat.baseMax}, puis over jusqu'à +${maxOver ?? '∞'} (règle : 101 de poids au total sur la ligne, et cumul de l'objet)`}>
        <div className="roll-track h-2 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${stat.isExo ? 'bg-exo' : 'bg-[linear-gradient(90deg,#6a4a2b,#b98a4a)]'} transition-[width] duration-500`} style={{ width: `${rollPercent}%` }} />
        </div>
        {maxOver !== null && maxOver > 0 && (
          <div className="roll-track h-1 mt-1 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${stat.isExo ? 'bg-exo' : 'bg-over'} transition-[width] duration-500`} style={{ width: `${overPercent}%` }} />
          </div>
        )}
        <span className="block text-[11px] text-ash-3 mt-1 tnum">
          {maxOver === null ? 'non forgeable' : `+${currentOver} sur ${maxOver}`}
        </span>
      </div>

      {/* Poids */}
      <div className="col-span-3 sm:col-span-1 text-right text-xs text-ash-2 tnum sm:justify-self-end">
        <span className="font-semibold text-sm text-ash">{weight.toFixed(1)}</span> poids
        {stat.isExo && onRemoveExo && !stat.isLocked && mode === 'adjust' && (
          <button type="button" onClick={() => onRemoveExo(stat.characteristicId)} className="ml-2 text-ec hover:underline" aria-label={`Retirer l'exo ${stat.statName}`}>
            retirer
          </button>
        )}
      </div>
    </li>
  );
}
