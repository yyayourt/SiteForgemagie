/**
 * Limites absolues par caractéristique en forgemagie Dofus.
 *
 * Règle fondamentale : le cap des 101 s'applique PAR LIGNE DE STAT, pas en cumul.
 * Chaque ligne (over ou exo) est indépendante des autres lignes sur le même item.
 *
 * Pour chaque stat : maxOverOrExo = floor(101 / weightPerPoint)
 *
 * Sources : guides communautaires, tests empiriques Dofus 2.x/Unity.
 * Ankama ne publie pas les formules internes — ces valeurs sont empiriques.
 */

export interface StatCapInfo {
  /** Nom affiché */
  statName: string;
  /** Poids par point (densité) */
  weightPerPoint: number;
  /**
   * Nombre maximum de points over/exo possibles sur cette ligne.
   * = floor(101 / weightPerPoint)
   * null = pas de cap par les 101 (ex. stats non forgeables)
   */
  maxOverOrExo: number;
  /**
   * Valeur absolue maximale possible sur un item, quelle que soit sa base.
   * Pour PA/PM/PO/Invocations, c'est une limite absolue indépendante du jet de base.
   * Pour les autres stats, le vrai max = baseMax + maxOverOrExo.
   */
  absoluteMax?: number;
  /** Raison particulière pour une limite absolue (ex. formule intentionnelle d'Ankama) */
  absoluteMaxReason?: string;
  /** Si true, impossible d'avoir 2 de cette stat sur un même item */
  hardCapOne?: boolean;
  /** Catégorie pour le regroupement dans l'affichage */
  category: StatCapCategory;
  /** Note explicative */
  note?: string;
}

export type StatCapCategory =
  | 'special'       // PA, PM, PO, Invocations
  | 'primary'       // Force, Int, Agi, Chance, Vitalité, Sagesse, Puissance
  | 'damage'        // Dommages (toutes formes)
  | 'resistance'    // Résistances (fixes et %)
  | 'utility'       // CC, Soins, Esquive, Retrait, Tacle, Fuite, Prosp, Init, Pods
  | 'percent_dmg';  // % Dommages

/**
 * Table des caps par stat.
 * Indexée par effectId (même que EFFECT_MAPPING).
 */
