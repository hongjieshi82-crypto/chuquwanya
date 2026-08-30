import { App, Button, Card, Col, Empty, Flex, Form, Input, InputNumber, Modal, Pagination, Row, Select, Space, Spin, Tag, Typography } from 'antd';
import 'antd/dist/reset.css';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getCities } from '@/services/api';
import { getAdminContent, updateAdminContent, type AdminContentItem } from '@/services/content-admin';
import type { City } from '@/types';

const { Paragraph, Text, Title } = Typography;
const PAGE_SIZE = 30;

export default function ContentAdminPage() {
  return <App><ContentAdmin /></App>;
}

function ContentAdmin() {
  const { message } = App.useApp();
  const [cities, setCities] = useState<City[]>([]);
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [cityId, setCityId] = useState<number>();
  const [status, setStatus] = useState('review');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminContentItem | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cityList, content] = await Promise.all([getCities(), getAdminContent({ cityId, status, query: query.trim() || undefined, offset: (page - 1) * PAGE_SIZE })]);
      setCities(cityList); setItems(content.items); setTotal(content.total);
    } catch (error) { message.error(error instanceof Error ? error.message : '加载失败'); }
    finally { setLoading(false); }
  }, [cityId, message, page, query, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const statusCounts = useMemo(() => ({ current: items.length, total }), [items.length, total]);

  const changeStatus = async (item: AdminContentItem, contentStatus: AdminContentItem['contentStatus']) => {
    try { await updateAdminContent(item.id, { contentStatus }); message.success(contentStatus === 'published' ? '已通过并进入推荐池' : contentStatus === 'archived' ? '已下架' : '已退回待审核'); await load(); }
    catch (error) { message.error(error instanceof Error ? error.message : '操作失败'); }
  };

  const openEdit = (item: AdminContentItem) => {
    setEditing(item);
    form.setFieldsValue(item);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try { const values = await form.validateFields(); await updateAdminContent(editing.id, values); message.success('内容已保存并重新评分'); setEditing(null); await load(); }
    catch (error) { if (error instanceof Error) message.error(error.message); }
  };

  return (
    <main className="content-admin-page">
      <style>{css}</style>
      <header className="content-admin-header">
        <div><Text className="admin-eyebrow">LOCAL CONTENT OPS</Text><Title>18城内容审核台</Title><Paragraph>核对真实地点、预算、时长、天气和预约信息。只有本机可以访问。</Paragraph></div>
        <div className="admin-count"><strong>{statusCounts.total}</strong><span>当前筛选内容</span></div>
      </header>

      <Card className="admin-filters">
        <Flex gap={12} wrap>
          <Select allowClear placeholder="全部城市" value={cityId} onChange={(value) => { setCityId(value); setPage(1); }} options={cities.map((city) => ({ label: city.name, value: city.id }))} />
          <Select value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={[{label:'待审核',value:'review'},{label:'已发布',value:'published'},{label:'草稿',value:'draft'},{label:'已下架',value:'archived'},{label:'全部',value:'all'}]} />
          <Input.Search allowClear placeholder="搜索地点、地址或玩法" value={query} onChange={(event) => setQuery(event.target.value)} onSearch={() => { setPage(1); void load(); }} />
        </Flex>
      </Card>

      <Spin spinning={loading}>
        {items.length ? <Row gutter={[18,18]}>{items.map((item) => (
          <Col xs={24} lg={12} xl={8} key={item.id}>
            <Card className="admin-item" cover={item.coverImageUri ? <img src={item.coverImageUri} alt={item.title} /> : undefined}>
              <Flex justify="space-between" gap={12}><Space wrap><Tag>{item.cityName}</Tag><Tag color={item.contentScore >= 80 ? 'green' : item.contentScore >= 70 ? 'gold' : 'red'}>{item.contentScore}分</Tag><Tag>{item.contentStatus}</Tag></Space><Text type="secondary">#{item.id}</Text></Flex>
              <Title level={4}>{item.title}</Title><Paragraph ellipsis={{rows:2}}>{item.summary}</Paragraph>
              <div className="admin-meta"><span>📍 {item.address}</span><span>⏱ {item.durationMinutes}分钟</span><span>💰 ¥{item.budgetYuan}</span><span>天气：{item.rainFriendly === 'yes' ? '雨天友好' : item.rainFriendly === 'no' ? '不适合雨天' : '待核验'}</span></div>
              {item.qualityIssues.length ? <div className="admin-issues">{item.qualityIssues.map((issue) => <Tag key={issue}>{issue}</Tag>)}</div> : null}
              <Flex className="admin-actions" gap={8} wrap><Button onClick={() => openEdit(item)}>编辑</Button>{item.sourceUrl ? <Button href={item.sourceUrl} target="_blank">查看来源</Button> : null}{item.contentStatus !== 'published' ? <Button type="primary" onClick={() => void changeStatus(item,'published')}>通过</Button> : <Button onClick={() => void changeStatus(item,'review')}>退回</Button>}<Button danger onClick={() => void changeStatus(item,'archived')}>下架</Button></Flex>
            </Card>
          </Col>
        ))}</Row> : <Empty description="当前筛选下没有内容" />}
      </Spin>
      <Pagination current={page} pageSize={PAGE_SIZE} total={total} showSizeChanger={false} onChange={setPage} />

      <Modal open={Boolean(editing)} title={editing ? `编辑：${editing.title}` : '编辑内容'} onCancel={() => setEditing(null)} onOk={() => void saveEdit()} width={720} okText="保存并重新评分">
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="玩法标题" rules={[{required:true}]}><Input /></Form.Item>
          <Form.Item name="summary" label="一句话说明" rules={[{required:true}]}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="description" label="详细说明" rules={[{required:true}]}><Input.TextArea rows={4} /></Form.Item>
          <Form.Item name="address" label="地址" rules={[{required:true}]}><Input /></Form.Item>
          <Row gutter={12}><Col span={8}><Form.Item name="durationMinutes" label="时长（分钟）"><InputNumber min={30} step={30} /></Form.Item></Col><Col span={8}><Form.Item name="budgetYuan" label="预算（元）"><InputNumber min={0} /></Form.Item></Col><Col span={8}><Form.Item name="environment" label="环境"><Select options={[{label:'室内',value:'indoor'},{label:'室外',value:'outdoor'},{label:'两者皆可',value:'either'}]} /></Form.Item></Col></Row>
          <Row gutter={12}><Col span={8}><Form.Item name="rainFriendly" label="雨天"><Select options={[{label:'友好',value:'yes'},{label:'不适合',value:'no'},{label:'待核验',value:'unknown'}]} /></Form.Item></Col><Col span={8}><Form.Item name="reservationRequired" label="预约"><Select options={[{label:'需要',value:'yes'},{label:'不需要',value:'no'},{label:'待核验',value:'unknown'}]} /></Form.Item></Col><Col span={8}><Form.Item name="reservationUrl" label="预约链接"><Input /></Form.Item></Col></Row>
          <Form.Item name="weatherNotes" label="天气说明"><Input /></Form.Item>
        </Form>
      </Modal>
    </main>
  );
}

