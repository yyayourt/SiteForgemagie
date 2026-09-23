// @vitest-environment jsdom
// src/__tests__/components/RunePalette.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { RunePalette } from '../../components/atelier/RunePalette';
import { getCharacteristicName } from '../../data/dataset';
import { getDensity } from '../../data/params';
import type { SimulatedStat } from '../../types';

afterEach(cleanup);

const VITA = 11;
const PA = 1;
const vitality: SimulatedStat = {
  characteristicId: VITA, statName: getCharacteristicName(VITA), baseMin: 16, baseMax: 20, currentValue: 20,
  weightPerPoint: 0.2, isExo: false, isForgemeable: true, isLocked: false,
};

const setup = (over: Partial<Parameters<typeof RunePalette>[0]> = {}) => {
  const props = {
    stats: [vitality],
    densityOf: (cid: number) => getDensity(cid),
    heavyIds: [1, 23],
    selectedId: VITA,
    slotKind: 'rune' as const,
    mode: 'forge' as const,
    disabled: false,
    canTranscend: false,
    onPickCharacteristic: vi.fn(),
    onPickSlot: vi.fn(),
    ...over,
  };
  render(<RunePalette {...props} />);
  return props;
};

describe('RunePalette', () => {
  it("tuile absente de l'objet → onPickCharacteristic(cid, false)", () => {
    const p = setup();
    fireEvent.click(screen.getByRole('button', { name: getCharacteristicName(PA) }));
    expect(p.onPickCharacteristic).toHaveBeenCalledWith(PA, false);
  });

  it("tuile présente → onPickCharacteristic(cid, true), marquée comme visée", () => {
    const p = setup();
    const tile = screen.getByRole('button', { name: getCharacteristicName(VITA) });
    expect(tile.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(tile);
    expect(p.onPickCharacteristic).toHaveBeenCalledWith(VITA, true);
  });

  it('le filtre sans accents masque les autres tuiles', () => {
    setup();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'vitalite' } });
    expect(screen.queryByRole('button', { name: getCharacteristicName(PA) })).toBeNull();
  });

  it('potion toujours désactivée ; transcendance selon canTranscend ; orbe → onPickSlot', () => {
    const p = setup();
    expect((screen.getByRole('button', { name: /Potion/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /Transcendance/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Orbe/ }));
    expect(p.onPickSlot).toHaveBeenCalledWith('orb');
  });

  it('mode Ajuster : tuile présente désactivée, tuile absente active', () => {
    setup({ mode: 'adjust' });
    expect((screen.getByRole('button', { name: getCharacteristicName(VITA) }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: getCharacteristicName(PA) }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('désactivée : tout est grisé', () => {
    setup({ disabled: true });
    expect((screen.getByRole('button', { name: getCharacteristicName(PA) }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /Orbe/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('marqueur exo lourd : présent sur la tuile PA (absente, heavy), absent sur Vitalité (sur objet)', () => {
    setup();
    expect(screen.getByRole('button', { name: getCharacteristicName(PA) }).textContent).toContain('✦');
    expect(screen.getByRole('button', { name: getCharacteristicName(VITA) }).textContent).not.toContain('✦');
  });
});
