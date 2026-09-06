import { useTheme } from '../../app/ThemeProvider';
import { useParams } from '../../app/ParamsProvider';
import { ItemSearch } from '../atelier/ItemSearch';
import type { Item, SimulatedStat } from '../../types';

export type Page = 'atelier' | 'vitrine' | 'montecarlo' | 'savoir';

interface Props {
  page: Page;
  onNavigate: (page: Page) => void;
  onOpenParams: () => void;
  paramsOpen: boolean;
  onSelectItem: (item: Item, stats: SimulatedStat[]) => void;
  currentItemName?: string;
  /** Nombre d'objets dans la vitrine (badge de navigation) */
  showcaseCount?: number;
}

const PAGES: { id: Page; label: string }[] = [
  { id: 'atelier', label: 'Atelier' },
  { id: 'vitrine', label: 'Vitrine' },
  { id: 'montecarlo', label: 'Monte Carlo' },
  { id: 'savoir', label: 'Savoir' },
];

export function TopBar({ page, onNavigate, onOpenParams, paramsOpen, onSelectItem, currentItemName, showcaseCount = 0 }: Props) {
  const { theme, toggle } = useTheme();
  const { overrideCount } = useParams();

  return (
    <header className="relative">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 sm:px-7 py-3 bg-[linear-gradient(180deg,rgb(255_255_255/0.03),transparent)] border-b border-iron-edge">
        <a href="#atelier" onClick={(e) => { e.preventDefault(); onNavigate('atelier'); }} className="font-display font-bold text-[22px] soft text-molten-text leading-none no-underline">
          La Forge
          <span className="block font-text text-[11px] font-normal text-ash-3 mt-1 tracking-normal">simulateur de forgemagie · DOFUS 3.6</span>
        </a>

        <div className="order-3 basis-full sm:order-none sm:basis-auto sm:flex-1 sm:max-w-[520px]">
          <ItemSearch onSelect={onSelectItem} currentItemName={currentItemName} />
        </div>

        <nav className="ml-auto flex items-center gap-1 max-w-full overflow-x-auto [scrollbar-width:thin]" aria-label="Pages">
          {PAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onNavigate(p.id)}
              aria-current={page === p.id ? 'page' : undefined}
              className={`shrink-0 px-3 py-2 rounded-control border text-sm whitespace-nowrap transition-colors ${
                page === p.id ? 'border-iron-edge bg-iron text-ash' : 'border-transparent text-ash-2 hover:text-ash hover:bg-iron'
              }`}
            >
              {p.label}
              {p.id === 'vitrine' && showcaseCount > 0 && (
                <span className="ml-1.5 text-[11px] px-1.5 py-px rounded-full border border-iron-edge text-ash-3 tnum" aria-label={`${showcaseCount} objet(s) dans la vitrine`}>{showcaseCount}</span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={onOpenParams}
            aria-expanded={paramsOpen}
            aria-controls="params-drawer"
            className={`shrink-0 px-3 py-2 rounded-control border text-sm whitespace-nowrap transition-colors ${
              paramsOpen ? 'border-iron-edge bg-iron text-ash' : 'border-transparent text-ash-2 hover:text-ash hover:bg-iron'
            }`}
          >
            Paramètres
            {overrideCount > 0 && (
              <span className="ml-1.5 text-[11px] px-1.5 py-px rounded-full border border-model text-model" title={`${overrideCount} paramètre(s) modifié(s) par rapport au fichier`}>
                {overrideCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-pressed={theme === 'light'}
            className="shrink-0 ml-1 inline-flex items-center gap-2 px-3 py-2 rounded-full border border-iron-edge bg-iron text-ash-2 text-xs hover:text-ash hover:border-ash-3"
            title="Basculer entre la forge de nuit (mode principal) et l'atelier de jour"
          >
            {theme === 'light' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="text-molten-text"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="text-molten-text"><path d="M20 15.5A8 8 0 0 1 8.5 4a8 8 0 1 0 11.5 11.5Z" /></svg>
            )}
            <span className="hidden sm:inline">{theme === 'light' ? 'Atelier de jour' : 'Forge de nuit'}</span>
          </button>
        </nav>
      </div>
      <div className="ember-rule" aria-hidden="true" />
    </header>
  );
}
