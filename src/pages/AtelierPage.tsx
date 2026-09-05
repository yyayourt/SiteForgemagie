import type { AtelierApi } from '../hooks/useAtelier';
import { ItemSlab } from '../components/atelier/ItemSlab';
import { ActionPanel } from '../components/atelier/ActionPanel';
import { Crucible } from '../components/atelier/Crucible';
import { BudgetScale } from '../components/atelier/BudgetScale';
import { ForgeLog } from '../components/atelier/ForgeLog';

/**
 * L'atelier : jauges à gauche (creuset, balance), l'objet au centre, l'action à droite,
 * le Livre de forge en bas. Une colonne sur mobile.
 */
export function AtelierPage({ atelier }: { atelier: AtelierApi }) {
  return (
    <div className="grid gap-5 px-4 sm:px-7 py-6 max-w-[1480px] mx-auto grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
      <aside className="order-2 lg:order-1 flex flex-col gap-4">
        <Crucible residualPool={atelier.residualPool} event={atelier.lastEvent} />
        <BudgetScale budget={atelier.budget} />
      </aside>

      <div className="order-1 lg:order-2 min-w-0">
        <ItemSlab atelier={atelier} />
      </div>

      <aside className="order-3 min-w-0">
        <ActionPanel atelier={atelier} />
      </aside>

      <div className="order-4 lg:col-span-3">
        <ForgeLog log={atelier.log} lastEvent={atelier.lastEvent} onClear={atelier.clearLog} />
      </div>
    </div>
  );
}
