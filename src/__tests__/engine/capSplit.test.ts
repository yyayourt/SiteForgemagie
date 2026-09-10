/**
 * SCISSION DES DEUX PLAFONDS (P4, 2026-09-10).
 *
 * Le DevBlog Ankama 1.27 décrit DEUX limites distinctes, que le corpus communautaire avait
 * fusionnées sous un unique « cap 101 » :
 *   • PAR EFFET (`overCapWeight`) — l'exemple des 101 points de Force sur une base 60 ;
 *   • PAR OBJET (`objectNonNaturalCap`) — celui qui interdit PA ET PM sur un objet qui n'a
 *     ni l'un ni l'autre. **Ankama n'en donne pas la valeur.**
 *
 * Critère d'acceptation de la scission : le comportement doit être IDENTIQUE tant que les
 * deux valent 101. C'est ce que vérifie le premier bloc — et c'est aussi pourquoi les tests
 * existants (overCap.test.ts, overCapTruncate.test.ts) n'ont pas été touchés.
 */
import { describe, it, expect } from 'vitest';
import { applyRune, checkOverCap } from '../../logic/engine';
import { getEngineParams } from '../../data/params';
import { CHAR, line, makeState, seqRng, testParams } from './helpers';

const strict = (extra: Parameters<typeof testParams>[0] = {}) =>
  testParams({ overCapExcess: { behaviour: 'refuse' }, ...extra });

describe('valeur par défaut : rien ne change', () => {
  it('les deux plafonds valent 101 dans le fichier', () => {
    const p = getEngineParams();
    expect(p.overCapWeight).toBe(101);
    expect(p.objectNonNaturalCap).toBe(101);
  });

  it("le champ `cap` de checkOverCap reste le plafond PAR EFFET (forme du retour inchangée)", () => {
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 80, baseMax: 50 })]);
    const c = checkOverCap(state, CHAR.FORCE, strict());
    expect(c.cap).toBe(101);
    expect(Object.keys(c).sort()).toEqual(['allowed', 'cap', 'lineWeightAfter', 'overWeightAfter']);
  });
});

describe('les deux plafonds sont bien indépendants', () => {
  it("desserrer le plafond OBJET ne desserre pas le plafond par EFFET", () => {
    // Force 50/50, on veut monter à 102 : c'est la règle 1 (par effet) qui refuse.
    const base = makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]);
    const loose = strict({ objectNonNaturalCap: 189 });
    expect(applyRune(base, { characteristicId: CHAR.FORCE, value: 52 }, 'SC', loose, seqRng([0])).accepted).toBe(false);
    expect(applyRune(base, { characteristicId: CHAR.FORCE, value: 51 }, 'SC', loose, seqRng([0])).accepted).toBe(true);
  });

  it("desserrer le plafond OBJET autorise un cumul que 101 refusait", () => {
    // 213/200 vita (over 2,6) + exo PA (100) = 102,6 : refusé à 101, accepté à 151.
    const capeVita = line({ characteristicId: CHAR.VITALITE, value: 213, baseMin: 151, baseMax: 200 });
    const state = makeState([capeVita]);
    const at101 = applyRune(state, { characteristicId: CHAR.PA, value: 1 }, 'SC', strict(), seqRng([0]));
    expect(at101.accepted).toBe(false);
    expect(at101.reason).toBe('over_cap_exceeded');

    const at151 = applyRune(state, { characteristicId: CHAR.PA, value: 1 }, 'SC', strict({ objectNonNaturalCap: 151 }), seqRng([0]));
    expect(at151.accepted).toBe(true);
  });

  it("resserrer le plafond par EFFET ne touche pas le cumul objet", () => {
    // Deux lignes en over de 20 chacune = 40 de cumul, sous un plafond objet de 101 ;
    // le plafond par effet à 30 ne concerne que la ligne visée, en over de 20 : accepté.
    const state = makeState([
      line({ characteristicId: CHAR.FORCE, value: 70, baseMax: 50 }),
      line({ characteristicId: CHAR.CHANCE, value: 20, baseMax: 20 }),
    ]);
    const p = strict({ overCapWeight: 30, overCapLineBasis: 'over_part' });
    expect(applyRune(state, { characteristicId: CHAR.CHANCE, value: 20 }, 'SC', p, seqRng([0])).accepted).toBe(true);
  });
});

describe("encadrement [100 ; 190[ du plafond objet — ce que les bornes veulent dire", () => {
  const clean = () => makeState([line({ characteristicId: CHAR.FORCE, value: 50 })]);

  it('borne BASSE : un exo PA seul (100) doit passer, donc le plafond ne peut pas descendre sous 100', () => {
    expect(applyRune(clean(), { characteristicId: CHAR.PA, value: 1 }, 'SC', strict({ objectNonNaturalCap: 100 }), seqRng([0])).accepted).toBe(true);
    expect(applyRune(clean(), { characteristicId: CHAR.PA, value: 1 }, 'SC', strict({ objectNonNaturalCap: 99 }), seqRng([0])).accepted).toBe(false);
  });

  it('borne HAUTE : PA + PM (190) doit être refusé, donc le plafond reste strictement sous 190', () => {
    const withPa = applyRune(clean(), { characteristicId: CHAR.PA, value: 1 }, 'SC', strict({ objectNonNaturalCap: 189 }), seqRng([0]));
    expect(withPa.accepted).toBe(true);
    const withPm = applyRune(withPa.state, { characteristicId: CHAR.PM, value: 1 }, 'SC', strict({ objectNonNaturalCap: 189 }), seqRng([0]));
    expect(withPm.accepted).toBe(false);
    expect(withPm.reason).toBe('over_cap_exceeded');
  });

  it("question ouverte, non tranchée : exo PA + exo PO (151) passe à 151 et pas à 101", () => {
    // Aucune observation ne dit si ce cumul existe en jeu. S'il existe, la borne basse
    // remonte à 151 et la valeur 101 est réfutée. Test à mener en HDV, pas ici.
    const withPa = applyRune(clean(), { characteristicId: CHAR.PA, value: 1 }, 'SC', strict({ objectNonNaturalCap: 151 }), seqRng([0]));
    expect(applyRune(withPa.state, { characteristicId: CHAR.PO, value: 1 }, 'SC', strict({ objectNonNaturalCap: 151 }), seqRng([0])).accepted).toBe(true);
    const withPa101 = applyRune(clean(), { characteristicId: CHAR.PA, value: 1 }, 'SC', strict(), seqRng([0]));
    expect(applyRune(withPa101.state, { characteristicId: CHAR.PO, value: 1 }, 'SC', strict(), seqRng([0])).accepted).toBe(false);
  });
});
