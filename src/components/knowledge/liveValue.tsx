/* eslint-disable react-refresh/only-export-components -- fonction utilitaire et composant partagés volontairement dans le même fichier (voir note ci-dessous) */
/**
 * Rendu d'une valeur de paramètre lue en direct.
 *
 * `formatLiveValue` met en forme une valeur brute (chaîne encadrée en code — une valeur de
 * paramètre, pas de la prose —, objet en paires « clé : valeur » séparées par « · », ex.
 * { Ta: 100, Pata: 100, Rata: 100 }, sinon `fmt`).
 *
 * `LiveValue` est le composant partagé par KnowledgeItemList.tsx (InlineValue, BlockValue) et
 * UnderstandTab.tsx (ExampleParamValue) : il lit `readParam(path, overrides)`, la formate via
 * `formatLiveValue`, et signale un profil actif — même libellé/classe que ParamTable — quand la
 * valeur affichée diffère de la valeur de référence du registre (empirical_params.json).
 *
 * NOTE : ce composant devrait porter le nom de fichier `LiveValue.tsx` (voir la fiche de
 * corrections finale). Ce dépôt tourne avec `core.ignorecase=true` sur un système de fichiers
 * Windows insensible à la casse : `LiveValue.tsx` et `liveValue.tsx` désignent le MÊME fichier
 * sur disque (vérifié : écrire l'un écrase l'autre). Créer un fichier séparé aurait donc
 * silencieusement écrasé ce module. `LiveValue` est du coup exporté nommément depuis ce fichier
 * existant, aux côtés de `formatLiveValue`.
 */
import type { ReactNode } from 'react';
import { useParams } from '../../app/ParamsProvider';
import { readParam } from '../../data/params';
import { PARAM_BY_PATH } from '../../data/paramRegistry';
import { StatusBadge } from '../shell/Badges';
import { fmt } from './format';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function formatLiveValue(value: unknown): ReactNode {
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return <span className="text-ash-3">aucune valeur</span>;
    return entries.map(([k, v]) => `${k} : ${fmt(v)}`).join(' · ');
  }
  if (typeof value === 'string') {
    return <code className="font-mono text-[12px]">{value}</code>;
  }
  return fmt(value);
}

/**
 * Valeur live d'un paramètre : `path` (chemin `empirical_params.json`, ex. `densities.11`),
 * `withLabel` (préfixe `{libellé} : `, pour BlockValue et ExampleParamValue), `withBadge`
 * (pastille de statut épistémique, pour l'exemple — F2).
 */
export function LiveValue({ path, withLabel = false, withBadge = false }: { path: string; withLabel?: boolean; withBadge?: boolean }) {
  const { overrides } = useParams();
  const value = readParam<unknown>(path, overrides);
  const d = PARAM_BY_PATH.get(path);
  const overridden = JSON.stringify(value) !== JSON.stringify(d?.entry.value);
  return (
    <>
      {withLabel && `${d?.label ?? path} : `}
      {formatLiveValue(value)}
      {withBadge && d && <StatusBadge status={d.entry.status} className="ml-2" />}
      {overridden && <span className="ml-1 text-[10px] text-model">profil actif</span>}
    </>
  );
}
