import type { SimLogEntry, ForgeEvent } from '../../types';

interface Props {
  log: SimLogEntry[];
  lastEvent: ForgeEvent | null;
  onClear: () => void;
}

const OUTCOME = {
  SC: { cls: 'text-sc bg-sc/10 shadow-[0_0_14px_-4px_var(--color-sc)]', label: 'SC', long: 'succès critique' },
  SN: { cls: 'text-sn bg-sn/10', label: 'SN', long: 'succès neutre' },
  EC: { cls: 'text-ec bg-ec/10', label: 'EC', long: 'échec critique' },
} as const;

/**
 * Un succès neutre impossible s'affiche « Échec », pas « SN ».
 *
 * La RÈGLE (« rien ne se passe ») vient du DevBlog 1.27 et régit la transition d'état.
 * Le LIBELLÉ, lui, n'a qu'une seule attestation Unity : l'observation du 2026-09-09, où un
 * échec sans effet (lignes et reliquat à zéro) s'affiche « Échec » dans le client. Aucune
 * observation ne montre le client écrire « succès neutre » sur une tentative sans effet.
 * On reprend donc le seul libellé attesté plutôt que d'en déduire un du nom interne de
 * l'issue. L'anomalie A3 du 2026-09-10, qui montrait aussi « Échec », est HORS du corpus
 * exploitable (horodatage confondu avec A2) et n'est pas ce qui tranche ici.
 */
const NO_OP = { cls: 'text-ec bg-ec/10', label: 'Éch', long: 'échec sans effet' } as const;

const REFUSAL: Record<string, string> = {
  item_locked: 'objet transcendé : plus de forgemagie ni d\'orbe (devblog 2.58)',
  line_locked: 'ligne verrouillée',
  no_density: 'densité inconnue pour cette caractéristique',
  over_cap_exceeded: 'plafond d\'over ou d\'exo dépassé',
  transcendence_has_exo: 'transcendance refusée : un exo est présent (hypothèse)',
  transcendence_has_over: 'transcendance refusée : un over est présent (hypothèse)',
  transcendence_threshold_exceeded: 'transcendance refusée : seuil de rang dépassé (paramètre)',
  transcendence_rate_not_certain: 'transcendance : taux de réussite inférieur à cent pour cent, non modélisé',
};

function describe(e: SimLogEntry): string {
  if (e.refusedReason) return `refusée : ${REFUSAL[e.refusedReason] ?? e.refusedReason}`;
  if (e.kind === 'orb') return 'jet retiré au hasard, exos retirés, reliquat vidé';
  if (e.kind === 'transcendence') return 'posée sans perte ; objet verrouillé';
  const parts: string[] = [];
  if (e.snNoOp) parts.push("rien ne se passe : l'objet ressort identique, reliquat compris ; la rune est consommée (règle du devblog 1.27 ; le sort de la rune est aligné sur l'échec sans effet observé en jeu, INCONNU)");
  if (e.snConvertedToEc) parts.push('succès neutre impayable : converti en échec sans effet, rune consommée (ancienne règle, option)');
  if (e.truncated && e.outcome !== 'EC') parts.push(`tronquée à +${e.appliedValue ?? 0} sur ${e.runeValue} (borne over/exo)`);
  if (e.absorbedByResidual > 0) parts.push(`le reliquat absorbe ${e.absorbedByResidual.toFixed(1)}`);
  for (const l of e.losses) parts.push(`${l.statName} −${l.pointsLost} (${l.weightLost.toFixed(1)})`);
  const delta = e.residualPoolAfter - e.residualPoolBefore;
  if (delta > 0.0001) parts.push(`reliquat +${delta.toFixed(1)}`);
  if ((e.unabsorbedWeight ?? 0) > 0.0001 && !e.snConvertedToEc && !e.snNoOp) parts.push(`⚠ perte non absorbable : ${e.unabsorbedWeight!.toFixed(1)} de poids non retiré, l'objet ne peut plus payer`);
  if (parts.length === 0) return e.outcome === 'SC' ? 'aucune perte' : 'aucune ligne touchée';
  return parts.join(' · ');
}

