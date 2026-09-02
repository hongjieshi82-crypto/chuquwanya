import {
  ArrowRightOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
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
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';

import { useApp } from '@/contexts/app-context';
import { resolveCuratedActivityCover } from '@/services/demo-data';
import { getActivity, getTodos, startTodo, updateTodoStatus } from '@/services/api';
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
  padding: 58px 56px 88px;
  color: #f7f7f2;
  background:
    radial-gradient(circle at 8% 8%, rgba(168, 216, 64, .15), transparent 30%),
    radial-gradient(circle at 92% 12%, rgba(72, 173, 255, .14), transparent 32%),
    linear-gradient(145deg, #111419 0%, #101018 48%, #111712 100%);
  background-attachment: fixed;
}
.pc-trips-page::before { content: ''; position: fixed; inset: 0; pointer-events: none; opacity: .22; background-image: radial-gradient(rgba(255,255,255,.28) .7px, transparent .7px); background-size: 18px 18px; mask-image: linear-gradient(to bottom, black, transparent 72%); }
.pc-trips-container { position: relative; z-index: 1; width: min(1280px, 100%); margin: 0 auto; }
.pc-trips-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; margin-bottom: 38px; }
.pc-trips-title.ant-typography { margin: 0; color: #f7f7f2; font-size: clamp(40px, 4vw, 62px); font-weight: 900; line-height: 1.04; letter-spacing: -.045em; }
.pc-trips-subtitle.ant-typography { display: block; margin-top: 14px; color: rgba(255,255,255,.58); font-size: 16px; }
.pc-trips-create.ant-btn { height: 52px; padding-inline: 24px; border: 0; border-radius: 999px; color: #111419; background: #c9ff62; box-shadow: 0 12px 34px rgba(201,255,98,.18); font-weight: 850; }
.pc-trips-create.ant-btn:hover { color: #111419 !important; background: #dcff9b !important; transform: translateY(-2px); }
.pc-trips-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.pc-trips-segmented.ant-segmented { width: min(540px, 100%); padding: 5px; border: 1px solid rgba(255,255,255,.1); border-radius: 999px; background: rgba(255,255,255,.055); box-shadow: inset 0 1px 0 rgba(255,255,255,.05); }
.pc-trips-segmented .ant-segmented-group { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); width: 100%; }
.pc-trips-segmented .ant-segmented-item { min-width: 0; min-height: 36px; padding-inline: 0; border-radius: 999px; color: rgba(255,255,255,.58); font-size: 13px; font-weight: 600; text-align: center; }
.pc-trips-segmented .ant-segmented-item-label { display: flex; align-items: center; justify-content: center; width: 100%; }
.pc-trips-segmented .ant-segmented-item-selected { color: #10130d; background: #c9ff62; box-shadow: none; font-weight: 900; }
.pc-trips-summary { color: rgba(255,255,255,.46); font-size: 13px; }
.pc-trips-summary b { color: #c9ff62; font-weight: 800; }
.pc-trips-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.pc-trip-card.ant-card { position: relative; overflow: hidden; min-height: 540px; border: 1px solid rgba(223,228,216,.95); border-radius: 24px; background: #fbfcf8; box-shadow: 0 18px 44px rgba(0,0,0,.18); transition: transform .28s cubic-bezier(.2,.8,.2,1), border-color .28s ease, box-shadow .28s ease; animation: trip-card-in .55s both; }
.pc-trip-card.ant-card:nth-child(2) { animation-delay: .07s; }.pc-trip-card.ant-card:nth-child(3) { animation-delay: .14s; }.pc-trip-card.ant-card:nth-child(4) { animation-delay: .21s; }
.pc-trip-card.ant-card::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(120deg, transparent 25%, rgba(201,255,98,.06), transparent 70%); transform: translateX(-110%); transition: transform .65s ease; }
.pc-trip-card.ant-card:hover { transform: translateY(-7px); border-color: rgba(201,255,98,.42); box-shadow: 0 24px 54px rgba(0,0,0,.32); }.pc-trip-card.ant-card:hover::after { transform: translateX(110%); }
.pc-trip-card .ant-card-body { display: flex; flex-direction: column; height: 100%; min-height: 540px; padding: 0; }
.pc-trip-cover { position: relative; flex: 0 0 auto; height: 220px; overflow: hidden; background: radial-gradient(circle at 72% 28%, color-mix(in srgb, var(--trip-accent) 55%, transparent), transparent 34%), linear-gradient(145deg,#2b3930,#17202a); }
.pc-trip-cover img { width: 100%; height: 100%; display: block; object-fit: cover; transition: transform .65s cubic-bezier(.2,.8,.2,1); }.pc-trip-card:hover .pc-trip-cover img { transform: scale(1.055); }
.pc-trip-cover-placeholder { width: 100%; height: 100%; display: grid; place-items: center; color: rgba(255,255,255,.2); font-size: 36px; font-weight: 900; letter-spacing: -.04em; }
.pc-trip-cover-shade { position: absolute; inset: 0; background: linear-gradient(180deg,rgba(4,7,8,.06),rgba(7,9,12,.58)); }
.pc-trip-date { position: absolute; left: 18px; bottom: 18px; z-index: 1; display: inline-flex; flex-direction: column; align-items: flex-start; justify-content: center; width: 70px; height: 66px; padding-left: 13px; border: 1px solid rgba(201,255,98,.36); border-radius: 14px; color: #c9ff62; background: rgba(10,13,15,.7); box-shadow: 0 10px 26px rgba(0,0,0,.24); backdrop-filter: blur(13px); }
.pc-trip-date span { font-size: 11px; font-weight: 750; line-height: 1.1; }.pc-trip-date b { margin-top: 4px; font: 900 25px/1 ui-monospace,SFMono-Regular,Menlo,monospace; }
.pc-trip-cover-actions { position: absolute; top: 17px; right: 14px; z-index: 2; }
.pc-trip-status.ant-tag { display: inline-flex; align-items: center; gap: 7px; height: 30px; margin: 0; padding: 0 12px; border: 1px solid rgba(255,255,255,.16); border-radius: 999px; color: #fff; background: rgba(10,13,15,.68); box-shadow: 0 8px 22px rgba(0,0,0,.18); font-size: 12px; font-weight: 750; line-height: 28px; backdrop-filter: blur(12px); }
.pc-trip-status i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; box-shadow: 0 0 10px currentColor; }
.pc-trip-status.is-pending { color: #f4d277; }.pc-trip-status.is-progress { color: #84c8ff; }.pc-trip-status.is-completed { color: #c9ff62; }.pc-trip-status.is-cancelled { color: #aaaab3; }
.pc-trip-overflow.ant-btn { width: 30px; height: 30px; color: #fff; background: rgba(10,13,15,.68); backdrop-filter: blur(12px); }
.pc-trip-content { display: flex; flex: 1; flex-direction: column; padding: 27px 26px 25px; }
.pc-trip-title.ant-typography { margin: 0 0 10px; color: #171c18; font-size: 25px; font-weight: 900; line-height: 1.35; letter-spacing: .01em; }
.pc-trip-summary.ant-typography { display: -webkit-box; min-height: 52px; margin: 0; overflow: hidden; color: #626a63; font-size: 16px; line-height: 26px; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.pc-trip-meta { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 13px 16px; margin-top: 22px; padding-top: 20px; border-top: 1px solid #e2e7dd; color: #555e57; font-size: 14px; font-weight: 600; }.pc-trip-meta-item:last-child { grid-column: 1 / -1; }
.pc-trip-meta-item { display: flex; align-items: center; gap: 7px; min-width: 0; }
.pc-trip-meta-item svg { color: #6f9821; }
.pc-trip-meta-item span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pc-trip-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 19px; }
.pc-trip-detail.ant-btn { padding: 0; color: #567c16; font-size: 15px; font-weight: 850; }.pc-trip-detail.ant-btn:hover { color: #38550b !important; }
.pc-trip-start.ant-btn { height: 40px; padding-inline: 18px; border: 0; border-radius: 999px; color: #10130d; background: #c9ff62; box-shadow: none; font-size: 14px; font-weight: 850; }
.pc-trips-empty.ant-empty { margin: 0; padding: 78px 24px; border: 1px dashed rgba(201,255,98,.24); border-radius: 22px; background: rgba(255,255,255,.035); }.pc-trips-empty .ant-empty-description { color: rgba(255,255,255,.58); }.pc-trips-empty .ant-empty-image { filter: grayscale(1) brightness(1.9); opacity: .58; }
.pc-trips-loading { display: grid; min-height: 280px; place-items: center; border: 1px solid rgba(255,255,255,.1); border-radius: 22px; background: rgba(255,255,255,.035); }.pc-trips-loading .ant-spin-text { color: rgba(255,255,255,.6); }
@keyframes trip-card-in { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
@media (max-width: 1100px) { .pc-trips-page { padding-inline: 28px; } .pc-trips-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 680px) { .pc-trips-page { padding: 30px 16px 48px; } .pc-trips-heading, .pc-trips-toolbar { align-items: flex-start; flex-direction: column; } .pc-trips-create { width: 100%; } .pc-trips-segmented { width: 100%; overflow-x: auto; } .pc-trips-grid { grid-template-columns: 1fr; } .pc-trips-title.ant-typography { font-size: 26px; } }
@media (prefers-reduced-motion: reduce) { .pc-trip-card.ant-card { animation: none; transition: none; }.pc-trip-card.ant-card:hover { transform: none; }.pc-trip-card.ant-card::after { display: none; } }
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
  coverImageUri,
  item,
  isCompleting,
  isStarting,
  onComplete,
  onStart,
}: {
  coverImageUri?: string | null;
  item: Todo;
  isCompleting: boolean;
  isStarting: boolean;
  onComplete: (item: Todo) => void;
  onStart: (item: Todo) => void;
}) {
  const router = useRouter();
  const status = statusMeta[item.status];
  const date = dateParts(item.scheduledDate || item.createdAt);
  const effectiveCoverImageUri = coverImageUri || resolveCuratedActivityCover(item);
  const menuItems: MenuProps['items'] = [
    { key: 'detail', label: '查看详情', icon: <ArrowRightOutlined /> },
    { key: 'calendar', label: '添加到日历', icon: <CalendarOutlined /> },
  ];

  return (
    <Card className="pc-trip-card" variant="borderless">
      <div className="pc-trip-cover" style={{ '--trip-accent': item.accentColor || '#c9ff62' } as CSSProperties}>
        {effectiveCoverImageUri ? <img alt={`${item.title}场景图`} src={effectiveCoverImageUri} /> : <div className="pc-trip-cover-placeholder"><span>{item.cityName || '周末出发'}</span></div>}
        <div className="pc-trip-cover-shade" />
        <div className="pc-trip-date"><span>{date.month}</span><b>{date.day}</b></div>
        <Space className="pc-trip-cover-actions" size={7} align="start">
          <Tag className={`pc-trip-status ${status.className}`} color={status.color}><i />{status.label}</Tag>
          <Dropdown menu={{ items: menuItems, onClick: ({ key }) => key === 'detail' && router.push(`/activity/${item.activityId}`) }} trigger={['click']}>
            <Button aria-label="行程更多操作" className="pc-trip-overflow" icon={<MoreOutlined />} type="text" />
          </Dropdown>
        </Space>
      </div>
      <div className="pc-trip-content">
        <Title className="pc-trip-title" level={4}>{item.title}</Title>
        <Paragraph className="pc-trip-summary">{item.summary || '一场为你准备的城市探索，随时出发。'}</Paragraph>
        <div className="pc-trip-meta">
          <div className="pc-trip-meta-item"><CalendarOutlined /><span>{formatDate(item.scheduledDate || item.createdAt)}</span></div>
          <div className="pc-trip-meta-item"><EnvironmentOutlined /><span>{[item.cityName, item.district || item.address].filter(Boolean).join(' · ') || '地点待定'}</span></div>
          <div className="pc-trip-meta-item"><ClockCircleOutlined /><span>{formatDuration(item.durationMinutes)} · <DollarOutlined /> {item.budgetYuan ? `预算 ¥${item.budgetYuan}` : '预算待定'}</span></div>
        </div>
        <div className="pc-trip-actions">
          <Button className="pc-trip-detail" icon={<ArrowRightOutlined />} iconPlacement="end" type="link" onClick={() => router.push(`/activity/${item.activityId}`)}>查看详情</Button>
          {item.status === 'pending' ? <Button className="pc-trip-start" icon={<PlayCircleOutlined />} loading={isStarting} type="primary" onClick={() => onStart(item)}>开始行程</Button> : null}
          {item.status === 'in_progress' ? <Button className="pc-trip-start" loading={isCompleting} type="primary" onClick={() => onComplete(item)}>完成行程</Button> : null}
          {item.status === 'completed' ? <Badge color="#78a927" text={<span style={{ color: '#59615a', fontSize: 14, fontWeight: 700 }}>已留下回忆</span>} /> : null}
        </div>
      </div>
    </Card>
  );
}

export default function PcTripsScreen() {
  const router = useRouter();
  const { user } = useApp();
  const userId = user?.id;
  const [items, setItems] = useState<Todo[]>([]);
  const [coverImages, setCoverImages] = useState<Record<number, string | null>>({});
  const [filter, setFilter] = useState<TripFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);
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
      const nextItems = await getTodos(userId);
      setItems(nextItems);
      const covers = await Promise.all(nextItems.map(async (item) => {
        try {
          const activity = await getActivity(item.activityId);
          return [item.activityId, activity.coverImageUri ?? null] as const;
        } catch {
          return [item.activityId, null] as const;
        }
      }));
      setCoverImages(Object.fromEntries(covers));
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

  const handleComplete = async (item: Todo) => {
    if (!userId) return;
    setCompletingId(item.id);
    setError(null);
    try {
      await updateTodoStatus(item.id, 'completed', userId);
      await loadTrips();
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <ConfigProvider theme={{ token: { borderRadius: radii.lg, colorPrimary: palette.primary, colorTextLightSolid: palette.ink, fontFamily: 'Inter, PingFang SC, Microsoft YaHei, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif' } }}>
      <main className="pc-trips-page">
        <style>{tripsCss}</style>
        <div className="pc-trips-container">
          <div className="pc-trips-heading">
            <div>
              <Title className="pc-trips-title" level={1}>旅行任务台</Title>
              <Text className="pc-trips-subtitle">把每一次心动，装载成真正会发生的行程。</Text>
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
          {!loading && visibleItems.length > 0 ? <div className="pc-trips-grid">{visibleItems.map((item) => <TripCard coverImageUri={coverImages[item.activityId]} isCompleting={completingId === item.id} isStarting={startingId === item.id} item={item} key={item.id} onComplete={(todo) => { void handleComplete(todo); }} onStart={(todo) => { void handleStart(todo); }} />)}</div> : null}
          {!loading && visibleItems.length === 0 ? <Empty className="pc-trips-empty" description={filter === 'all' ? '还没有行程，去抽一个目的地吧' : '这个分类里暂时没有行程'} image={Empty.PRESENTED_IMAGE_SIMPLE}><Button icon={<PlusOutlined />} type="primary" onClick={() => router.push('/box/config')}>创建新行程</Button></Empty> : null}
        </div>
      </main>
    </ConfigProvider>
  );
}
