import * as Location from 'expo-location';

export type LocationCoordinates = {
  latitude: number;
  longitude: number;
};

export type ResolvedAddressLocation = LocationCoordinates & {
  name: string;
};

function joinAddressParts(parts: (string | null | undefined)[]) {
  const uniqueParts: string[] = [];

  parts.forEach((part) => {
    const nextPart = part?.trim();
    if (!nextPart || uniqueParts.includes(nextPart)) return;
    uniqueParts.push(nextPart);
  });

  return uniqueParts.join('');
}

export async function resolveAddressLocation(address: string): Promise<ResolvedAddressLocation> {
  const nextAddress = address.trim();
  if (!nextAddress) {
    throw new Error('请输入出发地');
  }

  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('没有定位权限，无法把地址定位到地图。');
  }

  const locations = await Location.geocodeAsync(nextAddress);
  const location = locations[0];
  if (!location) {
    throw new Error('无法定位这个地址，请补充城市或街道信息。');
  }

  return {
    name: nextAddress,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

export async function resolveCoordinatesAddress({
  latitude,
  longitude,
}: LocationCoordinates): Promise<string> {
  const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
  const address = addresses[0];
  if (!address) {
    throw new Error('无法解析当前位置地址。');
  }

  const formattedAddress = address.formattedAddress?.trim();
  if (formattedAddress) return formattedAddress;

  const fallbackAddress = joinAddressParts([
    address.region,
    address.city,
    address.district,
    address.street,
    address.streetNumber,
    address.name,
  ]);
  if (!fallbackAddress) {
    throw new Error('无法解析当前位置地址。');
  }

  return fallbackAddress;
}

export async function resolveCoordinatesCity({
  latitude,
  longitude,
}: LocationCoordinates): Promise<string> {
  const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
  const address = addresses[0];
  const cityName = (address?.city || address?.region)?.trim().replace(/市$/, '');

  if (!cityName) {
    throw new Error('无法解析当前城市。');
  }

  return cityName;
}
