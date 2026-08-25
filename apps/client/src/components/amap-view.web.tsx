import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, View, type ViewStyle } from 'react-native';

import { palette, radii, shadows, spacing, typography } from '@/theme';

export type AmapPoint = {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  x?: number;
  y?: number;
  color?: string;
};

type AmapStatus = 'loading' | 'ready' | 'missing-key' | 'missing-security' | 'error';

type AmapViewProps = {
  points: readonly AmapPoint[];
  selectedId?: string | null;
  onSelectPoint?: (id: string) => void;
  address?: string | null;
  city?: string | null;
  center?: readonly [number, number];
  zoom?: number;
  selectedZoom?: number;
  markerVariant?: 'custom' | 'default';
  fallbackVariant?: 'grid' | 'preview';
  showStatusBadge?: boolean;
  style?: StyleProp<ViewStyle>;
};

type AMapNamespace = {
  Map: new (container: HTMLElement, options: Record<string, unknown>) => AMapMap;
  Geocoder?: new (options?: Record<string, unknown>) => AMapGeocoder;
  Marker: new (options: Record<string, unknown>) => AMapMarker;
  Pixel: new (x: number, y: number) => unknown;
  PlaceSearch?: new (options?: Record<string, unknown>) => AMapPlaceSearch;
  plugin: (plugins: string | string[], callback: () => void) => void;
};

type AMapMap = {
  add: (item: AMapMarker | AMapMarker[]) => void;
  destroy: () => void;
  remove: (item: AMapMarker | AMapMarker[]) => void;
  setFitView: (overlays?: AMapMarker[], immediately?: boolean, avoid?: number[], maxZoom?: number) => void;
  setZoomAndCenter: (zoom: number, center: [number, number], immediately?: boolean) => void;
};

type AMapMarker = {
  on: (eventName: string, handler: () => void) => void;
  setMap: (map: AMapMap | null) => void;
};

type AMapPlaceSearch = {
  search: (
    keyword: string,
    callback?: (status: string, result: AMapPlaceSearchResult | string) => void,
  ) => void;
};

type AMapPlaceSearchResult = {
  info?: string;
  poiList?: {
    pois?: {
      name?: string;
      location?: unknown;
    }[];
  };
};

type AMapGeocoder = {
  getLocation: (
    address: string,
    callback: (status: string, result: AMapGeocoderResult | string) => void,
  ) => void;
};

type AMapGeocoderResult = {
  info?: string;
  geocodes?: {
    formattedAddress?: string;
    location?: unknown;
  }[];
};

declare global {
  interface Window {
    AMap?: AMapNamespace;
    AMapLoader?: {
      load: (options: Record<string, unknown>) => Promise<AMapNamespace>;
    };
    _AMapSecurityConfig?: {
      securityJsCode?: string;
      serviceHost?: string;
    };
  }
}

const loaderScriptId = 'amap-jsapi-loader-script';
let amapPromise: Promise<AMapNamespace> | null = null;

