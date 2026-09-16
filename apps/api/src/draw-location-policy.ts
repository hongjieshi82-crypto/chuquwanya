import { AppError } from './errors.js';

export function requireNearbyCoordinates(preferences: { destinationScope?: string; originLatitude?: number | null; originLongitude?: number | null }) {
  if (preferences.destinationScope !== 'nearby') return;
  if (typeof preferences.originLatitude !== 'number' || !Number.isFinite(preferences.originLatitude) || typeof preferences.originLongitude !== 'number' || !Number.isFinite(preferences.originLongitude)) {
    throw new AppError(422, 'LOCATION_REQUIRED', '附近玩法需要先获取当前位置，请返回“就在附近”重新定位。');
  }
}
