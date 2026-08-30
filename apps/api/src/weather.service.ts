import { config } from "./config.js";

export type WeatherRisk = "normal" | "rain" | "heat" | "wind";

export type CityWeather = {
  city: string;
  condition: string;
  temperature: number | null;
  windLevel: number | null;
  humidity: number | null;
  risks: WeatherRisk[];
  observedAt: string;
  source: "amap";
};

type AmapWeatherResponse = {
  status?: string;
  lives?: Array<{
    city?: string;
    weather?: string;
    temperature?: string;
    windpower?: string;
    humidity?: string;
    reporttime?: string;
  }>;
};

const cache = new Map<string, { expiresAt: number; value: CityWeather }>();
const CACHE_TTL_MS = 10 * 60 * 1_000;
const REQUEST_TIMEOUT_MS = 3_500;

function parseNumber(value: string | undefined) {
  if (!value) return null;
  const matched = value.match(/\d+(?:\.\d+)?/);
  return matched ? Number(matched[0]) : null;
}

export function classifyWeather(condition: string, temperature: number | null, windLevel: number | null) {
  const risks: WeatherRisk[] = [];
  if (/[雨雪雷暴冰雹]/.test(condition)) risks.push("rain");
  if (temperature !== null && temperature >= 35) risks.push("heat");
  if (windLevel !== null && windLevel >= 6) risks.push("wind");
  return risks.length ? risks : ["normal" as const];
}

export async function getCityWeather(city: string): Promise<CityWeather | null> {
  const key = config.amap.webServiceKey;
  if (!key || !city.trim()) return null;

  const cacheKey = city.trim().replace(/市$/, "");
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const params = new URLSearchParams({ key, city: cacheKey, extensions: "base", output: "JSON" });
    const response = await fetch(`https://restapi.amap.com/v3/weather/weatherInfo?${params}`, {
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const body = (await response.json()) as AmapWeatherResponse;
    const live = body.status === "1" ? body.lives?.[0] : null;
    if (!live?.weather) return null;

    const temperature = parseNumber(live.temperature);
    const windLevel = parseNumber(live.windpower);
    const value: CityWeather = {
      city: live.city || cacheKey,
      condition: live.weather,
      temperature,
      windLevel,
      humidity: parseNumber(live.humidity),
      risks: classifyWeather(live.weather, temperature, windLevel),
      observedAt: live.reporttime || new Date().toISOString(),
      source: "amap",
    };
    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value });
    return value;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
