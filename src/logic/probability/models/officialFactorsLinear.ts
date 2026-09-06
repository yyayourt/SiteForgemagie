/**
 * Modèle « official_factors_linear » — INCONNU (empirical_params.json → probability.officialFactorsLinear).
 *
 * N'utilise QUE les deux facteurs cités par le tutoriel officiel Ankama : le niveau de
 * l'objet et la proximité du jet maximal. La forme linéaire et les coefficients a/b/c sont
 * des choix de projet sans source :
 *
 *   pSC_brut = a + b × distance − c × (niveau / 200) − d × usageBorne
 *   distance = (jetMax − valeur) / jetMax ∈ [0, 1] (0 = au jet parfait ; exo = 0)
 *   usageBorne = cumul over+exo après la rune / overCapWeight, borné à [0, 1]
 *
 * Le terme d est une proposition du projet (INCONNU, 0 par défaut : sans effet) : plus la
 * rune amène l'objet près de la borne d'over/exo, moins elle passerait. Aucune source.
 *
 * Le complément est réparti SN/EC par ecShare (heavyExoEcShare en exo lourd).
 * Les bornes officielles (15 % / 1 %) sont appliquées ensuite par constraints.ts.
 */

import type { ProbabilityParams } from '../../../data/params';
import { distanceToMax, splitComplement, type ProbabilityModel } from '../types';

export const officialFactorsLinearModel: ProbabilityModel = {
  name: 'official_factors_linear',
  compute(input, params: ProbabilityParams) {
    const { a, b, c, d, levelNormalizer } = params.officialFactorsLinear;
    const distance = distanceToMax(input.line);
    const level = levelNormalizer > 0 ? Math.max(0, input.itemLevel) / levelNormalizer : 0;
    const usage = Math.min(1, Math.max(0, input.overCapUsage ?? 0));
    const pSC = a + b * distance - c * level - d * usage;
    const ecShare = input.isHeavyExo ? params.heavyExoEcShare : params.ecShare;
    return splitComplement(pSC, ecShare);
  },
};
