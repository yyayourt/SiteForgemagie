/**
 * Schéma « Le parcours d'une rune » : grille régulière de boutons numérotés (RUNE_PATH), 1 colonne
 * en dessous de 768 px puis 3 colonnes égales. Pas de flèches : la numérotation « Étape N » porte
 * l'ordre, ce qui évite les flèches orphelines en fin de ligne quand le nombre d'étapes ne remplit
 * pas exactement les colonnes. Chaque bouton navigue vers la section correspondante
 * (`onNavigate(step.sectionId)`).
 */
import { RUNE_PATH } from '../../content/knowledge';

export function RunePathDiagram({ onNavigate }: { onNavigate: (sectionId: string) => void }) {
  return (
    <ol className="m-0 p-0 list-none grid gap-3 md:grid-cols-3">
      {RUNE_PATH.map((step, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => onNavigate(step.sectionId)}
            className="btn-well rounded-control px-3 py-2 text-left grid gap-0.5 content-start h-full w-full"
          >
            <span className="text-[11px] text-ash-3">Étape {i + 1}</span>
            <span className="text-sm text-molten-text soft">{step.label}</span>
            <span className="text-[11px] text-ash-2 leading-snug">{step.detail}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
