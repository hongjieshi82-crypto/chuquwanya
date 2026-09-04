import CalendarOutlinedSvg from '@ant-design/icons-svg/es/asn/CalendarOutlined';
import EnvironmentOutlinedSvg from '@ant-design/icons-svg/es/asn/EnvironmentOutlined';
import GiftOutlinedSvg from '@ant-design/icons-svg/es/asn/GiftOutlined';
import type { AbstractNode, IconDefinition } from '@ant-design/icons-svg/es/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Card, ConfigProvider, Layout, Select, Space, Tag, Typography } from 'antd';
import 'antd/dist/reset.css';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SVGProps } from 'react';
import { useApp } from '@/contexts/app-context';
import { savePendingPcBoxDraw } from '@/lib/pc-box-open-state';
import { getPcTravelBudgetRange } from '@/constants/pc-travel-budget-tiers';
import { palette, radii } from '@/theme';
import type { City, Preferences } from '@/types';

const { Content } = Layout;
const { Text } = Typography;
const PC_LOCATED_CITY_KEY = '@weekend-oracle/pc-located-city';
const PC_LOCATED_CITY_TTL_MS = 24 * 60 * 60 * 1_000;

type PcIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

type MatchPreferenceGroup = {
  key:
    | 'partySize'
    | 'destinationScope'
    | 'travelDuration'
    | 'budget'
    | 'mood'
    | 'surpriseLevel';
  label: string;
  options: string[];
  descriptions?: Record<string, string>;
};

type PcLocatedCity = {
  name: string;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  source: 'default' | 'device' | 'manual';
};

type StoredPcLocatedCity = PcLocatedCity & { savedAt: number };

const boxToken = {
  canvas: palette.canvas,
  surface: palette.surface,
  ink: palette.ink,
  text: palette.text,
  muted: palette.muted,
  primary: palette.primary,
  primaryDark: palette.primaryDark,
  primarySoft: palette.primarySoft,
  border: palette.border,
  sky: palette.sky,
};

const matchPreferenceGroups: MatchPreferenceGroup[] = [
  { key: 'partySize', label: '人数', options: ['1 人', '2 人', '多人'] },
  { key: 'travelDuration', label: '出游时长', options: ['当天', '周末游', '小长假'] },
  { key: 'budget', label: '预算', options: ['划算出行', '舒服躺玩', '品质享受'] },
  { key: 'mood', label: '心情', options: ['放松', '探索', '热闹'] },
  {
    key: 'surpriseLevel',
    label: '抽取惊喜程度',
    options: ['轻度', '中度', '重度'],
    descriptions: {
      轻度: '锁定城市与风格，只随机具体玩法',
      中度: '锁定目的地，在当地候选中扩大探索范围',
      重度: '锁定目的地，只提高当地玩法的新鲜感',
    },
  },
];

const initialMatchSelections: Record<string, string> = {
  partySize: '1 人',
  destinationScope: '周边',
  travelDuration: '当天',
  budget: '划算出行',
  mood: '放松',
  surpriseLevel: '中度',
};

const homepagePresetSelections: Record<string, Partial<Record<string, string>>> = {
  scene: { destinationScope: '全国', mood: '放松', surpriseLevel: '轻度' },
  theme: { destinationScope: '周边', mood: '探索', surpriseLevel: '中度' },
  audience: { partySize: '2 人', mood: '放松', surpriseLevel: '中度' },
  food: { destinationScope: '周边', budget: '划算出行', mood: '热闹', surpriseLevel: '中度' },
};

const defaultPcLocatedCity: PcLocatedCity = {
  name: '北京',
  latitude: null,
  longitude: null,
  accuracyMeters: null,
  source: 'default',
};

const cityPreviewImages: Record<string, string> = {
  '北京': '/media/travel/beijing.jpg', '上海': '/media/travel/shanghai.jpg', '杭州': '/media/travel/hangzhou.jpg',
  '深圳': '/media/travel/shenzhen.jpg', '天津': '/media/travel/tianjin.jpg', '烟台': '/media/travel/yantai.jpg',
  '青岛': '/media/travel/qingdao.jpg', '南京': '/media/travel/nanjing.jpg', '武汉': '/media/travel/wuhan.jpg',
  '成都': '/media/travel/chengdu.jpg', '西安': '/media/travel/xian.jpg', '长沙': '/media/travel/changsha.jpg',
  '广州': '/media/travel/guangzhou.jpg', '合肥': '/media/travel/hefei.jpg', '重庆': '/media/travel/chongqing.jpg',
  '厦门': '/media/travel/xiamen.jpg', '济南': '/media/travel/jinan.jpg', '昆明': '/media/travel/kunming.jpg',
};

function findMatchingCity(cities: City[], locationName: string) {
  const normalizedLocationName = locationName.trim().replace(/市$/, '');
  return cities.find((city) => {
    const cityName = city.name.trim().replace(/市$/, '');
    const provinceName = city.province.trim().replace(/市$/, '');
    return cityName === normalizedLocationName || provinceName === normalizedLocationName;
  });
}

async function storePcLocatedCity(city: PcLocatedCity) {
  const payload: StoredPcLocatedCity = { ...city, savedAt: Date.now() };
  await AsyncStorage.setItem(PC_LOCATED_CITY_KEY, JSON.stringify(payload));
}

const partySizeValues: Record<string, number> = {
  '1 人': 1,
  '2 人': 2,
  多人: 4,
};

const surpriseLevelValues: Record<string, number> = {
  轻度: 25,
  中度: 60,
  重度: 95,
};

function getIconNode(definition: IconDefinition): AbstractNode {
  return typeof definition.icon === 'function'
    ? definition.icon(palette.primary, palette.sky)
    : definition.icon;
}

function collectPaths(node: AbstractNode): string[] {
  const currentPath = node.tag === 'path' ? node.attrs.d : undefined;
  const childPaths = node.children?.flatMap(collectPaths) ?? [];

  return currentPath ? [currentPath, ...childPaths] : childPaths;
}

function createPcIcon(definition: IconDefinition) {
  const iconNode = getIconNode(definition);
  const paths = collectPaths(iconNode);

  function PcIcon({ size = 16, className, style, ...props }: PcIconProps) {
    return (
      <svg
        aria-hidden="true"
        className={className ? `pc-box-icon ${className}` : 'pc-box-icon'}
        focusable="false"
        height={size}
        viewBox={iconNode.attrs.viewBox}
        width={size}
        style={style}
        {...props}>
        {paths.map((d, index) => (
          <path key={index} d={d} fill="currentColor" />
        ))}
      </svg>
    );
  }

  return PcIcon;
}

const CalendarOutlined = createPcIcon(CalendarOutlinedSvg);
const EnvironmentOutlined = createPcIcon(EnvironmentOutlinedSvg);
const GiftOutlined = createPcIcon(GiftOutlinedSvg);

