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
};

type AmapPoi = {
  id?: string;
  name?: string;
  address?: string | string[];
  location?: string;
  type?: string;
  cityname?: string;
  business?: { cost?: string };
};

function readCost(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
}

export function normalizeNearbyLivePlace(poi: AmapPoi, cityName: string): NearbyLivePlace | null {
  const [longitudeText, latitudeText] = poi.location?.split(',') ?? [];
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);
  const name = poi.name?.trim();
  if (!poi.id || !name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (poi.cityname && poi.cityname.replace(/市$/, '') !== cityName.replace(/市$/, '')) return null;
  const address = Array.isArray(poi.address) ? poi.address.join('') : poi.address || '';
  return {
    id: poi.id,
    name,
    address: address.trim() || cityName,
    latitude,
    longitude,
    type: poi.type || '附近地点',
    costYuan: readCost(poi.business?.cost),
    navigationUrl: `https://uri.amap.com/search?keyword=${encodeURIComponent(cityName + ' ' + name)}`,
  };
}

export async function searchAmapNearbyPlaces(input: {
  latitude: number;
  longitude: number;
  cityName: string;
  radiusKm: number;
  mood: string;
}): Promise<NearbyLivePlace[] | null> {
  if (!config.amap.webServiceKey) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const url = new URL('https://restapi.amap.com/v5/place/around');
    url.searchParams.set('key', config.amap.webServiceKey);
    url.searchParams.set('location', `${input.longitude.toFixed(6)},${input.latitude.toFixed(6)}`);
    url.searchParams.set('radius', String(Math.round(input.radiusKm * 1_000)));
    url.searchParams.set('types', input.mood === '热闹' ? '080000|050000' : input.mood === '探索' ? '110000|140000' : '110000|080000|140000');
    url.searchParams.set('region', input.cityName);
    url.searchParams.set('city_limit', 'true');
    url.searchParams.set('show_fields', 'business');
    url.searchParams.set('sortrule', 'distance');
    url.searchParams.set('page_size', '25');
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const body = await response.json() as { status?: string; pois?: AmapPoi[] };
    if (body.status !== '1' || !Array.isArray(body.pois)) return null;
    return body.pois.map((poi) => normalizeNearbyLivePlace(poi, input.cityName)).filter((poi): poi is NearbyLivePlace => poi !== null);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
