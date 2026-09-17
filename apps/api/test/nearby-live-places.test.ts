import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeNearbyLivePlace, selectPoiPhoto } from '../src/nearby-live-places.js';

test('实时地点保留真实坐标和已给出的人均费用', () => {
  const place = normalizeNearbyLivePlace({
    id: 'B001', name: '桌游馆', cityname: '北京市', location: '116.400000,39.900000',
    address: '朝阳区某街道', type: '体育休闲服务', business: { cost: '68' },
  }, '北京');
  assert.equal(place?.latitude, 39.9);
  assert.equal(place?.longitude, 116.4);
  assert.equal(place?.costYuan, 68);
});

test('跨城或缺少真实坐标的地点不能进入附近候选', () => {
  assert.equal(normalizeNearbyLivePlace({ id: 'B002', name: '上海景点', cityname: '上海市', location: '121.47,31.23' }, '北京'), null);
  assert.equal(normalizeNearbyLivePlace({ id: 'B003', name: '无坐标地点' }, '北京'), null);
});

test('挑图优先环境照片，排除菜单与外部不可信图片', () => {
  assert.equal(selectPoiPhoto([
    { title: '菜单', url: 'https://aos-comment.amap.com/menu.jpg' },
    { title: '普通图片', url: 'https://aos-comment.amap.com/other.jpg' },
    { title: '室内环境', url: 'https://aos-comment.amap.com/room.jpg' },
  ]), 'https://aos-comment.amap.com/room.jpg');
  assert.equal(selectPoiPhoto([{ title: '环境', url: 'https://evil.test/a.jpg' }]), null);
});
