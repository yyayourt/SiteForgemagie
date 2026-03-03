import { useEffect, useCallback, useState } from 'react';
import { Header } from './components/Header';
import { ItemSelector } from './components/ItemSelector';
import { StatsSimulator } from './components/StatsSimulator';
import { PoolSummary } from './components/PoolSummary';
import { ActionBar } from './components/ActionBar';
import { SimulationLog } from './components/SimulationLog';
import { TheoryGuide } from './components/TheoryGuide';
import { useSimulation } from './hooks/useSimulation';

type AppTab = 'simulator' | 'theory';

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('simulator');
  const {
    item,
    stats,
    pool,
    mode,
    simulationLog,
    canUndo,
    canRedo,
    selectItem,
    updateStat,
    addExo,
    removeExo,
    resetToPerfect,
    undo,
    redo,
    toggleMode,
    applyRune,
    clearLog,
  } = useSimulation();

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Y
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Save to localStorage
  const handleSave = useCallback(() => {
    if (!item) return;
    const key = `fm-build-${item.id}`;
    const data = { item, stats, savedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem('fm-last-save', key);
    alert(`Build sauvegardé pour ${item.name}`);
  }, [item, stats]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6">

        {/* ── Onglet Guide Théorique ── */}
        {activeTab === 'theory' && <TheoryGuide />}

        {/* ── Onglet Simulateur ── */}
        {activeTab === 'simulator' && <>
        {/* Item search */}
        <section className="bg-dofus-panel border border-dofus-gold/20 rounded-xl p-5">
          <ItemSelector selectedItem={item} onSelect={selectItem} />
        </section>

        {/* Selected item info */}
        {item && (
          <>
            <div className="flex items-center gap-4 bg-dofus-panel border border-dofus-gold/20 rounded-xl p-4">
              {item.imgUrl && (
                <img
                  src={item.imgUrl}
                  alt={item.name}
                  className="w-14 h-14 rounded-lg border border-dofus-gold/30 bg-dofus-dark"
                />
              )}
              <div>
                <h2 className="text-xl font-bold text-white">{item.name}</h2>
                <p className="text-sm text-gray-400">
                  {item.typeName} &middot; Niveau {item.level}
                </p>
              </div>
              {/* Mode indicator */}
              {mode === 'simulation' && (
                <span className="ml-auto text-xs px-3 py-1 rounded-full bg-exo/20 text-exo border border-exo/30 font-medium">
                  Mode Simulation
                </span>
              )}
            </div>

            {/* Actions */}
            <ActionBar
              canUndo={canUndo}
              canRedo={canRedo}
              hasItem={!!item}
              mode={mode}
              onUndo={undo}
              onRedo={redo}
              onReset={resetToPerfect}
              onSave={handleSave}
              onToggleMode={toggleMode}
            />

            {/* Pool summary */}
            <PoolSummary pool={pool} />

            {/* Stats simulator */}
            <section className="bg-dofus-panel border border-dofus-gold/20 rounded-xl p-5">
              <StatsSimulator
                stats={stats}
                poolRemaining={pool.poolRemaining}
                mode={mode}
                onUpdate={updateStat}
                onApplyRune={applyRune}
                onAddExo={addExo}
                onRemoveExo={removeExo}
              />
            </section>

            {/* Simulation log (only in simulation mode) */}
            {mode === 'simulation' && (
              <SimulationLog log={simulationLog} onClear={clearLog} />
            )}
          </>
        )}

        {/* Empty state */}
        {!item && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">Recherche un item pour commencer la simulation</p>
            <p className="text-sm mt-2">
              Tape le nom d'un item Dofus dans la barre de recherche ci-dessus
            </p>
          </div>
        )}
        </>}
      </main>

      <footer className="text-center py-4 text-xs text-gray-600 border-t border-dofus-gold/10">
        Simulateur FM &mdash; Données via DofusDB
      </footer>
    </div>
  );
}

export default App;