const css = `.content-admin-page{min-height:100dvh;padding:36px clamp(18px,4vw,58px) 72px;background:#f4f7ef;color:#1c2118}.content-admin-header{display:flex;align-items:end;justify-content:space-between;gap:28px;margin:0 auto 24px;max-width:1500px}.admin-eyebrow{color:#6f9821;font:800 11px ui-monospace,monospace;letter-spacing:.12em}.content-admin-header h1.ant-typography{margin:8px 0 4px;font-size:clamp(34px,4vw,56px);letter-spacing:-.05em}.content-admin-header p.ant-typography{margin:0;color:#6d7565}.admin-count{min-width:150px;padding:20px;border-radius:22px;color:#fff;background:#15171a;display:flex;flex-direction:column}.admin-count strong{font-size:34px}.admin-count span{color:#aeb6a6;font-size:12px}.admin-filters.ant-card{max-width:1500px;margin:0 auto 22px;border-radius:20px}.admin-filters .ant-select{min-width:150px}.admin-filters .ant-input-search{width:min(100%,360px)}.content-admin-page>.ant-spin-nested-loading{max-width:1500px;margin:0 auto}.admin-item.ant-card{height:100%;overflow:hidden;border-radius:22px;border-color:rgba(70,91,46,.13)}.admin-item>.ant-card-cover img{height:180px;object-fit:cover}.admin-item h4.ant-typography{margin:14px 0 7px}.admin-item p.ant-typography{min-height:44px;margin:0;color:#6d7565}.admin-meta{margin-top:14px;display:grid;gap:6px;color:#596251;font-size:12px}.admin-issues{margin-top:13px;padding:10px;border-radius:12px;background:#fff7df}.admin-actions{margin-top:17px;padding-top:15px;border-top:1px solid #edf0e8}.content-admin-page>.ant-pagination{max-width:1500px;margin:28px auto 0}.ant-input-number{width:100%}@media(max-width:720px){.content-admin-header{align-items:stretch;flex-direction:column}.admin-count{width:100%}.content-admin-page{padding-inline:14px}.admin-filters .ant-select,.admin-filters .ant-input-search{width:100%}}`;
