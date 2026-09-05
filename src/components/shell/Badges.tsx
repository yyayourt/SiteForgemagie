/* eslint-disable react-refresh/only-export-components -- fournisseur/contexte et hook partagés volontairement dans le même fichier */
import { useId, type ReactNode } from 'react';
import type { EpistemicStatus } from '../../data/params';

const STATUS_STYLE: Record<EpistemicStatus, { text: string; border: string; short: string }> = {
  'SOURCE PRIMAIRE': { text: 'text-st-primary', border: 'border-st-primary/60', short: 'source primaire' },
  'MODÈLE EMPIRIQUE': { text: 'text-st-empirical', border: 'border-st-empirical/60', short: 'modèle empirique' },
  'HYPOTHÈSE COMMUNAUTAIRE': { text: 'text-st-hypothesis', border: 'border-st-hypothesis/60', short: 'hypothèse' },
  CONTRADICTION: { text: 'text-st-contradiction', border: 'border-st-contradiction/60', short: 'contradiction' },
  INCONNU: { text: 'text-st-unknown', border: 'border-st-unknown/60', short: 'inconnu' },
};

export const STATUS_DESCRIPTION: Record<EpistemicStatus, string> = {
  'SOURCE PRIMAIRE': 'Devblog ou tutoriel Ankama, interface du jeu, données extraites du client.',
  'MODÈLE EMPIRIQUE': 'Estimé à partir de données expérimentales reproductibles, avec N documenté.',
  'HYPOTHÈSE COMMUNAUTAIRE': 'Affirmation de guides ou de forums, non vérifiée.',
  CONTRADICTION: 'Des sources fiables se contredisent ; rien n\'est tranché.',
  INCONNU: 'Aucune source ; valeur posée pour faire tourner la simulation.',
};

/** Pastille de statut épistémique (couleur + libellé), avec description en infobulle. */
export function StatusBadge({ status, full = false, className = '' }: { status: EpistemicStatus; full?: boolean; className?: string }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] leading-none px-2 py-1 rounded-full border ${s.border} ${s.text} whitespace-nowrap ${className}`}
      title={`${status} : ${STATUS_DESCRIPTION[status]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
      {full ? status : s.short}
    </span>
  );
}

/** Badge obligatoire sur toute probabilité affichée : « modèle empirique » + nom du modèle. */
export function ModelBadge({ model, heavyExo = false, className = '' }: { model: string; heavyExo?: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] leading-none px-2 py-1 rounded-full border border-model text-model whitespace-nowrap ${className}`}
      title={`Modèle « ${model} » (empirical_params.json → probability), statut INCONNU. La formule du serveur est secrète : ceci est une estimation paramétrée, pas une reproduction. Seules les bornes 15 % (FM normale) et 1 % (exo PA/PM/PO) sont officielles.${heavyExo ? ' Exo lourd : plancher 1 %.' : ''}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-model shadow-[0_0_8px_var(--color-model)]" aria-hidden="true" />
      modèle empirique
      <span className="text-ash-3">{model}</span>
    </span>
  );
}

/** Infobulle accessible : bouton « ? » qui déplie un court texte (clavier et souris). */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <details className="relative inline-block align-middle">
      <summary
        className="inline-grid place-items-center w-5 h-5 rounded-full border border-iron-edge text-ash-3 text-[11px] hover:text-ash hover:border-ash-3 select-none"
        aria-label={label}
        aria-describedby={id}
      >
        ?
      </summary>
      <div id={id} role="note" className="surface-iron absolute z-30 left-0 top-7 w-72 max-w-[80vw] p-3 text-xs text-ash-2 leading-snug shadow-panel">
        {children}
      </div>
    </details>
  );
}
