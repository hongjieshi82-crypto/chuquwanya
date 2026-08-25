import {
  ArrowRightOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfigProvider,
  Dropdown,
  Empty,
  Segmented,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useApp } from '@/contexts/app-context';
import { getTodos, startTodo } from '@/services/api';
import { palette, radii } from '@/theme';
import type { Todo, TodoStatus } from '@/types';

const { Paragraph, Text, Title } = Typography;

type TripFilter = 'all' | 'upcoming' | 'in_progress' | 'completed';

const filterOptions: { label: string; value: TripFilter }[] = [
  { label: '全部行程', value: 'all' },
  { label: '待出发', value: 'upcoming' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
];

const statusMeta: Record<TodoStatus, { label: string; color: string; className: string }> = {
  pending: { label: '待出发', color: 'gold', className: 'is-pending' },
  in_progress: { label: '进行中', color: 'processing', className: 'is-progress' },
  completed: { label: '已完成', color: 'success', className: 'is-completed' },
  cancelled: { label: '已取消', color: 'default', className: 'is-cancelled' },
};

const tripsCss = `
.pc-trips-page {
  min-height: calc(100dvh - 76px);
  padding: 48px 56px 72px;
  background: #f6f7fb;
}
.pc-trips-container { width: min(1200px, 100%); margin: 0 auto; }
.pc-trips-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
.pc-trips-kicker { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px; color: #7c6fe8; font-size: 13px; font-weight: 700; }
.pc-trips-title.ant-typography { margin: 0; color: #1f2937; font-size: 32px; line-height: 1.25; letter-spacing: -.02em; }
.pc-trips-subtitle.ant-typography { display: block; margin-top: 8px; color: #7b8496; font-size: 14px; }
.pc-trips-create.ant-btn { height: 42px; padding-inline: 19px; border-radius: 12px; box-shadow: none; font-weight: 700; }
.pc-trips-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.pc-trips-segmented.ant-segmented { padding: 4px; border: 1px solid #e9ecf2; border-radius: 12px; background: #fff; box-shadow: 0 1px 2px rgba(16, 24, 40, .03); }
.pc-trips-segmented .ant-segmented-item { min-height: 32px; padding-inline: 14px; border-radius: 8px; color: #667085; font-size: 13px; font-weight: 600; }
.pc-trips-segmented .ant-segmented-item-selected { color: #5145cd; box-shadow: none; }
.pc-trips-summary { color: #98a2b3; font-size: 13px; }
.pc-trips-summary b { color: #344054; font-weight: 700; }
.pc-trips-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.pc-trip-card.ant-card { overflow: hidden; min-height: 282px; border: 1px solid #e9ecf2; border-radius: 16px; background: #fff; box-shadow: 0 2px 8px rgba(16, 24, 40, .035); transition: transform .18s ease, box-shadow .18s ease; }
.pc-trip-card.ant-card:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(16, 24, 40, .09); }
.pc-trip-card .ant-card-body { display: flex; flex-direction: column; height: 100%; min-height: 282px; padding: 22px; }
.pc-trip-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.pc-trip-date { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; flex: 0 0 auto; width: 46px; height: 48px; border: 1px solid #ebe8ff; border-radius: 10px; background: #f8f7ff; color: #5548cf; }
.pc-trip-date span { font-size: 11px; font-weight: 700; line-height: 1.1; }
.pc-trip-date b { font-size: 19px; line-height: 1.1; }
.pc-trip-status.ant-tag { margin: 0; border: 0; border-radius: 6px; font-size: 12px; font-weight: 600; line-height: 25px; }
.pc-trip-status.is-pending { color: #b26a00; background: #fff7e6; }
.pc-trip-status.is-progress { color: #2563b8; background: #edf6ff; }
.pc-trip-status.is-completed { color: #247c52; background: #edf9f1; }
.pc-trip-status.is-cancelled { color: #667085; background: #f2f4f7; }
.pc-trip-title.ant-typography { margin: 20px 0 7px; color: #1d2939; font-size: 18px; line-height: 1.45; }
.pc-trip-summary.ant-typography { display: -webkit-box; min-height: 40px; margin: 0; overflow: hidden; color: #7b8496; font-size: 13px; line-height: 20px; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.pc-trip-meta { display: grid; gap: 9px; margin-top: 18px; padding-top: 17px; border-top: 1px solid #f0f1f4; color: #667085; font-size: 12px; }
.pc-trip-meta-item { display: flex; align-items: center; gap: 7px; min-width: 0; }
.pc-trip-meta-item span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pc-trip-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 19px; }
.pc-trip-detail.ant-btn { padding: 0; color: #5145cd; font-size: 13px; font-weight: 700; }
.pc-trip-detail.ant-btn:hover { color: #7c6fe8; }
.pc-trip-start.ant-btn { height: 34px; border-radius: 8px; box-shadow: none; font-size: 13px; font-weight: 700; }
.pc-trip-overflow.ant-btn { color: #98a2b3; }
.pc-trips-empty.ant-empty { margin: 0; padding: 72px 24px; border: 1px dashed #d8dce6; border-radius: 16px; background: #fff; }
.pc-trips-empty .ant-empty-description { color: #667085; }
.pc-trips-loading { display: grid; min-height: 280px; place-items: center; border: 1px solid #e9ecf2; border-radius: 16px; background: #fff; }
@media (max-width: 1100px) { .pc-trips-page { padding-inline: 28px; } .pc-trips-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 680px) { .pc-trips-page { padding: 30px 16px 48px; } .pc-trips-heading, .pc-trips-toolbar { align-items: flex-start; flex-direction: column; } .pc-trips-create { width: 100%; } .pc-trips-segmented { width: 100%; overflow-x: auto; } .pc-trips-grid { grid-template-columns: 1fr; } .pc-trips-title.ant-typography { font-size: 26px; } }
`;

function getErrorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : '行程暂时加载失败，请稍后重试。';
}

function dateParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { month: '行程', day: '--' };
  return { month: `${date.getMonth() + 1} 月`, day: String(date.getDate()).padStart(2, '0') };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '待定日期';
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(date);
}

function formatDuration(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return '时间待定';
  return minutes < 60 ? `${minutes} 分钟` : `${Math.round((minutes / 60) * 10) / 10} 小时`;
}

function matchesFilter(item: Todo, filter: TripFilter) {
  if (filter === 'all') return true;
  if (filter === 'upcoming') return item.status === 'pending';
  return item.status === filter;
}

function TripCard({
  item,
  isStarting,
  onStart,
}: {
  item: Todo;
  isStarting: boolean;
  onStart: (item: Todo) => void;
}) {
  const router = useRouter();
  const status = statusMeta[item.status];
  const date = dateParts(item.scheduledDate || item.createdAt);
  const menuItems: MenuProps['items'] = [
    { key: 'detail', label: '查看详情', icon: <ArrowRightOutlined /> },
    { key: 'calendar', label: '添加到日历', icon: <CalendarOutlined /> },
  ];

  return (
    <Card className="pc-trip-card" bordered={false}>
      <div className="pc-trip-card-top">
        <div className="pc-trip-date"><span>{date.month}</span><b>{date.day}</b></div>
        <Space size={4} align="start">
          <Tag className={`pc-trip-status ${status.className}`} color={status.color}>{status.label}</Tag>
          <Dropdown menu={{ items: menuItems, onClick: ({ key }) => key === 'detail' && router.push(`/activity/${item.activityId}`) }} trigger={['click']}>
            <Button aria-label="行程更多操作" className="pc-trip-overflow" icon={<MoreOutlined />} type="text" />
          </Dropdown>
        </Space>
      </div>
      <Title className="pc-trip-title" level={4}>{item.title}</Title>
      <Paragraph className="pc-trip-summary">{item.summary || '一场为你准备的城市探索，随时出发。'}</Paragraph>
      <div className="pc-trip-meta">
        <div className="pc-trip-meta-item"><CalendarOutlined /><span>{formatDate(item.scheduledDate || item.createdAt)}</span></div>
        <div className="pc-trip-meta-item"><EnvironmentOutlined /><span>{[item.cityName, item.district || item.address].filter(Boolean).join(' · ') || '地点待定'}</span></div>
        <div className="pc-trip-meta-item"><ClockCircleOutlined /><span>{formatDuration(item.durationMinutes)} · <DollarOutlined /> {item.budgetYuan ? `预算 ¥${item.budgetYuan}` : '预算待定'}</span></div>
      </div>
      <div className="pc-trip-actions">
        <Button className="pc-trip-detail" icon={<ArrowRightOutlined />} iconPosition="end" type="link" onClick={() => router.push(`/activity/${item.activityId}`)}>查看详情</Button>
        {item.status === 'pending' ? <Button className="pc-trip-start" icon={<PlayCircleOutlined />} loading={isStarting} type="primary" onClick={() => onStart(item)}>开始行程</Button> : null}
        {item.status === 'in_progress' ? <Badge color="#1677ff" text="旅程进行中" /> : null}
        {item.status === 'completed' ? <Badge color="#52c41a" text="已留下回忆" /> : null}
      </div>
    </Card>
  );
}

