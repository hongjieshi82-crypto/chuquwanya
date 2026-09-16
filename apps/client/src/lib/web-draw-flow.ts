/** Browse-city selection must use API identities, never a catalogue's array index. */
export function resolveHomeCityId(message: { cityName?: unknown; cityId?: unknown }, cities: ReadonlyArray<{ id: number; name: string }>) {
  if (typeof message.cityName === 'string' && message.cityName.trim()) {
    const name = message.cityName.trim().replace(/市$/, '');
    return cities.find(city => city.name.replace(/市$/, '') === name)?.id ?? null;
  }
  return typeof message.cityId === 'number' && cities.some(city => city.id === message.cityId) ? message.cityId : null;
}

export const nearbyConfigHref = (category?: string) => `/box/config?mode=nearby${category ? `&category=${encodeURIComponent(category)}` : ''}`;

export function routeHomeDrawHref(href: string) {
  const path = href.split(/[?#]/)[0];
  return path === '/box/slot-preview' || path === '/box/open' ? nearbyConfigHref() : href;
}

export function isExplicitCityDraw(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const pending = value as { intent?: unknown; cityId?: unknown };
  return pending.intent === 'city' && typeof pending.cityId === 'number' && Number.isInteger(pending.cityId) && pending.cityId > 0;
}

export function nearbyCategoryPreset(category: string | undefined) {
  switch (category) {
    case '休闲躺平': return { mood: '放松', kind: 'any', partySize: 2 };
    case '浪漫约会': case '约会': return { mood: '放松', kind: 'any', partySize: 2 };
    case '娱乐玩乐': return { mood: '热闹', kind: 'games', partySize: 2 };
    case '探险猎奇': return { mood: '探索', kind: 'culture', partySize: 2 };
    case '美食吃喝': return { mood: '热闹', kind: 'food', partySize: 2 };
    case '城市散步': return { mood: '放松', kind: 'walk', partySize: 2 };
    default: return { mood: '放松', kind: 'any', partySize: 2 };
  }
}
