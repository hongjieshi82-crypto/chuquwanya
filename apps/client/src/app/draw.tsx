import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/app-shell';
import { DesignBackHeader } from '@/components/design-page';
import { ErrorCard } from '@/components/error-card';
import { useApp } from '@/contexts/app-context';
import { formatBudget, formatDistanceMetric, formatDuration } from '@/formatters';
import { useLayoutInsets } from '@/hooks/use-layout-insets';
import { backOrReplace } from '@/lib/safe-return-to';
import { palette, radii, shadows, spacing, typography } from '@/theme';

export default function DrawScreen() {
  const router = useRouter();
  const { currentDraw, reroll, error, clearError } = useApp();
  const { bottom } = useLayoutInsets();
  const [isRerolling, setIsRerolling] = useState(false);

  if (!currentDraw) {
    return (
      <AppShell>
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>还没有推荐结果</Text>
            <Text style={styles.emptyBody}>先设置偏好，系统会生成一张可确认的方案小卡。</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/preferences')}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>去设置偏好</Text>
            </Pressable>
          </View>
      </AppShell>
    );
  }

  const activity = currentDraw.activity;
  const recommendation = currentDraw.recommendation;
  const moodTags = activity.moodTags ?? [];
  const moodLabel = moodTags.length > 0 ? moodTags.slice(0, 2).join(' · ') : activity.mood;

  async function handleReroll() {
    clearError();
    setIsRerolling(true);
    try {
      await reroll();
    } catch (reason) {
      console.error('重抽失败', reason);
    } finally {
      setIsRerolling(false);
    }
  }

  return (
    <AppShell>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={[styles.page, { paddingBottom: bottom + spacing['3xl'] }]}
          showsVerticalScrollIndicator={false}>
          <DesignBackHeader title="" onBack={() => backOrReplace(router)} />

          {error ? <ErrorCard message={error} onRetry={handleReroll} /> : null}

          {currentDraw.activity.coverImageUri?.trim() ? (
            <Image
              resizeMode="cover"
              source={{ uri: currentDraw.activity.coverImageUri }}
              style={styles.coverImage}
            />
          ) : (
            <View style={styles.resultArt}>
              <View style={styles.photoSlot}>
                <Text style={styles.photoPlus}>＋</Text>
                <Text style={styles.photoTitle}>活动地点图片预留位</Text>
                <Text style={styles.photoSub}>后期可替换为真实地点照片 / 活动海报</Text>
              </View>
              <View style={styles.pathLine} />
            </View>
          )}
          

          <View style={styles.summaryCard}>
            <Text style={styles.badge}>{recommendation?.display.badge ?? `适合${moodLabel || '低电量'}出门`}</Text>
            <Text style={styles.resultTitle}>{activity.title}</Text>
            <Text style={styles.resultCopy}>{activity.summary}</Text>

            <View style={styles.metrics}>
              <Metric label="时长" value={formatDuration(activity.durationMinutes)} />
              <Metric label="预算" value={formatBudget(activity.budgetYuan)} />
              <Metric label="距离" value={formatDistanceMetric(activity.distanceKm, recommendation?.constraintSummary.distance)} />
              <Metric label="可执行性" value={recommendation?.display.executableLabel ?? '高'} />
            </View>

            {recommendation ? (
              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>为什么是它</Text>
                <Text style={styles.reasonText}>{recommendation.display.cardPage}</Text>
                <Text style={styles.weatherText}>{recommendation.constraintSummary.weather}</Text>
              </View>
            ) : null}
          </View>

          {isRerolling ? (
            <View style={styles.rerolling}>
              <ActivityIndicator color={palette.primary} />
              <Text style={styles.rerollingText}>正在重新生成小卡…</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={currentDraw.attemptsRemaining <= 0 || isRerolling}
              onPress={() => void handleReroll()}
              style={({ pressed }) => [
                styles.lightButton,
                (currentDraw.attemptsRemaining <= 0 || isRerolling) && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.lightButtonText}>
                {currentDraw.attemptsRemaining > 0 ? '重抽 · 再来 1 次' : '本轮机会已用完'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/activity/[id]',
                  params: {
                    id: String(activity.id),
                    source: 'ai',
                    drawSessionId: currentDraw.drawSessionId,
                  },
                })
              }
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>查看详情</Text>
            </Pressable>
          </View>
        </ScrollView>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.canvas },
  page: { padding: spacing.lg, gap: spacing.md },
  empty: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: palette.canvas,
    gap: spacing.md,
  },
  weatherText: { color: palette.muted, fontSize: typography.caption, lineHeight: 19, marginTop: spacing.sm },
  emptyTitle: { color: palette.ink, fontSize: typography.h2, fontWeight: '900', textAlign: 'center' },
  emptyBody: { color: palette.muted, fontSize: typography.body, lineHeight: 22, textAlign: 'center' },
  resultArt: {
    height: 210,
    width: '100%',
    borderRadius: 32,
    backgroundColor: palette.skySoft,
    borderWidth: 2,
    borderColor: 'rgba(121,103,247,0.24)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 210,
    borderRadius: 32,
    backgroundColor: palette.skySoft,
    overflow: 'hidden',
  },
  photoSlot: {
    width: '88%',
    height: '78%',
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    zIndex: 1,
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
  pathLine: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 28,
    height: 26,
    borderBottomWidth: 8,
    borderStyle: 'dotted',
    borderColor: 'rgba(121,103,247,0.25)',
    borderRadius: 50,
  },
  summaryCard: {
    marginTop: -spacing.md,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.86)',
    padding: spacing.lg,
    ...shadows.elevated,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    backgroundColor: palette.duneSoft,
    color: '#473718',
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: typography.caption,
    fontWeight: '900',
    overflow: 'hidden',
  },
  resultTitle: {
    marginTop: spacing.sm,
    color: palette.primary,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
  },
  resultCopy: {
    marginTop: spacing.sm,
    color: palette.primary,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  metric: {
    flexBasis: '46%',
    flexGrow: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.72)',
    padding: spacing.md,
  },
  metricLabel: { color: palette.muted, fontSize: 11, fontWeight: '900' },
  metricValue: { marginTop: 4, color: palette.ink, fontSize: typography.body, fontWeight: '900' },
  reasonBox: {
    marginTop: spacing.md,
    borderRadius: 20,
    backgroundColor: 'rgba(121,103,247,0.10)',
    padding: spacing.md,
  },
  reasonLabel: { color: palette.primary, fontSize: 11, fontWeight: '900' },
  reasonText: { marginTop: 5, color: palette.text, fontSize: typography.caption, lineHeight: 19, fontWeight: '800' },
  rerolling: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  rerollingText: { color: palette.muted, fontSize: typography.caption, fontWeight: '800' },
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
  primaryButtonText: { color: palette.white, fontSize: typography.body, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
});
