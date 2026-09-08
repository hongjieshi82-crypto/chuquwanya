import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { affordableEntertainment, cityPlaySeeds, secondCityChoices } from '../src/city-play-seeds.js';

type Photo = {
  uri: string | null; source: string; author: string; license: string;
  licenseUrl: string; width: number; height: number; kind: 'photo' | 'illustration';
  page: string; photoTitle?: string; matchScope?: 'place' | 'city';
};

const manifestPath = resolve('src/city-play-photos.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, Photo>;
const cityByKey = new Map<string, number>();
for (const city of cityPlaySeeds) {
  const entries = [...city.plays, ...(secondCityChoices[city.id] ?? []), affordableEntertainment[city.id]!];
  entries.forEach((_entry, index) => cityByKey.set(String(820000 + city.id * 100 + index), city.id));
}

let replaced = 0;
for (const [key, current] of Object.entries(manifest)) {
  if (current.kind === 'photo' && current.uri) continue;
  const cityId = cityByKey.get(key);
  const fallback = Object.entries(manifest).find(([candidateKey, photo]) =>
    cityByKey.get(candidateKey) === cityId && photo.kind === 'photo' && photo.uri && photo.license,
  )?.[1];
  if (!fallback) continue;
  manifest[key] = { ...fallback, matchScope: 'city' };
  replaced += 1;
}

await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Replaced ${replaced} remaining illustrations with licensed city photos.`);
