import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/app-shell';
import { AppIcon } from '@/components/app-icon';
import { AmapView } from '@/components/amap-view';
import { InnerPageHeader } from '@/components/inner-page-header';
import { MAP_FILTERS, MAP_PINS } from '@/constants/exploration-content';
import { useLayoutInsets } from '@/hooks/use-layout-insets';
import { backOrReplace } from '@/lib/safe-return-to';
import { palette, radii, shadows, spacing, typography } from '@/theme';

export default function MapScreen() {
  const router = useRouter();
  const { bottom } = useLayoutInsets();
  const [filter, setFilter] = useState<(typeof MAP_FILTERS)[number]>('全部');
  const [selectedId, setSelectedId] = useState<string | null>(MAP_PINS[0]?.id ?? null);

  const pins = useMemo(() => {
    if (filter === '全部') return MAP_PINS;
    return MAP_PINS.filter((pin) => pin.tag.includes(filter) || filter === pin.tag);
  }, [filter]);

  const selected = pins.find((pin) => pin.id === selectedId) ?? pins[0];

  function openSelectedInAmap() {
    if (!selected) return;
    const position = `${selected.longitude},${selected.latitude}`;
    const url = `https://uri.amap.com/marker?position=${position}&name=${encodeURIComponent(selected.name)}`;
    Linking.openURL(url);
  }

  return (
    <AppShell>
      <View style={[styles.flex, { paddingBottom: bottom + spacing.md }]}>
        <View style={styles.headerWrap}>
          <InnerPageHeader title="探索地图" onBack={() => backOrReplace(router)} />
        </View>
        <View style={styles.mapArea}>
          <AmapView
            center={[121.455, 31.201]}
            onSelectPoint={setSelectedId}
            points={pins.map((pin) => ({
              id: pin.id,
              name: pin.name,
              longitude: pin.longitude,
              latitude: pin.latitude,
              x: pin.x,
              y: pin.y,
              color: pin.tone.bg,
            }))}
            selectedId={selected?.id}
            selectedZoom={14}
            zoom={12}
          />

          <View style={styles.searchFloat}>
            <AppIcon name="search" size={16} color={palette.placeholder} />
            <Text style={styles.searchPlaceholder}>搜索附近玩法、路线</Text>
          </View>

          <Pressable accessibilityRole="button" onPress={openSelectedInAmap} style={styles.locBtn}>
            <AppIcon name="locate" size={20} color={palette.primary} />
          </Pressable>
        </View>

        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}>
            {MAP_FILTERS.map((item, index) => {
              const active = item === filter;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={`${item}-${index}`}
                  onPress={() => setFilter(item)}
                  style={[styles.filterChip, active && styles.filterChipActive]}>
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.sheetTitle}>附近推荐 · {pins.length} 个地点</Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled>
            {pins.map((pin) => {
              const active = pin.id === selected?.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={pin.id}
                  onPress={() => setSelectedId(pin.id)}
                  style={[styles.spotCard, active && styles.spotCardActive]}>
                  <View style={[styles.spotThumb, { backgroundColor: pin.tone.bg }]} />
                  <View style={styles.spotBody}>
                    <Text style={styles.spotName} numberOfLines={1}>
                      {pin.name}
                    </Text>
                    <Text style={styles.spotMeta} numberOfLines={1}>
                      {pin.tag} · {pin.distance}
                    </Text>
                  </View>
                  <AppIcon name="arrow-right" size={18} color={palette.muted} />
                </Pressable>
              );
            })}
          </ScrollView>

          {selected ? (
            <Pressable
              accessibilityRole="button"
              onPress={openSelectedInAmap}
              style={styles.cta}>
              <Text style={styles.ctaText}>在高德查看 {selected.name}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  mapArea: {
    flex: 1,
    minHeight: 280,
    backgroundColor: '#DDEEF8',
    position: 'relative',
    overflow: 'hidden',
  },
  searchFloat: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    ...shadows.card,
  },
  searchPlaceholder: { color: palette.placeholder, fontSize: typography.body, fontWeight: '600' },
  locBtn: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.elevated,
  },
  sheet: {
    flexShrink: 0,
    backgroundColor: palette.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    ...shadows.elevated,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.borderStrong,
    marginBottom: spacing.md,
  },
  filters: { gap: spacing.sm, paddingBottom: spacing.md },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.border,
  },
  filterChipActive: {
    backgroundColor: palette.primarySoft,
    borderColor: palette.primary,
  },
  filterText: { color: palette.text, fontSize: typography.caption, fontWeight: '700' },
  filterTextActive: { color: palette.primary, fontWeight: '800' },
  sheetTitle: {
    color: palette.ink,
    fontSize: typography.h3,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
    maxHeight: 220,
  },
  listContent: {
    paddingVertical: spacing.xs,
  },
  spotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  spotCardActive: {
    backgroundColor: palette.primarySoft,
    borderRadius: radii.md,
    borderBottomColor: 'transparent',
  },
  spotThumb: { width: 40, height: 40, borderRadius: radii.md },
  spotBody: { flex: 1, minWidth: 0 },
  spotName: { color: palette.ink, fontSize: typography.body, fontWeight: '800' },
  spotMeta: { color: palette.muted, fontSize: typography.caption, marginTop: 2 },
  cta: {
    marginTop: spacing.md,
    backgroundColor: palette.primary,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: { color: palette.white, fontSize: typography.body, fontWeight: '800' },
});
