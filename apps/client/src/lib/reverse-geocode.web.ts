export type LocationCoordinates = {
  latitude: number;
  longitude: number;
};

export type ResolvedAddressLocation = LocationCoordinates & {
  name: string;
};

type WebAmapNamespace = {
  Geocoder?: new (options?: Record<string, unknown>) => WebAmapGeocoder;
  plugin: (plugins: string | string[], callback: () => void) => void;
};

type WebAmapGeocoder = {
  getLocation: (
    address: string,
    callback: (status: string, result: WebAmapGeocodeResult | string) => void,
  ) => void;
  getAddress: (
    location: [number, number],
    callback: (status: string, result: WebAmapReverseGeocodeResult | string) => void,
  ) => void;
};

type WebAmapGeocodeResult = {
  info?: string;
  geocodes?: {
    formattedAddress?: string;
    location?: unknown;
  }[];
};

type WebAmapReverseGeocodeResult = {
  info?: string;
  regeocode?: {
    formattedAddress?: string;
    addressComponent?: {
      province?: string;
      city?: string | string[];
      district?: string;
      township?: string;
      streetNumber?: {
        street?: string;
        number?: string;
      };
    };
    pois?: {
      name?: string;
    }[];
  };
};

type WebAmapWindow = {
  AMap?: WebAmapNamespace;
  AMapLoader?: {
    load: (options: Record<string, unknown>) => Promise<WebAmapNamespace>;
  };
  _AMapSecurityConfig?: {
    securityJsCode?: string;
    serviceHost?: string;
  };
};

function getAmapWindow() {
  return window as unknown as WebAmapWindow;
}

const loaderScriptId = 'amap-jsapi-loader-script';
let amapPromise: Promise<WebAmapNamespace> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const amapWindow = getAmapWindow();
    const existing = document.getElementById(loaderScriptId) as HTMLScriptElement | null;
    if (existing) {
      if (amapWindow.AMapLoader) {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('高德地图 Loader 加载失败')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.id = loaderScriptId;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('高德地图 Loader 加载失败'));
    document.head.appendChild(script);
  });
}

async function loadAmap(): Promise<WebAmapNamespace> {
  const amapWindow = getAmapWindow();
  const key = process.env.EXPO_PUBLIC_AMAP_JS_KEY;
  const securityJsCode = process.env.EXPO_PUBLIC_AMAP_SECURITY_JS_CODE;
  const serviceHost = process.env.EXPO_PUBLIC_AMAP_SERVICE_HOST;

  if (!key) {
    throw new Error('缺少 EXPO_PUBLIC_AMAP_JS_KEY');
  }

  if (!securityJsCode && !serviceHost) {
    throw new Error('缺少 EXPO_PUBLIC_AMAP_SECURITY_JS_CODE 或 EXPO_PUBLIC_AMAP_SERVICE_HOST');
  }

  amapWindow._AMapSecurityConfig = {
    ...(amapWindow._AMapSecurityConfig ?? {}),
    ...(securityJsCode ? { securityJsCode } : {}),
    ...(serviceHost ? { serviceHost } : {}),
  };

  if (amapWindow.AMap) return amapWindow.AMap;
  if (amapPromise) return amapPromise;

  amapPromise = loadScript('https://webapi.amap.com/loader.js').then(() => {
    const loadedWindow = getAmapWindow();
    if (!loadedWindow.AMapLoader) throw new Error('高德地图 Loader 未就绪');
    return loadedWindow.AMapLoader.load({
      key,
      version: '2.0',
      plugins: ['AMap.Geocoder'],
    });
  });

  return amapPromise;
}

function normalizeLngLat(location: unknown) {
  if (Array.isArray(location) && location.length >= 2) {
    const [longitude, latitude] = location;
    return typeof longitude === 'number' && typeof latitude === 'number'
      ? { latitude, longitude }
      : null;
  }

  if (!location || typeof location !== 'object') return null;

  const candidate = location as {
    lng?: unknown;
    lat?: unknown;
    getLng?: () => unknown;
    getLat?: () => unknown;
  };
  const longitude = typeof candidate.lng === 'number' ? candidate.lng : candidate.getLng?.();
  const latitude = typeof candidate.lat === 'number' ? candidate.lat : candidate.getLat?.();

  return typeof longitude === 'number' && typeof latitude === 'number'
    ? { latitude, longitude }
    : null;
}

