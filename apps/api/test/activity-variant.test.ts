import assert from 'node:assert/strict';
import test from 'node:test';

import { buildActivityVariants } from '../src/activity-variant.js';

test('同一真实地点可生成两条不同玩法但保持相同地点键', () => {
  const variants = buildActivityVariants({ id: 1, cityId: 1, cityName: '北京', address: '某公园', district: '朝阳区', summary: '公园', description: '真实公园', category: '探索', environment: 'outdoor', durationMinutes: 120, budgetYuan: 20, latitude: 39, longitude: 116, navigationUrl: null, coverImage: null, accentColor: '#C9FF62', tips: [], placeKey: '1:某公园' });
  assert.equal(variants.length, 2);
  assert.notEqual(variants[0]?.title, variants[1]?.title);
  assert.equal(variants[0]?.placeKey, variants[1]?.placeKey);
});
