/* eslint-disable react-refresh/only-export-components -- fournisseur/contexte et hook partagés volontairement dans le même fichier */
/**
 * Surcharges de empirical_params.json (profil actif), partagées par toute l'interface.
 *
 * Un profil = { format, version, name, author, gameVersion, createdAt, overrides } où
 * overrides ne contient QUE les écarts par rapport aux valeurs par défaut du fichier.
 * L'état courant est mémorisé en localStorage ; import/export en JSON.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { PARAMS_META, type ParamOverrides } from '../data/params';
import { PARAM_BY_PATH, isDefaultValue, validateParamValue } from '../data/paramRegistry';
import { loadJson, saveJson, STORAGE_KEYS } from '../state/persistence';

export interface ProfileMeta {
  name: string;
  author: string;
}

export interface ProfileFile {
  format: 'forge-profile';
  version: 1;
  name: string;
  author: string;
  gameVersion: string;
  createdAt: string;
  overrides: Record<string, unknown>;
}

interface ParamsContextValue {
  overrides: ParamOverrides;
  overrideCount: number;
  profile: ProfileMeta;
  setProfileMeta: (meta: Partial<ProfileMeta>) => void;
  setOverride: (path: string, value: unknown) => { ok: boolean; reason?: string };
  resetOverride: (path: string) => void;
  resetAll: () => void;
  exportProfile: () => string;
  importProfile: (json: string) => { ok: boolean; applied: number; errors: string[] };
}

const ParamsContext = createContext<ParamsContextValue | null>(null);

interface Stored {
  profile: ProfileMeta;
  overrides: Record<string, unknown>;
}

function sanitize(overrides: Record<string, unknown>): { clean: Record<string, unknown>; errors: string[] } {
  const clean: Record<string, unknown> = {};
  const errors: string[] = [];
  for (const [path, value] of Object.entries(overrides)) {
    const d = PARAM_BY_PATH.get(path);
    if (!d) {
      errors.push(`${path} : paramètre inconnu, ignoré`);
      continue;
    }
    const v = validateParamValue(d, value);
    if (!v.ok) {
      errors.push(`${path} : ${v.reason}, ignoré`);
      continue;
    }
    if (!isDefaultValue(d, value)) clean[path] = value;
  }
  return { clean, errors };
}

export function ParamsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Stored>(() => {
    const saved = loadJson<Stored>(STORAGE_KEYS.params);
    if (!saved) return { profile: { name: 'Profil local', author: '' }, overrides: {} };
    return { profile: saved.profile ?? { name: 'Profil local', author: '' }, overrides: sanitize(saved.overrides ?? {}).clean };
  });

  useEffect(() => {
    saveJson(STORAGE_KEYS.params, state);
  }, [state]);

  const setOverride = useCallback((path: string, value: unknown) => {
    const d = PARAM_BY_PATH.get(path);
    if (!d) return { ok: false, reason: 'paramètre inconnu' };
    const v = validateParamValue(d, value);
    if (!v.ok) return v;
    setState((s) => {
      const overrides = { ...s.overrides };
      if (isDefaultValue(d, value)) delete overrides[path];
      else overrides[path] = value;
      return { ...s, overrides };
    });
    return { ok: true };
  }, []);

  const resetOverride = useCallback((path: string) => {
    setState((s) => {
      const overrides = { ...s.overrides };
      delete overrides[path];
      return { ...s, overrides };
    });
  }, []);

  const resetAll = useCallback(() => setState((s) => ({ ...s, overrides: {} })), []);

  const setProfileMeta = useCallback((meta: Partial<ProfileMeta>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...meta } }));
  }, []);

  const exportProfile = useCallback((): string => {
    const file: ProfileFile = {
      format: 'forge-profile',
      version: 1,
      name: state.profile.name,
      author: state.profile.author,
      gameVersion: PARAMS_META.gameVersion,
      createdAt: new Date().toISOString(),
      overrides: state.overrides,
    };
    return JSON.stringify(file, null, 2);
  }, [state]);

  const importProfile = useCallback((json: string) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      return { ok: false, applied: 0, errors: ['JSON invalide'] };
    }
    if (typeof parsed !== 'object' || parsed === null || (parsed as ProfileFile).format !== 'forge-profile') {
      return { ok: false, applied: 0, errors: ['Ce fichier n\'est pas un profil La Forge (format « forge-profile »)'] };
    }
    const file = parsed as ProfileFile;
    const { clean, errors } = sanitize(file.overrides ?? {});
    if (file.gameVersion && file.gameVersion !== PARAMS_META.gameVersion) {
      errors.unshift(`Profil écrit pour la version ${file.gameVersion}, paramètres actuels en ${PARAMS_META.gameVersion}`);
    }
    setState({ profile: { name: file.name || 'Profil importé', author: file.author || '' }, overrides: clean });
    return { ok: true, applied: Object.keys(clean).length, errors };
  }, []);

  const value = useMemo<ParamsContextValue>(
    () => ({
      overrides: state.overrides,
      overrideCount: Object.keys(state.overrides).length,
      profile: state.profile,
      setProfileMeta,
      setOverride,
      resetOverride,
      resetAll,
      exportProfile,
      importProfile,
    }),
    [state, setProfileMeta, setOverride, resetOverride, resetAll, exportProfile, importProfile]
  );

  return <ParamsContext.Provider value={value}>{children}</ParamsContext.Provider>;
}

export function useParams(): ParamsContextValue {
  const ctx = useContext(ParamsContext);
  if (!ctx) throw new Error('useParams doit être utilisé sous ParamsProvider');
  return ctx;
}
