import { describe, it, expect } from 'vitest';
import { anchorFromHash, hashForTab, tabFromHash } from '../../components/knowledge/knowledgeTab';

describe('onglets Savoir dans le hash', () => {
  it('lit l’onglet', () => {
    expect(tabFromHash('#savoir')).toBe('comprendre');
    expect(tabFromHash('#savoir/comprendre')).toBe('comprendre');
    expect(tabFromHash('#savoir/dossier')).toBe('dossier');
    expect(tabFromHash('#savoir/dossier/probability')).toBe('dossier');
    expect(tabFromHash('')).toBe('comprendre');
  });
  it('écrit l’onglet et l’ancre', () => {
    expect(hashForTab('comprendre')).toBe('#savoir');
    expect(hashForTab('dossier')).toBe('#savoir/dossier');
    expect(hashForTab('dossier', 'probability')).toBe('#savoir/dossier/probability');
  });
  it('lit l’ancre', () => {
    expect(anchorFromHash('#savoir/dossier/probability')).toBe('probability');
    expect(anchorFromHash('#savoir/dossier')).toBeNull();
  });
});
