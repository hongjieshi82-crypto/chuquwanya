import type { ReverseLocation } from './amap-geocode.js';
import type { NearbyLivePlace } from './nearby-live-places.js';

const venueName = (name: string) => name.replace(/[（(].*?[）)]/g, '').replace(/(?:东|西|南|北|东北|西北|东南|西南)?(?:门|入口|出口|出入口)$/, '').trim();
const mentions = (text: string, name: string) => name.length >= 4 && text.includes(name);

/** Expand only actual identity/containment links, never all places of the same type. */
export function relatedVenueIds(places: NearbyLivePlace[], seeds: string[]) {
  const ids = new Set(seeds);
  let changed = true;
  while (changed) {
    changed = false;
    for (const place of places) {
      if (place.parentId && (ids.has(place.id) || ids.has(place.parentId))) {
        for (const id of [place.id, place.parentId]) if (!ids.has(id)) { ids.add(id); changed = true; }
      }
    }
  }
  return ids;
}

export function currentVenueIds(location: ReverseLocation, places: NearbyLivePlace[]) {
  const venues = location.venues ?? [];
  const names = venues.map(venue => venueName(venue.name));
  const seeds = venues.map(venue => venue.id);
  for (const place of places) {
    const name = venueName(place.name);
    if (mentions(location.address, name) || names.some(current => mentions(place.name, current) || mentions(place.address, current))) seeds.push(place.id);
  }
  return relatedVenueIds(places, seeds);
}

export function historyVenueIds(places: NearbyLivePlace[], ids: string[], names: string[]) {
  const seeds = [...ids];
  for (const place of places) if (names.some(name => {
    const normalized = venueName(name);
    return mentions(place.name, normalized) || mentions(place.address, normalized) || mentions(name, venueName(place.name));
  })) seeds.push(place.id);
  return relatedVenueIds(places, seeds);
}
