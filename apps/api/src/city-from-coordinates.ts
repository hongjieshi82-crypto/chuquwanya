const supportedCityCenters: Array<[string, number, number]> = [
  ['北京', 39.9042, 116.4074], ['上海', 31.2304, 121.4737],
  ['杭州', 30.2741, 120.1551], ['深圳', 22.5431, 114.0579],
  ['天津', 39.0842, 117.2009], ['烟台', 37.4638, 121.4479],
  ['青岛', 36.0671, 120.3826], ['南京', 32.0603, 118.7969],
  ['武汉', 30.5928, 114.3055], ['成都', 30.5728, 104.0668],
  ['西安', 34.3416, 108.9398], ['长沙', 28.2282, 112.9388],
  ['广州', 23.1291, 113.2644], ['合肥', 31.8206, 117.2272],
  ['重庆', 29.4316, 106.9123], ['厦门', 24.4798, 118.0894],
  ['济南', 36.6512, 117.1201], ['昆明', 25.0389, 102.7183],
];

function distanceKm(latitude: number, longitude: number, centerLatitude: number, centerLongitude: number) {
  const radians = Math.PI / 180;
  const deltaLatitude = (centerLatitude - latitude) * radians;
  const deltaLongitude = (centerLongitude - longitude) * radians;
  const angle = Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitude * radians) * Math.cos(centerLatitude * radians) * Math.sin(deltaLongitude / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(angle)));
}

export function inferSupportedCityFromCoordinates(latitude: number, longitude: number): string | null {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const ranked = supportedCityCenters
    .map(([name, centerLatitude, centerLongitude]) => ({
      name,
      distance: distanceKm(latitude, longitude, centerLatitude, centerLongitude),
    }))
    .sort((a, b) => a.distance - b.distance);
  const nearest = ranked[0];
  const second = ranked[1];
  if (!nearest || nearest.distance > 65 || (second && second.distance - nearest.distance < 30)) return null;
  return nearest.name;
}
