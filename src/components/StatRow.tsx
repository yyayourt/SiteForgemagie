import { getStatStatus, computeMaxReachable } from '../logic/planning/weightBudget';
import { getAvailableRuneTiers } from '../data/dataset';
import { getStatAbsoluteMax, getStatCategory } from '../data/statCaps';
import type { SimulatedStat, AppMode, RuneTier, RuneOutcome } from '../types';
import type { RuneEstimate } from '../hooks/useSimulation';
import { RuneGlyph } from './atelier/RuneGlyph';

interface Props {
  stat: SimulatedStat;
  remainingBudget: number;
  mode: AppMode;
  onUpdate: (characteristicId: number, newValue: number) => void;
  onApplyRune?: (characteristicId: number, tier: RuneTier, outcome: RuneOutcome) => void;
  onDrawRune?: (characteristicId: number, tier: RuneTier) => void;
  estimateRune?: (characteristicId: number, tier: RuneTier) => RuneEstimate | null;
  onRemoveExo?: (characteristicId: number) => void;
}

/**
 * Code couleur des lignes (client 2.58) : exo froid, over vert clair, ligne à 0 grise,
 * naturelle ivoire. Verrouillée = teinte cuivre.
 */
const LINE_TONE = {
  perfect: { text: 'text-ivory', badge: '', badgeLabel: '' },
  normal: { text: 'text-ivory', badge: '', badgeLabel: '' },
  sacrificed: { text: 'text-ivory-muted', badge: 'border-ivory-faint text-ivory-muted', badgeLabel: 'sous le jet' },
  over: { text: 'text-over', badge: 'border-over-deep bg-over-deep/40 text-over', badgeLabel: 'over' },
  exo: { text: 'text-exo', badge: 'border-exo-deep bg-exo-deep/40 text-exo', badgeLabel: 'exo' },
} as const;

const TIER_LABELS: Record<RuneTier, string> = { normal: '', pa: 'Pa', ra: 'Ra' };

const OUTCOMES: { outcome: RuneOutcome; cls: string; title: string }[] = [
  { outcome: 'SC', cls: 'text-sc hover:bg-sc/15', title: 'Forcer un succès critique : la rune passe sans perte' },
  { outcome: 'SN', cls: 'text-sn hover:bg-sn/15', title: 'Forcer un succès neutre : la rune passe, perte = poids de la rune, reliquat consommé en priorité' },
  { outcome: 'EC', cls: 'text-ec hover:bg-ec/15', title: 'Forcer un échec critique : la rune ne passe pas, perte selon ecLossFactor' },
];

const pct = (x: number) => `${Math.round(x * 100)} %`;

