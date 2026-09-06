import { useMemo, useState } from 'react';
import type { AtelierApi } from '../../hooks/useAtelier';
import type { RuneTier, RuneOutcome } from '../../types';
import { FM_ORBS, FM_POTIONS } from '../../data/dataset';
import { getParamEntry } from '../../data/params';
import { ModelBadge, StatusBadge } from '../shell/Badges';
import { RuneGlyph } from './RuneGlyph';
import { getStatCategory } from '../../data/statCaps';

type Tab = 'rune' | 'transcendence' | 'orb' | 'potion';

const TABS: { id: Tab; label: string }[] = [
  { id: 'rune', label: 'Rune' },
  { id: 'transcendence', label: 'Transcendance' },
  { id: 'orb', label: 'Orbe' },
  { id: 'potion', label: 'Potion' },
];

const OUTCOMES: { outcome: RuneOutcome; cls: string; title: string }[] = [
  { outcome: 'SC', cls: 'text-sc hover:border-sc', title: 'Forcer un succès critique : la rune passe sans perte' },
  { outcome: 'SN', cls: 'text-sn hover:border-sn', title: 'Forcer un succès neutre : la rune passe, perte = poids de la rune, reliquat consommé d\'abord' },
  { outcome: 'EC', cls: 'text-ec hover:border-ec', title: 'Forcer un échec critique : la rune ne passe pas, perte selon ecLossFactor' },
];

const pct = (x: number) => `${Math.round(x * 100)} %`;

