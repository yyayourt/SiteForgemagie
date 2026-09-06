/**
 * Moteur de forgemagie (règles certaines + reliquat). Aucun modèle probabiliste ici :
 * l'issue SC/SN/EC est fournie par l'appelant.
 */
export { applyRune, withRuneApplied } from './applyRune';
export { applyTranscendenceRune, type TranscendenceRune } from './transcendence';
export { applyRegenerationOrb, type OrbResult } from './orb';
export { applyLoss } from './losses';
export {
  getLossSelectionStrategy,
  uniformStrategy,
  weightedByWeightStrategy,
  weightedByValueTimesWeightStrategy,
  type LossSelectionStrategy,
  type LossCandidate,
} from './lossSelection';
export { checkOverCap, hasAnyOverOrExo } from './overCap';
export { onItemLeavesWorkshop, normalizeResidual, type ResidualResetEvent } from './residual';
export { runeWeight, lineWeight, lineOverWeight, lineCapWeight, isOverOrExo, getLineDensity } from './weights';
