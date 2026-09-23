/**
 * Schéma « Le parcours d'une rune » : suite de boutons numérotés (RUNE_PATH), reliés par des
 * flèches, horizontale à partir de 768 px, verticale en dessous. Chaque bouton navigue vers la
 * section correspondante (`onNavigate(step.sectionId)`).
 */
import { RUNE_PATH } from '../../content/knowledge';

export function RunePathDiagram({ onNavigate }: { onNavigate: (sectionId: string) => void }) {
  return (
    <ol className="m-0 p-0 list-none flex flex-col md:flex-row md:flex-wrap items-stretch gap-2">
      {RUNE_PATH.map((step, i) => (
        <li key={i} className="flex flex-col md:flex-row items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate(step.sectionId)}
            className="btn-well rounded-control px-3 py-2 text-left grid gap-0.5 max-w-[220px]"
          >
            <span className="text-[11px] text-ash-3">Étape {i + 1}</span>
            <span className="text-sm text-molten-text soft">{step.label}</span>
            <span className="text-[11px] text-ash-2 leading-snug">{step.detail}</span>
          </button>
          {i < RUNE_PATH.length - 1 && (
            <span className="text-ash-3 text-lg" aria-hidden="true">
              <span className="md:hidden">↓</span>
              <span className="hidden md:inline">→</span>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