export default function PcTripsScreen() {
  const router = useRouter();
  const { user } = useApp();
  const userId = user?.id;
  const [items, setItems] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<TripFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = useCallback(async (showRefresh = false) => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (showRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      setItems(await getTodos(userId));
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTrips();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadTrips]);

  const visibleItems = useMemo(() => items.filter((item) => matchesFilter(item, filter)), [filter, items]);
  const activeCount = items.filter((item) => item.status === 'pending' || item.status === 'in_progress').length;

  const handleStart = async (item: Todo) => {
    if (!userId) return;
    setStartingId(item.id);
    setError(null);
    try {
      await startTodo(item.id, userId);
      await loadTrips();
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setStartingId(null);
    }
  };

  return (
    <ConfigProvider theme={{ token: { borderRadius: radii.lg, colorPrimary: palette.primary, fontFamily: 'Inter, PingFang SC, Microsoft YaHei, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif' } }}>
      <main className="pc-trips-page">
        <style>{tripsCss}</style>
        <div className="pc-trips-container">
          <div className="pc-trips-heading">
            <div>
              <div className="pc-trips-kicker"><CompassOutlined /> TRIP CENTER</div>
              <Title className="pc-trips-title" level={1}>我的行程</Title>
              <Text className="pc-trips-subtitle">把想去的地方，变成真正会发生的计划。</Text>
            </div>
            <Button className="pc-trips-create" icon={<PlusOutlined />} size="large" type="primary" onClick={() => router.push('/box/config')}>创建新行程</Button>
          </div>

          {error ? <Alert closable description={error} title="加载失败" showIcon style={{ marginBottom: 16 }} type="error" /> : null}
          <div className="pc-trips-toolbar">
            <Segmented className="pc-trips-segmented" options={filterOptions} value={filter} onChange={(value) => setFilter(value as TripFilter)} />
            <Space size={12}>
              <Text className="pc-trips-summary">当前有 <b>{activeCount}</b> 个待完成行程</Text>
              <Button aria-label="刷新行程" icon={<ReloadOutlined />} loading={refreshing} type="text" onClick={() => void loadTrips(true)} />
            </Space>
          </div>

          {loading ? <div className="pc-trips-loading"><Spin description="正在加载你的行程…" /></div> : null}
          {!loading && visibleItems.length > 0 ? <div className="pc-trips-grid">{visibleItems.map((item) => <TripCard isStarting={startingId === item.id} item={item} key={item.id} onStart={(todo) => { void handleStart(todo); }} />)}</div> : null}
          {!loading && visibleItems.length === 0 ? <Empty className="pc-trips-empty" description={filter === 'all' ? '还没有行程，去抽一个盲盒吧' : '这个分类里暂时没有行程'} image={Empty.PRESENTED_IMAGE_SIMPLE}><Button icon={<PlusOutlined />} type="primary" onClick={() => router.push('/box/config')}>创建新行程</Button></Empty> : null}
        </div>
      </main>
    </ConfigProvider>
  );
}
