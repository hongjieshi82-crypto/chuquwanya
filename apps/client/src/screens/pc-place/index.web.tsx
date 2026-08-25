import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Col, ConfigProvider, Empty, Row, Skeleton, Space, Tag, Typography } from 'antd';
import 'antd/dist/reset.css';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { formatBudget, formatDuration } from '@/formatters';
import { getActivity } from '@/services/api';
import { palette, radii } from '@/theme';
import type { Activity } from '@/types';

const { Paragraph, Text, Title } = Typography;

function buildMapUrl(activity: Activity) {
  if (activity.latitude !== null && activity.longitude !== null) {
    const target = `${activity.longitude},${activity.latitude},${encodeURIComponent(activity.title)}`;
    return `https://uri.amap.com/navigation?to=${target}&mode=walk&src=lazy2move&callnative=1`;
  }
  return activity.navigationUrl ?? `https://uri.amap.com/search?keyword=${encodeURIComponent(activity.address || activity.title)}`;
}

const pcPlaceCss = `
.pc-place-page {
  min-height: calc(100dvh - 76px);
  padding: 42px clamp(24px, 5vw, 72px) 76px;
  background:
    radial-gradient(circle at 12% 8%, rgba(117,101,246,.16), transparent 28%),
    radial-gradient(circle at 88% 20%, rgba(142,200,255,.16), transparent 28%),
    linear-gradient(180deg, #F5F2FF 0%, #FBFAFF 48%, #FFFFFF 100%);
}
.pc-place-shell { width: min(100%, 1180px); margin: 0 auto; }
.pc-place-back.ant-btn { margin-bottom: 20px; color: ${palette.text}; font-weight: 800; }
.pc-place-hero.ant-card { overflow: hidden; border: 1px solid rgba(232,225,255,.92); border-radius: 32px; box-shadow: 0 26px 68px rgba(69,50,158,.14); }
.pc-place-hero .ant-card-body { padding: 0; }
.pc-place-cover { width: 100%; min-height: 470px; height: 100%; object-fit: cover; display: block; background: ${palette.primarySoft}; }
.pc-place-copy { min-height: 470px; padding: 52px 50px; display: flex; flex-direction: column; justify-content: center; }
.pc-place-kicker { color: ${palette.primaryDark}; font-weight: 900; letter-spacing: .08em; }
.pc-place-copy h1.ant-typography { margin: 16px 0 14px; color: ${palette.ink}; font-size: clamp(38px, 4.2vw, 58px); line-height: 1.08; font-weight: 900; }
.pc-place-copy > p.ant-typography { margin: 0; color: ${palette.text}; font-size: 16px; line-height: 1.8; }
.pc-place-tags { margin: 24px 0; }
.pc-place-actions { margin-top: 8px; }
.pc-place-actions .ant-btn { min-height: 48px; border-radius: ${radii.pill}px; font-weight: 900; }
.pc-place-grid { margin-top: 24px; }
.pc-place-panel.ant-card { height: 100%; border: 1px solid rgba(232,225,255,.84); border-radius: 24px; box-shadow: 0 14px 36px rgba(71,54,150,.08); }
.pc-place-panel .ant-card-body { padding: 28px; }
.pc-place-panel h3.ant-typography { margin: 0 0 20px; color: ${palette.ink}; font-size: 22px; }
.pc-place-facts { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
.pc-place-fact { padding: 16px; border-radius: 16px; background: #F7F5FF; display: flex; gap: 12px; align-items: center; color: ${palette.primaryDark}; }
.pc-place-fact div { min-width: 0; display: flex; flex-direction: column; }
.pc-place-fact small { color: ${palette.muted}; font-weight: 700; }
.pc-place-fact strong { color: ${palette.ink}; font-size: 14px; }
.pc-place-list { margin: 0; padding: 0; list-style: none; counter-reset: place-step; }
.pc-place-list li { position: relative; min-height: 46px; padding: 0 0 20px 50px; color: ${palette.text}; line-height: 1.65; counter-increment: place-step; }
.pc-place-list li::before { content: counter(place-step, decimal-leading-zero); position: absolute; left: 0; top: -3px; width: 34px; height: 34px; display: grid; place-items: center; border-radius: 12px; color: #fff; background: linear-gradient(135deg, ${palette.primary}, ${palette.primaryDark}); font-size: 11px; font-weight: 900; }
.pc-place-tips { display: grid; gap: 12px; }
.pc-place-tip { padding: 14px 16px; border: 1px solid rgba(246,183,60,.24); border-radius: 16px; color: #795B22; background: #FFF9EA; line-height: 1.6; }
.pc-place-loading, .pc-place-empty { width: min(100%, 1180px); margin: 0 auto; padding: 80px 0; }
@media (max-width: 900px) {
  .pc-place-page { padding: 24px 16px 48px; }
  .pc-place-cover { min-height: 300px; }
  .pc-place-copy { min-height: 0; padding: 32px 26px; }
}
@media (max-width: 560px) { .pc-place-facts { grid-template-columns: 1fr; } }
`;

