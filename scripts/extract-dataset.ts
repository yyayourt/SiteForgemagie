/**
 * Extraction du dataset de référence depuis l'API DofusDB (api.dofusdb.fr).
 *
 * Usage : npm run extract-dataset
 *         (node --experimental-strip-types scripts/extract-dataset.ts)
 *
 * Produit :
 *   data/dataset.json     — méta (version du jeu, date), effets, caractéristiques,
 *                           types d'objets, runes, runes de transcendance, potions, orbes
 *   data/items.json       — tous les objets équipables (effects + possibleEffects)
 *   data/rune-tiers.json  — paliers de runes réellement existants par caractéristique
 *
 * Statut épistémique des données produites : données dataminées TIERCES (DofusDB),
 * non officielles. Aucun champ de densité de forgemagie n'existe dans l'API : la
 * densité vit dans empirical_params.json, pas ici.
 *
 * L'application ne doit JAMAIS appeler l'API en direct : elle lit ces fichiers.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = 'https://api.dofusdb.fr';
const PAGE_SIZE = 50; // maximum accepté par DofusDB (testé : $limit=200 → 50 renvoyés)
const REQUEST_DELAY_MS = 120;

/** Super-types DofusDB considérés comme "équipement" (cf. data/README.md) */
const EQUIPMENT_SUPER_TYPE_IDS = [1, 2, 3, 4, 5, 7, 10, 11, 13];

const TYPE_ID_RUNE = 78;
const TYPE_ID_TRANSCENDENCE_RUNE = 211;
const TYPE_ID_FM_POTION = 26;
const TYPE_ID_FM_ORB = 189;

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');

// ─── Types bruts (sous-ensemble du schéma DofusDB) ────────────────────────────

interface LocalizedName {
  fr?: string;
  en?: string;
}

interface RawEffect {
  id: number;
  characteristic: number;
  category: number;
  bonusType: number;
  description?: LocalizedName;
}

interface RawCharacteristic {
  id: number;
  keyword: string;
  name?: LocalizedName;
}

interface RawItemType {
  id: number;
  superTypeId: number;
  name?: LocalizedName;
}

interface RawItemSuperType {
  id: number;
  name?: LocalizedName;
}

interface RawItemEffect {
  effectId: number;
  from: number;
  to: number;
  characteristic: number;
  category: number;
  elementId: number;
}

interface RawPossibleEffect {
  effectId: number;
  diceNum: number;
  diceSide: number;
  value: number;
}

interface RawItem {
  id: number;
  name?: LocalizedName;
  description?: LocalizedName;
  level: number;
  typeId: number;
  img?: string;
  realWeight?: number;
  enhanceable?: boolean;
  effects?: RawItemEffect[];
  possibleEffects?: RawPossibleEffect[];
}

interface Page<T> {
  total: number;
  limit: number;
  skip: number;
  data: T[];
}

// ─── Types de sortie ──────────────────────────────────────────────────────────

interface EffectRef {
  effectId: number;
  characteristicId: number;
  bonusType: number;
  category: number;
  labelFr: string;
}

interface RuneEffect {
  effectId: number;
  characteristicId: number;
  value: number;
}

interface RuneRef {
  id: number;
  nameFr: string;
  level: number;
  realWeight: number | null;
  effects: RuneEffect[];
}

interface RuneTier {
  runeId: number;
  nameFr: string;
  value: number;
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson<T>(path: string): Promise<T> {
  const url = API_BASE + path;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url);
    if (res.ok) return (await res.json()) as T;
    if (res.status === 429 || res.status >= 500) {
      await sleep(1000 * attempt);
      continue;
    }
    throw new Error(`HTTP ${res.status} sur ${url}`);
  }
  throw new Error(`Échec après 4 tentatives : ${url}`);
}

async function fetchAll<T>(pathWithQuery: string, label: string): Promise<T[]> {
  const all: T[] = [];
  let skip = 0;
  let total = Infinity;
  while (skip < total) {
    const page = await getJson<Page<T>>(`${pathWithQuery}&$limit=${PAGE_SIZE}&$skip=${skip}`);
    total = page.total;
    all.push(...page.data);
    skip += page.data.length;
    if (page.data.length === 0) break;
    process.stdout.write(`\r  ${label}: ${all.length}/${total}`);
    await sleep(REQUEST_DELAY_MS);
  }
  process.stdout.write('\n');
  return all;
}

