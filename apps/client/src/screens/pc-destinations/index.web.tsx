import {
  EnvironmentOutlined,
  GiftOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Result,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useApp } from '@/contexts/app-context';
import { savePendingPcBoxDraw } from '@/lib/pc-box-open-state';
import { getDestinationDetail, getDestinations } from '@/services/travel-api';
import { palette } from '@/theme';
import type { Destination, DestinationDetail } from '@/types/travel';
import type { Preferences } from '@/types';

const { Paragraph, Text, Title } = Typography;

const initialVisibleCount = 18;
const cityCardAssetByName: Record<string, string> = {
  北京: 'beijing', 上海: 'shanghai', 杭州: 'hangzhou', 深圳: 'shenzhen', 青岛: 'qingdao', 南京: 'nanjing',
  武汉: 'wuhan', 成都: 'chengdu', 西安: 'xian', 长沙: 'changsha', 重庆: 'chongqing', 厦门: 'xiamen',
  天津: 'tianjin', 烟台: 'yantai', 广州: 'guangzhou', 合肥: 'hefei', 济南: 'jinan', 昆明: 'kunming',
};

type DestinationItem = DestinationDetail & {
  cityName: string;
  categoryName: string;
  normalizedTags: string[];
};

function getErrorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : '目的地暂时加载失败，请稍后重试。';
}

function isHot(item: Destination) {
  const value = item.isHot as unknown;
  return value === true || value === 1 || value === '1';
}

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase() ?? '';
}

function getCategoryName(item: DestinationDetail) {
  return item.category?.trim() || item.type?.trim() || (isHot(item) ? '热门目的地' : '城市漫游');
}

function getDuration(item: DestinationItem) {
  const value = item.suitableDays ?? item.duration;
  if (typeof value === 'number') return `${value} 天`;
  if (typeof value === 'string' && value.trim()) return value.includes('天') ? value : `${value} 天`;
  return '当天 / 1-2 天';
}

function buildDestinationItem(
  base: Destination,
  detail: DestinationDetail | null,
  cityName: string,
): DestinationItem {
  const item = detail ?? base;
  const tags = Array.from(new Set((item.tags ?? []).map((tag) => tag.trim()).filter(Boolean)));
  return {
    ...base,
    ...item,
    coverImageUri: item.coverImageUri?.trim() || base.coverImageUri,
    cityName: item.city?.trim() || cityName || base.province || '暂未标注城市',
    categoryName: getCategoryName(item),
    normalizedTags: tags,
  };
}

function DestinationCover({ item, className }: { item: DestinationItem; className?: string }) {
  const [isBroken, setIsBroken] = useState(false);
  const src = item.coverImageUri?.trim();

  if (!src || isBroken) {
    return (
      <div className={["pc-destinations-cover-placeholder", className].filter(Boolean).join(' ')}>
        <EnvironmentOutlined />
        <span>暂无图片</span>
      </div>
    );
  }

  return <img className={className} src={src} alt={item.name} loading="lazy" decoding="async" onError={() => setIsBroken(true)} />;
}

