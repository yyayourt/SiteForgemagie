import { useEffect, useState, type ReactNode } from 'react';
import type { AtelierApi, RuneOption } from '../../hooks/useAtelier';
import type { RuneTier } from '../../types';
import type { ArmedTier } from './forgeSelection';
import { computeMaxReachable } from '../../logic/planning/weightBudget';
import { getLineOverRoom, getStatAbsoluteMaxInContext } from '../../data/statCaps';
import { getParamEntry } from '../../data/params';
import { useParams } from '../../app/ParamsProvider';
import { InfoTip, StatusBadge } from '../shell/Badges';
import { ItemLine } from './ItemLine';
import { Crucible } from './Crucible';

interface Props {
  atelier: AtelierApi;
  /** Fige l'objet courant dans la vitrine ; renvoie vrai si sauvegardé */
  onSaveToShowcase?: () => boolean;
  onSelectLine: (characteristicId: number) => void;
  tierOptions: RuneOption[];
  activeTier: RuneTier;
  armed: ArmedTier;
  onTierClick: (tier: RuneTier) => void;
  /** Le slot de fusion, rendu sous les lignes */
  children?: ReactNode;
}

/** La dalle d'enclume : l'objet et ses lignes, le héros de l'atelier. */
export function ItemSlab({ atelier, onSaveToShowcase, onSelectLine, tierOptions, activeTier, armed, onTierClick, children }: Props) {
  const { overrides } = useParams();
  const { item, stats, mode, selectedId, lastEvent, budget, itemLocked, rollQuality, craftParams } = atelier;
  const [savedTick, setSavedTick] = useState(0);

  // Confirmation éphémère après une sauvegarde dans la vitrine
  useEffect(() => {
    if (savedTick === 0) return;
    const t = setTimeout(() => setSavedTick(0), 2800);
    return () => clearTimeout(t);
  }, [savedTick]);

  if (!item) {
    return (
      <section className="slab p-7 sm:p-10 min-h-[420px] grid place-items-center text-center" aria-labelledby="empty-title">
        <div className="max-w-md">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true" className="mx-auto text-ash-3 mb-4">
            <path d="M4 18h16M6 18V9l6-4 6 4v9" />
            <path d="M12 9v9" strokeWidth="0.8" />
          </svg>
          <h2 id="empty-title" className="text-2xl text-ash soft">L'enclume est vide</h2>
          <p className="text-ash-2 mt-2">
            Cherchez un objet par son nom dans la barre du haut pour le poser ici. Ses lignes, son budget de poids et son reliquat apparaîtront sur cette dalle.
          </p>
          <p className="text-xs text-ash-3 mt-4">Dataset local DofusDB 3.6.10.11, aucun appel réseau.</p>
        </div>
      </section>
    );
  }

  const exoCount = stats.filter((s) => s.isExo && s.currentValue > 0).length;
  const rollLaw = getParamEntry<string>('params.craft.rollDistribution');
  const qualityPct = rollQuality ? Math.round(rollQuality.position * 100) : null;

  return (
    <section className="slab p-5 sm:p-7" aria-labelledby="item-title">
      {/* En-tête de l'objet */}
      <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-slab-edge/60">
        <div className="w-[72px] h-[72px] rounded-xl bg-well border border-slab-edge grid place-items-center shadow-[inset_0_0_20px_rgb(0_0_0/0.6),0_0_0_4px_rgb(255_194_92/0.06)] overflow-hidden shrink-0">
          {item.imgUrl ? <img src={item.imgUrl} alt="" width={60} height={60} className="w-[60px] h-[60px]" /> : null}
        </div>
        <div className="min-w-0">
          <h1 id="item-title" className="text-[26px] sm:text-[30px] leading-tight text-ash soft">{item.name}</h1>
          <p className="text-sm text-ash-2 mt-0.5">
            {item.typeName} · niveau {item.level} · {stats.length} ligne{stats.length > 1 ? 's' : ''}
            {exoCount > 0 ? `, ${exoCount} exotique${exoCount > 1 ? 's' : ''}` : ''}
            {itemLocked ? ' · transcendé, verrouillé' : ''}
          </p>
        </div>
        <div className="ml-auto text-right">
          <div className="font-display font-bold text-[26px] tnum text-ash leading-none">{budget.qualityPercent.toFixed(1)} %</div>
          <div className="text-xs text-ash-3 mt-1">du jet parfait</div>
        </div>
        <div className="basis-full"><Crucible residualPool={atelier.residualPool} event={lastEvent} /></div>
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-2 py-3">
        <button type="button" onClick={atelier.undo} disabled={!atelier.canUndo} className="btn-well px-3 py-1.5 text-sm" title="Annuler (Ctrl+Z)">Annuler</button>
        <button type="button" onClick={atelier.redo} disabled={!atelier.canRedo} className="btn-well px-3 py-1.5 text-sm" title="Rétablir (Ctrl+Y)">Rétablir</button>
        {mode === 'adjust' && <span className="text-[11px] px-2 py-0.5 rounded-full border border-model text-model">mode Ajuster</span>}
        <details className="relative">
          <summary className="btn-well px-3 py-1.5 text-sm list-none cursor-pointer select-none" aria-label="Plus d'outils">⋯</summary>
          <div className="surface-iron absolute z-30 left-0 top-10 w-64 p-2 grid gap-1 shadow-panel text-sm">
            <div className="inline-flex p-0.5 rounded-control well" role="group" aria-label="Mode de l'atelier">
              <button type="button" onClick={() => atelier.setMode('forge')} aria-pressed={mode === 'forge'} className={`px-3 py-1.5 rounded-[8px] text-sm ${mode === 'forge' ? 'bg-iron-2 text-ash shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]' : 'text-ash-2 hover:text-ash'}`} title="Frapper des runes : les changements passent par le moteur (reliquat, pertes, verrous)">
                Forger
              </button>
              <button type="button" onClick={() => atelier.setMode('adjust')} aria-pressed={mode === 'adjust'} className={`px-3 py-1.5 rounded-[8px] text-sm ${mode === 'adjust' ? 'bg-iron-2 text-ash shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]' : 'text-ash-2 hover:text-ash'}`} title="Régler les lignes à la main pour planifier : agit sur le budget de poids, pas sur le reliquat">
                Ajuster
              </button>
            </div>
            <button type="button" onClick={atelier.resetToPerfect} className="btn-well px-3 py-1.5 text-left">Objet neuf</button>
            <button type="button" onClick={atelier.setAllToMax} disabled={itemLocked} className="btn-well px-3 py-1.5 text-left">Jet : tout au max</button>
            <button type="button" onClick={atelier.setAllToMin} disabled={itemLocked} className="btn-well px-3 py-1.5 text-left">Jet : tout au min</button>
            <button type="button" onClick={() => atelier.rollRandom()} disabled={itemLocked} className="btn-well px-3 py-1.5 text-left" title={`Loi « ${craftParams.rollDistribution} » (paramètre INCONNU) ; exos et reliquat intacts`}>Jet aléatoire</button>
            {onSaveToShowcase && (
              <button type="button" onClick={() => { if (onSaveToShowcase()) setSavedTick((t) => t + 1); }} className="btn-well px-3 py-1.5 text-left">Sauvegarder dans la vitrine</button>
            )}
          </div>
        </details>
        {savedTick > 0 && <span key={savedTick} className="entry-forged text-xs text-over" role="status">Figé dans la vitrine</span>}

        {rollQuality && qualityPct !== null && (
          <div className="ml-auto inline-flex items-center gap-2 text-xs text-ash-3" title={`${rollQuality.weightAchieved.toFixed(1)} sur ${rollQuality.weightMax.toFixed(1)} de poids de craft, ${rollQuality.rolledLines} ligne(s) à intervalle`}>
            <span>Qualité du jet</span>
            <span className="relative w-24 h-2 rounded-full roll-track overflow-hidden" aria-hidden="true">
              <span className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,var(--color-ember),var(--color-molten))]" style={{ width: `${qualityPct}%` }} />
            </span>
            <b className="text-ash tnum" aria-label={`Qualité du jet : ${qualityPct} pour cent`}>{qualityPct} %</b>
            <InfoTip label="Comment la qualité du jet est calculée">
              <p className="m-0">Position moyenne des lignes naturelles dans leur intervalle de craft, chaque point de l'intervalle pesant sa densité : la part du poids de craft maximal atteinte. Les over sont bornés à l'intervalle, les exos et les lignes fixes ne comptent pas.</p>
              <p className="m-0 mt-2">Indicateur de planification, pas une règle du jeu. La loi du jet aléatoire est un paramètre <StatusBadge status={rollLaw?.status ?? 'INCONNU'} /> (« {craftParams.rollDistribution} »), la même que celle de l'orbe.</p>
            </InfoTip>
          </div>
        )}
      </div>

      {/* Lignes */}
      <ul className="m-0 p-0 list-none">
        {stats.map((stat) => {
          // Plafond de la ligne selon la portée de la borne (global : ce que les autres lignes laissent)
          const maxOver = getLineOverRoom(stat, stats, overrides) ?? null;
          const absoluteMax = getStatAbsoluteMaxInContext(stat, stats, overrides);
          const effectiveBudget =
            stat.currentValue > stat.baseMax
              ? budget.remainingBudget + (stat.currentValue - stat.baseMax) * stat.weightPerPoint
              : stat.currentValue < stat.baseMax
                ? budget.remainingBudget - (stat.baseMax - stat.currentValue) * stat.weightPerPoint
                : budget.remainingBudget;
          const maxReachable = stat.isExo
            ? computeMaxReachable(stat, budget.remainingBudget + stat.currentValue * stat.weightPerPoint, overrides, absoluteMax)
            : computeMaxReachable({ ...stat, currentValue: stat.baseMax }, Math.max(0, effectiveBudget), overrides, absoluteMax);
          return (
            <ItemLine
              key={stat.characteristicId}
              stat={stat}
              mode={mode}
              selected={selectedId === stat.characteristicId}
              maxOver={maxOver}
              maxReachable={maxReachable}
              event={lastEvent}
              onSelect={onSelectLine}
              onUpdate={atelier.updateStat}
              onRemoveExo={atelier.removeExo}
              tiers={selectedId === stat.characteristicId ? tierOptions : undefined}
              activeTier={activeTier}
              armedTier={armed && armed.characteristicId === stat.characteristicId ? armed.tier : null}
              onTierClick={onTierClick}
            />
          );
        })}
      </ul>

      {children}
    </section>
  );
}
