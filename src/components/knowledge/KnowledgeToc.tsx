/* eslint-disable react-refresh/only-export-components -- composant et hook partagés volontairement dans le même fichier */
/**
 * Sommaire latéral de la page « Savoir » : liste de boutons stylés en lien (un vrai `<a href="#id">`
 * casserait le routeur par hash de App.tsx). Version repliable (`<details>`) sous 1024 px, version
 * fixe et collante (`lg:sticky`) au-delà.
 */
import { useEffect, useState } from 'react';

export interface TocEntry {
  id: string;
  label: string;
}

function TocList({ entries, activeId, onNavigate }: { entries: TocEntry[]; activeId: string | null; onNavigate: (id: string) => void }) {
  return (
    <ul className="m-0 p-0 list-none grid gap-1">
      {entries.map((e) => {
        const active = e.id === activeId;
        return (
          <li key={e.id}>
            <button
              type="button"
              aria-current={active ? 'true' : undefined}
              onClick={() => onNavigate(e.id)}
              className={`w-full text-left text-sm px-2 py-1 rounded-control hover:text-molten-text ${
                active ? 'text-molten-text font-medium' : 'text-ash-2'
              }`}
            >
              {e.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** `<nav aria-label="Sommaire">` : liste de boutons, repliable sous 1024 px, collante au-delà. */
export function KnowledgeToc({
  entries,
  activeId,
  onNavigate,
}: {
  entries: TocEntry[];
  activeId: string | null;
  onNavigate: (id: string) => void;
}) {
  return (
    <>
      <details className="lg:hidden surface-iron p-3 rounded-control">
        <summary className="text-sm text-ash cursor-pointer select-none">Sommaire</summary>
        <nav aria-label="Sommaire" className="mt-2">
          <TocList entries={entries} activeId={activeId} onNavigate={onNavigate} />
        </nav>
      </details>
      <nav aria-label="Sommaire" className="hidden lg:block lg:sticky lg:top-4">
        <TocList entries={entries} activeId={activeId} onNavigate={onNavigate} />
      </nav>
    </>
  );
}

/**
 * Id de la section actuellement visible (IntersectionObserver sur document.getElementById(id)).
 * Sans IntersectionObserver (jsdom), renvoie toujours le premier id : c'est un repli calculé au
 * rendu, pas un setState synchrone dans l'effet.
 */
export function useActiveSection(ids: string[]): string | null {
  const [visibleId, setVisibleId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || ids.length === 0) return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        const firstVisible = ids.find((id) => visible.has(id));
        setVisibleId(firstVisible ?? null);
      },
      { rootMargin: '0px 0px -70% 0px' }
    );
    const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  if (typeof IntersectionObserver === 'undefined') return ids[0] ?? null;
  return visibleId ?? ids[0] ?? null;
}
