import { useState } from 'react';
import type { AtelierApi } from '../../hooks/useAtelier';
import { ForgeLog } from './ForgeLog';
import { BudgetScale } from './BudgetScale';
import { SessionCost } from './SessionCost';

type SideTab = 'log' | 'budget' | 'cost';
const TABS: { id: SideTab; label: string }[] = [
  { id: 'log', label: 'Historique' },
  { id: 'budget', label: 'Budget' },
  { id: 'cost', label: 'Coût' },
];

/** Colonne gauche : historique des frappes, budget de planification, coût de la session. */
export function SidePanel({ atelier }: { atelier: AtelierApi }) {
  const [tab, setTab] = useState<SideTab>('log');
  return (
    <section className="surface-iron p-3 sm:p-4 flex flex-col gap-3 xl:sticky xl:top-4" aria-label="Historique, budget et coût">
      <div className="well rounded-control p-0.5 grid grid-cols-3 gap-0.5" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-1 py-1.5 rounded-[8px] text-[12.5px] ${tab === t.id ? 'bg-iron-2 text-ash shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]' : 'text-ash-2 hover:text-ash'}`}
          >
            {t.label}
            {t.id === 'log' && atelier.log.length > 0 && <span className="ml-1 text-ash-3 tnum">{atelier.log.length}</span>}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'log' && <ForgeLog log={atelier.log} lastEvent={atelier.lastEvent} onClear={atelier.clearLog} />}
        {tab === 'budget' && <BudgetScale budget={atelier.budget} />}
        {tab === 'cost' && <SessionCost consumed={atelier.consumed} onReset={atelier.resetSession} />}
      </div>
    </section>
  );
}
