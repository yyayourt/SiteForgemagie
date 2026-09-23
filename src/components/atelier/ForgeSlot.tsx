import { Fragment, type ReactNode } from 'react';
import type { AtelierApi } from '../../hooks/useAtelier';
import type { RuneOutcome, RuneTier } from '../../types';
import { FM_ORBS, FM_POTIONS } from '../../data/dataset';
import { getParamEntry } from '../../data/params';
import { InfoTip, StatusBadge } from '../shell/Badges';
import { OutcomeEstimate } from './OutcomeEstimate';
import { RuneIcon } from './RuneIcon';
import type { SlotKind } from './forgeSelection';

interface Props {
  atelier: AtelierApi;
  slotKind: SlotKind;
  tier: RuneTier;
  onFuse: () => void;
  showHelp: boolean;
  onToggleHelp: () => void;
}

const OUTCOMES: { outcome: RuneOutcome; cls: string; title: string }[] = [
  { outcome: 'SC', cls: 'text-sc hover:border-sc', title: 'Forcer un succès critique : la rune passe sans perte' },
  { outcome: 'SN', cls: 'text-sn hover:border-sn', title: "Forcer un succès neutre : la rune passe, perte = poids de la rune, reliquat consommé d'abord, ligne visée candidate" },
  { outcome: 'EC', cls: 'text-ec hover:border-ec', title: 'Forcer un échec critique : la rune ne passe pas, perte égale au poids de la rune (observé en jeu)' },
];

const SHORTCUTS: [string, string][] = [
  ['↑ ↓', 'changer de ligne'],
  ['1 2 3', 'choisir le palier'],
  ['Espace', 'fusionner'],
  ['/', 'filtrer les runes'],
  ['Ctrl+Z / Ctrl+Y', 'annuler / rétablir'],
  ['?', 'afficher cette aide'],
];

