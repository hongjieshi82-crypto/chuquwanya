import { Button, Card, ConfigProvider, Empty, Flex, Layout, Space, Tag, Timeline, Typography } from 'antd';
import 'antd/dist/reset.css';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { readPcMultiDayTrip } from '@/lib/pc-multi-day-trip';
import { palette, radii } from '@/theme';

const { Content } = Layout;
const { Paragraph, Text, Title } = Typography;

export default function PcMultiDayTripResult() {
  const router = useRouter();
  const [trip] = useState(() => readPcMultiDayTrip());

  return (
    <ConfigProvider theme={{ token: { colorPrimary: palette.primary, borderRadiusLG: radii.xl, fontFamily: 'Inter, PingFang SC, Microsoft YaHei, sans-serif' } }}>
      <Layout className="multi-trip-layout">
        <style>{css}</style>
        <Content>
          {trip ? (
            <main className="multi-trip-page">
              <header className="multi-trip-hero">
                <Tag className="multi-trip-badge">MULTI-DAY CITY QUEST</Tag>
                <Title>{trip.destination} · {trip.daysCount}天城市任务</Title>
                <Paragraph>{trip.summary}</Paragraph>
                <Space size={[10, 10]} wrap>
                  <Tag>📅 {trip.daysCount}天</Tag>
                  <Tag>📍 目的地锁定：{trip.destination}</Tag>
                  <Tag>💰 预计总预算 ¥{trip.totalBudgetEstimate}</Tag>
                </Space>
              </header>

              {trip.stayRecommendation || trip.budgetBreakdown ? (
                <section className="multi-trip-foundation">
                  {trip.stayRecommendation ? <Card title="住宿建议" className="multi-trip-foundation-card"><Title level={4}>{trip.stayRecommendation.name}</Title><Paragraph>{trip.stayRecommendation.note}</Paragraph><Text>{trip.stayRecommendation.address} · 约 ¥{trip.stayRecommendation.estimatedNightlyPrice}/晚</Text>{trip.stayRecommendation.sourceUrl ? <Button type="link" href={trip.stayRecommendation.sourceUrl} target="_blank">在高德确认酒店</Button> : null}</Card> : null}
                  {trip.budgetBreakdown ? <Card title="预算拆分" className="multi-trip-foundation-card"><div className="multi-trip-budget-grid"><span>跨城交通<strong>¥{trip.budgetBreakdown.intercityTransport}</strong></span><span>住宿<strong>¥{trip.budgetBreakdown.hotel}</strong></span><span>餐饮<strong>¥{trip.budgetBreakdown.meals}</strong></span><span>市内交通<strong>¥{trip.budgetBreakdown.localTransport}</strong></span><span>活动<strong>¥{trip.budgetBreakdown.activities}</strong></span><span>机动余量<strong>¥{trip.budgetBreakdown.reserve}</strong></span></div></Card> : null}
                </section>
              ) : null}

              <section className="multi-trip-days">
                {trip.days.map((day) => (
                  <Card key={day.day} className="multi-trip-day" title={<><span>DAY {String(day.day).padStart(2, '0')}</span>{day.theme}</>}>
                    <Timeline items={day.items.map((item) => ({
                      color: item.type === 'activity' ? '#7ea61f' : item.type === 'meal' ? '#ff795e' : '#78b8d8',
                      content: (
                        <div className="multi-trip-item">
                          <Flex justify="space-between" align="start" gap={16} wrap>
                            <div>
                              <Text className="multi-trip-slot">{item.startTime ? `${item.startTime} · ` : ''}{item.timeSlot} · {item.type === 'activity' ? '核心玩法' : item.type === 'meal' ? '餐饮' : item.type === 'nightlife' ? '夜间体验' : item.type === 'hotel' ? '住宿' : '移动'}</Text>
                              <Title level={4}>{item.name}</Title>
                            </div>
                            <Space size={6} wrap>
                              <Tag>{Math.ceil(item.durationMinutes / 60)}小时内</Tag>
                              <Tag>¥{item.budgetYuan}</Tag>
                            </Space>
                          </Flex>
                          <Paragraph>{item.summary}</Paragraph>
                          <Text type="secondary">{item.district} · {item.address}</Text>
                          {item.transportNote ? <div className="multi-trip-transport">移动建议：{item.transportNote}</div> : null}
                          {item.tips.length ? <div className="multi-trip-tip">出发提醒：{item.tips[0]}</div> : null}
                          {item.sourceUrl ? <Button type="link" href={item.sourceUrl} target="_blank">打开地点核对</Button> : null}
                        </div>
                      ),
                    }))} />
                  </Card>
                ))}
              </section>

              <footer className="multi-trip-actions">
                <div>
                  <Text strong>行程已保存在本次浏览器会话</Text>
                  <Paragraph>核心地点全部来自目标城市内容池；餐饮和交通保留为实时选择，不由模型编造。</Paragraph>
                </div>
                <Space wrap>
                  <Button onClick={() => router.replace('/box/config')}>重新配置</Button>
                  <Button type="primary" onClick={() => router.push('/destinations')}>继续查看城市内容</Button>
                </Space>
              </footer>
            </main>
          ) : (
            <main className="multi-trip-empty">
              <Empty image="/media/ui/empty-explorer-duck.png" imageStyle={{ height: 180 }} description="还没有生成多日行程" />
              <Button type="primary" onClick={() => router.replace('/box/config')}>返回配置</Button>
            </main>
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

const css = `
.multi-trip-layout{min-height:100dvh;background:#f5f7ef;color:#1a1b18}.multi-trip-page{width:min(calc(100% - 48px),1180px);margin:0 auto;padding:42px 0 72px}.multi-trip-hero{padding:clamp(34px,5vw,64px);border-radius:34px;color:#fff;background:radial-gradient(circle at 85% 12%,rgba(120,232,255,.18),transparent 28%),radial-gradient(circle at 10% 20%,rgba(201,255,98,.22),transparent 30%),#15151f;box-shadow:0 28px 80px rgba(29,31,24,.2)}.multi-trip-badge.ant-tag{margin:0 0 20px;padding:7px 12px;border-color:rgba(255,255,255,.15);color:#c9ff62;background:rgba(255,255,255,.06);font-weight:900;letter-spacing:.1em}.multi-trip-hero h1.ant-typography{margin:0;color:#fff;font-size:clamp(42px,5vw,72px);letter-spacing:-.05em}.multi-trip-hero p.ant-typography{max-width:760px;margin:18px 0 24px;color:rgba(255,255,255,.68);font-size:17px;line-height:1.7}.multi-trip-hero .ant-tag{padding:7px 12px;border-color:rgba(255,255,255,.12);color:#fff;background:rgba(255,255,255,.07)}.multi-trip-foundation{margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:18px}.multi-trip-foundation-card.ant-card{border-radius:22px}.multi-trip-foundation-card h4.ant-typography{margin:0 0 8px}.multi-trip-budget-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.multi-trip-budget-grid span{padding:12px;border-radius:12px;background:#f4f7ef;color:#697063;font-size:12px;display:flex;flex-direction:column}.multi-trip-budget-grid strong{margin-top:3px;color:#1c2118;font-size:17px}.multi-trip-days{margin-top:28px;display:grid;gap:22px}.multi-trip-day.ant-card{border:1px solid rgba(92,108,68,.13);border-radius:26px;box-shadow:0 16px 44px rgba(46,55,34,.08)}.multi-trip-day .ant-card-head{min-height:72px}.multi-trip-day .ant-card-head-title{display:flex;align-items:center;gap:14px;font-size:21px;font-weight:900}.multi-trip-day .ant-card-head-title span{color:#7ea61f;font:800 11px ui-monospace,monospace;letter-spacing:.1em}.multi-trip-day .ant-card-body{padding:28px}.multi-trip-item{padding:0 0 18px 6px}.multi-trip-slot{color:#7ea61f;font-size:11px;font-weight:900;letter-spacing:.08em}.multi-trip-item h4.ant-typography{margin:5px 0 7px}.multi-trip-item p.ant-typography{margin:0 0 6px;color:#666c60;line-height:1.65}.multi-trip-transport{margin-top:9px;color:#5d6680;font-size:12px;font-weight:700}.multi-trip-tip{margin-top:9px;padding:10px 13px;border-radius:12px;color:#4d6f16;background:#f0f8dd;font-size:12px;font-weight:700}.multi-trip-actions{margin-top:28px;padding:24px 28px;border:1px solid rgba(92,108,68,.12);border-radius:22px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:24px}.multi-trip-actions p.ant-typography{margin:5px 0 0;color:#74796e}.multi-trip-empty{min-height:100dvh;display:grid;place-content:center;gap:20px}.multi-trip-empty .ant-btn{justify-self:center}@media(max-width:720px){.multi-trip-page{width:min(calc(100% - 28px),1180px);padding:18px 0 42px}.multi-trip-hero{padding:30px 22px;border-radius:25px}.multi-trip-hero h1.ant-typography{font-size:40px}.multi-trip-foundation{grid-template-columns:1fr}.multi-trip-budget-grid{grid-template-columns:repeat(2,1fr)}.multi-trip-day .ant-card-body{padding:22px 18px}.multi-trip-actions{align-items:stretch;flex-direction:column}.multi-trip-actions .ant-space,.multi-trip-actions .ant-btn{width:100%}}
`;
