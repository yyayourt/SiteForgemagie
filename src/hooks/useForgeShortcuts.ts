/**
 * Raccourcis de l'atelier : ↑/↓ ligne, 1/2/3 palier, Espace fusionner, / filtre de la
 * palette, ? aide. Ignorés dans un champ de saisie, avec Ctrl/Meta/Alt (Ctrl+Z/Y restent
 * dans App.tsx), et quand un dialogue modal (ParamsDrawer) est ouvert au-dessus de l'atelier.
 * Espace est intercepté (preventDefault) SAUF quand le focus est déjà sur un élément à
 * activation native (bouton, résumé, lien, onglet) : là, l'activation native fait foi et
 * Espace ne fusionne pas — la touche Entrée garde ce rôle dans tous les cas.
 */
import { useEffect, useRef } from 'react';

export interface ForgeShortcutHandlers {
  onMove(dir: 1 | -1): void;
  onTier(index: 0 | 1 | 2): void;
  onFuse(): void;
  onFocusSearch(): void;
  onToggleHelp(): void;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
}

/** Vrai si la cible est (ou est dans) un élément dont Espace déclenche déjà l'activation native. */
function isNativeActivationTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest('button, summary, a, [role="tab"], [role="button"]');
}

/** Vrai si un dialogue modal (ex. ParamsDrawer) est ouvert au-dessus de l'atelier. */
function isModalOpen(): boolean {
  return !!document.querySelector('[aria-modal="true"]');
}

function tierFromCode(code: string): 0 | 1 | 2 | null {
  switch (code) {
    case 'Digit1': case 'Numpad1': return 0;
    case 'Digit2': case 'Numpad2': return 1;
    case 'Digit3': case 'Numpad3': return 2;
    default: return null;
  }
}

export function useForgeShortcuts(handlers: ForgeShortcutHandlers, enabled: boolean): void {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      if (isModalOpen()) return;
      const h = ref.current;
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); h.onMove(1); break;
        case 'ArrowUp': e.preventDefault(); h.onMove(-1); break;
        case '1': h.onTier(0); break;
        case '2': h.onTier(1); break;
        case '3': h.onTier(2); break;
        case ' ':
          if (isNativeActivationTarget(e.target)) return;
          e.preventDefault();
          h.onFuse();
          break;
        case '/': e.preventDefault(); h.onFocusSearch(); break;
        case '?': h.onToggleHelp(); break;
        default: {
          const t = tierFromCode(e.code);
          if (t !== null) h.onTier(t);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
