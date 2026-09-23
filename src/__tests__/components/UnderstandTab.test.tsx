// @vitest-environment jsdom
// src/__tests__/components/UnderstandTab.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ParamsProvider } from '../../app/ParamsProvider';
import { UnderstandTab } from '../../components/knowledge/UnderstandTab';
import { UNDERSTAND_SECTIONS, RUNE_PATH } from '../../content/knowledge';
import { GLOSSARY } from '../../content/glossary';

afterEach(cleanup);
const show = (onNavigate = vi.fn(), onOpenDossier = vi.fn()) => {
  render(<ParamsProvider><UnderstandTab onNavigate={onNavigate} onOpenDossier={onOpenDossier} /></ParamsProvider>);
  return { onNavigate, onOpenDossier };
};

describe('UnderstandTab', () => {
  it('une section par thème + parcours + glossaire', () => {
    show();
    for (const s of UNDERSTAND_SECTIONS) expect(document.getElementById(s.id)).toBeTruthy();
    expect(document.getElementById('parcours')).toBeTruthy();
    expect(document.getElementById('glossaire')).toBeTruthy();
    expect(screen.getAllByRole('term').length).toBe(GLOSSARY.length);
  });
  it('le schéma navigue vers la section de l’étape', () => {
    const { onNavigate } = show();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(RUNE_PATH[0].label) }));
    expect(onNavigate).toHaveBeenCalledWith(RUNE_PATH[0].sectionId);
  });
  it('« Voir le dossier » ouvre la section de paramètres liée', () => {
    const { onOpenDossier } = show();
    fireEvent.click(screen.getAllByRole('button', { name: /Voir le dossier/ })[0]);
    expect(onOpenDossier).toHaveBeenCalledWith(UNDERSTAND_SECTIONS[0].dossierSections[0]);
  });
  it('les sections sans exemple le disent', () => {
    show();
    const without = UNDERSTAND_SECTIONS.filter((s) => s.example === null).length;
    expect(screen.queryAllByText('Aucun exemple documenté.').length).toBe(without);
  });
});
