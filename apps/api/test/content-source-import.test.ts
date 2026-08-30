import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeContentSource } from '../src/content-source-import.js';

test('社交内容只保存来源与提炼信号', () => {
  const result = normalizeContentSource({
    platform: 'xiaohongshu',
    url: 'https://www.xiaohongshu.com/example',
    title: '上海雨天路线',
    signals: ['雨天', '室内', '雨天'],
  });
  assert.equal(result?.platform, 'xiaohongshu');
  assert.deepEqual(result?.signals, ['雨天', '室内']);
  assert.match(result?.rightsNote ?? '', /不复制原文/);
});

test('未知平台不会进入来源库', () => {
  assert.equal(normalizeContentSource({ platform: 'unknown' }), null);
});
