import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppShell } from '@/components/app-shell';
import { AmapView } from '@/components/amap-view';
import { DesignBackHeader } from '@/components/design-page';
import { ErrorCard } from '@/components/error-card';
import { useApp } from '@/contexts/app-context';
import { formatBudget, formatDuration } from '@/formatters';
import { useLayoutInsets } from '@/hooks/use-layout-insets';
import { backOrReplace } from '@/lib/safe-return-to';
import { getActivity, getCurrentDraw } from '@/services/api';
import { palette, shadows, spacing, typography } from '@/theme';
import type { Activity, DrawRecommendation } from '@/types';

type ActivityDetailSource = 'ai' | 'calendar' | null;

type WebShareNavigator = Navigator & {
  share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
  clipboard?: {
    writeText?: (text: string) => Promise<void>;
  };
};

function buildNavigationUrl(activity: Activity) {
  const destinationName = activity.address.trim() || activity.title.trim();
  if (activity.longitude !== null && activity.latitude !== null && destinationName) {
    const destination = `${activity.longitude},${activity.latitude},${encodeURIComponent(destinationName)}`;
    return `https://uri.amap.com/navigation?from=&to=${destination}&mode=car&src=lazy2move&callnative=1`;
  }

  const keyword = destinationName;
  if (keyword) {
    return `https://uri.amap.com/search?keyword=${encodeURIComponent(keyword)}`;
  }

  return activity.navigationUrl;
}

function normalizeSource(value: string | string[] | undefined): ActivityDetailSource {
  const source = Array.isArray(value) ? value[0] : value;
  return source === 'ai' || source === 'calendar' ? source : null;
}

