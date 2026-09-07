import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { pool } from '../src/db.js';
import { signAuthToken } from '../src/auth.js';
import { chinaDate, addDays } from '../src/departure-policy.js';

// Creates a clearly named local QA visitor. Never uses an existing user's token.
const [created] = await pool.execute(`INSERT INTO users (device_id, nickname) VALUES (?, ?)`, [`qa-lifecycle-${Date.now()}`, 'QA 生命周期验收']);
const userId = (created as {insertId:number}).insertId;
const token = signAuthToken(userId);
const server = createApp().listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Missing port');
const origin = `http://127.0.0.1:${address.port}/api/v1`;
async function call(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(origin + path, {method, headers:{authorization:`Bearer ${token}`, 'content-type':'application/json'}, ...(body === undefined ? {} : {body:JSON.stringify(body)})});
  const result = await response.json() as {data: any; error?: unknown};
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(result.error)}`);
  return result.data;
}
try {
  const preferences = {partySize:1,durationMinutes:null,budgetMin:0,budgetMax:null,mood:'随便',randomLevel:70,category:'不限',environment:'either',radiusKm:null,departureMode:'idea'};
  let draw = await call('/draws', 'POST', {userId,cityId:1,preferences});
  const drawn = new Set([draw.activity.id]);
  for (let index = 0; index < 3; index++) {
    draw = await call('/draws', 'POST', {userId,cityId:1,preferences,drawSessionId:draw.drawSessionId});
    assert.ok(!drawn.has(draw.activity.id)); drawn.add(draw.activity.id);
  }
  assert.equal((await call('/draws/current')).draw.activity.id, draw.activity.id);
  console.log(JSON.stringify({drawChecks:['four draws','unique IDs','restore last result'],passed:true}));
  for (const scenario of [
    {id:860101,category:'美食吃喝',partySize:1},
    {id:860103,category:'城市散步',partySize:1},
    {id:810003,category:'约会',partySize:2},
    {id:810002,category:'休闲躺平',partySize:1},
    {id:820101,category:'休闲躺平',partySize:1},
  ]) {
    const result = await call('/draws','POST',{userId,cityId:1,
      preferences:{...preferences,category:scenario.category,partySize:scenario.partySize,budgetMax:200,departureMode:'plan',departureDate:addDays(chinaDate(),2)},
      drawContext:{selectedCardId:scenario.id}});
    assert.equal(result.activity.id,scenario.id);
    assert.ok(result.activity.latitude && result.activity.longitude);
    assert.equal(result.activity.plannedDate,addDays(chinaDate(),2));
    console.log(JSON.stringify({scenario:scenario.id,returned:true}));
  }
  const [rows] = await pool.query(`SELECT id FROM activities WHERE city_id = 1 AND is_active = TRUE AND content_status = 'published' LIMIT 1`);
  const activityId = (rows as {id:number}[])[0]?.id;
  if (!activityId) throw new Error('No published Beijing activity');
  await call('/saved-activities', 'POST', {activityId});
  assert.ok((await call('/saved-activities')).length);
  const added = await call('/todos', 'POST', {userId, activityId, scheduledDate:chinaDate()});
  await call(`/todos/${added.id}/start`, 'PATCH', {userId});
  await call(`/todos/${added.id}/progress`, 'PATCH', {activeStep:0,paused:true,skipped:[]});
  assert.equal((await call(`/todos/${added.id}/progress`)).paused, true);
  await call(`/todos/${added.id}/progress`, 'PATCH', {activeStep:0,paused:false,skipped:[]});
  await call(`/todos/${added.id}/feedback`, 'POST', {verdict:'not_for_me',note:'QA 测试反馈'});
  const [feedback] = await pool.execute('SELECT reaction FROM activity_reactions WHERE user_id = ? AND activity_id = ?', [userId, activityId]);
  assert.equal((feedback as {reaction:string}[])[0]?.reaction, 'disliked');
  const next = await call('/todos', 'POST', {userId,activityId,scheduledDate:addDays(chinaDate(), 5)});
  await call(`/todos/${next.id}/schedule`, 'PATCH', {scheduledDate:addDays(chinaDate(), 6)});
  console.log(JSON.stringify({passed:true,userId,activityId,checks:['save','schedule','start','pause','restore progress','resume','feedback exclusion','reschedule']}));
} finally {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await pool.end();
}
