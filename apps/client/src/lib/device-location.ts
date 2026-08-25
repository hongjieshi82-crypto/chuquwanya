import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type DeviceLocationCoords = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

type DeviceLocationOptions = {
  accuracy?: 'balanced' | 'high';
};

function getWebPosition(options: DeviceLocationOptions): Promise<DeviceLocationCoords> {
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    throw new Error('暂时无法获取当前位置。');
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('当前浏览器不支持定位，请手动输入出发地。');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error('没有定位权限，请在浏览器设置中允许定位后重试。'));
          return;
        }
        if (error.code === error.POSITION_UNAVAILABLE) {
          reject(new Error('暂时无法获取当前位置，请检查定位服务后重试。'));
          return;
        }
        if (error.code === error.TIMEOUT) {
          reject(new Error('定位超时，请重试或手动输入位置。'));
          return;
        }
        reject(new Error('无法获取当前位置，请重试或手动输入位置。'));
      },
      {
        enableHighAccuracy: options.accuracy === 'high',
        timeout: 12_000,
        maximumAge: 30_000,
      },
    );
  });
}

async function getNativePosition(options: DeviceLocationOptions): Promise<DeviceLocationCoords> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('没有定位权限，请允许定位权限后重试。');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: options.accuracy === 'high' ? Location.Accuracy.High : Location.Accuracy.Balanced,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy ?? null,
  };
}

export async function requestDeviceCurrentPosition(
  options: DeviceLocationOptions = {},
): Promise<DeviceLocationCoords> {
  if (Platform.OS === 'web') {
    return getWebPosition(options);
  }

  return getNativePosition(options);
}
