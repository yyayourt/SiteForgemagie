/** Mise en forme d'une valeur de paramètre pour l'affichage (tableaux et cartes du Dossier). */
export function fmt(v: unknown): string {
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toLocaleString('fr-FR', { maximumFractionDigits: 4 });
  if (typeof v === 'boolean') return v ? 'oui' : 'non';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.join(', ');
  return JSON.stringify(v);
}
