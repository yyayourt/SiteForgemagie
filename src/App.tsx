import { useCallback, useEffect, useState } from 'react';
import { TopBar, type Page } from './components/shell/TopBar';
import { AtelierPage } from './pages/AtelierPage';
import { MonteCarloPage } from './pages/MonteCarloPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { VitrinePage } from './pages/VitrinePage';
import { ParamsDrawer } from './pages/ParamsDrawer';
import { useAtelier } from './hooks/useAtelier';
import { useShowcase } from './hooks/useShowcase';
import { usePrices } from './app/PricesProvider';
import { computeSessionCost } from './state/sessionCost';
import { showcaseToAtelierState, type ShowcaseEntry } from './state/showcase';

function pageFromHash(): Page {
  const h = window.location.hash.replace('#', '');
  return h === 'montecarlo' || h === 'savoir' || h === 'vitrine' ? h : 'atelier';
}

function App() {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [paramsOpen, setParamsOpen] = useState(false);
  const atelier = useAtelier();
  const showcase = useShowcase();
  const { prices } = usePrices();

  const navigate = useCallback((p: Page) => {
    setPage(p);
    window.location.hash = p;
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Raccourcis : Ctrl+Z / Ctrl+Y (hors champs de saisie)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); atelier.undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); atelier.redo(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [atelier]);

  // ─── Vitrine ───
  const saveToShowcase = useCallback((): boolean => {
    if (!atelier.item) return false;
    showcase.save(
      { item: atelier.item, stats: atelier.stats, residualPool: atelier.residualPool, itemLocked: atelier.itemLocked, consumed: atelier.consumed, log: atelier.log, logCounter: atelier.logCounter },
      computeSessionCost(atelier.consumed, prices)
    );
    return true;
  }, [atelier.item, atelier.stats, atelier.residualPool, atelier.itemLocked, atelier.consumed, atelier.log, atelier.logCounter, showcase, prices]);

  const resumeFromShowcase = useCallback(
    (entry: ShowcaseEntry) => {
      atelier.restore(showcaseToAtelierState(entry));
      navigate('atelier');
    },
    [atelier, navigate]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-3 focus:py-2 focus:bg-iron focus:text-ash focus:rounded-control">
        Aller au contenu
      </a>
      <TopBar
        page={page}
        onNavigate={navigate}
        onOpenParams={() => setParamsOpen((o) => !o)}
        paramsOpen={paramsOpen}
        onSelectItem={(item, stats) => { atelier.selectItem(item, stats); if (page !== 'atelier') navigate('atelier'); }}
        currentItemName={atelier.item?.name}
        showcaseCount={showcase.entries.length}
      />

      <main id="main" className="flex-1">
        {page === 'atelier' && <AtelierPage atelier={atelier} onSaveToShowcase={saveToShowcase} />}
        {page === 'vitrine' && <VitrinePage showcase={showcase} onResume={resumeFromShowcase} />}
        {page === 'montecarlo' && <MonteCarloPage atelier={atelier} />}
        {page === 'savoir' && <KnowledgePage />}
      </main>

      <footer className="px-4 sm:px-7 py-4 text-xs text-ash-3 border-t border-iron-edge/60 flex flex-wrap gap-x-4 gap-y-1">
        <span>La Forge — reconstruction traçable de la forgemagie DOFUS 3. La formule du serveur est secrète : toute probabilité affichée est un modèle.</span>
        <span className="ml-auto">Données d'objets DofusDB (dataset local). Icônes d'objets : assets Ankama, usage communautaire.</span>
      </footer>

      <ParamsDrawer open={paramsOpen} onClose={() => setParamsOpen(false)} />
    </div>
  );
}

export default App;
