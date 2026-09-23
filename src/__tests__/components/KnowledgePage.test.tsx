// @vitest-environment jsdom
// src/__tests__/components/KnowledgePage.test.tsx
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ParamsProvider } from '../../app/ParamsProvider';
import { KnowledgePage } from '../../pages/KnowledgePage';

const originalScrollIntoView = Element.prototype.scrollIntoView;

afterEach(() => {
  cleanup();
  Element.prototype.scrollIntoView = originalScrollIntoView;
});
beforeEach(() => {
  window.location.hash = '#savoir';
  // jsdom n'implémente ni scrollTo ni scrollIntoView : sans stub, chaque appel écrit un
  // avertissement « Not implemented » sur stderr (scrollTo) ou lève (scrollIntoView, undefined).
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});
const show = () => render(<ParamsProvider><KnowledgePage /></ParamsProvider>);

describe('KnowledgePage', () => {
  it('ouvre Comprendre par défaut, Dossier depuis le hash', () => {
    show();
    expect(screen.getByRole('tab', { name: 'Comprendre' }).getAttribute('aria-selected')).toBe('true');
    cleanup();
    window.location.hash = '#savoir/dossier';
    show();
    expect(screen.getByRole('tab', { name: 'Dossier' }).getAttribute('aria-selected')).toBe('true');
  });
  it('cliquer un onglet écrit le hash', () => {
    show();
    fireEvent.click(screen.getByRole('tab', { name: 'Dossier' }));
    expect(window.location.hash).toBe('#savoir/dossier');
  });
  it('naviguer via le sommaire déplace le focus sur la section visée (M4)', () => {
    show();
    fireEvent.click(screen.getAllByRole('button', { name: 'Glossaire' })[0]);
    expect(document.activeElement?.id).toBe('glossaire');
  });
});