/** Le Livre de forge : chaque frappe, telle que le moteur l'a appliquée. */
export function ForgeLog({ log, lastEvent, onClear }: Props) {
  const applied = log.filter((e) => !e.refusedReason);
  const count = (o: 'SC' | 'SN' | 'EC') => applied.filter((e) => e.outcome === o && e.kind === 'rune').length;
  const entries = [...log].reverse();

  return (
    <section className="surface-iron p-4 sm:p-5" aria-labelledby="log-title">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3">
        <h2 id="log-title" className="text-[17px] text-ash">Livre de forge</h2>
        <span className="text-xs text-ash-3">chaque frappe, telle que le moteur l'a appliquée</span>
        {log.length > 0 && (
          <div className="ml-auto flex items-center gap-4 text-[13px] text-ash-2 tnum">
            <span>Frappes <b className="text-ash">{applied.filter((e) => e.kind === 'rune').length}</b></span>
            <span className="text-sc">SC <b>{count('SC')}</b></span>
            <span className="text-sn">SN <b>{count('SN')}</b></span>
            <span className="text-ec">EC <b>{count('EC')}</b></span>
            <button type="button" onClick={onClear} className="btn-well px-2.5 py-1 text-xs">Vider</button>
          </div>
        )}
      </div>

      {log.length === 0 ? (
        <p className="well rounded-control px-4 py-5 text-sm text-ash-3 text-center">
          Le livre est vierge. Tentez une rune : chaque issue s'inscrira ici avec sa perte, la ligne touchée et le reliquat.
        </p>
      ) : (
        <ol className="m-0 p-0 list-none grid gap-2 sm:grid-cols-2 xl:grid-cols-3 max-h-[380px] overflow-y-auto pr-1">
          {entries.map((e) => {
            const o = OUTCOME[e.outcome];
            const latest = lastEvent?.id === e.id;
            return (
              <li
                key={e.id}
                className={`well rounded-control grid grid-cols-[34px_1fr_auto] gap-2.5 items-center px-3 py-2.5 text-[13px] ${latest ? 'entry-forged border-ash-3' : ''} ${e.refusedReason ? 'opacity-70' : ''}`}
              >
                <span
                  className={`w-[30px] h-[30px] rounded-full grid place-items-center font-display font-bold text-[10px] border border-current ${e.refusedReason ? 'text-ash-3' : e.snNoOp ? NO_OP.cls : o.cls}`}
                  title={e.refusedReason ? 'refusée' : e.snNoOp ? NO_OP.long : o.long}
                >
                  {e.refusedReason ? '×' : e.kind === 'orb' ? '◌' : e.snNoOp ? NO_OP.label : o.label}
                </span>
                <span className="min-w-0">
                  <b className="text-ash">{e.actionLabel}</b>
                  {e.kind === 'rune' && e.drawnByModel && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-px rounded-full border border-model text-model align-middle" title={`Issue tirée par le modèle « ${e.modelName ?? ''} » (INCONNU)`}>
                      modèle
                    </span>
                  )}
                  {e.kind === 'rune' && !e.drawnByModel && !e.refusedReason && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-px rounded-full border border-ash-3 text-ash-3 align-middle" title="Issue forcée à la main (mode étude)">forcée</span>
                  )}
                  <small className={`block text-xs leading-snug ${((e.unabsorbedWeight ?? 0) > 0.0001 && !e.snNoOp) || e.snConvertedToEc ? 'text-ec' : 'text-ash-3'}`}>{describe(e)}</small>
                </span>
                <span className="text-right text-[11px] text-ash-3 tnum">
                  reliquat
                  <b className="block text-sm text-molten-text">{e.residualPoolAfter.toFixed(1)}</b>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
