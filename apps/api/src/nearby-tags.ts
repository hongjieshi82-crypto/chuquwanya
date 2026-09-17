import type { NearbyLivePlace } from './nearby-live-places.js';

// Product categories are stable; provider codes/labels are translated at the boundary.
export const nearbyKinds = ['games', 'walk', 'food', 'culture'] as const;
export const nearbySearchTypes = { any: '080000|050000|110000|140100', games: '080000', walk: '110000', food: '050000', culture: '110000|140100' };
export const nearbySearchKeywords = { games: '桌游|棋牌|麻将|台球|保龄球|密室|电玩|剧本杀', walk: '公园|广场|步行街|步道', culture: '博物馆|美术馆|展览馆|科技馆' };

export function tagNearbyPlace(place: NearbyLivePlace) {
  const text = place.type + ';' + place.name;
  if (/宾馆|酒店|住宿|学校|培训|公司|住宅|售票|停车场|出入口|售楼/.test(text)) return null;
  const indoor = !/室外|露天|夜市/.test(text);
  if (/棋牌|麻将|桌游|台球|保龄球|密室|电玩|剧本杀/.test(text)) {
    const experience = /密室|剧本杀/.test(text) ? '沉浸体验' : /棋牌|麻将|桌游/.test(text) ? '棋牌桌游' : '游戏娱乐';
    return { kind: 'games' as const, indoor, minimumMinutes: experience === '沉浸体验' ? 90 : 60, experience, moods: ['热闹'], party: ['朋友'] };
  }
  if (/餐饮|咖啡|茶艺|茶馆/.test(place.type) || place.typecode?.startsWith('05')) {
    return { kind: 'food' as const, indoor, minimumMinutes: 30, experience: /咖啡|茶/.test(text) ? '咖啡茶饮' : '餐饮吃喝', moods: ['放松', '热闹'], party: ['独自', '约会', '朋友'] };
  }
  if (/博物馆|美术馆|展览馆|科技馆/.test(text)) return { kind: 'culture' as const, indoor: true, minimumMinutes: 45, experience: '看展文化', moods: ['探索'], party: ['独自', '约会', '朋友', '亲子'] };
  // An aquarium/zoo is an attraction, not automatically a walking or exhibition plan.
  if (/动物园|海洋馆|海洋世界|游乐园/.test(text)) return null;
  if (/公园|广场|步行街|步道/.test(text)) return { kind: 'walk' as const, indoor: false, minimumMinutes: 30, experience: '散步户外', moods: ['放松', '探索'], party: ['独自', '约会', '朋友', '亲子'] };
  return null;
}
