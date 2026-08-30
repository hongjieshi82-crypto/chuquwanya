import assert from "node:assert/strict";
import test from "node:test";

import { classifyWeather } from "../src/weather.service.js";

test("天气文本会转换成稳定的推荐风险", () => {
  assert.deepEqual(classifyWeather("中雨", 25, 3), ["rain"]);
  assert.deepEqual(classifyWeather("晴", 36, 2), ["heat"]);
  assert.deepEqual(classifyWeather("多云", 28, 6), ["wind"]);
  assert.deepEqual(classifyWeather("雷阵雨", 36, 7), ["rain", "heat", "wind"]);
  assert.deepEqual(classifyWeather("晴", 26, 2), ["normal"]);
});
