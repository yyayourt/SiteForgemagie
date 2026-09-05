/**
 * Persistance locale (localStorage), tolérante : toute lecture ou écriture échouée
 * est ignorée (navigation privée, quota, JSON corrompu).
 */

export const STORAGE_KEYS = {
  theme: 'forge-theme',
  params: 'forge-params',
  atelier: 'forge-atelier',
} as const;

export function loadJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible : l'état reste en mémoire */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