function buildShareUrl(activityId: number) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/activity/${activityId}`;
  }

  return Linking.createURL(`/activity/${activityId}`);
}

function buildShareMessage(activity: Activity, shareUrl: string) {
  return `我在粗去玩鸭！发现一个出门方案：${activity.title}\n${activity.summary}\n${shareUrl}`;
}

export default function ActivityDetailScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;
  const params = useLocalSearchParams<{ id: string; source?: string; drawSessionId?: string }>();
  const { currentDraw } = useApp();
  const { bottom } = useLayoutInsets();
  const activityId = Number(params.id);
  const source = normalizeSource(params.source);
  const drawSessionId = Array.isArray(params.drawSessionId)
    ? params.drawSessionId[0]
    : params.drawSessionId;
  const isCalendarEntry = source === 'calendar';
  const isDrawEntry = source === 'ai';
  const isValidActivityId = Number.isFinite(activityId);
  const sourceMatchesCurrentDraw = currentDraw?.activity.id === activityId;
  const [activity, setActivity] = useState<Activity | null>(
    sourceMatchesCurrentDraw ? currentDraw.activity : null,
  );
  const [recommendation, setRecommendation] = useState<DrawRecommendation | undefined>(
    sourceMatchesCurrentDraw ? currentDraw?.recommendation : undefined,
  );
  const [isLoading, setIsLoading] = useState(!sourceMatchesCurrentDraw && isValidActivityId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isValidActivityId) {
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      if (sourceMatchesCurrentDraw && currentDraw) {
        setActivity(currentDraw.activity);
        setRecommendation(currentDraw.recommendation);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setActivity(null);
      setRecommendation(undefined);

      void (async () => {
        if (isDrawEntry) {
          try {
            const current = await getCurrentDraw();
            const sessionMatch =
              !drawSessionId || !current?.draw?.drawSessionId || current.draw.drawSessionId === drawSessionId;
            if (!cancelled && current?.draw && current.draw.activity.id === activityId && sessionMatch) {
              setActivity(current.draw.activity);
              setRecommendation(undefined);
              setIsLoading(false);
              return;
            }
          } catch {
            // ignore; 回退到公共活动详情接口
          }
        }

        try {
          const loadedActivity = await getActivity(activityId);
          if (!cancelled) {
            setActivity(loadedActivity);
            setRecommendation(undefined);
            setError(null);
          }
        } catch (reason: unknown) {
          if (!cancelled) {
            setError(reason instanceof Error ? reason.message : '玩法加载失败');
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [activityId, drawSessionId, isDrawEntry, isValidActivityId, sourceMatchesCurrentDraw, currentDraw]);

  if (!isValidActivityId) {
    return (
      <AppShell>
        <View style={styles.errorWrap}>
          <ErrorCard message="无效的玩法ID" onRetry={() => router.replace('/')} />
        </View>
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.primary} size="large" />
      </View>
    );
  }

  if (!activity) {
    return (
      <AppShell>
        <View style={styles.errorWrap}>
          <ErrorCard message={error ?? '没有找到这个玩法'} onRetry={() => router.replace('/')} />
        </View>
      </AppShell>
    );
  }

  const navigationUrl = buildNavigationUrl(activity);
  const itinerarySteps = activity.steps.flatMap((entry) =>
    entry.split(/[；;]/).flatMap((block) => {
      const dayMatch = block.trim().match(/^(D\d+)\s*/i);
      const dayLabel = dayMatch?.[1]?.toUpperCase();
      const route = block.trim().replace(/^(D\d+)\s*/i, '');
      return route.split('—').map((step) => step.trim()).filter(Boolean).map((step) =>
        dayLabel ? `${dayLabel}：${step}` : step,
      );
    }),
  );
  const mapAddress = activity.address.trim();
  const mapPoints =
    activity.longitude !== null && activity.latitude !== null
      ? [
          {
            id: `activity-${activity.id}`,
            name: activity.title,
            longitude: activity.longitude,
            latitude: activity.latitude,
            color: palette.primary,
          },
        ]
      : [];

  function openNavigation() {
    if (navigationUrl) void Linking.openURL(navigationUrl);
  }

  function goToDeparturePicker() {
    router.push({
      pathname: '/join-plan',
      params: { activityId: String(activityId) },
    });
  }

  async function shareActivity() {
    if (!activity) return;
    const currentActivity = activity;
    const shareUrl = buildShareUrl(currentActivity.id);
    const message = buildShareMessage(currentActivity, shareUrl);

    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
        const webNavigator = navigator as WebShareNavigator;
        if (webNavigator.share) {
          await webNavigator.share({
            title: currentActivity.title,
            text: currentActivity.summary,
            url: shareUrl,
          });
          return;
        }

        if (webNavigator.clipboard?.writeText) {
          await webNavigator.clipboard.writeText(message);
          Alert.alert('已复制分享内容');
          return;
        }
      }

      await Share.share(
        {
          title: currentActivity.title,
          message,
          url: shareUrl,
        },
        { dialogTitle: '分享方案' },
      );
    } catch (reason: unknown) {
      if (reason instanceof Error && reason.name === 'AbortError') return;
      Alert.alert('分享失败', '可以稍后再试。');
    }
  }

  return (
    <AppShell desktopFullWidth={isDesktopWeb}>
      <View style={[styles.screen, isDesktopWeb && styles.desktopScreen]}>
        <View style={[styles.fixedHeader, isDesktopWeb && styles.desktopHeader]}>
          <DesignBackHeader
            title="方案详情"
            step="03 · 结果详情 / 分享确认"
            onBack={() => backOrReplace(router)}
            onRightActionPress={isCalendarEntry ? () => void shareActivity() : undefined}
            rightAction={isCalendarEntry ? 'share' : 'none'}
          />
        </View>

        <ScrollView
          style={[styles.scroll, isDesktopWeb && styles.desktopScreen]}
          contentContainerStyle={[
            styles.page,
            isDesktopWeb && styles.desktopPage,
            isDesktopWeb && { paddingHorizontal: Math.max(40, width * .074) },
            { paddingBottom: bottom + spacing['3xl'] },
          ]}
          showsVerticalScrollIndicator={false}>
        {error ? <ErrorCard message={error} /> : null}

        {activity.coverImageUri?.trim() ? (
          <Image
            accessibilityLabel="活动封面图"
            resizeMode="cover"
            source={{ uri: activity.coverImageUri }}
            style={[styles.photoHeroImage, isDesktopWeb && styles.desktopHeroImage]}
          />
        ) : (
          <View style={[styles.photoHero, isDesktopWeb && styles.desktopHeroImage]}>
            <Text style={styles.photoPlus}>＋</Text>
            <Text style={styles.photoTitle}>活动地点图片预留位</Text>
            <Text style={styles.photoSub}>后期可替换为真实地点照片 / 活动海报</Text>
          </View>
        )}

        <View style={[styles.detailCard, isDesktopWeb && styles.desktopDetailCard]}>
          <Text style={styles.locationMeta}>
            {activity.cityName} · {activity.district} · {formatDuration(activity.durationMinutes)} · {formatBudget(activity.budgetYuan)}
          </Text>
          <Text style={[styles.title, isDesktopWeb && styles.desktopTitle]}>{activity.title}</Text>
          <Text style={[styles.description, isDesktopWeb && styles.desktopLead]}>{activity.summary}</Text>
        </View>

        <View style={[styles.detailColumns, isDesktopWeb && styles.desktopDetailColumns]}>
        <View style={[styles.detailMainColumn, isDesktopWeb && styles.desktopMainColumn]}>
        <View style={[styles.section, isDesktopWeb && styles.desktopSection]}>
          <Text style={[styles.sectionTitle, isDesktopWeb && styles.desktopSectionTitle]}>行动路线</Text>
          <View style={styles.timeline}>
            {(itinerarySteps.length > 0
              ? itinerarySteps
              : ['出发前：带耳机、充电宝和一本想翻的书。', '到达后：先点一杯饮品，再找靠窗位置坐下。', '完成标准：安静待够 20 分钟，拍一张完成照片。']
            ).map((step, index) => {
              const [heading, ...rest] = step.split(/[:：]/);
              return (
                <View key={`${step}-${index}`} style={[styles.timelineItem, isDesktopWeb && styles.desktopTimelineItem]}>
                  <View style={[styles.dot, isDesktopWeb && styles.desktopDot]}>
                    <Text style={[styles.dotText, isDesktopWeb && styles.desktopDotText]}>{String(index + 1).padStart(2, '0')}</Text>
                  </View>
                  <View style={[styles.timelineCopy, isDesktopWeb && styles.desktopTimelineCopy]}>
                    <Text style={[styles.timelineTitle, isDesktopWeb && styles.desktopTimelineTitle]}>{rest.length > 0 ? heading : `第 ${index + 1} 步`}</Text>
                    <Text style={[styles.timelineBody, isDesktopWeb && styles.desktopTimelineBody]}>{rest.length > 0 ? rest.join('：') : step}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, isDesktopWeb && styles.desktopSection]}>
          <Text style={[styles.sectionTitle, isDesktopWeb && styles.desktopSectionTitle]}>为什么值得去</Text>
          {recommendation ? (
            <View style={[styles.recommendationBox, isDesktopWeb && styles.desktopRecommendationBox]}>
              <Text style={styles.recommendationLabel}>AI 决策依据</Text>
              <Text style={[styles.recommendationText, isDesktopWeb && styles.desktopBodyText]}>{recommendation.display.detailPage}</Text>
            </View>
          ) : null}
          <Text style={[styles.description, isDesktopWeb && styles.desktopBodyText]}>
            {activity.description || '这里不是那种必须打卡的热门点，更像一块能把人慢慢接住的安静角落。'}
          </Text>
        </View>
        </View>

        <View style={[styles.detailAsideColumn, isDesktopWeb && styles.desktopAsideColumn]}>
        <View style={[styles.mapSection, isDesktopWeb && styles.desktopMapSection]}>
          <View style={styles.mapHeader}>
            <Text style={[styles.mapTitle, isDesktopWeb && styles.desktopAsideTitle]}>位置</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !navigationUrl }}
              disabled={!navigationUrl}
              onPress={openNavigation}
              style={({ pressed }) => [styles.mapLink, pressed && styles.pressed]}>
              <Text style={[styles.mapLinkText, !navigationUrl && styles.disabledText]}>
                {navigationUrl ? '打开地图' : '暂无导航'}
              </Text>
            </Pressable>
          </View>
          {mapAddress ? (
            <Text numberOfLines={2} style={[styles.mapAddress, isDesktopWeb && styles.desktopMutedText]}>
              {mapAddress}
            </Text>
          ) : null}
          <View style={[styles.mapCanvas, isDesktopWeb && styles.desktopMapCanvas]}>
            <AmapView
              address={mapAddress}
              city={activity.cityName}
              fallbackVariant="preview"
              points={mapPoints}
              selectedId={mapPoints[0]?.id}
              selectedZoom={17}
              showStatusBadge={false}
              zoom={16}
            />
            <Pressable
              accessibilityLabel="打开地图"
              accessibilityRole="button"
              disabled={!navigationUrl}
              onPress={openNavigation}
              style={({ pressed }) => [styles.mapTouchTarget, pressed && styles.mapPressed]}
            />
          </View>
        </View>

        {activity.tips.length > 0 ? (
          <View style={[styles.section, isDesktopWeb && styles.desktopSection]}>
            <Text style={[styles.sectionTitle, isDesktopWeb && styles.desktopSectionTitle]}>出发前确认</Text>
            <View style={styles.tripTips}>
              {activity.tips.map((tip, index) => (
                <View style={styles.tripTipItem} key={`${tip}-${index}`}>
                  <Text style={[styles.tripTipIndex, isDesktopWeb && styles.desktopTripTipIndex]}>{String(index + 1).padStart(2, '0')}</Text>
                  <Text style={[styles.tripTipText, isDesktopWeb && styles.desktopBodyText]}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={[styles.actions, isDesktopWeb && styles.desktopActions]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !navigationUrl }}
            disabled={!navigationUrl}
            onPress={openNavigation}
            style={({ pressed }) => [
              styles.lightButton,
              isDesktopWeb && styles.desktopLightButton,
              !navigationUrl && styles.disabled,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.lightButtonText, isDesktopWeb && styles.desktopLightButtonText]}>{navigationUrl ? '打开地图' : '暂无导航'}</Text>
          </Pressable>
          {isDrawEntry ? (
            <Pressable
              accessibilityRole="button"
              onPress={goToDeparturePicker}
              style={({ pressed }) => [styles.primaryButton, isDesktopWeb && styles.desktopPrimaryButton, pressed && styles.pressed]}>
              <Text style={[styles.primaryButtonText, isDesktopWeb && styles.desktopPrimaryButtonText]}>选择出发日期</Text>
            </Pressable>
          ) : null}
        </View>
        </View>
        </View>
        </ScrollView>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.canvas },
  scroll: { flex: 1, backgroundColor: palette.canvas },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.canvas,
  },
  errorWrap: { padding: spacing.lg },
  fixedHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: palette.canvas,
    zIndex: 2,
  },
  page: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  photoHero: {
    height: 210,
    width: '100%',
    borderRadius: 32,
    backgroundColor: palette.skySoft,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(121,103,247,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  photoPlus: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.white,
    color: palette.primary,
    fontSize: 34,
    lineHeight: 51,
    textAlign: 'center',
    fontWeight: '900',
    overflow: 'hidden',
  },
  photoTitle: { color: palette.ink, fontSize: typography.body, fontWeight: '900' },
  photoSub: { color: palette.muted, fontSize: typography.caption, fontWeight: '800' },
  photoHeroImage: {
    width: '100%',
    height: 210,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: palette.skySoft,
  },
  detailCard: {
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.86)',
    padding: spacing.lg,
    ...shadows.elevated,
  },
  locationMeta: {
    color: palette.primary,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  title: {
    marginTop: spacing.sm,
    color: palette.ink,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
  },
  description: {
    marginTop: spacing.sm,
    color: palette.text,
    fontSize: typography.body,
    lineHeight: 23,
    fontWeight: '700',
  },
  mapSection: {
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.86)',
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  mapHeader: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  mapTitle: {
    flex: 1,
    minWidth: 0,
    color: palette.ink,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  mapLink: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  mapLinkText: {
    color: palette.primary,
    fontSize: typography.body,
    fontWeight: '900',
  },
  mapAddress: {
    color: palette.text,
    fontSize: typography.caption,
    lineHeight: 18,
    fontWeight: '800',
  },
  mapCanvas: {
    height: 154,
    borderRadius: 28,
    backgroundColor: '#DFF2E8',
    overflow: 'hidden',
    position: 'relative',
  },
  mapTouchTarget: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  mapPressed: {
    backgroundColor: 'rgba(24,20,51,0.04)',
  },
  section: {
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.86)',
    padding: spacing.lg,
    ...shadows.card,
  },
  sectionTitle: { color: palette.ink, fontSize: typography.h3, fontWeight: '900', marginBottom: spacing.md },
  recommendationBox: {
    borderRadius: 18,
    backgroundColor: 'rgba(121,103,247,0.10)',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  recommendationLabel: { color: palette.primary, fontSize: 11, fontWeight: '900' },
  recommendationText: { marginTop: 5, color: palette.text, fontSize: typography.caption, lineHeight: 19, fontWeight: '800' },
  timeline: { gap: spacing.md },
  timelineItem: { flexDirection: 'row', gap: spacing.md },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
  },
  dotText: { color: palette.white, fontSize: typography.caption, fontWeight: '900' },
  timelineCopy: { flex: 1, minWidth: 0 },
  timelineTitle: { color: palette.ink, fontSize: typography.body, fontWeight: '900' },
  timelineBody: { marginTop: 3, color: palette.muted, fontSize: typography.caption, lineHeight: 18, fontWeight: '800' },
  tripTips: { gap: spacing.sm },
  tripTipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  tripTipIndex: { color: palette.primary, fontSize: 11, fontWeight: '900' },
  tripTipText: { flex: 1, minWidth: 0, color: palette.text, fontSize: typography.caption, lineHeight: 20, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  lightButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightButtonText: { color: palette.primary, fontSize: typography.caption, fontWeight: '900' },
  primaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.primaryButton,
  },
  primaryButtonText: {
    color: palette.white,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  disabled: { opacity: 0.5 },
  disabledText: { color: palette.placeholder },
  pressed: { opacity: 0.78 },
  detailColumns: { gap: spacing.md },
  detailMainColumn: { gap: spacing.md, minWidth: 0 },
  detailAsideColumn: { gap: spacing.md, minWidth: 0 },
  desktopScreen: { backgroundColor: '#0d1012' },
  desktopHeader: {
    paddingHorizontal: 48,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,.09)',
    backgroundColor: '#0d1012',
  },
  desktopPage: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'center',
    paddingTop: 28,
    gap: 28,
    backgroundColor: '#0d1012',
  },
  desktopHeroImage: {
    height: 560,
    borderRadius: 34,
    backgroundColor: '#171b1d',
  },
  desktopDetailCard: {
    width: '72%',
    maxWidth: 980,
    minHeight: 250,
    marginTop: -170,
    marginLeft: 44,
    paddingHorizontal: 42,
    paddingVertical: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.15)',
    borderRadius: 28,
    backgroundColor: 'rgba(8,10,11,.94)',
    zIndex: 3,
  },
  desktopTitle: {
    marginTop: 16,
    color: '#f7f7f2',
    fontSize: 52,
    lineHeight: 57,
    letterSpacing: -2.2,
  },
  desktopLead: {
    maxWidth: 780,
    marginTop: 18,
    color: 'rgba(255,255,255,.62)',
    fontSize: 17,
    lineHeight: 28,
    fontWeight: '600',
  },
  desktopDetailColumns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  desktopMainColumn: { flex: 1.65 },
  desktopAsideColumn: { flex: .85 },
  desktopSection: {
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.12)',
    borderRadius: 26,
    backgroundColor: '#111416',
    shadowColor: '#000',
    shadowOpacity: .22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
  },
  desktopSectionTitle: {
    marginBottom: 24,
    color: '#f7f7f2',
    fontSize: 28,
    lineHeight: 34,
  },
  desktopTimelineItem: {
    gap: 18,
    paddingBottom: 24,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,.09)',
  },
  desktopDot: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(201,255,98,.7)',
    backgroundColor: '#182014',
  },
  desktopDotText: { color: '#c9ff62', fontSize: 12 },
  desktopTimelineCopy: { paddingTop: 1 },
  desktopTimelineTitle: { color: '#f7f7f2', fontSize: 19, lineHeight: 25 },
  desktopTimelineBody: { marginTop: 8, color: 'rgba(255,255,255,.53)', fontSize: 14, lineHeight: 23 },
  desktopRecommendationBox: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,255,98,.18)',
    borderRadius: 18,
    backgroundColor: 'rgba(201,255,98,.055)',
  },
  desktopBodyText: { color: 'rgba(255,255,255,.58)', fontSize: 15, lineHeight: 25 },
  desktopTripTipIndex: { color: '#c9ff62', fontSize: 12, lineHeight: 25 },
  desktopMapSection: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.12)',
    borderRadius: 26,
    backgroundColor: '#111416',
  },
  desktopAsideTitle: { color: '#f7f7f2', fontSize: 22 },
  desktopMapCanvas: { height: 300, borderRadius: 20, backgroundColor: '#171b1d' },
  desktopMutedText: { color: 'rgba(255,255,255,.5)', fontSize: 13, lineHeight: 20 },
  desktopActions: { gap: 12, marginTop: 0 },
  desktopLightButton: {
    minHeight: 54,
    borderColor: 'rgba(201,255,98,.42)',
    borderRadius: 18,
    backgroundColor: 'rgba(201,255,98,.06)',
  },
  desktopLightButtonText: { color: '#c9ff62', fontSize: 14 },
  desktopPrimaryButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: '#c9ff62',
  },
  desktopPrimaryButtonText: { color: '#11150d', fontSize: 14 },
});