/**
 * Nettoie le libellé DofusDB d'un effet :
 * "#1{~1~2 à }#2 Force" → "Force", "-#1{~1~2 à -}#2 Portée" → "-Portée"
 */
function cleanEffectLabel(raw: string | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/\{\{~1~2 à -?\}\}/g, '')
    .replace(/#\d+/g, '')
    .replace(/\{\{~ps\}\}/g, 's') // marqueur de pluriel → on garde la forme plurielle
    .replace(/\{\{~zs\}\}/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^-\s+/, '-')
    .trim();
}

/**
 * Palier d'une rune classique d'après son nom : "Rune Pa Fo" → pa, "Rune Ra Fo" → ra,
 * "Rune Fo" → normal. Les noms sont la seule information de palier fournie par l'API.
 */
function tierFromName(nameFr: string): 'normal' | 'pa' | 'ra' | null {
  if (/^Rune Ra /.test(nameFr)) return 'ra';
  if (/^Rune Pa /.test(nameFr)) return 'pa';
  if (/^Rune /.test(nameFr)) return 'normal';
  return null;
}

function writeJson(fileName: string, value: unknown): void {
  const file = join(OUT_DIR, fileName);
  writeFileSync(file, JSON.stringify(value, null, 1) + '\n', 'utf8');
  console.log(`  écrit ${file}`);
}

