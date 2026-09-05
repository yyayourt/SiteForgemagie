import { useMemo, useState } from 'react';
import type { AtelierApi } from '../hooks/useAtelier';
import type { RuneTier } from '../types';
import type { MonteCarloResult } from '../logic/probability/monteCarlo';
import { PROBABILITY_MODEL_NAMES } from '../logic/probability';
import type { ProbabilityModelName } from '../data/params';
import { getCharacteristicName } from '../data/dataset';
import { ModelBadge, StatusBadge } from '../components/shell/Badges';

const RUN_OPTIONS = [100, 1000, 5000, 20000];
const pct = (x: number) => `${(x * 100).toFixed(1)} %`;

/**
 * Monte Carlo : N passages d'une même rune sur l'état courant, pour comparer les modèles
 * entre eux (et, plus tard, avec des observations réelles). Graine affichée et éditable.
 */
export function MonteCarloPage({ atelier }: { atelier: AtelierApi }) {
  const { item, stats, selected, probabilityParams } = atelier;
  const [targetId, setTargetId] = useState<number | null>(selected?.characteristicId ?? null);
  const [tier, setTier] = useState<RuneTier>('normal');
  const [runs, setRuns] = useState(5000);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [model, setModel] = useState<ProbabilityModelName>(probabilityParams.model);
  const [result, setResult] = useState<MonteCarloResult | null>(null);

  const targets = stats.filter((s) => s.isForgemeable && !s.isLocked);
  const effectiveTarget = targetId ?? targets[0]?.characteristicId ?? null;
  const options = effectiveTarget !== null ? atelier.runeOptions(effectiveTarget) : [];
  const effectiveTier = options.some((o) => o.tier === tier) ? tier : (options[0]?.tier ?? 'normal');

  const finalStates = useMemo(() => {
    if (!result) return [];
    return [...result.finalStates.values()].sort((a, b) => b.count - a.count).slice(0, 12);
  }, [result]);

  function describeState(s: MonteCarloResult['finalStates'] extends Map<string, infer B> ? B : never): string {
    const parts: string[] = [];
    for (const line of s.state.lines) {
      const before = stats.find((x) => x.characteristicId === line.characteristicId);
      if (!before) { parts.push(`${getCharacteristicName(line.characteristicId)} ${line.value} (nouvelle)`); continue; }
      if (before.currentValue !== line.value) parts.push(`${before.statName} ${before.currentValue} → ${line.value}`);
    }
    if (Math.abs(s.state.residualPool - atelier.residualPool) > 1e-9) parts.push(`reliquat ${atelier.residualPool.toFixed(1)} → ${s.state.residualPool.toFixed(1)}`);
    return parts.length ? parts.join(' · ') : 'inchangé';
  }

  function run() {
    if (effectiveTarget === null) return;
    setResult(atelier.runMonteCarlo(effectiveTarget, effectiveTier, runs, seed, model));
  }

  if (!item) {
    return (
      <div className="px-4 sm:px-7 py-10 max-w-[900px] mx-auto text-center">
        <h1 className="text-2xl text-ash soft">Monte Carlo</h1>
        <p className="text-ash-2 mt-2">Posez d'abord un objet sur l'enclume : la simulation part de son état courant.</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-7 py-6 max-w-[1200px] mx-auto grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <section className="surface-iron p-5 flex flex-col gap-3" aria-labelledby="mc-title">
        <h1 id="mc-title" className="text-[22px] text-ash soft">Monte Carlo</h1>
        <p className="text-[13px] text-ash-2 leading-snug m-0">
          Rejoue la même frappe sur l'état courant de <b className="text-ash">{item.name}</b> et compte les issues et les états d'arrivée. Sert à comparer les modèles entre eux, pas à prédire le serveur.
        </p>

        <label className="grid gap-1 text-sm">
          <span className="text-ash-2">Ligne visée</span>
          <select value={effectiveTarget ?? ''} onChange={(e) => setTargetId(Number(e.target.value))} className="well rounded-control px-3 py-2 text-ash">
            {targets.map((s) => <option key={s.characteristicId} value={s.characteristicId}>{s.statName} ({s.currentValue})</option>)}
          </select>
        </label>

        <div className="grid gap-1 text-sm">
          <span className="text-ash-2">Rune</span>
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Palier de rune">
            {options.map((o) => (
              <button key={o.tier} type="button" aria-pressed={effectiveTier === o.tier} onClick={() => setTier(o.tier)} className="btn-well py-2 tnum">
                +{o.value}{o.label ? <span className="text-ash-3 ml-1 text-xs">{o.label}</span> : null}
              </button>
            ))}
          </div>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="text-ash-2">Modèle probabiliste <StatusBadge status="INCONNU" /></span>
          <select value={model} onChange={(e) => setModel(e.target.value as ProbabilityModelName)} className="well rounded-control px-3 py-2 text-ash">
            {PROBABILITY_MODEL_NAMES.map((m) => <option key={m} value={m}>{m}{m === probabilityParams.model ? ' (actif)' : ''}</option>)}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-sm">
            <span className="text-ash-2">Tentatives</span>
            <select value={runs} onChange={(e) => setRuns(Number(e.target.value))} className="well rounded-control px-3 py-2 text-ash tnum">
              {RUN_OPTIONS.map((n) => <option key={n} value={n}>{n.toLocaleString('fr-FR')}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-ash-2">Graine</span>
            <div className="flex gap-1">
              <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value) || 0)} className="well rounded-control px-3 py-2 text-ash tnum w-full min-w-0" />
              <button type="button" onClick={() => setSeed(Math.floor(Math.random() * 1e9))} className="btn-well px-2.5" title="Nouvelle graine aléatoire" aria-label="Nouvelle graine aléatoire">↻</button>
            </div>
          </label>
        </div>

        <button type="button" className="btn-cta w-full py-3.5 text-[18px]" onClick={run} disabled={effectiveTarget === null || options.length === 0}>
          Lancer {runs.toLocaleString('fr-FR')} frappes
        </button>
        <p className="text-xs text-ash-3 m-0">Même graine, même état, même profil : même distribution, à la frappe près.</p>
      </section>

      <section className="grid gap-4 content-start" aria-live="polite">
        {!result && (
          <div className="surface-iron p-8 text-center text-ash-3">
            <p className="m-0">Aucune simulation lancée. Choisissez une ligne, une rune et une graine, puis lancez.</p>
          </div>
        )}
        {result && (
          <>
            <div className="surface-iron p-5">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h2 className="text-[17px] text-ash m-0">Issues sur {result.runs.toLocaleString('fr-FR')} frappes</h2>
                <ModelBadge model={result.model} />
                <span className="text-xs text-ash-3 tnum">graine {seed}</span>
                {result.refused > 0 && <span className="text-xs text-ec">{result.refused} refusée(s) par le moteur</span>}
              </div>
              <div className="grid gap-2">
                {(['SC', 'SN', 'EC'] as const).map((o) => {
                  const f = result.frequencies[o];
                  const p = o === 'SC' ? result.probabilities.pSC : o === 'SN' ? result.probabilities.pSN : result.probabilities.pEC;
                  const cls = o === 'SC' ? 'bg-sc' : o === 'SN' ? 'bg-sn' : 'bg-ec';
                  const tcls = o === 'SC' ? 'text-sc' : o === 'SN' ? 'text-sn' : 'text-ec';
                  return (
                    <div key={o} className="grid grid-cols-[36px_1fr_auto] gap-3 items-center text-sm tnum">
                      <b className={`font-display ${tcls}`}>{o}</b>
                      <div className="roll-track h-3 rounded-full overflow-hidden relative">
                        <div className={`h-full ${cls} rounded-full transition-[width] duration-500`} style={{ width: `${f * 100}%` }} />
                        <span className="absolute top-0 bottom-0 w-px bg-ash" style={{ left: `${p * 100}%` }} title={`probabilité du modèle : ${pct(p)}`} />
                      </div>
                      <span className="text-ash-2 w-[150px] text-right"><b className="text-ash">{pct(f)}</b> observé · {pct(p)} modèle</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="surface-iron p-5">
              <h2 className="text-[17px] text-ash m-0 mb-3">États d'arrivée les plus fréquents</h2>
              <ol className="m-0 p-0 list-none grid gap-1.5">
                {finalStates.map((s, i) => (
                  <li key={i} className="well rounded-control px-3 py-2 grid grid-cols-[64px_1fr] gap-3 items-center text-[13px]">
                    <b className="font-display text-ash tnum">{pct(s.count / result.runs)}</b>
                    <span className="text-ash-2">{describeState(s)}</span>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-ash-3 mt-3 m-0">{result.finalStates.size} état(s) distinct(s) au total.</p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
