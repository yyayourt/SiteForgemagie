/**
 * Tableau de paramètres du Dossier : colonnes Règle · Valeur · Statut, plus une ligne repliable
 * (note, source, bornes, défaut, chemin) par paramètre. Repris de l'ancien ParamTable de
 * KnowledgePage.tsx, avec le statut toujours visible dans la ligne (jamais dans la partie repliée).
 */
import { useState } from 'react';
import { useParams } from '../../app/ParamsProvider';
import { readParam } from '../../data/params';
import type { ParamDescriptor } from '../../data/paramRegistry';
import { StatusBadge } from '../shell/Badges';
import { fmt } from './format';

function ParamRow({ d }: { d: ParamDescriptor }) {
  const { overrides } = useParams();
  const [open, setOpen] = useState(false);
  const v = readParam<unknown>(d.path, overrides);
  const changed = JSON.stringify(v) !== JSON.stringify(d.entry.value);

  return (
    <>
      <tr className="border-t border-iron-edge/60 align-top">
        <td className="px-3 py-2 text-ash">
          {d.subgroup && <span className="text-ash-3">{d.subgroup} · </span>}
          {d.label}
        </td>
        <td className="px-3 py-2 text-right tnum text-ash whitespace-pre-wrap break-words max-w-[220px]">
          {fmt(v)}
          {changed && <span className="block text-[10px] text-model">profil actif</span>}
        </td>
        <td className="px-3 py-2"><StatusBadge status={d.entry.status} /></td>
        <td className="px-3 py-2 text-right">
          <button
            type="button"
            aria-expanded={open}
            aria-label={`Détails : ${d.label}`}
            onClick={() => setOpen((o) => !o)}
            className="text-xs text-ash-3 underline hover:text-ash"
          >
            détails
          </button>
        </td>
      </tr>
      {open && (
        <tr className="border-t border-iron-edge/60 bg-well">
          <td colSpan={4} className="px-3 py-3 bg-well">
            <div className="grid gap-1.5 text-xs text-ash-2 break-words">
              {d.entry.note && (
                <p className="m-0 break-words"><span className="text-ash-3">Note : </span>{d.entry.note}</p>
              )}
              <p className="m-0 break-words"><span className="text-ash-3">Source : </span>{d.entry.source}</p>
              <p className="m-0 break-words"><span className="text-ash-3">Bornes : </span>{fmt(d.entry.bounds)}</p>
              <p className="m-0 break-words"><span className="text-ash-3">Défaut : </span>{fmt(d.entry.default)}</p>
              <p className="m-0 font-mono text-[11px] break-words">{d.path}</p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function ParamTable({ items }: { items: ParamDescriptor[] }) {
  if (items.length === 0) return null;
  return (
    // [contain:layout] : empêche le débordement horizontal interne (table large) de fuiter dans
    // scrollWidth des ancêtres (Chromium calcule sinon le scrollWidth du document en incluant le
    // contenu scrollable interne malgré overflow-x-auto, une fois niché dans plusieurs flex/grid).
    <div className="w-full min-w-0 overflow-x-auto rounded-control border border-iron-edge [contain:layout]">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr className="text-left text-ash-3 bg-well">
            <th className="px-3 py-2 font-medium">Règle</th>
            <th className="px-3 py-2 font-medium text-right">Valeur</th>
            <th className="px-3 py-2 font-medium">Statut</th>
            <th className="px-3 py-2 font-medium text-right sr-only">Détails</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <ParamRow key={d.path} d={d} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