// ─── Extraction ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const extractedAt = new Date().toISOString();

  console.log('Version du jeu…');
  const gameVersion = await getJson<string>('/version');
  console.log(`  ${gameVersion}`);

  console.log('Effets (bonus et malus)…');
  const rawEffects = await fetchAll<RawEffect>(
    '/effects?bonusType[$in][]=1&bonusType[$in][]=-1&$sort[id]=1',
    'effects'
  );
  const effects: EffectRef[] = rawEffects
    .filter((e) => e.characteristic > 0)
    .map((e) => ({
      effectId: e.id,
      characteristicId: e.characteristic,
      bonusType: e.bonusType,
      category: e.category,
      labelFr: cleanEffectLabel(e.description?.fr),
    }));

  console.log('Caractéristiques…');
  const rawCharacteristics = await fetchAll<RawCharacteristic>(
    '/characteristics?$sort[id]=1',
    'characteristics'
  );
  const characteristics = rawCharacteristics
    .filter((c) => c.id > 0)
    .map((c) => ({ id: c.id, keyword: c.keyword, nameFr: c.name?.fr ?? '' }));

  console.log("Types et super-types d'objets…");
  const rawSuperTypes = await fetchAll<RawItemSuperType>('/item-super-types?$sort[id]=1', 'super-types');
  const rawTypes = await fetchAll<RawItemType>('/item-types?$sort[id]=1', 'types');
  const itemSuperTypes = rawSuperTypes.map((s) => ({ id: s.id, nameFr: s.name?.fr ?? '' }));
  const itemTypes = rawTypes.map((t) => ({
    id: t.id,
    superTypeId: t.superTypeId,
    nameFr: t.name?.fr ?? '',
  }));

  const toRune = (r: RawItem): RuneRef => ({
    id: r.id,
    nameFr: r.name?.fr ?? '',
    level: r.level,
    realWeight: r.realWeight ?? null,
    effects: (r.effects ?? []).map((e) => ({
      effectId: e.effectId,
      characteristicId: e.characteristic,
      // Pour une rune, DofusDB met la valeur dans `from` et 0 dans `to` (valeur fixe)
      value: e.from,
    })),
  });

  console.log('Runes de forgemagie…');
  const runes = (await fetchAll<RawItem>(`/items?typeId=${TYPE_ID_RUNE}&$sort[id]=1`, 'runes')).map(toRune);

  console.log('Runes de transcendance…');
  const transcendenceRunes = (
    await fetchAll<RawItem>(`/items?typeId=${TYPE_ID_TRANSCENDENCE_RUNE}&$sort[id]=1`, 'transcendance')
  ).map(toRune);

  const toConsumable = (r: RawItem) => ({
    id: r.id,
    nameFr: r.name?.fr ?? '',
    level: r.level,
    descriptionFr: (r.description?.fr ?? '').replace(/\s+/g, ' ').trim(),
    rawEffects: (r.effects ?? []).map((e) => ({ effectId: e.effectId, from: e.from, to: e.to })),
  });

  console.log('Potions de forgemagie…');
  const potions = (await fetchAll<RawItem>(`/items?typeId=${TYPE_ID_FM_POTION}&$sort[id]=1`, 'potions')).map(
    toConsumable
  );

  console.log('Orbes de forgemagie…');
  const orbs = (await fetchAll<RawItem>(`/items?typeId=${TYPE_ID_FM_ORB}&$sort[id]=1`, 'orbes')).map(
    toConsumable
  );

  console.log('Objets équipables…');
  const equipmentTypeIds = itemTypes
    .filter((t) => EQUIPMENT_SUPER_TYPE_IDS.includes(t.superTypeId))
    .map((t) => t.id);
  const typeQuery = equipmentTypeIds.map((id) => `typeId[$in][]=${id}`).join('&');
  const rawItems = await fetchAll<RawItem>(`/items?${typeQuery}&$sort[id]=1`, 'items');
  const items = rawItems.map((it) => ({
    id: it.id,
    nameFr: it.name?.fr ?? '',
    level: it.level,
    typeId: it.typeId,
    img: it.img ?? '',
    enhanceable: it.enhanceable ?? null,
    effects: (it.effects ?? []).map((e) => ({
      effectId: e.effectId,
      characteristicId: e.characteristic,
      from: e.from,
      to: e.to,
    })),
    possibleEffects: (it.possibleEffects ?? []).map((e) => ({
      effectId: e.effectId,
      diceNum: e.diceNum,
      diceSide: e.diceSide,
      value: e.value,
    })),
  }));

  // ─── rune-tiers.json : paliers réellement existants par caractéristique ───
  const tiers: Record<string, { nameFr: string; normal?: RuneTier; pa?: RuneTier; ra?: RuneTier }> = {};
  const unclassified: { runeId: number; nameFr: string; reason: string }[] = [];
  const charName = new Map(characteristics.map((c) => [c.id, c.nameFr]));
  for (const rune of runes) {
    const eff = rune.effects.find((e) => e.characteristicId > 0);
    if (!eff) {
      unclassified.push({ runeId: rune.id, nameFr: rune.nameFr, reason: 'aucun effet lié à une caractéristique' });
      continue;
    }
    const tier = tierFromName(rune.nameFr);
    if (!tier) {
      unclassified.push({ runeId: rune.id, nameFr: rune.nameFr, reason: 'nom non reconnu' });
      continue;
    }
    const key = String(eff.characteristicId);
    tiers[key] ??= { nameFr: charName.get(eff.characteristicId) ?? '' };
    if (tiers[key][tier]) {
      unclassified.push({ runeId: rune.id, nameFr: rune.nameFr, reason: `palier ${tier} déjà occupé` });
      continue;
    }
    tiers[key][tier] = { runeId: rune.id, nameFr: rune.nameFr, value: eff.value };
  }

  const meta = {
    source: 'DofusDB (api.dofusdb.fr) — données dataminées tierces, non officielles',
    gameVersion,
    extractedAt,
    script: 'scripts/extract-dataset.ts',
    counts: {
      effects: effects.length,
      characteristics: characteristics.length,
      itemTypes: itemTypes.length,
      runes: runes.length,
      transcendenceRunes: transcendenceRunes.length,
      potions: potions.length,
      orbs: orbs.length,
      items: items.length,
    },
    notes: [
      "Aucun champ de densité/poids de forgemagie n'existe dans l'API (/items, /effects, /characteristics vérifiés).",
      "Le pourcentage de dommages conservés par les potions (50/65/80/85 %) n'apparaît pas dans leurs effets : INCONNU côté données.",
      "Le champ `enhanceable` est vrai sur des ressources non forgeables : il n'est pas un critère fiable.",
      'Les objets sont sélectionnés par super-type (' + EQUIPMENT_SUPER_TYPE_IDS.join(', ') + '), pas par `enhanceable`.',
    ],
  };

  console.log('Écriture…');
  writeJson('dataset.json', {
    meta,
    effects,
    characteristics,
    itemSuperTypes,
    itemTypes,
    runes,
    transcendenceRunes,
    potions,
    orbs,
  });
  writeJson('items.json', { meta: { gameVersion, extractedAt, count: items.length }, items });
  writeJson('rune-tiers.json', {
    meta: { gameVersion, extractedAt, derivedFrom: 'dataset.json → runes (typeId 78), palier déduit du nom' },
    tiers,
    unclassified,
  });
  console.log('Terminé.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
