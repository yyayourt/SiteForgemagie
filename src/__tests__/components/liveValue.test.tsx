// @vitest-environment jsdom
// src/__tests__/components/liveValue.test.tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ParamsProvider } from '../../app/ParamsProvider';
import { STORAGE_KEYS } from '../../state/persistence';
import { formatLiveValue, LiveValue } from '../../components/knowledge/liveValue';

afterEach(() => {
  cleanup();
  localStorage.removeItem(STORAGE_KEYS.params);
});

describe('formatLiveValue', () => {
  it('un objet vide affiche « aucune valeur »', () => {
    const { container } = render(<>{formatLiveValue({})}</>);
    expect(container.textContent).toBe('aucune valeur');
    expect(container.querySelector('.text-ash-3')).toBeTruthy();
  });
  it('un objet non vide affiche ses paires clé : valeur', () => {
    const { container } = render(<>{formatLiveValue({ Ta: 100, Pata: 100 })}</>);
    expect(container.textContent).toBe('Ta : 100 · Pata : 100');
  });
  it('une chaîne est affichée en code', () => {
    const { container } = render(<>{formatLiveValue('weighted')}</>);
    expect(container.querySelector('code')?.textContent).toBe('weighted');
  });
});

// F1 : LiveValue signale un profil actif (surcharge ≠ valeur du registre) avec le même
// libellé/classe que ParamTable, et reste muet quand aucune surcharge ne s'applique.
describe('LiveValue', () => {
  const show = (path: string) => render(
    <ParamsProvider>
      <LiveValue path={path} />
    </ParamsProvider>
  );

  it('sans surcharge, « profil actif » n’apparaît pas', () => {
    const { container } = show('densities.11');
    expect(container.textContent).not.toMatch(/profil actif/);
  });

  it('avec une surcharge active sur densities.11, « profil actif » apparaît', () => {
    localStorage.setItem(
      STORAGE_KEYS.params,
      JSON.stringify({ profile: { name: 'test', author: '' }, overrides: { 'densities.11': 0.3 } })
    );
    const { container } = show('densities.11');
    expect(container.textContent).toMatch(/profil actif/);
    expect(container.querySelector('.text-model')).toBeTruthy();
  });
});
