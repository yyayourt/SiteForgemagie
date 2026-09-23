// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, cleanup, fireEvent } from '@testing-library/react';
import { useForgeShortcuts, type ForgeShortcutHandlers } from '../../hooks/useForgeShortcuts';

afterEach(cleanup);

const handlers = (): ForgeShortcutHandlers => ({
  onMove: vi.fn(),
  onTier: vi.fn(),
  onFuse: vi.fn(),
  onFocusSearch: vi.fn(),
  onToggleHelp: vi.fn(),
});

describe('useForgeShortcuts', () => {
  it("flèches, 1/2/3, Espace, / et ?", () => {
    const h = handlers();
    renderHook(() => useForgeShortcuts(h, true));
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    fireEvent.keyDown(window, { key: '2' });
    fireEvent.keyDown(window, { key: ' ' });
    fireEvent.keyDown(window, { key: '/' });
    fireEvent.keyDown(window, { key: '?' });
    expect(h.onMove).toHaveBeenNthCalledWith(1, 1);
    expect(h.onMove).toHaveBeenNthCalledWith(2, -1);
    expect(h.onTier).toHaveBeenCalledWith(1);
    expect(h.onFuse).toHaveBeenCalledTimes(1);
    expect(h.onFocusSearch).toHaveBeenCalledTimes(1);
    expect(h.onToggleHelp).toHaveBeenCalledTimes(1);
  });

  it("Espace empêche l'action par défaut (bouton focalisé, défilement)", () => {
    renderHook(() => useForgeShortcuts(handlers(), true));
    const ev = new KeyboardEvent('keydown', { key: ' ', cancelable: true, bubbles: true });
    window.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  it("ignoré dans un champ de saisie, avec un modificateur, ou désactivé", () => {
    const h = handlers();
    const { rerender } = renderHook(({ on }) => useForgeShortcuts(h, on), { initialProps: { on: true } });
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: ' ' });
    fireEvent.keyDown(window, { key: '1', ctrlKey: true });
    rerender({ on: false });
    fireEvent.keyDown(window, { key: ' ' });
    expect(h.onFuse).not.toHaveBeenCalled();
    expect(h.onTier).not.toHaveBeenCalled();
    input.remove();
  });

  it('ignoré quand un dialogue modal (ParamsDrawer) est ouvert (F1)', () => {
    const h = handlers();
    renderHook(() => useForgeShortcuts(h, true));
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    document.body.appendChild(dialog);
    fireEvent.keyDown(window, { key: ' ' });
    fireEvent.keyDown(window, { key: '1' });
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(h.onFuse).not.toHaveBeenCalled();
    expect(h.onTier).not.toHaveBeenCalled();
    expect(h.onMove).not.toHaveBeenCalled();
    dialog.remove();
  });

  it('Espace laisse passer l\'activation native quand la cible est un bouton focalisé (F2)', () => {
    const h = handlers();
    renderHook(() => useForgeShortcuts(h, true));
    const button = document.createElement('button');
    document.body.appendChild(button);
    const ev = new KeyboardEvent('keydown', { key: ' ', cancelable: true, bubbles: true });
    Object.defineProperty(ev, 'target', { value: button });
    button.dispatchEvent(ev);
    expect(h.onFuse).not.toHaveBeenCalled();
    expect(ev.defaultPrevented).toBe(false);
    button.remove();
  });

  it('AZERTY : & avec code Digit1 choisit le palier 1 (F5)', () => {
    const h = handlers();
    renderHook(() => useForgeShortcuts(h, true));
    fireEvent.keyDown(window, { key: '&', code: 'Digit1' });
    expect(h.onTier).toHaveBeenCalledWith(0);
  });
});