function joinAddressParts(parts: (string | null | undefined)[]) {
  const uniqueParts: string[] = [];

  parts.forEach((part) => {
    const nextPart = part?.trim();
    if (!nextPart || uniqueParts.includes(nextPart)) return;
    uniqueParts.push(nextPart);
  });

  return uniqueParts.join('');
}

function normalizeCity(city: string | string[] | undefined) {
  return Array.isArray(city) ? city[0] : city;
}

function normalizeCityLabel(value: string | undefined) {
  return value?.trim().replace(/市$/, '') ?? '';
}

export async function resolveAddressLocation(address: string): Promise<ResolvedAddressLocation> {
  const nextAddress = address.trim();
  if (!nextAddress) {
    throw new Error('请输入出发地');
  }

  const AMap = await loadAmap();

  return new Promise<ResolvedAddressLocation>((resolve, reject) => {
    AMap.plugin('AMap.Geocoder', () => {
      if (!AMap.Geocoder) {
        reject(new Error('高德地理编码未就绪'));
        return;
      }

      const geocoder = new AMap.Geocoder({
        city: '全国',
      });
      geocoder.getLocation(nextAddress, (status, result) => {
        if (status !== 'complete' || typeof result === 'string') {
          reject(new Error('无法定位这个地址，请补充城市或街道信息。'));
          return;
        }

        const geocode = result.geocodes?.[0];
        const coordinates = normalizeLngLat(geocode?.location);
        if (!coordinates) {
          reject(new Error('无法定位这个地址，请补充城市或街道信息。'));
          return;
        }

        resolve({
          name: geocode?.formattedAddress || nextAddress,
          ...coordinates,
        });
      });
    });
  });
}

export async function resolveCoordinatesAddress({
  latitude,
  longitude,
}: LocationCoordinates): Promise<string> {
  const AMap = await loadAmap();

  return new Promise<string>((resolve, reject) => {
    AMap.plugin('AMap.Geocoder', () => {
      if (!AMap.Geocoder) {
        reject(new Error('高德逆地理编码未就绪'));
        return;
      }

      const geocoder = new AMap.Geocoder({
        city: '全国',
      });
      geocoder.getAddress([longitude, latitude], (status, result) => {
        if (status !== 'complete' || typeof result === 'string') {
          reject(new Error('无法解析当前位置地址。'));
          return;
        }

        const regeocode = result.regeocode;
        const formattedAddress = regeocode?.formattedAddress?.trim();
        if (formattedAddress) {
          resolve(formattedAddress);
          return;
        }

        const component = regeocode?.addressComponent;
        const streetNumber = component?.streetNumber;
        const fallbackAddress = joinAddressParts([
          component?.province,
          normalizeCity(component?.city),
          component?.district,
          component?.township,
          streetNumber?.street,
          streetNumber?.number,
          regeocode?.pois?.[0]?.name,
        ]);
        if (!fallbackAddress) {
          reject(new Error('无法解析当前位置地址。'));
          return;
        }

        resolve(fallbackAddress);
      });
    });
  });
}

export async function resolveCoordinatesCity({
  latitude,
  longitude,
}: LocationCoordinates): Promise<string> {
  const AMap = await loadAmap();

  return new Promise<string>((resolve, reject) => {
    AMap.plugin('AMap.Geocoder', () => {
      if (!AMap.Geocoder) {
        reject(new Error('高德逆地理编码未就绪'));
        return;
      }

      const geocoder = new AMap.Geocoder({ city: '全国' });
      geocoder.getAddress([longitude, latitude], (status, result) => {
        if (status !== 'complete' || typeof result === 'string') {
          reject(new Error('无法解析当前城市。'));
          return;
        }

        const component = result.regeocode?.addressComponent;
        const city = normalizeCityLabel(normalizeCity(component?.city));
        const province = normalizeCityLabel(component?.province);
        const cityName = city || province;

        if (!cityName) {
          reject(new Error('无法解析当前城市。'));
          return;
        }

        resolve(cityName);
      });
    });
  });
}
