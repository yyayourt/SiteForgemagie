import { useRef, useState } from 'react';
import type { ShowcaseApi } from '../hooks/useShowcase';
import type { ShowcaseEntry } from '../state/showcase';
import type { SimulatedStat } from '../types';
import { formatKamas } from '../state/sessionCost';

interface Props {
  showcase: ShowcaseApi;
  onResume: (entry: ShowcaseEntry) => void;
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

function lineTone(s: SimulatedStat): { cls: string; tag: string | null } {
  if (s.isExo) return { cls: 'text-exo', tag: 'exo' };
  if (s.currentValue > s.baseMax) return { cls: 'text-over', tag: 'over' };
  if (s.currentValue <= 0 && s.baseMax > 0) return { cls: 'text-zero', tag: 'éteinte' };
  return { cls: 'text-ash', tag: null };
}

/**
 * La vitrine : objets figés depuis l'atelier. Reprendre recharge l'objet, ses lignes,
 * son reliquat, sa consommation et son journal tels qu'ils étaient. Stockage local.
 */
export function VitrinePage({ showcase, onResume }: Props) {
  const [message, setMessage] = useState<string[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { entries } = showcase;

  function exportFile() {
    const blob = new Blob([showcase.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vitrine-${new Date().toISOString().slice(0, 10)}.forge-showcase.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(file: File) {
    const r = showcase.importJson(await file.text());
    setMessage(
      r.ok
        ? [`${r.added} objet${r.added > 1 ? 's' : ''} ajouté${r.added > 1 ? 's' : ''}${r.skipped > 0 ? `, ${r.skipped} déjà présent${r.skipped > 1 ? 's' : ''} (ignoré${r.skipped > 1 ? 's' : ''})` : ''}.`, ...r.errors]
        : ['Import refusé.', ...r.errors]
    );
  }

  return (
    <div className="px-4 sm:px-7 py-6 max-w-[1480px] mx-auto">
      <header className="flex flex-wrap items-end gap-x-5 gap-y-3 mb-5">
        <div>
          <h1 className="text-[28px] sm:text-[32px] leading-tight text-ash soft">Vitrine</h1>
          <p className="text-sm text-ash-2 mt-1 max-w-2xl">
            Les objets figés depuis l'atelier, avec leurs lignes finales, leur reliquat, les runes consommées et leur coût. « Reprendre » les remet sur l'enclume exactement dans cet état. Tout reste sur cet appareil.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-xs text-ash-3 tnum">{entries.length} objet{entries.length > 1 ? 's' : ''}</span>
          <button type="button" onClick={exportFile} disabled={entries.length === 0} className="btn-well px-3 py-1.5 text-sm">Exporter en JSON</button>
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-well px-3 py-1.5 text-sm">Importer un JSON</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ''; }} />
        </div>
      </header>

      {message && (
        <ul className="m-0 mb-4 p-2.5 well rounded-control text-xs text-ash-2 list-disc pl-6" aria-live="polite">
          {message.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      )}

      {entries.length === 0 ? (
        <section className="slab p-7 sm:p-10 min-h-[320px] grid place-items-center text-center">
          <div className="max-w-md">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true" className="mx-auto text-ash-3 mb-4"><path d="M4 7h16v13H4zM8 7V4h8v3M4 12h16" /></svg>
            <h2 className="text-2xl text-ash soft">La vitrine est vide</h2>
            <p className="text-ash-2 mt-2">Dans l'atelier, « Sauvegarder dans la vitrine » fige l'objet posé sur l'enclume. Vous pouvez aussi importer un fichier exporté d'un autre appareil.</p>
          </div>
        </section>
      ) : (
        <ul className="m-0 p-0 list-none grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map((e) => (
            <ShowcaseCard
              key={e.id}
              entry={e}
              pendingDelete={pendingDelete === e.id}
              onResume={() => onResume(e)}
              onDuplicate={() => showcase.duplicate(e.id)}
              onDelete={() => { if (pendingDelete === e.id) { showcase.remove(e.id); setPendingDelete(null); } else setPendingDelete(e.id); }}
              onCancelDelete={() => setPendingDelete(null)}
              onNote={(note) => showcase.updateNote(e.id, note)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface CardProps {
  entry: ShowcaseEntry;
  pendingDelete: boolean;
  onResume: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
  onNote: (note: string) => void;
}

function ShowcaseCard({ entry, pendingDelete, onResume, onDuplicate, onDelete, onCancelDelete, onNote }: CardProps) {
  const consumed = Object.values(entry.consumed).filter((c) => c.count > 0);
  const consumedCount = consumed.reduce((n, c) => n + c.count, 0);
  const applied = entry.log.filter((l) => !l.refusedReason);
  const date = (() => {
    const d = new Date(entry.savedAt);
    return Number.isNaN(d.getTime()) ? entry.savedAt : dateFormat.format(d);
  })();

  return (
    <li className="surface-iron p-4 flex flex-col gap-3">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-well border border-iron-edge grid place-items-center overflow-hidden shrink-0">
          {entry.item.imgUrl ? <img src={entry.item.imgUrl} alt="" width={40} height={40} className="w-10 h-10" loading="lazy" /> : null}
        </div>
        <div className="min-w-0">
          <h2 className="text-[18px] leading-tight text-ash soft truncate">{entry.item.name}</h2>
          <p className="text-xs text-ash-3 mt-0.5">
            {entry.item.typeName} · niveau {entry.item.level} · <time dateTime={entry.savedAt}>{date}</time>
            {entry.itemLocked ? ' · transcendé' : ''}
          </p>
        </div>
      </header>

      <ul className="m-0 p-0 list-none grid gap-0.5 text-[13px]">
        {entry.stats.map((s) => {
          const tone = lineTone(s);
          return (
            <li key={s.characteristicId} className="flex items-baseline gap-2">
              <span className={`tnum font-semibold w-14 text-right ${tone.cls}`}>{s.currentValue > 0 && s.isExo ? '+' : ''}{s.currentValue}</span>
              <span className="text-ash-2 truncate">{s.statName}</span>
              {tone.tag && <span className={`text-[10px] px-1.5 rounded-full border border-current ${tone.cls}`}>{tone.tag}</span>}
              {!s.isExo && s.baseMax > s.baseMin && <span className="ml-auto text-[11px] text-ash-3 tnum">{s.baseMin}–{s.baseMax}</span>}
            </li>
          );
        })}
      </ul>

      <dl className="m-0 grid grid-cols-3 gap-2 text-center well rounded-control p-2">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-ash-3">Reliquat</dt>
          <dd className="m-0 font-display text-lg tnum text-molten-text">{entry.residualPool.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-ash-3">Consommés</dt>
          <dd className="m-0 font-display text-lg tnum text-ash">{consumedCount}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-ash-3">Coût</dt>
          <dd className="m-0 font-display text-lg tnum text-ash">
            {entry.cost ? formatKamas(entry.cost.total) : '—'}
            {entry.cost && !entry.cost.complete && <span className="block text-[10px] font-text text-model leading-none">prix incomplets</span>}
          </dd>
        </div>
      </dl>

      {consumed.length > 0 && (
        <details className="text-xs">
          <summary className="text-ash-3 hover:text-ash-2 cursor-pointer">Runes et orbes consommés ({consumed.length} type{consumed.length > 1 ? 's' : ''})</summary>
          <ul className="m-0 mt-1.5 p-0 list-none grid gap-0.5">
            {consumed.map((c) => (
              <li key={c.key} className="flex justify-between gap-2 text-ash-2"><span className="truncate">{c.label}</span><b className="tnum text-ash">×{c.count}</b></li>
            ))}
          </ul>
        </details>
      )}

      {entry.log.length > 0 && (
        <details className="text-xs">
          <summary className="text-ash-3 hover:text-ash-2 cursor-pointer">Historique ({applied.length} frappe{applied.length > 1 ? 's' : ''}{entry.log.length !== applied.length ? `, ${entry.log.length - applied.length} refusée${entry.log.length - applied.length > 1 ? 's' : ''}` : ''})</summary>
          <ol className="m-0 mt-1.5 p-0 list-none grid gap-0.5 max-h-40 overflow-y-auto pr-1">
            {entry.log.map((l) => (
              <li key={l.id} className={`flex gap-2 items-baseline ${l.refusedReason ? 'opacity-60' : ''}`}>
                <b className={`w-6 shrink-0 tnum ${l.refusedReason ? 'text-ash-3' : l.outcome === 'SC' ? 'text-sc' : l.outcome === 'SN' ? 'text-sn' : 'text-ec'}`}>{l.refusedReason ? '×' : l.kind === 'orb' ? '◌' : l.outcome}</b>
                <span className="text-ash-2 truncate">{l.actionLabel}</span>
                <span className="ml-auto text-ash-3 tnum shrink-0">reliquat {l.residualPoolAfter.toFixed(1)}</span>
              </li>
            ))}
          </ol>
        </details>
      )}

      <label className="grid gap-1 text-xs text-ash-3">
        <span>Note</span>
        <textarea
          value={entry.note}
          onChange={(ev) => onNote(ev.target.value)}
          rows={2}
          placeholder="Pour qui, pourquoi, ce qu'il reste à faire…"
          className="well rounded-control px-2.5 py-1.5 text-[13px] text-ash placeholder:text-ash-3 resize-y"
        />
      </label>

      <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-1">
        <button type="button" onClick={onResume} className="btn-cta px-4 py-2 text-[15px]" title="Remettre cet objet sur l'enclume, avec ses lignes, son reliquat, sa consommation et son journal">Reprendre</button>
        <button type="button" onClick={onDuplicate} className="btn-well px-3 py-2 text-sm">Dupliquer</button>
        {pendingDelete ? (
          <span className="ml-auto inline-flex items-center gap-1.5">
            <button type="button" onClick={onDelete} className="btn-well px-3 py-2 text-sm text-ec border-ec/60" autoFocus>Confirmer la suppression</button>
            <button type="button" onClick={onCancelDelete} className="btn-well px-2.5 py-2 text-sm">Garder</button>
          </span>
        ) : (
          <button type="button" onClick={onDelete} className="btn-well px-3 py-2 text-sm ml-auto" title="Retirer de la vitrine (demande confirmation)">Supprimer</button>
        )}
      </div>
    </li>
  );
}
