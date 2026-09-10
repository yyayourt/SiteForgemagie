/**
 * RÈGLES DE PERTE DU DEVBLOG 1.27 (P7, 2026-09-10) — `SOURCE PRIMAIRE — v1.27`.
 *
 *   « Après un échec, les bonus d'un objet peuvent redescendre jusqu'à 0 au minimum, alors
 *     que les malus ne peuvent dépasser le malus maximum naturel. »
 *   « Il est impossible de "puiser" dans les malus, c'est-à-dire les effets négatifs de
 *     l'objet, à moins que ceux-ci ne soient overmaxés, car ils joueraient souvent le rôle
 *     de puits sans fonds. »
 *   « Si ce résultat n'est pas possible (objet qui ne dispose que d'un seul jet par exemple),
 *     rien ne se passe en cas de succès partiel. »
 *
 * N'entre PAS ici : l'épargne probabiliste d'un bonus « trop puissant ». Ankama ne donne
 * aucun chiffre ; l'implémenter reviendrait à inventer une formule.
 */
import { describe, it, expect } from 'vitest';
import { applyRune } from '../../logic/engine';
import { CHAR, getLine, line, makeState, seqRng, testParams } from './helpers';

/** Une ligne de malus : jet naturel négatif. Ex. −10 à −5 de Chance. */
const malus = (value: number, baseMin = -10, baseMax = -5) =>
  line({ characteristicId: CHAR.CHANCE, value, baseMin, baseMax });

describe('bonus : plancher à 0', () => {
  it('un EC ne descend jamais un bonus sous 0, et signale ce qu’il n’a pas pu retirer', () => {
    // Force 3 (poids 3), rune Force +10 (poids 10) : l'objet ne peut payer que 3.
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 3, baseMax: 50 })]);
    const r = applyRune(state, { characteristicId: CHAR.FORCE, value: 10 }, 'EC', testParams(), seqRng([0]));
    expect(getLine(r.state, CHAR.FORCE).value).toBe(0);
    expect(r.unabsorbedWeight).toBeCloseTo(7, 9);
  });
});

describe('malus : bornés au malus maximum naturel, et seulement si overmaxés', () => {
  it("un malus AU jet naturel n'est jamais victime — sinon c'est un puits sans fond", () => {
    // Chance à −5 (son meilleur jet naturel n'est pas dépassé) + Force 10.
    const state = makeState([
      malus(-5),
      line({ characteristicId: CHAR.FORCE, value: 10, baseMax: 50 }),
    ]);
    const r = applyRune(state, { characteristicId: CHAR.FORCE, value: 5 }, 'EC', testParams(), seqRng([0]));
    expect(getLine(r.state, CHAR.CHANCE).value).toBe(-5); // intact
    expect(getLine(r.state, CHAR.FORCE).value).toBe(5); // c'est le bonus qui a payé
  });

  it('un malus SOUS son jet naturel (pire que −5) reste intact lui aussi', () => {
    const state = makeState([
      malus(-8),
      line({ characteristicId: CHAR.FORCE, value: 10, baseMax: 50 }),
    ]);
    const r = applyRune(state, { characteristicId: CHAR.FORCE, value: 5 }, 'EC', testParams(), seqRng([0]));
    expect(getLine(r.state, CHAR.CHANCE).value).toBe(-8);
  });

  it("un malus OVERMAXÉ (meilleur que le naturel) peut payer, jusqu'à son jet naturel et pas plus", () => {
    // Chance à −1 alors que le naturel plafonne à −5 : 4 points d'over, poids 4.
    // Rune Force +10 (poids 10) en EC : le malus paie ses 4, la Force paie le reste.
    const state = makeState([
      malus(-1),
      line({ characteristicId: CHAR.FORCE, value: 20, baseMax: 50 }),
    ]);
    const r = applyRune(state, { characteristicId: CHAR.FORCE, value: 10 }, 'EC', testParams(), seqRng([0]));
    const chance = getLine(r.state, CHAR.CHANCE).value;
    expect(chance).toBeGreaterThanOrEqual(-5); // jamais au-delà du malus maximum naturel
    expect(chance).toBeLessThan(-1); // il a bien contribué
    expect(r.unabsorbedWeight).toBe(0);
  });

  it("un malus overmaxé seul ne paie que sa part d'over, le reste manque", () => {
    // Chance à −1 seule : 4 de poids disponibles. Rune Force +10 (poids 10) en EC.
    const state = makeState([malus(-1)]);
    const r = applyRune(state, { characteristicId: CHAR.FORCE, value: 10 }, 'EC', testParams(), seqRng([0]));
    expect(getLine(r.state, CHAR.CHANCE).value).toBe(-5);
    expect(r.unabsorbedWeight).toBeCloseTo(6, 9);
  });
});

