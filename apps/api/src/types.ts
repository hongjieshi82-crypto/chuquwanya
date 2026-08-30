export type ActivityRow = {
  id: number;
  city_id: number;
  city_name: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  mood: string;
  mood_tags: string[] | string | null;
  environment: "indoor" | "outdoor" | "either";
  rain_friendly?: "yes" | "no" | "unknown";
  heat_sensitive?: "yes" | "no" | "unknown";
  wind_sensitive?: "yes" | "no" | "unknown";
  weather_notes?: string | null;
  last_verified_at?: string | Date | null;
  opening_hours?: Record<string, unknown> | string | null;
  reservation_required?: "yes" | "no" | "unknown";
  reservation_url?: string | null;
  content_status?: "draft" | "review" | "published" | "archived";
  content_score?: number;
  quality_issues?: string[] | string | null;
  source_type?: string | null;
  source_url?: string | null;
  min_party_size: number;
  max_party_size: number;
  duration_minutes: number;
  budget_yuan: number;
  city_distance_km: string | number;
  district: string;
  address: string;
  latitude: string | number | null;
  longitude: string | number | null;
  navigation_url: string | null;
  cover_image: string | null;
  steps: string[] | string;
  tips: string[] | string;
  accent_color: string;
};

export function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function toActivityDto(row: ActivityRow) {
  const moodTags = parseJsonArray(row.mood_tags);

  return {
    id: row.id,
    cityId: row.city_id,
    cityName: row.city_name,
    title: row.title,
    summary: row.summary,
    description: row.description,
    category: row.category,
    mood: row.mood,
    moodTags,
    environment: row.environment,
    rainFriendly: row.rain_friendly ?? "unknown",
    heatSensitive: row.heat_sensitive ?? "unknown",
    windSensitive: row.wind_sensitive ?? "unknown",
    weatherNotes: row.weather_notes,
    lastVerifiedAt: row.last_verified_at instanceof Date ? row.last_verified_at.toISOString() : row.last_verified_at ?? null,
    openingHours: row.opening_hours ?? null,
    reservationRequired: row.reservation_required ?? "unknown",
    reservationUrl: row.reservation_url ?? null,
    contentStatus: row.content_status ?? "published",
    contentScore: Number(row.content_score ?? 0),
    qualityIssues: parseJsonArray(row.quality_issues),
    sourceType: row.source_type ?? null,
    sourceUrl: row.source_url ?? null,
    minPartySize: row.min_party_size,
    maxPartySize: row.max_party_size,
    durationMinutes: row.duration_minutes,
    budgetYuan: row.budget_yuan,
    distanceKm: Number(row.city_distance_km),
    district: row.district,
    address: row.address,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    navigationUrl: row.navigation_url,
    coverImageUri: typeof row.cover_image === 'string' && row.cover_image.trim() !== '' ? row.cover_image.trim() : null,
    steps: parseJsonArray(row.steps),
    tips: parseJsonArray(row.tips),
    accentColor: row.accent_color,
  };
}
