import { config } from "./config.js";

export type AmapGeocodedLocation = {
  latitude: number;
  longitude: number;
  formattedAddress: string | null;
  level: string | null;
};

type AmapGeocodeResponse = {
  status?: string;
  info?: string;
  geocodes?: Array<{
    formatted_address?: string;
    location?: string;
    level?: string;
  }>;
};

const AMAP_GEOCODE_URL = "https://restapi.amap.com/v3/geocode/geo";
const AMAP_GEOCODE_TIMEOUT_MS = 4_000;
const geocodeCache = new Map<string, AmapGeocodedLocation | null>();

function cacheKey(address: string, city?: string | null) {
  return `${city?.trim() ?? ""}|${address.trim()}`;
}

function parseAmapLocation(value: string | undefined) {
  if (!value) return null;
  const [longitudeText, latitudeText] = value.split(",");
  const longitude = Number(longitudeText);
  const latitude = Number(latitudeText);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

export function isAmapGeocodeConfigured() {
  return Boolean(config.amap.webServiceKey);
}

export async function geocodeAddressWithAmap(
  address: string,
  options: { city?: string | null } = {},
): Promise<AmapGeocodedLocation | null> {
  const nextAddress = address.trim();
  if (!nextAddress || !isAmapGeocodeConfigured()) return null;

  const key = cacheKey(nextAddress, options.city);
  if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AMAP_GEOCODE_TIMEOUT_MS);

  try {
    const url = new URL(AMAP_GEOCODE_URL);
    url.searchParams.set("key", config.amap.webServiceKey);
    url.searchParams.set("address", nextAddress);
    url.searchParams.set("output", "JSON");
    if (options.city?.trim()) {
      url.searchParams.set("city", options.city.trim());
    }

    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      geocodeCache.set(key, null);
      return null;
    }

    const body = (await response.json().catch(() => null)) as AmapGeocodeResponse | null;
    const first = body?.status === "1" ? body.geocodes?.[0] : null;
    const location = parseAmapLocation(first?.location);
    if (!location) {
      geocodeCache.set(key, null);
      return null;
    }

    const result = {
      ...location,
      formattedAddress: first?.formatted_address ?? null,
      level: first?.level ?? null,
    };
    geocodeCache.set(key, result);
    return result;
  } catch {
    geocodeCache.set(key, null);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