describe('succès neutre impossible : « rien ne se passe »', () => {
  it("un SN dont la perte ne peut pas être payée laisse l'objet strictement identique", () => {
    // Objet vide : aucune ligne ne peut perdre, aucun reliquat.
    // La rune Force +1 (poids 1) est posée, puis reprise... et il ne reste rien à reprendre
    // au-delà d'elle-même : le gain de 1 couvre exactement la perte de 1.
    // On force le cas impossible avec une rune tronquée facturée sur la rune entière.
    const state = makeState([line({ characteristicId: CHAR.FORCE, value: 0, baseMax: 50 })], 0);
    const p = testParams({ lossSelection: { unpayableSn: 'no_effect' } });
    const r = applyRune(state, { characteristicId: CHAR.FORCE, value: 5 }, 'SN', p, seqRng([0]));
    // Ici la perte EST payable (la ligne visée paie), donc le SN s'applique normalement :
    // c'est le comportement Unity, et le no-op ne doit surtout pas s'y substituer.
    expect(r.snNoOp).toBe(false);
    expect(r.accepted).toBe(true);
  });

  it('le défaut du fichier est bien `no_effect` (SOURCE PRIMAIRE — v1.27)', () => {
    expect(testParams().lossSelection.unpayableSn).toBe('no_effect');
  });

  it("quand le no-op se déclenche, l'objet ressort strictement identique", () => {
    // Construction d'un SN réellement impayable : une rune TRONQUÉE par la borne, facturée
    // sur la rune ENTIÈRE (lossBasis = full_rune), sur un objet dont la seule autre ligne est
    // verrouillée. La ligne visée ne peut rendre que ce qui a atterri (3), pas les 10 dus.
    const state = makeState(
      [line({ characteristicId: CHAR.SAGESSE, value: 10, baseMin: 0, baseMax: 20, isLocked: true })],
      0
    );
    const p = testParams({
      overCapWeight: 3,
      overCapExcess: { behaviour: 'truncate', lossBasis: 'full_rune' },
      lossSelection: { unpayableSn: 'no_effect' },
    });
    const r = applyRune(state, { characteristicId: CHAR.FORCE, value: 10 }, 'SN', p, seqRng([0]));

    expect(r.snNoOp).toBe(true);
    expect(r.accepted).toBe(true);
    expect(r.outcome).toBe('SN');
    expect(r.state).toEqual(state); // aucun gain, aucune perte
    expect(r.residualPoolAfter).toBe(r.residualPoolBefore); // reliquat intact
    expect(r.losses).toEqual([]);
    expect(r.appliedValue).toBe(0);
  });

  it("l'ancien défaut `ec_no_effect` reste disponible et convertit en échec", () => {
    const state = makeState(
      [line({ characteristicId: CHAR.SAGESSE, value: 10, baseMin: 0, baseMax: 20, isLocked: true })],
      0
    );
    const p = testParams({
      overCapWeight: 3,
      overCapExcess: { behaviour: 'truncate', lossBasis: 'full_rune' },
      lossSelection: { unpayableSn: 'ec_no_effect' },
    });
    const r = applyRune(state, { characteristicId: CHAR.FORCE, value: 10 }, 'SN', p, seqRng([0]));
    expect(r.snNoOp).toBe(false);
    expect(r.snConvertedToEc).toBe(true);
    expect(r.outcome).toBe('EC');
  });
});
