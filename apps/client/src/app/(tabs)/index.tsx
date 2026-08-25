import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/app-shell';
import { HomeTopBar } from '@/components/home-top-bar';
import { useApp } from '@/contexts/app-context';
import { useLayoutInsets } from '@/hooks/use-layout-insets';
import { palette, radii, shadows, spacing, typography } from '@/theme';

const SCENE_IMAGES = [
  require('../../../assets/images/blindbox-scene-cafe.png'),
  require('../../../assets/images/blindbox-scene-park.png'),
  require('../../../assets/images/blindbox-scene-seaside.png'),
];

const STEPS = [
  { index: '01', title: '告诉我今天的状态', body: '位置、时间、预算和心情，四个条件就够了。' },
  { index: '02', title: '只给一个可执行方案', body: '不再刷榜单，不把选择题重新丢给你。' },
  { index: '03', title: '加入本周计划', body: '选好日期，出发后回来留一句真实感受。' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { currentDraw, isBooting, selectedCityId } = useApp();
  const { tabBarHeight } = useLayoutInsets();

  if (isBooting) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={palette.primary} size="large" />
        <Text style={styles.loadingText}>正在准备今天的灵感…</Text>
      </View>
    );
  }

  return (
    <AppShell>
      <View style={styles.screen}>
        <HomeTopBar />
        <ScrollView
          contentContainerStyle={[styles.page, { paddingBottom: tabBarHeight + spacing.xl }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>AI 周末行动助手</Text>
            <Text style={styles.title}>今天去哪玩？{`\n`}别纠结，我来决定。</Text>
            <Text style={styles.subtitle}>
              给我几个简单条件，我只返回一个现在就能执行的出门方案。
            </Text>

            <View style={styles.sceneRow}>
              {SCENE_IMAGES.map((source, index) => (
                <Image key={index} source={source} contentFit="cover" style={styles.sceneImage} />
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!selectedCityId}
              onPress={() => router.push('/preferences')}
              style={({ pressed }) => [
                styles.primaryButton,
                !selectedCityId && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.primaryButtonText}>帮我决定去哪玩</Text>
            </Pressable>

            {currentDraw ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/draw')}
                style={({ pressed }) => [styles.resumeButton, pressed && styles.pressed]}>
                <Text style={styles.resumeButtonText}>继续查看上次方案</Text>
              </Pressable>
            ) : null}

            <Text style={styles.trustText}>无需注册 · 只给一个方案 · 不满意可以重选</Text>
          </View>

          <View style={styles.howItWorks}>
            <Text style={styles.sectionLabel}>怎么使用</Text>
            {STEPS.map((step) => (
              <View key={step.index} style={styles.stepRow}>
                <Text style={styles.stepIndex}>{step.index}</Text>
                <View style={styles.stepCopy}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepBody}>{step.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F7FF' },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: '#F8F7FF',
  },
  loadingText: { color: palette.muted, fontSize: typography.body },
  page: { paddingHorizontal: 20, gap: 28 },
  hero: {
    borderRadius: 28,
    backgroundColor: palette.surface,
    padding: 22,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadows.elevated,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    color: palette.primaryDark,
    backgroundColor: palette.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: '900',
  },
  title: {
    marginTop: 18,
    color: palette.ink,
    fontSize: 29,
    lineHeight: 38,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 12,
    color: palette.text,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
  },
  sceneRow: { flexDirection: 'row', gap: 8, marginTop: 22, height: 126 },
  sceneImage: { flex: 1, minWidth: 0, borderRadius: 16, backgroundColor: palette.skySoft },
  primaryButton: {
    minHeight: 54,
    marginTop: 22,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primaryDark,
    ...shadows.primaryButton,
  },
  primaryButtonText: { color: palette.white, fontSize: 16, fontWeight: '900' },
  resumeButton: { minHeight: 44, marginTop: 10, alignItems: 'center', justifyContent: 'center' },
  resumeButtonText: { color: palette.primaryDark, fontSize: 14, fontWeight: '800' },
  trustText: { marginTop: 14, color: palette.muted, fontSize: 11, textAlign: 'center' },
  howItWorks: { gap: 0, paddingBottom: 8 },
  sectionLabel: { marginBottom: 12, color: palette.ink, fontSize: 18, fontWeight: '900' },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  stepIndex: { width: 32, color: palette.primary, fontSize: 13, fontWeight: '900' },
  stepCopy: { flex: 1, minWidth: 0 },
  stepTitle: { color: palette.ink, fontSize: 15, fontWeight: '900' },
  stepBody: { marginTop: 5, color: palette.muted, fontSize: 13, lineHeight: 20 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
});
