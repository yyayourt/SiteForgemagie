/**
 * Affichage d'une estimation d'issue — les DEUX formes que le moteur peut rendre.
 *
 * Depuis le garde-fou d'exotisme (2026-09-10), `estimateOutcome` ne renvoie plus toujours un
 * triplet : une création d'effet non lourde rend un **intervalle**. Ce composant existe pour
 * que les deux formes soient rendues et testées au même endroit, plutôt que dissoutes dans
 * un `ActionPanel` qu'on ne peut pas monter sans tout l'atelier.
 *
 * Deux pièges déjà rencontrés, d'où les choix de mise en page :
 * 1. la grille à trois colonnes prévue pour un nombre unique **coupe** un intervalle au
 *    milieu (« 1 % – 32 » puis « % ») : l'intervalle prend donc une ligne par issue ;
 * 2. le badge « modèle empirique » ne doit apparaître que si le chiffre vient **du modèle** —
 *    un exo lourd vient d'une politique de projet, un exo léger d'un intervalle sans source.
 */

import type { ProbabilityModelName } from '../../data/params';
import {
  PROBABILITY_MODEL_LABELS,
  SAMPLING_BOUND_LABEL,
  isHeavyExoRateVerbatim,
  type ProbabilityEstimate,
} from '../../logic/probability';
import { ModelBadge, StatusBadge } from '../shell/Badges';

const pct = (x: number) => `${Math.round(x * 100)} %`;

export interface OutcomeEstimateProps {
  estimate: ProbabilityEstimate;
  model: ProbabilityModelName;
  isHeavyExo: boolean;
  /** Caractéristique visée : décide si le taux de 1 % est verbatim (PA) ou extrapolé (PM, PO). */
  characteristicId: number;
}

export function OutcomeEstimate({ estimate, model, isHeavyExo, characteristicId }: OutcomeEstimateProps) {
  return (
    <>
      {estimate.kind === 'point' && estimate.status === 'MODÈLE' && (
        <ModelBadge model={PROBABILITY_MODEL_LABELS[model]} heavyExo={isHeavyExo} />
      )}

      {estimate.kind === 'point' ? (
        <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-center tnum" data-testid="point-triplet">
          <div><b className="block font-display text-[22px] text-sc">{pct(estimate.probabilities.pSC)}</b><small className="text-[11px] text-ash-3">succès critique</small></div>
          <div><b className="block font-display text-[22px] text-sn">{pct(estimate.probabilities.pSN)}</b><small className="text-[11px] text-ash-3">succès neutre</small></div>
          <div><b className="block font-display text-[22px] text-ec">{pct(estimate.probabilities.pEC)}</b><small className="text-[11px] text-ash-3">échec critique</small></div>
        </div>
      ) : (
        <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 mt-2.5 m-0 items-baseline" data-testid="interval-ranges">
          <dt className="text-[11px] text-ash-3">succès critique</dt>
          <dd className="m-0 font-display text-[17px] text-sc tnum whitespace-nowrap" data-testid="range-sc">{pct(estimate.worst.pSC)} – {pct(estimate.best.pSC)}</dd>
          <dt className="text-[11px] text-ash-3">succès neutre</dt>
          <dd className="m-0 font-display text-[17px] text-sn tnum whitespace-nowrap" data-testid="range-sn">{pct(estimate.worst.pSN)} – {pct(estimate.best.pSN)}</dd>
          <dt className="text-[11px] text-ash-3">échec critique</dt>
          <dd className="m-0 font-display text-[17px] text-ec tnum whitespace-nowrap" data-testid="range-ec">{pct(estimate.best.pEC)} – {pct(estimate.worst.pEC)}</dd>
        </dl>
      )}

      {estimate.kind === 'interval' && (
        <p className="m-0 mt-2 text-[11px] text-molten-text leading-snug" data-testid="interval-note">
          <StatusBadge status="INCONNU" /> Création d'effet : aucun chiffre n'est avancé.
          L'intervalle affiché est celui du DevBlog Ankama de 2010, entre la meilleure création
          d'effet possible et la pire. Où se situe cette rune dans cet intervalle n'est établi par
          aucune source. Le simulateur tire l'issue sur {SAMPLING_BOUND_LABEL[estimate.samplingBound]},
          choix de projet réglable : tout Monte Carlo sur cette rune en hérite.
        </p>
      )}

      {estimate.kind === 'point' && estimate.status === 'POLITIQUE' && (
        <p className="m-0 mt-2 text-[11px] text-molten-text leading-snug" data-testid="heavy-exo-note">
          <StatusBadge status="HYPOTHÈSE COMMUNAUTAIRE" />{' '}
          {isHeavyExoRateVerbatim(characteristicId) ? (
            <>
              Exotique PA. Ankama écrit que le taux « peut descendre jusqu'à un pour cent » : c'est
              un plancher attesté, pas la valeur du cas.
            </>
          ) : (
            <>
              Exotique lourd. Ankama ne cite le « peut descendre jusqu'à un pour cent » que pour le
              PA : pour cette caractéristique-ci, même le plancher n'est pas attesté, seuls les
              guides la rangent avec le PA.
            </>
          )}{' '}
          Le simulateur retient ce plancher comme valeur, par la même politique conservatrice que
          pour les autres créations d'effet, dont l'intervalle monte jusqu'à trente-deux pour cent.
          Où tombe cette rune entre les deux n'est documenté nulle part.
        </p>
      )}
    </>
  );
}
