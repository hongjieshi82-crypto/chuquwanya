import CalendarOutlinedSvg from '@ant-design/icons-svg/es/asn/CalendarOutlined';
import CompassOutlinedSvg from '@ant-design/icons-svg/es/asn/CompassOutlined';
import EnvironmentOutlinedSvg from '@ant-design/icons-svg/es/asn/EnvironmentOutlined';
import GiftOutlinedSvg from '@ant-design/icons-svg/es/asn/GiftOutlined';
import ThunderboltOutlinedSvg from '@ant-design/icons-svg/es/asn/ThunderboltOutlined';
import type { AbstractNode, IconDefinition } from '@ant-design/icons-svg/es/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Card, ConfigProvider, Layout, Select, Space, Tag, Typography } from 'antd';
import 'antd/dist/reset.css';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SVGProps } from 'react';
import { useApp } from '@/contexts/app-context';
import { requestDeviceCurrentPosition } from '@/lib/device-location';
import { savePendingPcBoxDraw } from '@/lib/pc-box-open-state';
import { resolveCoordinatesCity } from '@/lib/reverse-geocode';
import { palette, radii } from '@/theme';
import type { City, Preferences } from '@/types';

const { Content } = Layout;
const { Paragraph, Text, Title } = Typography;
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
  { key: 'travelDuration', label: '旅游时间', options: ['当天', '2天', '3天', '4天', '5天'] },
  { key: 'budget', label: '预算', options: ['穷游', '平价', '舒适', '轻奢'] },
  { key: 'mood', label: '心情', options: ['放松', '探索', '热闹'] },
  {
    key: 'surpriseLevel',
    label: '盲盒惊喜程度',
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
  budget: '平价',
  mood: '放松',
  surpriseLevel: '中度',
};

const homepagePresetSelections: Record<string, Partial<Record<string, string>>> = {
  scene: { destinationScope: '全国', mood: '放松', surpriseLevel: '轻度' },
  theme: { destinationScope: '周边', mood: '探索', surpriseLevel: '中度' },
  audience: { partySize: '2 人', mood: '放松', surpriseLevel: '中度' },
  food: { destinationScope: '周边', budget: '平价', mood: '热闹', surpriseLevel: '中度' },
};

