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
  Collapse,
  Empty,
  Input,
  Modal,
  Result,
  Segmented,
  Skeleton,
  Space,
  Tag,
  Tree,
  Typography,
} from 'antd';
import type { TreeDataNode } from 'antd';
import type { Key } from 'react';
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

type TreeNode = TreeDataNode & { destinationId?: number };

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

  return <img className={className} src={src} alt={item.name} onError={() => setIsBroken(true)} />;
}

function buildTreeData(items: DestinationItem[]): TreeNode[] {
  const provinceMap = new Map<string, Map<string, DestinationItem[]>>();

  items.forEach((item) => {
    const province = item.province?.trim() || '其他地区';
    const city = item.cityName || '其他城市';
    const cityMap = provinceMap.get(province) ?? new Map<string, DestinationItem[]>();
    cityMap.set(city, [...(cityMap.get(city) ?? []), item]);
    provinceMap.set(province, cityMap);
  });

  return Array.from(provinceMap.entries()).map(([province, cityMap]) => ({
    key: `province-${province}`,
    title: <span className="pc-destinations-tree-group">{province}</span>,
    children: Array.from(cityMap.entries()).map(([city, cityItems]) => ({
      key: `city-${province}-${city}`,
      title: (
        <span className="pc-destinations-tree-title">
          <span>{city}</span>
          <small>{cityItems.length}</small>
        </span>
      ),
      children: cityItems.map((item) => ({
        key: `destination-${item.id}`,
        destinationId: item.id,
        isLeaf: true,
        title: (
          <span className="pc-destinations-tree-leaf">
            <DestinationCover item={item} />
            <span>{item.name}</span>
          </span>
        ),
      })),
    })),
  }));
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [selected, setSelected] = useState<DestinationItem | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
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

  const treeData = useMemo(() => buildTreeData(items), [items]);
  const allTreeKeys = useMemo(() => {
    const keys: Key[] = [];
    treeData.forEach((province) => {
      keys.push(province.key);
      province.children?.forEach((city) => keys.push(city.key));
    });
    return keys;
  }, [treeData]);

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
      return (!keyword || searchSource.includes(keyword)) && categoryMatch && tagsMatch;
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
  }, [category, items, search, selectedTags]);

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

  const tree = (
    <Card
      className="pc-destinations-tree-card"
      title={
        <Space size={8}>
          <EnvironmentOutlined />
          <span>城市选择</span>
        </Space>
      }
      extra={
        <Button type="link" size="small" onClick={() => setExpandedKeys(expandedKeys.length ? [] : allTreeKeys)}>
          {expandedKeys.length ? '收起全部' : '展开全部'}
        </Button>
      }>
      <Tree
        blockNode
        expandedKeys={expandedKeys}
        onExpand={(keys) => setExpandedKeys(keys)}
        onSelect={(_, info) => {
          const node = info.node as TreeNode;
          const id = node.destinationId;
          if (id) setSelected(items.find((item) => item.id === id) ?? null);
        }}
        treeData={treeData}
      />
    </Card>
  );

  return (
    <main className="pc-destinations-page">
      <style>{pcDestinationsCss}</style>
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
        <aside className="pc-destinations-aside">
          <div className="pc-destinations-tree-desktop">{tree}</div>
          <Collapse className="pc-destinations-tree-mobile" items={[{ key: 'cities', label: '城市选择', children: tree }]} />
        </aside>

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
            <div className="pc-destinations-tag-row">
              {filterTags.map((tag) => (
                <CheckableTag key={tag} checked={selectedTags.includes(tag)} onChange={(checked) => toggleTag(tag, checked)}>
                  <span className="pc-destinations-filter-label">{tag}<small>{loading ? '–' : (tagCounts.get(tag) ?? 0)}</small></span>
                </CheckableTag>
              ))}
            </div>
            <Text className="pc-destinations-filter-hint">
              {selectedTags.length
                ? `已选择 ${selectedTags.length} 个灵感，命中标签越多的城市会排得越靠前。`
                : '标签可以多选；我们按匹配程度排序，不会因为组合太细让结果突然归零。'}
            </Text>
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
.pc-destinations-page { min-height: calc(100dvh - 76px); padding: 36px 32px 64px; background: #F5F7FA; color: #1F1F1F; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; }
.pc-destinations-search { max-width: 640px; margin: 0 auto 36px; padding-top: 0; }
.pc-destinations-search .ant-input-group-wrapper { height: 48px; }
.pc-destinations-search .ant-input-affix-wrapper, .pc-destinations-search .ant-btn { min-height: 48px; }
.pc-destinations-layout { max-width: 1440px; margin: 0 auto; display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 24px; }
.pc-destinations-tree-card { position: sticky; top: 96px; max-height: calc(100vh - 120px); overflow: auto; border-color: #E5E7EB; border-radius: 16px; box-shadow: 0 2px 8px rgba(15,23,42,.06); }
.pc-destinations-tree-card .ant-card-head { border-bottom-color: #E5E7EB; }
.pc-destinations-tree-card .ant-card-body { padding: 12px; }
.pc-destinations-tree-mobile { display: none; }
.pc-destinations-tree-title, .pc-destinations-tree-leaf { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; }
.pc-destinations-tree-title small { min-width: 18px; padding: 1px 6px; border-radius: 999px; color: #6B7280; background: #F3F4F6; text-align: center; }
.pc-destinations-tree-leaf { justify-content: flex-start; overflow: hidden; }
.pc-destinations-tree-leaf .pc-destinations-cover-placeholder, .pc-destinations-tree-leaf img { width: 36px; height: 36px; flex: 0 0 36px; border-radius: 8px; }
.pc-destinations-tree-leaf > span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pc-destinations-tree-leaf .pc-destinations-cover-placeholder { font-size: 10px; }
.pc-destinations-tree-card .ant-tree-node-content-wrapper.ant-tree-node-selected { background: #F0F7FF; }
.pc-destinations-filters { margin-bottom: 24px; border-color: #E5E7EB; border-radius: 16px; box-shadow: 0 2px 8px rgba(15,23,42,.06); }
.pc-destinations-filters .ant-card-body { padding: 20px; }
.pc-destinations-tag-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
.pc-destinations-tag-row .ant-tag { margin: 0; padding: 4px 12px; border: 1px solid #E5E7EB; border-radius: 999px; color: #4B5563; background: #fff; }
.pc-destinations-tag-row .ant-tag-checkable-checked { color: ${palette.primary}; border-color: ${palette.primary}; background: ${palette.primarySoft}; }
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
  color: #8a8498;
  font-size: 12px;
  line-height: 1.6;
}
.pc-destinations-relaxed-note {
  margin: -6px 0 22px;
  padding: 14px 17px;
  border: 1px solid rgba(117,101,246,.16);
  border-radius: 14px;
  color: #6f687f;
  background: linear-gradient(90deg, rgba(117,101,246,.08), rgba(120,232,255,.06));
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}
.pc-destinations-relaxed-note strong { color: #5646c6; }
.pc-destinations-results-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.pc-destinations-results-heading h2 { margin: 0; font-size: 24px; }.pc-destinations-results-heading .ant-typography { color: #6B7280; }
.pc-destinations-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.pc-destinations-card.ant-card { overflow: hidden; border: 0; border-radius: 16px; box-shadow: 0 2px 8px rgba(15,23,42,.06); transition: transform .24s ease, box-shadow .24s ease; }
.pc-destinations-card.ant-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(15,23,42,.12); }
.pc-destinations-card .ant-card-body { padding: 0; }.pc-destinations-card-cover { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: #EEF2F7; }
.pc-destinations-cover-image, .pc-destinations-cover-placeholder { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; object-fit: cover; color: #9CA3AF; background: #EEF2F7; transition: transform .28s ease; }
.pc-destinations-cover-placeholder { flex-direction: column; gap: 6px; font-size: 12px; }.pc-destinations-card:hover .pc-destinations-cover-image, .pc-destinations-card:hover .pc-destinations-cover-placeholder { transform: scale(1.05); }
.pc-destinations-category { position: absolute; top: 12px; left: 12px; margin: 0; border: 0; color: #1D4ED8; background: rgba(255,255,255,.92); }
.pc-destinations-cover-tags { position: absolute; top: 10px; right: 10px; display: flex; gap: 4px; }.pc-destinations-cover-tags .ant-tag { margin: 0; border: 0; color: #fff; background: rgba(15,23,42,.56); }
.pc-destinations-rating { position: absolute; right: 12px; bottom: 10px; color: #fff; font-size: 13px; font-weight: 700; text-shadow: 0 1px 3px rgba(0,0,0,.42); }.pc-destinations-rating svg { color: #FBBF24; }
.pc-destinations-card-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 7px; color: white; font-weight: 600; opacity: 0; background: rgba(15,23,42,.38); transition: opacity .24s ease; }.pc-destinations-card:hover .pc-destinations-card-overlay { opacity: 1; }
.pc-destinations-card-body { padding: 16px; }.pc-destinations-card-body h4 { margin: 0 0 8px; font-size: 16px; font-weight: 600; }.pc-destinations-card-body p { min-height: 42px; margin: 0 0 12px; color: #6B7280; font-size: 13px; line-height: 1.6; }
.pc-destinations-meta { display: flex; justify-content: space-between; gap: 8px; color: #6B7280; font-size: 12px; }.pc-destinations-meta span { display: inline-flex; align-items: center; gap: 4px; }
.pc-destinations-more { display: flex; justify-content: center; padding-top: 32px; }.pc-destinations-more .ant-btn { min-width: 164px; }
.pc-destinations-skeleton .ant-card-body { min-height: 260px; padding-top: 26px; }
.pc-destinations-modal .ant-modal-content { overflow: hidden; padding: 0; border-radius: 16px; }.pc-destinations-modal .ant-modal-close { z-index: 2; color: #fff; }.pc-destinations-modal .ant-modal-footer { padding: 12px 24px 18px; margin: 0; }
.pc-destinations-detail-cover { height: 240px; overflow: hidden; background: #EEF2F7; }.pc-destinations-detail-content { padding: 22px 24px 6px; }.pc-destinations-detail-content h2 { margin: 10px 0 8px; }.pc-destinations-detail-content > p { color: #4B5563; line-height: 1.7; }
.pc-destinations-detail-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 20px 0; }.pc-destinations-detail-stats div { display: flex; flex-direction: column; gap: 5px; padding: 12px; border-radius: 10px; background: #F8FAFC; }.pc-destinations-detail-stats small { color: #6B7280; }.pc-destinations-detail-stats strong { font-size: 14px; }.pc-destinations-tips { margin-top: 18px; padding: 12px; border-radius: 10px; color: #854D0E; background: #FFFBEB; }.pc-destinations-tips ul { margin: 8px 0 0; padding-left: 18px; }
@media (max-width: 1439px) { .pc-destinations-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 1023px) { .pc-destinations-page { padding-inline: 20px; }.pc-destinations-layout { display: block; }.pc-destinations-aside { margin-bottom: 20px; }.pc-destinations-tree-desktop { display: none; }.pc-destinations-tree-mobile { display: block; }.pc-destinations-tree-mobile .pc-destinations-tree-card { position: static; max-height: none; box-shadow: none; }.pc-destinations-tree-mobile .ant-collapse-content-box { padding: 0 !important; } }
@media (max-width: 767px) { .pc-destinations-page { padding: 22px 16px 40px; }.pc-destinations-search { margin-bottom: 24px; }.pc-destinations-grid { grid-template-columns: 1fr; gap: 16px; }.pc-destinations-detail-stats { grid-template-columns: repeat(2, 1fr); }.pc-destinations-results-heading h2 { font-size: 21px; } }
@media (prefers-reduced-motion: reduce) { .pc-destinations-card.ant-card, .pc-destinations-cover-image, .pc-destinations-cover-placeholder, .pc-destinations-card-overlay { transition: none; }.pc-destinations-card.ant-card:hover { transform: none; }.pc-destinations-card:hover .pc-destinations-cover-image, .pc-destinations-card:hover .pc-destinations-cover-placeholder { transform: none; } }
`;
