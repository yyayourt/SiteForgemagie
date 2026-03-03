import type { AppMode } from '../types';

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  hasItem: boolean;
  mode: AppMode;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onSave: () => void;
  onToggleMode: () => void;
}

export function ActionBar({
  canUndo,
  canRedo,
  hasItem,
  mode,
  onUndo,
  onRedo,
  onReset,
  onSave,
  onToggleMode,
}: Props) {
  if (!hasItem) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Mode toggle */}
      <button
        onClick={onToggleMode}
        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
          mode === 'simulation'
            ? 'bg-exo/20 border-exo/40 text-exo hover:bg-exo/30'
            : 'bg-dofus-panel border-dofus-gold/20 text-dofus-gold hover:bg-dofus-gold/20'
        }`}
      >
        {mode === 'planning' ? '⚗️ Passer en Simulation' : '📐 Passer en Planification'}
      </button>

      <div className="w-px h-6 bg-dofus-gold/20 mx-1" />

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="px-4 py-2 rounded-lg bg-dofus-panel border border-dofus-gold/20 text-sm text-white hover:bg-dofus-panel-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Ctrl+Z"
      >
        Annuler
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="px-4 py-2 rounded-lg bg-dofus-panel border border-dofus-gold/20 text-sm text-white hover:bg-dofus-panel-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Ctrl+Y"
      >
        Rétablir
      </button>
      <button
        onClick={onReset}
        className="px-4 py-2 rounded-lg bg-dofus-panel border border-dofus-gold/20 text-sm text-dofus-gold hover:bg-dofus-gold/20 transition-colors"
      >
        Jet parfait
      </button>
      <button
        onClick={onSave}
        className="px-4 py-2 rounded-lg bg-dofus-gold/20 border border-dofus-gold/30 text-sm text-dofus-gold hover:bg-dofus-gold/30 transition-colors ml-auto"
      >
        Sauvegarder
      </button>
    </div>
  );
}
