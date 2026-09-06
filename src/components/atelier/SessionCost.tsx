import { useId } from 'react';
import type { SessionConsumption } from '../../types';
import { usePrices } from '../../app/PricesProvider';
import { computeSessionCost, formatKamas } from '../../state/sessionCost';
import { InfoTip } from '../shell/Badges';

interface Props {
  consumed: SessionConsumption;
  onReset: () => void;
}

const KIND_LABEL = { rune: 'rune', transcendence: 'transcendance', orb: 'orbe', potion: 'potion' } as const;

/**
 * Coût de la session : compteur des consommables dépensés sur l'objet (runes par type,
 * orbes, potions) et total en kamas d'après les prix saisis par l'utilisateur. Toujours
 * visible ; les prix sont vides par défaut et mémorisés sur l'appareil.
 */
export function SessionCost({ consumed, onReset }: Props) {
  const { prices, setPrice } = usePrices();
  const cost = computeSessionCost(consumed, prices);
  const baseId = useId();

  return (
    <section className="surface-iron p-4 sm:p-5" aria-labelledby="cost-title">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 id="cost-title" className="text-[17px] text-ash">Coût de la session</h2>
        <InfoTip label="Comment le coût est calculé">
          <p className="m-0">Chaque action acceptée par le moteur consomme son objet : une rune par frappe (même en échec critique), un orbe par réinitialisation. Annuler une frappe rend la rune.</p>
          <p className="m-0 mt-2">Les prix sont les vôtres : saisis ici, mémorisés sur cet appareil, jamais fournis par l'application. Le total n'additionne que les lignes dont le prix est renseigné.</p>
        </InfoTip>
      </div>

      {cost.lines.length === 0 ? (
        <p className="well rounded-control px-3 py-4 text-xs text-ash-3 text-center leading-snug">
          Rien de consommé sur cet objet. Chaque frappe acceptée par le moteur comptera ici, réussie ou non.
        </p>
      ) : (
        <ul className="m-0 p-0 list-none grid gap-1.5">
          {cost.lines.map((l, i) => {
            const id = `${baseId}-${i}`;
            return (
              <li key={l.key} className="well rounded-control px-2.5 py-2 grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 items-center text-[13px]">
                <span className="min-w-0">
                  <span className="block truncate text-ash">{l.label}</span>
                  <span className="block text-[11px] text-ash-3">{KIND_LABEL[l.kind]}</span>
                </span>
                <b className="font-display text-lg tnum text-molten-text text-right">×{l.count}</b>
                <label htmlFor={id} className="flex items-center gap-1.5 text-[11px] text-ash-3">
                  <span className="shrink-0">prix unitaire</span>
                  <input
                    id={id}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    placeholder="—"
                    value={l.unitPrice ?? ''}
                    onChange={(e) => setPrice(l.key, e.target.value === '' ? null : Number(e.target.value))}
                    className="well rounded-control px-2 py-1 w-full max-w-[110px] text-right tnum text-ash text-[13px]"
                    aria-label={`Prix unitaire de ${l.label} en kamas`}
                  />
                  <span>K</span>
                </label>
                <span className="text-right text-xs tnum text-ash-2">{l.subtotal === null ? <span className="text-ash-3">sans prix</span> : formatKamas(l.subtotal)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mt-3 pt-3 border-t border-iron-edge/60">
        <span className="text-sm text-ash-2">Total</span>
        <b className="font-display font-bold text-[24px] leading-none tnum text-ash">{cost.pricedLines > 0 ? formatKamas(cost.total) : '—'}</b>
        {cost.lines.length > 0 && !cost.complete && (
          <span className="text-[11px] px-2 py-0.5 rounded-full border border-model text-model" title={`${cost.unpricedLines} ligne(s) consommée(s) sans prix : le total ne les compte pas`}>
            prix incomplets
          </span>
        )}
        <span className="ml-auto text-xs text-ash-3 tnum">{cost.totalCount} consommable{cost.totalCount > 1 ? 's' : ''}</span>
      </div>
      <button type="button" onClick={onReset} disabled={cost.lines.length === 0} className="btn-well w-full mt-2.5 px-2.5 py-1.5 text-xs" title="Remettre les compteurs à zéro ; annulable avec Ctrl+Z">
        Réinitialiser la session
      </button>
    </section>
  );
}