export const STAT_CAPS: Record<number, StatCapInfo> = {
  // ─── Spéciaux (PA / PM / PO / Invocations) ───

  111: {
    statName: 'PA',
    weightPerPoint: 100,
    maxOverOrExo: 1,
    absoluteMax: 1,
    hardCapOne: true,
    category: 'special',
    absoluteMaxReason:
      'PA pèse 100 par point. Deux PA = 200 > 101 → mathématiquement impossible. ' +
      'Aucun item ne possède naturellement 2 PA.',
  },
  128: {
    statName: 'PM',
    weightPerPoint: 90,
    maxOverOrExo: 1,
    absoluteMax: 1,
    hardCapOne: true,
    category: 'special',
    absoluteMaxReason:
      'PM pèse 90 par point. Deux PM = 180 > 101 → impossible. ' +
      'Aucun item ne possède naturellement 2 PM.',
  },
  117: {
    statName: 'PO',
    weightPerPoint: 51,
    maxOverOrExo: 1,
    absoluteMax: 1,
    hardCapOne: true,
    category: 'special',
    absoluteMaxReason:
      'PO pèse 51 par point. Deux PO = 102 > 101 → impossible. ' +
      'Ankama a fixé ce poids délibérément à 51 (et non 50) pour rendre le double PO techniquement impossible.',
  },
  182: {
    statName: 'Invocations',
    weightPerPoint: 30,
    maxOverOrExo: 3, // floor(101/30) = 3
    absoluteMax: 3,
    category: 'special',
    note:
      '3 invocations = 90 poids (< 101). 4 invocations = 120 > 101 → impossible. ' +
      'Contrairement à PA/PM/PO, les invocations ne sont pas limitées à 1 par personnage.',
  },

  // ─── Caractéristiques primaires ───

  125: {
    statName: 'Vitalité',
    weightPerPoint: 0.2, // convention : 5 vita = 1 poids
    maxOverOrExo: 505, // floor(101 / 0.2) = 505
    category: 'primary',
    note:
      'Convention : 1 point de vita = 0,2 poids (ou : 5 vita = 1 poids). ' +
      'Max over = +505 vita au-dessus du jet parfait. En pratique, les overs de 50–200 vita sont courants sur items HL.',
  },
  118: {
    statName: 'Force',
    weightPerPoint: 1,
    maxOverOrExo: 101,
    category: 'primary',
  },
  126: {
    statName: 'Intelligence',
    weightPerPoint: 1,
    maxOverOrExo: 101,
    category: 'primary',
  },
  119: {
    statName: 'Agilité',
    weightPerPoint: 1,
    maxOverOrExo: 101,
    category: 'primary',
  },
  123: {
    statName: 'Chance',
    weightPerPoint: 1,
    maxOverOrExo: 101,
    category: 'primary',
  },
  124: {
    statName: 'Sagesse',
    weightPerPoint: 3,
    maxOverOrExo: 33, // floor(101/3) = 33
    category: 'primary',
  },
  138: {
    statName: 'Puissance',
    weightPerPoint: 2,
    maxOverOrExo: 50, // floor(101/2) = 50
    category: 'primary',
  },

  // ─── Dommages ───

  112: {
    statName: 'Dommages',
    weightPerPoint: 20,
    maxOverOrExo: 5, // floor(101/20) = 5
    category: 'damage',
    note: 'Dommages génériques (toutes armes). Poids très élevé : 20/point.',
  },
  114: {
    statName: 'Dommages Terre',
    weightPerPoint: 5,
    maxOverOrExo: 20, // floor(101/5) = 20
    category: 'damage',
  },
  116: {
    statName: 'Dommages Neutre',
    weightPerPoint: 5,
    maxOverOrExo: 20,
    category: 'damage',
  },
  120: {
    statName: 'Dommages Eau',
    weightPerPoint: 5,
    maxOverOrExo: 20,
    category: 'damage',
  },
  122: {
    statName: 'Dommages Air',
    weightPerPoint: 5,
    maxOverOrExo: 20,
    category: 'damage',
  },
  136: {
    statName: 'Dommages Feu',
    weightPerPoint: 5,
    maxOverOrExo: 20,
    category: 'damage',
  },
  115: {
    statName: 'Dommages Critiques',
    weightPerPoint: 5,
    maxOverOrExo: 20,
    category: 'damage',
  },

  // ─── % Dommages ───

  750: {
    statName: '% Dommages Sorts',
    weightPerPoint: 15,
    maxOverOrExo: 6, // floor(101/15) = 6
    category: 'percent_dmg',
  },
  751: {
    statName: '% Dommages Armes',
    weightPerPoint: 15,
    maxOverOrExo: 6,
    category: 'percent_dmg',
  },
  752: {
    statName: '% Dommages Distance',
    weightPerPoint: 15,
    maxOverOrExo: 6,
    category: 'percent_dmg',
  },
  753: {
    statName: '% Dommages Mêlée',
    weightPerPoint: 15,
    maxOverOrExo: 6,
    category: 'percent_dmg',
  },

  // ─── Résistances % ───

  210: {
    statName: '% Résistance Terre',
    weightPerPoint: 6,
    maxOverOrExo: 16, // floor(101/6) = 16
    category: 'resistance',
    note:
      '16% = 96 poids (ok). 17% = 102 poids > 101 → impossible. ' +
      'Cap identique pour tous les éléments.',
  },
  211: {
    statName: '% Résistance Eau',
    weightPerPoint: 6,
    maxOverOrExo: 16,
    category: 'resistance',
  },
  212: {
    statName: '% Résistance Air',
    weightPerPoint: 6,
    maxOverOrExo: 16,
    category: 'resistance',
  },
  213: {
    statName: '% Résistance Feu',
    weightPerPoint: 6,
    maxOverOrExo: 16,
    category: 'resistance',
  },
  214: {
    statName: '% Résistance Neutre',
    weightPerPoint: 6,
    maxOverOrExo: 16,
    category: 'resistance',
  },
  754: {
    statName: '% Résistance Distance',
    weightPerPoint: 6,
    maxOverOrExo: 16,
    category: 'resistance',
  },
  755: {
    statName: '% Résistance Mêlée',
    weightPerPoint: 6,
    maxOverOrExo: 16,
    category: 'resistance',
  },

  // ─── Résistances fixes ───

  240: {
    statName: 'Résistance Terre',
    weightPerPoint: 2,
    maxOverOrExo: 50,
    category: 'resistance',
  },
  241: {
    statName: 'Résistance Eau',
    weightPerPoint: 2,
    maxOverOrExo: 50,
    category: 'resistance',
  },
  242: {
    statName: 'Résistance Air',
    weightPerPoint: 2,
    maxOverOrExo: 50,
    category: 'resistance',
  },
  243: {
    statName: 'Résistance Feu',
    weightPerPoint: 2,
    maxOverOrExo: 50,
    category: 'resistance',
  },
  244: {
    statName: 'Résistance Neutre',
    weightPerPoint: 2,
    maxOverOrExo: 50,
    category: 'resistance',
  },

  // ─── Utilitaires ───

  178: {
    statName: 'Soins',
    weightPerPoint: 10,
    maxOverOrExo: 10, // floor(101/10) = 10
    category: 'utility',
  },
  220: {
    statName: 'Renvoie de dommages',
    weightPerPoint: 10,
    maxOverOrExo: 10,
    category: 'utility',
  },
  176: {
    statName: 'Prospection',
    weightPerPoint: 3,
    maxOverOrExo: 33,
    category: 'utility',
  },
  184: {
    statName: 'Initiative',
    weightPerPoint: 0.1,
    maxOverOrExo: 1010, // floor(101/0.1)
    category: 'utility',
  },
  158: {
    statName: 'Pods',
    weightPerPoint: 0.25,
    maxOverOrExo: 404, // floor(101/0.25)
    category: 'utility',
  },
  173: {
    statName: 'Tacle',
    weightPerPoint: 4,
    maxOverOrExo: 25, // floor(101/4)
    category: 'utility',
  },
  174: {
    statName: 'Fuite',
    weightPerPoint: 4,
    maxOverOrExo: 25,
    category: 'utility',
  },
  160: {
    statName: 'Esquive PA',
    weightPerPoint: 7,
    maxOverOrExo: 14, // floor(101/7)
    category: 'utility',
  },
  161: {
    statName: 'Esquive PM',
    weightPerPoint: 7,
    maxOverOrExo: 14,
    category: 'utility',
  },
  162: {
    statName: 'Retrait PA',
    weightPerPoint: 7,
    maxOverOrExo: 14,
    category: 'utility',
  },
  163: {
    statName: 'Retrait PM',
    weightPerPoint: 7,
    maxOverOrExo: 14,
    category: 'utility',
  },
};

