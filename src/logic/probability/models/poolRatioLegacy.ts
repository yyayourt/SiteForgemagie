/**
 * Modèle « pool_ratio_legacy » — INCONNU, conservé UNIQUEMENT pour comparaison.
 *
 * AUCUNE SOURCE. C'est l'ancien modèle du projet (runeSimulator.ts, supprimé en phase 2 ;
 * docs/audit-projet-existant.md §3.3 R4), reconstitué à l'identique avec ses coefficients
 * dans empirical_params.json → probability.poolRatioLegacy. Il fait dépendre pSC du ratio
 * budget de planification / poids de rune, ce qui :
 *   - contredit la borne officielle de 15 % AVANT clamp (minSc = 5 %) ;
 *   - utilise le budget de planification (état visible), qui n'est pas le reliquat serveur ;
 *   - n'utilise aucun des deux facteurs cités par Ankama.
 */

import type { ProbabilityParams } from '../../../data/params';
import { MIN_SC_HEAVY_EXO } from '../constraints';
import { splitComplement, type ProbabilityModel } from '../types';

export const poolRatioLegacyModel: ProbabilityModel = {
  name: 'pool_ratio_legacy',
  compute(input, params: ProbabilityParams) {
    const k = params.poolRatioLegacy;
    if (input.runeWeight <= 0) return { pSC: 1, pSN: 0, pEC: 0 };

    // Cas spécial de l'ancien code (exo lourd = 1 %, pas de SN) : plancher officiel + part d'EC paramétrée
    if (input.isHeavyExo) {
      return splitComplement(MIN_SC_HEAVY_EXO, params.heavyExoEcShare);
    }

    const ratio = input.weightBudget / input.runeWeight;
    let pSC: number;
    let pEC: number;
    if (ratio >= 0) {
      pSC = Math.min(k.baseSc + k.slopeSc * ratio, k.maxSc);
      pEC = Math.max(k.baseEcPositive - k.slopeEcPositive * ratio, k.minEc);
    } else {
      pSC = Math.max(k.baseSc + k.slopeSc * ratio, k.minSc);
      pEC = Math.min(k.baseEcNegative - k.slopeEcNegative * ratio, k.maxEc);
    }
    pSC = Math.min(1, Math.max(0, pSC));
    pEC = Math.min(1 - pSC, Math.max(0, pEC));
    return { pSC, pSN: Math.max(0, 1 - pSC - pEC), pEC };
  },
};