/** Le slot de fusion, sous les lignes : rune posée, prévision, Fusionner, Forcer. */
export function ForgeSlot({ atelier, slotKind, tier, onFuse, showHelp, onToggleHelp }: Props) {
  const { selected, item, itemLocked, mode } = atelier;
  const lockNote = getParamEntry<boolean>('params.transcendence.refuseIfOver');
  const rollLaw = getParamEntry<string>('params.craft.rollDistribution');
  if (!item) return null;

  const options = selected ? atelier.runeOptions(selected.characteristicId) : [];
  const option = options.find((o) => o.tier === tier);
  const estimate = selected && option ? atelier.estimate(selected.characteristicId, tier) : null;

  let body: ReactNode;
  if (itemLocked) {
    body = <p className="text-sm text-locked">Objet transcendé : plus aucune forgemagie ni orbe possible (devblog 2.58).</p>;
  } else if (mode !== 'forge') {
    body = <p className="text-sm text-ash-3">Mode « Ajuster » : réglez les lignes à la main. Cliquez une rune absente de la palette pour ajouter un exo à 0. Repassez en « Forger » (menu ⋯) pour fusionner.</p>;
  } else if (slotKind === 'orb') {
    body = (
      <div className="grid gap-2">
        <div className="m-0 flex flex-wrap items-center gap-1.5 text-[13px] text-ash-2">
          Remet l'objet à un jet de craft aléatoire, retire les exos, vide le reliquat.
          <StatusBadge status="HYPOTHÈSE COMMUNAUTAIRE" />
          Loi du jet <StatusBadge status={rollLaw?.status ?? 'INCONNU'} /> ; refus sur objet transcendé <StatusBadge status="SOURCE PRIMAIRE" />.
          <InfoTip label="Loi du jet de l'orbe">
            <p className="m-0">La loi du jet est le paramètre « {atelier.craftParams.rollDistribution} » (section « Jet de craft » des paramètres), le même que pour « Jet aléatoire ».</p>
            <ul className="m-0 mt-2 p-0 list-none">{FM_ORBS.filter((o) => !o.nameFr.includes('(lié)')).map((o) => <li key={o.id}>{o.nameFr} · niv. {o.level}</li>)}</ul>
          </InfoTip>
        </div>
        <button type="button" className="btn-cta w-full py-3 text-[18px]" onClick={() => atelier.applyOrb()}>Réinitialiser avec un orbe</button>
      </div>
    );
  } else if (slotKind === 'transcendence') {
    const runes = selected ? atelier.transcendenceOptions(selected.characteristicId) : [];
    body = (
      <div className="grid gap-2">
        <div className="m-0 flex flex-wrap items-center gap-1.5 text-[13px] text-ash-2">
          Se pose sans perte puis verrouille l'objet. <StatusBadge status="SOURCE PRIMAIRE" />
          Refus si over ou exo présent : <StatusBadge status={lockNote?.status ?? 'HYPOTHÈSE COMMUNAUTAIRE'} />
          <InfoTip label="Règles de la transcendance">
            <p className="m-0">Devblog 2.58 : plus aucune forgemagie ni orbe après la pose.</p>
          </InfoTip>
        </div>
        {runes.map((r) => (
          <button key={r.runeId} type="button" onClick={() => selected && atelier.applyTranscendence(selected.characteristicId, r.runeId)} className="btn-cta flex items-center justify-between px-4 py-2.5 text-[15px]" title={`${r.nameFr}, niveau ${r.level}`}>
            <span>{r.nameFr.replace(/^Rune /, '')}</span>
            <span className="tnum">+{r.value} {selected?.statName}</span>
          </button>
        ))}
        {runes.length === 0 && <p className="text-sm text-ash-3">Aucune rune de transcendance pour cette ligne dans le dataset.</p>}
      </div>
    );
  } else if (slotKind === 'potion') {
    body = (
      <p className="m-0 text-[13px] text-ash-2">
        Potions non modélisées : la part de dégâts conservée est une <StatusBadge status="CONTRADICTION" /> entre les sources.{' '}
        {FM_POTIONS.length} potions au dataset.
      </p>
    );
  } else if (!selected) {
    body = <p className="text-sm text-ash-3">Cliquez une ligne ou une rune de la palette pour la viser.</p>;
  } else if (options.length === 0) {
    body = <p className="text-sm text-ash-3">Aucune rune de forgemagie n'existe pour {selected.statName}.</p>;
  } else {
    const applicable = estimate?.applicableValue ?? 0;
    body = (
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {option && <RuneIcon characteristicId={selected.characteristicId} img={option.img} size={30} title={option.nameFr} />}
            <span className="text-[14px] text-ash">{option?.nameFr}</span>
            <span className="text-xs text-ash-3 tnum">+{option?.value} · {option?.weight.toFixed(1)} poids</span>
          </div>
          {estimate && (
            <>
              <OutcomeEstimate estimate={estimate.estimate} model={estimate.model} isHeavyExo={estimate.isHeavyExo} heavyByWeight={estimate.heavyByWeight} characteristicId={selected.characteristicId} />
              <div className={`m-0 mt-1.5 flex items-center gap-1.5 text-[11px] tnum ${estimate.overCapUsage > 1 ? 'text-ec' : estimate.overCapUsage >= 0.85 ? 'text-molten-text' : 'text-ash-3'}`}>
                {applicable <= 0
                  ? 'Dépasserait la borne over/exo : la rune sera refusée.'
                  : option && applicable < option.value
                    ? `Tronquée à +${applicable} sur ${option.value} (${Math.round(estimate.overCapUsage * 100)} % de la borne).`
                    : `Borne over/exo après la rune : ${Math.round(estimate.overCapUsage * 100)} %.`}
                <InfoTip label="À propos de cette prévision">
                  <p className="m-0">Estimation d'un modèle paramétré, pas la formule du serveur. Seuls le plancher de quinze pour cent en forgemagie normale et le plancher d'un pour cent en exo PA/PM sont officiels.</p>
                  <p className="m-0 mt-2">Troncature : hypothèse « la rune s'arrête à la limite ».{atelier.probabilityParams.model === 'official_factors_linear' && atelier.probabilityParams.officialFactorsLinear.d !== 0 ? ` Pente d = ${atelier.probabilityParams.officialFactorsLinear.d}.` : ''}</p>
                </InfoTip>
              </div>
            </>
          )}
        </div>
        <div className="grid gap-1.5">
          <button type="button" className="btn-cta w-full py-3 text-[19px]" onClick={onFuse} title="Tirer l'issue avec le modèle actif, puis l'appliquer au moteur (Espace)">
            Fusionner <kbd className="ml-1 text-[11px] opacity-70">␣</kbd>
          </button>
          <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-1 items-center text-[11px] text-ash-3">
            <span title="Mode étude : imposer l'issue pour observer l'effet exact du moteur">Forcer</span>
            {OUTCOMES.map((o) => (
              <button key={o.outcome} type="button" onClick={() => atelier.forceRune(selected.characteristicId, tier, o.outcome)} className={`btn-well py-1 font-semibold text-[12px] tnum ${o.cls}`} title={o.title}>
                {o.outcome}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-slab-edge/60" aria-label="Fusion">
      {body}
      <div className="mt-2 flex justify-end">
        <button type="button" onClick={onToggleHelp} aria-expanded={showHelp} className="text-[11px] text-ash-3 hover:text-ash">⌨ raccourcis (?)</button>
      </div>
      {showHelp && (
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[12px] text-ash-2 m-0">
          {SHORTCUTS.map(([k, v]) => (<Fragment key={k}><dt><kbd className="font-mono text-ash">{k}</kbd></dt><dd className="m-0">{v}</dd></Fragment>))}
        </dl>
      )}
    </div>
  );
}
