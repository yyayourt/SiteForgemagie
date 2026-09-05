/**
 * Générateurs aléatoires injectables.
 * - createSeededRng(seed) : mulberry32, déterministe, pour les tests et Monte Carlo reproductible.
 * - mathRandomRng : Math.random, pour l'application.
 */

import type { Rng } from '../../types/forgemagie';

export function createSeededRng(seed: number): Rng {
  let a = seed >>> 0;
  return {
    next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export const mathRandomRng: Rng = { next: () => Math.random() };