const absoluteFill = { position: 'absolute' as const, top: 0, right: 0, bottom: 0, left: 0 };

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(loaderScriptId) as HTMLScriptElement | null;
    if (existing) {
      if (window.AMapLoader) {
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

async function loadAmap() {
  const key = process.env.EXPO_PUBLIC_AMAP_JS_KEY;
  const securityJsCode = process.env.EXPO_PUBLIC_AMAP_SECURITY_JS_CODE;
  const serviceHost = process.env.EXPO_PUBLIC_AMAP_SERVICE_HOST;

  if (!key) {
    throw new Error('缺少 EXPO_PUBLIC_AMAP_JS_KEY');
  }

  if (!securityJsCode && !serviceHost) {
    throw new Error('缺少 EXPO_PUBLIC_AMAP_SECURITY_JS_CODE 或 EXPO_PUBLIC_AMAP_SERVICE_HOST');
  }

  window._AMapSecurityConfig = {
    ...(window._AMapSecurityConfig ?? {}),
    ...(securityJsCode ? { securityJsCode } : {}),
    ...(serviceHost ? { serviceHost } : {}),
  };

  if (window.AMap) return window.AMap;
  if (amapPromise) return amapPromise;

  amapPromise = loadScript('https://webapi.amap.com/loader.js').then(() => {
    if (!window.AMapLoader) throw new Error('高德地图 Loader 未就绪');
    return window.AMapLoader.load({
      key,
      version: '2.0',
    });
  });

  return amapPromise;
}

function markerContent(point: AmapPoint, active: boolean) {
  const color = point.color ?? palette.primary;
  const label = active
    ? `<div style="margin-top:4px;padding:3px 7px;border-radius:999px;background:#fff;color:#111;font-size:11px;font-weight:800;box-shadow:0 6px 18px rgba(0,0,0,.14);white-space:nowrap;">${escapeHtml(
        point.name,
      )}</div>`
    : '';

  return `
    <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-2px);">
      <div style="width:${active ? 22 : 18}px;height:${active ? 22 : 18}px;border-radius:999px;background:${color};border:3px solid #fff;box-shadow:0 8px 22px rgba(0,0,0,.22);"></div>
      ${label}
    </div>
  `;
}

function normalizeLngLat(location: unknown): [number, number] | null {
  if (Array.isArray(location) && location.length >= 2) {
    const [lng, lat] = location;
    return typeof lng === 'number' && typeof lat === 'number' ? [lng, lat] : null;
  }

  if (!location || typeof location !== 'object') return null;

  const candidate = location as {
    lng?: unknown;
    lat?: unknown;
    getLng?: () => unknown;
    getLat?: () => unknown;
  };
  const lng = typeof candidate.lng === 'number' ? candidate.lng : candidate.getLng?.();
  const lat = typeof candidate.lat === 'number' ? candidate.lat : candidate.getLat?.();

  return typeof lng === 'number' && typeof lat === 'number' ? [lng, lat] : null;
}

function GridFallback() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 6 }).map((_, row) => (
        <View key={row} style={styles.gridRow}>
          {Array.from({ length: 8 }).map((__, col) => (
            <View key={col} style={styles.gridCell} />
          ))}
        </View>
      ))}
    </View>
  );
}

function PreviewFallback() {
  return (
    <View style={styles.previewMap}>
      <View style={[styles.previewRoad, styles.previewRoadOne]} />
      <View style={[styles.previewRoad, styles.previewRoadTwo]} />
    </View>
  );
}

