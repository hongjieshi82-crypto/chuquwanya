import { config } from './config.js';

export type Point = { latitude: number; longitude: number };
export type WalkingRoute = { minutes: number; meters: number };
const cache = new Map<string, { expiresAt: number; value: WalkingRoute }>();

async function request(path: string, params: Record<string, string>): Promise<any> {
  if (!config.amap.webServiceKey) return null;
  const url = new URL(`https://restapi.amap.com${path}`);
  url.search = new URLSearchParams({ ...params, key: config.amap.webServiceKey }).toString();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) return null;
    const body = await response.json();
    return body.status === '1' ? body : null;
  } catch { return null; }
}

export const lngLat = (point: Point) => `${point.longitude.toFixed(6)},${point.latitude.toFixed(6)}`;

export async function convertGpsToAmap(point: Point): Promise<Point | null> {
  const body = await request('/v3/assistant/coordinate/convert', { locations: lngLat(point), coordsys: 'gps' });
  if (typeof body?.locations !== 'string') return null;
  const parts = body.locations.split(',');
  const longitude = Number(parts[0]);
  const latitude = Number(parts[1]);
  return parts.length === 2 && parts.every((part: string) => part.trim()) && Number.isFinite(longitude) && Number.isFinite(latitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
    ? { latitude, longitude } : null;
}

export async function getWalkingRoute(from: Point, to: Point): Promise<WalkingRoute | null> {
  const key = `${lngLat(from)}:${lngLat(to)}`;
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  const body = await request('/v3/direction/walking', { origin: lngLat(from), destination: lngLat(to) });
  const path = body?.route?.paths?.[0];
  if (path?.duration == null || path?.distance == null || path.duration === '' || path.distance === '') return null;
  const seconds = Number(path.duration);
  const meters = Number(path.distance);
  if (!Number.isFinite(seconds) || !Number.isFinite(meters) || seconds < 0 || meters < 0) return null;
  const value = { minutes: Math.ceil(seconds / 60), meters: Math.ceil(meters) };
  if (cache.size >= 256) cache.delete(cache.keys().next().value!);
  cache.set(key, { value, expiresAt: Date.now() + 180_000 });
  return value;
}