export default function PcBoxConfigScreen() {
  const router = useRouter();
  const { preset } = useLocalSearchParams<{ preset?: string }>();
  const {
    cities,
    selectedCityId,
    setSelectedCityId,
    isBooting,
    clearError,
  } = useApp();
  const [matchSelections, setMatchSelections] =
    useState<Record<string, string>>(initialMatchSelections);
  const [locatedCity, setLocatedCity] = useState<PcLocatedCity>(defaultPcLocatedCity);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [isStartingDraw, setIsStartingDraw] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const appliedPresetRef = useRef<string | null>(null);

  useEffect(() => {
    const presetKey = typeof preset === 'string' ? preset : '';
    const selections = homepagePresetSelections[presetKey];
    if (!selections || appliedPresetRef.current === presetKey) return;

    appliedPresetRef.current = presetKey;
    setMatchSelections((current) => {
      const next = { ...current };
      Object.entries(selections).forEach(([key, value]) => {
        if (typeof value === 'string') next[key] = value;
      });
      return next;
    });
  }, [preset]);

  useEffect(() => {
    let cancelled = false;

    async function restoreLocatedCity() {
      const raw = await AsyncStorage.getItem(PC_LOCATED_CITY_KEY);
      if (!raw || cancelled) return;
      try {
        const stored = JSON.parse(raw) as StoredPcLocatedCity;
        if (
          stored.source === 'default' ||
          !stored.name ||
          Date.now() - Number(stored.savedAt) > PC_LOCATED_CITY_TTL_MS
        ) return;

        setLocatedCity(stored);
        const matchedCity = findMatchingCity(cities, stored.name);
        if (matchedCity) setSelectedCityId(matchedCity.id);
      } catch {
        // Ignore stale local location data and keep the Beijing default.
      }
    }

    void restoreLocatedCity();
    return () => { cancelled = true; };
  }, [cities, setSelectedCityId]);

  const goStart = useCallback((target: '/box/open' | '/box/slot-preview' = '/box/slot-preview') => {
    if (isBooting || isStartingDraw) return;

    const partySize = partySizeValues[matchSelections.partySize] ?? 1;
    const budgetRange = getPcTravelBudgetRange(matchSelections.travelDuration, matchSelections.budget);
    const randomLevel = surpriseLevelValues[matchSelections.surpriseLevel] ?? 60;
    const originCity = findMatchingCity(cities, locatedCity.name);
    const destinationCity = cities.find((city) => city.id === selectedCityId) ?? originCity ?? cities[0] ?? null;
    const drawCityId = destinationCity?.id ?? null;

    if (!drawCityId) {
      setDrawError('城市数据尚未加载完成，请稍后重试。');
      return;
    }

    const preferences: Preferences = {
      partySize,
      durationMinutes: null,
      budgetMin: budgetRange.min,
      budgetMax: budgetRange.max,
      mood: matchSelections.mood ?? '放松',
      randomLevel,
      category: '不限',
      environment: 'either',
      radiusKm: originCity?.id === drawCityId ? 10 : null,
      originName: locatedCity.name,
      originLatitude: locatedCity.latitude,
      originLongitude: locatedCity.longitude,
      originAccuracyMeters: locatedCity.accuracyMeters,
      originSource:
        locatedCity.source === 'device'
          ? 'device'
          : locatedCity.source === 'manual'
            ? 'manual'
            : null,
      destinationScope: originCity?.id === drawCityId ? 'nearby' : 'nationwide',
      travelDuration:
        matchSelections.travelDuration === '当天'
          ? 'same-day'
          : matchSelections.travelDuration === '周末游'
            ? '2-3days'
            : '4-5days',
      clientSource: 'pc',
      destinationScopeLabel: originCity?.id === drawCityId
        ? `${destinationCity?.name ?? locatedCity.name}本地`
        : `${locatedCity.name} → ${destinationCity?.name ?? '目的地'}`,
      travelDurationLabel: matchSelections.travelDuration,
      budgetLabel: matchSelections.budget,
      surpriseLevelLabel: matchSelections.surpriseLevel,
    };

    const summary = [
      `${locatedCity.name}出发`,
      `目的地：${destinationCity?.name ?? '未选择'}`,
      ...matchPreferenceGroups.map((group) => matchSelections[group.key] ?? group.options[0]),
    ].join(' · ');

    if (!savePendingPcBoxDraw({ cityId: drawCityId, preferences, summary })) {
      setDrawError('浏览器暂时无法保存本次偏好，请刷新页面后重试。');
      return;
    }

    setDrawError(null);
    clearError();
    setIsStartingDraw(true);
    router.push(target);
  }, [
    cities,
    clearError,
    isBooting,
    isStartingDraw,
    locatedCity.accuracyMeters,
    locatedCity.latitude,
    locatedCity.longitude,
    locatedCity.name,
    locatedCity.source,
    matchSelections,
    router,
    selectedCityId,
  ]);

  useEffect(() => {
    const handleShellStart = () => goStart('/box/slot-preview');
    window.addEventListener('pc-box-start-draw', handleShellStart);
    return () => window.removeEventListener('pc-box-start-draw', handleShellStart);
  }, [goStart]);

  const handleMatchSelect = (key: MatchPreferenceGroup['key'], option: string) => {
    setMatchSelections((previous) => ({
      ...previous,
      [key]: option,
    }));
  };

  const handleManualCitySelect = (cityId: number) => {
    const city = cities.find((item) => item.id === cityId);
    if (!city) return;
    const nextLocatedCity: PcLocatedCity = {
      name: city.name,
      latitude: null,
      longitude: null,
      accuracyMeters: null,
      source: 'manual',
    };
    setLocatedCity(nextLocatedCity);
    setSelectedCityId(city.id);
    setDrawError(null);
    setLocationNotice(`已切换到${city.name}，将优先生成当地玩法。`);
    void storePcLocatedCity(nextLocatedCity);
  };

  const locatedCityOption = findMatchingCity(cities, locatedCity.name);
  const destinationCityOption = cities.find((city) => city.id === selectedCityId) ?? locatedCityOption ?? cities[0];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: boxToken.primary,
          colorInfo: boxToken.primary,
          colorTextLightSolid: boxToken.ink,
          colorText: boxToken.ink,
          colorTextSecondary: boxToken.text,
          colorTextTertiary: boxToken.muted,
          colorBgLayout: boxToken.canvas,
          colorBgContainer: boxToken.surface,
          colorBorder: boxToken.border,
          borderRadius: radii.lg,
          borderRadiusLG: radii.xl,
          fontFamily:
            'Inter, PingFang SC, Microsoft YaHei, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        },
        components: {
          Button: {
            borderRadius: radii.pill,
            controlHeightLG: 48,
            primaryShadow: '0 10px 24px rgba(126, 166, 31, 0.28)',
          },
          Card: {
            borderRadiusLG: radii.xl,
          },
          Select: {
            selectorBg: '#111416',
            optionSelectedBg: 'rgba(201, 255, 98, 0.12)',
            optionActiveBg: 'rgba(255, 255, 255, 0.06)',
            optionSelectedColor: '#dcff9a',
            colorBgElevated: '#15181a',
            colorText: '#f5f7f1',
            colorTextPlaceholder: 'rgba(255,255,255,.42)',
          },
          Tag: {
            borderRadiusSM: radii.pill,
            defaultBg: boxToken.primarySoft,
            defaultColor: boxToken.primaryDark,
          },
        },
      }}>
      <div className="pc-box-page">
        <style>{pcBoxCss}</style>
        <Layout className="pc-box-layout">
          <Content className="pc-box-content">
            <div className="pc-box-workbench">
            <div className="pc-box-sections">
              <Card className="pc-box-section" variant="borderless">
                <div className="pc-box-section-heading">
                  <span className="pc-box-section-icon">
                    <EnvironmentOutlined size={22} />
                  </span>
                  <Text className="pc-box-section-title">选择探索城市</Text>
                </div>
                <div className="pc-box-city-picker">
                  <div className="pc-box-location">
                    <Text className="pc-box-label">探索城市</Text>
                    <div className="pc-box-location-controls">
                      <Select
                        aria-label="选择探索城市"
                        className={`pc-box-city-select${locatedCityOption ? ' is-selected' : ''}`}
                        options={cities.map((city) => ({ label: `${city.name} · ${city.province}`, value: city.id }))}
                        placeholder={locatedCity.name}
                        showSearch
                        optionFilterProp="label"
                        popupClassName="pc-box-city-dropdown"
                        value={locatedCityOption?.id}
                        onChange={handleManualCitySelect}
                      />
                    </div>
                    {locationNotice ? (
                      <Text className="pc-box-location-notice">{locationNotice}</Text>
                    ) : null}
                  </div>
                </div>
              </Card>

              <Card className="pc-box-section" variant="borderless">
                <div className="pc-box-section-heading">
                  <span className="pc-box-section-icon">
                    <CalendarOutlined size={22} />
                  </span>
                  <Text className="pc-box-section-title">旅游基本信息</Text>
                </div>
                <div className="pc-box-two-column">
                  {matchPreferenceGroups.slice(0, 4).map((group) => (
                    <MatchOptionGroup
                      key={group.key}
                      group={group}
                      selected={matchSelections[group.key] ?? group.options[0]}
                      onSelect={handleMatchSelect}
                    />
                  ))}
                </div>
              </Card>

              <Card className="pc-box-section" variant="borderless">
                <div className="pc-box-section-heading">
                  <span className="pc-box-section-icon">
                    <GiftOutlined size={22} />
                  </span>
                  <Text className="pc-box-section-title">抽取惊喜程度</Text>
                </div>
                <MatchOptionGroup
                  group={matchPreferenceGroups[4]}
                  selected={
                    matchSelections[matchPreferenceGroups[4].key] ??
                    matchPreferenceGroups[4].options[0]
                  }
                  onSelect={handleMatchSelect}
                  variant="surprise"
                />
              </Card>
            </div>

            <aside className="pc-box-visual" aria-label="当前抽取范围预览">
              <div className="pc-box-visual-map" aria-hidden="true"><i /><i /><i /><span /></div>
              <div className="pc-box-visual-image">
                <img src={cityPreviewImages[destinationCityOption?.name ?? '北京'] ?? cityPreviewImages['北京']} alt={`${destinationCityOption?.name ?? '北京'}城市预览`} />
                <div className="pc-box-visual-image-shade" />
                <span>已锁定目的地</span>
                <div className="pc-box-visual-city">
                  <small>DESTINATION</small>
                  <strong>{destinationCityOption?.name ?? '北京'}</strong>
                </div>
              </div>
              <div className="pc-box-visual-copy">
                <h2>下一段旅程，交给一点随机。</h2>
                <p>我们会在这座城市里，按你的偏好抽出一套刚刚好的玩法。</p>
              </div>
              <div className="pc-box-visual-signals">
                <span><small>出游时长</small><b>{matchSelections.travelDuration ?? '当天'}</b></span>
                <span><small>预算方式</small><b>{matchSelections.budget ?? '划算出行'}</b></span>
                <span><small>期待氛围</small><b>{matchSelections.mood ?? '放松'}</b></span>
              </div>
              <div className="pc-box-visual-range">
                <div><small>随机探索程度</small><b>{matchSelections.surpriseLevel ?? '中度'}</b></div>
                <i><span style={{ width: `${surpriseLevelValues[matchSelections.surpriseLevel] ?? 60}%` }} /></i>
              </div>
            </aside>
            </div>

            <div className="pc-box-action">
              <div className="pc-box-summary">
                <Text className="pc-box-summary-value">
                  {`${locatedCity.name} → ${destinationCityOption?.name ?? '请选择目的地'} · `}
                  {matchPreferenceGroups
                    .map((group) => matchSelections[group.key] ?? group.options[0])
                    .join(' · ')}
                </Text>
                {drawError ? <Text className="pc-box-error">{drawError}</Text> : null}
              </div>
              <Space className="pc-box-action-buttons" size={12}>
                <Button
                  className="pc-box-start-button"
                  type="primary"
                  size="large"
                  icon={<GiftOutlined />}
                  disabled={isBooting}
                  loading={isStartingDraw}
                  onClick={() => goStart('/box/slot-preview')}>
                  {isStartingDraw ? '正在抽取…' : '立即抽取'}
                </Button>
              </Space>
            </div>
          </Content>
        </Layout>
      </div>
    </ConfigProvider>
  );
}

