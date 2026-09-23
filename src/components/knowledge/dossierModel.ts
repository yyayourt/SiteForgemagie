/**
 * Regroupe le registre de paramètres (src/data/paramRegistry.ts) pour l'onglet « Dossier » :
 * groupes dans l'ordre SECTION_ORDER, densités éclatées par famille (statCaps.ts), puis les
 * sections restantes du registre (ex. objectNonNaturalCap, absent de SECTION_ORDER). Filtre de
 * recherche insensible aux accents, sur le libellé, le chemin, la note et la source ; les
 * groupes vides après filtre sont retirés.
 */
import { normalizeSearch } from '../atelier/paletteModel';
import { CATEGORY_LABELS, CATEGORY_ORDER, getStatCategory } from '../../data/statCaps';
import { SECTION_LABELS, SECTION_ORDER, type ParamDescriptor } from '../../data/paramRegistry';

export interface DossierGroup {
  id: string;
  label: string;
  items: ParamDescriptor[];
}

/** Libellés de sections absentes de SECTION_ORDER / SECTION_LABELS (ex. objectNonNaturalCap). */
const EXTRA_SECTION_LABELS: Record<string, string> = {
  objectNonNaturalCap: "Plafond de l'objet",
};

function sectionLabel(section: string): string {
  return SECTION_LABELS[section] ?? EXTRA_SECTION_LABELS[section] ?? section;
}

function matchesQuery(d: ParamDescriptor, q: string): boolean {
  if (!q) return true;
  const haystacks = [d.label, d.path, d.entry.note, d.entry.source, d.subgroup];
  return haystacks.some((h) => typeof h === 'string' && normalizeSearch(h).includes(q));
}

function densityCategory(d: ParamDescriptor): (typeof CATEGORY_ORDER)[number] {
  const characteristicId = Number(d.path.split('.').pop());
  return getStatCategory(characteristicId);
}

/** Groupes du Dossier : ordre SECTION_ORDER (densités éclatées par famille) puis sections restantes. */
export function buildDossierGroups(registry: readonly ParamDescriptor[], query: string): DossierGroup[] {
  const q = normalizeSearch(query);
  const groups: DossierGroup[] = [];

  const densityItems = registry.filter((d) => d.section === 'densities');
  for (const category of CATEGORY_ORDER) {
    const items = densityItems.filter((d) => densityCategory(d) === category).filter((d) => matchesQuery(d, q));
    if (items.length > 0) {
      groups.push({ id: `densities-${category}`, label: `Densités · ${CATEGORY_LABELS[category]}`, items });
    }
  }

  const otherSections = [...new Set(registry.filter((d) => d.section !== 'densities').map((d) => d.section))];
  const orderedSections = [
    ...SECTION_ORDER.filter((s) => s !== 'densities'),
    ...otherSections.filter((s) => !SECTION_ORDER.includes(s)),
  ];

  for (const section of orderedSections) {
    const items = registry.filter((d) => d.section === section).filter((d) => matchesQuery(d, q));
    if (items.length > 0) {
      groups.push({ id: section, label: sectionLabel(section), items });
    }
  }

  return groups;
}

/** Paramètres INCONNU ou CONTRADICTION : matière première des cartes « Aide-nous à mesurer ». */
export function unknownParams(registry: readonly ParamDescriptor[]): ParamDescriptor[] {
  return registry.filter((d) => d.entry.status === 'INCONNU' || d.entry.status === 'CONTRADICTION');
}