/**
 * Groupement des stats par catégorie pour l'affichage.
 */
export const CATEGORY_LABELS: Record<StatCapCategory, string> = {
  special: 'Stats Spéciales (PA / PM / PO / Invocations)',
  primary: 'Caractéristiques Primaires',
  damage: 'Dommages',
  percent_dmg: '% Dommages',
  resistance: 'Résistances',
  utility: 'Utilitaires',
};

export const CATEGORY_ORDER: StatCapCategory[] = [
  'special',
  'primary',
  'damage',
  'percent_dmg',
  'resistance',
  'utility',
];

/**
 * Retourne la valeur absolue maximale atteignable pour une stat donnée.
 *
 * - Pour les stats avec absoluteMax (PA, PM, PO, Invocations) : absoluteMax prime toujours.
 * - Pour une stat exotique (baseMax = 0) : maxOverOrExo est le plafond.
 * - Pour une stat naturelle : baseMax + maxOverOrExo.
 * - Si la stat n'est pas dans STAT_CAPS (pas forgeable) : Infinity.
 */
export function getStatAbsoluteMax(stat: {
  effectId: number;
  baseMax: number;
  isExo: boolean;
}): number {
  const cap = STAT_CAPS[stat.effectId];
  if (!cap) return Infinity;

  if (cap.absoluteMax !== undefined) {
    return cap.absoluteMax;
  }

  if (stat.isExo) {
    return cap.maxOverOrExo;
  }

  return stat.baseMax + cap.maxOverOrExo;
}
