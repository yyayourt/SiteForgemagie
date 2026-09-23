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

  const width = Math.max(heightPercent, residualPool > 0 ? 3 : 0);
  return (
    <div className="flex items-center gap-2.5 min-w-[220px]" role="group" aria-labelledby="crucible-title">
      <span id="crucible-title" className="text-sm text-ash-2">Reliquat</span>
      <div className="relative h-2 flex-1 min-w-[80px] rounded-full roll-track overflow-hidden" role="img" aria-label={`Reliquat : ${residualPool.toFixed(1)} de poids en fusion`}>
        <div className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,var(--color-ember),var(--color-molten))] transition-[width] duration-500" style={{ width: `${width}%` }} />
      </div>
      <b key={boilKey} className={`font-display font-bold text-xl tnum text-molten-text ${boilKey > 0 ? 'value-bump' : ''}`}>{residualPool.toFixed(1)}</b>
      <StatusBadge status="HYPOTHÈSE COMMUNAUTAIRE" />
      <InfoTip label="Ce qu'est le reliquat">
        <p className="m-0"><strong className="text-ash">Reliquat serveur</strong> : créé par un succès neutre ou un échec (poids perdu − poids de la rune), consommé en priorité à la perte suivante, jamais négatif. C'est un état propre du moteur, pas un calcul sur les lignes visibles.</p>
        <p className="m-0 mt-2">Sa purge à l'équipement ou en HDV est une hypothèse (<StatusBadge status={reset?.status ?? 'HYPOTHÈSE COMMUNAUTAIRE'} />), et son affichage en jeu est établi : le client Unity montre « reliquat » et son historique (<StatusBadge status={visible?.status ?? 'SOURCE PRIMAIRE'} />).</p>
        <p className="m-0 mt-2">À ne pas confondre avec le <strong className="text-ash">budget de poids</strong>, qui est une planification.</p>
        <p className="m-0 mt-2">Ce qui a fondu lors des dernières pertes, et que le moteur reprend avant de toucher une ligne. Échelle de la jauge : 0 à {scale}.</p>
      </InfoTip>
    </div>
  );
}
