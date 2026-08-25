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

const absoluteFill = { position: 'absolute' as const, top: 0, right: 0, bottom: 0, left: 0 };

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
  fallbackVariant = 'grid',
  showStatusBadge = true,
  style,
}: AmapViewProps) {
  return (
    <View style={[styles.wrap, style]}>
      {fallbackVariant === 'preview' ? <PreviewFallback /> : <GridFallback />}
      <View style={styles.tint} />
      {showStatusBadge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeTitle}>高德地图 Web 预览</Text>
          <Text style={styles.badgeSub}>当前端使用占位回退，Web 端将加载真实地图</Text>
        </View>
      ) : null}

      {address && points.length === 0 ? (
        <View style={styles.previewPin}>
          <View style={styles.previewPinInner} />
        </View>
      ) : null}

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
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...absoluteFill,
    backgroundColor: '#E8F4FD',
    overflow: 'hidden',
  },
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
  badge: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    right: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.card,
  },
  badgeTitle: { color: palette.ink, fontSize: typography.caption, fontWeight: '900' },
  badgeSub: { color: palette.muted, fontSize: typography.label, marginTop: 2 },
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
