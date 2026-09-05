import { useEffect, useId, useRef, useState } from 'react';
import { useParams } from '../app/ParamsProvider';
import { readParam, PARAMS_META } from '../data/params';
import { PARAM_REGISTRY, SECTION_LABELS, SECTION_ORDER, isDefaultValue, type ParamDescriptor } from '../data/paramRegistry';
import { StatusBadge } from '../components/shell/Badges';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Panneau latéral « Paramètres avancés » : chaque entrée de empirical_params.json, éditable. */
export function ParamsDrawer({ open, onClose }: Props) {
  const params = useParams();
  const [message, setMessage] = useState<string[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function exportProfile() {
    const json = params.exportProfile();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(params.profile.name || 'profil').replace(/[^\w-]+/g, '_')}.forge-profile.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(file: File) {
    const text = await file.text();
    const r = params.importProfile(text);
    setMessage(r.ok ? [`Profil chargé : ${r.applied} paramètre(s) modifié(s).`, ...r.errors] : r.errors);
  }

  const sections = SECTION_ORDER.map((s) => ({ id: s, label: SECTION_LABELS[s] ?? s, items: PARAM_REGISTRY.filter((d) => d.section === s) })).filter((s) => s.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button type="button" className="absolute inset-0 bg-pitch/60" aria-label="Fermer les paramètres" onClick={onClose} />
      <div
        id="params-drawer"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="params-title"
        tabIndex={-1}
        className="drawer drawer-enter relative w-full max-w-[560px] h-full overflow-y-auto bg-iron border-l border-iron-edge outline-none"
      >
        <div className="sticky top-0 z-10 bg-iron border-b border-iron-edge px-5 py-4">
          <div className="flex items-center gap-3">
            <h2 id="params-title" className="text-[20px] text-ash m-0">Paramètres avancés</h2>
            <span className="text-xs text-ash-3">empirical_params.json · jeu {PARAMS_META.gameVersion}</span>
            <button type="button" onClick={onClose} className="btn-well ml-auto w-8 h-8 text-lg leading-none" aria-label="Fermer">×</button>
          </div>
          <p className="text-xs text-ash-2 m-0 mt-1.5 leading-snug">
            Tout ce qui n'est pas source primaire vit ici. Modifiez, comparez, partagez un profil : rien n'est réécrit dans le fichier.
          </p>

          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <label className="grid gap-0.5">
              <span className="text-xs text-ash-3">Nom du profil</span>
              <input value={params.profile.name} onChange={(e) => params.setProfileMeta({ name: e.target.value })} className="well rounded-control px-2.5 py-1.5 text-ash" />
            </label>
            <label className="grid gap-0.5">
              <span className="text-xs text-ash-3">Auteur</span>
              <input value={params.profile.author} onChange={(e) => params.setProfileMeta({ author: e.target.value })} className="well rounded-control px-2.5 py-1.5 text-ash" placeholder="pseudo" />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <button type="button" onClick={exportProfile} className="btn-well px-3 py-1.5 text-sm">Exporter le profil</button>
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-well px-3 py-1.5 text-sm">Importer un profil</button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ''; }} />
            <button type="button" onClick={() => { params.resetAll(); setMessage(['Tous les paramètres sont revenus aux valeurs du fichier.']); }} disabled={params.overrideCount === 0} className="btn-well px-3 py-1.5 text-sm ml-auto">
              Tout remettre par défaut{params.overrideCount > 0 ? ` (${params.overrideCount})` : ''}
            </button>
          </div>
          {message && (
            <ul className="m-0 mt-2 p-2.5 well rounded-control text-xs text-ash-2 list-disc pl-6" aria-live="polite">
              {message.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          )}
        </div>

        <div className="px-5 py-4 grid gap-6">
          {sections.map((s) => (
            <section key={s.id} aria-labelledby={`sec-${s.id}`}>
              <h3 id={`sec-${s.id}`} className="text-[16px] text-molten-text m-0 mb-1">{s.label}</h3>
              {s.items[0]?.groupComment && <p className="text-xs text-ash-3 m-0 mb-2 leading-snug">{s.items[0].groupComment}</p>}
              <div className="grid gap-2">
                {s.items.map((d) => <ParamField key={d.path} d={d} />)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function ParamField({ d }: { d: ParamDescriptor }) {
  const { overrides, setOverride, resetOverride } = useParams();
  const value = readParam<unknown>(d.path, overrides);
  const changed = !isDefaultValue(d, value);
  const serialized = JSON.stringify(value, null, 1);
  const [draft, setDraft] = useState<string>(serialized);
  const [seen, setSeen] = useState<string>(serialized);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  // Valeur changée ailleurs (défaut, import de profil) : resynchroniser le brouillon au rendu
  if (serialized !== seen) {
    setSeen(serialized);
    setDraft(serialized);
  }

  function apply(v: unknown) {
    const r = setOverride(d.path, v);
    setError(r.ok ? null : (r.reason ?? 'valeur refusée'));
  }

  const subgroup = d.subgroup ? `${d.subgroup} · ` : '';

  return (
    <div className={`well rounded-control p-3 ${changed ? 'border-model' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={id} className="text-sm text-ash font-medium">
          <span className="text-ash-3 font-normal">{subgroup}</span>{d.label}
        </label>
        <StatusBadge status={d.entry.status} />
        {changed && <span className="text-[11px] text-model">modifié</span>}
        <div className="ml-auto flex items-center gap-1.5">
          {d.kind === 'number' && (
            <input id={id} type="number" step="any" min={d.min} max={d.max} value={value as number} onChange={(e) => apply(Number(e.target.value))} className="well rounded-control px-2 py-1 w-28 text-right tnum text-ash" />
          )}
          {d.kind === 'boolean' && (
            <label className="inline-flex items-center gap-2 text-sm text-ash-2">
              <input id={id} type="checkbox" checked={value as boolean} onChange={(e) => apply(e.target.checked)} className="accent-[var(--color-cta)] w-4 h-4" />
              {(value as boolean) ? 'oui' : 'non'}
            </label>
          )}
          {d.kind === 'enum' && (
            <select id={id} value={String(value)} onChange={(e) => { const raw = e.target.value; apply(raw === 'true' ? true : raw === 'false' ? false : raw); }} className="well rounded-control px-2 py-1 text-sm text-ash">
              {d.options?.map((o) => <option key={String(o)} value={String(o)}>{String(o)}</option>)}
            </select>
          )}
          <button type="button" onClick={() => resetOverride(d.path)} disabled={!changed} className="btn-well px-2 py-1 text-xs" title={`Revenir à la valeur du fichier : ${JSON.stringify(d.entry.default)}`}>défaut</button>
        </div>
      </div>
      {d.kind === 'json' && (
        <div className="mt-2">
          <textarea id={id} value={draft} onChange={(e) => setDraft(e.target.value)} rows={Math.min(10, draft.split('\n').length)} className="well rounded-control w-full px-2 py-1.5 text-xs text-ash font-mono" spellCheck={false} />
          <div className="flex items-center gap-2 mt-1">
            <button type="button" className="btn-well px-2.5 py-1 text-xs" onClick={() => { try { apply(JSON.parse(draft)); } catch { setError('JSON invalide'); } }}>Appliquer</button>
            <span className="text-xs text-ash-3">bornes : {d.min ?? '—'} à {d.max ?? '—'}</span>
          </div>
        </div>
      )}
      {(d.kind === 'number') && (d.min !== undefined || d.max !== undefined) && (
        <span className="block text-[11px] text-ash-3 mt-1 tnum">bornes : {d.min ?? '—'} à {d.max ?? '—'} · défaut {String(d.entry.default)}</span>
      )}
      {error && <p className="m-0 mt-1 text-xs text-ec" role="alert">{error}</p>}
      <details className="mt-1.5">
        <summary className="text-xs text-ash-3 hover:text-ash-2">Source et note</summary>
        <p className="m-0 mt-1 text-xs text-ash-2 leading-snug"><b className="text-ash-3">Source.</b> {d.entry.source}</p>
        {d.entry.note && <p className="m-0 mt-1 text-xs text-ash-2 leading-snug"><b className="text-ash-3">Note.</b> {d.entry.note}</p>}
      </details>
    </div>
  );
}
