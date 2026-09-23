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
 *    un exo lourd vient d'une politique de projet (liste) ou d'une mesure (poids cumulé), un
 *    exo léger d'un intervalle sans source.
 */

import type { ProbabilityModelName } from '../../data/params';
import {
  PROBABILITY_MODEL_LABELS,
  SAMPLING_BOUND_LABEL,
  isHeavyExoRateVerbatim,
  type ProbabilityEstimate,
} from '../../logic/probability';
import { InfoTip, ModelBadge, StatusBadge } from '../shell/Badges';

const pct = (x: number) => `${Math.round(x * 100)} %`;

/** Barre empilée SC/SN/EC : largeurs = probabilités. Purement visuelle (aria-hidden). */
function OutcomeBar({ sc, sn, ec, thin = false }: { sc: number; sn: number; ec: number; thin?: boolean }) {
  return (
    <div className={`flex w-full ${thin ? 'h-1.5' : 'h-2.5'} rounded-full overflow-hidden roll-track`} aria-hidden="true">
      <span className="bg-sc" style={{ width: `${sc * 100}%` }} />
      <span className="bg-sn" style={{ width: `${sn * 100}%` }} />
      <span className="bg-ec" style={{ width: `${ec * 100}%` }} />
    </div>
  );
}

export interface OutcomeEstimateProps {
  estimate: ProbabilityEstimate;
  model: ProbabilityModelName;
  isHeavyExo: boolean;
  /**
   * Régime 1 % atteint par le poids cumulé de la ligne (heavyRegime.ts, règle
   * cumulative_weight) et non par la liste : la note doit le dire. Optionnel : absent = liste.
   */
  heavyByWeight?: boolean;
  /** Caractéristique visée : décide si le plancher de 1 % est verbatim (PA, PM) ou extrapolé (PO, Invocations). */
  characteristicId: number;
}

