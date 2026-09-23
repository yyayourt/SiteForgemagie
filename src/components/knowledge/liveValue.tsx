/**
 * Rendu d'une valeur de paramètre lue en direct (readParam) : chaîne encadrée en code (une
 * valeur de paramètre, pas de la prose), objet en paires « clé : valeur » séparées par « · »
 * (ex. { Ta: 100, Pata: 100, Rata: 100 }), sinon `fmt`. Séparé de KnowledgeItemList.tsx pour ne
 * pas casser le fast refresh (une fonction non-composant ne peut pas être exportée d'un fichier
 * de composant).
 */
import type { ReactNode } from 'react';
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
