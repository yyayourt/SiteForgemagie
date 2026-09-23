/**
 * Logique d'interface de l'atelier, pure et testée : palier effectif, double clic « armé »
 * sur un palier de ligne, nettoyage d'un exo créé puis abandonné à 0, navigation clavier.
 * Ce sont des choix d'INTERFACE, pas des règles du jeu : en jeu, une ligne exotique n'existe
 * qu'après une frappe ; ici elle est créée à 0 pour afficher la prévision, d'où le nettoyage.
 */
import type { RuneTier, SimulatedStat } from '../../types';

export type SlotKind = 'rune' | 'transcendence' | 'orb' | 'potion';

export type ArmedTier = { characteristicId: number; tier: RuneTier } | null;

/** Palier effectif : le choisi s'il existe pour cette ligne, sinon le premier disponible. */
export function resolveTier(options: readonly { tier: RuneTier }[], chosen: RuneTier): RuneTier {
  return options.some((o) => o.tier === chosen) ? chosen : (options[0]?.tier ?? 'normal');
}

/** Premier clic sur un palier : l'arme. Second clic sur le même palier de la même ligne : fusionne. */
export function tierClick(armed: ArmedTier, characteristicId: number, tier: RuneTier): { armed: ArmedTier; fire: boolean } {
  const fire = armed !== null && armed.characteristicId === characteristicId && armed.tier === tier;
  return { armed: { characteristicId, tier }, fire };
}

/** Exo à retirer quand la cible change : la cible courante est un exo encore à 0. */
export function exoToDropOnRetarget(stats: readonly SimulatedStat[], currentId: number | null, nextId: number): number | null {
  if (currentId === null || currentId === nextId) return null;
  const current = stats.find((s) => s.characteristicId === currentId);
  return current && current.isExo && current.currentValue === 0 ? currentId : null;
}

/** Ligne suivante/précédente parmi les lignes forgeables et non verrouillées, sans boucler. */
export function nextLineId(stats: readonly SimulatedStat[], currentId: number | null, dir: 1 | -1): number | null {
  const ids = stats.filter((s) => s.isForgemeable && !s.isLocked).map((s) => s.characteristicId);
  if (ids.length === 0) return null;
  const idx = currentId === null ? -1 : ids.indexOf(currentId);
  if (idx === -1) return dir === 1 ? ids[0] : ids[ids.length - 1];
  return ids[Math.min(ids.length - 1, Math.max(0, idx + dir))];
}
