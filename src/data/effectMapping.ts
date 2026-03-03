import type { RuneInfo } from '../types';

/**
 * Mapping effectId (DofusDB API) → informations de rune.
 *
 * Sources :
 * - Poids officiels de la forgemagie Dofus
 * - Valeurs de runes (normale / Pa / Ra)
 *
 * Note : seuls les effectIds positifs (bonus) sont mappés ici.
 * Les malus (effectIds négatifs comme 145=malus Force) ne sont pas forgeables.
 */
export const EFFECT_MAPPING: Record<number, RuneInfo> = {
  // --- Caractéristiques principales ---
  125: {
    statName: 'Vitalité',
    weightPerPoint: 0.2,
    isForgemeable: true,
    runeNormal: 5,
    runePa: 15,
    runeRa: 50,
  },
  124: {
    statName: 'Sagesse',
    weightPerPoint: 3,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  118: {
    statName: 'Force',
    weightPerPoint: 1,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  126: {
    statName: 'Intelligence',
    weightPerPoint: 1,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  119: {
    statName: 'Agilité',
    weightPerPoint: 1,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  123: {
    statName: 'Chance',
    weightPerPoint: 1,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },

  // --- Puissance ---
  138: {
    statName: 'Puissance',
    weightPerPoint: 2,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },

  // --- PA / PM / PO ---
  111: {
    statName: 'PA',
    weightPerPoint: 100,
    isForgemeable: true,
    runeNormal: 1,
  },
  128: {
    statName: 'PM',
    weightPerPoint: 90,
    isForgemeable: true,
    runeNormal: 1,
  },
  117: {
    statName: 'PO',
    weightPerPoint: 51,
    isForgemeable: true,
    runeNormal: 1,
  },

  // --- Invocations ---
  182: {
    statName: 'Invocations',
    weightPerPoint: 30,
    isForgemeable: true,
    runeNormal: 1,
  },

  // --- Dommages ---
  112: {
    statName: 'Dommages',
    weightPerPoint: 20,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  114: {
    statName: 'Dommages Terre',
    weightPerPoint: 20,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  116: {
    statName: 'Dommages Neutre',
    weightPerPoint: 20,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  120: {
    statName: 'Dommages Eau',
    weightPerPoint: 20,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  122: {
    statName: 'Dommages Air',
    weightPerPoint: 20,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  136: {
    statName: 'Dommages Feu',
    weightPerPoint: 20,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  115: {
    statName: 'Dommages Critiques',
    weightPerPoint: 5,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },

  // --- Soins ---
  178: {
    statName: 'Soins',
    weightPerPoint: 10,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },

  // --- % Dommages ---
  752: {
    statName: '% Dommages Distance',
    weightPerPoint: 15,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  753: {
    statName: '% Dommages Mêlée',
    weightPerPoint: 15,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  750: {
    statName: '% Dommages Sorts',
    weightPerPoint: 15,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  751: {
    statName: '% Dommages Armes',
    weightPerPoint: 15,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },

  // --- % Résistances ---
  754: {
    statName: '% Résistance Distance',
    weightPerPoint: 6,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  755: {
    statName: '% Résistance Mêlée',
    weightPerPoint: 6,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  210: {
    statName: '% Résistance Terre',
    weightPerPoint: 6,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  211: {
    statName: '% Résistance Eau',
    weightPerPoint: 6,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  212: {
    statName: '% Résistance Air',
    weightPerPoint: 6,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  213: {
    statName: '% Résistance Feu',
    weightPerPoint: 6,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  214: {
    statName: '% Résistance Neutre',
    weightPerPoint: 6,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },

  // --- Résistances fixes ---
  240: {
    statName: 'Résistance Terre',
    weightPerPoint: 2,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  241: {
    statName: 'Résistance Eau',
    weightPerPoint: 2,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  242: {
    statName: 'Résistance Air',
    weightPerPoint: 2,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  243: {
    statName: 'Résistance Feu',
    weightPerPoint: 2,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  244: {
    statName: 'Résistance Neutre',
    weightPerPoint: 2,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },

  // --- Tacle / Fuite ---
  173: {
    statName: 'Tacle',
    weightPerPoint: 4,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  174: {
    statName: 'Fuite',
    weightPerPoint: 4,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },

  // --- Esquive / Retrait PA-PM ---
  160: {
    statName: 'Esquive PA',
    weightPerPoint: 7,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  161: {
    statName: 'Esquive PM',
    weightPerPoint: 7,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  162: {
    statName: 'Retrait PA',
    weightPerPoint: 7,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },
  163: {
    statName: 'Retrait PM',
    weightPerPoint: 7,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },

  // --- Prospection ---
  176: {
    statName: 'Prospection',
    weightPerPoint: 3,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },

  // --- Initiative ---
  184: {
    statName: 'Initiative',
    weightPerPoint: 0.1,
    isForgemeable: true,
    runeNormal: 10,
    runePa: 30,
    runeRa: 100,
  },

  // --- Pods ---
  158: {
    statName: 'Pods',
    weightPerPoint: 0.25,
    isForgemeable: true,
    runeNormal: 10,
    runePa: 30,
    runeRa: 100,
  },

  // --- Renvoie de dommages ---
  220: {
    statName: 'Renvoie de dommages',
    weightPerPoint: 10,
    isForgemeable: true,
    runeNormal: 1,
    runePa: 3,
    runeRa: 10,
  },

};

/** Mapping typeId → nom du type d'item (en français) */
export const ITEM_TYPE_NAMES: Record<number, string> = {
  1: 'Amulette',
  2: 'Arc',
  3: 'Baguette',
  4: 'Bâton',
  5: 'Dague',
  6: 'Épée',
  7: 'Marteau',
  8: 'Pelle',
  9: 'Anneau',
  10: 'Ceinture',
  11: 'Bottes',
  16: 'Chapeau',
  17: 'Cape',
  19: 'Hache',
  21: 'Pioche',
  22: 'Faux',
  81: 'Bouclier',
  82: 'Sac à dos',
  102: 'Trophée',
  114: 'Prysmaradite',
};

/**
 * Liste des stats "exotiques" courantes (stats qu'on peut ajouter en exo).
 * Ce sont les stats qui n'existent pas naturellement sur l'item.
 */
export const COMMON_EXO_STATS: { effectId: number; statName: string }[] = [
  { effectId: 111, statName: 'PA' },
  { effectId: 128, statName: 'PM' },
  { effectId: 117, statName: 'PO' },
  { effectId: 182, statName: 'Invocations' },
  { effectId: 752, statName: '% Dommages Distance' },
  { effectId: 753, statName: '% Dommages Mêlée' },
  { effectId: 750, statName: '% Dommages Sorts' },
  { effectId: 751, statName: '% Dommages Armes' },
  { effectId: 754, statName: '% Résistance Distance' },
  { effectId: 755, statName: '% Résistance Mêlée' },
];
