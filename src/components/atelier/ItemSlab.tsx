import { useEffect, useState } from 'react';
import type { AtelierApi } from '../../hooks/useAtelier';
import { computeMaxReachable } from '../../logic/planning/weightBudget';
import { getMaxOverOrExo } from '../../data/statCaps';
import { getParamEntry } from '../../data/params';
import { useParams } from '../../app/ParamsProvider';
import { InfoTip, StatusBadge } from '../shell/Badges';
import { ItemLine } from './ItemLine';
import { ExoPicker } from './ExoPicker';

interface Props {
  atelier: AtelierApi;
  /** Fige l'objet courant dans la vitrine ; renvoie vrai si sauvegardé */
  onSaveToShowcase?: () => boolean;
}

/** La dalle d'enclume : l'objet et ses lignes, le héros de l'atelier. */
export function ItemSlab({ atelier, onSaveToShowcase }: Props) {
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
      </div>

      {/* Mode et outils */}
      <div className="flex flex-wrap items-center gap-2 py-3">
        <div className="inline-flex p-0.5 rounded-control well" role="group" aria-label="Mode de l'atelier">
          <button type="button" onClick={() => atelier.setMode('forge')} aria-pressed={mode === 'forge'} className={`px-3 py-1.5 rounded-[8px] text-sm ${mode === 'forge' ? 'bg-iron-2 text-ash shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]' : 'text-ash-2 hover:text-ash'}`} title="Frapper des runes : les changements passent par le moteur (reliquat, pertes, verrous)">
            Forger
          </button>
          <button type="button" onClick={() => atelier.setMode('adjust')} aria-pressed={mode === 'adjust'} className={`px-3 py-1.5 rounded-[8px] text-sm ${mode === 'adjust' ? 'bg-iron-2 text-ash shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]' : 'text-ash-2 hover:text-ash'}`} title="Régler les lignes à la main pour planifier : agit sur le budget de poids, pas sur le reliquat">
            Ajuster
          </button>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={atelier.undo} disabled={!atelier.canUndo} className="btn-well px-3 py-1.5 text-sm" title="Annuler (Ctrl+Z)">Annuler</button>
          <button type="button" onClick={atelier.redo} disabled={!atelier.canRedo} className="btn-well px-3 py-1.5 text-sm" title="Rétablir (Ctrl+Y)">Rétablir</button>
          <button type="button" onClick={atelier.resetToPerfect} className="btn-well px-3 py-1.5 text-sm" title="Repartir d'un objet neuf : toutes les lignes au jet parfait, exos retirés, reliquat et journal vidés">Objet neuf</button>
          {onSaveToShowcase && (
            <button
              type="button"
              onClick={() => { if (onSaveToShowcase()) setSavedTick((t) => t + 1); }}
              className="btn-well px-3 py-1.5 text-sm inline-flex items-center gap-1.5"
              title="Figer l'objet tel quel dans la vitrine : lignes, reliquat, runes consommées, coût, historique"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 7h16v13H4zM8 7V4h8v3M4 12h16" /></svg>
              Sauvegarder dans la vitrine
            </button>
          )}
          {savedTick > 0 && (
            <span key={savedTick} className="entry-forged text-xs text-over" role="status">
              Figé dans la vitrine
            </span>
          )}
        </div>
      </div>

      {/* Saisie rapide du jet */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-3 -mt-1">
        <div className="inline-flex items-center gap-1.5" role="group" aria-label="Saisie rapide du jet">
          <span className="text-xs text-ash-3">Jet</span>
          <button type="button" onClick={atelier.setAllToMax} disabled={itemLocked} className="btn-well px-2.5 py-1 text-xs" title="Toutes les lignes naturelles à leur maximum ; exos et reliquat intacts">Tout au max</button>
          <button type="button" onClick={atelier.setAllToMin} disabled={itemLocked} className="btn-well px-2.5 py-1 text-xs" title="Toutes les lignes naturelles à leur minimum ; exos et reliquat intacts">Tout au min</button>
          <button
            type="button"
            onClick={() => atelier.rollRandom()}
            disabled={itemLocked}
            className="btn-well px-2.5 py-1 text-xs inline-flex items-center gap-1.5"
            title={`Tirer chaque ligne naturelle dans son intervalle, loi « ${craftParams.rollDistribution} » (paramètre INCONNU) ; exos et reliquat intacts`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="9" cy="9" r="1.2" fill="currentColor" /><circle cx="15" cy="15" r="1.2" fill="currentColor" /><circle cx="15" cy="9" r="1.2" fill="currentColor" /><circle cx="9" cy="15" r="1.2" fill="currentColor" /></svg>
            Jet aléatoire
          </button>
        </div>

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
          const maxOver = getMaxOverOrExo(stat.characteristicId, overrides) ?? null;
          const effectiveBudget =
            stat.currentValue > stat.baseMax
              ? budget.remainingBudget + (stat.currentValue - stat.baseMax) * stat.weightPerPoint
              : stat.currentValue < stat.baseMax
                ? budget.remainingBudget - (stat.baseMax - stat.currentValue) * stat.weightPerPoint
                : budget.remainingBudget;
          const maxReachable = stat.isExo
            ? computeMaxReachable(stat, budget.remainingBudget + stat.currentValue * stat.weightPerPoint, overrides)
            : computeMaxReachable({ ...stat, currentValue: stat.baseMax }, Math.max(0, effectiveBudget), overrides);
          return (
            <ItemLine
              key={stat.characteristicId}
              stat={stat}
              mode={mode}
              selected={selectedId === stat.characteristicId}
              maxOver={maxOver}
              maxReachable={maxReachable}
              event={lastEvent}
              onSelect={atelier.selectLine}
              onUpdate={atelier.updateStat}
              onRemoveExo={atelier.removeExo}
            />
          );
        })}
      </ul>

      {mode === 'adjust' && !itemLocked && (
        <div className="pt-3 mt-2 border-t border-slab-edge/60">
          <ExoPicker currentStats={stats} onAdd={atelier.addExo} />
        </div>
      )}
      {mode === 'forge' && (
        <p className="pt-3 mt-2 border-t border-slab-edge/60 text-xs text-ash-3">
          Cliquez une ligne pour la viser, puis choisissez une rune dans le panneau « Frapper ». Pour ajouter un exo ou régler un jet à la main, passez en mode « Ajuster ».
        </p>
      )}
    </section>
  );
}
