import type { ForgeEvent } from '../../types';
import { InfoTip, StatusBadge } from '../shell/Badges';
import { getParamEntry } from '../../data/params';

interface Props {
  residualPool: number;
  event: ForgeEvent | null;
}

/**
 * Le creuset : jauge du RELIQUAT SERVEUR (état propre du moteur), en métal en fusion.
 * L'élément signature de l'atelier. Il ne parle jamais du budget de planification.
 */
export function Crucible({ residualPool, event }: Props) {
  const scale = Math.max(50, Math.ceil(residualPool / 50) * 50);
  const heightPercent = Math.min(100, (residualPool / scale) * 100);
  // Le métal bouillonne quand le reliquat vient de monter ; la clé d'événement rejoue l'animation
  const boilKey = event && event.residualDelta > 0.0001 ? event.id : 0;

  const reset = getParamEntry<boolean>('params.residualPool.resetOnEquipOrMarket');
  const visible = getParamEntry<boolean>('params.residualPool.visibleInClient');

  return (
    <section className="surface-iron p-4 sm:p-5" aria-labelledby="crucible-title">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 id="crucible-title" className="text-[17px] text-ash">Reliquat</h2>
        <div className="flex items-center gap-1.5">
          <StatusBadge status="HYPOTHÈSE COMMUNAUTAIRE" />
          <InfoTip label="Ce qu'est le reliquat">
            <p className="m-0"><strong className="text-ash">Reliquat serveur</strong> : créé par un succès neutre ou un échec (poids perdu − poids de la rune), consommé en priorité à la perte suivante, jamais négatif. C'est un état propre du moteur, pas un calcul sur les lignes visibles.</p>
            <p className="m-0 mt-2">Sa purge à l'équipement ou en HDV est une hypothèse (<StatusBadge status={reset?.status ?? 'HYPOTHÈSE COMMUNAUTAIRE'} />), et sa visibilité en jeu une <StatusBadge status={visible?.status ?? 'CONTRADICTION'} />.</p>
            <p className="m-0 mt-2">À ne pas confondre avec le <strong className="text-ash">budget de poids</strong>, qui est une planification.</p>
          </InfoTip>
        </div>
      </div>

      <div className="vessel h-[210px]" role="img" aria-label={`Reliquat : ${residualPool.toFixed(1)} de poids en fusion`}>
        <div className="vessel-rim" />
        <div className="absolute right-2 top-4 bottom-8 flex flex-col justify-between text-[10px] text-ash-3 text-right tnum" aria-hidden="true">
          <span>{scale}</span>
          <span>{scale / 2}</span>
          <span>0</span>
        </div>
        <div className="vessel-glow" style={{ opacity: 0.35 + heightPercent / 150 }} />
        <div key={boilKey} className={`molten ${boilKey > 0 ? 'boil' : ''}`} style={{ height: `${Math.max(heightPercent, residualPool > 0 ? 3 : 0)}%` }} />
      </div>

      <div className="flex items-baseline gap-2 mt-3">
        <b className="font-display font-bold text-[34px] leading-none tnum text-molten-text">{residualPool.toFixed(1)}</b>
        <span className="text-sm text-ash-2">de poids en fusion</span>
      </div>
      <p className="text-xs text-ash-3 mt-2 leading-snug">
        Ce qui a fondu lors des dernières pertes, et que le moteur reprend avant de toucher une ligne.
      </p>
    </section>
  );
}