export function StatRow({ stat, remainingBudget, mode, onUpdate, onApplyRune, onDrawRune, estimateRune, onRemoveExo }: Props) {
  const status = getStatStatus(stat);
  const isZero = stat.currentValue === 0;
  const tone = LINE_TONE[status];
  const nameTone = stat.isLocked ? 'text-locked' : isZero ? 'text-zero' : tone.text;

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

  // Barre de jet : position de la valeur entre min et max, dépassement en over
  const span = Math.max(1, stat.baseMax - stat.baseMin);
  const rollPercent = stat.isExo ? 100 : Math.min(100, Math.max(0, ((stat.currentValue - stat.baseMin) / span) * 100));
  const overPercent = maxOver && maxOver > 0 ? Math.min(100, (currentOver / maxOver) * 100) : 0;

  const availableTiers = getAvailableRuneTiers(stat.characteristicId).map(({ tier, info }) => ({
    tier,
    label: TIER_LABELS[tier],
    value: info.value,
  }));

  const inputId = `line-${stat.characteristicId}`;

  return (
    <div
      className={`surface-metal grid gap-x-4 gap-y-2 px-4 py-3 items-center ${
        stat.isLocked ? 'opacity-90' : ''
      } grid-cols-[auto_1fr_auto] md:grid-cols-[auto_minmax(11rem,1.2fr)_minmax(9rem,1fr)_auto]`}
    >
      {/* Glyphe gravé */}
      <div className={`${nameTone} opacity-80`} aria-hidden="true">
        <RuneGlyph category={getStatCategory(stat.characteristicId)} size={26} />
      </div>

      {/* Nom, badges, base */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-display text-[0.95rem] font-semibold tracking-wide ${nameTone}`}>{stat.statName}</span>
          {tone.badgeLabel && !stat.isLocked && (
            <span className={`text-[0.7rem] px-1.5 py-px rounded-control border ${tone.badge}`}>{tone.badgeLabel}</span>
          )}
          {stat.isLocked && (
            <span className="text-[0.7rem] px-1.5 py-px rounded-control border border-locked/60 text-locked" title="Objet transcendé : plus de forgemagie ni d'orbe (devblog 2.58)">
              verrouillée
            </span>
          )}
        </div>
        <div className="text-xs text-ivory-faint tnum">
          {stat.isExo ? 'ajoutée par forgemagie' : stat.baseMin === stat.baseMax ? `jet fixe ${stat.baseMax}` : `jet ${stat.baseMin} à ${stat.baseMax}`}
        </div>
      </div>

      {/* Valeur + barre de jet */}
      <div className="col-span-3 md:col-span-1 order-last md:order-none flex items-center gap-3">
        {mode === 'planning' && !stat.isLocked ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdate(stat.characteristicId, stat.currentValue - 1)}
              disabled={stat.currentValue <= 0}
              aria-label={`Retirer 1 ${stat.statName}`}
              className="w-7 h-7 rounded-control border border-forge-line bg-forge-surface-raised text-ivory hover:border-bronze disabled:opacity-30 disabled:cursor-not-allowed"
            >−</button>
            <label htmlFor={inputId} className="sr-only">Valeur de {stat.statName}</label>
            <input
              id={inputId}
              type="number"
              value={stat.currentValue}
              min={0}
              max={maxReachable}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) onUpdate(stat.characteristicId, Math.max(0, Math.min(val, maxReachable)));
              }}
              className={`w-16 text-center bg-forge-bg-deep border border-forge-line rounded-control px-1 py-1 text-base tnum font-semibold ${nameTone}`}
            />
            <button
              type="button"
              onClick={() => onUpdate(stat.characteristicId, Math.min(stat.currentValue + 1, maxReachable))}
              disabled={stat.currentValue >= maxReachable}
              aria-label={`Ajouter 1 ${stat.statName}`}
              className="w-7 h-7 rounded-control border border-forge-line bg-forge-surface-raised text-ivory hover:border-bronze disabled:opacity-30 disabled:cursor-not-allowed"
            >+</button>
          </div>
        ) : (
          <div className={`w-16 text-center text-lg tnum font-semibold ${nameTone}`}>{stat.currentValue}</div>
        )}
        <div className="flex-1 min-w-[5rem]" title={stat.isExo ? 'Ligne exotique' : `Position dans le jet ${stat.baseMin}–${stat.baseMax}, puis over jusqu'à +${maxOver ?? '∞'}`}>
          <div className="roll-track h-1.5 rounded-full overflow-hidden flex">
            <div className={`h-full ${stat.isExo ? 'bg-exo' : 'bg-bronze'}`} style={{ width: `${rollPercent}%` }} />
          </div>
          {maxOver !== null && maxOver > 0 && (
            <div className="roll-track h-1 mt-0.5 rounded-full overflow-hidden">
              <div className={`h-full ${stat.isExo ? 'bg-exo' : 'bg-over'}`} style={{ width: `${overPercent}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* Poids et plafond */}
      <div className="text-right text-xs tnum leading-tight">
        <div className="text-ivory-muted"><span className="text-ivory font-semibold text-sm">{lineWeight.toFixed(1)}</span> poids</div>
        {maxOver !== null && (
          <div className={currentOver >= maxOver ? 'text-ec' : currentOver > 0 ? (stat.isExo ? 'text-exo' : 'text-over') : 'text-ivory-faint'} title="Poids ajouté au-delà du jet parfait / plafond par ligne (empirical_params.json)">
            +{currentOver} sur {maxOver}
          </div>
        )}
        {stat.isExo && onRemoveExo && !stat.isLocked && (
          <button type="button" onClick={() => onRemoveExo(stat.characteristicId)} className="text-ec hover:text-copper mt-0.5" aria-label={`Retirer l'exo ${stat.statName}`}>
            retirer
          </button>
        )}
      </div>

      {/* Actions : runes par palier */}
      {!stat.isLocked && availableTiers.length > 0 && (
        <div className="col-span-3 md:col-span-4 flex flex-wrap gap-2 pt-1 border-t border-forge-line/60">
          {mode === 'planning' &&
            availableTiers.map(({ tier, label, value }) => {
              const wouldExceedCap = stat.currentValue + value > maxReachable;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => onUpdate(stat.characteristicId, Math.min(stat.currentValue + value, maxReachable))}
                  disabled={wouldExceedCap}
                  className="text-xs px-2.5 py-1 rounded-control border border-bronze-dim bg-forge-surface-raised text-copper hover:border-copper disabled:opacity-30 disabled:cursor-not-allowed tnum"
                  title={wouldExceedCap ? `Budget insuffisant (max ~${maxReachable})` : `Ajouter +${value} (rune ${label || 'simple'})`}
                >
                  +{value}{label && <span className="ml-1 text-ivory-faint">{label}</span>}
                </button>
              );
            })}

          {mode === 'simulation' && onApplyRune &&
            availableTiers.map(({ tier, label, value }) => {
              const estimate = estimateRune?.(stat.characteristicId, tier) ?? null;
              return (
                <div key={tier} className="flex flex-col rounded-control border border-bronze-dim bg-forge-bg-deep/60 overflow-hidden">
                  <div className="flex items-stretch">
                    <span className="text-xs px-2 self-center text-copper tnum" title={`Rune +${value}${label ? ' ' + label : ''}, poids ${(value * stat.weightPerPoint).toFixed(1)}`}>
                      +{value}{label && <span className="ml-1 text-ivory-faint">{label}</span>}
                    </span>
                    {onDrawRune && estimate && (
                      <button
                        type="button"
                        onClick={() => onDrawRune(stat.characteristicId, tier)}
                        className="text-xs font-semibold px-2.5 border-l border-bronze-dim text-ivory bg-bronze-dim/40 hover:bg-bronze-dim/70"
                        title={`Tirer l'issue avec le modèle « ${estimate.model} » (modèle empirique, statut INCONNU : la formule serveur est secrète)`}
                      >
                        Tenter
                      </button>
                    )}
                    {OUTCOMES.map(({ outcome, cls, title }) => (
                      <button
                        key={outcome}
                        type="button"
                        onClick={() => onApplyRune(stat.characteristicId, tier, outcome)}
                        className={`text-xs tnum font-semibold px-2 border-l border-bronze-dim ${cls}`}
                        title={title}
                      >
                        {outcome}
                      </button>
                    ))}
                  </div>
                  {estimate && (
                    <div className="flex items-center gap-2 text-[0.7rem] px-2 py-0.5 border-t border-bronze-dim/60 text-ivory-muted tnum">
                      <span
                        className="px-1 rounded-control border border-status-unknown/60 text-status-unknown"
                        title={`Modèle « ${estimate.model} » (empirical_params.json → probability), statut INCONNU. Seules les bornes 15 % / 1 % sont officielles.${estimate.isHeavyExo ? ' Exo lourd : plancher 1 %.' : ''}`}
                      >
                        modèle empirique
                      </span>
                      <span><span className="text-sc">SC</span> {pct(estimate.pSC)}</span>
                      <span><span className="text-sn">SN</span> {pct(estimate.pSN)}</span>
                      <span><span className="text-ec">EC</span> {pct(estimate.pEC)}</span>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
