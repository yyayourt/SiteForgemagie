/**
 * Qualité globale d'un objet — le facteur de difficulté que le DevBlog Ankama place EN TÊTE,
 * et qui était absent du modèle jusqu'au 2026-09-10.
 *
 * `SOURCE PRIMAIRE — v1.27` (DevBlog « La nouvelle forgemagie ») :
 *
 *   « Elle dépend désormais, par ordre décroissant d'importance :
 *     — de la qualité globale de l'objet : plus les jets de l'objet sont proches du maximum,
 *       plus l'objet a une bonne qualité, et la forgemagie est difficile. […] Cependant, LE
 *       JET EN COURS DE MODIFICATION N'EST PAS PRIS EN COMPTE dans le calcul de la qualité,
 *       afin de limiter l'impact de ce facteur sur les objets bas-niveau ou avec un seul jet. »
 *
 * ─── Pourquoi ce module change le diagnostic, pas les sorties ───────────────────────────
 * Sur une ligne 49/50, le modèle sortait 16/42/42 là où l'ancre 2 du DevBlog donne 43/50/7.
 * L'explication n'est PAS un mauvais réglage de `a` : c'est que le modèle ne pouvait pas
 * distinguer deux situations que le DevBlog sépare —
 *   • ancre 2 (43 %) : « bonus simples sur OBJETS SIMPLES », ligne visée au parfait ;
 *   • ancre 3 (15 %) : « bonus maximums sur OBJETS COMPLEXES haut-niveau », où c'est TOUT
 *     L'OBJET qui est parfait.
 * Les deux ont la même distance au jet max sur la ligne visée. Seule la qualité globale les
 * sépare. Tant qu'elle n'est pas dans le modèle, aucune valeur de `a` ne peut satisfaire les
 * deux ancres à la fois : c'est une variable manquante, pas un paramètre mal réglé.
 *
 * La pente `e` vaut 0 par défaut : ce module ne change AUCUNE sortie tant qu'un dataset n'a
 * pas mesuré cette pente (N documenté, CLAUDE.md). Il rend la mesure possible.
 *
 * ─── Ce qui reste inconnu ───────────────────────────────────────────────────────────────
 * Ankama ne dit pas comment la qualité est agrégée. Le choix retenu ici — moyenne pondérée
 * par la densité, sur les lignes naturelles — est le plus simple compatible avec « plus les
 * jets de l'objet sont proches du maximum ». Pondérer par la densité (plutôt que compter les
 * lignes à égalité) est une décision de projet : `INCONNU`.
 */

import type { EngineParams } from '../../data/params';
import type { ForgemagieItemState, ItemLine } from '../../types/forgemagie';
import { isOverOrExo } from '../engine/weights';

/** Une ligne compte dans la qualité si elle a un jet naturel positif et une densité connue. */
function countsForQuality(line: ItemLine, params: EngineParams): boolean {
  return !line.isExo && line.baseMax > 0 && (params.densities.get(line.characteristicId) ?? 0) > 0;
}

/**
 * Qualité globale ∈ [0, 1], **hors ligne visée** : Σ(valeur × densité) / Σ(jetMax × densité)
 * sur les lignes naturelles autres que `excludeCharacteristicId`.
 *
 * 0 = toutes les autres lignes à vide, 1 = toutes au jet parfait. Les lignes en over
 * comptent, plafonnées à leur jet max : au-delà, c'est le terme d (usage de la borne
 * over/exo) qui prend le relais, et le DevBlog traite bien les deux séparément.
 *
 * Un objet sans autre ligne pesable renvoie 0 — ce qui est exactement l'intention d'Ankama
 * (« limiter l'impact de ce facteur sur les objets bas-niveau ou avec un seul jet »).
 */
export function itemQualityExcluding(
  state: ForgemagieItemState,
  excludeCharacteristicId: number,
  params: EngineParams
): number {
  let current = 0;
  let perfect = 0;
  for (const line of state.lines) {
    if (line.characteristicId === excludeCharacteristicId) continue;
    if (!countsForQuality(line, params)) continue;
    const density = params.densities.get(line.characteristicId)!;
    current += Math.min(line.value, line.baseMax) * density;
    perfect += line.baseMax * density;
  }
  if (perfect <= 0) return 0;
  return Math.min(1, Math.max(0, current / perfect));
}

/** Nombre de lignes naturelles pesables : sert au drapeau « objet à un seul jet ». */
export function naturalLineCount(state: ForgemagieItemState, params: EngineParams): number {
  return state.lines.filter((l) => countsForQuality(l, params)).length;
}

/**
 * Nombre de lignes en over ou exotiques, **ligne visée comprise** une fois la rune appliquée.
 * `SOURCE PRIMAIRE — v1.27` : « Plus l'objet dispose d'overmax/bonus exotiques (EN PRENANT EN
 * COMPTE CELUI EN COURS DE MODIFICATION), plus la difficulté augmente. »
 *
 * C'est le seul facteur du DevBlog qui inclut le jet en cours de modification, alors que la
 * qualité globale l'exclut : deux traitements différents du même jet dans la même formule.
 */
export function overExoLineCount(state: ForgemagieItemState): number {
  return state.lines.filter((l) => isOverOrExo(l)).length;
}
