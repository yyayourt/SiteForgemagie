// @vitest-environment jsdom
// src/__tests__/components/KnowledgeToc.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { KnowledgeToc } from '../../components/knowledge/KnowledgeToc';

afterEach(cleanup);

describe('KnowledgeToc', () => {
  it('marque l’entrée active et navigue au clic', () => {
    const onNavigate = vi.fn();
    render(<KnowledgeToc entries={[{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Bêta' }]} activeId="b" onNavigate={onNavigate} />);
    const links = screen.getAllByRole('button', { name: 'Bêta' });
    expect(links[0].getAttribute('aria-current')).toBe('true');
    fireEvent.click(screen.getAllByRole('button', { name: 'Alpha' })[0]);
    expect(onNavigate).toHaveBeenCalledWith('a');
  });
});
