/**
 * Onglet de la page « Savoir » adressé dans le hash de l'URL :
 *   '#savoir'                       → 'comprendre'
 *   '#savoir/comprendre'            → 'comprendre'
 *   '#savoir/dossier'               → 'dossier'
 *   '#savoir/dossier/<ancre>'       → 'dossier', ancre lisible séparément
 */
export type KnowledgeTab = 'comprendre' | 'dossier';

function segments(hash: string): string[] {
  return hash.replace(/^#/, '').split('/').filter((s) => s.length > 0);
}

/** '#savoir' | '#savoir/comprendre' → 'comprendre' ; '#savoir/dossier…' → 'dossier' */
export function tabFromHash(hash: string): KnowledgeTab {
  const [, tab] = segments(hash);
  return tab === 'dossier' ? 'dossier' : 'comprendre';
}

/** '#savoir' | '#savoir/dossier' (+ '/' + ancre) */
export function hashForTab(tab: KnowledgeTab, anchor?: string): string {
  if (tab === 'comprendre') return '#savoir';
  return anchor ? `#savoir/dossier/${anchor}` : '#savoir/dossier';
}

/** Ancre éventuelle : '#savoir/dossier/probability' → 'probability' */
export function anchorFromHash(hash: string): string | null {
  const [, , anchor] = segments(hash);
  return anchor ?? null;
}