export default function PcPlaceScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId?: string }>();
  const parsedId = Number(activityId);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      if (!Number.isFinite(parsedId) || parsedId <= 0) {
        setError('这个玩法链接无效。');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      void getActivity(parsedId)
        .then(setActivity)
        .catch((reason) => setError(reason instanceof Error ? reason.message : '玩法加载失败'))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [parsedId]);

  const mapUrl = useMemo(() => (activity ? buildMapUrl(activity) : ''), [activity]);

  return (
    <ConfigProvider theme={{ token: { colorPrimary: palette.primary, borderRadius: radii.lg } }}>
      <style>{pcPlaceCss}</style>
      <main className="pc-place-page">
        {loading ? (
          <div className="pc-place-loading"><Skeleton active paragraph={{ rows: 12 }} /></div>
        ) : error || !activity ? (
          <div className="pc-place-empty">
            {error ? <Alert type="error" showIcon title="玩法加载失败" description={error} /> : <Empty />}
          </div>
        ) : (
          <div className="pc-place-shell">
            <Button className="pc-place-back" type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
              返回上一页
            </Button>
            <Card className="pc-place-hero" variant="borderless">
              <Row align="stretch">
                <Col xs={24} lg={13}>
                  <img className="pc-place-cover" src={activity.coverImageUri ?? ''} alt={activity.title} />
                </Col>
                <Col xs={24} lg={11}>
                  <div className="pc-place-copy">
                    <Text className="pc-place-kicker">{activity.cityName} · {activity.district}</Text>
                    <Title>{activity.title}</Title>
                    <Paragraph>{activity.summary}</Paragraph>
                    <Space className="pc-place-tags" size={[8, 8]} wrap>
                      <Tag color="purple">{activity.category}</Tag>
                      <Tag color="blue">{activity.mood}</Tag>
                      {activity.moodTags.slice(0, 3).map((tag) => <Tag key={tag}>{tag}</Tag>)}
                    </Space>
                    <Space className="pc-place-actions" size={12} wrap>
                      <Button type="primary" size="large" icon={<GiftOutlined />} onClick={() => router.push('/box/config')}>
                        换个类似玩法
                      </Button>
                      <Button size="large" icon={<CompassOutlined />} href={mapUrl} target="_blank">
                        打开地图
                      </Button>
                    </Space>
                  </div>
                </Col>
              </Row>
            </Card>
            <Row className="pc-place-grid" gutter={[20, 20]}>
              <Col xs={24} lg={10}>
                <Card className="pc-place-panel" variant="borderless">
                  <Title level={3}>行程信息</Title>
                  <div className="pc-place-facts">
                    <div className="pc-place-fact"><ClockCircleOutlined /><div><small>建议时长</small><strong>{formatDuration(activity.durationMinutes)}</strong></div></div>
                    <div className="pc-place-fact"><WalletOutlined /><div><small>参考预算</small><strong>{formatBudget(activity.budgetYuan)}</strong></div></div>
                    <div className="pc-place-fact"><EnvironmentOutlined /><div><small>地点</small><strong>{activity.address}</strong></div></div>
                    <div className="pc-place-fact"><SafetyCertificateOutlined /><div><small>适合人数</small><strong>{activity.minPartySize}–{activity.maxPartySize} 人</strong></div></div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card className="pc-place-panel" variant="borderless">
                  <Title level={3}>今天怎么玩</Title>
                  <ol className="pc-place-list">{activity.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                </Card>
              </Col>
              <Col xs={24} lg={6}>
                <Card className="pc-place-panel" variant="borderless">
                  <Title level={3}>出发前提醒</Title>
                  <div className="pc-place-tips">{activity.tips.map((tip) => <div className="pc-place-tip" key={tip}>{tip}</div>)}</div>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </main>
    </ConfigProvider>
  );
}
