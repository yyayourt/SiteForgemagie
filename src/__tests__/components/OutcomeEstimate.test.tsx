// @vitest-environment jsdom
/**
 * TEST DE RENDU — les DEUX formes que `estimateOutcome` peut renvoyer.
 *
 * Motif : P2 a changé le TYPE DE RETOUR de l'estimation. Une estimation était toujours un
 * triplet ; c'est désormais une union discriminée `point | interval`. Un consommateur qui
 * n'aurait traité qu'une seule branche casse — et TypeScript ne l'attrape que si la branche
 * manquante est lue, pas si elle est simplement absente du rendu.
 *
 * ⚠️ Ce que ce test NE couvre PAS : jsdom n'a pas de moteur de mise en page. Il ne peut donc
 * pas voir qu'un intervalle **passe à la ligne au milieu de sa valeur** dans une grille à
 * trois colonnes — le défaut réellement constaté le 2026-09-10, qui n'a été vu qu'à l'écran.
 * Ce qu'il verrouille, c'est la STRUCTURE : les deux branches rendent, chacune avec le bon
 * gabarit et le bon statut. Le rendu visuel reste à vérifier dans le navigateur.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { OutcomeEstimate } from '../../components/atelier/OutcomeEstimate';
import {
  ANCHOR_BEST_CREATION,
  ANCHOR_WORST_CREATION,
  estimateOutcome,
  type ProbabilityEstimate,
  type ProbabilityInput,
} from '../../logic/probability';
import { getProbabilityParams } from '../../data/params';

afterEach(cleanup);

const CHAR_PA = 1;
const CHAR_PM = 23;
const CHAR_INVOCATIONS = 26;

const show = (estimate: ProbabilityEstimate, characteristicId = CHAR_INVOCATIONS, isHeavyExo = false) =>
  render(
    <OutcomeEstimate
      estimate={estimate}
      model="official_factors_linear"
      isHeavyExo={isHeavyExo}
      characteristicId={characteristicId}
    />
  );

const input = (partial: Partial<ProbabilityInput> = {}): ProbabilityInput => ({
  itemLevel: 200,
  line: { value: 25, baseMin: 0, baseMax: 50, isExo: false },
  runeWeight: 1,
  runeValue: 1,
  isHeavyExo: false,
  residualPool: 0,
  weightBudget: 0,
  ...partial,
});

describe('forme « point » — une ligne naturelle', () => {
  const estimate = () => estimateOutcome(input(), getProbabilityParams());

  it('rend le triplet et pas la grille d’intervalle', () => {
    show(estimate());
    expect(screen.getByTestId('point-triplet')).toBeTruthy();
    expect(screen.queryByTestId('interval-ranges')).toBeNull();
    expect(screen.queryByTestId('interval-note')).toBeNull();
  });

  it('porte le badge « modèle empirique » avec le libellé daté du modèle', () => {
    const { container } = show(estimate());
    expect(container.textContent).toContain('modèle empirique');
    expect(container.textContent).toContain('facteurs officiels');
  });
});

describe('forme « intervalle » — une création d’effet non lourde', () => {
  const estimate = () =>
    estimateOutcome(input({ line: { value: 0, baseMin: 0, baseMax: 0, isExo: true } }), getProbabilityParams());

  it('rend les trois intervalles et PAS un chiffre ponctuel', () => {
    show(estimate());
    expect(screen.getByTestId('interval-ranges')).toBeTruthy();
    expect(screen.queryByTestId('point-triplet')).toBeNull();
  });

  it('affiche les bornes des ancres 4 et 5, du pire vers le mieux', () => {
    show(estimate());
    expect(screen.getByTestId('range-sc').textContent).toBe('1 % – 32 %');
    expect(screen.getByTestId('range-sn').textContent).toBe('0 % – 50 %');
    // l'EC se lit dans l'autre sens : le meilleur cas est le PLUS BAS
    expect(screen.getByTestId('range-ec').textContent).toBe('18 % – 99 %');
  });

  it('ne porte PAS le badge « modèle » : le chiffre ne vient pas du modèle', () => {
    const { container } = show(estimate());
    expect(container.textContent).not.toContain('modèle empirique');
  });

  it('déclare le statut INCONNU et nomme la borne de tirage', () => {
    show(estimate());
    const note = screen.getByTestId('interval-note').textContent ?? '';
    expect(note).toContain('inconnu');
    expect(note).toContain('la borne basse');
    expect(note).toContain('Monte Carlo');
  });

  it('suit le paramètre de tirage quand il change', () => {
    const params = { ...getProbabilityParams(), unknownIntervalSampling: 'best' as const };
    const e = estimateOutcome(input({ line: { value: 0, baseMin: 0, baseMax: 0, isExo: true } }), params);
    show(e);
    expect(screen.getByTestId('interval-note').textContent).toContain('la borne haute');
    if (e.kind !== 'interval') throw new Error('intervalle attendu');
    expect(e.sampling).toEqual(ANCHOR_BEST_CREATION);
  });

  it('le tirage par défaut reste la borne basse', () => {
    const e = estimateOutcome(input({ line: { value: 0, baseMin: 0, baseMax: 0, isExo: true } }), getProbabilityParams());
    if (e.kind !== 'interval') throw new Error('intervalle attendu');
    expect(e.sampling).toEqual(ANCHOR_WORST_CREATION);
  });
});

describe('forme « point » SOURCE PRIMAIRE — un exo lourd', () => {
  const estimate = () =>
    estimateOutcome(
      input({ line: { value: 0, baseMin: 0, baseMax: 0, isExo: true }, isHeavyExo: true }),
      getProbabilityParams()
    );

  it('rend 1 / 0 / 99 sans badge de modèle', () => {
    const { container } = show(estimate(), CHAR_PA, true);
    expect(screen.getByTestId('point-triplet').textContent).toContain('1 %');
    expect(container.textContent).not.toContain('modèle empirique');
  });

  it('PA : le taux est présenté comme VERBATIM (source primaire)', () => {
    show(estimate(), CHAR_PA, true);
    const note = screen.getByTestId('heavy-exo-note').textContent ?? '';
    expect(note).toContain('source primaire');
    expect(note).toContain('écrit tel quel');
  });

  it('PM : même clamp, mais présenté comme EXTRAPOLÉ (hypothèse communautaire)', () => {
    show(estimate(), CHAR_PM, true);
    const note = screen.getByTestId('heavy-exo-note').textContent ?? '';
    expect(note).toContain('hypothèse');
    expect(note).toContain("n'est écrit par Ankama que pour le PA");
    expect(note).toContain('le calcul est identique, la preuve ne l');
  });
});