/** Le panneau « Frapper » : choix de l'action, prévision du modèle, Tenter / Forcer. */
export function ActionPanel({ atelier }: { atelier: AtelierApi }) {
  const [tab, setTab] = useState<Tab>('rune');
  const [chosenTier, setTier] = useState<RuneTier>('normal');
  const { selected, item, itemLocked, mode } = atelier;
  const options = useMemo(() => (selected ? atelier.runeOptions(selected.characteristicId) : []), [selected, atelier]);
  // Palier effectif : le palier choisi s'il existe pour cette ligne, sinon le premier disponible
  const tier = options.some((o) => o.tier === chosenTier) ? chosenTier : (options[0]?.tier ?? 'normal');

  const estimate = selected ? atelier.estimate(selected.characteristicId, tier) : null;
  const disabled = !item || itemLocked || mode !== 'forge';
  const lockNote = getParamEntry<boolean>('params.transcendence.refuseIfOver');
  const rollLaw = getParamEntry<string>('params.craft.rollDistribution');

  return (
    <section className="surface-iron p-4 sm:p-5 flex flex-col gap-3" aria-labelledby="action-title">
      <h2 id="action-title" className="text-[17px] text-ash">Frapper</h2>

      <div className="well rounded-control p-0.5 grid grid-cols-2 gap-0.5" role="tablist" aria-label="Type d'action">
        {TABS.map((t) => (
          <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`px-1 py-1.5 rounded-[8px] text-[12.5px] ${tab === t.id ? 'bg-iron-2 text-ash shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]' : 'text-ash-2 hover:text-ash'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {!item && <p className="text-sm text-ash-3">Posez un objet sur l'enclume pour frapper.</p>}
      {item && itemLocked && <p className="text-sm text-locked">Objet transcendé : plus aucune forgemagie ni orbe possible (devblog 2.58).</p>}
      {item && !itemLocked && mode !== 'forge' && <p className="text-sm text-ash-3">Repassez en mode « Forger » pour frapper : en mode « Ajuster », vous planifiez à la main.</p>}

      {/* ── Rune ── */}
      {tab === 'rune' && item && !disabled && (
        <>
          {!selected && <p className="text-sm text-ash-3">Cliquez une ligne de l'objet pour la viser.</p>}
          {selected && (
            <>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Palier de rune">
                {options.map((o) => (
                  <button
                    key={o.tier}
                    type="button"
                    onClick={() => setTier(o.tier)}
                    aria-pressed={tier === o.tier}
                    className="btn-well grid justify-items-center gap-1 px-2 py-3 text-center"
                    title={`Rune ${o.label || 'simple'} : +${o.value} ${selected.statName}, poids ${o.weight.toFixed(1)}`}
                  >
                    <span className="text-molten-text"><RuneGlyph category={getStatCategory(selected.characteristicId)} size={20} /></span>
                    <b className="font-display text-lg tnum">+{o.value}</b>
                    <small className="text-[11px] text-ash-3 tnum">{o.label ? `${o.label} · ` : ''}{o.weight.toFixed(1)} poids</small>
                  </button>
                ))}
                {options.length === 0 && <p className="col-span-3 text-sm text-ash-3">Aucune rune de forgemagie n'existe pour {selected.statName}.</p>}
              </div>

              <div className="flex justify-between text-[13px] text-ash-2">
                <span>Sur la ligne</span>
                <b className="text-ash tnum">{selected.statName}, {selected.currentValue}</b>
              </div>

              {estimate && (
                <div className="well rounded-control p-3 border-dashed">
                  <ModelBadge model={estimate.model} heavyExo={estimate.isHeavyExo} />
                  <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-center tnum">
                    <div><b className="block font-display text-[22px] text-sc">{pct(estimate.pSC)}</b><small className="text-[11px] text-ash-3">succès critique</small></div>
                    <div><b className="block font-display text-[22px] text-sn">{pct(estimate.pSN)}</b><small className="text-[11px] text-ash-3">succès neutre</small></div>
                    <div><b className="block font-display text-[22px] text-ec">{pct(estimate.pEC)}</b><small className="text-[11px] text-ash-3">échec critique</small></div>
                  </div>
                  <p className={`m-0 mt-2 text-[11px] leading-snug tnum ${estimate.overCapUsage > 1 ? 'text-ec' : estimate.overCapUsage >= 0.85 ? 'text-molten-text' : 'text-ash-3'}`}>
                    {estimate.overCapUsage > 1
                      ? `Dépasserait la borne over/exo (${Math.round(estimate.overCapUsage * 100)} %) : le moteur refusera la rune.`
                      : `Borne over/exo après la rune : ${Math.round(estimate.overCapUsage * 100)} %${atelier.probabilityParams.officialFactorsLinear.d !== 0 && atelier.probabilityParams.model === 'official_factors_linear' ? ` (pente d = ${atelier.probabilityParams.officialFactorsLinear.d})` : ''}.`}
                  </p>
                  <p className="m-0 mt-1.5 text-[11px] text-ash-3 leading-snug">
                    Estimation d'un modèle paramétré, pas la formule du serveur. Seuls le plancher de quinze pour cent en forgemagie normale et celui d'un pour cent en exo PA/PM/PO sont officiels.
                  </p>
                </div>
              )}

              <button type="button" className="btn-cta w-full py-3.5 text-[19px]" disabled={options.length === 0} onClick={() => atelier.attemptRune(selected.characteristicId, tier)} title="Tirer l'issue avec le modèle actif, puis l'appliquer au moteur">
                Tenter la rune
              </button>
              <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-1.5 items-center text-xs text-ash-3">
                <span title="Mode étude : imposer l'issue pour observer l'effet exact du moteur">Forcer</span>
                {OUTCOMES.map((o) => (
                  <button key={o.outcome} type="button" onClick={() => atelier.forceRune(selected.characteristicId, tier, o.outcome)} disabled={options.length === 0} className={`btn-well py-1.5 font-semibold text-[13px] tnum ${o.cls}`} title={o.title}>
                    {o.outcome}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Transcendance ── */}
      {tab === 'transcendence' && item && !disabled && (
        <>
          <p className="text-[13px] text-ash-2 leading-snug">
            Une rune de transcendance se pose sans perte, puis verrouille l'objet : plus aucune forgemagie ni orbe. <StatusBadge status="SOURCE PRIMAIRE" /> devblog 2.58.
            Le refus si un over ou un exo est déjà présent est une <StatusBadge status={lockNote?.status ?? 'HYPOTHÈSE COMMUNAUTAIRE'} />.
          </p>
          {!selected && <p className="text-sm text-ash-3">Cliquez une ligne de l'objet pour la viser.</p>}
          {selected && (
            <div className="grid gap-2">
              {atelier.transcendenceOptions(selected.characteristicId).map((r) => (
                <button key={r.runeId} type="button" onClick={() => atelier.applyTranscendence(selected.characteristicId, r.runeId)} className="btn-cta flex items-center justify-between px-4 py-3 text-[16px]" title={`${r.nameFr}, niveau ${r.level}`}>
                  <span>{r.nameFr.replace(/^Rune /, '')}</span>
                  <span className="tnum">+{r.value} {selected.statName}</span>
                </button>
              ))}
              {atelier.transcendenceOptions(selected.characteristicId).length === 0 && (
                <p className="text-sm text-ash-3">Aucune rune de transcendance n'existe pour {selected.statName} dans le dataset.</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Orbe ── */}
      {tab === 'orb' && item && !disabled && (
        <>
          <p className="text-[13px] text-ash-2 leading-snug">
            L'orbe régénérant remet l'objet à un jet de craft aléatoire, retire les exos et vide le reliquat. <StatusBadge status="HYPOTHÈSE COMMUNAUTAIRE" /> La loi du jet est un paramètre <StatusBadge status={rollLaw?.status ?? 'INCONNU'} /> (« {atelier.craftParams.rollDistribution} », section « Jet de craft » des paramètres), le même que pour le bouton « Jet aléatoire » de l'enclume. Le refus sur un objet transcendé est <StatusBadge status="SOURCE PRIMAIRE" />.
          </p>
          <ul className="m-0 p-0 list-none text-xs text-ash-3 grid grid-cols-2 gap-x-3 gap-y-0.5">
            {FM_ORBS.filter((o) => !o.nameFr.includes('(lié)')).map((o) => <li key={o.id}>{o.nameFr} · niv. {o.level}</li>)}
          </ul>
          <button type="button" className="btn-cta w-full py-3.5 text-[18px]" onClick={() => atelier.applyOrb()}>Réinitialiser avec un orbe</button>
        </>
      )}

      {/* ── Potion ── */}
      {tab === 'potion' && item && !disabled && (
        <>
          <p className="text-[13px] text-ash-2 leading-snug">
            Les potions changent l'élément des dommages neutres d'une arme en conservant une part des dégâts. Cette part est une <StatusBadge status="CONTRADICTION" /> non tranchée entre les sources, et l'API ne la fournit pas : le module n'est pas modélisé tant qu'elle n'est pas établie.
          </p>
          <ul className="m-0 p-0 list-none text-xs text-ash-3 grid grid-cols-2 gap-x-3 gap-y-0.5">
            {FM_POTIONS.map((p) => <li key={p.id}>{p.nameFr} · niv. {p.level}</li>)}
          </ul>
          <button type="button" className="btn-cta w-full py-3.5 text-[18px]" disabled title="Non modélisé : taux de conservation en CONTRADICTION">Appliquer une potion</button>
        </>
      )}
    </section>
  );
}
