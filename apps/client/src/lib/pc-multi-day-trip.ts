import type { ComposedTrip } from '@/types/travel';

const KEY = 'chuquwanya:pc:multi-day-trip';

export function savePcMultiDayTrip(trip: ComposedTrip) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(KEY, JSON.stringify(trip));
}

export function readPcMultiDayTrip(): ComposedTrip | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = JSON.parse(window.sessionStorage.getItem(KEY) ?? 'null') as ComposedTrip | null;
    return value?.days?.length ? value : null;
  } catch {
    return null;
  }
}
