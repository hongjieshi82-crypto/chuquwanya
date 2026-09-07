import mysql from 'mysql2/promise';
import { practicalActivities } from '../src/itinerary-policy.js';
import { assessContentQuality } from '../src/content-quality.js';
import { config } from '../src/config.js';

// Default is a dry run. Missing operating/coordinate information stays in review.
const cityId = Number(process.argv.find((arg) => arg.startsWith('--city='))?.split('=')[1]) || null;
const rows = practicalActivities.filter((a) => cityId === null || a.cityId === cityId).map((a) => ({
  id: a.id, city_id: a.cityId, title: a.title, summary: a.summary, description: a.description,
  category: a.category, mood: a.mood, mood_tags: JSON.stringify(a.moodTags), environment: a.environment,
  rain_friendly: 'unknown', heat_sensitive: 'unknown', wind_sensitive: 'unknown',
  min_party_size: a.minPartySize, max_party_size: a.maxPartySize, duration_minutes: a.durationMinutes,
  budget_yuan: a.budgetYuan, city_distance_km: 0, district: a.district, address: a.address,
  latitude: a.latitude, longitude: a.longitude, navigation_url: a.navigationUrl, cover_image: a.coverImageUri,
  steps: JSON.stringify(a.steps), tips: JSON.stringify(a.tips), accent_color: a.accentColor,
  source_type: 'curated_itinerary', source_url: a.itinerary?.source || null, is_active: true,
}));
const assessed = rows.map((a) => ({ ...a, content_status: 'review', content_score: assessContentQuality(a).score, quality_issues: JSON.stringify(assessContentQuality(a).issues) }));
console.table(assessed.map((a) => ({ id: a.id, title: a.title, status: a.content_status, score: a.content_score })));
if (process.argv.includes('--apply')) {
  const db = await mysql.createConnection(config.database);
  try {
    await db.beginTransaction();
    for (const row of assessed) {
      const fields = Object.keys(row);
      // Existing IDs are never overwritten by rerunning an import.
      await db.execute(`INSERT INTO activities (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')}) ON DUPLICATE KEY UPDATE id = activities.id`, Object.values(row));
    }
    await db.commit();
  } catch (e) { await db.rollback(); throw e; }
  finally { await db.end(); }
} else console.log('Dry run only. Use --apply to import review records; normal content publishing checks still apply.');
