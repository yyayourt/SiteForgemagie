/**
 * État d'un objet en forgemagie, tel que vu par le moteur (src/logic/engine).
 *
 * Deux notions distinctes, jamais confondues :
 * - `residualPool` (reliquat serveur) : état PROPRE de l'objet, ≥ 0, créé par un SN/EC
 *   (perte − rune), consommé en priorité lors d'une perte ultérieure. Jamais dérivé de
 *   l'état visible.
 * - `weightBudget` (budget de planification) : calculé à la volée depuis les lignes
 *   visibles par src/logic/planning, sans lien avec le reliquat.
 */

/** Une ligne de caractéristique sur l'objet. */
export interface ItemLine {
  /** Champ `characteristic` de DofusDB (clé de jointure du dataset). */
  characteristicId: number;
  /** Valeur actuelle de la ligne. */
  value: number;
  /** Bornes du jet naturel (0–0 pour une ligne exotique). */
  baseMin: number;
  baseMax: number;
  /** Ligne absente du patron de l'objet, ajoutée par forgemagie. */
  isExo: boolean;
  /** Ligne verrouillée (objet transcendé, devblog 2.58 : toutes les lignes le sont). */
  isLocked: boolean;
}

/** État complet d'un objet en forgemagie. */
export interface ForgemagieItemState {
  /** Niveau de l'objet (utilisé par le brisage). */
  level: number;
  lines: ItemLine[];
  /** Reliquat serveur, nombre ≥ 0, fractions conservées. */
  residualPool: number;
  /**
   * Objet verrouillé par une rune de transcendance : plus de forgemagie ni de
   * réinitialisation par orbe (SOURCE PRIMAIRE, devblog 2.58).
   */
  itemLocked: boolean;
}

/** Une rune : +value sur une caractéristique. */
export interface Rune {
  characteristicId: number;
  value: number;
}

/** Issue d'une tentative, FOURNIE au moteur (le tirage arrive en phase 3). */
export type RuneOutcome = 'SC' | 'SN' | 'EC';

/** Générateur aléatoire injecté (valeur dans [0, 1)). */
export interface Rng {
  next(): number;
}

/** Perte réellement appliquée sur une ligne. */
export interface LossRecord {
  characteristicId: number;
  pointsLost: number;
  weightLost: number;
}

export type RefusalReason =
  | 'item_locked'
  | 'line_locked'
  | 'no_density'
  | 'over_cap_exceeded'
  | 'transcendence_has_exo'
  | 'transcendence_has_over'
  | 'transcendence_threshold_exceeded'
  | 'transcendence_rate_not_certain';

/** Résultat de applyRune / applyTranscendenceRune. */
export interface ApplyRuneResult {
  accepted: boolean;
  reason?: RefusalReason;
  /** Nouvel état (identique à l'entrée si refusé). */
  state: ForgemagieItemState;
  outcome: RuneOutcome;
  /** Poids de la rune = value × densité. */
  runeWeight: number;
  /** Valeur réellement appliquée sur la ligne (≤ rune.value ; 0 si refusée ou en EC). */
  appliedValue: number;
  /** La rune a été arrêtée à la borne d'over/exo (overCapExcess.behaviour = truncate). */
  truncated: boolean;
  /** Poids de perte demandé (0 en SC). */
  lossRequested: number;
  /** Part de la perte absorbée par le reliquat. */
  absorbedByResidual: number;
  /** Pertes appliquées sur des lignes, dans l'ordre. */
  losses: LossRecord[];
  /** Poids de perte qu'aucune ligne n'a pu absorber : l'EC retire tout ce qui reste puis s'arrête (SOURCE PRIMAIRE). */
  unabsorbedWeight: number;
  /** Succès neutre impayable converti en échec sans effet (lossSelection.unpayableSn, INCONNU, jamais observé). */
  snConvertedToEc: boolean;
  /**
   * Succès neutre sans effet : aucune AUTRE ligne ne pouvait diminuer, donc rien ne se passe.
   * SOURCE PRIMAIRE — v1.27 : « Si ce résultat n'est pas possible (objet qui ne dispose que
   * d'un seul jet par exemple), rien ne se passe en cas de succès partiel. »
   */
  snNoOp: boolean;
  residualPoolBefore: number;
  residualPoolAfter: number;
}
