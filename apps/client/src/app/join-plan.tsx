import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Image, ImageBackground, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/app-shell';
import { BackImageButton } from '@/components/back-image-button';
import { useApp } from '@/contexts/app-context';
import { formatBudget, formatDuration } from '@/formatters';
import { useLayoutInsets } from '@/hooks/use-layout-insets';
import { palette, spacing, typography } from '@/theme';

const NOTICE_ICON = require('../../assets/images/join-plan-notice-icon.png');
const DATE_ICON = require('../../assets/images/join-plan-date-icon.png');
const COPY_BG = require('../../assets/images/join-plan-copy-bg.png');

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const;

function createDepartureItems() {
  const today = new Date();
  const daysUntilSunday = (7 - today.getDay()) % 7;

  return Array.from({ length: daysUntilSunday + 1 }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const year = String(date.getFullYear());

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    const weekday = WEEKDAY_LABELS[date.getDay()];

    return {
      day,
      dateKey,
      meta: `${month} / ${day} 周${weekday}`,
      week: offset === 0 ? '今' : weekday,
    };
  });
}

export default function JoinPlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ activityId?: string }>();
  const insets = useLayoutInsets();
  const { currentDraw, addCurrentDrawToTodos } = useApp();
  const [isJoining, setIsJoining] = useState(false);
  const [departureIndex, setDepartureIndex] = useState(0);
  const departureItems = useMemo(() => createDepartureItems(), []);
  const selectedDeparture = departureItems[departureIndex];
  const activity = currentDraw?.activity ?? null;
  const recommendation = currentDraw?.recommendation;
  const expectedActivityId = Number(params.activityId);
  const canJoin = Boolean(
    activity && (!Number.isFinite(expectedActivityId) || activity.id === expectedActivityId),
  );
  const title = activity?.title ?? '当前方案已失效';
  const durationLabel = activity ? formatDuration(activity.durationMinutes) : '--';
  const budgetLabel = activity ? formatBudget(activity.budgetYuan) : '--';
  const selectedDateLabel = selectedDeparture?.meta ?? '选择日期';
  const selectedDateKey = selectedDeparture?.dateKey;
  const coverImageUri = activity?.coverImageUri?.trim();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/draw');
    }
  };

  async function confirmJoin() {
    if (!canJoin || isJoining) {
      Alert.alert('无法加入', '当前抽卡方案已失效，请返回抽卡页重新确认。');
      return;
    }

    setIsJoining(true);
    try {
      if (!selectedDateKey) {
        Alert.alert('请选择日期', '请先选择出行日期后再继续');
        return;
      }

      await addCurrentDrawToTodos(selectedDateKey);
      router.replace('/todos');
    } catch (reason: unknown) {
      Alert.alert('加入失败', reason instanceof Error ? reason.message : '可以稍后再试。');
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <AppShell>
      <View style={styles.screen}>
        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 116 },
          ]}>
          <View style={styles.header}>
            <BackImageButton onPress={handleBack} style={styles.backButton} />
            <Text style={styles.headerTitle}>加入约定</Text>
          </View>

          <View style={styles.notice}>
            <View style={styles.noticeIcon}>
              <Image resizeMode="contain" source={NOTICE_ICON} style={styles.noticeIconImage} />
            </View>
            <Text style={styles.noticeText}>
              选一个本周能出发的日期，方案会进入“本周计划”。
            </Text>
          </View>

          <View style={styles.planCard}>
            <View style={styles.planCopy}>
              <View style={styles.metaRow}>
                <Image resizeMode="contain" source={DATE_ICON} style={styles.dateIconImage} />
                <Text style={styles.metaText}>{selectedDateLabel}</Text>
              </View>
              <Text numberOfLines={2} style={styles.planTitle}>
                {title}
              </Text>
              <ImageBackground resizeMode="stretch" source={COPY_BG} style={styles.copyBubble}>
                <Text style={styles.copyText}>
                  {canJoin
                    ? (recommendation?.display.schedulePage ?? '确认后会进入本周计划，出发前还能查看路线。')
                    : '请返回抽卡页，重新确认一个出门方案。'}
                </Text>
              </ImageBackground>
            </View>
            {coverImageUri ? (
              <Image resizeMode="cover" source={{ uri: coverImageUri }} style={styles.cafePhoto} />
            ) : (
              <View style={[styles.cafePhoto, styles.cafePhotoFallback]}>
                <Text style={styles.photoFallbackTitle}>活动地点图片</Text>
                <Text style={styles.photoFallbackSub}>后期可替换为真实地点照片 / 活动海报</Text>
              </View>
            )}
          </View>

          <View style={styles.metricGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{durationLabel}</Text>
              <Text style={styles.metricLabel}>预计时长</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{budgetLabel}</Text>
              <Text style={styles.metricLabel}>预算</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>选择出行日期</Text>
          <Text style={styles.sectionHint}>仅可选择今天至本周日</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateRow}>
            {departureItems.map((date, index) => {
              const isSelected = date.dateKey === selectedDeparture?.dateKey;
              return (
                <Pressable
                  accessibilityLabel={`选择出行日期 ${date.meta}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={date.meta}
                  style={({ pressed }) => [
                    styles.dateCard,
                    isSelected && styles.dateCardSelected,
                    pressed && styles.dateCardPressed,
                  ]}
                  onPress={() => setDepartureIndex(index)}>
                  <Text style={[styles.dateWeek, isSelected && styles.dateTextSelected]}>
                    {date.week}
                  </Text>
                  <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>
                    {date.day}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

        </ScrollView>

        <View style={[styles.fixedBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canJoin || isJoining }}
            disabled={!canJoin || isJoining}
            onPress={() => void confirmJoin()}
            style={({ pressed }) => [
              styles.confirmButton,
              (!canJoin || isJoining) && styles.confirmButtonDisabled,
              pressed && canJoin && !isJoining && styles.confirmButtonPressed,
            ]}>
            <Text style={styles.confirmText}>{isJoining ? '加入中...' : '确认加入我的约定'}</Text>
          </Pressable>
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F0EBFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  header: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 2,
  },
  headerTitle: {
    color: '#05030B',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  notice: {
    marginTop: 12,
    minHeight: 39,
    borderRadius: 20,
    backgroundColor: palette.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  noticeIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeIconImage: {
    width: 16,
    height: 16,
  },
  noticeText: {
    flex: 1,
    minWidth: 0,
    color: '#070513',
    fontSize: 9,
    lineHeight: 14,
    fontWeight: '500',
  },
  planCard: {
    marginTop: 31,
    height: 193,
    borderRadius: 19,
    backgroundColor: palette.white,
    overflow: 'hidden',
    position: 'relative',
  },
  planCopy: {
    width: '58%',
    height: '100%',
    paddingTop: 16,
    paddingLeft: 16,
    paddingRight: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dateIconImage: {
    width: 16,
    height: 16,
  },
  metaText: {
    color: palette.primary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },
  planTitle: {
    marginTop: 17,
    color: '#1F1B36',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
  },
  copyBubble: {
    marginTop: 13,
    width: 154,
    height: 90,
    paddingLeft: 14,
    paddingTop: 13,
    paddingRight: 16,
  },
  copyText: {
    color: '#A99FD0',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  cafePhoto: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '46%',
    height: 193,
    borderRadius: 18,
    backgroundColor: '#D9C8B2',
  },
  cafePhotoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  photoFallbackTitle: {
    color: palette.ink,
    fontSize: typography.body,
    fontWeight: '900',
    textAlign: 'center',
  },
  photoFallbackSub: {
    color: palette.white,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  metricGrid: {
    marginTop: 17,
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    height: 64,
    borderRadius: 12,
    backgroundColor: palette.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 8px 22px rgba(61, 49, 140, 0.09)' },
      default: {
        shadowColor: '#3D318C',
        shadowOpacity: 0.09,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 7 },
        elevation: 2,
      },
    }),
  },
  metricValue: {
    color: '#173729',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  metricLabel: {
    marginTop: 4,
    color: '#71806F',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    marginTop: 31,
    color: '#05030B',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  sectionHint: {
    marginTop: 4,
    color: '#4a4a5a',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  dateRow: {
    paddingTop: 14,
    paddingRight: 20,
    gap: 8,
  },
  dateCard: {
    width: 45,
    height: 72,
    borderRadius: 15,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCardSelected: {
    backgroundColor: palette.primaryDark,
  },
  dateCardPressed: {
    opacity: 0.8,
  },
  dateWeek: {
    color: '#05030B',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
  },
  dateDay: {
    marginTop: 5,
    color: '#05030B',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '900',
  },
  dateTextSelected: {
    color: palette.white,
  },
  fixedBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#F0EBFF',
  },
  confirmButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 12px 30px rgba(77, 111, 22, 0.24)' },
      default: {
        shadowColor: palette.primaryDark,
        shadowOpacity: 0.24,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 4,
      },
    }),
  },
  confirmButtonDisabled: {
    opacity: 0.48,
  },
  confirmButtonPressed: {
    opacity: 0.84,
  },
  confirmText: {
    color: palette.white,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
});
