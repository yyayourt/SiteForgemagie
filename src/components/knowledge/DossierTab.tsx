/**
 * Onglet « Dossier » de la page Savoir : recherche, tableaux de paramètres groupés (dossierModel),
 * listes potions/orbes, puis les cartes « Aide-nous à mesurer ».
 */
import { useEffect, useState } from 'react';
import { PARAM_NOTES, PARAM_REGISTRY } from '../../data/paramRegistry';
import { FM_ORBS, FM_POTIONS } from '../../data/dataset';
import { buildDossierGroups } from './dossierModel';
import { ParamTable } from './ParamTable';
import { MeasureCards } from './MeasureCards';

export function DossierTab({ focusSection }: { focusSection?: string | null }) {
  const [query, setQuery] = useState('');
  const groups = buildDossierGroups(PARAM_REGISTRY, query);

  useEffect(() => {
    if (!focusSection) return;
    // focusSection vient du hash de l'URL : ne jamais l'interpoler dans un sélecteur CSS (un `"` y
    // ferait planter querySelector). On liste les sections du Dossier et on compare les id en JS :
    // correspondance exacte d'abord (ex. 'overCap' -> 'dossier-overCap'), puis préfixe de groupe pour
    // les densités éclatées en `dossier-densities-<famille>` (focus 'densities' -> premier groupe).
    const target = Array.from(document.querySelectorAll('[id^="dossier-"]')).find(
      (el) => el.id === `dossier-${focusSection}` || el.id.startsWith(`dossier-${focusSection}-`)
    );
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- au montage seulement
  }, []);

  return (
    // flex-col (pas grid) : un item flex-col s'étire par défaut à la largeur du conteneur au lieu
    // de se dimensionner sur son contenu (table large), ce qui évite une fuite de largeur au-delà
    // du scroll interne de ParamTable (overflow-x-auto) jusqu'au document.
    <div className="flex flex-col gap-6 min-w-0">
      <input
        type="search"
        aria-label="Rechercher un paramètre"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un paramètre…"
        className="w-full max-w-md px-3 py-2 rounded-control border border-iron-edge bg-well text-ash text-sm"
      />

      {groups.length === 0 && <p className="text-ash-2 text-sm m-0">Aucun paramètre ne correspond.</p>}

      {groups.map((g) => (
        <section key={g.id} id={`dossier-${g.id}`} tabIndex={-1} className="flex flex-col gap-3 min-w-0" aria-labelledby={`dossier-${g.id}-title`}>
          <h2 id={`dossier-${g.id}-title`} className="text-[20px] text-molten-text soft m-0">
            {g.label}
          </h2>
          <ParamTable items={g.items} />
          {g.id === 'potions' && (
            <ul className="m-0 p-0 list-none grid grid-cols-2 md:grid-cols-4 gap-1 text-xs text-ash-2">
              {FM_POTIONS.map((p) => (
                <li key={p.id}>
                  {p.nameFr} · niv. {p.level}
                </li>
              ))}
            </ul>
          )}
          {g.id === 'craft' && (
            <ul className="m-0 p-0 list-none grid grid-cols-2 md:grid-cols-4 gap-1 text-xs text-ash-2">
              {FM_ORBS.map((o) => (
                <li key={o.id}>
                  {o.nameFr} · niv. {o.level}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section id="dossier-mesurer" tabIndex={-1} className="flex flex-col gap-3 min-w-0" aria-labelledby="dossier-mesurer-title">
        <h2 id="dossier-mesurer-title" className="text-[20px] text-st-unknown soft m-0">
          Aide-nous à mesurer
        </h2>
        <MeasureCards />
        <div>
          <h3 className="text-[15px] text-ash m-0 mb-1.5">Notes hors paramètres</h3>
          <ul className="m-0 pl-5 text-sm text-ash-2 grid gap-1">
            {PARAM_NOTES.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
