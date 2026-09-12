/**
 * Couleur d'affichage par caractéristique : teinte l'icône de rune et le liseré de ligne.
 *
 * Statut : DEUX niveaux bien distincts, à ne pas confondre entre eux ni avec les données
 * de simulation (poids, bornes, probabilités) qui, elles, suivent les statuts épistémiques
 * de CLAUDE.md.
 *
 *  - Éléments (Neutre/Terre/Feu/Eau/Air, `characteristicId` ci-dessous) : la correspondance
 *    élément → teinte (Feu rouge, Eau bleu, Air vert, Terre brun/orangé, Neutre blanc/gris)
 *    reprend la convention DOFUS habituelle, visible sur les icônes de sort/résistance en
 *    jeu et reprise par DofusDB et la communauté. Les identifiants de caractéristique
 *    viennent de data/dataset.json (33-37 = % résistances, 54-58 = résistances fixes,
 *    88-92 = dommages, dans l'ordre Terre/Feu/Eau/Air/Neutre selon l'API).
 *  - Autres familles (PA/PM/PO, caractéristiques primaires, dommages et résistances
 *    génériques, utilitaires) : DOFUS ne leur attribue PAS de couleur distincte en jeu
 *    (texte neutre, différencié par icône seulement). La teinte utilisée ici est un choix
 *    de présentation propre à ce site pour rendre les familles lisibles d'un coup d'œil ;
 *    ce n'est pas une reconstitution d'un code couleur officiel.
 *
 * Les valeurs hexadécimales vivent dans src/styles/theme.css (--color-elem-*, --color-cat-*) ;
 * ce module ne fait que la jointure characteristicId → classe utilitaire Tailwind.
 */

import { getStatCategory, type StatCapCategory } from './statCaps';

export type ElementName = 'neutral' | 'earth' | 'fire' | 'water' | 'air';

export const ELEMENT_LABELS: Record<ElementName, string> = {
  neutral: 'Neutre',
  earth: 'Terre',
  fire: 'Feu',
  water: 'Eau',
  air: 'Air',
};

/** characteristicId → élément, pour les seules caractéristiques élémentaires (dataset.json). */
const ELEMENT_BY_CHARACTERISTIC: Record<number, ElementName> = {
  // % résistances (33 Terre, 34 Feu, 35 Eau, 36 Air, 37 Neutre)
  33: 'earth',
  34: 'fire',
  35: 'water',
  36: 'air',
  37: 'neutral',
  // résistances fixes (54 Terre, 55 Feu, 56 Eau, 57 Air, 58 Neutre)
  54: 'earth',
  55: 'fire',
  56: 'water',
  57: 'air',
  58: 'neutral',
  // dommages (88 Terre, 89 Feu, 90 Eau, 91 Air, 92 Neutre)
  88: 'earth',
  89: 'fire',
  90: 'water',
  91: 'air',
  92: 'neutral',
};

/** Élément d'une caractéristique, ou null si elle n'en a pas (la plupart des stats). */
export function getStatElement(characteristicId: number): ElementName | null {
  return ELEMENT_BY_CHARACTERISTIC[characteristicId] ?? null;
}

/**
 * Classes Tailwind littérales par token couleur (text/border/bg), une entrée par
 * `--color-elem-*` / `--color-cat-*` de theme.css. Écrites en toutes lettres — pas de
 * gabarit `text-${token}` — pour que le scanner de classes de Tailwind (v4, sans config
 * de contenu explicite) les détecte : une classe construite par interpolation de chaîne
 * n'apparaît dans aucun fichier sous sa forme finale et ne serait jamais générée.
 */
interface ColorClasses {
  text: string;
  border: string;
  bg: string;
  /** Fond faible opacité, pour un liseré d'icône discret derrière l'image de rune */
  bgSoft: string;
}

const TOKEN_CLASSES = {
  'elem-neutral': { text: 'text-elem-neutral', border: 'border-elem-neutral', bg: 'bg-elem-neutral', bgSoft: 'bg-elem-neutral/15' },
  'elem-earth': { text: 'text-elem-earth', border: 'border-elem-earth', bg: 'bg-elem-earth', bgSoft: 'bg-elem-earth/15' },
  'elem-fire': { text: 'text-elem-fire', border: 'border-elem-fire', bg: 'bg-elem-fire', bgSoft: 'bg-elem-fire/15' },
  'elem-water': { text: 'text-elem-water', border: 'border-elem-water', bg: 'bg-elem-water', bgSoft: 'bg-elem-water/15' },
  'elem-air': { text: 'text-elem-air', border: 'border-elem-air', bg: 'bg-elem-air', bgSoft: 'bg-elem-air/15' },
  'cat-special': { text: 'text-cat-special', border: 'border-cat-special', bg: 'bg-cat-special', bgSoft: 'bg-cat-special/15' },
  'cat-primary': { text: 'text-cat-primary', border: 'border-cat-primary', bg: 'bg-cat-primary', bgSoft: 'bg-cat-primary/15' },
  'cat-damage': { text: 'text-cat-damage', border: 'border-cat-damage', bg: 'bg-cat-damage', bgSoft: 'bg-cat-damage/15' },
  'cat-percent-dmg': { text: 'text-cat-percent-dmg', border: 'border-cat-percent-dmg', bg: 'bg-cat-percent-dmg', bgSoft: 'bg-cat-percent-dmg/15' },
  'cat-resistance': { text: 'text-cat-resistance', border: 'border-cat-resistance', bg: 'bg-cat-resistance', bgSoft: 'bg-cat-resistance/15' },
  'cat-utility': { text: 'text-cat-utility', border: 'border-cat-utility', bg: 'bg-cat-utility', bgSoft: 'bg-cat-utility/15' },
} as const satisfies Record<string, ColorClasses>;

type ColorToken = keyof typeof TOKEN_CLASSES;

const CATEGORY_TOKEN: Record<StatCapCategory, ColorToken> = {
  special: 'cat-special',
  primary: 'cat-primary',
  damage: 'cat-damage',
  percent_dmg: 'cat-percent-dmg',
  resistance: 'cat-resistance',
  utility: 'cat-utility',
};

const ELEMENT_TOKEN: Record<ElementName, ColorToken> = {
  neutral: 'elem-neutral',
  earth: 'elem-earth',
  fire: 'elem-fire',
  water: 'elem-water',
  air: 'elem-air',
};

/** Token couleur pour une caractéristique : élément si élémentaire, sinon famille. */
export function getStatColorToken(characteristicId: number): ColorToken {
  const element = getStatElement(characteristicId);
  if (element) return ELEMENT_TOKEN[element];
  return CATEGORY_TOKEN[getStatCategory(characteristicId)];
}

export function getStatColorClasses(characteristicId: number): ColorClasses {
  return TOKEN_CLASSES[getStatColorToken(characteristicId)];
}

export function getStatTextClass(characteristicId: number): string {
  return TOKEN_CLASSES[getStatColorToken(characteristicId)].text;
}

export function getStatBorderClass(characteristicId: number): string {
  return TOKEN_CLASSES[getStatColorToken(characteristicId)].border;
}

export function getStatBgClass(characteristicId: number): string {
  return TOKEN_CLASSES[getStatColorToken(characteristicId)].bg;
}
