/**
 * Liste d'affirmations (`KnowledgeItem[]`) : pastille de statut + texte + valeur live du
 * paramètre éventuel (readParam + fmt, surcharges honorées) + source en petit texte gris.
 * `ordered` bascule entre `<ul>` (En bref) et `<ol>` (Comment ça marche).
 *
 * Position de la valeur live : si le texte se termine par « : » (phrase introduisant la
 * valeur), elle reste collée en ligne ; sinon (phrase complète, « . » ou « ? ») elle passe sur
 * sa propre ligne avec le libellé du paramètre, pour ne pas produire « …(2012). capped_50 ».
 */
import { useParams } from '../../app/ParamsProvider';
import { readParam } from '../../data/params';
import { PARAM_BY_PATH } from '../../data/paramRegistry';
import type { KnowledgeItem } from '../../content/knowledge';
import { StatusBadge } from '../shell/Badges';
import { formatLiveValue } from './liveValue';

/** Valeur live collée en fin de phrase introductive (« Valeur retenue : » → « … : capped_50 »). */
function InlineValue({ path }: { path: string }) {
  const { overrides } = useParams();
  const value = readParam<unknown>(path, overrides);
  return <span className="tnum text-ash"> {formatLiveValue(value)}</span>;
}

/** Valeur live sur sa propre ligne, avec le libellé du paramètre, quand le texte est une phrase complète. */
function BlockValue({ path }: { path: string }) {
  const { overrides } = useParams();
  const value = readParam<unknown>(path, overrides);
  const label = PARAM_BY_PATH.get(path)?.label ?? path;
  return (
    <span className="block text-[12px] text-ash-2">
      Valeur actuelle — {label} : {formatLiveValue(value)}
    </span>
  );
}

function Item({ item }: { item: KnowledgeItem }) {
  const inline = item.text.trimEnd().endsWith(':');
  return (
    <li className="flex flex-col gap-1">
      <span className="flex items-start gap-2 flex-wrap">
        <StatusBadge status={item.status} />
        <span className="text-ash">
          {item.text}
          {item.param && inline && <InlineValue path={item.param} />}
        </span>
      </span>
      {item.param && !inline && <BlockValue path={item.param} />}
      <span className="text-[11px] text-ash-3">{item.source}</span>
    </li>
  );
}

export function KnowledgeItemList({ items, ordered = false }: { items: KnowledgeItem[]; ordered?: boolean }) {
  const className = ordered ? 'm-0 grid gap-3 list-decimal pl-5' : 'm-0 grid gap-3 list-none p-0';
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
