import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/app-shell';
import { ErrorCard } from '@/components/error-card';
import { useApp } from '@/contexts/app-context';
import { useLayoutInsets } from '@/hooks/use-layout-insets';
import { getTodos, startTodo, updateTodoStatus } from '@/services/api';
import { components, palette, radii, shadows, spacing, typography } from '@/theme';
import type { Todo, TodoStatus } from '@/types';

const STATUS_LABELS: Record<TodoStatus, string> = {
  pending: '未开始',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

const STATUS_COLORS: Record<TodoStatus, string> = {
  pending: palette.seafoamSoft,
  in_progress: palette.duneSoft,
  completed: palette.greenSoft,
  cancelled: palette.graySoft,
};

const EMPTY_MASCOT_IMAGE = require('../../../assets/images/weekly-empty-park-cat.png');
const BRAND_LOGO = require('../../../assets/images/home-brand-logo.png');

export default function TodosScreen() {
  const router = useRouter();
  const { user } = useApp();
  const { tabBarHeight } = useLayoutInsets();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadTodos = useCallback(async () => {
    if (!user) {
      setTodos([]);
      setIsLoading(false);
      return;
    }

    setError(null);
    try {
      setTodos(await getTodos(user.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '行程加载失败');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadTodos();
    });
  }, [loadTodos]);

  async function changeStatus(todoId: number, status: TodoStatus) {
    if (!user) return;
    setUpdatingId(todoId);
    setError(null);
    try {
      if (status === 'in_progress') {
        await startTodo(todoId, user.id);
      } else {
        await updateTodoStatus(todoId, status, user.id);
      }
      await loadTodos();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '状态更新失败');
    } finally {
      setUpdatingId(null);
    }
  }

  const activeTodos = todos.filter((todo) => ['pending', 'in_progress'].includes(todo.status));
  const historyTodos = todos.filter((todo) => ['completed', 'cancelled'].includes(todo.status));
  const isEmptyView = !isLoading && activeTodos.length === 0;

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={[styles.page, { paddingBottom: tabBarHeight + spacing.lg }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <Image accessibilityLabel="懒得动" resizeMode="contain" source={BRAND_LOGO} style={styles.logoImage} />
        </View>

        {error ? <ErrorCard message={error} onRetry={loadTodos} /> : null}

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={palette.primary} />
            <Text style={styles.loadingText}>正在加载本周约定…</Text>
          </View>
        ) : null}

        {isEmptyView ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyMascotFrame}>
              <Image source={EMPTY_MASCOT_IMAGE} style={styles.emptyMascotImage} resizeMode="cover" />
            </View>
            <Text style={styles.emptyTitle}>本周还没有出门计划</Text>
            <Text style={styles.emptyBody}>让 AI 给一个能执行的方案，再选好哪天出发。</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/preferences')}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>生成一个出门方案</Text>
            </Pressable>
          </View>
        ) : null}

        {activeTodos.length > 0 ? (
          <View style={styles.list}>
            {activeTodos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                updating={updatingId === todo.id}
                onOpen={() =>
                  router.push({
                    pathname: '/activity/[id]',
                    params: { id: String(todo.activityId), source: 'calendar' },
                  })
                }
                onComplete={() =>
                  router.push({
                    pathname: '/complete-checkin',
                    params: { todoId: String(todo.id) },
                  })
                }
                onStart={() => {
                  void changeStatus(todo.id, 'in_progress');
                }}
              />
            ))}
          </View>
        ) : null}

        {historyTodos.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>历史记录</Text>
            <View style={styles.list}>
              {historyTodos.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  updating={false}
                  onOpen={() =>
                    router.push({
                      pathname: '/activity/[id]',
                      params: { id: String(todo.activityId), source: 'calendar' },
                    })
                  }
                  onComplete={() => undefined}
                  onStart={() => undefined}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </AppShell>
  );
}

