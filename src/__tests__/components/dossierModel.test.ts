import { describe, it, expect } from 'vitest';
import { buildDossierGroups, unknownParams } from '../../components/knowledge/dossierModel';
import { PARAM_REGISTRY } from '../../data/paramRegistry';

describe('dossierModel', () => {
  it('tous les paramètres apparaissent une fois sans filtre', () => {
    const groups = buildDossierGroups(PARAM_REGISTRY, '');
    const paths = groups.flatMap((g) => g.items.map((d) => d.path));
    expect(paths.length).toBe(PARAM_REGISTRY.length);
    expect(new Set(paths).size).toBe(PARAM_REGISTRY.length);
  });
  it('densités éclatées par famille', () => {
    const ids = buildDossierGroups(PARAM_REGISTRY, '').map((g) => g.id);
    expect(ids.some((id) => id.startsWith('densities-'))).toBe(true);
    expect(ids).not.toContain('densities');
  });
  it('filtre sans accents et retire les groupes vides', () => {
    const groups = buildDossierGroups(PARAM_REGISTRY, 'vitalite');
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.every((g) => g.items.length > 0)).toBe(true);
    expect(buildDossierGroups(PARAM_REGISTRY, 'zzzz-aucun')).toEqual([]);
  });
  it('inconnus = INCONNU ou CONTRADICTION', () => {
    const u = unknownParams(PARAM_REGISTRY);
    expect(u.length).toBeGreaterThan(0);
    expect(u.every((d) => d.entry.status === 'INCONNU' || d.entry.status === 'CONTRADICTION')).toBe(true);
  });
});
