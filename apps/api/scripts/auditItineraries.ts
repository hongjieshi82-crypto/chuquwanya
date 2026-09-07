import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { beijingPracticalActivities, playCategories } from '../src/itinerary-policy.js';
const data = JSON.parse(await readFile(resolve('../client/src/data/itinerary-plans.json'), 'utf8')) as Array<{ city: string; title: string; playTags: string[]; poiNames: string[]; daysCount: number }>;
const cities = [...new Set(data.map((p) => p.city))];
console.log('city | old plans excluded | food+entertainment dual tags | multi-day drafts');
for (const city of cities) {
  const rows = data.filter((p) => p.city === city);
  console.log([city, rows.length, rows.filter((p) => p.playTags.includes('美食吃喝') && p.playTags.includes('娱乐玩乐')).length, rows.filter((p) => p.daysCount > 1).length].join(' | '));
}
console.log('Total:', data.length, 'cities:', cities.length);
for (const category of playCategories) console.log(category, beijingPracticalActivities.filter((p) => p.moodTags.includes(category)).map((p) => p.title).join(' / '));
