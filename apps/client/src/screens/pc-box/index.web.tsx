import CalendarOutlinedSvg from '@ant-design/icons-svg/es/asn/CalendarOutlined';
import CompassOutlinedSvg from '@ant-design/icons-svg/es/asn/CompassOutlined';
import EnvironmentOutlinedSvg from '@ant-design/icons-svg/es/asn/EnvironmentOutlined';
import GiftOutlinedSvg from '@ant-design/icons-svg/es/asn/GiftOutlined';
import ReloadOutlinedSvg from '@ant-design/icons-svg/es/asn/ReloadOutlined';
import ThunderboltOutlinedSvg from '@ant-design/icons-svg/es/asn/ThunderboltOutlined';
import type { AbstractNode, IconDefinition } from '@ant-design/icons-svg/es/types';
import { Button, Card, ConfigProvider, Layout, Space, Tag, Typography } from 'antd';
import 'antd/dist/reset.css';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SVGProps } from 'react';
import { useApp } from '@/contexts/app-context';
import { requestDeviceCurrentPosition } from '@/lib/device-location';
import { savePendingPcBoxDraw } from '@/lib/pc-box-open-state';
import { resolveCoordinatesCity } from '@/lib/reverse-geocode';
import { palette, radii } from '@/theme';
import type { Preferences } from '@/types';

const { Content } = Layout;
const { Paragraph, Text, Title } = Typography;

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
  source: 'default' | 'device';
};

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

const destinationScopeGroup: MatchPreferenceGroup = {
  key: 'destinationScope',
  label: '目的地范围',
  options: ['周边', '本省', '全国'],
};

const matchPreferenceGroups: MatchPreferenceGroup[] = [
  { key: 'partySize', label: '人数', options: ['1 人', '2 人', '多人'] },
  { key: 'travelDuration', label: '旅游时间', options: ['1-3天', '3-5天', '5-7天'] },
  { key: 'budget', label: '预算', options: ['穷游', '平价', '舒适', '轻奢'] },
  { key: 'mood', label: '心情', options: ['放松', '探索', '热闹'] },
  {
    key: 'surpriseLevel',
    label: '盲盒惊喜程度',
    options: ['轻度', '中度', '重度'],
    descriptions: {
      轻度: '锁定城市与风格，只随机具体玩法',
      中度: '保留部分偏好，目的地半随机',
      重度: '不预设结果，整个旅程充满未知',
    },
  },
];

const initialMatchSelections: Record<string, string> = {
  partySize: '1 人',
  destinationScope: '周边',
  travelDuration: '1-3天',
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
  name: '上海',
  latitude: null,
  longitude: null,
  accuracyMeters: null,
  source: 'default',
};

const partySizeValues: Record<string, number> = {
  '1 人': 1,
  '2 人': 2,
  多人: 4,
};

const budgetValues: Record<string, number | null> = {
  穷游: 50,
  平价: 100,
  舒适: 300,
  轻奢: null,
};

function resolveBudgetMax(option: string) {
  return Object.prototype.hasOwnProperty.call(budgetValues, option)
    ? budgetValues[option] ?? null
    : 100;
}

const destinationRadiusValues: Record<string, number | null> = {
  周边: 10,
  本省: null,
  全国: null,
};

