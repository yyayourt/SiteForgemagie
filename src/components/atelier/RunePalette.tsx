import { useMemo, useState, type ReactNode, type Ref } from 'react';
import type { AtelierMode, SimulatedStat } from '../../types';
import { CHARACTERISTICS_WITH_RUNES, getCharacteristicName, getRepresentativeRuneImg } from '../../data/dataset';
import { getParamEntry } from '../../data/params';
import { StatusBadge } from '../shell/Badges';
import { RuneIcon } from './RuneIcon';
import { buildPaletteGroups, type PaletteTile } from './paletteModel';
import type { SlotKind } from './forgeSelection';

export interface RunePaletteProps {
  stats: readonly SimulatedStat[];
  densityOf: (cid: number) => number | undefined;
  heavyIds: readonly number[];
  selectedId: number | null;
  slotKind: SlotKind;
  mode: AtelierMode;
  /** Pas d'objet, ou objet transcendé : tout est désactivé */
  disabled: boolean;
  canTranscend: boolean;
  onPickCharacteristic: (characteristicId: number, onItem: boolean) => void;
  onPickSlot: (kind: 'orb' | 'transcendence' | 'potion') => void;
  searchRef?: Ref<HTMLInputElement>;
}

/**
 * La palette : l'inventaire de runes de l'atelier. Une tuile par caractéristique ; poser la
 * rune d'une caractéristique absente crée l'exo, comme en jeu. Orbe, transcendance et potion
 * sont des tuiles « Objets FM ». La potion est sélectionnable en mode « Forger » : le slot de
 * fusion affiche alors l'avertissement (taux de conservation en CONTRADICTION, module non
 * modélisé) et un bouton « Appliquer » désactivé.
 */
export function RunePalette(props: RunePaletteProps) {
  const { stats, densityOf, heavyIds, selectedId, slotKind, mode, disabled, canTranscend, onPickCharacteristic, onPickSlot, searchRef } = props;
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const potionStatus = getParamEntry<unknown>('params.potions.damageKeptPercentByLevel')?.status ?? 'CONTRADICTION';

  const groups = useMemo(() => {
    const presentIds = new Set(stats.map((s) => s.characteristicId));
    return buildPaletteGroups({ characteristicIds: CHARACTERISTICS_WITH_RUNES, presentIds, densityOf, heavyIds, query, nameOf: getCharacteristicName });
  }, [stats, densityOf, heavyIds, query]);

  const tileDisabled = (t: PaletteTile) => {
    if (disabled) return true;
    if (mode === 'adjust') return t.onItem;
    const line = stats.find((s) => s.characteristicId === t.characteristicId);
    return !!line && (!line.isForgemeable || line.isLocked);
  };

  const fmTile = (label: string, active: boolean, isDisabled: boolean, onClick?: () => void, badge?: ReactNode) => (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-pressed={active}
      className={`btn-well flex items-center justify-between gap-2 px-2.5 py-2 text-[13px] ${active ? 'ring-1 ring-molten-text/60' : ''}`}
    >
      <span>{label}</span>
      {badge}
    </button>
  );

  return (
    <section className="surface-iron p-3 sm:p-4 flex flex-col gap-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]" aria-labelledby="palette-title">
      <div className="flex items-center gap-2">
        <h2 id="palette-title" className="text-[16px] text-ash">Runes</h2>
        <button type="button" className="lg:hidden ml-auto btn-well px-2 py-1 text-xs" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed}>
          {collapsed ? 'Afficher' : 'Replier'}
        </button>
      </div>

      <div className={`${collapsed ? 'hidden lg:flex' : 'flex'} flex-col gap-3 min-h-0`}>
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer… ( / )"
          aria-label="Filtrer les runes"
          className="well rounded-control px-3 py-1.5 text-sm text-ash"
        />

        <div className="overflow-y-auto min-h-0 pr-1 flex flex-col gap-3">
          {groups.map((g) => (
            <div key={g.key}>
              <h3 className="text-[11px] uppercase tracking-wide text-ash-3 mb-1.5">{g.label}</h3>
              <div className="grid grid-cols-3 gap-1.5">
                {g.tiles.map((t) => {
                  const selected = t.characteristicId === selectedId && slotKind === 'rune';
                  return (
                    <button
                      key={t.characteristicId}
                      type="button"
                      aria-label={t.name}
                      aria-pressed={selected}
                      disabled={tileDisabled(t)}
                      onClick={() => onPickCharacteristic(t.characteristicId, t.onItem)}
                      title={`${t.name} · ${t.density} poids par point${t.onItem ? '' : ' · exo'}${t.heavy ? ' · exo lourd' : ''}`}
                      className={`relative grid justify-items-center gap-0.5 rounded-[10px] border px-1 py-1.5 text-[10.5px] leading-tight transition-colors disabled:opacity-40
                        ${selected ? 'border-molten-text bg-[rgb(255_194_92/0.08)]' : t.onItem ? 'border-iron-edge hover:border-ash-3' : 'border-exo/40 hover:border-exo'}`}
                    >
                      <RuneIcon characteristicId={t.characteristicId} img={getRepresentativeRuneImg(t.characteristicId)} size={30} />
                      <span className={`w-full line-clamp-2 break-words text-center leading-tight ${t.onItem ? 'text-ash-2' : 'text-exo'}`}>{t.name}</span>
                      {t.heavy && <span className="absolute top-0.5 right-1 text-[10px] text-exo" aria-hidden="true">✦</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {groups.length === 0 && <p className="text-xs text-ash-3">Aucune rune ne correspond.</p>}

          <div>
            <h3 className="text-[11px] uppercase tracking-wide text-ash-3 mb-1.5">Objets FM</h3>
            <div className="grid gap-1.5">
              {fmTile('Orbe régénérant', slotKind === 'orb', disabled || mode !== 'forge', () => onPickSlot('orb'))}
              {fmTile('Transcendance', slotKind === 'transcendence', disabled || mode !== 'forge' || !canTranscend, () => onPickSlot('transcendence'))}
              {fmTile('Potion', slotKind === 'potion', disabled || mode !== 'forge', () => onPickSlot('potion'), <StatusBadge status={potionStatus} />)}
            </div>
          </div>
          <p className="text-[11px] text-ash-3"><span className="text-exo">turquoise</span> : exo · <span className="text-exo">✦</span> exo lourd (liste du moteur, régime 1 %)</p>
        </div>
      </div>
    </section>
  );
}