const defaultPcLocatedCity: PcLocatedCity = {
  name: '北京',
  latitude: null,
  longitude: null,
  accuracyMeters: null,
  source: 'default',
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

const budgetValues: Record<string, number | null> = {
  穷游: 200,
  平价: 500,
  舒适: 1000,
  轻奢: 2000,
};

function resolveBudgetMax(option: string) {
  return Object.prototype.hasOwnProperty.call(budgetValues, option)
    ? budgetValues[option] ?? null
    : 100;
}

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
const CompassOutlined = createPcIcon(CompassOutlinedSvg);
const EnvironmentOutlined = createPcIcon(EnvironmentOutlinedSvg);
const GiftOutlined = createPcIcon(GiftOutlinedSvg);
const ThunderboltOutlined = createPcIcon(ThunderboltOutlinedSvg);

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
  const [isLocatingCity, setIsLocatingCity] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
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

  const goStart = useCallback(() => {
    if (isBooting || isStartingDraw) return;

    const partySize = partySizeValues[matchSelections.partySize] ?? 1;
    const budgetMax = resolveBudgetMax(matchSelections.budget);
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
      budgetMax,
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
          : matchSelections.travelDuration === '2天'
            ? '1-2days'
            : matchSelections.travelDuration === '3天'
              ? '1-3days'
              : matchSelections.travelDuration === '4天'
              ? '3-5days'
              : '3-5days',
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
    router.push('/box/open');
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
    const handleShellStart = () => goStart();
    window.addEventListener('pc-box-start-draw', handleShellStart);
    return () => window.removeEventListener('pc-box-start-draw', handleShellStart);
  }, [goStart]);

  const handleLocateCity = async () => {
    if (isLocatingCity) return;

    setIsLocatingCity(true);
    setLocationError(null);
    setLocationNotice(null);
    try {
      const coordinates = await requestDeviceCurrentPosition({ accuracy: 'balanced' });
      let cityName = '当前位置';
      try {
        cityName = await resolveCoordinatesCity(coordinates);
      } catch {
        setLocatedCity({
          name: cityName,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          accuracyMeters: coordinates.accuracy,
          source: 'device',
        });
        await storePcLocatedCity({
          name: cityName,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          accuracyMeters: coordinates.accuracy,
          source: 'device',
        });
        setMatchSelections((previous) => ({ ...previous, destinationScope: '全国' }));
        setLocationNotice('已获取定位坐标；配置高德地图 Web Key 后可显示具体城市，当前按全国探索。');
        return;
      }

      setLocatedCity({
        name: cityName,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        accuracyMeters: coordinates.accuracy,
        source: 'device',
      });
      await storePcLocatedCity({
        name: cityName,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        accuracyMeters: coordinates.accuracy,
        source: 'device',
      });
      const matchedCity = findMatchingCity(cities, cityName);
      if (matchedCity) {
        setSelectedCityId(matchedCity.id);
        setLocationNotice(`已定位到${cityName}，可以直接生成当地玩法。`);
      } else {
        setMatchSelections((previous) => ({ ...previous, destinationScope: '全国' }));
        setLocationNotice(`已定位到${cityName}。当前玩法库未收录该城市，已切换为全国探索。`);
      }
    } catch (reason) {
      setLocationError(reason instanceof Error ? reason.message : '定位城市失败，请重试。');
    } finally {
      setIsLocatingCity(false);
    }
  };

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
    setLocationError(null);
    setLocationNotice(`已切换到${city.name}，将优先生成当地玩法。`);
    void storePcLocatedCity(nextLocatedCity);
  };

  const handleDestinationCitySelect = (cityId: number) => {
    const city = cities.find((item) => item.id === cityId);
    if (!city) return;
    setSelectedCityId(city.id);
    setDrawError(null);
    setLocationNotice(
      city.name === locatedCity.name
        ? `将生成${city.name}本地玩法。`
        : `已指定从${locatedCity.name}前往${city.name}，系统不会随机更换目的地城市。`,
    );
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
            <header className="pc-box-title">
              <div className="pc-box-kicker">
                <span aria-hidden="true" />
                NEW QUEST / SETUP
              </div>
              <div className="pc-box-title-icons" aria-hidden="true">
                <span><ThunderboltOutlined size={22} /></span>
                <span><CompassOutlined size={22} /></span>
                <span><GiftOutlined size={22} /></span>
              </div>
              <Title>配置你的周末任务</Title>
              <Paragraph>
                选好出发地、预算和心情，AI 会把它们组合成一条现在就能执行的城市冒险。
              </Paragraph>
            </header>

            <div className="pc-box-sections">
              <Card className="pc-box-section" variant="borderless">
                <div className="pc-box-section-heading">
                  <span className="pc-box-section-icon">
                    <EnvironmentOutlined size={22} />
                  </span>
                  <Text className="pc-box-section-title">出发与目的地</Text>
                </div>
                <div className="pc-box-two-column">
                  <div className="pc-box-location">
                    <Text className="pc-box-label">出发地</Text>
                    <div className="pc-box-location-controls">
                      <Select
                        aria-label="选择出发城市"
                        className="pc-box-city-select"
                        options={cities.map((city) => ({ label: `${city.name} · ${city.province}`, value: city.id }))}
                        placeholder={locatedCity.name}
                        showSearch
                        optionFilterProp="label"
                        value={locatedCityOption?.id}
                        onChange={handleManualCitySelect}
                      />
                      <Button
                        className="pc-box-locate-button"
                        aria-label={`定位当前位置，当前为${locatedCity.name}`}
                        icon={<EnvironmentOutlined size={18} />}
                        loading={isLocatingCity}
                        size="large"
                        onClick={() => void handleLocateCity()}>
                        {locatedCity.source === 'device' ? '重新定位' : '定位当前位置'}
                      </Button>
                    </div>
                    {locationError ? (
                      <Text className="pc-box-error">{locationError}</Text>
                    ) : null}
                    {locationNotice ? (
                      <Text className="pc-box-location-notice">{locationNotice}</Text>
                    ) : null}
                  </div>
                  <div className="pc-box-location">
                    <Text className="pc-box-label">目的地城市</Text>
                    <Select
                      aria-label="选择目的地城市"
                      className="pc-box-city-select"
                      options={cities.map((city) => ({ label: `${city.name} · ${city.province}`, value: city.id }))}
                      placeholder="请选择明确的目的地"
                      showSearch
                      optionFilterProp="label"
                      value={destinationCityOption?.id}
                      onChange={handleDestinationCitySelect}
                    />
                    <Text className="pc-box-destination-hint">
                      AI 只会在这个城市里抽具体玩法，不会擅自切换城市。
                    </Text>
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
                  <Text className="pc-box-section-title">盲盒惊喜程度</Text>
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

            <div className="pc-box-action">
              <div className="pc-box-summary">
                <Text className="pc-box-summary-label">本次偏好</Text>
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
                  onClick={goStart}>
                  {isStartingDraw ? '正在抽取…' : '开启盲盒'}
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
                <strong>{option}</strong>
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

.pc-box-title-icons { margin-bottom: 18px; color: var(--quest-cyan); }

.pc-box-title-icons span {
  border: 1px solid rgba(255,255,255,.13);
  color: var(--quest-cyan);
  background: rgba(255,255,255,.065);
  box-shadow: none;
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

@media (max-width: 720px) {
  .pc-box-page {
    background: linear-gradient(180deg, #11101c 0, #171426 380px, #F4F7EE 380px, #FAFBF7 100%);
  }
  .pc-box-content { width: min(100% - 28px, 980px); padding-top: 38px; }
  .pc-box-title h1.ant-typography { font-size: 39px; }
  .pc-box-title p.ant-typography,
  .pc-box-title div.ant-typography { font-size: 14px; }
  .pc-box-section .ant-card-body { padding: 24px 19px; }
  .pc-box-location-controls { grid-template-columns: 1fr; }
  .pc-box-locate-button.ant-btn { width: 100%; }
}
`;
