import { describe, it, expect } from 'vitest';
import { UNDERSTAND_SECTIONS, RUNE_PATH, MEASUREMENTS } from '../../content/knowledge';
import { GLOSSARY } from '../../content/glossary';
import { PARAM_BY_PATH, PARAM_REGISTRY } from '../../data/paramRegistry';
import { buildDossierGroups } from '../../components/knowledge/dossierModel';

const STATUSES = ['SOURCE PRIMAIRE', 'MODÈLE EMPIRIQUE', 'HYPOTHÈSE COMMUNAUTAIRE', 'CONTRADICTION', 'INCONNU'];
const REGISTRY_SECTIONS = new Set(PARAM_REGISTRY.map((d) => d.section));

describe('contenu Comprendre', () => {
  it('huit sections dans l’ordre prévu', () => {
    expect(UNDERSTAND_SECTIONS.map((s) => s.id)).toEqual(['poids', 'chances', 'pertes', 'over-exo', 'transcendance', 'craft-orbes', 'brisage', 'potions']);
  });

  it.each(UNDERSTAND_SECTIONS.map((s) => [s.id, s] as const))('%s : ossature complète', (_id, s) => {
    expect(s.brief.length).toBeGreaterThanOrEqual(2);
    expect(s.brief.length).toBeLessThanOrEqual(4);
    expect(s.steps.length).toBeGreaterThanOrEqual(2);
    expect(s.certain.length + s.uncertain.length).toBeGreaterThan(0);
    expect(s.dossierSections.length).toBeGreaterThan(0);
    for (const sec of s.dossierSections) expect(REGISTRY_SECTIONS.has(sec)).toBe(true);
  });

  it('chaque item a un statut valide, une source, et un paramètre existant s’il en cite un', () => {
    const items = UNDERSTAND_SECTIONS.flatMap((s) => [...s.brief, ...s.steps, ...s.certain, ...s.uncertain]);
    for (const it of items) {
      expect(STATUSES).toContain(it.status);
      expect(it.source.length).toBeGreaterThan(0);
      expect(it.text).not.toMatch(/\b(EP|ERR|ANA|S1|S2|REC|OBS):\d/); // pas de références de ligne brutes
      if (it.param) expect(PARAM_BY_PATH.has(it.param)).toBe(true);
    }
    for (const s of UNDERSTAND_SECTIONS) {
      if (!s.example) continue;
      expect(STATUSES).toContain(s.example.status);
      for (const p of s.example.params ?? []) expect(PARAM_BY_PATH.has(p)).toBe(true);
    }
  });

  // M5 : « Voir le dossier » ouvre onOpenDossier(s.dossierSections[0]) ; DossierTab.tsx cherche
  // ensuite un id `dossier-<focusSection>` exact ou un préfixe `dossier-<focusSection>-` (densités
  // éclatées par famille). Chaque dossierSections[0] doit donc résoudre vers un vrai groupe.
  it('dossierSections[0] de chaque section résout vers un groupe du Dossier (exact ou préfixe)', () => {
    const groups = buildDossierGroups(PARAM_REGISTRY, '');
    for (const s of UNDERSTAND_SECTIONS) {
      const focusSection = s.dossierSections[0];
      const resolves = groups.some((g) => g.id === focusSection || g.id.startsWith(`${focusSection}-`));
      expect(resolves, `${s.id} → dossierSections[0]="${focusSection}" ne résout vers aucun groupe`).toBe(true);
    }
  });

  it('parcours d’une rune : 5 à 6 étapes pointant vers des sections existantes', () => {
    expect(RUNE_PATH.length).toBeGreaterThanOrEqual(5);
    expect(RUNE_PATH.length).toBeLessThanOrEqual(6);
    const ids = new Set(UNDERSTAND_SECTIONS.map((s) => s.id));
    for (const step of RUNE_PATH) expect(ids.has(step.sectionId)).toBe(true);
  });

  it('mesures : clés = paramètres INCONNU ou CONTRADICTION du registre', () => {
    for (const path of Object.keys(MEASUREMENTS)) {
      const d = PARAM_BY_PATH.get(path);
      expect(d, path).toBeDefined();
      expect(['INCONNU', 'CONTRADICTION']).toContain(d!.entry.status);
    }
  });

  // F2 : un item qui cite un paramètre affiche désormais le statut RÉEL du paramètre (badge sur
  // LiveValue), à côté de son propre statut. Les deux doivent rester en accord, sauf désaccord
  // documenté explicitement dans le texte (allow-list ci-dessous).
  const STATUS_DISAGREEMENT_ALLOWED = ['params.overCapScope'];
  it('un item qui cite un paramètre porte le même statut que ce paramètre (sauf désaccord documenté)', () => {
    const items = UNDERSTAND_SECTIONS.flatMap((s) => [...s.brief, ...s.steps, ...s.certain, ...s.uncertain]);
    for (const it of items) {
      if (!it.param) continue;
      if (STATUS_DISAGREEMENT_ALLOWED.includes(it.param)) continue;
      const d = PARAM_BY_PATH.get(it.param)!;
      expect(it.status, `${it.param} : item=${it.status} vs registre=${d.entry.status} — "${it.text}"`).toBe(d.entry.status);
    }
  });
});

describe('glossaire', () => {
  it('12 à 20 termes, ids uniques, définitions non vides', () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(12);
    expect(GLOSSARY.length).toBeLessThanOrEqual(20);
    expect(new Set(GLOSSARY.map((g) => g.id)).size).toBe(GLOSSARY.length);
    for (const g of GLOSSARY) expect(g.definition.length).toBeGreaterThan(10);
  });
});
