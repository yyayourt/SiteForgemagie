import { useCallback, useMemo, useRef, useState } from 'react';
import type { AtelierApi } from '../hooks/useAtelier';
import type { RuneTier } from '../types';
import { useParams } from '../app/ParamsProvider';
import { getDensity } from '../data/params';
import { ItemSlab } from '../components/atelier/ItemSlab';
import { ForgeSlot } from '../components/atelier/ForgeSlot';
import { RunePalette } from '../components/atelier/RunePalette';
import { SidePanel } from '../components/atelier/SidePanel';
import { exoToDropOnRetarget, nextLineId, resolveTier, tierClick, type ArmedTier, type SlotKind } from '../components/atelier/forgeSelection';
import { useForgeShortcuts } from '../hooks/useForgeShortcuts';

interface Props {
  atelier: AtelierApi;
  onSaveToShowcase: () => boolean;
}

/**
 * L'atelier, « fenêtre façon jeu » : historique/budget/coût à gauche, l'objet et le slot de
 * fusion au centre, la palette de runes à droite. ≥ 1280 px : trois colonnes ; 1024–1279 :
 * objet + palette, onglets dessous ; < 1024 : une colonne.
 */
export function AtelierPage({ atelier, onSaveToShowcase }: Props) {
  const { overrides } = useParams();
  const [chosenTier, setChosenTier] = useState<RuneTier>('normal');
  const [armed, setArmed] = useState<ArmedTier>(null);
  const [slotKind, setSlotKind] = useState<SlotKind>('rune');
  const [showHelp, setShowHelp] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { selected, stats, selectedId, item, itemLocked, mode } = atelier;
  const options = useMemo(() => (selected ? atelier.runeOptions(selected.characteristicId) : []), [selected, atelier]);
  const tier = resolveTier(options, chosenTier);
  const canForge = !!item && !itemLocked && mode === 'forge';
  const densityOf = useCallback((cid: number) => getDensity(cid, overrides), [overrides]);

  /** Change de cible ; un exo créé puis laissé à 0 est retiré (choix d'interface). */
  const retarget = useCallback(
    (cid: number) => {
      const drop = exoToDropOnRetarget(stats, selectedId, cid);
      if (drop !== null) atelier.removeExo(drop);
      atelier.selectLine(cid);
      setSlotKind('rune');
      setArmed(null);
    },
    [atelier, stats, selectedId]
  );

  const pickCharacteristic = useCallback(
    (cid: number, onItem: boolean) => {
      if (mode === 'adjust') {
        if (!onItem) atelier.addExo(cid);
        return;
      }
      if (onItem) return retarget(cid);
      const drop = exoToDropOnRetarget(stats, selectedId, cid);
      if (drop !== null) atelier.removeExo(drop);
      atelier.addExo(cid); // ADD_EXO vise la nouvelle ligne
      setSlotKind('rune');
      setArmed(null);
    },
    [atelier, mode, retarget, stats, selectedId]
  );

  const fuse = useCallback(
    (withTier: RuneTier = tier) => {
      if (!canForge || !selected || slotKind !== 'rune' || options.length === 0) return;
      atelier.attemptRune(selected.characteristicId, withTier);
    },
    [atelier, canForge, selected, slotKind, options.length, tier]
  );

  const onTierClick = useCallback(
    (t: RuneTier) => {
      if (!selected) return;
      const r = tierClick(armed, selected.characteristicId, t);
      setArmed(r.armed);
      setChosenTier(t);
      setSlotKind('rune');
      if (r.fire) fuse(t);
    },
    [armed, selected, fuse]
  );

  useForgeShortcuts(
    {
      onMove: (dir) => {
        const id = nextLineId(stats, selectedId, dir);
        if (id !== null && id !== selectedId) retarget(id);
      },
      onTier: (i) => {
        const o = options[i];
        if (o) { setChosenTier(o.tier); setArmed(null); }
      },
      onFuse: () => fuse(),
      onFocusSearch: () => searchRef.current?.focus(),
      onToggleHelp: () => setShowHelp((v) => !v),
    },
    !!item
  );

  const canTranscend = !!selected && atelier.transcendenceOptions(selected.characteristicId).length > 0;

  return (
    <div className="grid gap-5 px-4 sm:px-7 py-6 max-w-[1480px] mx-auto grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[260px_minmax(0,1fr)_300px] items-start">
      <aside className="order-3 lg:col-span-2 xl:col-span-1 xl:order-1 min-w-0">
        <SidePanel atelier={atelier} />
      </aside>

      <div className="order-1 xl:order-2 min-w-0">
        <ItemSlab
          atelier={atelier}
          onSaveToShowcase={item ? onSaveToShowcase : undefined}
          onSelectLine={retarget}
          tierOptions={options}
          activeTier={tier}
          armed={armed}
          onTierClick={onTierClick}
        >
          <ForgeSlot atelier={atelier} slotKind={slotKind} tier={tier} onFuse={() => fuse()} showHelp={showHelp} onToggleHelp={() => setShowHelp((v) => !v)} />
        </ItemSlab>
      </div>

      <aside className="order-2 xl:order-3 min-w-0">
        <RunePalette
          stats={stats}
          densityOf={densityOf}
          heavyIds={atelier.probabilityParams.heavyExoCharacteristics}
          selectedId={selectedId}
          slotKind={slotKind}
          mode={mode}
          disabled={!item || itemLocked}
          canTranscend={canTranscend}
          onPickCharacteristic={pickCharacteristic}
          onPickSlot={(kind) => { setSlotKind(kind); setArmed(null); }}
          searchRef={searchRef}
        />
      </aside>
    </div>
  );
}