function MatchOptionGroup({
  group,
  onSelect,
  selected,
  variant = 'default',
}: {
  group: MatchPreferenceGroup;
  onSelect: (key: MatchPreferenceGroup['key'], option: string) => void;
  selected: string;
  variant?: 'default' | 'surprise';
}) {
  return (
    <div className={`pc-box-group pc-box-group-${variant}`}>
      <Text className="pc-box-label">{group.label}</Text>
      <Tag.CheckableTagGroup
        aria-label={group.label}
        className={`pc-box-options pc-box-options-${group.options.length}`}
        options={group.options.map((option) => ({
          label:
            variant === 'surprise' ? (
              <span className="pc-box-surprise-option">
                <span className="pc-box-surprise-title"><i aria-hidden="true" /><strong>{option}</strong></span>
                <small>{group.descriptions?.[option]}</small>
              </span>
            ) : (
              option
            ),
          value: option,
        }))}
        value={selected}
        onChange={(value) => {
          if (value !== null) {
            onSelect(group.key, String(value));
          }
        }}
      />
    </div>
  );
}

const pcBoxCss = `
.pc-box-page {
  min-height: 100dvh;
  color: ${boxToken.ink};
  background:
    radial-gradient(circle at 12% 8%, rgba(142, 200, 255, 0.16), transparent 25%),
    linear-gradient(180deg, ${boxToken.primarySoft} 0%, ${boxToken.canvas} 38%, #ffffff 100%);
}

.pc-box-layout {
  min-height: 100dvh;
  background: transparent;
}

.pc-box-header {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 76px;
  padding: 0 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  line-height: normal;
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(225, 232, 213, 0.86);
  backdrop-filter: blur(18px);
}

.pc-box-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 148px;
  color: ${boxToken.ink};
  font-size: 18px;
  font-weight: 900;
  text-decoration: none;
}

.pc-box-brand img {
  width: 38px;
  height: 38px;
  object-fit: contain;
}

.pc-box-nav {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 26px;
}

.pc-box-nav a {
  display: inline-block;
  line-height: 1.2;
  padding-bottom: 6px;
  border-bottom: 3px solid transparent;
  color: ${boxToken.text};
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.pc-box-nav a:hover,
.pc-box-nav a.active {
  color: ${boxToken.primary};
}

.pc-box-nav a.active {
  border-bottom-color: ${boxToken.primary};
}

.pc-box-content {
  width: min(100% - 40px, 850px);
  margin: 0 auto;
  padding: 64px 0 72px;
}

.pc-box-title {
  margin-bottom: 44px;
  text-align: center;
}

.pc-box-title-icons {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
  color: ${boxToken.primary};
}

.pc-box-title-icons span {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 8px 20px rgba(77, 111, 22, 0.1);
}

.pc-box-title-icons span:nth-child(2) {
  transform: translateY(-4px);
}

.pc-box-title h1.ant-typography {
  margin: 0;
  color: ${boxToken.ink};
  font-size: 40px;
  line-height: 1.2;
  font-weight: 900;
}

.pc-box-title p.ant-typography,
.pc-box-title div.ant-typography {
  max-width: 680px;
  margin: 14px auto 0;
  color: ${boxToken.text};
  font-size: 16px;
  line-height: 1.75;
}

.pc-box-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.pc-box-section.ant-card {
  border: 1px solid rgba(225, 232, 213, 0.78);
  border-radius: ${radii['2xl']}px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 42px rgba(77, 111, 22, 0.1);
}

.pc-box-section .ant-card-body {
  padding: 30px 32px 32px;
}

.pc-box-section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.pc-box-section-icon {
  width: 48px;
  height: 48px;
  border-radius: ${radii.lg}px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${boxToken.primarySoft}, rgba(142, 200, 255, 0.16));
  color: ${boxToken.primary};
}

.pc-box-section-title {
  color: ${boxToken.ink};
  font-size: 20px;
  font-weight: 900;
}

.pc-box-two-column {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.pc-box-location,
.pc-box-group {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pc-box-location-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.pc-box-city-select.ant-select { width: 100%; height: 48px; }
.pc-box-city-select .ant-select-selector {
  padding-inline: 17px !important;
  border: 1px solid rgba(53,66,38,.08) !important;
  border-radius: ${radii.pill}px !important;
  background: #F4F7EE !important;
  box-shadow: none !important;
  font-weight: 800;
}

.pc-box-locate-button.ant-btn {
  height: 48px;
  padding-inline: 17px;
  border: 1px solid rgba(201,255,98,.2);
  border-radius: ${radii.pill}px;
  color: #4D6F16;
  background: rgba(201,255,98,.07);
  font-weight: 850;
}

.pc-box-locate-button.ant-btn:hover {
  border-color: rgba(201,255,98,.42) !important;
  color: #4D6F16 !important;
  background: rgba(201,255,98,.12) !important;
}

.pc-box-label {
  color: ${boxToken.ink};
  font-size: 14px;
  font-weight: 800;
}

.pc-box-location-button.ant-btn {
  width: 100%;
  height: 48px;
  padding: 0 18px;
  border: 2px solid transparent;
  border-radius: ${radii.pill}px;
  background: ${boxToken.canvas};
  color: ${boxToken.ink};
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  font-weight: 800;
}

.pc-box-location-button.ant-btn:hover {
  border-color: rgba(126, 166, 31, 0.42);
  background: ${boxToken.surface};
}

.pc-box-location-button .pc-box-icon {
  color: ${boxToken.primary};
}

.pc-box-location-value {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-box-location-hint {
  flex-shrink: 0;
  color: #6F9821;
  font-size: 12px;
  font-weight: 800;
}

.pc-box-options.ant-tag-checkable-group {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pc-box-options .ant-tag-checkable-group-item.ant-tag {
  min-width: 84px;
  min-height: 44px;
  margin: 0;
  padding: 0 18px;
  border: 2px solid transparent;
  border-radius: ${radii.pill}px;
  background: ${boxToken.canvas};
  color: ${boxToken.text};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, color 160ms ease, box-shadow 160ms ease;
}

.pc-box-options .ant-tag-checkable-group-item.ant-tag:hover {
  color: ${boxToken.primaryDark};
  transform: translateY(-2px);
}

.pc-box-options .ant-tag-checkable-group-item.ant-tag-checkable-checked {
  background: linear-gradient(135deg, ${boxToken.primary}, ${boxToken.primaryDark});
  color: ${boxToken.surface};
  box-shadow: 0 8px 20px rgba(126, 166, 31, 0.24);
}

.pc-box-group-surprise .pc-box-label {
  display: none;
}

.pc-box-group-surprise .pc-box-options.ant-tag-checkable-group {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag {
  min-width: 0;
  min-height: 152px;
  padding: 24px 16px;
  border-radius: ${radii.xl}px;
  text-align: center;
  white-space: normal;
  transition: none;
}

.pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag:hover,
.pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag:focus-visible {
  transform: none;
}

.pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag-checkable-checked {
  border-color: ${boxToken.primary};
  background: ${boxToken.surface};
  color: ${boxToken.primaryDark};
}

.pc-box-surprise-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.pc-box-surprise-option strong {
  font-size: 17px;
}

.pc-box-surprise-option small {
  color: ${boxToken.muted};
  font-size: 13px;
  line-height: 1.5;
}

.pc-box-action {
  margin-top: 34px;
  padding: 24px 28px;
  border: 1px solid rgba(203, 216, 185, 0.9);
  border-radius: ${radii['2xl']}px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 44px rgba(77, 111, 22, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.pc-box-summary {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.pc-box-summary-label {
  color: ${boxToken.muted};
  font-size: 12px;
  font-weight: 800;
}

.pc-box-summary-value {
  overflow: hidden;
  color: ${boxToken.ink};
  font-size: 15px;
  font-weight: 900;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-box-error {
  color: ${palette.error};
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
}

.pc-box-location-notice {
  color: #4D6F16;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.55;
}

.pc-box-destination-hint {
  color: ${boxToken.muted};
  font-size: 12px;
  font-weight: 650;
  line-height: 1.55;
}

.pc-box-action-buttons.ant-space {
  flex-shrink: 0;
}

.pc-box-reroll-button.ant-btn {
  min-width: 210px;
  height: 56px;
  border: 1px solid rgba(126, 166, 31, 0.44);
  border-radius: ${radii.pill}px;
  background: ${boxToken.surface};
  color: ${boxToken.primaryDark};
  font-size: 17px;
  font-weight: 900;
}

.pc-box-reroll-button.ant-btn:not(:disabled):hover {
  border-color: ${boxToken.primary};
  background: ${boxToken.primarySoft};
  color: ${boxToken.primaryDark};
}

.pc-box-start-button.ant-btn {
  min-width: 210px;
  height: 56px;
  border: 0;
  border-radius: ${radii.pill}px;
  background: linear-gradient(135deg, ${boxToken.primary}, ${boxToken.primaryDark});
  color: ${boxToken.surface};
  box-shadow: 0 14px 30px rgba(126, 166, 31, 0.28);
  font-size: 17px;
  font-weight: 900;
}

.pc-box-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: -0.125em;
}

@media (max-width: 1180px) {
  .pc-box-header {
    padding: 0 28px;
  }

  .pc-box-nav {
    display: none;
  }
}

@media (max-width: 720px) {
  .pc-box-header {
    height: auto;
    padding: 14px 18px;
  }

  .pc-box-header .ant-space {
    display: none;
  }

  .pc-box-content {
    width: min(100% - 36px, 850px);
    padding: 42px 0 48px;
  }

  .pc-box-title {
    margin-bottom: 30px;
  }

  .pc-box-title h1.ant-typography {
    font-size: 32px;
  }

  .pc-box-section .ant-card-body {
    padding: 24px 20px;
  }

  .pc-box-two-column {
    grid-template-columns: 1fr;
  }

  .pc-box-group-surprise .pc-box-options.ant-tag-checkable-group {
    grid-template-columns: 1fr;
  }

  .pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag {
    min-height: 120px;
  }

  .pc-box-action {
    align-items: stretch;
    flex-direction: column;
    padding: 22px 20px;
  }

  .pc-box-start-button.ant-btn {
    width: 100%;
  }

  .pc-box-action-buttons.ant-space {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
  }

  .pc-box-action-buttons .ant-space-item,
  .pc-box-reroll-button.ant-btn {
    width: 100%;
  }
}

/* Quest setup visual language shared with the refreshed PC landing page. */
.pc-box-page {
  --quest-lime: #c9ff62;
  --quest-cyan: #78e8ff;
  --quest-purple: #6f9821;
  background:
    radial-gradient(circle at 18% 2%, rgba(201,255,98,.34), transparent 25%),
    radial-gradient(circle at 83% 8%, rgba(120,232,255,.12), transparent 22%),
    linear-gradient(180deg, #11101c 0, #171426 430px, #F4F7EE 430px, #FAFBF7 100%);
}

.pc-box-page::before {
  content: "";
  position: absolute;
  inset: 76px 0 auto;
  height: 355px;
  pointer-events: none;
  opacity: .25;
  background-image: radial-gradient(rgba(255,255,255,.3) .75px, transparent .75px);
  background-size: 18px 18px;
}

.pc-box-content {
  position: relative;
  width: min(100% - 56px, 980px);
  padding-top: 54px;
}

.pc-box-title { margin-bottom: 40px; }

.pc-box-kicker {
  width: fit-content;
  min-height: 30px;
  margin: 0 auto 18px;
  padding: 0 12px;
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 999px;
  color: rgba(255,255,255,.65);
  background: rgba(255,255,255,.06);
  display: flex;
  align-items: center;
  gap: 9px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .12em;
}

.pc-box-kicker span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--quest-lime);
  box-shadow: 0 0 14px rgba(201,255,98,.8);
}

.pc-box-title h1.ant-typography {
  color: #fff;
  font-size: clamp(40px, 4vw, 58px);
  letter-spacing: -.045em;
}

.pc-box-title p.ant-typography,
.pc-box-title div.ant-typography {
  color: rgba(255,255,255,.62);
  font-size: 16px;
}

.pc-box-sections { gap: 18px; }

.pc-box-section.ant-card {
  border: 1px solid rgba(53,66,38,.08);
  border-radius: 28px;
  background: rgba(255,255,255,.98);
  box-shadow: 0 22px 60px rgba(77,111,22,.11);
}

.pc-box-section .ant-card-body { padding: 30px 34px 34px; }

.pc-box-section-icon {
  border-radius: 15px;
  color: #171520;
  background: var(--quest-lime);
}

.pc-box-section-title { color: #171522; }

.pc-box-location-button.ant-btn,
.pc-box-options .ant-tag-checkable-group-item.ant-tag {
  border: 1px solid rgba(53,66,38,.08);
  background: #F4F7EE;
}

.pc-box-options .ant-tag-checkable-group-item.ant-tag-checkable-checked {
  border-color: #171522;
  color: #fff;
  background: #171522;
  box-shadow: 0 9px 22px rgba(23,21,34,.18);
}

.pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag-checkable-checked {
  border-color: var(--quest-purple);
  color: #4D6F16;
  background: linear-gradient(145deg, rgba(201,255,98,.34), rgba(120,232,255,.16));
  box-shadow: 0 14px 34px rgba(77,111,22,.12);
}

.pc-box-action {
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 26px;
  color: #fff;
  background: #171522;
  box-shadow: 0 22px 60px rgba(23,21,34,.22);
}

.pc-box-summary-label { color: rgba(255,255,255,.46); }
.pc-box-summary-value { color: #fff; }

.pc-box-start-button.ant-btn {
  border-radius: 16px;
  color: #171520;
  background: var(--quest-lime);
  box-shadow: 0 14px 32px rgba(201,255,98,.18);
}

.pc-box-start-button.ant-btn:not(:disabled):hover {
  color: #171520;
  background: #dcff9b;
}

/* Keep the atmospheric background while using light, readable control cards. */
.pc-box-page {
  color: #f7f7f2;
  background:
    radial-gradient(circle at 12% 4%, rgba(201,255,98,.16), transparent 29%),
    radial-gradient(circle at 88% 12%, rgba(120,232,255,.13), transparent 30%),
    linear-gradient(145deg, #111419 0%, #101018 50%, #111712 100%);
  background-attachment: fixed;
}

.pc-box-page::before {
  position: fixed;
  inset: 84px 0 0;
  height: auto;
  opacity: .2;
  mask-image: linear-gradient(to bottom, black, transparent 72%);
}

.pc-box-content {
  width: min(100% - 64px, 1080px);
  padding-top: 78px;
  padding-bottom: 96px;
}

.pc-box-title { margin-bottom: 48px; }
.pc-box-title h1.ant-typography { font-size: clamp(44px, 4.2vw, 64px); line-height: 1.06; }
.pc-box-title p.ant-typography { max-width: 760px; color: rgba(255,255,255,.54); }
.pc-box-sections { gap: 22px; }

.pc-box-section.ant-card {
  overflow: hidden;
  border: 1px solid rgba(225,231,217,.96);
  border-radius: 24px;
  color: #171c18;
  background: rgba(251,252,248,.98);
  box-shadow: 0 22px 58px rgba(0,0,0,.2);
}

.pc-box-section .ant-card-body { padding: 38px 42px 42px; }
.pc-box-section-heading { margin-bottom: 28px; }
.pc-box-section-icon { width: 44px; height: 44px; border-radius: 13px; box-shadow: 0 8px 24px rgba(201,255,98,.12); }
.pc-box-section-title { color: #171c18; font-size: 22px; }
.pc-box-label { color: #252b26; font-size: 16px; }
.pc-box-location-notice, .pc-box-destination-hint { color: #767d76; font-size: 14px; line-height: 1.65; }

.pc-box-city-select .ant-select-selector,
.pc-box-location-button.ant-btn,
.pc-box-options .ant-tag-checkable-group-item.ant-tag {
  border-color: #dfe5da !important;
  color: #3f4740;
  background: #f1f4ed !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.7) !important;
}

.pc-box-city-select .ant-select-selection-item,
.pc-box-city-select .ant-select-arrow { color: #4c554d; }
.pc-box-locate-button.ant-btn { border-color: #b8d37e; color: #4d6f16; background: #eff8dc; font-size: 15px; }
.pc-box-locate-button.ant-btn:hover { border-color: #90b549 !important; color: #38550b !important; background: #e6f6c5 !important; }
.pc-box-options .ant-tag-checkable-group-item.ant-tag { min-height: 48px; font-size: 16px; }
.pc-box-options .ant-tag-checkable-group-item.ant-tag:hover { border-color: #a7c76a !important; color: #4d6f16; background: #edf5df !important; }
.pc-box-options .ant-tag-checkable-group-item.ant-tag-checkable-checked {
  border-color: #9ccc43 !important;
  color: #111419;
  background: #c9ff62 !important;
  box-shadow: 0 10px 26px rgba(111,152,33,.17) !important;
}

.pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag { min-height: 168px; }
.pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag-checkable-checked { color: #111419; background: linear-gradient(145deg,#c9ff62,#aeeeff) !important; }
.pc-box-group-surprise .pc-box-surprise-option strong { font-size: 20px; }
.pc-box-group-surprise .pc-box-surprise-option small { color: #646d65; font-size: 15px; line-height: 1.7; opacity: 1; }

.pc-box-action {
  border-color: rgba(225,231,217,.96);
  color: #171c18;
  background: rgba(251,252,248,.98);
  box-shadow: 0 24px 60px rgba(0,0,0,.22);
}
.pc-box-summary-label { color: #7a827a; font-size: 13px; }
.pc-box-summary-value { color: #252b26; font-size: 16px; line-height: 1.6; }

@media (max-width: 720px) {
  .pc-box-page {
    background: radial-gradient(circle at 20% 0, rgba(201,255,98,.13), transparent 30%), linear-gradient(145deg,#111419,#101018 58%,#111712);
  }
  .pc-box-content { width: min(100% - 28px, 980px); padding-top: 38px; }
  .pc-box-title h1.ant-typography { font-size: 39px; }
  .pc-box-title p.ant-typography,
  .pc-box-title div.ant-typography { font-size: 14px; }
  .pc-box-section .ant-card-body { padding: 24px 19px; }
  .pc-box-location-controls { grid-template-columns: 1fr; }
  .pc-box-locate-button.ant-btn { width: 100%; }
}

/* Dark mission configurator shared with the landing page and trip archive. */
.pc-box-content { width: min(100% - 72px, 1280px); padding-top: 68px; }
.pc-box-title { margin-bottom: 50px; text-align: left; }
.pc-box-title h1.ant-typography { max-width: 920px; color: #f7f7f2; font-size: clamp(58px, 5.4vw, 88px); font-weight: 860; line-height: .98; letter-spacing: -.06em; }
.pc-box-title h1.ant-typography::after { content: ''; display: block; width: 54px; height: 4px; margin-top: 22px; border-radius: 4px; background: #c9ff62; box-shadow: 0 0 18px rgba(201,255,98,.24); }
.pc-box-title p.ant-typography { margin: 20px 0 0; color: rgba(255,255,255,.52); font-size: 17px; }
.pc-box-sections { gap: 18px; }
.pc-box-section.ant-card { border: 1px solid rgba(255,255,255,.15); border-radius: 26px; color: #f7f7f2; background: rgba(8,9,11,.9); box-shadow: 0 22px 58px rgba(0,0,0,.22); }
.pc-box-section.ant-card:hover { border-color: rgba(201,255,98,.34); }
.pc-box-section .ant-card-body { padding: 34px 38px 38px; }
.pc-box-section-heading { margin-bottom: 30px; }
.pc-box-section-icon { width: 46px; height: 46px; color: #11150d; background: #c9ff62; box-shadow: 0 0 22px rgba(201,255,98,.12); }
.pc-box-section-title { color: #f7f7f2; font-size: 23px; }
.pc-box-label { color: rgba(255,255,255,.72); font-size: 14px; letter-spacing: .03em; }
.pc-box-location-notice, .pc-box-destination-hint { color: rgba(255,255,255,.4); }
.pc-box-city-select.ant-select { height: 54px; }
.pc-box-city-select .ant-select-selector { min-height: 54px; padding-inline: 19px !important; border-color: rgba(255,255,255,.13) !important; color: #fff !important; background: #141619 !important; box-shadow: none !important; }
.pc-box-city-select .ant-select-selection-item, .pc-box-city-select .ant-select-selection-placeholder, .pc-box-city-select .ant-select-arrow { color: rgba(255,255,255,.78) !important; font-size: 15px; }
.pc-box-page .pc-box-city-select.ant-select .ant-select-selector { border: 1px solid rgba(255,255,255,.16) !important; color: #fff !important; background: #141619 !important; box-shadow: inset 0 1px rgba(255,255,255,.035) !important; }
.pc-box-page .pc-box-city-select.ant-select:hover .ant-select-selector, .pc-box-page .pc-box-city-select.ant-select-focused .ant-select-selector { border-color: rgba(201,255,98,.64) !important; box-shadow: 0 0 0 3px rgba(201,255,98,.07) !important; }
.pc-box-page .pc-box-city-select .ant-select-selection-item { color: #f7f7f2 !important; font-weight: 820; }
.pc-box-locate-button.ant-btn { height: 54px; border-color: rgba(201,255,98,.34); color: #c9ff62; background: rgba(201,255,98,.065); }
.pc-box-locate-button.ant-btn:hover { border-color: #c9ff62 !important; color: #c9ff62 !important; background: rgba(201,255,98,.11) !important; }
.pc-box-options.ant-tag-checkable-group { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 10px; }
.pc-box-options.pc-box-options-3 { grid-template-columns: repeat(3,minmax(0,1fr)); }
.pc-box-options.pc-box-options-5 { grid-template-columns: repeat(5,minmax(0,1fr)); }
.pc-box-options .ant-tag-checkable-group-item.ant-tag { width: 100%; min-width: 0; min-height: 52px; padding: 0 14px; border: 1px solid rgba(255,255,255,.12) !important; color: rgba(255,255,255,.68); background: #141619 !important; box-shadow: none !important; font-size: 15px; }
.pc-box-options .ant-tag-checkable-group-item.ant-tag:hover { border-color: rgba(201,255,98,.6) !important; color: #fff; background: #191d18 !important; transform: translateY(-2px); }
.pc-box-options .ant-tag-checkable-group-item.ant-tag-checkable-checked { border-color: #c9ff62 !important; color: #11150d; background: #c9ff62 !important; box-shadow: 0 0 24px rgba(201,255,98,.12) !important; }
.pc-box-options .ant-tag-checkable-group-item.ant-tag-checkable-checked, .pc-box-options .ant-tag-checkable-group-item.ant-tag-checkable-checked * { font-weight: 950 !important; }
.pc-box-group-surprise .pc-box-options.ant-tag-checkable-group { grid-template-columns: repeat(3,minmax(0,1fr)); gap: 14px; }
.pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag { min-height: 154px; border-radius: 20px; color: rgba(255,255,255,.66); background: #121416 !important; }
.pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag:hover { background: #171a17 !important; }
.pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag-checkable-checked { color: #11150d; border-color: #c9ff62 !important; background: #c9ff62 !important; }
.pc-box-group-surprise .pc-box-surprise-option strong { color: inherit; font-size: 23px; }
.pc-box-group-surprise .pc-box-surprise-option small { max-width: 260px; color: inherit; font-size: 14px; line-height: 1.55; opacity: .7; }
.pc-box-action { position: sticky; z-index: 12; bottom: 18px; margin-top: 24px; padding: 19px 20px 19px 26px; border: 1px solid rgba(255,255,255,.16); border-radius: 22px; color: #fff; background: rgba(9,10,12,.88); box-shadow: 0 24px 68px rgba(0,0,0,.38); backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px); }
.pc-box-summary-label { color: rgba(255,255,255,.38); }
.pc-box-summary-value { color: #fff; }
.pc-box-start-button.ant-btn { min-width: 230px; height: 58px; border-radius: 999px; color: #11150d; background: #c9ff62; font-size: 17px; }

@media (max-width: 900px) {
  .pc-box-content { width: min(100% - 36px, 1280px); }
  .pc-box-title h1.ant-typography { font-size: 54px; }
  .pc-box-options.ant-tag-checkable-group { grid-template-columns: repeat(2,minmax(0,1fr)); }
}

@media (max-width: 720px) {
  .pc-box-content { width: min(100% - 28px, 1280px); padding-top: 38px; }
  .pc-box-title h1.ant-typography { font-size: 42px; }
  .pc-box-section .ant-card-body { padding: 25px 20px; }
  .pc-box-group-surprise .pc-box-options.ant-tag-checkable-group { grid-template-columns: 1fr; }
  .pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag { min-height: 118px; }
  .pc-box-action { bottom: 10px; }
}

/* Shared first-level page frame: aligned to the landing page's 7.4vw content edge. */
.pc-box-content { width: 85.2vw; max-width: none; padding: 64px 0 96px; }

@media (max-width: 1023px) { .pc-box-content { width: 88vw; padding: 52px 0 80px; } }
@media (max-width: 720px) { .pc-box-content { width: calc(100% - 32px); padding: 34px 0 56px; } }

/* Night Explorer workbench: one continuous setup flow plus a live travel visual. */
.pc-box-workbench { display: grid; grid-template-columns: minmax(0,1.45fr) minmax(330px,.72fr); align-items: stretch; gap: 22px; }
.pc-box-sections { gap: 0; overflow: hidden; border: 1px solid rgba(255,255,255,.14); border-radius: 28px; background: rgba(8,9,11,.84); box-shadow: 0 24px 64px rgba(0,0,0,.24); }
.pc-box-city-picker { width: 100%; }
.pc-box-location-controls { display: block; }
.pc-box-page .pc-box-city-select.ant-select { width: 100%; height: 66px; }
.pc-box-page .pc-box-city-picker .pc-box-city-select.ant-select:not(.ant-select-customize-input) .ant-select-selector { min-height: 66px; padding-inline: 30px 22px !important; border: 1px solid rgba(255,255,255,.14) !important; border-radius: 18px !important; color: rgba(255,255,255,.68) !important; background: #121416 !important; background-color: #121416 !important; box-shadow: none !important; transition: border-color .2s ease,background-color .2s ease,box-shadow .2s ease; }
.pc-box-page .pc-box-city-picker .pc-box-city-select.ant-select.is-selected .ant-select-selector { border-color: #c9ff62 !important; background: #182014 !important; background-color: #182014 !important; box-shadow: inset 0 0 0 1px rgba(201,255,98,.08),0 0 18px rgba(201,255,98,.07) !important; }
.pc-box-page .pc-box-city-picker .pc-box-city-select.ant-select.is-selected .ant-select-selection-item { color: #dfffaa !important; }
.pc-box-page .pc-box-city-select .ant-select-selection-item, .pc-box-page .pc-box-city-select .ant-select-selection-placeholder { color: #f5f7f1 !important; font-size: 17px; font-weight: 800; }
.pc-box-page .pc-box-city-select .ant-select-arrow { color: rgba(201,255,98,.72) !important; font-size: 13px; }
.pc-box-page .pc-box-city-select.ant-select:hover .ant-select-selector, .pc-box-page .pc-box-city-select.ant-select-focused .ant-select-selector { border-color: #c9ff62 !important; background: rgba(201,255,98,.11) !important; box-shadow: 0 0 0 3px rgba(201,255,98,.07),0 0 22px rgba(201,255,98,.08) !important; }
.pc-box-city-dropdown { padding: 8px !important; border: 1px solid rgba(255,255,255,.13); border-radius: 16px !important; background: #15181a !important; box-shadow: 0 20px 50px rgba(0,0,0,.42) !important; }
.pc-box-city-dropdown .ant-select-item { min-height: 42px; padding: 10px 12px; border-radius: 10px; color: rgba(255,255,255,.7); }
.pc-box-city-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled) { background: rgba(255,255,255,.06) !important; }
.pc-box-city-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) { color: #dcff9a !important; font-weight: 800; background: rgba(201,255,98,.1) !important; }
.pc-box-section.ant-card, .pc-box-section.ant-card:hover { border: 0; border-bottom: 1px solid rgba(255,255,255,.11); border-radius: 0; background: transparent; box-shadow: none; }
.pc-box-section.ant-card:last-child { border-bottom: 0; }
.pc-box-section .ant-card-body { padding: 32px 34px 36px; }
.pc-box-section-icon { color: #c9ff62; border: 1px solid rgba(201,255,98,.34); background: rgba(201,255,98,.055); box-shadow: none; }
.pc-box-options .ant-tag-checkable-group-item.ant-tag-checkable-checked { position: relative; color: #dfffaa; border-color: #c9ff62 !important; background: #182014 !important; box-shadow: inset 0 0 0 1px rgba(201,255,98,.08),0 0 18px rgba(201,255,98,.07) !important; }
.pc-box-options .ant-tag-checkable-group-item.ant-tag-checkable-checked::before { content: ''; width: 7px; height: 7px; margin-right: 8px; border-radius: 50%; background: #c9ff62; box-shadow: 0 0 10px rgba(201,255,98,.7); }
.pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag-checkable-checked::before { display: none; }
.pc-box-surprise-title { display: inline-flex; align-items: center; justify-content: center; gap: 10px; }
.pc-box-surprise-title i { display: none; width: 8px; height: 8px; flex: 0 0 auto; border-radius: 50%; background: #c9ff62; box-shadow: 0 0 11px rgba(201,255,98,.76); }
.pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag-checkable-checked .pc-box-surprise-title i { display: block; }
.pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag { position: relative; overflow: hidden; }
.pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag::after { content: ''; position: absolute; inset: 0 0 auto; height: 3px; opacity: 0; background: #c9ff62; box-shadow: 0 0 16px rgba(201,255,98,.4); }
.pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag-checkable-checked { color: #efffda; background: linear-gradient(145deg,#182014,#111719) !important; }
.pc-box-group-surprise .ant-tag-checkable-group-item.ant-tag-checkable-checked::after { opacity: 1; }
.pc-box-visual { position: sticky; top: 96px; align-self: stretch; min-height: 100%; overflow: hidden; border: 1px solid rgba(255,255,255,.15); border-radius: 28px; background: #090b0d; box-shadow: 0 24px 64px rgba(0,0,0,.28); display: flex; flex-direction: column; }
.pc-box-visual-map { position: absolute; inset: 0; overflow: hidden; opacity: .32; background-image: linear-gradient(rgba(120,232,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(120,232,255,.08) 1px,transparent 1px); background-size: 34px 34px; mask-image: linear-gradient(to bottom,black,transparent 65%); }
.pc-box-visual-map i { position: absolute; width: 8px; height: 8px; border: 2px solid #c9ff62; border-radius: 50%; box-shadow: 0 0 15px rgba(201,255,98,.55); }
.pc-box-visual-map i:nth-child(1) { top: 8%; left: 14%; }.pc-box-visual-map i:nth-child(2) { top: 19%; right: 13%; }.pc-box-visual-map i:nth-child(3) { top: 43%; left: 22%; }
.pc-box-visual-map span { position: absolute; top: 11%; left: 16%; width: 68%; height: 30%; border: 1px dashed rgba(201,255,98,.45); border-width: 1px 1px 0 0; border-radius: 50%; transform: rotate(8deg); }
.pc-box-visual-image { position: relative; flex: 1 1 440px; min-height: 400px; overflow: hidden; }
.pc-box-visual-image img { width: 100%; height: 100%; display: block; object-fit: cover; filter: saturate(.82) brightness(.72); }
.pc-box-visual-image-shade { position: absolute; inset: 0; background: linear-gradient(180deg,rgba(5,7,8,.08) 32%,rgba(9,11,13,.18) 58%,#090b0d 100%); }
.pc-box-visual-image > span { position: absolute; top: 22px; right: 22px; padding: 8px 12px; border: 1px solid rgba(201,255,98,.48); border-radius: 999px; color: #dcff9a; background: rgba(7,9,9,.72); font-size: 10px; font-weight: 750; letter-spacing: .08em; backdrop-filter: blur(12px); }
.pc-box-visual-city { position: absolute; left: 28px; right: 28px; bottom: 28px; }
.pc-box-visual-city small { display: block; margin-bottom: 10px; color: #c9ff62; font: 800 9px/1 ui-monospace,monospace; letter-spacing: .16em; }
.pc-box-visual-city strong { display: block; color: #fff; font-size: clamp(50px,4.3vw,68px); line-height: .92; letter-spacing: -.065em; text-shadow: 0 7px 28px rgba(0,0,0,.45); }
.pc-box-visual-copy { position: relative; padding: 24px 30px 22px; }
.pc-box-visual-copy h2 { margin: 0; color: #fff; font-size: clamp(23px,1.7vw,29px); line-height: 1.2; letter-spacing: -.035em; }
.pc-box-visual-copy p { max-width: 430px; margin: 11px 0 0; color: rgba(255,255,255,.5); font-size: 13px; line-height: 1.65; }
.pc-box-visual-signals { position: relative; display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); margin: 0 30px; padding: 20px 0; border-top: 1px solid rgba(255,255,255,.1); border-bottom: 1px solid rgba(255,255,255,.1); }
.pc-box-visual-signals span { min-width: 0; padding: 0 14px; border-right: 1px solid rgba(255,255,255,.09); }
.pc-box-visual-signals span:first-child { padding-left: 0; }
.pc-box-visual-signals span:last-child { padding-right: 0; border-right: 0; }
.pc-box-visual-signals small { display: block; margin-bottom: 7px; color: rgba(255,255,255,.34); font-size: 9px; letter-spacing: .04em; }
.pc-box-visual-signals b { display: block; overflow: hidden; color: #f7f8f4; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.pc-box-visual-range { position: relative; margin: 24px 30px 32px; }
.pc-box-visual-range div { display: flex; align-items: center; justify-content: space-between; margin-bottom: 11px; }
.pc-box-visual-range small { color: rgba(255,255,255,.38); font-size: 10px; font-weight: 700; letter-spacing: .05em; }
.pc-box-visual-range b { color: #c9ff62; font-size: 11px; }
.pc-box-visual-range > i { display: block; height: 4px; overflow: hidden; border-radius: 4px; background: rgba(255,255,255,.1); }
.pc-box-visual-range > i > span { display: block; height: 100%; border-radius: inherit; background: #c9ff62; box-shadow: 0 0 14px rgba(201,255,98,.45); transition: width .35s cubic-bezier(.2,.8,.2,1); }
.pc-box-action { width: 100%; }
.pc-box-summary-value { color: #f7f7f2 !important; font-size: clamp(16px,1.15vw,20px); font-weight: 850; line-height: 1.45; }

@media (max-width: 1050px) {
  .pc-box-workbench { grid-template-columns: 1fr; }
  .pc-box-visual { position: relative; top: auto; min-height: 0; display: block; }
  .pc-box-visual-image { height: 370px; min-height: 0; }
  .pc-box-action { width: 100%; }
}

@media (max-width: 720px) {
  .pc-box-visual-image { height: 240px; }
  .pc-box-visual { border-radius: 24px; }
}

`;
