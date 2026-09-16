import { config } from './config.js';

export type NearbyLivePlace = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  costYuan: number | null;
  navigationUrl: string;
  typecode?: string;
  openingToday?: string | null;
  openingWeek?: string | null;
  photoUrl?: string | null;
  phone?: string | null;
  cityName?: string | null;
};

type AmapPoi = {
  id?: string;
  name?: string;
  address?: string | string[];
  location?: string;
  type?: string;
  cityname?: string;
  typecode?: string;
  photos?: Array<{ url?: string }>;
  business?: { cost?: string; opentime_today?: string; opentime_week?: string; tel?: string };
};

function readCost(value: string | undefined) {
  if (!value) return null;
  if (typeof value !== 'string' || !/^\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.ceil(parsed) : null;
}

export function normalizeNearbyLivePlace(poi: AmapPoi, cityName: string): NearbyLivePlace | null {
  if (!poi || typeof poi !== 'object' || typeof poi.location !== 'string' || typeof poi.id !== 'string' || poi.id.length > 80) return null;
  const [longitudeText, latitudeText] = poi.location.split(',');
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);
  const name = typeof poi.name === 'string' ? poi.name.trim().slice(0, 120) : '';
  if (!poi.id || !name || !longitudeText?.trim() || !latitudeText?.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  if (typeof poi.cityname === 'string' && poi.cityname.replace(/市$/, '') !== cityName.replace(/市$/, '')) return null;
  const address = Array.isArray(poi.address) ? poi.address.filter(p => typeof p === 'string').join('') : typeof poi.address === 'string' ? poi.address : '';
  return {
    id: poi.id,
    name,
    address: address.trim().slice(0, 240) || cityName,
    latitude,
    longitude,
    type: typeof poi.type === 'string' ? poi.type.slice(0, 240) : '附近地点',
    costYuan: readCost(poi.business?.cost),
    navigationUrl: `https://uri.amap.com/search?keyword=${encodeURIComponent(cityName + ' ' + name)}`,
    typecode: poi.typecode,
    cityName: typeof poi.cityname === 'string' ? poi.cityname.trim() : null,
    openingToday: typeof poi.business?.opentime_today === 'string' ? poi.business.opentime_today.slice(0, 240) : null,
    openingWeek: typeof poi.business?.opentime_week === 'string' ? poi.business.opentime_week.slice(0, 240) : null,
    phone: typeof poi.business?.tel === 'string' ? poi.business.tel.slice(0, 80) : null,
    photoUrl: safePoiPhoto(Array.isArray(poi.photos) ? poi.photos[0]?.url : null),
  };
}

export function safePoiPhoto(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    if (!/(^|\.)(amap\.com|autonavi\.com|isnss\.com|alicdn\.com)$/.test(url.hostname)) return null;
    url.protocol = 'https:';
    return url.href;
  } catch { return null; }
}

const nearbyCache = new Map<string, { expiresAt: number; places: NearbyLivePlace[] }>();

export async function searchAmapNearbyPlaces(input: {
  latitude: number;
  longitude: number;
  cityName: string;
  radiusKm: number;
  mood: string;
  kind?: 'any' | 'games' | 'walk' | 'food' | 'culture';
}): Promise<NearbyLivePlace[] | null> {
  if (!config.amap.webServiceKey) return null;
  const cacheKey = JSON.stringify(input);
  const cached = nearbyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.places;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const url = new URL('https://restapi.amap.com/v5/place/around');
    url.searchParams.set('key', config.amap.webServiceKey);
    url.searchParams.set('location', `${input.longitude.toFixed(6)},${input.latitude.toFixed(6)}`);
    url.searchParams.set('radius', String(Math.round(input.radiusKm * 1_000)));
    const types = { any: '080000|050000|110000|140100', games: '080000', walk: '110000', food: '050000', culture: '110000|140100' };
    url.searchParams.set('types', input.kind ? types[input.kind] : input.mood === '热闹' ? '080000|050000' : input.mood === '探索' ? '110000|140000' : '110000|080000|140000');
    if (input.kind === 'games') url.searchParams.set('keywords', '桌游|棋牌|麻将|台球|保龄球|密室');
    url.searchParams.set('region', input.cityName);
    url.searchParams.set('city_limit', 'true');
    url.searchParams.set('show_fields', 'business,photos');
    url.searchParams.set('sortrule', 'distance');
    url.searchParams.set('page_size', '25');
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const body = await response.json() as { status?: string; pois?: AmapPoi[] };
    if (body.status !== '1' || !Array.isArray(body.pois)) return null;
    const places = body.pois.map((poi) => normalizeNearbyLivePlace(poi, input.cityName)).filter((poi): poi is NearbyLivePlace => poi !== null);
    if (nearbyCache.size >= 100) nearbyCache.delete(nearbyCache.keys().next().value!);
    nearbyCache.set(cacheKey, { expiresAt: Date.now() + 120_000, places });
    return places;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
