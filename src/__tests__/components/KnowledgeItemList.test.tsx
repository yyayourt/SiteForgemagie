// @vitest-environment jsdom
// src/__tests__/components/KnowledgeItemList.test.tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ParamsProvider } from '../../app/ParamsProvider';
import { KnowledgeItemList } from '../../components/knowledge/KnowledgeItemList';
import type { KnowledgeItem } from '../../content/knowledge';

afterEach(cleanup);

const show = (items: KnowledgeItem[]) => render(<ParamsProvider><KnowledgeItemList items={items} /></ParamsProvider>);

describe('KnowledgeItemList — position de la valeur live', () => {
  it('un texte qui se termine par une phrase complète (« . ») affiche la valeur sur sa propre ligne, avec le libellé du paramètre', () => {
    const items: KnowledgeItem[] = [
      {
        text: 'Répartition SN = min(50 %, 1 − SC) : elle reproduit les triplets Ankama.',
        status: 'MODÈLE EMPIRIQUE',
        source: 'test',
        param: 'params.probability.snSplit',
      },
    ];
    show(items);
    expect(screen.getByText(/Valeur actuelle/)).toBeTruthy();
  });

  it('un texte qui se termine par « : » garde la valeur collée en ligne, sans « Valeur actuelle »', () => {
    const items: KnowledgeItem[] = [
      {
        text: 'Modèle actif :',
        status: 'INCONNU',
        source: 'test',
        param: 'params.probability.snSplit',
      },
    ];
    show(items);
    expect(screen.queryByText(/Valeur actuelle/)).toBeNull();
  });
});
