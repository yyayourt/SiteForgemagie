import { useId, useState } from 'react';
import { CHARACTERISTICS_WITH_RUNES, getCharacteristicName } from '../../data/dataset';
import { getDensity } from '../../data/params';
import { useParams } from '../../app/ParamsProvider';
import type { SimulatedStat } from '../../types';

interface Props {
  currentStats: SimulatedStat[];
  onAdd: (characteristicId: number) => void;
}

/** Ajout d'une ligne exotique : toute caractéristique dotée d'une rune et d'une densité. */
export function ExoPicker({ currentStats, onAdd }: Props) {
  const { overrides } = useParams();
  const [value, setValue] = useState('');
  const id = useId();
  const present = new Set(currentStats.map((s) => s.characteristicId));
  const options = CHARACTERISTICS_WITH_RUNES
    .filter((cid) => !present.has(cid) && getDensity(cid, overrides) !== undefined)
    .map((cid) => ({ cid, name: getCharacteristicName(cid), density: getDensity(cid, overrides)! }))
    .sort((a, b) => b.density - a.density || a.name.localeCompare(b.name));

  if (options.length === 0) return null;

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value) {
          onAdd(Number(value));
          setValue('');
        }
      }}
    >
      <label htmlFor={id} className="text-sm text-ash-2">Ajouter un exo</label>
      <select id={id} value={value} onChange={(e) => setValue(e.target.value)} className="well rounded-control px-3 py-1.5 text-sm text-ash min-w-[220px]">
        <option value="">Choisir une caractéristique…</option>
        {options.map((o) => (
          <option key={o.cid} value={o.cid}>{o.name} · {o.density} poids par point</option>
        ))}
      </select>
      <button type="submit" disabled={!value} className="btn-well px-3 py-1.5 text-sm text-exo border-exo/50">Ajouter à zéro</button>
      <span className="text-xs text-ash-3">La ligne apparaît à 0 : montez-la avec une rune, ou réglez-la ici pour planifier.</span>
    </form>
  );
}
