/**
 * SEAM — règle de consommation du reliquat lors d'une perte.
 *
 * ─── Pourquoi ce point d'extension existe ───────────────────────────────────────────────
 * Le moteur absorbe la perte par le reliquat **en priorité et en totalité**
 * (`HYPOTHÈSE COMMUNAUTAIRE` forte : « le puits est consommé en priorité avant les stats »).
 * Deux éléments la mettent en doute :
 *
 * 1. `SOURCE PRIMAIRE — v1.27` : le DevBlog dit que la magie résiduelle « absorbera **en
 *    partie** les échecs futurs » — *en partie*, pas en totalité.
 * 2. `INCONNU`, **N = 1** : l'observation Unity du 2026-09-10 (anomalie A1) montre un EC qui
 *    n'a **pas** consommé un puits pourtant disponible. Puits 0,2 avant, rune Ini de poids 1,
 *    résultat −5 Vitalité (= 1,0 de poids), aucune mention `- reliquat`, puits toujours 0,2
 *    après. Le moteur, lui, aurait prédit −4 Vitalité (0,8) et un puits ramené à 0.
 *
 * ─── Ce que ce module fait, et surtout ce qu'il ne fait pas ─────────────────────────────
 * Il pose l'interface avec **une seule implémentation : le comportement actuel**. Les trois
 * lectures concurrentes de A1 ne sont **délibérément pas écrites** :
 *   (a) la consommation du puits n'est pas systématique en EC ;
 *   (b) le puits s'applique par tranches ;
 *   (c) le puits n'intervient que si la perte **dépasse** le poids de la rune — lecture la
 *       plus cohérente avec « en partie », et symétrique de la règle de création du reliquat
 *       (« créé exactement quand on perd plus que prévu »).
 *
 * Une occurrence ne fait pas une règle. Généraliser sur N = 1 introduirait un biais
 * systématique sur **toutes** les simulations à puits non nul, c'est-à-dire la majorité des
 * sessions longues. La campagne de reproduction requise est d'environ 20 EC sur objet à puits
 * non nul, avec relevé du reliquat avant et après.
 *
 * L'interface existe pour éviter un refactor le jour où la campagne aura tranché ; elle ne
 * change **rien** aux sorties aujourd'hui.
 */

import type { PoolConsumptionRuleName } from '../../data/params';

/** Contexte d'une absorption. `runeWeight` n'est utilisé par aucune règle actuelle : il est
 * là parce que la lecture (c) de A1 en aura besoin, et qu'il serait sinon impossible de
 * distinguer « la perte » du « poids de la rune » au moment de l'absorption. */
export interface PoolConsumptionContext {
  /** Reliquat disponible avant la perte, ≥ 0. */
  residual: number;
  /** Poids de perte demandé. */
  lossRequested: number;
  /** Poids de la rune posée (égal à lossRequested tant que overCapExcess.lossBasis ne s'en écarte pas). */
  runeWeight: number;
}

export interface PoolConsumptionRule {
  readonly name: PoolConsumptionRuleName;
  /** Poids absorbé par le reliquat. Doit être dans [0, min(residual, lossRequested)]. */
  absorb(context: PoolConsumptionContext): number;
}

/**
 * `absorb_first` — comportement historique et unique implémentation : le reliquat est
 * consommé en priorité, à concurrence de la perte demandée.
 */
export const absorbFirstRule: PoolConsumptionRule = {
  name: 'absorb_first',
  absorb({ residual, lossRequested }) {
    return Math.min(Math.max(0, residual), Math.max(0, lossRequested));
  },
};

const RULES: Record<PoolConsumptionRuleName, PoolConsumptionRule> = {
  absorb_first: absorbFirstRule,
};

export function getPoolConsumptionRule(name: PoolConsumptionRuleName): PoolConsumptionRule {
  const rule = RULES[name];
  if (!rule) throw new Error(`Unknown pool consumption rule: ${name}`);
  return rule;
}