export function OutcomeEstimate({ estimate, model, isHeavyExo, heavyByWeight = false, characteristicId }: OutcomeEstimateProps) {
  return (
    <>
      {estimate.kind === 'point' && estimate.status === 'MODÈLE' && (
        <ModelBadge model={PROBABILITY_MODEL_LABELS[model]} heavyExo={isHeavyExo} />
      )}

      {estimate.kind === 'point' ? (
        <div className="mt-2.5 tnum" data-testid="point-triplet">
          <OutcomeBar sc={estimate.probabilities.pSC} sn={estimate.probabilities.pSN} ec={estimate.probabilities.pEC} />
          <div className="grid grid-cols-3 gap-1.5 mt-1.5 text-center">
            <div><b className="font-display text-[17px] text-sc">{pct(estimate.probabilities.pSC)}</b> <small className="text-[11px] text-ash-3">SC</small></div>
            <div><b className="font-display text-[17px] text-sn">{pct(estimate.probabilities.pSN)}</b> <small className="text-[11px] text-ash-3">SN</small></div>
            <div><b className="font-display text-[17px] text-ec">{pct(estimate.probabilities.pEC)}</b> <small className="text-[11px] text-ash-3">EC</small></div>
          </div>
        </div>
      ) : (
        <div className="mt-2.5">
          <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 items-center text-[10.5px] text-ash-3">
            <span>meilleure création</span><OutcomeBar thin sc={estimate.best.pSC} sn={estimate.best.pSN} ec={estimate.best.pEC} />
            <span>pire création</span><OutcomeBar thin sc={estimate.worst.pSC} sn={estimate.worst.pSN} ec={estimate.worst.pEC} />
          </div>
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 mt-2 m-0 items-baseline" data-testid="interval-ranges">
            <dt className="text-[11px] text-ash-3">succès critique</dt>
            <dd className="m-0 font-display text-[15px] text-sc tnum whitespace-nowrap" data-testid="range-sc">{pct(estimate.worst.pSC)} – {pct(estimate.best.pSC)}</dd>
            <dt className="text-[11px] text-ash-3">succès neutre</dt>
            <dd className="m-0 font-display text-[15px] text-sn tnum whitespace-nowrap" data-testid="range-sn">{pct(estimate.worst.pSN)} – {pct(estimate.best.pSN)}</dd>
            <dt className="text-[11px] text-ash-3">échec critique</dt>
            <dd className="m-0 font-display text-[15px] text-ec tnum whitespace-nowrap" data-testid="range-ec">{pct(estimate.best.pEC)} – {pct(estimate.worst.pEC)}</dd>
          </dl>
        </div>
      )}

      {estimate.kind === 'interval' && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-molten-text">
          <StatusBadge status="INCONNU" />
          <span>intervalle, pas un chiffre</span>
          <InfoTip label="Pourquoi un intervalle">
            <p className="m-0 leading-snug" data-testid="interval-note">
              <StatusBadge status="INCONNU" /> Création d'effet : aucun chiffre n'est avancé.
              L'intervalle affiché est celui du DevBlog Ankama de 2010, entre la meilleure création
              d'effet possible et la pire. Où se situe cette rune dans cet intervalle n'est établi par
              aucune source. Le simulateur tire l'issue sur {SAMPLING_BOUND_LABEL[estimate.samplingBound]},
              choix de projet réglable : tout Monte Carlo sur cette rune en hérite.
            </p>
          </InfoTip>
        </div>
      )}

      {estimate.kind === 'point' && estimate.attemptKind === 'heavy_exo' && heavyByWeight && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-molten-text">
          <StatusBadge status="MODÈLE EMPIRIQUE" />
          <span>régime SC seul (poids cumulé)</span>
          <InfoTip label="D'où vient ce taux">
            <p className="m-0 leading-snug" data-testid="heavy-exo-note">
              <StatusBadge status="MODÈLE EMPIRIQUE" />{' '}
              Ligne à trente de poids ou plus au-delà du jet : elle ne passe plus qu'en succès
              critique, sans succès neutre possible. Mesuré sur le deuxième point d'un pourcentage de
              dommages aux sorts : environ {pct(estimate.probabilities.pSC)} de succès critique et aucun
              succès neutre sur dix à quinze mille runes (bêta 3.6, objet à jet aléatoire). Sur un objet
              au jet parfait, un relevé plus petit tombe vers un pour cent : le simulateur ne tient pas
              compte de la qualité de l'objet ici. Aucune source Ankama.
            </p>
          </InfoTip>
        </div>
      )}

      {estimate.kind === 'point' && estimate.attemptKind === 'heavy_exo' && !heavyByWeight && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-molten-text">
          <StatusBadge status="HYPOTHÈSE COMMUNAUTAIRE" />
          <span>exo lourd : plancher 1 %</span>
          <InfoTip label="D'où vient ce taux">
            <p className="m-0 leading-snug" data-testid="heavy-exo-note">
              <StatusBadge status="HYPOTHÈSE COMMUNAUTAIRE" />{' '}
              {isHeavyExoRateVerbatim(characteristicId) ? (
                <>
                  Exotique PA ou PM. Ankama écrit que le taux « peut descendre jusqu'à un pour cent si
                  l'on souhaite ajouter un PA ou un PM exotique » : c'est un plancher attesté, pas la
                  valeur du cas. Deux relevés indépendants sur l'exo PM d'un Gelano (dix mille et près
                  de neuf mille runes) donnent un virgule un pour cent : le plancher est corroboré sur
                  un objet simple.
                </>
              ) : (
                <>
                  Exotique lourd. Ankama ne cite le « peut descendre jusqu'à un pour cent » que pour le
                  PA et le PM : pour cette caractéristique-ci, même le plancher n'est pas attesté, seuls
                  les guides la rangent avec eux.
                </>
              )}{' '}
              Le simulateur retient ce plancher comme valeur. En théorie l'intervalle d'une création
              d'effet monte jusqu'à trente-deux pour cent ; sur un objet chargé, aucune mesure ne dit
              où tombe cette rune entre les deux.
            </p>
          </InfoTip>
        </div>
      )}
    </>
  );
}
