/**
 * Liste d'affirmations (`KnowledgeItem[]`) : pastille de statut + texte + valeur live du
 * paramètre éventuel (readParam + fmt, surcharges honorées) + source en petit texte gris.
 * `ordered` bascule entre `<ul>` (En bref) et `<ol>` (Comment ça marche).
 */
import { useParams } from '../../app/ParamsProvider';
import { readParam } from '../../data/params';
import type { KnowledgeItem } from '../../content/knowledge';
import { StatusBadge } from '../shell/Badges';
import { fmt } from './format';

/** Une valeur de paramètre affichée « en direct » après le texte d'un item. */
function LiveValue({ path }: { path: string }) {
  const { overrides } = useParams();
  const value = readParam<unknown>(path, overrides);
  const formatted = fmt(value);
  if (typeof value === 'string') {
    return (
      <>
        {' '}
        <code className="font-mono text-[12px]">{formatted}</code>
      </>
    );
  }
  return <span className="tnum text-ash"> {formatted}</span>;
}

function Item({ item }: { item: KnowledgeItem }) {
  return (
    <li className="flex flex-col gap-1">
      <span className="flex items-start gap-2 flex-wrap">
        <StatusBadge status={item.status} />
        <span className="text-ash">
          {item.text}
          {item.param && <LiveValue path={item.param} />}
        </span>
      </span>
      <span className="text-[11px] text-ash-3">{item.source}</span>
    </li>
  );
}

export function KnowledgeItemList({ items, ordered = false }: { items: KnowledgeItem[]; ordered?: boolean }) {
  const className = `m-0 p-0 list-none grid gap-3 ${ordered ? 'list-decimal pl-5' : ''}`;
  if (ordered) {
    return (
      <ol className={className}>
        {items.map((item, i) => (
          <Item key={i} item={item} />
        ))}
      </ol>
    );
  }
  return (
    <ul className={className}>
      {items.map((item, i) => (
        <Item key={i} item={item} />
      ))}
    </ul>
  );
}