const destinationScopeValues: Record<string, 'nearby' | 'province' | 'nationwide'> = {
  周边: 'nearby',
  本省: 'province',
  全国: 'nationwide',
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
const CompassOutlined = createPcIcon(CompassOutlinedSvg);
const EnvironmentOutlined = createPcIcon(EnvironmentOutlinedSvg);
const GiftOutlined = createPcIcon(GiftOutlinedSvg);
const ReloadOutlined = createPcIcon(ReloadOutlinedSvg);
const ThunderboltOutlined = createPcIcon(ThunderboltOutlinedSvg);

export default function PcBoxConfigScreen() {
  const router = useRouter();
  const { preset } = useLocalSearchParams<{ preset?: string }>();
  const {
    cities,
    currentDraw,
    selectedCityId,
    setSelectedCityId,
    reroll,
    isBooting,
    clearError,
  } = useApp();
  const [matchSelections, setMatchSelections] =
    useState<Record<string, string>>(initialMatchSelections);
  const [locatedCity, setLocatedCity] = useState<PcLocatedCity>(defaultPcLocatedCity);
  const [isLocatingCity, setIsLocatingCity] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isStartingDraw, setIsStartingDraw] = useState(false);
  const [isRerolling, setIsRerolling] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const appliedPresetRef = useRef<string | null>(null);

  useEffect(() => {
    const presetKey = typeof preset === 'string' ? preset : '';
    const selections = homepagePresetSelections[presetKey];
    if (!selections || appliedPresetRef.current === presetKey) return;

    appliedPresetRef.current = presetKey;
    setMatchSelections((current) => ({ ...current, ...selections }));
  }, [preset]);

  const goStart = useCallback(() => {
    if (isBooting || isStartingDraw) return;

    const partySize = partySizeValues[matchSelections.partySize] ?? 1;
    const budgetMax = resolveBudgetMax(matchSelections.budget);
    const radiusKm = destinationRadiusValues[matchSelections.destinationScope] ?? null;
    const randomLevel = surpriseLevelValues[matchSelections.surpriseLevel] ?? 60;
    const destinationScope =
      destinationScopeValues[matchSelections.destinationScope] ?? 'nearby';
    const normalizedLocationName = locatedCity.name.trim().replace(/市$/, '');
    const originCity = cities.find((city) => {
      const cityName = city.name.trim().replace(/市$/, '');
      const provinceName = city.province.trim().replace(/市$/, '');
      return cityName === normalizedLocationName || provinceName === normalizedLocationName;
    });
    const drawCityId = originCity?.id ?? selectedCityId ?? cities[0]?.id ?? null;

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
      radiusKm,
      originName: locatedCity.name,
      originLatitude: locatedCity.latitude,
      originLongitude: locatedCity.longitude,
      originAccuracyMeters: locatedCity.accuracyMeters,
      originSource: locatedCity.source === 'device' ? 'device' : null,
      destinationScope,
      travelDuration:
        matchSelections.travelDuration === '3-5天'
          ? '3-5days'
          : matchSelections.travelDuration === '5-7天'
            ? '5-7days'
            : '1-3days',
      clientSource: 'pc',
      destinationScopeLabel: matchSelections.destinationScope,
      travelDurationLabel: matchSelections.travelDuration,
      budgetLabel: matchSelections.budget,
      surpriseLevelLabel: matchSelections.surpriseLevel,
    };

    if (drawCityId !== selectedCityId) {
      setSelectedCityId(drawCityId);
    }

    const summary = [destinationScopeGroup, ...matchPreferenceGroups]
      .map((group) => matchSelections[group.key] ?? group.options[0])
      .join(' · ');

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
    setSelectedCityId,
  ]);

  useEffect(() => {
    const handleShellStart = () => goStart();
    window.addEventListener('pc-box-start-draw', handleShellStart);
    return () => window.removeEventListener('pc-box-start-draw', handleShellStart);
  }, [goStart]);

  const goReroll = async () => {
    if (
      isBooting ||
      isStartingDraw ||
      isRerolling ||
      !currentDraw ||
      currentDraw.attemptsRemaining <= 0
    ) {
      return;
    }

    setDrawError(null);
    clearError();
    setIsRerolling(true);
    try {
      await reroll();
      router.push('/draw');
    } catch (reason) {
      setDrawError(reason instanceof Error ? reason.message : '重新抽取失败，请稍后重试。');
    } finally {
      setIsRerolling(false);
    }
  };

  const handleLocateCity = async () => {
    if (isLocatingCity) return;

    setIsLocatingCity(true);
    setLocationError(null);
    try {
      const coordinates = await requestDeviceCurrentPosition({ accuracy: 'balanced' });
      const cityName = await resolveCoordinatesCity(coordinates);
      setLocatedCity({
        name: cityName,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        accuracyMeters: coordinates.accuracy,
        source: 'device',
      });
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

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: boxToken.primary,
          colorInfo: boxToken.primary,
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
            primaryShadow: '0 10px 24px rgba(117, 101, 246, 0.30)',
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
              <div className="pc-box-title-icons" aria-hidden="true">
                <span><ThunderboltOutlined size={22} /></span>
                <span><CompassOutlined size={22} /></span>
                <span><GiftOutlined size={22} /></span>
              </div>
              <Title>开启你的专属旅行盲盒</Title>
              <Paragraph>
                告别攻略焦虑，让 AI 基于心情、预算和出发地生成可执行路线。少一点纠结，多一点马上出门的轻松感。
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
                    <Button
                      className="pc-box-location-button"
                      aria-label={`定位城市，当前为${locatedCity.name}`}
                      icon={<EnvironmentOutlined size={18} />}
                      loading={isLocatingCity}
                      size="large"
                      onClick={() => void handleLocateCity()}>
                      <span className="pc-box-location-value">
                        {isLocatingCity ? '正在定位城市…' : locatedCity.name}
                      </span>
                    </Button>
                    {locationError ? (
                      <Text className="pc-box-error">{locationError}</Text>
                    ) : null}
                  </div>
                  <MatchOptionGroup
                    group={destinationScopeGroup}
                    selected={
                      matchSelections[destinationScopeGroup.key] ??
                      destinationScopeGroup.options[0]
                    }
                    onSelect={handleMatchSelect}
                  />
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
                  {[destinationScopeGroup, ...matchPreferenceGroups]
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
                  disabled={isBooting || isRerolling}
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
  border-bottom: 1px solid rgba(232, 225, 255, 0.86);
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
  box-shadow: 0 8px 20px rgba(90, 72, 188, 0.1);
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

.pc-box-title p.ant-typography {
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
  border: 1px solid rgba(232, 225, 255, 0.78);
  border-radius: ${radii['2xl']}px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 42px rgba(90, 72, 188, 0.1);
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
  border-color: rgba(117, 101, 246, 0.42);
  background: ${boxToken.surface};
}

.pc-box-location-button .pc-box-icon {
  color: ${boxToken.primary};
}

.pc-box-location-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  box-shadow: 0 8px 20px rgba(117, 101, 246, 0.24);
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
  border: 1px solid rgba(222, 215, 255, 0.9);
  border-radius: ${radii['2xl']}px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 44px rgba(90, 72, 188, 0.12);
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

.pc-box-action-buttons.ant-space {
  flex-shrink: 0;
}

.pc-box-reroll-button.ant-btn {
  min-width: 210px;
  height: 56px;
  border: 1px solid rgba(117, 101, 246, 0.44);
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
  box-shadow: 0 14px 30px rgba(117, 101, 246, 0.28);
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
`;
