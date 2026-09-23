/**
 * Onglet « Comprendre » de la page Savoir : schéma du parcours d'une rune, une section par
 * thème (UNDERSTAND_SECTIONS, squelette fixe En bref / Comment ça marche / Exemple / Sûr / Pas
 * sûr / Voir le dossier), puis le glossaire (GLOSSARY).
 */
import { UNDERSTAND_SECTIONS, type KnowledgeExample, type KnowledgeItem } from '../../content/knowledge';
import { GLOSSARY } from '../../content/glossary';
import { StatusBadge } from '../shell/Badges';
import { KnowledgeItemList } from './KnowledgeItemList';
import { RunePathDiagram } from './RunePathDiagram';
import { LiveValue } from './liveValue';

/** Valeur live d'un paramètre cité dans un exemple : « libellé : valeur », avec son propre statut (F2). */
function ExampleParamValue({ path }: { path: string }) {
  return (
    <span className="text-[11px] text-ash-3">
      <LiveValue path={path} withLabel withBadge />
    </span>
  );
}

function ExampleBlock({ example }: { example: KnowledgeExample | null }) {
  if (!example) return <p className="text-ash-3 text-sm m-0">Aucun exemple documenté.</p>;
  return (
    <div className="border-l-2 border-molten-text/60 pl-3 grid gap-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-ash font-medium">{example.title}</span>
        <StatusBadge status={example.status} />
      </div>
      <ul className="m-0 pl-4 text-sm text-ash-2 grid gap-1">
        {example.lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
      <span className="text-[11px] text-ash-3">{example.source}</span>
      {example.params && example.params.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {example.params.map((p) => (
            <ExampleParamValue key={p} path={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function CertaintyColumn({ title, dotClassName, items, emptyText }: {
  title: string;
  dotClassName: string;
  items: KnowledgeItem[];
  emptyText: string;
}) {
  return (
    <div className="grid gap-2 content-start">
      <h3 className="flex items-center gap-2 text-sm text-ash m-0">
        <span className={`w-2 h-2 rounded-full ${dotClassName}`} aria-hidden="true" />
        {title}
      </h3>
      {items.length === 0 ? <p className="text-ash-3 text-sm m-0">{emptyText}</p> : <KnowledgeItemList items={items} />}
    </div>
  );
}

export function UnderstandTab({
  onNavigate,
  onOpenDossier,
}: {
  onNavigate: (id: string) => void;
  onOpenDossier: (section: string) => void;
}) {
  return (
    <div className="grid gap-10">
      <section id="parcours" tabIndex={-1} aria-labelledby="parcours-title" className="grid gap-3">
        <h2 id="parcours-title" className="text-[20px] text-molten-text soft m-0">
          Le parcours d’une rune
        </h2>
        <RunePathDiagram onNavigate={onNavigate} />
      </section>

      {UNDERSTAND_SECTIONS.map((s) => (
        <section key={s.id} id={s.id} tabIndex={-1} aria-labelledby={`${s.id}-title`} className="grid gap-4">
          <h2 id={`${s.id}-title`} className="text-[20px] text-molten-text soft m-0">
            {s.title}
          </h2>

          <div className="well rounded-control p-4">
            <h3 className="text-sm text-ash-2 m-0 mb-2">En bref</h3>
            <KnowledgeItemList items={s.brief} />
          </div>

          <div>
            <h3 className="text-sm text-ash-2 m-0 mb-2">Comment ça marche</h3>
            <KnowledgeItemList items={s.steps} ordered />
          </div>

          <div>
            <h3 className="text-sm text-ash-2 m-0 mb-2">Exemple</h3>
            <ExampleBlock example={s.example} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <CertaintyColumn
              title="Sûr"
              dotClassName="bg-st-primary"
              items={s.certain}
              emptyText="Rien d’établi pour l’instant."
            />
            <CertaintyColumn
              title="Pas sûr"
              dotClassName="bg-st-unknown"
              items={s.uncertain}
              emptyText="Rien d’incertain recensé pour l’instant."
            />
          </div>

          <button
            type="button"
            onClick={() => onOpenDossier(s.dossierSections[0])}
            className="btn-well rounded-control px-3 py-2 text-sm justify-self-start"
          >
            Voir le dossier →
          </button>
        </section>
      ))}

      <section id="glossaire" tabIndex={-1} aria-labelledby="glossaire-title" className="grid gap-3">
        <h2 id="glossaire-title" className="text-[20px] text-molten-text soft m-0">
          Glossaire
        </h2>
        <dl className="m-0 grid gap-4">
          {GLOSSARY.map((g) => (
            <div key={g.id}>
              <dt id={`g-${g.id}`} role="term" className="flex items-center gap-2 text-sm text-ash font-medium">
                {g.term}
                {g.status && <StatusBadge status={g.status} />}
              </dt>
              <dd className="m-0 mt-1 text-sm text-ash-2">{g.definition}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
