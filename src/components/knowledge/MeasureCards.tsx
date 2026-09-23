/**
 * Une carte « Aide-nous à mesurer » par paramètre INCONNU ou CONTRADICTION du registre :
 * libellé, statut, valeur actuelle, et le protocole d'observation (MEASUREMENTS[path], sinon la
 * note du paramètre tronquée, sinon « protocole non documenté »).
 */
import { useState } from 'react';
import { useParams } from '../../app/ParamsProvider';
import { readParam } from '../../data/params';
import { PARAM_REGISTRY, type ParamDescriptor } from '../../data/paramRegistry';
import { MEASUREMENTS } from '../../content/knowledge';
import { StatusBadge } from '../shell/Badges';
import { fmt } from './format';
import { unknownParams } from './dossierModel';

const TRUNCATE_AT = 280;

function MeasureCard({ d }: { d: ParamDescriptor }) {
  const { overrides } = useParams();
  const [expanded, setExpanded] = useState(false);
  const value = readParam<unknown>(d.path, overrides);

  const documented = MEASUREMENTS[d.path];
  const fallback = d.entry.note;
  const protocol = documented ?? fallback ?? '';
  const protocolLabel = documented ? 'À observer : ' : fallback ? 'Note : ' : null;
  const canTruncate = !documented && protocol.length > TRUNCATE_AT;
  const showTruncated = canTruncate && !expanded;
  const shown = showTruncated ? `${protocol.slice(0, TRUNCATE_AT)}…` : protocol;

  return (
    <div data-testid="measure-card" className="surface-iron p-4 grid gap-2 min-w-0">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-ash text-sm">
          {d.subgroup && <span className="text-ash-3">{d.subgroup} · </span>}
          {d.label}
        </span>
        <StatusBadge status={d.entry.status} />
      </div>
      <p className="m-0 text-xs text-ash-2 break-words min-w-0">
        Valeur actuelle : <span className="tnum text-ash">{fmt(value)}</span>
      </p>
      <p className="m-0 text-xs text-ash-2 leading-snug break-words min-w-0">
        {protocol ? (
          <>
            <span className="text-ash-3">{protocolLabel}</span>
            {shown}
          </>
        ) : (
          'Protocole non documenté.'
        )}
      </p>
      {showTruncated && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="justify-self-start text-xs text-molten-text underline"
        >
          lire la suite
        </button>
      )}
    </div>
  );
}

export function MeasureCards() {
  const items = unknownParams(PARAM_REGISTRY);
  return (
    <div className="grid gap-3 sm:grid-cols-2 min-w-0">
      {items.map((d) => (
        <MeasureCard key={d.path} d={d} />
      ))}
    </div>
  );
}
