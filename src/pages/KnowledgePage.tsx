import { useParams } from '../app/ParamsProvider';
import { readParam, PARAMS_META } from '../data/params';
import { PARAM_REGISTRY, PARAM_NOTES, type ParamDescriptor } from '../data/paramRegistry';
import { DATASET_META, FM_ORBS, FM_POTIONS } from '../data/dataset';
import { KNOWLEDGE_SECTIONS } from '../content/knowledge';
import { StatusBadge, STATUS_DESCRIPTION } from '../components/shell/Badges';
import type { EpistemicStatus } from '../data/params';

function fmt(v: unknown): string {
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toLocaleString('fr-FR', { maximumFractionDigits: 4 });
  if (typeof v === 'boolean') return v ? 'oui' : 'non';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.join(', ');
  return JSON.stringify(v);
}

function ParamTable({ items }: { items: ParamDescriptor[] }) {
  const { overrides } = useParams();
  if (items.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-control border border-iron-edge">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr className="text-left text-ash-3 bg-well">
            <th className="px-3 py-2 font-medium">Règle</th>
            <th className="px-3 py-2 font-medium text-right">Valeur</th>
            <th className="px-3 py-2 font-medium">Statut</th>
            <th className="px-3 py-2 font-medium hidden md:table-cell">Source</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => {
            const v = readParam<unknown>(d.path, overrides);
            const changed = JSON.stringify(v) !== JSON.stringify(d.entry.value);
            return (
              <tr key={d.path} className="border-t border-iron-edge/60 align-top">
                <td className="px-3 py-2 text-ash">
                  {d.subgroup && <span className="text-ash-3">{d.subgroup} · </span>}{d.label}
                  {d.entry.note && <span className="block text-xs text-ash-3 mt-0.5 leading-snug">{d.entry.note}</span>}
                </td>
                <td className="px-3 py-2 text-right tnum text-ash whitespace-pre-wrap max-w-[220px]">
                  {fmt(v)}
                  {changed && <span className="block text-[10px] text-model">profil actif</span>}
                </td>
                <td className="px-3 py-2"><StatusBadge status={d.entry.status} /></td>
                <td className="px-3 py-2 text-xs text-ash-2 leading-snug hidden md:table-cell">{d.entry.source}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Page « État des connaissances », générée depuis empirical_params.json + prose par section. */
export function KnowledgePage() {
  const unknowns = PARAM_REGISTRY.filter((d) => d.entry.status === 'INCONNU' || d.entry.status === 'CONTRADICTION');
  const statuses: EpistemicStatus[] = ['SOURCE PRIMAIRE', 'MODÈLE EMPIRIQUE', 'HYPOTHÈSE COMMUNAUTAIRE', 'CONTRADICTION', 'INCONNU'];

  return (
    <div className="px-4 sm:px-7 py-6 max-w-[1100px] mx-auto grid gap-6">
      <header className="slab p-6 sm:p-8">
        <h1 className="text-[28px] sm:text-[34px] text-ash soft leading-tight">Ce que l'on sait, et comment on le sait</h1>
        <p className="text-ash-2 mt-2 max-w-[70ch]">
          Rien ici n'est un fait sans preuve. Chaque règle porte un statut, chaque valeur vient du fichier de paramètres et affiche sa source. Les sections ci-dessous expliquent le mécanisme ; les tableaux donnent les chiffres.
        </p>
        <ul className="m-0 mt-4 p-0 list-none flex flex-wrap gap-2">
          {statuses.map((s) => (
            <li key={s} className="flex items-center gap-2 text-xs text-ash-2">
              <StatusBadge status={s} full /> <span className="hidden sm:inline">{STATUS_DESCRIPTION[s]}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-ash-3 mt-4 m-0">Paramètres pour la version de jeu {PARAMS_META.gameVersion}, mis à jour le {PARAMS_META.updatedAt}. Dataset DofusDB {DATASET_META.gameVersion}, extrait le {DATASET_META.extractedAt.slice(0, 10)}.</p>
      </header>

      {KNOWLEDGE_SECTIONS.map((s) => {
        const items = PARAM_REGISTRY.filter((d) => s.paramSections.includes(d.section));
        return (
          <section key={s.id} className="surface-iron p-5 sm:p-6 grid gap-4" aria-labelledby={`k-${s.id}`}>
            <h2 id={`k-${s.id}`} className="text-[22px] text-molten-text soft m-0">{s.title}</h2>
            <div className="grid gap-3 max-w-[72ch] text-[15px] leading-relaxed text-ash">
              {s.prose.map((p, i) => <p key={i} className="m-0">{p}</p>)}
            </div>
            {s.certain && (
              <div className="well rounded-control p-3 border-st-primary/40">
                <p className="m-0 text-xs text-ash-3 mb-1.5">Codé en dur et testé</p>
                <ul className="m-0 pl-5 text-sm text-ash grid gap-1">
                  {s.certain.map((c, i) => <li key={i}><StatusBadge status="SOURCE PRIMAIRE" className="mr-2 align-middle" />{c}</li>)}
                </ul>
              </div>
            )}
            <ParamTable items={items} />
            {s.id === 'potions' && (
              <ul className="m-0 p-0 list-none grid grid-cols-2 md:grid-cols-4 gap-1 text-xs text-ash-2">
                {FM_POTIONS.map((p) => <li key={p.id}>{p.nameFr} · niv. {p.level}</li>)}
              </ul>
            )}
            {s.id === 'orbes' && (
              <ul className="m-0 p-0 list-none grid grid-cols-2 md:grid-cols-4 gap-1 text-xs text-ash-2">
                {FM_ORBS.map((o) => <li key={o.id}>{o.nameFr} · niv. {o.level}</li>)}
              </ul>
            )}
          </section>
        );
      })}

      <section className="surface-iron p-5 sm:p-6 grid gap-4 border-st-unknown/40" aria-labelledby="k-unknown">
        <h2 id="k-unknown" className="text-[22px] text-st-unknown soft m-0">Ce qu'on ne sait pas</h2>
        <p className="m-0 text-ash-2 max-w-[72ch]">Tout ce qui est inconnu ou contradictoire dans le fichier de paramètres. Chacune de ces lignes attend une source primaire ou une observation en jeu.</p>
        <ParamTable items={unknowns} />
        <div>
          <h3 className="text-[15px] text-ash m-0 mb-1.5">Notes hors paramètres</h3>
          <ul className="m-0 pl-5 text-sm text-ash-2 grid gap-1">
            {PARAM_NOTES.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
}
