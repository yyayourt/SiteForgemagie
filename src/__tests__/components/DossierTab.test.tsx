// @vitest-environment jsdom
// src/__tests__/components/DossierTab.test.tsx
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ParamsProvider } from '../../app/ParamsProvider';
import { DossierTab } from '../../components/knowledge/DossierTab';
import { unknownParams } from '../../components/knowledge/dossierModel';
import { PARAM_REGISTRY } from '../../data/paramRegistry';

afterEach(cleanup);
const show = (focusSection?: string | null) => render(<ParamsProvider><DossierTab focusSection={focusSection} /></ParamsProvider>);

describe('DossierTab', () => {
  it('une carte « à mesurer » par paramètre INCONNU ou CONTRADICTION', () => {
    show();
    expect(screen.getAllByTestId('measure-card').length).toBe(unknownParams(PARAM_REGISTRY).length);
  });
  it('la recherche filtre et annonce l’absence de résultat', () => {
    show();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher un paramètre' }), { target: { value: 'zzzz-aucun' } });
    expect(screen.getByText('Aucun paramètre ne correspond.')).toBeTruthy();
  });
  it('une ligne se déplie pour montrer source et chemin', () => {
    show();
    const btn = screen.getAllByRole('button', { name: /détails/ })[0];
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });
  it('focusSection « densities » défile vers le premier groupe dossier-densities-*', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    show('densities');
    expect(scrollIntoView).toHaveBeenCalled();
  });
});