export function AmapView({
  points,
  selectedId,
  onSelectPoint,
  address,
  city,
  center,
  zoom = 15,
  selectedZoom = 17,
  markerVariant = 'custom',
  fallbackVariant = 'grid',
  showStatusBadge = true,
  style,
}: AmapViewProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [status, setStatus] = useState<AmapStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const amapRef = useRef<AMapNamespace | null>(null);
  const mapRef = useRef<AMapMap | null>(null);
  const markersRef = useRef<AMapMarker[]>([]);
  const addressMarkerRef = useRef<AMapMarker | null>(null);

  const defaultCenter = useMemo<readonly [number, number]>(() => {
    const active = points.find((point) => point.id === selectedId);
    const first = active ?? points[0];
    return first ? [first.longitude, first.latitude] : [121.4737, 31.2304];
  }, [points, selectedId]);

  useEffect(() => {
    if (!container) return;

    let disposed = false;

    loadAmap()
      .then((AMap) => {
        if (disposed) return;

        amapRef.current = AMap;
        const map = new AMap.Map(container, {
          center: [...(center ?? defaultCenter)],
          zoom,
          resizeEnable: true,
          viewMode: '2D',
          features: ['bg', 'road', 'building', 'point'],
        });

        mapRef.current = map;
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (disposed) return;
        const message = error instanceof Error ? error.message : '高德地图加载失败';
        setErrorMessage(message);
        if (message.includes('EXPO_PUBLIC_AMAP_JS_KEY')) {
          setStatus('missing-key');
        } else if (
          message.includes('EXPO_PUBLIC_AMAP_SECURITY_JS_CODE') ||
          message.includes('EXPO_PUBLIC_AMAP_SERVICE_HOST')
        ) {
          setStatus('missing-security');
        } else {
          setStatus('error');
        }
      });

    return () => {
      disposed = true;
      addressMarkerRef.current?.setMap(null);
      addressMarkerRef.current = null;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [center, container, defaultCenter, zoom]);

  useEffect(() => {
    const AMap = amapRef.current;
    const map = mapRef.current;
    if (!AMap || !map || status !== 'ready') return;

    if (markersRef.current.length) {
      map.remove(markersRef.current);
      markersRef.current = [];
    }

    const markers = points.map((point) => {
      const active = point.id === selectedId;
      const position = [point.longitude, point.latitude] as [number, number];
      const marker =
        markerVariant === 'default'
          ? new AMap.Marker({
              position,
              title: point.name,
            })
          : new AMap.Marker({
              position,
              title: point.name,
              offset: new AMap.Pixel(active ? -18 : -12, active ? -34 : -16),
              content: markerContent(point, active),
            });
      marker.on('click', () => onSelectPoint?.(point.id));
      marker.setMap(map);
      return marker;
    });

    markersRef.current = markers;

    const activePoint = points.find((point) => point.id === selectedId);
    if (activePoint) {
      map.setZoomAndCenter(selectedZoom, [activePoint.longitude, activePoint.latitude], true);
    } else if (markers.length) {
      map.setFitView(markers, false, [70, 48, 70, 48], zoom);
    }
  }, [markerVariant, onSelectPoint, points, selectedId, selectedZoom, status, zoom]);

  useEffect(() => {
    const AMap = amapRef.current;
    const map = mapRef.current;
    const nextAddress = address?.trim();
    if (!AMap || !map || status !== 'ready' || !nextAddress) return;
    const activeAMap = AMap;
    const activeMap = map;
    const activeAddress = nextAddress;

    let disposed = false;
    let hasResolved = false;

    addressMarkerRef.current?.setMap(null);
    addressMarkerRef.current = null;

    function placeAddressMarker(position: [number, number], title: string) {
      if (disposed || hasResolved) return;
      hasResolved = true;
      const marker = new activeAMap.Marker({ position, title });
      marker.setMap(activeMap);
      addressMarkerRef.current = marker;
      activeMap.setZoomAndCenter(selectedZoom, position, true);
    }

    function geocodeAddress() {
      activeAMap.plugin('AMap.Geocoder', () => {
        if (disposed || hasResolved || !activeAMap.Geocoder) return;

        const geocoder = new activeAMap.Geocoder({
          city: city || undefined,
        });
        geocoder.getLocation(activeAddress, (geocodeStatus, geocodeResult) => {
          if (disposed || hasResolved || geocodeStatus !== 'complete' || typeof geocodeResult === 'string') {
            return;
          }

          const geocode = geocodeResult.geocodes?.[0];
          const position = normalizeLngLat(geocode?.location);
          if (position) placeAddressMarker(position, geocode?.formattedAddress || activeAddress);
        });
      });
    }

    activeAMap.plugin('AMap.PlaceSearch', () => {
      if (disposed || !activeAMap.PlaceSearch) return;

      const placeSearch = new activeAMap.PlaceSearch({
        pageSize: 1,
        pageIndex: 1,
        city: city || undefined,
        citylimit: Boolean(city),
        map: activeMap,
        autoFitView: true,
      });
      placeSearch.search(activeAddress, (searchStatus, searchResult) => {
        if (disposed || searchStatus !== 'complete' || typeof searchResult === 'string') {
          geocodeAddress();
          return;
        }

        const poi = searchResult.poiList?.pois?.[0];
        const position = normalizeLngLat(poi?.location);
        if (position) {
          placeAddressMarker(position, poi?.name || activeAddress);
          return;
        }

        geocodeAddress();
      });
    });

    return () => {
      disposed = true;
      addressMarkerRef.current?.setMap(null);
      addressMarkerRef.current = null;
    };
  }, [address, city, selectedZoom, status]);

  return (
    <View style={[styles.wrap, style]}>
      <View
        ref={(node) => setContainer(node as unknown as HTMLElement | null)}
        style={styles.mapContainer}
      />

      {showStatusBadge && status === 'loading' ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>正在加载高德地图…</Text>
          <Text style={styles.stateSub}>使用 JS API 2.0 在线渲染</Text>
        </View>
      ) : null}

      {status === 'missing-key' || status === 'missing-security' || status === 'error' ? (
        <View style={styles.fallback}>
          {fallbackVariant === 'preview' ? <PreviewFallback /> : <GridFallback />}
          <View style={styles.tint} />
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>
              {status === 'missing-key'
                ? '需要配置高德地图 Key'
                : status === 'missing-security'
                  ? '需要配置高德安全密钥'
                  : '高德地图加载失败'}
            </Text>
            <Text style={styles.stateSub}>
              {status === 'missing-key'
                ? '在 apps/client/.env.local 添加 EXPO_PUBLIC_AMAP_JS_KEY'
                : status === 'missing-security'
                  ? '添加 EXPO_PUBLIC_AMAP_SECURITY_JS_CODE，或配置 EXPO_PUBLIC_AMAP_SERVICE_HOST'
                  : errorMessage}
            </Text>
          </View>
          {points.map((point) => {
            const active = point.id === selectedId;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={point.id}
                onPress={() => onSelectPoint?.(point.id)}
                style={[
                  styles.pin,
                  { left: `${point.x ?? 50}%`, top: `${point.y ?? 50}%` },
                  active && styles.pinActive,
                ]}>
                <View
                  style={[
                    styles.pinDot,
                    { backgroundColor: point.color ?? palette.primary },
                    active && styles.pinDotActive,
                  ]}
                />
                {active ? <Text style={styles.pinLabel}>{point.name}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...absoluteFill,
    backgroundColor: '#E8F4FD',
    overflow: 'hidden',
  },
  mapContainer: { ...absoluteFill },
  fallback: { ...absoluteFill, overflow: 'hidden' },
  grid: { ...absoluteFill, opacity: 0.35 },
  gridRow: { flex: 1, flexDirection: 'row' },
  gridCell: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,134,246,0.12)',
  },
  previewMap: {
    ...absoluteFill,
    backgroundColor: '#DFF2E8',
    overflow: 'hidden',
  },
  previewRoad: {
    position: 'absolute',
    left: '-24%',
    top: '50%',
    width: '148%',
    height: 44,
    marginTop: -22,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  previewRoadOne: {
    transform: [{ rotate: '34deg' }],
  },
  previewRoadTwo: {
    transform: [{ rotate: '-34deg' }],
  },
  tint: { ...absoluteFill, backgroundColor: 'rgba(0,134,246,0.06)' },
  stateCard: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    top: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.card,
  },
  stateTitle: { color: palette.ink, fontSize: typography.caption, fontWeight: '900' },
  stateSub: { color: palette.muted, fontSize: typography.label, marginTop: 2 },
  previewPin: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 42,
    height: 42,
    marginLeft: -21,
    marginTop: -30,
    borderRadius: 21,
    borderWidth: 5,
    borderColor: palette.primary,
    backgroundColor: palette.surface,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  previewPinInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 4,
    borderColor: palette.primary,
    backgroundColor: palette.surface,
  },
  pin: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  pinActive: { zIndex: 2 },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: palette.white,
    ...shadows.card,
  },
  pinDotActive: { width: 18, height: 18, borderRadius: 9 },
  pinLabel: {
    marginTop: 4,
    backgroundColor: palette.surface,
    color: palette.ink,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
    overflow: 'hidden',
  },
});
