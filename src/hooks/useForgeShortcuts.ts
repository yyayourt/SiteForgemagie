/**
 * Raccourcis de l'atelier : ↑/↓ ligne, 1/2/3 palier, Espace fusionner, / filtre de la
 * palette, ? aide. Ignorés dans un champ de saisie et avec Ctrl/Meta/Alt (Ctrl+Z/Y restent
 * dans App.tsx). Espace est intercepté (preventDefault) : sinon il activerait aussi le
 * bouton focalisé — la touche Entrée garde ce rôle.
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
      const h = ref.current;
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); h.onMove(1); break;
        case 'ArrowUp': e.preventDefault(); h.onMove(-1); break;
        case '1': h.onTier(0); break;
        case '2': h.onTier(1); break;
        case '3': h.onTier(2); break;
        case ' ': e.preventDefault(); h.onFuse(); break;
        case '/': e.preventDefault(); h.onFocusSearch(); break;
        case '?': h.onToggleHelp(); break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
