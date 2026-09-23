// @vitest-environment jsdom
// src/__tests__/components/liveValue.test.tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { formatLiveValue } from '../../components/knowledge/liveValue';

afterEach(cleanup);

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
