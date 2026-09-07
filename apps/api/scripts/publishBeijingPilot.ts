import mysql from 'mysql2/promise';
import {config} from '../src/config.js';
import {practicalActivities} from '../src/itinerary-policy.js';
import {beijingVerified, verifiedMetadata} from '../src/beijing-verified.js';
import {assessContentQuality} from '../src/content-quality.js';
const db = await mysql.createConnection(config.database);
try {
  await db.beginTransaction();
  for (const id of Object.keys(beijingVerified).map(Number)) {
    const a = practicalActivities.find((entry) => entry.id === id)!;
    const facts = verifiedMetadata(id);
    const row = {id,city_id:1,title:a.title,summary:a.summary,description:a.description,category:a.category,mood:a.mood,mood_tags:JSON.stringify(a.moodTags),environment:a.environment,
      min_party_size:a.minPartySize,max_party_size:a.maxPartySize,duration_minutes:a.durationMinutes,budget_yuan:a.budgetYuan,
      address:a.address,district:a.district,latitude:facts.latitude,longitude:facts.longitude,navigation_url:facts.navigationUrl,cover_image:a.coverImageUri,
      steps:JSON.stringify(a.steps),tips:JSON.stringify(a.tips),rain_friendly:facts.rainFriendly,heat_sensitive:facts.heatSensitive,wind_sensitive:facts.windSensitive,
      weather_notes:facts.weatherNotes,opening_hours:JSON.stringify(facts.openingHours),reservation_required:facts.reservationRequired,
      source_type:'curated_itinerary',source_url:facts.sourceUrl,last_verified_at:'2026-09-07',accent_color:a.accentColor,is_active:1};
    const quality = assessContentQuality(row);
    if (!quality.recommendable) throw new Error(`${id}: ${quality.issues.join(', ')}`);
    const complete = {...row,content_score:quality.score,quality_issues:JSON.stringify(quality.issues),content_status:'published'};
    const keys = Object.keys(complete);
    if (process.argv.includes('--apply')) await db.execute(`INSERT INTO activities (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')}) ON DUPLICATE KEY UPDATE ${keys.filter(key=>key!=='id').map(key=>`${key}=VALUES(${key})`).join(',')}`, Object.values(complete).map(value => value ?? null));
    console.log(JSON.stringify({id,title:a.title,score:quality.score,issues:quality.issues,applied:process.argv.includes('--apply')}));
  }
  await db.commit();
} catch (error) {await db.rollback();throw error;} finally {await db.end();}
