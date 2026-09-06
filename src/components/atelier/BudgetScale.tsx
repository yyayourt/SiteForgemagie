import type { WeightBudget } from '../../types';
import { InfoTip, StatusBadge } from '../shell/Badges';
import { useParams } from '../../app/ParamsProvider';
import { getOverCapScope, getOverCapWeight, getParamEntry } from '../../data/params';

interface Props {
  budget: WeightBudget;
}

/**
 * La balance : BUDGET DE POIDS de planification, dérivé des lignes visibles.
 * Fer froid, sans lumière : ce n'est pas le reliquat. Sous la balance, la jauge
 * « over/exo utilisé » : cumul de la part over et des exos face à la borne.
 */
export function BudgetScale({ budget }: Props) {
  const { overrides } = useParams();
  const { freedWeight, spentWeight, remainingBudget, overExoTotal } = budget;
  const tilt = Math.max(-6, Math.min(6, (spentWeight - freedWeight) / 25));

  const cap = getOverCapWeight(overrides);
  const scope = getOverCapScope(overrides);
  const scopeEntry = getParamEntry<string>('params.overCapScope');
  const capEntry = getParamEntry<number>('params.overCapWeight');
  const usedPercent = cap > 0 ? Math.min(100, (overExoTotal / cap) * 100) : 0;
  const atCap = overExoTotal >= cap - 1e-9;
  const nearCap = !atCap && usedPercent >= 85;

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
      </dl>

      {/* Jauge de la borne d'over/exo */}
      <div className="mt-3 pt-3 border-t border-iron-edge/60" role="group" aria-labelledby="overcap-title">
        <div className="flex items-center gap-1.5">
          <span id="overcap-title" className="text-[13px] text-ash-2">Over/exo utilisé</span>
          <InfoTip label="Comment la borne d'over/exo est mesurée">
            <p className="m-0">Cumul de la <strong className="text-ash">part over</strong> de chaque ligne (valeur moins jet maximal, fois densité) et du poids des <strong className="text-ash">exotiques</strong>, face à la borne de <span className="tnum">{cap}</span> (<StatusBadge status={capEntry?.status ?? 'HYPOTHÈSE COMMUNAUTAIRE'} />).</p>
            <p className="m-0 mt-2">
              Portée <StatusBadge status={scopeEntry?.status ?? 'HYPOTHÈSE COMMUNAUTAIRE'} /> : {scope === 'global'
                ? "cumulée sur l'objet, comme les exemples d'un guide récent qui font partager la borne à deux lignes. Un objet observé avec un exo PA et un over de deux points de poids ailleurs réfuterait cette lecture."
                : 'par ligne (chaque ligne dispose de sa propre borne) ; ce cumul est alors indicatif.'}
            </p>
          </InfoTip>
          <b className={`ml-auto text-[13px] tnum ${atCap ? 'text-ec' : nearCap ? 'text-molten-text' : 'text-ash'}`} aria-live="polite">
            {overExoTotal.toFixed(1)} / {cap}
          </b>
        </div>
        <div className="roll-track relative h-2 mt-1.5 rounded-full overflow-hidden" aria-hidden="true">
          <span
            className={`absolute inset-y-0 left-0 rounded-full ${atCap ? 'bg-ec' : 'bg-[linear-gradient(90deg,var(--color-over),var(--color-exo))]'}`}
            style={{ width: `${usedPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-ash-3 mt-1 leading-snug tnum">
          {scope === 'global' ? `borne cumulée sur l'objet · reste ${Math.max(0, cap - overExoTotal).toFixed(1)}` : 'borne par ligne · cumul indicatif'}
        </p>
      </div>

      <p className="text-xs text-ash-3 mt-2 leading-snug">
        La balance dit ce que vous planifiez ; le creuset, ce que le serveur retient.
      </p>
    </section>
  );
}
