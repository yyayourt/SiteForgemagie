/**
 * Modèle « official_factors_linear » — INCONNU (empirical_params.json → probability).
 *
 *   pSC_brut = a + b × distance − c × (niveau / levelNormalizer) − d × usageBorne
 *              − e × qualitéGlobale
 *              + facteurs structurels (pentes nulles, hors vecteur ajusté)
 *
 *   distance       = (jetMax − valeur) / jetMax ∈ [0, 1] ; `null` pour un exo ou un jet fixe,
 *                    auquel cas le facteur est neutralisé (et non lu comme un jet parfait).
 *   usageBorne     = cumul over+exo APRÈS la rune / overCapWeight, borné à [0, 1].
 *   qualitéGlobale = qualité des AUTRES lignes ∈ [0, 1] (itemQuality.ts).
 *
 * Facteurs et statuts (DevBlog Ankama 1.27, `SOURCE PRIMAIRE — v1.27` pour l'EXISTENCE de
 * chacun ; toutes les PENTES sont `INCONNU`) :
 *   e — qualité globale de l'objet, hors ligne visée. Facteur LE PLUS IMPORTANT selon Ankama.
 *   b — qualité du jet modifié. Deuxième.
 *   c — niveau de l'objet. Troisième, effet « faible », signe positif sur la difficulté.
 *   d — présence d'over/exo, ligne visée COMPRISE.
 *
 * Le vecteur AJUSTÉ est {a, b, c, d, e}. Les drapeaux structurels (palier 80 %, jet fixe,
 * objet mono-jet, objet éthéré, décompte des over/exo) sont dans un bloc séparé
 * (`params.structuralFactors`) à pentes nulles : les mêler au vecteur ajusté donnerait un
 * modèle à huit degrés de liberté qui s'ajuste à n'importe quoi sur quelques dizaines de
 * tentatives — du surajustement présenté comme une reconstitution.
 *
 * Le complément est réparti SN/EC par ecShare. Le garde-fou d'exotisme (exoGuard.ts) et les
 * bornes officielles (constraints.ts) s'appliquent ENSUITE, dans cet ordre.
 */

import type { ProbabilityParams } from '../../../data/params';
import { distanceToMax, splitComplement, NEUTRAL_STRUCTURAL_FLAGS, type ProbabilityModel } from '../types';

export const officialFactorsLinearModel: ProbabilityModel = {
  name: 'official_factors_linear',
  compute(input, params: ProbabilityParams) {
    const { a, b, c, d, e, levelNormalizer } = params.officialFactorsLinear;
    // `null` (exo, jet fixe) neutralise le facteur : il ne vaut PAS « jet parfait ».
    const distance = distanceToMax(input.line) ?? 0;
    const level = levelNormalizer > 0 ? Math.max(0, input.itemLevel) / levelNormalizer : 0;
    const usage = clamp01(input.overCapUsage ?? 0);
    const quality = clamp01(input.itemQuality ?? 0);

    const pSC = a + b * distance - c * level - d * usage - e * quality + structuralTerm(input, params);

    const ecShare = input.isHeavyExo ? params.heavyExoEcShare : params.ecShare;
    return splitComplement(pSC, ecShare);
  },
};

/**
 * Bloc structurel : somme des drapeaux du DevBlog 1.27 multipliés par leurs pentes.
 * Toutes les pentes valent 0 dans le fichier → ce terme vaut 0 et le modèle est inchangé.
 * Le palier de 80 % est une FONCTION EN ESCALIER : retirée en bloc ou pas du tout.
 */
function structuralTerm(
  input: Parameters<ProbabilityModel['compute']>[0],
  params: ProbabilityParams
): number {
  const f = input.structural ?? NEUTRAL_STRUCTURAL_FLAGS;
  const s = params.structuralFactors;
  const palierApplies = f.atOrAbovePalier80 && !(s.fixedRollExempt && f.fixedRoll);
  return (
    (palierApplies ? -s.palier80 : 0) +
    (f.singleNaturalRoll ? s.singleNaturalRoll : 0) +
    (f.ethereal ? -s.ethereal : 0) -
    s.overExoCount * Math.max(0, f.overExoCount)
  );
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}
