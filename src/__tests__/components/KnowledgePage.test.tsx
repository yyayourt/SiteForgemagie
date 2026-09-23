// @vitest-environment jsdom
// src/__tests__/components/KnowledgePage.test.tsx
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ParamsProvider } from '../../app/ParamsProvider';
import { KnowledgePage } from '../../pages/KnowledgePage';

afterEach(cleanup);
beforeEach(() => { window.location.hash = '#savoir'; });
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
});
