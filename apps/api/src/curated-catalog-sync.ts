import type { Connection } from 'mysql2/promise';

import { buildActivityVariants } from './activity-variant.js';
import { nationalPlayActivities } from './city-play-catalog.js';

type CityRow = { id: number; name: string };

const shanghaiVariantSources = nationalPlayActivities
  .filter((activity) => activity.cityName === '上海' && activity.moodTags.includes('当天') && !activity.moodTags.includes('夜间'))
  .slice(0, 8);

export const productionCuratedActivities = [
  ...nationalPlayActivities,
  ...shanghaiVariantSources.flatMap((activity, sourceIndex) =>
    buildActivityVariants({
      id: activity.id,
      cityId: activity.cityId,
      cityName: activity.cityName,
      address: activity.address,
      district: activity.district,
      summary: activity.summary,
      description: activity.description,
      category: activity.category,
      environment: activity.environment,
      durationMinutes: activity.durationMinutes,
      budgetYuan: activity.budgetYuan,
      latitude: activity.latitude,
      longitude: activity.longitude,
      navigationUrl: activity.navigationUrl,
      coverImage: activity.coverImageUri,
      accentColor: activity.accentColor,
      tips: activity.tips,
      placeKey: activity.placeKey,
    }).map((variant, variantIndex) => ({
      ...variant,
      id: 870200 + sourceIndex * 2 + variantIndex,
      coverImageUri: variant.coverImage,
      moodTags: [...new Set([variant.category, variant.mood, '当天', ...variant.moodTags])],
      minPartySize: 1,
      maxPartySize: 6,
      itinerary: activity.itinerary,
      placeKeys: undefined,
    })),
  ),
];

/**
 * Keep the tested editorial catalog available in production.
 *
 * The large workbook import intentionally remains in review. These records are
 * the much smaller, hand-authored catalog used by the app's local acceptance
 * tests, with explicit same-day/weekend tags and user-facing verification
 * caveats. City ids are resolved from the database because production ids do
 * not match the catalog's editorial ordering.
 */
export async function syncCuratedPlayCatalog(connection: Connection) {
  const [rows] = await connection.query('SELECT id, name FROM cities WHERE is_active = TRUE');
  const cityIdByName = new Map((rows as CityRow[]).map((city) => [city.name, Number(city.id)]));
  let synced = 0;

  for (const activity of productionCuratedActivities) {
    const cityId = cityIdByName.get(activity.cityName);
    if (!cityId) continue;

    const sourceUrl = activity.itinerary?.source?.trim() || null;
    const placeKey = activity.placeKeys?.length
      ? activity.placeKeys.map((key) => key.replace(/^\d+:/, `${cityId}:`)).join('|')
      : `${cityId}:${activity.address}`;
    const rainFriendly = activity.environment === 'indoor' ? 'yes' : 'no';
    const weatherNotes = activity.environment === 'indoor'
      ? '室内玩法，出发前仍需核对场馆开放和极端天气影响。'
      : '户外玩法，遇雨、大风或高温时请改期或更换方案。';

    await connection.execute(
      `INSERT INTO activities
        (id, city_id, title, summary, description, category, mood, mood_tags,
         environment, rain_friendly, heat_sensitive, wind_sensitive, weather_notes,
         reservation_required, content_status, content_score, quality_issues,
         source_type, source_url, place_key, source_confidence,
         min_party_size, max_party_size, duration_minutes, budget_yuan,
         city_distance_km, district, address, latitude, longitude, navigation_url,
         cover_image, steps, tips, accent_color, is_active)
       VALUES
        (?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, 'unknown', 'unknown', ?,
         'unknown', 'published', 75, CAST(? AS JSON),
         'curated_catalog', ?, ?, 70,
         ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?, TRUE)
       ON DUPLICATE KEY UPDATE
         city_id = VALUES(city_id), title = VALUES(title), summary = VALUES(summary),
         description = VALUES(description), category = VALUES(category), mood = VALUES(mood),
         mood_tags = VALUES(mood_tags), environment = VALUES(environment),
         rain_friendly = VALUES(rain_friendly), weather_notes = VALUES(weather_notes),
         content_status = VALUES(content_status), content_score = VALUES(content_score),
         quality_issues = VALUES(quality_issues), source_type = VALUES(source_type),
         source_url = VALUES(source_url), place_key = VALUES(place_key),
         source_confidence = VALUES(source_confidence), min_party_size = VALUES(min_party_size),
         max_party_size = VALUES(max_party_size), duration_minutes = VALUES(duration_minutes),
         budget_yuan = VALUES(budget_yuan), district = VALUES(district), address = VALUES(address),
         navigation_url = VALUES(navigation_url), cover_image = VALUES(cover_image),
         steps = VALUES(steps), tips = VALUES(tips), accent_color = VALUES(accent_color),
         is_active = TRUE`,
      [
        activity.id, cityId, activity.title, activity.summary, activity.description,
        activity.category, activity.mood, JSON.stringify(activity.moodTags), activity.environment,
        rainFriendly, weatherNotes,
        JSON.stringify(['内测精选玩法；营业、预约、天气和价格请在出发前再确认。']),
        sourceUrl, placeKey, activity.minPartySize, activity.maxPartySize,
        activity.durationMinutes, activity.budgetYuan, activity.district, activity.address,
        activity.latitude, activity.longitude, activity.navigationUrl, activity.coverImageUri,
        JSON.stringify(activity.steps), JSON.stringify(activity.tips), activity.accentColor,
      ],
    );
    synced += 1;
  }

  return synced;
}