function TodoCard({
  todo,
  updating,
  onOpen,
  onComplete,
  onStart,
}: {
  todo: Todo;
  updating: boolean;
  onOpen: () => void;
  onComplete: () => void;
  onStart: () => void;
}) {
  const isActive = ['pending', 'in_progress'].includes(todo.status);
  const dateParts = getDateBadgeParts(todo.scheduledDate ?? todo.createdAt);

  return (
    <View style={styles.appointment}>
      <View style={styles.dateBadge}>
        <Text style={styles.weekday}>{dateParts.weekday}</Text>
        <Text style={styles.dayNum}>{dateParts.day}</Text>
      </View>
      <View style={styles.todoMain}>
        <View style={styles.todoTop}>
          <Text style={styles.todoTitle} numberOfLines={2}>{todo.title}</Text>
          <View style={[styles.status, { backgroundColor: STATUS_COLORS[todo.status] }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[todo.status]}</Text>
          </View>
        </View>
        <Text style={styles.todoSummary} numberOfLines={2}>{todo.summary}</Text>
        <Text style={styles.todoMeta}>{todo.cityName} · {todo.district}</Text>

        {updating ? (
          <ActivityIndicator color={palette.primary} style={styles.updating} />
        ) : isActive ? (
          <View style={styles.todoActions}>
            {todo.status === 'pending' ? (
              <Pressable accessibilityRole="button" onPress={onStart} style={styles.ghostButton}>
                <Text style={styles.ghostButtonText}>开始</Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" onPress={onOpen} style={styles.ghostButton}>
              <Text style={styles.ghostButtonText}>查看详情</Text>
            </Pressable>
            {todo.status === 'in_progress' ? (
              <Pressable accessibilityRole="button" onPress={onComplete} style={styles.primarySmallButton}>
                <Text style={styles.primarySmallText}>完成回传</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function getDateBadgeParts(value: string) {
  const dateKey = value.slice(0, 10);
  const [year, month, day] = dateKey.split('-').map(Number);
  const isValidDateKey = Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day);
  const date = isValidDateKey ? new Date(Date.UTC(year, month - 1, day)) : new Date(value);
  const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  if (Number.isNaN(date.getTime())) {
    return { weekday: '本周', day: '--' };
  }

  return {
    weekday: weekdayLabels[date.getUTCDay()] ?? '本周',
    day: String(date.getUTCDate()).padStart(2, '0'),
  };
}

const styles = StyleSheet.create({
  page: {
    minHeight: Platform.OS === 'web' ? ('100dvh' as unknown as number) : undefined,
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    backgroundColor: '#F0EEFF',
    ...(Platform.OS === 'web'
      ? {
          backgroundImage:
            'radial-gradient(circle at 16% 8%, rgba(128, 218, 246, 0.36) 0, rgba(128, 218, 246, 0.14) 30%, rgba(128, 218, 246, 0) 58%), radial-gradient(circle at 86% 4%, rgba(255, 221, 133, 0.42) 0, rgba(255, 221, 133, 0.18) 34%, rgba(255, 221, 133, 0) 62%), linear-gradient(180deg, #DDF8FF 0%, #F4F0FF 52%, #ECE8FF 100%)',
        } as Record<string, string>
      : {}),
  },
  topbar: {
    height: components.topBarHeight + 24,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logoImage: {
    width: 76,
    height: 50,
  },
  loading: { alignItems: 'center', gap: spacing.sm, paddingVertical: 40 },
  loadingText: { color: palette.muted, fontSize: typography.caption },
  emptyState: {
    paddingHorizontal: spacing.sm,
    paddingTop: 36,
    paddingBottom: 44,
    alignItems: 'center',
  },
  emptyMascotFrame: {
    width: 210,
    height: 210,
    borderRadius: 52,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    ...shadows.card,
  },
  emptyMascotImage: {
    width: '100%',
    height: '100%',
    opacity: 0.94,
  },
  emptyTitle: {
    color: palette.ink,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: spacing.md,
    color: '#8D85AD',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    fontWeight: '900',
  },
  primaryButton: {
    marginTop: 34,
    minHeight: 52,
    alignSelf: 'stretch',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    ...shadows.primaryButton,
  },
  primaryButtonText: { color: palette.white, fontSize: typography.body, fontWeight: '900' },
  list: { gap: spacing.md },
  appointment: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: 14,
    borderRadius: 26,
    backgroundColor: palette.white,
    ...shadows.card,
  },
  dateBadge: {
    width: 64,
    height: 72,
    borderRadius: 22,
    backgroundColor: palette.duneSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekday: { color: palette.text, fontSize: 12, fontWeight: '900' },
  dayNum: { marginTop: 2, color: palette.ink, fontSize: 26, lineHeight: 28, fontWeight: '900' },
  todoMain: { flex: 1, minWidth: 0 },
  todoTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  todoTitle: { flex: 1, minWidth: 0, color: palette.ink, fontSize: typography.h3, fontWeight: '900' },
  status: { borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 6 },
  statusText: { color: palette.text, fontSize: 11, fontWeight: '900' },
  todoSummary: { marginTop: spacing.sm, color: palette.text, fontSize: typography.caption, lineHeight: 18, fontWeight: '800' },
  todoMeta: { marginTop: spacing.xs, color: palette.muted, fontSize: 11, fontWeight: '800' },
  todoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  ghostButton: {
    borderRadius: radii.pill,
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  ghostButtonText: { color: palette.primary, fontSize: typography.caption, fontWeight: '900' },
  primarySmallButton: {
    borderRadius: radii.pill,
    backgroundColor: palette.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  primarySmallText: { color: palette.white, fontSize: typography.caption, fontWeight: '900' },
  updating: { alignSelf: 'flex-start', marginTop: spacing.md },
  section: { gap: spacing.md },
  sectionTitle: { color: palette.ink, fontSize: typography.h3, fontWeight: '900' },
  pressed: { opacity: 0.78 },
});
