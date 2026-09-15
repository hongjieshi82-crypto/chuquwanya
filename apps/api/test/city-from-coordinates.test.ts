import assert from 'node:assert/strict';
import test from 'node:test';
import { inferSupportedCityFromCoordinates } from '../src/city-from-coordinates.js';

test('北京坐标不能识别成上海', () => {
  assert.equal(inferSupportedCityFromCoordinates(39.9, 116.4), '北京');
  assert.notEqual(inferSupportedCityFromCoordinates(39.9, 116.4), '上海');
});

test('上海坐标识别成上海', () => {
  assert.equal(inferSupportedCityFromCoordinates(31.23, 121.47), '上海');
});

test('远离覆盖城市或城市边界不猜测城市', () => {
  assert.equal(inferSupportedCityFromCoordinates(43.8, 87.6), null);
  assert.equal(inferSupportedCityFromCoordinates(39.5, 116.8), null);
});
