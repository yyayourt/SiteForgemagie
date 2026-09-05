/**
 * Glyphes de runes ORIGINAUX (SVG dessinés ici, aucune ressource Ankama).
 * Un glyphe par famille de caractéristique, gravé en tête de ligne d'objet.
 */

import type { StatCapCategory } from '../../data/statCaps';

interface Props {
  category: StatCapCategory;
  /** Couleur de trait : hérite de `currentColor` par défaut. */
  className?: string;
  size?: number;
  title?: string;
}

const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function paths(category: StatCapCategory) {
  switch (category) {
    case 'special': // PA / PM / PO : triangle pointé, l'action
      return (
        <>
          <path d="M12 3 L20 19 L4 19 Z" {...STROKE} />
          <circle cx="12" cy="14" r="1.6" fill="currentColor" stroke="none" />
        </>
      );
    case 'primary': // caractéristiques : losange à double trait
      return (
        <>
          <path d="M12 3 L21 12 L12 21 L3 12 Z" {...STROKE} />
          <path d="M12 7.5 L16.5 12 L12 16.5 L7.5 12 Z" {...STROKE} strokeWidth={1.1} />
        </>
      );
    case 'damage': // dommages : éclat
      return (
        <>
          <path d="M12 2.5 L14 9.5 L21 12 L14 14.5 L12 21.5 L10 14.5 L3 12 L10 9.5 Z" {...STROKE} />
        </>
      );
    case 'percent_dmg': // % dommages : éclat + arc
      return (
        <>
          <path d="M12 4 L13.6 10 L20 12 L13.6 14 L12 20 L10.4 14 L4 12 L10.4 10 Z" {...STROKE} />
          <path d="M5 5 A10 10 0 0 1 19 5" {...STROKE} strokeWidth={1.1} />
        </>
      );
    case 'resistance': // résistances : écu
      return (
        <>
          <path d="M12 3 L19 6 V12 C19 16.5 15.5 19.5 12 21 C8.5 19.5 5 16.5 5 12 V6 Z" {...STROKE} />
          <path d="M12 8 V16" {...STROKE} strokeWidth={1.1} />
        </>
      );
    case 'utility': // utilitaires : rune nouée
    default:
      return (
        <>
          <circle cx="12" cy="12" r="8" {...STROKE} />
          <path d="M8 12 H16 M12 8 V16" {...STROKE} strokeWidth={1.1} />
        </>
      );
  }
}

export function RuneGlyph({ category, className = '', size = 22, title }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {paths(category)}
    </svg>
  );
}
