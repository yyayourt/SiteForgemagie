import type { WeightBudget } from '../../types';
import { InfoTip } from '../shell/Badges';

interface Props {
  budget: WeightBudget;
}

/**
 * La balance : BUDGET DE POIDS de planification, dérivé des lignes visibles.
 * Fer froid, sans lumière : ce n'est pas le reliquat.
 */
export function BudgetScale({ budget }: Props) {
  const { freedWeight, spentWeight, remainingBudget, overExoTotal, overExoBudgetRemaining } = budget;
  const tilt = Math.max(-6, Math.min(6, (spentWeight - freedWeight) / 25));

  return (
    <section className="surface-iron p-4 sm:p-5" aria-labelledby="budget-title">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h2 id="budget-title" className="text-[15px] text-ash-2">
          Budget de poids <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full border border-iron-edge text-ash-3 align-middle">planification</span>
        </h2>
        <InfoTip label="Ce qu'est le budget de poids">
          <p className="m-0"><strong className="text-ash">Budget de poids</strong> : compté sur les lignes visibles. Poids libéré par les lignes descendues sous leur jet parfait, moins poids consommé par les overs et les exos. Il peut être négatif : c'est ce que vous <em>planifiez</em>.</p>
          <p className="m-0 mt-2">Le <strong className="text-ash">reliquat</strong>, dans le creuset, est ce que le serveur <em>retient</em> réellement après chaque perte. Les deux ne se convertissent pas l'un dans l'autre.</p>
        </InfoTip>
      </div>

      <div className="relative h-[54px] my-2" aria-hidden="true">
        <div className="beam-bar absolute left-[6%] right-[6%] top-[18px] h-[3px] rounded-sm origin-center" style={{ transform: `rotate(${tilt}deg)` }} />
        <div className="beam-pivot absolute left-1/2 top-2 w-3 h-[22px] -ml-1.5" />
        <div className="beam-pan absolute left-[8%] w-[54px] h-[10px]" style={{ top: `${30 - tilt}px` }} />
        <div className="beam-pan absolute right-[8%] w-[54px] h-[10px]" style={{ top: `${30 + tilt}px` }} />
      </div>

      <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-[13px] text-ash-2 tnum m-0">
        <dt>Poids libéré</dt><dd className="m-0 text-right font-semibold text-ash">{freedWeight.toFixed(1)}</dd>
        <dt>Poids consommé</dt><dd className="m-0 text-right font-semibold text-ash">{spentWeight.toFixed(1)}</dd>
        <dt>Reste à payer</dt>
        <dd className={`m-0 text-right font-semibold ${remainingBudget < 0 ? 'text-sn' : 'text-ash'}`}>{remainingBudget.toFixed(1)}</dd>
        <dt className="pt-1 border-t border-iron-edge/60">Over + exo</dt>
        <dd className="m-0 pt-1 border-t border-iron-edge/60 text-right text-ash" title={`Lecture « globale » de la borne : il reste ${overExoBudgetRemaining.toFixed(1)} avant le plafond. La portée de la borne (par ligne ou globale) est une CONTRADICTION non tranchée.`}>
          {overExoTotal.toFixed(1)}
        </dd>
      </dl>
      <p className="text-xs text-ash-3 mt-2 leading-snug">
        La balance dit ce que vous planifiez ; le creuset, ce que le serveur retient.
      </p>
    </section>
  );
}
