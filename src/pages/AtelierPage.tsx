import type { AtelierApi } from '../hooks/useAtelier';
import { ItemSlab } from '../components/atelier/ItemSlab';
import { ActionPanel } from '../components/atelier/ActionPanel';
import { Crucible } from '../components/atelier/Crucible';
import { BudgetScale } from '../components/atelier/BudgetScale';
import { SessionCost } from '../components/atelier/SessionCost';
import { ForgeLog } from '../components/atelier/ForgeLog';

interface Props {
  atelier: AtelierApi;
  onSaveToShowcase: () => boolean;
}

/**
 * L'atelier : jauges et coût à gauche (creuset, balance, session), l'objet au centre,
 * l'action à droite, le Livre de forge en bas. Une colonne sur mobile ; entre 1024 et
 * 1280 px, l'objet et l'action côte à côte, les jauges en rangée dessous (les lignes de
 * l'objet ont besoin d'environ 540 px).
 */
export function AtelierPage({ atelier, onSaveToShowcase }: Props) {
  return (
    <div className="grid gap-5 px-4 sm:px-7 py-6 max-w-[1480px] mx-auto grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[260px_minmax(0,1fr)_320px]">
      <aside className="order-2 lg:order-3 xl:order-1 lg:col-span-2 xl:col-span-1 flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:items-start xl:flex xl:flex-col">
        <Crucible residualPool={atelier.residualPool} event={atelier.lastEvent} />
        <BudgetScale budget={atelier.budget} />
        <SessionCost consumed={atelier.consumed} onReset={atelier.resetSession} />
      </aside>

      <div className="order-1 xl:order-2 min-w-0">
        <ItemSlab atelier={atelier} onSaveToShowcase={atelier.item ? onSaveToShowcase : undefined} />
      </div>

      <aside className="order-3 lg:order-2 xl:order-3 min-w-0">
        <ActionPanel atelier={atelier} />
      </aside>

      <div className="order-4 lg:col-span-2 xl:col-span-3">
        <ForgeLog log={atelier.log} lastEvent={atelier.lastEvent} onClear={atelier.clearLog} />
      </div>
    </div>
  );
}