export default function PcDestinationsScreen() {
  const router = useRouter();
  const { destinationId } = useLocalSearchParams<{ destinationId?: string }>();
  const { cities } = useApp();
  const [items, setItems] = useState<DestinationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [selected, setSelected] = useState<DestinationItem | null>(null);
  const [isExplorePreview, setIsExplorePreview] = useState(false);
  const appliedDestinationParamRef = useRef<number | null>(null);

  const cityNameById = useMemo(
    () => new Map(cities.map((city) => [city.id, city.name])),
    [cities],
  );

  const loadDestinations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const destinations = await getDestinations();
      const details = await Promise.all(
        destinations.map(async (destination) => {
          try {
            return await getDestinationDetail(destination.id);
          } catch {
            return null;
          }
        }),
      );
      setItems(
        destinations.map((destination, index) =>
          buildDestinationItem(
            destination,
            details[index],
            destination.cityId ? cityNameById.get(destination.cityId) ?? '' : '',
          ),
        ),
      );
    } catch (reason) {
      setItems([]);
      setError(getErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [cityNameById]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadDestinations();
    }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadDestinations]);

  useEffect(() => {
    const parsedId = Number(destinationId);
    if (!Number.isFinite(parsedId) || parsedId <= 0 || appliedDestinationParamRef.current === parsedId) {
      return;
    }

    const matched = items.find((item) => item.id === parsedId);
    if (!matched) return;

    const openTimer = window.setTimeout(() => {
      appliedDestinationParamRef.current = parsedId;
      setSelected(matched);
    }, 0);
    return () => window.clearTimeout(openTimer);
  }, [destinationId, items]);

  const filteredItems = useMemo(() => {
    const keyword = normalizeText(search);
    const result = items.filter((item) => {
      const searchSource = [
        item.name,
        item.cityName,
        item.province,
        item.categoryName,
        item.summary,
        item.description,
        ...item.normalizedTags,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();
      return !keyword || searchSource.includes(keyword);
    });

    if (!keyword) {
      const hot = result.filter(isHot).sort((left, right) => {
        const score = (value: number) => ((value * 9301 + 49297) % 233280) / 233280;
        return score(left.id) - score(right.id);
      });
      const regular = result.filter((item) => !isHot(item));
      return [...hot, ...regular];
    }
    return result;
  }, [items, search]);

  const resultItems = filteredItems;
  const visibleItems = resultItems.slice(0, visibleCount);
  const resetFilters = () => {
    setSearch('');
    setVisibleCount(initialVisibleCount);
  };

  const generateBlindBox = () => {
    if (!selected) return;
    const city = cities.find((item) => item.id === selected.cityId) ?? cities[0];
    if (!city) return;
    const preferences: Preferences = {
      partySize: 1,
      durationMinutes: null,
      budgetMax: 300,
      mood: '放松',
      randomLevel: 35,
      category: '不限',
      environment: 'either',
      radiusKm: 10,
      originName: city.name,
      originLatitude: null,
      originLongitude: null,
      originAccuracyMeters: null,
      originSource: null,
      destinationScope: 'nearby',
      travelDuration: 'same-day',
      destinationScopeLabel: `${city.name}本地`,
    };
    savePendingPcBoxDraw({
      cityId: city.id,
      preferences,
      summary: `目的地：${selected.name} · ${selected.cityName}`,
      destinationId: selected.id,
      destinationName: selected.name,
    });
    setSelected(null);
    router.push('/box/config');
  };

  return (
    <main className="pc-destinations-page">
      <style>{pcDestinationsCss}</style>
      <section className="pc-destinations-search" aria-label="目的地搜索">
        <Input
          allowClear
          placeholder="搜索目的地、城市或主题"
          size="large"
          value={search}
          onChange={(event) => {
            setVisibleCount(initialVisibleCount);
            setSearch(event.target.value);
          }}
        />
        <Button className="pc-destinations-search-button" icon={<SearchOutlined />} aria-label="搜索目的地">搜索</Button>
      </section>

      <section className="pc-destinations-layout">
        <section className="pc-destinations-content">
          {loading ? (
            <div className="pc-destinations-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="pc-destinations-skeleton"><Skeleton active /></Card>
              ))}
            </div>
          ) : error ? (
            <Result status="error" title="目的地加载失败" subTitle={error} extra={<Button type="primary" onClick={() => void loadDestinations()}>重新加载</Button>} />
          ) : visibleItems.length ? (
            <>
              <div className="pc-destinations-grid">
                {visibleItems.map((item, index) => (
                  <Card key={item.id} hoverable className={`pc-destinations-card pc-destinations-card-layout-${index % 3}`} onClick={() => { setIsExplorePreview(false); setSelected(item); }}>
                    {cityCardAssetByName[item.name] ? <img className="pc-city-card-artwork" src={`/media/cards/cities/${cityCardAssetByName[item.name]}.png?v=city-master-6`} alt={`${item.name}·${item.categoryName}`} /> : <DestinationCover item={item} className="pc-city-card-artwork" />}
                    <button className="pc-city-card-explore-hitarea" type="button" aria-label={`立刻探索${item.name}`} onClick={(event) => { event.stopPropagation(); setIsExplorePreview(true); setSelected(item); }} />
                  </Card>
                ))}
              </div>
              {visibleCount < resultItems.length ? <div className="pc-destinations-more"><Button type="primary" shape="round" onClick={() => setVisibleCount((count) => count + initialVisibleCount)}>查看更多目的地</Button></div> : null}
            </>
          ) : (
            <Empty image="/media/ui/empty-explorer-duck.png" imageStyle={{ height: 180 }} description={<span><strong>没有找到匹配的目的地</strong><br />试试其他搜索关键词或调整筛选条件</span>}>
              <Button size="large" onClick={resetFilters}>重置筛选</Button>
            </Empty>
          )}
        </section>
      </section>

      <Modal
        className="pc-destinations-modal"
        footer={[
          <Button key="close" onClick={() => setSelected(null)}>关闭</Button>,
          <Button key="box" type="primary" icon={<GiftOutlined />} onClick={generateBlindBox}>{isExplorePreview ? `去抽${selected?.cityName ?? ''}玩法` : '生成盲盒'}</Button>,
        ]}
        open={Boolean(selected)}
        title={null}
        width={720}
        onCancel={() => setSelected(null)}>
        {selected && isExplorePreview ? (
          <div className="pc-city-explore-preview">
            <div className="pc-city-explore-cover"><DestinationCover item={selected} className="pc-destinations-cover-image" /></div>
            <div className="pc-city-explore-content">
              <Tag>{selected.cityName.toUpperCase()} LOCAL DROP</Tag>
              <Title level={2}>这次，只探索{selected.cityName}</Title>
              <Paragraph>系统会锁定{selected.cityName}，根据你的时间、预算和心情，抽出一条当地可执行的周末玩法。</Paragraph>
              <div className="pc-city-explore-facts"><span><small>目的地</small><strong>{selected.cityName}</strong></span><span><small>抽取范围</small><strong>当地玩法</strong></span><span><small>可调整</small><strong>时间 · 预算 · 心情</strong></span></div>
            </div>
          </div>
        ) : selected ? (
          <div className="pc-destinations-detail">
            <div className="pc-destinations-detail-cover"><DestinationCover item={selected} className="pc-destinations-cover-image" /></div>
            <div className="pc-destinations-detail-content">
              <Tag color="blue">{selected.categoryName}</Tag>
              <Title level={2}>{selected.name}</Title>
              <Paragraph>{selected.description || selected.summary || '暂无目的地介绍。'}</Paragraph>
              <div className="pc-destinations-detail-stats">
                <div><small>适合天数</small><strong>{getDuration(selected)}</strong></div>
                <div><small>最佳季节</small><strong>{selected.bestSeason || '四季皆宜'}</strong></div>
                <div><small>难度指数</small><strong>{selected.difficulty ?? '—'}</strong></div>
                <div><small>松弛指数</small><strong>{selected.relaxation ?? '—'}</strong></div>
              </div>
              <Space size={[8, 8]} wrap>{selected.normalizedTags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space>
              {selected.tips?.length ? <div className="pc-destinations-tips"><Text strong><WarningOutlined /> 出行提示</Text><ul>{selected.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul></div> : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </main>
  );
}

const pcDestinationsCss = `
.pc-destinations-page { min-height: calc(100dvh - 76px); padding: 54px 32px 80px; color: #f7f7f2; background: radial-gradient(circle at 10% 5%, rgba(167,214,69,.14), transparent 28%), radial-gradient(circle at 92% 16%, rgba(68,164,255,.15), transparent 30%), linear-gradient(145deg,#111419,#101018 52%,#111712); background-attachment: fixed; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; }
.pc-destinations-page::before { content: ''; position: fixed; inset: 0; pointer-events: none; opacity: .2; background-image: radial-gradient(rgba(255,255,255,.28) .7px, transparent .7px); background-size: 18px 18px; mask-image: linear-gradient(to bottom,black,transparent 68%); }
.pc-destinations-page > * { position: relative; z-index: 1; }
.pc-destinations-hero { max-width: 1440px; margin: 0 auto 36px; display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; }
.pc-destinations-hero h1.ant-typography { margin: 0; color: #f7f7f2; font-size: clamp(38px,4vw,60px); font-weight: 900; line-height: 1.22; letter-spacing: .035em; }
.pc-destinations-hero > .ant-typography { padding-bottom: 7px; color: rgba(255,255,255,.62); font-size: 15px; line-height: 1.7; }
.pc-destinations-search { max-width: 1440px; margin: 0 auto 28px; padding-top: 0; }
.pc-destinations-search .ant-input-group-wrapper { height: 56px; }
.pc-destinations-search .ant-input-affix-wrapper { min-height: 56px; padding-left: 20px; border-color: rgba(255,255,255,.12); border-radius: 18px 0 0 18px; color: #fff; background: rgba(255,255,255,.055); box-shadow: inset 0 1px 0 rgba(255,255,255,.04); backdrop-filter: blur(18px); }.pc-destinations-search .ant-input-affix-wrapper:focus-within { border-color: rgba(201,255,98,.48); box-shadow: 0 0 0 3px rgba(201,255,98,.08); }.pc-destinations-search input { color: #fff; background: transparent; font-size: 15px; }.pc-destinations-search input::placeholder { color: rgba(255,255,255,.36); }.pc-destinations-search .ant-btn { width: 68px; min-height: 56px; border: 0; border-radius: 0 18px 18px 0 !important; color: #10130d; background: #c9ff62; box-shadow: none; }.pc-destinations-search .ant-btn:hover { color: #10130d !important; background: #dcff9b !important; }
.pc-destinations-layout { max-width: 1440px; margin: 0 auto; display: block; }
.pc-destinations-filters { margin-bottom: 28px; border: 1px solid rgba(225,231,217,.96); border-radius: 20px; background: rgba(251,252,248,.98); box-shadow: 0 16px 38px rgba(0,0,0,.17); }
.pc-destinations-filters .ant-card-body { padding: 20px; }
.pc-destinations-filters .ant-segmented { padding: 4px; border-radius: 999px; background: #edf1e9; }.pc-destinations-filters .ant-segmented-item { color: #59615a; border-radius: 999px; font-size: 14px; }.pc-destinations-filters .ant-segmented-item-selected { color: #10130d; background: #c9ff62; box-shadow: none; }
.pc-destinations-city-row { display: flex; align-items: flex-start; gap: 18px; margin-top: 18px; padding-top: 18px; border-top: 1px solid #e2e7dd; }.pc-destinations-city-row > .ant-typography { flex: 0 0 auto; padding-top: 5px; color: #606861; font-size: 14px; font-weight: 800; }.pc-destinations-city-row > div { display: flex; flex-wrap: wrap; gap: 8px; }.pc-destinations-city-row .ant-tag { margin: 0; padding: 5px 13px; border: 1px solid #dbe2d6; border-radius: 999px; color: #59615a; background: #f1f4ed; font-size: 14px; }.pc-destinations-city-row .ant-tag-checkable-checked { color: #10130d; border-color: #9ccc43; background: #c9ff62; font-weight: 800; }
.pc-destinations-tag-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
.pc-destinations-tag-row .ant-tag { margin: 0; padding: 5px 13px; border: 1px solid #dbe2d6; border-radius: 999px; color: #59615a; background: #f1f4ed; font-size: 14px; }
.pc-destinations-tag-row .ant-tag-checkable-checked { color: #111419; border-color: #9ccc43; background: #c9ff62; }
.pc-destinations-filter-label { display: inline-flex; align-items: center; gap: 7px; white-space: nowrap; }
.pc-destinations-filter-label small {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  color: #777184;
  background: rgba(98,87,150,.09);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}
.pc-destinations-tag-row .ant-tag-checkable-checked small { color: #fff; background: ${palette.primary}; }
.pc-destinations-filter-hint.ant-typography {
  display: block;
  margin-top: 13px;
  color: rgba(255,255,255,.42);
  font-size: 12px;
  line-height: 1.6;
}
.pc-destinations-relaxed-note {
  margin: -6px 0 22px;
  padding: 14px 17px;
  border: 1px solid rgba(126,166,31,.16);
  border-radius: 14px;
  color: #6f687f;
  background: linear-gradient(90deg, rgba(126,166,31,.08), rgba(120,232,255,.06));
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}
.pc-destinations-relaxed-note strong { color: #5646c6; }
.pc-destinations-results-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.pc-destinations-results-heading h2 { margin: 0; color: #fff; font-size: 28px; }.pc-destinations-results-heading .ant-typography { color: rgba(255,255,255,.45); }
.pc-destinations-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.pc-destinations-card.ant-card { overflow: hidden; border: 1px solid rgba(225,231,217,.96); border-radius: 22px; color: #171c18; background: #fbfcf8; box-shadow: 0 18px 42px rgba(0,0,0,.2); transition: transform .32s cubic-bezier(.2,.8,.2,1), box-shadow .32s ease, border-color .32s ease; animation: destination-card-in .55s both; }
.pc-destinations-card.ant-card:nth-child(3n+2) { animation-delay: .07s; }.pc-destinations-card.ant-card:nth-child(3n) { animation-delay: .14s; }
.pc-destinations-card.ant-card:hover { transform: translateY(-8px) rotate(.35deg); border-color: rgba(201,255,98,.4); box-shadow: 0 26px 58px rgba(0,0,0,.34); }
.pc-destinations-card .ant-card-body { padding: 0; }.pc-destinations-card-cover { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: #EEF2F7; }
.pc-destinations-cover-image, .pc-destinations-cover-placeholder { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; object-fit: cover; color: #9CA3AF; background: #EEF2F7; transition: transform .28s ease; }
.pc-destinations-cover-placeholder { flex-direction: column; gap: 6px; font-size: 12px; }.pc-destinations-card:hover .pc-destinations-cover-image, .pc-destinations-card:hover .pc-destinations-cover-placeholder { transform: scale(1.05); }
.pc-destinations-category { position: absolute; top: 12px; left: 12px; margin: 0; border: 0; color: #1D4ED8; background: rgba(255,255,255,.92); }
.pc-destinations-cover-tags { position: absolute; top: 10px; right: 10px; display: flex; gap: 4px; }.pc-destinations-cover-tags .ant-tag { margin: 0; border: 0; color: #fff; background: rgba(15,23,42,.56); }
.pc-destinations-rating { position: absolute; right: 12px; bottom: 10px; color: #fff; font-size: 13px; font-weight: 700; text-shadow: 0 1px 3px rgba(0,0,0,.42); }.pc-destinations-rating svg { color: #FBBF24; }
.pc-destinations-card-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 7px; color: white; font-weight: 600; opacity: 0; background: rgba(15,23,42,.38); transition: opacity .24s ease; }.pc-destinations-card:hover .pc-destinations-card-overlay { opacity: 1; }
.pc-destinations-card-body { padding: 22px 22px 23px; }.pc-destinations-card-body h4 { margin: 0 0 9px; color: #171c18; font-size: 21px; font-weight: 900; letter-spacing: .01em; }.pc-destinations-card-body p { min-height: 50px; margin: 0 0 17px; color: #626a63; font-size: 15px; line-height: 1.7; }
.pc-destinations-meta { display: flex; justify-content: space-between; gap: 8px; color: #59615a; font-size: 13px; font-weight: 650; }.pc-destinations-meta span { display: inline-flex; align-items: center; gap: 5px; }.pc-destinations-meta svg { color: #6f9821; }
.pc-destinations-more { display: flex; justify-content: center; padding-top: 32px; }.pc-destinations-more .ant-btn { min-width: 164px; }
.pc-destinations-skeleton .ant-card-body { min-height: 260px; padding-top: 26px; }
.pc-destinations-content > .ant-empty { padding: 70px 24px; border: 1px dashed rgba(201,255,98,.25); border-radius: 22px; color: rgba(255,255,255,.58); background: rgba(255,255,255,.035); }.pc-destinations-content > .ant-empty .ant-empty-description { color: rgba(255,255,255,.58); }
.pc-destinations-modal .ant-modal-content { overflow: hidden; padding: 0; border-radius: 16px; }.pc-destinations-modal .ant-modal-close { z-index: 2; color: #fff; }.pc-destinations-modal .ant-modal-footer { padding: 12px 24px 18px; margin: 0; }
.pc-destinations-detail-cover { height: 240px; overflow: hidden; background: #EEF2F7; }.pc-destinations-detail-content { padding: 22px 24px 6px; }.pc-destinations-detail-content h2 { margin: 10px 0 8px; }.pc-destinations-detail-content > p { color: #4B5563; line-height: 1.7; }
.pc-destinations-detail-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 20px 0; }.pc-destinations-detail-stats div { display: flex; flex-direction: column; gap: 5px; padding: 12px; border-radius: 10px; background: #F8FAFC; }.pc-destinations-detail-stats small { color: #6B7280; }.pc-destinations-detail-stats strong { font-size: 14px; }.pc-destinations-tips { margin-top: 18px; padding: 12px; border-radius: 10px; color: #854D0E; background: #FFFBEB; }.pc-destinations-tips ul { margin: 8px 0 0; padding-left: 18px; }
@media (max-width: 1439px) { .pc-destinations-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 1023px) { .pc-destinations-page { padding-inline: 20px; } }
@keyframes destination-card-in { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
@media (max-width: 767px) { .pc-destinations-page { padding: 30px 16px 48px; }.pc-destinations-hero { align-items: flex-start; flex-direction: column; }.pc-destinations-hero h1.ant-typography { font-size: 36px; }.pc-destinations-search { margin-bottom: 24px; }.pc-destinations-grid { grid-template-columns: 1fr; gap: 16px; }.pc-destinations-detail-stats { grid-template-columns: repeat(2, 1fr); }.pc-destinations-results-heading h2 { font-size: 21px; } }
@media (prefers-reduced-motion: reduce) { .pc-destinations-card.ant-card, .pc-destinations-cover-image, .pc-destinations-cover-placeholder, .pc-destinations-card-overlay { transition: none; }.pc-destinations-card.ant-card:hover { transform: none; }.pc-destinations-card:hover .pc-destinations-cover-image, .pc-destinations-card:hover .pc-destinations-cover-placeholder { transform: none; } }

/* Dark visual explorer shared with the landing page and trip archive. */
.pc-destinations-page { padding-top: 66px; }
.pc-destinations-hero { margin-bottom: 32px; }
.pc-destinations-hero h1.ant-typography { font-size: clamp(54px,5.2vw,86px); font-weight: 850; line-height: 1.02; letter-spacing: -.055em; }
.pc-destinations-hero h1.ant-typography::after { content: ''; display: block; width: 54px; height: 4px; margin-top: 22px; border-radius: 4px; background: #c9ff62; box-shadow: 0 0 18px rgba(201,255,98,.22); }
.pc-destinations-search { max-width: 820px; margin: 0 auto 44px  max(0px,calc((100% - 1440px)/2)); }
.pc-destinations-results-heading { align-items: flex-end; margin-bottom: 22px; }
.pc-destinations-results-heading h2 { font-size: 34px; font-weight: 850; letter-spacing: -.035em; }
.pc-destinations-grid { gap: 18px; }
.pc-destinations-card.ant-card { border: 1px solid rgba(255,255,255,.15); border-radius: 24px; color: #f7f7f2; background: #090a0c; box-shadow: 0 18px 46px rgba(0,0,0,.22); }
.pc-destinations-card.ant-card:hover { transform: translateY(-7px); border-color: #c9ff62; box-shadow: 0 0 0 1px rgba(201,255,98,.16),0 28px 62px rgba(0,0,0,.4),0 0 30px rgba(201,255,98,.1); }
.pc-destinations-card-cover { aspect-ratio: 16 / 11; background: #15171a; }
.pc-destinations-cover-image, .pc-destinations-cover-placeholder { color: rgba(255,255,255,.4); background: #15171a; }
.pc-destinations-category { padding: 5px 11px; border: 1px solid rgba(201,255,98,.45); border-radius: 999px; color: #c9ff62; background: rgba(8,10,10,.72); backdrop-filter: blur(10px); }
.pc-destinations-cover-tags .ant-tag { padding: 4px 9px; border: 1px solid rgba(255,255,255,.15); border-radius: 999px; background: rgba(8,10,12,.64); backdrop-filter: blur(10px); }
.pc-destinations-card-overlay { color: #11150d; background: rgba(201,255,98,.86); font-size: 15px; font-weight: 850; }
.pc-destinations-card-body { padding: 24px 24px 25px; }
.pc-destinations-card-body h4 { color: #f7f7f2; font-size: 25px; letter-spacing: -.025em; }
.pc-destinations-card-body p { color: rgba(255,255,255,.5); }
.pc-destinations-meta { color: rgba(255,255,255,.62); }
.pc-destinations-meta svg { color: #c9ff62; }
.pc-destinations-more .ant-btn { height: 50px; padding-inline: 24px; border: 0; color: #11150d; background: #c9ff62; font-weight: 850; }
.pc-destinations-modal .ant-modal-content { color: #f7f7f2; border: 1px solid rgba(255,255,255,.15); border-radius: 24px; background: #0b0c0e; }
.pc-destinations-modal .ant-modal-footer { border-color: rgba(255,255,255,.1); }
.pc-destinations-detail-content h2 { color: #fff; }
.pc-destinations-detail-content > p { color: rgba(255,255,255,.56); }
.pc-destinations-detail-stats div { border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04); }
.pc-destinations-detail-stats small { color: rgba(255,255,255,.38); }
.pc-destinations-detail-stats strong { color: #fff; }
.pc-destinations-card-overlay { gap: 11px; font-size: 21px; font-weight: 900; }
.pc-destinations-card-overlay svg { width: 23px; height: 23px; }
.pc-destinations-card-title-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.pc-destinations-card-title-row h4 { min-width: 0; margin-bottom: 9px; }
.pc-destinations-explore.ant-btn { flex: 0 0 auto; height: 36px; padding-inline: 13px; border: 1px solid rgba(201,255,98,.36); border-radius: 999px; color: #c9ff62; background: rgba(201,255,98,.055); font-size: 13px; font-weight: 900; }
.pc-destinations-explore.ant-btn:hover { color: #11150d !important; border-color: #c9ff62 !important; background: #c9ff62 !important; }
.pc-city-explore-preview { overflow: hidden; color: #f7f7f2; background: #0b0c0e; }
.pc-city-explore-cover { height: 280px; overflow: hidden; }
.pc-city-explore-content { padding: 30px 32px 12px; }
.pc-city-explore-content > .ant-tag { margin: 0 0 18px; padding: 6px 11px; border-color: rgba(201,255,98,.35); border-radius: 999px; color: #c9ff62; background: rgba(201,255,98,.06); font: 800 10px/1 ui-monospace,monospace; letter-spacing: .1em; }
.pc-city-explore-content h2.ant-typography { margin: 0; color: #fff; font-size: 38px; letter-spacing: -.045em; }
.pc-city-explore-content p.ant-typography { margin: 16px 0 24px; color: rgba(255,255,255,.54); font-size: 15px; line-height: 1.7; }
.pc-city-explore-facts { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 10px; }
.pc-city-explore-facts span { min-width: 0; padding: 15px 16px; border: 1px solid rgba(255,255,255,.1); border-radius: 14px; background: rgba(255,255,255,.035); }
.pc-city-explore-facts small { display: block; margin-bottom: 7px; color: rgba(255,255,255,.35); font-size: 11px; }
.pc-city-explore-facts strong { display: block; overflow: hidden; color: #fff; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.pc-destinations-modal .ant-modal-footer .ant-btn-primary { border: 0; color: #11150d; background: #c9ff62; font-weight: 850; }
.pc-destinations-modal .ant-modal-footer .ant-btn-primary:hover { color: #11150d !important; background: #dcff9b !important; }

@media (max-width: 767px) {
  .pc-destinations-page { padding-top: 38px; }
  .pc-destinations-hero h1.ant-typography { font-size: 44px; }
  .pc-destinations-search { max-width: none; margin-bottom: 30px; }
  .pc-city-explore-facts { grid-template-columns: 1fr; }
}

/* Shared first-level page frame: aligned to the landing page's 7.4vw content edge. */
.pc-destinations-page { padding: 64px 7.4vw 96px; }
.pc-destinations-hero, .pc-destinations-layout { width: 100%; max-width: none; }
.pc-destinations-search { width: min(820px,100%); max-width: none; margin: 0 0 44px; }

/* Full-width search and editorial destination cards. */
.pc-destinations-search { width: 100%; display: flex; align-items: center; gap: 14px; }
.pc-destinations-search > .ant-input-affix-wrapper { flex: 1 1 auto; width: auto; min-height: 62px; padding: 0 22px; border: 1px solid rgba(255,255,255,.14); border-radius: 18px; color: #fff; background: rgba(255,255,255,.045); box-shadow: inset 0 1px rgba(255,255,255,.035); }
.pc-destinations-search > .ant-input-affix-wrapper:hover,.pc-destinations-search > .ant-input-affix-wrapper:focus-within { border-color: rgba(201,255,98,.68); background: rgba(201,255,98,.045); box-shadow: 0 0 0 3px rgba(201,255,98,.07); }
.pc-destinations-search .ant-input { color: #fff; background: transparent; font-size: 16px; }
.pc-destinations-search .ant-input::placeholder { color: rgba(255,255,255,.35); }
.pc-destinations-search .pc-destinations-search-button.ant-btn { flex: 0 0 auto; min-width: 148px; width: auto; height: 62px; padding: 0 27px; border: 0; border-radius: 18px !important; color: #11150d; background: #c9ff62; box-shadow: 0 10px 30px rgba(201,255,98,.2); font-size: 18px; font-weight: 950; }
.pc-destinations-search .pc-destinations-search-button.ant-btn .anticon { margin-right: 3px; font-size: 21px; stroke-width: 1.5; }
.pc-destinations-search .pc-destinations-search-button.ant-btn:hover { color: #11150d !important; background: #dcff9b !important; box-shadow: 0 12px 34px rgba(201,255,98,.28); transform: translateY(-1px); }
.pc-destinations-grid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 20px; }
.pc-destinations-card.ant-card { min-height: 310px; }
.pc-destinations-card .ant-card-body { min-height: 310px; display: grid; grid-template-columns: minmax(230px,.9fr) minmax(0,1.1fr); }
.pc-destinations-card-cover { height: 100%; min-height: 310px; aspect-ratio: auto; }
.pc-destinations-card-cover::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(90deg,transparent 62%,rgba(9,10,12,.32)); }
.pc-destinations-card-body { position: relative; min-width: 0; padding: 30px 30px 82px; display: flex; flex-direction: column; justify-content: center; }
.pc-destinations-card-title-row { display: block; }
.pc-destinations-card-title-row h4.ant-typography { margin: 0 0 14px; color: #fff; font-size: clamp(27px,2vw,38px); line-height: 1.05; letter-spacing: -.045em; }
.pc-destinations-card-body p.ant-typography { min-height: 0; margin: 0; color: rgba(255,255,255,.55); font-size: 14px; line-height: 1.72; }
.pc-destinations-explore.ant-btn { position: absolute; left: 30px; bottom: 26px; min-width: 126px; height: 42px; padding-inline: 17px; font-size: 14px; }
.pc-destinations-rating { z-index: 2; }
.pc-destinations-category,.pc-destinations-cover-tags { z-index: 2; }

@media (max-width: 1180px) {
  .pc-destinations-grid { grid-template-columns: 1fr; }
  .pc-destinations-card .ant-card-body { grid-template-columns: minmax(280px,.82fr) minmax(0,1.18fr); }
}

@media (max-width: 700px) {
  .pc-destinations-search { gap: 9px; }
  .pc-destinations-search > .ant-input-affix-wrapper { min-height: 54px; padding-inline: 16px; border-radius: 15px; }
  .pc-destinations-search .pc-destinations-search-button.ant-btn { min-width: 58px; width: 58px; height: 52px; padding: 0; border-radius: 15px !important; font-size: 0; }
  .pc-destinations-search .pc-destinations-search-button.ant-btn .anticon { margin: 0; font-size: 20px; }
  .pc-destinations-card.ant-card { min-height: 0; }
  .pc-destinations-card .ant-card-body { min-height: 0; display: block; }
  .pc-destinations-card-cover { min-height: 0; aspect-ratio: 16 / 10; }
  .pc-destinations-card-cover::after { background: linear-gradient(180deg,transparent 65%,rgba(9,10,12,.3)); }
  .pc-destinations-card-body { padding: 23px 22px 76px; }
  .pc-destinations-card-title-row h4.ant-typography { font-size: 28px; }
  .pc-destinations-explore.ant-btn { left: 22px; bottom: 22px; }
}

/* Keep destination cards visual-first: image above, concise information below. */
.pc-destinations-grid { grid-template-columns: repeat(3,minmax(0,1fr)); gap: 20px; }
.pc-destinations-card.ant-card { min-height: 0; }
.pc-destinations-card .ant-card-body { min-height: 0; display: block; }
.pc-destinations-card-cover { height: auto; min-height: 0; aspect-ratio: 16 / 10; }
.pc-destinations-card-cover::after { background: linear-gradient(180deg,transparent 64%,rgba(9,10,12,.34)); }
.pc-destinations-card-body { min-height: 154px; padding: 23px 24px 24px; display: block; }
.pc-destinations-card-title-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.pc-destinations-card-title-row h4.ant-typography { margin: 0; color: #fff; font-size: clamp(24px,1.8vw,32px); line-height: 1.08; }
.pc-destinations-card-body p.ant-typography { min-height: 48px; margin: 14px 0 0; color: rgba(255,255,255,.58) !important; font-size: 14px; line-height: 1.65; }
.pc-destinations-explore.ant-btn { position: static; min-width: 126px; height: 40px; padding-inline: 16px; }

@media (max-width: 1280px) {
  .pc-destinations-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
}

@media (max-width: 700px) {
  .pc-destinations-grid { grid-template-columns: 1fr; }
  .pc-destinations-card-cover { aspect-ratio: 16 / 10; }
  .pc-destinations-card-body { min-height: 0; padding: 21px 20px 22px; }
  .pc-destinations-card-title-row h4.ant-typography { font-size: 27px; }
}

@media (max-width: 1023px) { .pc-destinations-page { padding: 52px 6vw 80px; } }
@media (max-width: 767px) { .pc-destinations-page { padding: 34px 16px 56px; } }

/* Unified interactive-card hover. */
.pc-destinations-card.ant-card { transition: transform .34s cubic-bezier(.2,.8,.2,1),border-color .28s ease,box-shadow .34s ease; }
.pc-destinations-card.ant-card:hover { transform: translateY(-6px) scale(1.012); border: 2px solid #c9ff62; box-shadow: 0 0 0 1px rgba(201,255,98,.18),0 26px 62px rgba(0,0,0,.42),0 0 30px rgba(201,255,98,.13); }

/* Editorial city-card family: three repeatable layouts for the 18-city collection. */
.pc-destinations-grid { gap: 22px; }
.pc-destinations-card.ant-card {
  isolation: isolate;
  overflow: hidden;
  min-height: 430px;
  border-color: rgba(255,255,255,.14);
  background:
    radial-gradient(circle,rgba(201,255,98,.12) 0 1px,transparent 1.2px) right 20px bottom 18px/13px 13px no-repeat,
    linear-gradient(145deg,#101216,#080a0c 72%);
}
.pc-destinations-card .ant-card-body { position: relative; height: 100%; min-height: 430px; padding: 0; }
.pc-destinations-card .ant-card-body::after { content: ''; position: absolute; z-index: 3; left: 23px; bottom: 82px; width: 62px; height: 5px; background: #c9ff62; transform: rotate(-3deg); box-shadow: 18px 4px 0 -1px rgba(201,255,98,.2); }
.pc-destinations-card-cover { position: absolute; z-index: 1; top: 18px; right: 18px; width: 72%; height: 61%; aspect-ratio: auto; overflow: hidden; border: 1px solid rgba(255,255,255,.12); border-radius: 18px 18px 8px 18px; transform: rotate(.7deg); transform-origin: center; }
.pc-destinations-card-cover::after { background: linear-gradient(180deg,transparent 54%,rgba(7,9,10,.66)); }
.pc-destinations-cover-image,.pc-destinations-cover-placeholder { transition: transform .7s cubic-bezier(.2,.8,.2,1),filter .45s ease; }
.pc-destinations-card:hover .pc-destinations-cover-image { transform: scale(1.065); filter: saturate(1.05) contrast(1.04); }
.pc-destinations-index { position: absolute; z-index: 4; top: 14px; left: 14px; display: grid; place-items: center; min-width: 38px; height: 30px; padding: 0 8px; border-radius: 4px; color: #10150c; background: #c9ff62; box-shadow: 5px 5px 0 rgba(201,255,98,.12); font: 900 12px/1 ui-monospace,monospace; letter-spacing: .08em; }
.pc-destinations-category { top: 14px; left: 62px; max-width: calc(100% - 150px); overflow: hidden; border: 0; border-radius: 4px; color: #10150c; background: #c9ff62; box-shadow: 5px 5px 0 rgba(201,255,98,.1); font-weight: 900; text-overflow: ellipsis; white-space: nowrap; transform: rotate(-1.5deg); }
.pc-destinations-cover-tags { top: 14px; right: 12px; flex-direction: column; align-items: flex-end; gap: 5px; }
.pc-destinations-cover-tags .ant-tag { border-radius: 4px; }
.pc-destinations-rating { right: 13px; bottom: 12px; padding: 7px 10px; border: 1px dashed rgba(201,255,98,.65); border-radius: 999px; background: rgba(7,9,10,.84); backdrop-filter: blur(8px); }
.pc-destinations-card-body { position: absolute; z-index: 2; inset: 0; min-height: 0; padding: 0; pointer-events: none; }
.pc-destinations-card-title-row { position: absolute; left: 23px; right: 22px; bottom: 96px; display: block; }
.pc-destinations-card-title-row h4.ant-typography { width: 56%; margin: 0; color: #f8f8f2; font-size: clamp(38px,3vw,58px); font-weight: 950; line-height: .94; letter-spacing: -.08em; text-shadow: 0 5px 24px rgba(0,0,0,.78); }
.pc-destinations-card-body p.ant-typography { position: absolute; left: 23px; right: 158px; bottom: 27px; min-height: 0; margin: 0; overflow: hidden; color: rgba(255,255,255,.64) !important; font-size: 13px; line-height: 1.55; text-overflow: ellipsis; white-space: nowrap; }
.pc-destinations-explore.ant-btn { position: absolute; right: 22px; bottom: -74px; min-width: 0; height: 44px; padding: 0 15px; border: 0; border-radius: 4px; color: #11150d; background: #c9ff62; box-shadow: -7px -7px 0 rgba(201,255,98,.09); pointer-events: auto; }
.pc-destinations-explore.ant-btn:hover { color: #11150d !important; border-color: transparent !important; background: #dcff9b !important; transform: translate(2px,-2px); }
.pc-destinations-card-layout-1 .pc-destinations-card-cover { left: 18px; right: auto; width: calc(100% - 36px); height: 58%; border-radius: 18px 18px 10px 10px; transform: rotate(-.45deg); }
.pc-destinations-card-layout-1 .pc-destinations-card-title-row { bottom: 90px; }
.pc-destinations-card-layout-1 .pc-destinations-card-title-row h4.ant-typography { width: 68%; }
.pc-destinations-card-layout-1 .ant-card-body::after { bottom: 77px; }
.pc-destinations-card-layout-2 .pc-destinations-card-cover { top: 18px; right: 18px; width: 61%; height: calc(100% - 36px); border-radius: 10px 18px 18px 10px; transform: rotate(.5deg); }
.pc-destinations-card-layout-2 .pc-destinations-card-title-row { right: 42%; bottom: 90px; }
.pc-destinations-card-layout-2 .pc-destinations-card-title-row h4.ant-typography { width: 100%; font-size: clamp(34px,2.6vw,50px); }
.pc-destinations-card-layout-2 .pc-destinations-card-body p.ant-typography { right: 43%; bottom: 24px; white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.pc-destinations-card-layout-2 .pc-destinations-explore.ant-btn { right: calc(-68%); bottom: -72px; }
.pc-destinations-card-layout-2 .ant-card-body::after { bottom: 74px; }
.pc-destinations-card.ant-card:hover { transform: translateY(-7px) rotate(-.15deg); }

@media (max-width: 1280px) {
  .pc-destinations-card.ant-card,.pc-destinations-card .ant-card-body { min-height: 410px; }
}
@media (max-width: 700px) {
  .pc-destinations-card.ant-card,.pc-destinations-card .ant-card-body { min-height: 390px; }
  .pc-destinations-card-cover,.pc-destinations-card-layout-1 .pc-destinations-card-cover { left: 15px; right: 15px; width: auto; height: 58%; transform: none; }
  .pc-destinations-card-layout-2 .pc-destinations-card-cover { left: auto; right: 15px; width: 62%; height: calc(100% - 30px); }
  .pc-destinations-card-title-row { left: 19px; bottom: 91px; }
  .pc-destinations-card-title-row h4.ant-typography { font-size: 38px; }
  .pc-destinations-card-body p.ant-typography { left: 19px; right: 132px; bottom: 24px; }
  .pc-destinations-explore.ant-btn { right: 18px; }
}

/* Exact approved black-lime zine composition: sticker stack, offset photo, badge and ticket CTA. */
.pc-destinations-card.ant-card,.pc-destinations-card .ant-card-body { min-height: 440px; }
.pc-destinations-card .ant-card-body { overflow: hidden; }
.pc-destinations-card .ant-card-body::before { content: ''; position: absolute; z-index: 0; inset: 0; pointer-events: none; background: radial-gradient(circle,rgba(201,255,98,.14) 0 1px,transparent 1.2px) 0 0/13px 13px; opacity: .28; mask-image: linear-gradient(135deg,black,transparent 42%); }
.pc-destinations-card-cover,.pc-destinations-card-layout-1 .pc-destinations-card-cover,.pc-destinations-card-layout-2 .pc-destinations-card-cover { top: 18px; right: 18px; bottom: auto; left: auto; width: 69%; height: 64%; border-radius: 12px 18px 12px 8px; transform: rotate(.8deg); }
.pc-destinations-card-layout-1 .pc-destinations-card-cover { transform: rotate(-.7deg); }
.pc-destinations-card-layout-2 .pc-destinations-card-cover { transform: rotate(.35deg); }
.pc-destinations-index { top: 18px; right: 18px; left: auto; z-index: 8; min-width: 34px; height: 27px; color: #dfffaa; border: 1px solid rgba(201,255,98,.42); background: rgba(8,10,10,.78); box-shadow: none; }
.pc-destinations-category { top: 24px; left: 20px; z-index: 7; max-width: 42%; padding: 8px 12px; border-radius: 3px; color: #11150d; background: #c9ff62; box-shadow: 6px 6px 0 rgba(201,255,98,.12); font-size: 13px; transform: rotate(-3deg); }
.pc-destinations-cover-tags { position: absolute; z-index: 7; top: 76px; left: 22px; right: auto; display: flex; flex-direction: column; align-items: flex-start; gap: 7px; }
.pc-destinations-cover-tags .ant-tag { margin: 0; padding: 5px 10px; border: 1px solid rgba(255,255,255,.52); border-radius: 4px; color: #f7f7f2; background: rgba(9,11,13,.86); box-shadow: 4px 4px 0 rgba(255,255,255,.06); font-size: 12px; font-weight: 800; transform: rotate(-4deg); }
.pc-destinations-cover-tags .ant-tag:nth-child(2) { margin-left: 9px; transform: rotate(2.5deg); }
.pc-destinations-rating { right: 13px; bottom: 12px; min-width: 62px; height: 62px; padding: 0 10px; display: grid; grid-template-columns: auto auto; place-content: center; gap: 5px; border: 1px dashed #c9ff62; border-radius: 50%; color: #fff; background: rgba(8,10,11,.9); box-shadow: 0 8px 22px rgba(0,0,0,.34); font-size: 13px; transform: translate(5px,5px) rotate(4deg); }
.pc-destinations-card-title-row,.pc-destinations-card-layout-1 .pc-destinations-card-title-row,.pc-destinations-card-layout-2 .pc-destinations-card-title-row { left: 22px; right: 22px; bottom: 99px; }
.pc-destinations-card-title-row h4.ant-typography,.pc-destinations-card-layout-1 .pc-destinations-card-title-row h4.ant-typography,.pc-destinations-card-layout-2 .pc-destinations-card-title-row h4.ant-typography { width: 48%; color: #f7f7f2; font-size: clamp(42px,3.2vw,60px); line-height: .9; text-shadow: 3px 3px 0 rgba(201,255,98,.16),0 6px 24px rgba(0,0,0,.75); }
.pc-destinations-card .ant-card-body::after,.pc-destinations-card-layout-1 .ant-card-body::after,.pc-destinations-card-layout-2 .ant-card-body::after { left: 22px; bottom: 84px; width: 72px; height: 6px; transform: rotate(-4deg); }
.pc-destinations-card-body p.ant-typography,.pc-destinations-card-layout-2 .pc-destinations-card-body p.ant-typography { left: 22px; right: 155px; bottom: 25px; display: block; overflow: hidden; color: rgba(255,255,255,.68) !important; text-overflow: ellipsis; white-space: nowrap; }
.pc-destinations-explore.ant-btn,.pc-destinations-card-layout-2 .pc-destinations-explore.ant-btn { right: 22px; bottom: -74px; height: 44px; padding: 0 15px; }

@media (max-width: 700px) {
  .pc-destinations-card.ant-card,.pc-destinations-card .ant-card-body { min-height: 405px; }
  .pc-destinations-card-cover,.pc-destinations-card-layout-1 .pc-destinations-card-cover,.pc-destinations-card-layout-2 .pc-destinations-card-cover { top: 15px; right: 15px; left: auto; width: 70%; height: 61%; border-radius: 10px 15px 10px 7px; transform: none; }
  .pc-destinations-category { top: 19px; left: 16px; max-width: 46%; padding: 7px 10px; font-size: 11px; }
  .pc-destinations-cover-tags { top: 67px; left: 17px; gap: 5px; }
  .pc-destinations-cover-tags .ant-tag { padding: 4px 8px; font-size: 10px; }
  .pc-destinations-index { top: 16px; right: 16px; }
  .pc-destinations-card-title-row,.pc-destinations-card-layout-1 .pc-destinations-card-title-row,.pc-destinations-card-layout-2 .pc-destinations-card-title-row { left: 18px; bottom: 95px; }
  .pc-destinations-card-title-row h4.ant-typography,.pc-destinations-card-layout-1 .pc-destinations-card-title-row h4.ant-typography,.pc-destinations-card-layout-2 .pc-destinations-card-title-row h4.ant-typography { width: 52%; font-size: 42px; }
  .pc-destinations-card-body p.ant-typography,.pc-destinations-card-layout-2 .pc-destinations-card-body p.ant-typography { left: 18px; right: 132px; bottom: 23px; }
  .pc-destinations-explore.ant-btn,.pc-destinations-card-layout-2 .pc-destinations-explore.ant-btn { right: 17px; bottom: -71px; }
}

/* Fixed 18-city artwork family. The outer Card supplies the only rounded mask. */
.pc-destinations-card.ant-card { aspect-ratio: 940 / 820; min-height: 0; overflow: hidden; border: 0; border-radius: 24px; background: #090b0e; box-shadow: 0 18px 46px rgba(0,0,0,.28); }
.pc-destinations-card .ant-card-body { position: relative; width: 100%; height: 100%; min-height: 0; padding: 0; overflow: hidden; }
.pc-destinations-card .ant-card-body::before,.pc-destinations-card .ant-card-body::after { content: none; }
.pc-city-card-artwork { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: fill; }
.pc-city-card-explore-hitarea { position: absolute; z-index: 10; right: 3.5%; bottom: 1.5%; width: 34%; height: 14%; padding: 0; border: 0; background: transparent; cursor: pointer; }
.pc-city-card-explore-hitarea:focus-visible { outline: 3px solid #c9ff62; outline-offset: -3px; }
.pc-destinations-card.ant-card:hover { transform: translateY(-7px); border: 0; box-shadow: 0 28px 62px rgba(0,0,0,.42),0 0 0 4px rgba(201,255,98,.82),0 0 28px rgba(201,255,98,.16); }
@media (max-width: 700px) {
  .pc-destinations-card.ant-card { aspect-ratio: 940 / 820; min-height: 0; border-radius: 18px; }
  .pc-destinations-card .ant-card-body { min-height: 0; }
}

`;
