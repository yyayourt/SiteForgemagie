/**
 * Page « Savoir » : en-tête (titre, légende des cinq statuts, versions), deux onglets
 * Comprendre / Dossier synchronisés avec le hash de l'URL (`#savoir`, `#savoir/dossier`,
 * `#savoir/dossier/<ancre>`), sommaire latéral collant (KnowledgeToc) et les deux composants
 * d'onglet. App.tsx ne lit que le premier segment du hash (`savoir`) : cette page gère le reste.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PARAMS_META } from '../data/params';
import { PARAM_REGISTRY } from '../data/paramRegistry';
import { DATASET_META } from '../data/dataset';
import { UNDERSTAND_SECTIONS } from '../content/knowledge';
import { StatusBadge, STATUS_DESCRIPTION } from '../components/shell/Badges';
import type { EpistemicStatus } from '../data/params';
import { KnowledgeToc, useActiveSection, type TocEntry } from '../components/knowledge/KnowledgeToc';
import { UnderstandTab } from '../components/knowledge/UnderstandTab';
import { DossierTab } from '../components/knowledge/DossierTab';
import { buildDossierGroups } from '../components/knowledge/dossierModel';
import { tabFromHash, hashForTab, anchorFromHash, type KnowledgeTab } from '../components/knowledge/knowledgeTab';

const STATUSES: EpistemicStatus[] = ['SOURCE PRIMAIRE', 'MODÈLE EMPIRIQUE', 'HYPOTHÈSE COMMUNAUTAIRE', 'CONTRADICTION', 'INCONNU'];

const COMPRENDRE_ENTRIES: TocEntry[] = [
  { id: 'parcours', label: 'Le parcours d’une rune' },
  ...UNDERSTAND_SECTIONS.map((s) => ({ id: s.id, label: s.title })),
  { id: 'glossaire', label: 'Glossaire' },
];

function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Page « Savoir », générée depuis empirical_params.json + le contenu de src/content/. */
export function KnowledgePage() {
  const [tab, setTab] = useState<KnowledgeTab>(() => tabFromHash(window.location.hash));
  const [focusSection, setFocusSection] = useState<string | null>(() => anchorFromHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => {
      setTab(tabFromHash(window.location.hash));
      setFocusSection(anchorFromHash(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const goToTab = useCallback((next: KnowledgeTab, anchor?: string) => {
    setTab(next);
    setFocusSection(anchor ?? null);
    window.location.hash = hashForTab(next, anchor);
    window.scrollTo({ top: 0 });
  }, []);

  const handleOpenDossier = useCallback((section: string) => goToTab('dossier', section), [goToTab]);

  const dossierGroups = useMemo(() => buildDossierGroups(PARAM_REGISTRY, ''), []);
  const dossierEntries = useMemo<TocEntry[]>(
    () => [...dossierGroups.map((g) => ({ id: `dossier-${g.id}`, label: g.label })), { id: 'dossier-mesurer', label: 'Aide-nous à mesurer' }],
    [dossierGroups]
  );

  const entries = tab === 'comprendre' ? COMPRENDRE_ENTRIES : dossierEntries;
  const ids = useMemo(() => entries.map((e) => e.id), [entries]);
  const activeId = useActiveSection(ids);

  return (
    <div className="px-4 sm:px-7 py-6 max-w-[1200px] mx-auto grid gap-6">
      <header className="slab p-6 sm:p-8 grid gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[34px] text-ash soft leading-tight">Ce que l'on sait, et comment on le sait</h1>
          <p className="text-ash-2 mt-2 max-w-[70ch] m-0">
            Rien ici n'est un fait sans preuve. Chaque règle porte un statut, chaque valeur vient du fichier de paramètres et affiche sa source.
          </p>
        </div>

        <details open className="text-sm">
          <summary className="cursor-pointer select-none text-ash-2">Les cinq statuts</summary>
          <ul className="m-0 mt-3 p-0 list-none flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <li key={s} className="flex items-center gap-2 text-xs text-ash-2">
                <StatusBadge status={s} full /> <span className="hidden sm:inline">{STATUS_DESCRIPTION[s]}</span>
              </li>
            ))}
          </ul>
        </details>

        <p className="text-xs text-ash-3 m-0">
          Paramètres pour la version de jeu {PARAMS_META.gameVersion}, mis à jour le {PARAMS_META.updatedAt}. Dataset DofusDB {DATASET_META.gameVersion}, extrait le {DATASET_META.extractedAt.slice(0, 10)}.
        </p>

        <div className="well rounded-control p-0.5 grid grid-cols-2 gap-0.5 max-w-xs" role="tablist" aria-label="Savoir">
          <button
            type="button"
            role="tab"
            id="tab-comprendre"
            aria-selected={tab === 'comprendre'}
            aria-controls="knowledge-panel"
            onClick={() => goToTab('comprendre')}
            className={`px-3 py-1.5 rounded-[8px] text-sm ${tab === 'comprendre' ? 'bg-iron-2 text-ash shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]' : 'text-ash-2 hover:text-ash'}`}
          >
            Comprendre
          </button>
          <button
            type="button"
            role="tab"
            id="tab-dossier"
            aria-selected={tab === 'dossier'}
            aria-controls="knowledge-panel"
            onClick={() => goToTab('dossier')}
            className={`px-3 py-1.5 rounded-[8px] text-sm ${tab === 'dossier' ? 'bg-iron-2 text-ash shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]' : 'text-ash-2 hover:text-ash'}`}
          >
            Dossier
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] items-start">
        <KnowledgeToc entries={entries} activeId={activeId} onNavigate={scrollToSection} />

        <div id="knowledge-panel" role="tabpanel" aria-labelledby={tab === 'comprendre' ? 'tab-comprendre' : 'tab-dossier'} className="min-w-0">
          {tab === 'comprendre' ? (
            <UnderstandTab onNavigate={scrollToSection} onOpenDossier={handleOpenDossier} />
          ) : (
            <DossierTab focusSection={focusSection} />
          )}
        </div>
      </div>
    </div>
  );
}
