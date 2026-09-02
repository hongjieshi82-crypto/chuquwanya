import {
  CalendarOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  GiftOutlined,
  SearchOutlined,
  StarFilled,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Result,
  Segmented,
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

const { CheckableTag } = Tag;
const { Paragraph, Text, Title } = Typography;

const quickCategories = [
  { label: '全部', value: 'all' },
  { label: '热门', value: 'hot' },
  { label: '秘境', value: 'hidden' },
  { label: '季节限定', value: 'seasonal' },
] as const;
const filterTags = ['治愈', '松弛', '人文', '美食', '轻户外', '亲子', '古镇', '海边', '5A景区'];
const initialVisibleCount = 12;

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
  const [category, setCategory] = useState<(typeof quickCategories)[number]['value']>('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [selected, setSelected] = useState<DestinationItem | null>(null);
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

  const cityOptions = useMemo(() => ['all', ...Array.from(new Set(items.map((item) => item.cityName))).filter(Boolean)], [items]);

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
      const categoryMatch =
        category === 'all' ||
        (category === 'hot' && isHot(item)) ||
        (category === 'hidden' && item.normalizedTags.some((tag) => tag.includes('秘境'))) ||
        (category === 'seasonal' &&
          ((!item.bestSeason?.includes('四季') && /季|春|夏|秋|冬/.test(item.bestSeason ?? '')) ||
            item.normalizedTags.some((tag) => /限定|春日|秋日/.test(tag))));
      const tagsMatch =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => item.normalizedTags.includes(tag));
      const cityMatch = selectedCity === 'all' || item.cityName === selectedCity;
      return (!keyword || searchSource.includes(keyword)) && categoryMatch && tagsMatch && cityMatch;
    });

    if (!keyword && category === 'all' && selectedTags.length === 0) {
      const hot = result.filter(isHot).sort((left, right) => {
        const score = (value: number) => ((value * 9301 + 49297) % 233280) / 233280;
        return score(left.id) - score(right.id);
      });
      const regular = result.filter((item) => !isHot(item));
      return [...hot, ...regular];
    }
    if (selectedTags.length) {
      return [...result].sort((left, right) => {
        const matchCount = (item: DestinationItem) =>
          selectedTags.filter((tag) => item.normalizedTags.includes(tag)).length;
        return matchCount(right) - matchCount(left) || right.popularity - left.popularity;
      });
    }
    return result;
  }, [category, items, search, selectedCity, selectedTags]);

  const tagCounts = useMemo(
    () => new Map(filterTags.map((tag) => [tag, items.filter((item) => item.normalizedTags.includes(tag)).length])),
    [items],
  );

  const categoryOptions = useMemo(
    () => quickCategories.map((option) => {
      const count = items.filter((item) => {
        if (option.value === 'all') return true;
        if (option.value === 'hot') return isHot(item);
        if (option.value === 'hidden') return item.normalizedTags.some((tag) => tag.includes('秘境'));
        return (!item.bestSeason?.includes('四季') && /季|春|夏|秋|冬/.test(item.bestSeason ?? '')) ||
          item.normalizedTags.some((tag) => /限定|春日|秋日/.test(tag));
      }).length;
      return {
        value: option.value,
        label: <span className="pc-destinations-filter-label">{option.label}<small>{loading ? '–' : count}</small></span>,
      };
    }),
    [items, loading],
  );

  const relaxedItems = useMemo(() => {
    if (
      filteredItems.length ||
      normalizeText(search) ||
      (category === 'all' && selectedTags.length === 0)
    ) return [];

    return items
      .map((item) => {
        const tagScore = selectedTags.filter((tag) => item.normalizedTags.includes(tag)).length * 3;
        const categoryScore =
          (category === 'hot' && isHot(item)) ||
          (category === 'hidden' && item.normalizedTags.some((tag) => tag.includes('秘境'))) ||
          (category === 'seasonal' && !item.bestSeason?.includes('四季'))
            ? 2
            : 0;
        return { item, score: tagScore + categoryScore };
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || right.item.popularity - left.item.popularity)
      .slice(0, 6)
      .map((entry) => entry.item);
  }, [category, filteredItems, items, search, selectedTags]);

  const isRelaxedMatch = filteredItems.length === 0 && relaxedItems.length > 0;
  const resultItems = isRelaxedMatch ? relaxedItems : filteredItems;
  const visibleItems = resultItems.slice(0, visibleCount);
  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setSelectedCity('all');
    setSelectedTags([]);
    setVisibleCount(initialVisibleCount);
  };

  const toggleTag = (tag: string, checked: boolean) => {
    setVisibleCount(initialVisibleCount);
    setSelectedTags((current) => (checked ? [...current, tag] : current.filter((item) => item !== tag)));
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
      radiusKm: null,
      originName: city.name,
      originLatitude: null,
      originLongitude: null,
      originAccuracyMeters: null,
      originSource: null,
      destinationScope: 'nationwide',
      travelDuration: 'same-day',
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
      <header className="pc-destinations-hero">
        <div>
          <span>PLAYABLE PLACES / 02</span>
          <Title level={1}>翻一张旅行卡，<br />找到今天想去的地方。</Title>
        </div>
        <Text>真实地点 · 随时出发 · 不合适就换</Text>
      </header>
      <section className="pc-destinations-search" aria-label="目的地搜索">
        <Input.Search
          allowClear
          enterButton={<SearchOutlined />}
          placeholder="搜索目的地、城市或主题"
          size="large"
          value={search}
          onChange={(event) => {
            setVisibleCount(initialVisibleCount);
            setSearch(event.target.value);
          }}
        />
      </section>

      <section className="pc-destinations-layout">
        <section className="pc-destinations-content">
          <Card className="pc-destinations-filters">
            <Segmented
              options={categoryOptions}
              value={category}
              onChange={(value) => {
                setVisibleCount(initialVisibleCount);
                setCategory(value as typeof category);
              }}
            />
            <div className="pc-destinations-city-row">
              <Text>城市</Text>
              <div>
                {cityOptions.map((city) => (
                  <CheckableTag key={city} checked={selectedCity === city} onChange={() => { setVisibleCount(initialVisibleCount); setSelectedCity(city); }}>
                    {city === 'all' ? '全部城市' : city}
                  </CheckableTag>
                ))}
              </div>
            </div>
            <div className="pc-destinations-tag-row">
              {filterTags.map((tag) => (
                <CheckableTag key={tag} checked={selectedTags.includes(tag)} onChange={(checked) => toggleTag(tag, checked)}>
                  <span className="pc-destinations-filter-label">{tag}<small>{loading ? '–' : (tagCounts.get(tag) ?? 0)}</small></span>
                </CheckableTag>
              ))}
            </div>
          </Card>

          {isRelaxedMatch ? (
            <div className="pc-destinations-relaxed-note">
              <strong>这组条件暂时没有完全重合</strong>
              <span>已经自动放宽一层，下面是最接近你灵感组合的城市。</span>
            </div>
          ) : null}

          <div className="pc-destinations-results-heading">
            <Title level={2}>发现目的地</Title>
            <Text>{isRelaxedMatch ? `相近推荐 ${resultItems.length} 个` : `共 ${resultItems.length} 个目的地`}</Text>
          </div>

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
                {visibleItems.map((item) => (
                  <Card key={item.id} hoverable className="pc-destinations-card" onClick={() => setSelected(item)}>
                    <div className="pc-destinations-card-cover">
                      <DestinationCover item={item} className="pc-destinations-cover-image" />
                      <Tag className="pc-destinations-category">{item.categoryName}</Tag>
                      <div className="pc-destinations-cover-tags">
                        {item.normalizedTags.slice(0, 2).map((tag) => <Tag key={tag}>{tag}</Tag>)}
                      </div>
                      <span className="pc-destinations-rating"><StarFilled /> {Number(item.rating || 0).toFixed(1)}</span>
                      <span className="pc-destinations-card-overlay"><EyeOutlined /> 查看详情</span>
                    </div>
                    <div className="pc-destinations-card-body">
                      <Title level={4}>{item.name}</Title>
                      <Paragraph ellipsis={{ rows: 2 }}>{item.description || item.summary || '暂无目的地介绍。'}</Paragraph>
                      <div className="pc-destinations-meta">
                        <span><EnvironmentOutlined /> {item.cityName}</span>
                        <span><CalendarOutlined /> {getDuration(item)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {visibleCount < resultItems.length ? <div className="pc-destinations-more"><Button type="primary" shape="round" onClick={() => setVisibleCount((count) => count + initialVisibleCount)}>查看更多目的地</Button></div> : null}
            </>
          ) : (
            <Empty description={<span><strong>没有找到匹配的目的地</strong><br />试试其他搜索关键词或调整筛选条件</span>}>
              <Button onClick={resetFilters}>重置筛选</Button>
            </Empty>
          )}
        </section>
      </section>

      <Modal
        className="pc-destinations-modal"
        footer={[
          <Button key="close" onClick={() => setSelected(null)}>关闭</Button>,
          <Button key="box" type="primary" icon={<GiftOutlined />} onClick={generateBlindBox}>生成盲盒</Button>,
        ]}
        open={Boolean(selected)}
        title={null}
        width={720}
        onCancel={() => setSelected(null)}>
        {selected ? (
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
.pc-destinations-hero span { color: #c9ff62; font: 800 12px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing: .12em; }
.pc-destinations-hero h1.ant-typography { margin: 14px 0 0; color: #f7f7f2; font-size: clamp(38px,4vw,60px); font-weight: 900; line-height: 1.06; letter-spacing: -.045em; }
.pc-destinations-hero > .ant-typography { padding-bottom: 7px; color: rgba(255,255,255,.52); font-size: 14px; }
.pc-destinations-search { max-width: 1440px; margin: 0 auto 28px; padding-top: 0; }
.pc-destinations-search .ant-input-group-wrapper { height: 56px; }
.pc-destinations-search .ant-input-affix-wrapper { min-height: 56px; padding-left: 20px; border-color: rgba(255,255,255,.12); border-radius: 18px 0 0 18px; color: #fff; background: rgba(255,255,255,.055); box-shadow: inset 0 1px 0 rgba(255,255,255,.04); backdrop-filter: blur(18px); }.pc-destinations-search .ant-input-affix-wrapper:focus-within { border-color: rgba(201,255,98,.48); box-shadow: 0 0 0 3px rgba(201,255,98,.08); }.pc-destinations-search input { color: #fff; background: transparent; font-size: 15px; }.pc-destinations-search input::placeholder { color: rgba(255,255,255,.36); }.pc-destinations-search .ant-btn { width: 68px; min-height: 56px; border: 0; border-radius: 0 18px 18px 0 !important; color: #10130d; background: #c9ff62; box-shadow: none; }.pc-destinations-search .ant-btn:hover { color: #10130d !important; background: #dcff9b !important; }
.pc-destinations-layout { max-width: 1440px; margin: 0 auto; display: block; }
.pc-destinations-filters { margin-bottom: 28px; border: 1px solid rgba(255,255,255,.1); border-radius: 20px; background: rgba(255,255,255,.045); box-shadow: 0 16px 38px rgba(0,0,0,.14); backdrop-filter: blur(18px); }
.pc-destinations-filters .ant-card-body { padding: 20px; }
.pc-destinations-filters .ant-segmented { padding: 4px; border-radius: 999px; background: rgba(255,255,255,.07); }.pc-destinations-filters .ant-segmented-item { color: rgba(255,255,255,.58); border-radius: 999px; }.pc-destinations-filters .ant-segmented-item-selected { color: #10130d; background: #c9ff62; box-shadow: none; }
.pc-destinations-city-row { display: flex; align-items: flex-start; gap: 18px; margin-top: 18px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,.08); }.pc-destinations-city-row > .ant-typography { flex: 0 0 auto; padding-top: 5px; color: rgba(255,255,255,.42); font-size: 12px; font-weight: 750; }.pc-destinations-city-row > div { display: flex; flex-wrap: wrap; gap: 8px; }.pc-destinations-city-row .ant-tag { margin: 0; padding: 4px 12px; border: 1px solid rgba(255,255,255,.12); border-radius: 999px; color: rgba(255,255,255,.62); background: rgba(255,255,255,.04); }.pc-destinations-city-row .ant-tag-checkable-checked { color: #10130d; border-color: #c9ff62; background: #c9ff62; font-weight: 800; }
.pc-destinations-tag-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
.pc-destinations-tag-row .ant-tag { margin: 0; padding: 4px 12px; border: 1px solid rgba(255,255,255,.12); border-radius: 999px; color: rgba(255,255,255,.6); background: rgba(255,255,255,.045); }
.pc-destinations-tag-row .ant-tag-checkable-checked { color: #111419; border-color: #c9ff62; background: #c9ff62; }
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
.pc-destinations-card.ant-card { overflow: hidden; border: 1px solid rgba(255,255,255,.1); border-radius: 22px; color: #fff; background: #1a1c21; box-shadow: 0 18px 42px rgba(0,0,0,.2); transition: transform .32s cubic-bezier(.2,.8,.2,1), box-shadow .32s ease, border-color .32s ease; animation: destination-card-in .55s both; }
.pc-destinations-card.ant-card:nth-child(3n+2) { animation-delay: .07s; }.pc-destinations-card.ant-card:nth-child(3n) { animation-delay: .14s; }
.pc-destinations-card.ant-card:hover { transform: translateY(-8px) rotate(.35deg); border-color: rgba(201,255,98,.4); box-shadow: 0 26px 58px rgba(0,0,0,.34); }
.pc-destinations-card .ant-card-body { padding: 0; }.pc-destinations-card-cover { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: #EEF2F7; }
.pc-destinations-cover-image, .pc-destinations-cover-placeholder { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; object-fit: cover; color: #9CA3AF; background: #EEF2F7; transition: transform .28s ease; }
.pc-destinations-cover-placeholder { flex-direction: column; gap: 6px; font-size: 12px; }.pc-destinations-card:hover .pc-destinations-cover-image, .pc-destinations-card:hover .pc-destinations-cover-placeholder { transform: scale(1.05); }
.pc-destinations-category { position: absolute; top: 12px; left: 12px; margin: 0; border: 0; color: #1D4ED8; background: rgba(255,255,255,.92); }
.pc-destinations-cover-tags { position: absolute; top: 10px; right: 10px; display: flex; gap: 4px; }.pc-destinations-cover-tags .ant-tag { margin: 0; border: 0; color: #fff; background: rgba(15,23,42,.56); }
.pc-destinations-rating { position: absolute; right: 12px; bottom: 10px; color: #fff; font-size: 13px; font-weight: 700; text-shadow: 0 1px 3px rgba(0,0,0,.42); }.pc-destinations-rating svg { color: #FBBF24; }
.pc-destinations-card-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 7px; color: white; font-weight: 600; opacity: 0; background: rgba(15,23,42,.38); transition: opacity .24s ease; }.pc-destinations-card:hover .pc-destinations-card-overlay { opacity: 1; }
.pc-destinations-card-body { padding: 19px 19px 20px; }.pc-destinations-card-body h4 { margin: 0 0 8px; color: #fff; font-size: 18px; font-weight: 800; }.pc-destinations-card-body p { min-height: 42px; margin: 0 0 15px; color: rgba(255,255,255,.5); font-size: 13px; line-height: 1.6; }
.pc-destinations-meta { display: flex; justify-content: space-between; gap: 8px; color: rgba(255,255,255,.55); font-size: 12px; }.pc-destinations-meta span { display: inline-flex; align-items: center; gap: 4px; }.pc-destinations-meta svg { color: #c9ff62; }
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
`;
