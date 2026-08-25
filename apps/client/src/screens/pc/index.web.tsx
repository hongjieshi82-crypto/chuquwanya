// PC landing page uses Ant Design Web components because this implementation is web-only.
import AimOutlinedSvg from '@ant-design/icons-svg/es/asn/AimOutlined';
import AppstoreOutlinedSvg from '@ant-design/icons-svg/es/asn/AppstoreOutlined';
import ArrowRightOutlinedSvg from '@ant-design/icons-svg/es/asn/ArrowRightOutlined';
import CheckCircleOutlinedSvg from '@ant-design/icons-svg/es/asn/CheckCircleOutlined';
import CompassOutlinedSvg from '@ant-design/icons-svg/es/asn/CompassOutlined';
import EnvironmentOutlinedSvg from '@ant-design/icons-svg/es/asn/EnvironmentOutlined';
import FireOutlinedSvg from '@ant-design/icons-svg/es/asn/FireOutlined';
import GiftOutlinedSvg from '@ant-design/icons-svg/es/asn/GiftOutlined';
import GlobalOutlinedSvg from '@ant-design/icons-svg/es/asn/GlobalOutlined';
import HeartOutlinedSvg from '@ant-design/icons-svg/es/asn/HeartOutlined';
import RobotOutlinedSvg from '@ant-design/icons-svg/es/asn/RobotOutlined';
import SmileOutlinedSvg from '@ant-design/icons-svg/es/asn/SmileOutlined';
import ThunderboltOutlinedSvg from '@ant-design/icons-svg/es/asn/ThunderboltOutlined';
import type { AbstractNode, IconDefinition } from '@ant-design/icons-svg/es/types';
import {
  Avatar,
  Button,
  Card,
  Col,
  ConfigProvider,
  Flex,
  Layout,
  Row,
  Space,
  Statistic,
  Skeleton,
  Tag,
  Typography,
} from 'antd';
import 'antd/dist/reset.css';
import { animate, createScope, createTimeline, onScroll, stagger, type Scope } from 'animejs';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode, SVGProps } from 'react';
import { Image as NativeImage } from 'react-native';

import { getAttractions, getDestinations, getTravelTags } from '@/services/travel-api';
import { demoCityImageUris, demoPlaceImageUris } from '@/services/demo-data';
import { palette, radii } from '@/theme';
import type { Attraction, Destination, TravelTag } from '@/types/travel';

const { Content, Footer } = Layout;
const { Paragraph, Text, Title } = Typography;

type PcIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
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
        className={className ? `pc-icon ${className}` : 'pc-icon'}
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

const AimOutlined = createPcIcon(AimOutlinedSvg);
const AppstoreOutlined = createPcIcon(AppstoreOutlinedSvg);
const ArrowRightOutlined = createPcIcon(ArrowRightOutlinedSvg);
const CheckCircleOutlined = createPcIcon(CheckCircleOutlinedSvg);
const CompassOutlined = createPcIcon(CompassOutlinedSvg);
const EnvironmentOutlined = createPcIcon(EnvironmentOutlinedSvg);
const FireOutlined = createPcIcon(FireOutlinedSvg);
const GiftOutlined = createPcIcon(GiftOutlinedSvg);
const GlobalOutlined = createPcIcon(GlobalOutlinedSvg);
const HeartOutlined = createPcIcon(HeartOutlinedSvg);
const RobotOutlined = createPcIcon(RobotOutlinedSvg);
const SmileOutlined = createPcIcon(SmileOutlinedSvg);
const ThunderboltOutlined = createPcIcon(ThunderboltOutlinedSvg);

function ensurePcBrowserApis() {
  if (typeof window === 'undefined') return;

  const win = window as typeof window & {
    ResizeObserver?: typeof ResizeObserver;
  };

  if (typeof win.requestAnimationFrame !== 'function') {
    win.requestAnimationFrame = (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(Date.now()), 16);
  }

  if (typeof win.cancelAnimationFrame !== 'function') {
    win.cancelAnimationFrame = (handle?: number | null) => {
      if (typeof handle === 'number') {
        window.clearTimeout(handle);
      }
    };
  }

  if (typeof win.ResizeObserver === 'undefined') {
    win.ResizeObserver = class ResizeObserverFallback {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as typeof ResizeObserver;
  }
}

ensurePcBrowserApis();

type StaticAsset = number | { uri: string };
type PcImageSource = StaticAsset | string;

const brandLogo = require('../../../assets/images/home-brand-logo.png') as StaticAsset;
const westLakeImage = require('../../../assets/images/pc-hero-west-lake.jpg') as StaticAsset;
const shenzhenBayImage = require('../../../assets/images/pc-hero-shenzhen-bay.jpg') as StaticAsset;
const beijingImage = demoCityImageUris.beijing;
const shanghaiImage = demoCityImageUris.shanghai;
const hangzhouImage = demoCityImageUris.hangzhou;
const shenzhenImage = demoCityImageUris.shenzhen;
const tianjinImage = demoCityImageUris.tianjin;
const yantaiImage = demoCityImageUris.yantai;

function assetUri(source: StaticAsset) {
  if (typeof source === 'object' && source.uri) {
    return source.uri;
  }

  if (typeof source !== 'number') {
    return '';
  }

  const resolveAssetSource = NativeImage.resolveAssetSource as
    | ((asset: number) => { uri?: string } | undefined)
    | undefined;

  return resolveAssetSource?.(source)?.uri ?? '';
}

function imageUri(source: PcImageSource) {
  return typeof source === 'string' ? source : assetUri(source);
}

const pcToken = {
  canvas: palette.canvas,
  surface: palette.surface,
  paper: palette.paper,
  ink: palette.ink,
  text: palette.text,
  muted: palette.muted,
  primary: palette.primary,
  primaryDark: palette.primaryDark,
  primarySoft: palette.primarySoft,
  border: palette.border,
  borderStrong: palette.borderStrong,
  sky: palette.sky,
  skySoft: palette.skySoft,
  sunset: palette.sunset,
  sunsetSoft: palette.sunsetSoft,
  dune: palette.dune,
  duneSoft: palette.duneSoft,
  seafoam: palette.seafoam,
  seafoamSoft: palette.seafoamSoft,
  shadow: '0 18px 44px rgba(90, 72, 188, 0.14)',
  cardShadow: '0 12px 32px rgba(90, 72, 188, 0.10)',
};

const sceneImages = [beijingImage, shanghaiImage, hangzhouImage, shenzhenImage, tianjinImage, yantaiImage] as const;
const tagCategoryOrder = ['scene', 'theme', 'audience', 'food', 'season', 'other'];
const tagCategoryImages: Record<string, PcImageSource> = {
  scene: demoPlaceImageUris.beijingOlympicForest,
  theme: hangzhouImage,
  audience: shenzhenImage,
  food: shanghaiImage,
  season: yantaiImage,
  other: tianjinImage,
};

type PcLiveData = {
  destinations: Destination[];
  tags: TravelTag[];
  attractions: Attraction[];
  loading: boolean;
  error: string | null;
};

type PcStatistic = {
  label: string;
  value: number | string;
  suffix?: string;
  precision?: number;
};

type PcDestinationCard = {
  destinationId: number;
  id: string;
  title: string;
  desc: string;
  meta: string;
  popularity: number;
  image: PcImageSource;
  tag: string;
  actionLabel: string;
};

type PcHeroCard = {
  id: string;
  title: string;
  image: PcImageSource;
};

type PcTrendCard = {
  id: string;
  title: string;
  desc: string;
  image: PcImageSource;
  preset: string;
  actionLabel: string;
};

type PcCaseCard = {
  activityId: number | null;
  destinationId: number;
  id: string;
  title: string;
  desc: string;
  meta: string;
  popularity: number;
  image: PcImageSource;
  tag: string;
  actionLabel: string;
};

const tagCategoryLabels: Record<string, string> = {
  scene: '风景人文',
  audience: '结伴同行',
  season: '四季时节',
  theme: '随心漫游',
  food: '寻味探购',
  other: '更多灵感',
};

const tagCategoryDescriptions: Record<string, string> = {
  scene: '山海人文相映，遇见自然之美。',
  theme: '城市漫游与户外探索，自在切换。',
  audience: '亲子或情侣同行，都能轻松出发。',
  food: '沿着街巷寻味，发现当地烟火。',
  season: '跟着四季出发，遇见不同风景。',
  other: '换种旅行方式，发现新的灵感。',
};

const liveDataInitialState: PcLiveData = {
  destinations: [],
  tags: [],
  attractions: [],
  loading: true,
  error: null,
};

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function isHotDestination(destination: Destination) {
  const value = destination.isHot as unknown;
  return value === true || value === 1 || value === '1';
}

function getDataErrorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}

function getSceneImage(id: number | string | undefined, index: number) {
  const numericId = toNumber(id, index);
  return sceneImages[Math.abs(Math.trunc(numericId + index)) % sceneImages.length];
}

function getDestinationCover(destination: Destination, index: number): PcImageSource {
  return destination.coverImageUri ?? getSceneImage(destination.id, index);
}

function getAttractionCover(item: Attraction, index: number): PcImageSource {
  return item.coverImageUri ?? getSceneImage(item.id, index);
}

function buildHeroStats(data: PcLiveData): PcStatistic[] {
  const hotCount = data.destinations.filter(isHotDestination).length;
  const averageRating = data.destinations.length
    ? data.destinations.reduce((sum, destination) => sum + toNumber(destination.rating), 0) / data.destinations.length
    : 0;

  const destinationCount = data.destinations.length || 6;
  const styleCount = data.tags.length || 12;

  return [
    { label: '可探索城市', value: data.loading ? '--' : destinationCount, suffix: data.loading ? undefined : '座' },
    { label: '周末玩法', value: data.loading ? '--' : styleCount, suffix: data.loading ? undefined : '种' },
    {
      label: '路线新鲜度',
      value: data.loading ? '--' : hotCount > 0 ? 96 : averageRating > 0 ? Math.round(averageRating * 20) : 96,
      suffix: data.loading ? undefined : '%',
      precision: 0,
    },
  ];
}

function buildDestinationCards(destinations: Destination[]): PcDestinationCard[] {
  const source = destinations.filter(isHotDestination).length
    ? destinations.filter(isHotDestination)
    : destinations;

  return source.slice(0, 4).map((destination, index) => {
    const rating = toNumber(destination.rating);
    const popularity = toNumber(destination.popularity);
    const province = destination.province ?? '全国';

    return {
      destinationId: destination.id,
      id: `destination-${destination.id}`,
      title: destination.name,
      desc: destination.summary,
      meta: `${province} · 热度 ${popularity} · 评分 ${rating.toFixed(1)}`,
      popularity,
      image: getDestinationCover(destination, index),
      tag: isHotDestination(destination) ? '热门' : province,
      actionLabel: '查看城市详情',
    };
  });
}

function buildHeroCards(destinations: Destination[]): [PcHeroCard, PcHeroCard] {
  const liveCards = destinations
    .filter((destination) => Boolean(destination.coverImageUri))
    .slice(0, 2)
    .map((destination) => ({
      id: `hero-destination-${destination.id}`,
      title: destination.name,
      image: destination.coverImageUri as string,
    }));
  const fallbackCards: PcHeroCard[] = [
    { id: 'hero-west-lake', title: '杭州西湖', image: westLakeImage },
    { id: 'hero-shenzhen-bay', title: '深圳湾公园', image: shenzhenBayImage },
  ];

  return [...liveCards, ...fallbackCards].slice(0, 2) as [PcHeroCard, PcHeroCard];
}

function buildTrendCards(tags: TravelTag[]): PcTrendCard[] {
  const grouped = tags.reduce<Record<string, TravelTag[]>>((acc, tag) => {
    const key =
      tag.category === 'theme' && tag.name === '美食购物'
        ? 'food'
        : tag.category || 'other';
    acc[key] = [...(acc[key] ?? []), tag];
    return acc;
  }, {});

  const orderedCategories = [
    ...tagCategoryOrder,
    ...Object.keys(grouped).filter((category) => !tagCategoryOrder.includes(category)),
  ].filter((category) => grouped[category]?.length);

  return orderedCategories.slice(0, 4).map((category) => {
    const items = grouped[category];

    return {
      id: `tag-category-${category}`,
      title: tagCategoryLabels[category] ?? category,
      desc:
        tagCategoryDescriptions[category] ??
        `围绕${items.map((tag) => tag.name).slice(0, 3).join('、')}，找到新的旅行灵感。`,
      image: tagCategoryImages[category] ?? westLakeImage,
      preset: category,
      actionLabel: `探索${tagCategoryLabels[category] ?? '主题'}主题`,
    };
  });
}

function buildCaseCards(attractions: Attraction[]): PcCaseCard[] {
  const seenDestinations = new Set<number>();
  const diverseItems = attractions.filter((item) => {
    if (seenDestinations.has(item.destinationId)) return false;
    seenDestinations.add(item.destinationId);
    return true;
  });
  const source = diverseItems.length >= 3 ? diverseItems : attractions;

  return source.slice(0, 3).map((item, index) => {
    const rating = toNumber(item.rating);
    const popularity = toNumber(item.popularity);

    return {
      activityId: item.activityId,
      destinationId: item.destinationId,
      id: `attraction-${item.id}`,
      title: item.name,
      desc: item.summary,
      meta: `${item.destinationName} · ${rating.toFixed(1)}分`,
      popularity,
      image: getAttractionCover(item, index),
      tag: item.destinationName,
      actionLabel: '查看这个玩法',
    };
  });
}

function handleCardKeyDown(event: ReactKeyboardEvent<HTMLElement>, action: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  action();
}

const capabilityCards = [
  { image: yantaiImage, icon: <GiftOutlined />, title: '有点未知感', desc: '不用先研究完整攻略，也能得到一个能出发的选择。' },
  { image: demoPlaceImageUris.beijingOlympicForest, icon: <RobotOutlined />, title: '少做选择题', desc: '把距离、时间、预算和偏好放在一起，帮你快速缩小范围。' },
  { image: shanghaiImage, icon: <AimOutlined />, title: '不合适就换', desc: '想安静、想热闹、想省钱，都可以换个方向重新开盒。' },
  { image: westLakeImage, icon: <GlobalOutlined />, title: '出门前看清楚', desc: '先在电脑上挑好方向，路上再用手机继续查看和调整。' },
];

export default function PcLandingScreen() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const scopeRef = useRef<Scope | null>(null);
  const [liveData, setLiveData] = useState<PcLiveData>(liveDataInitialState);

  const heroStats = useMemo(() => buildHeroStats(liveData), [liveData]);
  const trendCards = useMemo(() => buildTrendCards(liveData.tags), [liveData.tags]);
  const caseCards = useMemo(() => buildCaseCards(liveData.attractions), [liveData.attractions]);
  const destinationCards = useMemo(
    () => buildDestinationCards(liveData.destinations),
    [liveData.destinations],
  );
  const heroCards = useMemo(
    () => buildHeroCards(liveData.destinations),
    [liveData.destinations],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadLiveData() {
      setLiveData((previous) => ({
        ...previous,
        loading: true,
        error: null,
      }));

      try {
        const [destinations, tags] = await Promise.all([getDestinations(), getTravelTags()]);
        if (cancelled) return;

        const attractions = await getAttractions(undefined, 30);

        if (!cancelled) {
          setLiveData({
            destinations,
            tags,
            attractions,
            loading: false,
            error: null,
          });
        }
      } catch (reason) {
        if (!cancelled) {
          setLiveData({
            ...liveDataInitialState,
            loading: false,
            error: getDataErrorMessage(reason, '内容暂时加载不出来'),
          });
        }
      }
    }

    void loadLiveData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!rootRef.current) return;

    scopeRef.current = createScope({ root: rootRef }).add(() => {
      createTimeline({ defaults: { duration: 760, ease: 'out(3)' } })
        .add('[data-anime="nav"]', { opacity: [0, 1], y: [-18, 0] }, 0)
        .add('[data-anime="hero-copy"]', { opacity: [0, 1], y: [26, 0] }, 110)
        .add('[data-anime="float-card"]', { opacity: [0, 1], y: [24, 0], delay: stagger(90) }, 360)
        .add('[data-anime="reveal"]', { opacity: [0, 1], y: [28, 0], delay: stagger(80) }, 520);

      animate('[data-anime="float-card"]', {
        y: [
          { to: '-0.45rem', duration: 1800 },
          { to: '0.45rem', duration: 2100 },
        ],
        loop: true,
        alternate: true,
        delay: stagger(180),
        ease: 'inOutSine',
      });

      animate('[data-anime="nav"]', {
        y: [0, -2],
        boxShadow: [
          '0 0 0 rgba(90, 72, 188, 0)',
          '0 10px 32px rgba(90, 72, 188, 0.14)',
        ],
        backgroundColor: [
          'rgba(255, 255, 255, 0.82)',
          'rgba(255, 255, 255, 0.97)',
        ],
        duration: 1,
        ease: 'out(2)',
        autoplay: onScroll({
          target: '.pc-scroll-sentinel',
          enter: 'top top',
          leave: 'bottom top',
          sync: true,
        }),
      });

      animate('[data-anime="nav"] .pc-header-cta', {
        scale: [
          { to: 1.045, duration: 1300 },
          { to: 1, duration: 1500 },
        ],
        loop: true,
        alternate: true,
        delay: 900,
        ease: 'inOutSine',
      });
    });

    return () => {
      scopeRef.current?.revert();
      scopeRef.current = null;
    };
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: pcToken.primary,
          colorInfo: pcToken.primary,
          colorSuccess: pcToken.seafoam,
          colorWarning: pcToken.dune,
          colorError: palette.error,
          colorText: pcToken.ink,
          colorTextSecondary: pcToken.text,
          colorTextTertiary: pcToken.muted,
          colorBgLayout: pcToken.canvas,
          colorBgContainer: pcToken.surface,
          colorBorder: pcToken.border,
          borderRadius: radii.lg,
          borderRadiusLG: radii.xl,
          boxShadow: pcToken.cardShadow,
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
            borderRadiusLG: radii.lg,
            headerBg: pcToken.surface,
          },
          Tag: {
            borderRadiusSM: radii.pill,
            defaultBg: pcToken.primarySoft,
            defaultColor: pcToken.primaryDark,
          },
          Statistic: {
            titleFontSize: 13,
            contentFontSize: 28,
          },
        },
      }}>
      <div id="top" ref={rootRef} className="pc-page">
        <div className="pc-scroll-sentinel" aria-hidden="true" />
        <style>{pcCss}</style>
        <Layout className="pc-layout">
          <Content>
            <section className="pc-hero">
              <div className="pc-hero-inner">
                <div className="pc-hero-copy" data-anime="hero-copy">
                  <div className="pc-hero-status" role="status">
                    <span className="pc-status-dot" aria-hidden="true" />
                    <span>WEEKEND MODE</span>
                    <span className="pc-status-divider" aria-hidden="true" />
                    <span className="pc-status-detail">
                      {liveData.loading
                        ? '正在同步城市灵感'
                        : liveData.error
                          ? '本地探索模式已就绪'
                          : `${liveData.destinations.length} 座城市在线`}
                    </span>
                  </div>
                  <Title className="pc-hero-title">
                    今天不做攻略，<br />
                    <span>开一局周末。</span>
                  </Title>
                  <Paragraph className="pc-hero-desc">
                    把时间、预算和心情交给 AI。你只需要打开盲盒，领取一条现在就能出发的城市任务。
                  </Paragraph>
                  <Space className="pc-hero-actions" size={14} wrap>
                    <Button
                      type="primary"
                      size="large"
                      icon={<GiftOutlined />}
                      onClick={() => router.push('/box/config')}>
                      开始本周冒险
                    </Button>
                    <Button size="large" icon={<CompassOutlined />} href="#目的地">
                      先逛城市地图
                    </Button>
                  </Space>
                  <div className="pc-hero-quest-chips" aria-label="旅行盲盒特色">
                    <span><CheckCircleOutlined /> 真实地点</span>
                    <span><ThunderboltOutlined /> 即开即走</span>
                    <span><SmileOutlined /> 不合适可重抽</span>
                  </div>
                  <Row gutter={[16, 16]} className="pc-stats">
                    {heroStats.map((item) => (
                      <Col xs={24} sm={8} key={item.label}>
                        <Statistic
                          value={item.value}
                          suffix={item.suffix}
                          title={item.label}
                          precision={item.precision}
                        />
                      </Col>
                    ))}
                  </Row>
                </div>

                <div className="pc-hero-showcase" aria-label="精选实地目的地">
                  <div className="pc-hero-orbit" aria-hidden="true" />
                  <div className="pc-hero-console" data-anime="float-card">
                    <span>QUEST / 01</span>
                    <strong>随机目的地已装载</strong>
                    <small>滑动继续探索城市线索</small>
                  </div>
                  {heroCards.map((item, index) => (
                    <figure
                      key={item.id}
                      className={`pc-hero-photo-card pc-hero-photo-card-${index + 1}`}
                      data-anime="float-card">
                      <img src={imageUri(item.image)} alt={`${item.title}实地景色`} loading="lazy" decoding="async" />
                      <figcaption>
                        <span>0{index + 1} / CITY DROP</span>
                        <strong>{item.title}</strong>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>

            </section>
            <main className="pc-main">
              <section id="目的地" className="pc-section" data-anime="reveal">
                <SectionTitle
                  eyebrow="旅行灵感分类"
                  title="按风格快速找到想去的方向"
                  action={
                    <Button icon={<AppstoreOutlined />} href="#目的地榜单">
                      查看目的地
                    </Button>
                  }
                />
                {liveData.loading ? (
                  <LoadingGrid />
                ) : trendCards.length ? (
                  <Row gutter={[18, 18]}>
                    {trendCards.map((item) => (
                      <Col xs={24} md={12} xl={6} key={item.id}>
                        <Card
                          hoverable
                          className="pc-trend-card pc-interactive-card"
                          role="link"
                          tabIndex={0}
                          onClick={() => router.push(`/theme?preset=${item.preset}`)}
                          onKeyDown={(event) =>
                            handleCardKeyDown(event, () => router.push(`/theme?preset=${item.preset}`))
                          }>
                          <img
                            className="pc-trend-image"
                            src={imageUri(item.image)}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                          />
                          <Title level={4}>{item.title}</Title>
                          <Paragraph>{item.desc}</Paragraph>
                          <Text className="pc-card-action">
                            {item.actionLabel} <ArrowRightOutlined />
                          </Text>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <EmptyDataCard message="暂时没有可选风格，稍后再来看看" />
                )}
              </section>

              <section id="可玩地点" className="pc-section" data-anime="reveal">
                <SectionTitle
                  eyebrow="这周可以直接出发"
                  title="挑一个有画面感的地点先看看"
                  action={
                    <Button
                      type="link"
                      icon={<ArrowRightOutlined />}
                      onClick={() => router.push('/destinations')}>
                      查看更多
                    </Button>
                  }
                />
                {liveData.loading ? (
                  <LoadingGrid columns={3} />
                ) : caseCards.length ? (
                  <Row gutter={[18, 18]}>
                    {caseCards.map((item) => (
                      <Col xs={24} lg={8} key={item.id}>
                        <Card
                          hoverable
                          className="pc-case-card pc-interactive-card"
                          role="link"
                          tabIndex={0}
                          onClick={() =>
                            router.push(
                              item.activityId
                                ? `/place?activityId=${item.activityId}`
                                : `/destinations?destinationId=${item.destinationId}`,
                            )
                          }
                          onKeyDown={(event) =>
                            handleCardKeyDown(event, () =>
                              router.push(
                                item.activityId
                                  ? `/place?activityId=${item.activityId}`
                                  : `/destinations?destinationId=${item.destinationId}`,
                              ),
                            )
                          }
                          cover={<img src={imageUri(item.image)} alt={item.title} loading="lazy" decoding="async" />}>
                          <Flex justify="space-between" align="center">
                            <Tag color="purple">{item.tag}</Tag>
                            <Text type="secondary">
                              <HeartOutlined /> 热度 {item.popularity}
                            </Text>
                          </Flex>
                          <Title level={4}>{item.title}</Title>
                          <Paragraph>{item.desc}</Paragraph>
                          <Text strong className="pc-case-meta">
                            {item.meta}
                          </Text>
                          <Text className="pc-card-action">
                            {item.actionLabel} <ArrowRightOutlined />
                          </Text>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <EmptyDataCard message="暂时没有可出发地点，稍后再来看看" />
                )}
              </section>

              <section id="目的地榜单" className="pc-section" data-anime="reveal">
                <SectionTitle
                  eyebrow="目的地榜单"
                  title="热门目的地，一眼挑到想去的城市"
                  action={
                    <Button type="link" icon={<ArrowRightOutlined />} onClick={() => router.push('/destinations')}>
                      查看全部城市
                    </Button>
                  }
                />
                {liveData.loading ? (
                  <LoadingGrid columns={2} />
                ) : destinationCards.length ? (
                  <Row gutter={[18, 18]}>
                    {destinationCards.map((item) => (
                      <Col xs={24} md={12} key={item.id}>
                        <Card
                          hoverable
                          className="pc-destination-card pc-interactive-card"
                          role="link"
                          tabIndex={0}
                          onClick={() => router.push(`/destinations?destinationId=${item.destinationId}`)}
                          onKeyDown={(event) =>
                            handleCardKeyDown(event, () =>
                              router.push(`/destinations?destinationId=${item.destinationId}`),
                            )
                          }>
                          <Flex gap={18} align="stretch">
                            <img className="pc-destination-img" src={imageUri(item.image)} alt={item.title} loading="lazy" decoding="async" />
                            <div className="pc-destination-body">
                              <Flex justify="space-between" align="center">
                                <Tag color="geekblue">{item.tag}</Tag>
                                <Text type="secondary">
                                  <FireOutlined /> 热度 {item.popularity}
                                </Text>
                              </Flex>
                              <Title level={4}>{item.title}</Title>
                              <Paragraph>{item.desc}</Paragraph>
                              <Text strong>
                                <EnvironmentOutlined /> {item.meta}
                              </Text>
                              <Text className="pc-card-action">
                                {item.actionLabel} <ArrowRightOutlined />
                              </Text>
                            </div>
                          </Flex>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <EmptyDataCard message="暂时没有目的地，稍后再来看看" />
                )}
              </section>

              <section className="pc-section pc-process-section" data-anime="reveal">
                <SectionTitle
                  eyebrow="产品工作方式 · 仅作说明"
                  title="从一句“不想选”，到一条可以出发的路线"
                  desc="这里展示产品如何帮你收敛选择，不是可点击入口。"
                />
                <div className="pc-process-layout">
                  <figure className="pc-process-visual">
                    <img src={imageUri(yantaiImage)} alt="烟台海岸实景" loading="lazy" decoding="async" />
                    <div className="pc-process-visual-shade" />
                    <figcaption>
                      <span>INPUT → MATCH → REVEAL → GO</span>
                      <strong>把复杂条件，收成一个今天能完成的决定。</strong>
                    </figcaption>
                  </figure>
                  <ol className="pc-process-list">
                    {capabilityCards.map((item, index) => (
                      <li key={item.title}>
                        <span className="pc-process-index">0{index + 1}</span>
                        <Avatar className="pc-capability-avatar" icon={item.icon} />
                        <div>
                          <Title level={4}>{item.title}</Title>
                          <Paragraph>{item.desc}</Paragraph>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            </main>
          </Content>

          <Footer className="pc-footer">
            <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
              <Space>
                <img src={assetUri(brandLogo)} alt="" />
                <Text strong>懒得动 · 旅行盲盒规划师</Text>
              </Space>
              <Text type="secondary">开盲盒，去未知，玩出新鲜感，攻略全省心</Text>
            </Flex>
          </Footer>
        </Layout>
      </div>
    </ConfigProvider>
  );
}

function SectionTitle({
  action,
  desc,
  eyebrow,
  title,
}: {
  action?: ReactNode;
  desc?: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <Flex className="pc-section-title" align="end" justify="space-between" gap={24}>
      <div>
        <Text className="pc-eyebrow">{eyebrow}</Text>
        <Title level={2}>{title}</Title>
        {desc ? <Paragraph>{desc}</Paragraph> : null}
      </div>
      {action ? <div className="pc-section-action">{action}</div> : null}
    </Flex>
  );
}

function LoadingGrid({ columns = 4 }: { columns?: 2 | 3 | 4 }) {
  return (
    <Row gutter={[18, 18]}>
      {Array.from({ length: columns }).map((_, index) => (
        <Col xs={24} md={columns === 2 ? 12 : 8} xl={columns === 4 ? 6 : undefined} key={index}>
          <Card className="pc-loading-card">
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

function EmptyDataCard({ message }: { message: string }) {
  return (
    <Card className="pc-empty-data" variant="borderless">
      <Text type="secondary">{message}</Text>
    </Card>
  );
}

const pcCss = `
.pc-page {
  --pc-content-max: 1280px;
  --pc-content-inline-space: 112px;
  position: relative;
  min-height: 100dvh;
  background:
    linear-gradient(180deg, rgba(243, 240, 255, 0.96) 0%, rgba(248, 247, 255, 1) 44%, #ffffff 100%);
  color: ${pcToken.ink};
}

.pc-scroll-sentinel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 120px;
  pointer-events: none;
}

.pc-layout {
  min-height: 100dvh;
  background: transparent;
}

.pc-header {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 76px;
  padding: 0 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  background: rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid rgba(232, 225, 255, 0.86);
  backdrop-filter: blur(18px);
}

.pc-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 148px;
  color: ${pcToken.ink};
  font-size: 18px;
  font-weight: 900;
  text-decoration: none;
}

.pc-brand img,
.pc-footer img {
  width: 38px;
  height: 38px;
  object-fit: contain;
}

.pc-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 26px;
  flex: 1;
}

.pc-nav a {
  color: ${pcToken.text};
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.pc-nav a:hover {
  color: ${pcToken.primary};
}

.pc-hero {
  position: relative;
  overflow: hidden;
  padding: 28px 56px 56px;
  background:
    linear-gradient(135deg, rgba(243, 240, 255, 0.98) 0%, rgba(248, 247, 255, 0.96) 50%, rgba(255, 255, 255, 0.96) 100%);
}

.pc-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(243, 240, 255, 0.98) 0%, rgba(243, 240, 255, 0.9) 47%, rgba(255, 255, 255, 0.72) 100%);
}

.pc-hero-inner {
  position: relative;
  z-index: 1;
  max-width: var(--pc-content-max);
  min-height: clamp(500px, 56vh, 590px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(380px, 0.95fr);
  align-items: center;
  align-content: center;
  gap: 34px 54px;
}

.pc-hero-copy {
  max-width: 690px;
}

.pc-hero-title.ant-typography {
  margin-top: 18px;
  margin-bottom: 0;
  max-width: 680px;
  color: ${pcToken.ink};
  font-size: 58px;
  line-height: 1.08;
  font-weight: 900;
  letter-spacing: 0;
}

.pc-hero-desc.ant-typography {
  margin-top: 22px;
  margin-bottom: 0;
  max-width: 590px;
  color: ${pcToken.text};
  font-size: 18px;
  line-height: 1.75;
  font-weight: 600;
}

.pc-hero-actions {
  margin-top: 34px;
}

.pc-stats {
  max-width: 560px;
  margin-top: 28px;
}

.pc-stats .ant-statistic {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(232, 225, 255, 0.82);
  border-radius: ${radii.lg}px;
}

.pc-match-section {
  position: relative;
  z-index: 3;
  padding: 28px clamp(20px, 1.6vw, 32px) 8px;
  background: linear-gradient(180deg, rgba(248, 247, 255, 0.78) 0%, rgba(255, 255, 255, 0.96) 100%);
}

.pc-match-card.ant-card {
  position: relative;
  z-index: 2;
  width: min(100%, 1156px);
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid rgba(232, 225, 255, 0.82);
  border-radius: ${radii['2xl']}px;
  background:
    radial-gradient(circle at 100% 0%, rgba(142, 200, 255, 0.14), transparent 34%),
    rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 68px rgba(90, 72, 188, 0.14);
  backdrop-filter: blur(18px);
}

.pc-match-card .ant-card-body {
  padding: clamp(28px, 2.5vw, 48px);
  height: 100%;
}

.pc-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: -0.125em;
}

.pc-avatar,
.pc-capability-avatar {
  background: ${pcToken.primary};
}

.pc-muted {
  margin-top: 2px;
  color: ${pcToken.muted};
  font-size: 12px;
  font-weight: 700;
}

.pc-match-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    "location"
    "preferences"
    "action";
  row-gap: 24px;
}

.pc-match-origin-row {
  grid-area: location;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.pc-match-location {
  min-width: 0;
  padding: 22px 24px 24px;
  border: 1px solid rgba(232, 225, 255, 0.92);
  border-radius: ${radii.xl}px;
  background: linear-gradient(145deg, rgba(248, 246, 255, 0.96), rgba(255, 255, 255, 0.98));
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.pc-location-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.pc-location-heading .pc-match-label {
  margin-bottom: 0;
  color: ${pcToken.ink};
  font-size: 15px;
}

.pc-location-chip.ant-btn {
  width: 100%;
  height: 52px;
  padding: 0 20px;
  border: 1px solid rgba(232, 225, 255, 0.92);
  border-radius: ${radii.pill}px;
  background: ${pcToken.surface};
  color: ${pcToken.ink};
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  box-shadow: 0 8px 20px rgba(90, 72, 188, 0.08);
}

.pc-location-chip.ant-btn .pc-icon {
  color: ${pcToken.primary};
}

.pc-location-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-location-error {
  margin-top: 8px;
  color: ${palette.error};
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
}

.pc-match-preferences {
  grid-area: preferences;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.pc-match-group {
  min-width: 0;
  padding: 22px 24px 24px;
  border: 1px solid rgba(232, 225, 255, 0.88);
  border-radius: ${radii.xl}px;
  background: rgba(251, 250, 255, 0.78);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.pc-match-group + .pc-match-group {
  border-left: 1px solid rgba(232, 225, 255, 0.88);
}

.pc-match-group-surpriseLevel {
  grid-column: 1 / -1;
}

.pc-match-group-heading {
  min-width: 0;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.pc-match-label {
  display: block;
  margin-bottom: 0;
  color: ${pcToken.text};
  font-size: 15px;
  font-weight: 900;
}

.pc-option-tags.ant-tag-checkable-group {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  min-width: 0;
}

.pc-option-tags-4.ant-tag-checkable-group {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.pc-option-tags .ant-tag-checkable-group-item.ant-tag {
  width: 100%;
  min-width: 0;
  height: 48px;
  margin: 0;
  padding: 0 10px;
  border: 1px solid rgba(232, 225, 255, 0.95);
  border-radius: ${radii.pill}px;
  background: ${pcToken.surface};
  color: ${pcToken.text};
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background 160ms ease,
    box-shadow 160ms ease,
    color 160ms ease;
}

.pc-option-tags .ant-tag-checkable-group-item.ant-tag:hover {
  border-color: rgba(117, 101, 246, 0.45);
  color: ${pcToken.primaryDark};
  transform: translateY(-1px);
}

.pc-option-tags .ant-tag-checkable-group-item.ant-tag:focus-visible {
  outline: 3px solid rgba(117, 101, 246, 0.2);
  outline-offset: 2px;
}

.pc-option-tags .ant-tag-checkable-group-item.ant-tag-checkable-checked {
  border-color: transparent;
  background: linear-gradient(135deg, ${pcToken.primary} 0%, ${palette.primaryLight} 100%);
  color: ${pcToken.surface};
  box-shadow: 0 10px 24px rgba(117, 101, 246, 0.22);
}

.pc-option-tags .ant-tag-checkable-group-item.ant-tag-checkable-checked:hover {
  color: ${pcToken.surface};
}

.pc-match-option-description.ant-tag {
  max-width: min(70%, 520px);
  margin: 0;
  padding: 7px 12px;
  border: 0;
  border-radius: ${radii.pill}px;
  background: ${pcToken.primarySoft};
  color: ${pcToken.text};
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
  white-space: normal;
}

.pc-match-action {
  grid-area: action;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 28px;
  border: 1px solid rgba(222, 215, 255, 0.9);
  border-radius: ${radii.xl}px;
  background: linear-gradient(135deg, rgba(117, 101, 246, 0.08), rgba(142, 200, 255, 0.12));
}

.pc-match-summary {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.pc-match-summary-label {
  color: ${pcToken.muted};
  font-size: 12px;
  font-weight: 800;
}

.pc-match-summary-value {
  overflow: hidden;
  color: ${pcToken.ink};
  font-size: 15px;
  font-weight: 900;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-match-draw-error {
  margin-top: 4px;
  color: ${palette.error};
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
}

.pc-match-button.ant-btn {
  min-width: 220px;
  height: 58px;
  border: 0;
  border-radius: ${radii.pill}px;
  background: linear-gradient(135deg, ${pcToken.primary} 0%, ${pcToken.primaryDark} 100%);
  box-shadow: 0 16px 34px rgba(117, 101, 246, 0.28);
  color: ${pcToken.surface};
  font-size: 18px;
  font-weight: 900;
}

.pc-case-card .ant-card-cover img {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
}

.pc-hero-showcase {
  position: relative;
  width: min(100%, 590px);
  height: clamp(430px, 39vw, 540px);
  justify-self: end;
  isolation: isolate;
}

.pc-hero-showcase::before {
  content: "";
  position: absolute;
  inset: -38px -30px;
  z-index: -2;
  border-radius: 56px;
  background:
    linear-gradient(rgba(229, 217, 255, 0.46) 1px, transparent 1px),
    linear-gradient(90deg, rgba(229, 217, 255, 0.46) 1px, transparent 1px),
    radial-gradient(circle at 52% 48%, rgba(255, 255, 255, 0.92), rgba(244, 239, 255, 0.62) 68%, transparent 100%);
  background-size: 48px 48px, 48px 48px, auto;
  -webkit-mask-image: radial-gradient(ellipse at center, #000 48%, transparent 82%);
  mask-image: radial-gradient(ellipse at center, #000 48%, transparent 82%);
}

.pc-hero-photo-card {
  position: absolute;
  margin: 0;
  overflow: hidden;
  border: clamp(10px, 1vw, 16px) solid ${pcToken.surface};
  background: ${pcToken.surface};
  box-shadow: 0 28px 64px rgba(74, 59, 148, 0.18);
}

.pc-hero-photo-card img {
  display: block;
  width: 100%;
  height: calc(100% - clamp(68px, 6.2vw, 88px));
  border-radius: 22px;
  object-fit: cover;
}

.pc-hero-photo-card figcaption {
  display: flex;
  height: clamp(68px, 6.2vw, 88px);
  align-items: center;
  justify-content: center;
  color: ${pcToken.ink};
  font-size: clamp(20px, 1.65vw, 30px);
  font-weight: 900;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.pc-hero-photo-card-1 {
  inset: 0 auto 0 0;
  width: 76%;
  z-index: 1;
  border-radius: 36px;
}

.pc-hero-photo-card-2 {
  top: 27%;
  right: 0;
  width: 57%;
  height: 56%;
  z-index: 2;
  border-radius: 32px;
}

.pc-hero-photo-card-2 img {
  border-radius: 18px;
}

.pc-main {
  width: min(calc(100% - var(--pc-content-inline-space)), var(--pc-content-max));
  max-width: none;
  margin: 0 auto;
  padding: 20px 0 72px;
}

.pc-section {
  padding: 64px 0;
}

.pc-pre-match-main {
  padding-top: 0;
  padding-bottom: 0;
}

.pc-pre-match-steps {
  padding: 40px 0 24px;
}

.pc-pre-match-steps .pc-section-title {
  margin-bottom: 20px;
}

.pc-pre-match-main + .pc-match-section {
  padding-top: 8px;
}

.pc-section-title {
  margin-bottom: 28px;
}

.pc-section-title h2.ant-typography {
  margin: 8px 0 0;
  max-width: 760px;
  color: ${pcToken.ink};
  font-size: 34px;
  line-height: 1.25;
  font-weight: 900;
  letter-spacing: 0;
}

.pc-section-title p.ant-typography {
  margin-top: 12px;
  max-width: 680px;
  color: ${pcToken.muted};
  font-size: 15px;
  line-height: 1.7;
}

.pc-eyebrow {
  color: ${pcToken.primary};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.pc-section-action {
  flex-shrink: 0;
}

.pc-loading-card.ant-card,
.pc-empty-data.ant-card {
  min-height: 178px;
  border: 1px solid rgba(232, 225, 255, 0.92);
  border-radius: ${radii.lg}px;
  box-shadow: ${pcToken.cardShadow};
}

.pc-empty-data.ant-card {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.82);
}

.pc-empty-data .ant-card-body {
  text-align: center;
}

.pc-steps-card.ant-card,
.pc-final-card.ant-card,
.pc-capability-card.ant-card {
  box-shadow: ${pcToken.cardShadow};
}

.pc-trend-card.ant-card,
.pc-case-card.ant-card,
.pc-destination-card.ant-card,
.pc-capability-card.ant-card {
  height: 100%;
  border-color: rgba(232, 225, 255, 0.92);
  box-shadow: ${pcToken.cardShadow};
}

.pc-trend-card.ant-card {
  height: 100%;
  border: 0;
  border-radius: ${radii['2xl']}px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 36px rgba(90, 72, 188, 0.08);
}

.pc-trend-card .ant-card-body {
  min-height: 300px;
  padding: 34px 24px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  text-align: center;
}

.pc-trend-image {
  width: 132px;
  height: 132px;
  margin-bottom: 28px;
  border-radius: 28px;
  object-fit: cover;
  box-shadow: 0 14px 30px rgba(76, 63, 140, 0.16);
}

.pc-trend-card h4.ant-typography {
  position: relative;
  margin: 0 0 14px;
  padding-bottom: 10px;
  color: ${pcToken.primaryDark};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
  line-height: 1.3;
  font-weight: 900;
}

.pc-trend-card h4.ant-typography::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 38px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, ${pcToken.primary}, ${pcToken.sky});
  transform: translateX(-50%);
}

.pc-trend-card p.ant-typography {
  margin: 0;
  color: ${pcToken.text};
  font-size: 14px;
  line-height: 1.65;
  white-space: nowrap;
}

.pc-interactive-card.ant-card {
  cursor: pointer;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.pc-interactive-card.ant-card:hover {
  border-color: rgba(117, 101, 246, 0.42);
  transform: translateY(-4px);
  box-shadow: 0 20px 44px rgba(83, 66, 174, 0.16);
}

.pc-interactive-card.ant-card:focus-visible {
  outline: 3px solid rgba(117, 101, 246, 0.3);
  outline-offset: 4px;
}

.pc-card-action.ant-typography {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: ${pcToken.primaryDark};
  font-size: 13px;
  font-weight: 900;
}

.pc-trend-card .pc-card-action {
  margin-top: 18px;
}

.pc-info-card.ant-card {
  cursor: default;
  border: 1px solid rgba(232, 225, 255, 0.76);
  background: rgba(248, 247, 255, 0.74);
  box-shadow: none;
}

.pc-info-card .pc-capability-avatar {
  color: ${pcToken.primaryDark};
  background: ${pcToken.primarySoft};
  box-shadow: none;
}

.pc-case-card.ant-card {
  display: flex;
  flex-direction: column;
}

.pc-case-card .ant-card-body,
.pc-capability-card .ant-card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pc-case-card .ant-card-body {
  flex: 1;
}

.pc-case-meta {
  margin-top: auto;
}

.pc-case-card h4.ant-typography,
.pc-destination-card h4.ant-typography,
.pc-capability-card h4.ant-typography {
  margin: 0;
  color: ${pcToken.ink};
}

.pc-case-card p.ant-typography,
.pc-destination-card p.ant-typography,
.pc-capability-card p.ant-typography,
.pc-final-card p.ant-typography {
  margin: 0;
  color: ${pcToken.muted};
  line-height: 1.65;
}

.pc-destination-card .ant-card-body {
  height: 100%;
  padding: 0;
}

.pc-destination-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 0;
  object-fit: cover;
  transition: transform 420ms ease;
}

.pc-destination-body {
  position: relative;
  z-index: 1;
  min-width: 0;
  flex: 1;
  min-height: 260px;
  padding: 26px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 12px;
  color: #fff;
  background: linear-gradient(180deg, rgba(20,14,52,.04) 10%, rgba(23,16,57,.88) 100%);
}

.pc-destination-card > .ant-card-body > .ant-flex {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.pc-destination-card:hover .pc-destination-img {
  transform: scale(1.045);
}

.pc-destination-card h4.ant-typography,
.pc-destination-card p.ant-typography,
.pc-destination-card .ant-typography,
.pc-destination-card .pc-card-action.ant-typography {
  color: #fff;
}

.pc-destination-card .ant-typography-secondary {
  color: rgba(255,255,255,.78);
}

.pc-final {
  padding: 34px 0 42px;
}

.pc-final-card.ant-card {
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(117, 101, 246, 0.12) 0%, rgba(142, 200, 255, 0.16) 48%, rgba(255, 255, 255, 0.96) 100%);
}

.pc-final-card h1.ant-typography {
  margin: 16px 0 10px;
  max-width: 720px;
  color: ${pcToken.ink};
  font-size: 36px;
  line-height: 1.22;
  font-weight: 900;
}

.pc-footer {
  padding: 28px 56px;
  background: #fff;
  border-top: 1px solid ${pcToken.border};
}

[data-anime] {
  will-change: transform, opacity;
}

@media (max-width: 1180px) {
  .pc-page {
    --pc-content-inline-space: 56px;
  }

  .pc-header {
    padding: 0 28px;
  }

  .pc-nav {
    display: none;
  }

  .pc-hero {
    padding-left: 28px;
    padding-right: 28px;
  }

  .pc-match-section {
    padding-left: 32px;
    padding-right: 32px;
  }

  .pc-hero-inner {
    grid-template-columns: 1fr;
    gap: 34px;
  }

  .pc-match-card.ant-card {
    width: 100%;
  }

  .pc-match-card .ant-card-body {
    padding: 32px;
  }

  .pc-hero-showcase {
    width: min(100%, 660px);
    height: clamp(420px, 70vw, 560px);
    justify-self: center;
  }
}

@media (max-width: 720px) {
  .pc-page {
    --pc-content-inline-space: 36px;
  }

  .pc-header {
    height: auto;
    padding: 14px 18px;
  }

  .pc-header .ant-space {
    display: none;
  }

  .pc-hero {
    min-height: auto;
    padding: 34px 18px;
  }

  .pc-match-section {
    padding: 28px 18px 0;
  }

  .pc-hero-title.ant-typography {
    font-size: 38px;
  }

  .pc-hero-desc.ant-typography {
    font-size: 16px;
  }

  .pc-hero-showcase {
    height: clamp(330px, 94vw, 430px);
  }

  .pc-hero-showcase::before {
    inset: -22px -14px;
    background-size: 36px 36px, 36px 36px, auto;
  }

  .pc-hero-photo-card {
    border-width: 9px;
  }

  .pc-hero-photo-card-1 {
    width: 79%;
    border-radius: 28px;
  }

  .pc-hero-photo-card-2 {
    top: 30%;
    width: 60%;
    height: 54%;
    border-radius: 24px;
  }

  .pc-match-card .ant-card-body {
    padding: 22px 18px;
  }

  .pc-match-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      "location"
      "preferences"
      "action";
    row-gap: 22px;
  }

  .pc-match-origin-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .pc-match-location {
    padding: 20px;
  }

  .pc-match-preferences {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .pc-match-group,
  .pc-match-group:nth-child(odd),
  .pc-match-group:nth-child(even) {
    padding: 20px;
    border: 1px solid rgba(232, 225, 255, 0.88);
  }

  .pc-match-group-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .pc-match-option-description.ant-tag {
    width: 100%;
    max-width: none;
    border-radius: ${radii.lg}px;
  }

  .pc-option-tags.ant-tag-checkable-group {
    gap: 10px;
  }

  .pc-option-tags .ant-tag-checkable-group-item.ant-tag {
    height: 46px;
    padding: 0 8px;
    font-size: 14px;
  }

  .pc-match-action {
    align-items: stretch;
    flex-direction: column;
    padding: 20px;
  }

  .pc-match-button.ant-btn {
    width: 100%;
  }

  .pc-main {
    padding-left: 0;
    padding-right: 0;
  }

  .pc-section {
    padding: 42px 0;
  }

  .pc-pre-match-steps {
    padding: 28px 0 16px;
  }

  .pc-pre-match-main + .pc-match-section {
    padding-top: 6px;
  }

  .pc-section-title {
    align-items: flex-start !important;
    flex-direction: column;
  }

  .pc-section-title h2.ant-typography {
    font-size: 27px;
  }

  .pc-destination-card .ant-flex {
    flex-direction: column;
  }

  .pc-destination-img {
    width: 100%;
    min-height: 190px;
  }

  .pc-footer {
    padding: 24px 18px;
  }
}

/* 2026 visual refresh: a playable city-quest interface inspired by editorial motion sites. */
.pc-page {
  --quest-ink: #11101c;
  --quest-purple: #7867ff;
  --quest-violet: #aa72ff;
  --quest-lime: #c9ff62;
  --quest-cyan: #78e8ff;
  --quest-paper: #f8f7fc;
  background: var(--quest-paper);
}

.pc-hero {
  min-height: calc(100dvh - 76px);
  padding: clamp(38px, 5vw, 76px) 56px clamp(54px, 6vw, 92px);
  background:
    radial-gradient(circle at 14% 20%, rgba(120, 103, 255, .34), transparent 32%),
    radial-gradient(circle at 83% 25%, rgba(120, 232, 255, .16), transparent 27%),
    radial-gradient(circle at 72% 84%, rgba(201, 255, 98, .1), transparent 23%),
    #11101c;
}

.pc-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  opacity: .34;
  pointer-events: none;
  background-image: radial-gradient(rgba(255,255,255,.28) .8px, transparent .8px);
  background-size: 18px 18px;
  mask-image: linear-gradient(90deg, #000, transparent 46%, #000);
}

.pc-hero::after {
  content: "WEEKEND / ORACLE";
  position: absolute;
  inset: auto -14px -26px auto;
  color: rgba(255,255,255,.035);
  background: none;
  font-size: clamp(76px, 11vw, 176px);
  font-weight: 950;
  line-height: .8;
  letter-spacing: -.07em;
  white-space: nowrap;
  pointer-events: none;
}

.pc-hero-inner {
  min-height: auto;
  grid-template-columns: minmax(0, 1.02fr) minmax(430px, .98fr);
  gap: clamp(46px, 6vw, 94px);
}

.pc-hero-copy { max-width: 720px; }

.pc-hero-status {
  width: fit-content;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 999px;
  color: #fff;
  background: rgba(255,255,255,.065);
  box-shadow: inset 0 1px rgba(255,255,255,.08);
  backdrop-filter: blur(14px);
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .11em;
}

.pc-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--quest-lime);
  box-shadow: 0 0 0 5px rgba(201,255,98,.1), 0 0 18px rgba(201,255,98,.72);
}

.pc-status-divider { width: 1px; height: 13px; background: rgba(255,255,255,.2); }
.pc-status-detail { color: rgba(255,255,255,.58); letter-spacing: .02em; }

.pc-hero-title.ant-typography {
  margin-top: 24px;
  max-width: 760px;
  color: #fff;
  font-size: clamp(54px, 5.6vw, 84px);
  line-height: .99;
  font-weight: 950;
  letter-spacing: -.065em;
}

.pc-hero-title.ant-typography span {
  color: transparent;
  background: linear-gradient(100deg, #fff 4%, var(--quest-cyan) 47%, var(--quest-lime) 96%);
  background-clip: text;
  -webkit-background-clip: text;
}

.pc-hero-desc.ant-typography {
  margin-top: 26px;
  max-width: 620px;
  color: rgba(255,255,255,.68);
  font-size: 18px;
  line-height: 1.75;
  font-weight: 550;
}

.pc-hero-actions { margin-top: 34px; }

.pc-hero-actions .ant-btn {
  height: 56px;
  padding-inline: 23px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 900;
  transition: transform .2s ease, background .2s ease, border-color .2s ease;
}

.pc-hero-actions .ant-btn-primary {
  border-color: var(--quest-lime);
  color: #14131e;
  background: var(--quest-lime);
  box-shadow: 0 16px 44px rgba(201,255,98,.2);
}

.pc-hero-actions .ant-btn-primary:hover {
  border-color: #dcff9b !important;
  color: #14131e !important;
  background: #dcff9b !important;
  transform: translateY(-2px);
}

.pc-hero-actions .ant-btn-default {
  border-color: rgba(255,255,255,.18);
  color: #fff;
  background: rgba(255,255,255,.07);
  box-shadow: none;
  backdrop-filter: blur(12px);
}

.pc-hero-actions .ant-btn-default:hover {
  border-color: rgba(255,255,255,.38) !important;
  color: #fff !important;
  background: rgba(255,255,255,.12) !important;
}

.pc-hero-quest-chips {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  color: rgba(255,255,255,.54);
  font-size: 12px;
  font-weight: 700;
}

.pc-hero-quest-chips span { display: inline-flex; align-items: center; gap: 7px; }
.pc-hero-quest-chips .pc-icon { color: var(--quest-cyan); }

.pc-stats { max-width: 650px; margin-top: 34px; }

.pc-stats .ant-statistic {
  min-height: 82px;
  padding: 14px 17px;
  border: 1px solid rgba(255,255,255,.11);
  border-radius: 18px;
  color: #fff;
  background: rgba(255,255,255,.045);
  box-shadow: inset 0 1px rgba(255,255,255,.05);
}

.pc-stats .ant-statistic-title {
  color: rgba(255,255,255,.46);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .06em;
}

.pc-stats .ant-statistic-content {
  color: #fff;
  font-family: var(--font-mono);
  font-size: 27px;
  font-weight: 850;
}

.pc-hero-showcase { width: min(100%, 610px); height: clamp(500px, 42vw, 620px); }

.pc-hero-showcase::before {
  inset: 3% 0 7% 3%;
  border: 1px solid rgba(255,255,255,.11);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(120,103,255,.22), transparent 64%);
  -webkit-mask-image: none;
  mask-image: none;
}

.pc-hero-orbit {
  position: absolute;
  inset: 7% 2% 10% 0;
  border: 1px dashed rgba(120,232,255,.24);
  border-radius: 50%;
  transform: rotate(-18deg);
}

.pc-hero-orbit::before,
.pc-hero-orbit::after {
  content: "";
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--quest-lime);
  box-shadow: 0 0 20px rgba(201,255,98,.75);
}

.pc-hero-orbit::before { top: 13%; left: 10%; }
.pc-hero-orbit::after { right: 8%; bottom: 17%; background: var(--quest-cyan); }

.pc-hero-photo-card {
  border: 1px solid rgba(255,255,255,.18);
  background: rgba(28,26,44,.92);
  box-shadow: 0 36px 90px rgba(0,0,0,.46);
  backdrop-filter: blur(20px);
}

.pc-hero-photo-card img {
  height: calc(100% - 78px);
  border-radius: 21px;
  filter: saturate(.94) contrast(1.04);
}

.pc-hero-photo-card figcaption {
  height: 78px;
  padding: 0 21px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  letter-spacing: 0;
}

.pc-hero-photo-card figcaption span {
  color: rgba(255,255,255,.44);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .11em;
}

.pc-hero-photo-card figcaption strong {
  font-size: clamp(18px, 1.55vw, 27px);
  font-weight: 950;
  white-space: nowrap;
}

.pc-hero-photo-card-1 {
  inset: 7% auto 2% 1%;
  width: 76%;
  height: 88%;
  border-radius: 30px;
  transform: rotate(-3.5deg);
}

.pc-hero-photo-card-2 {
  top: 30%;
  right: -2%;
  width: 56%;
  height: 49%;
  border-radius: 26px;
  transform: rotate(4deg);
}

.pc-hero-console {
  position: absolute;
  top: 0;
  right: 1%;
  z-index: 4;
  width: 205px;
  padding: 15px 17px;
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 16px;
  color: #fff;
  background: rgba(24,22,38,.8);
  box-shadow: 0 18px 50px rgba(0,0,0,.28);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pc-hero-console span,
.pc-hero-console small {
  color: rgba(255,255,255,.44);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: .08em;
}

.pc-hero-console strong { font-size: 13px; }

.pc-main { position: relative; padding-top: 42px; }
.pc-section { padding: 78px 0; }
.pc-section + .pc-section { border-top: 1px solid rgba(36,30,75,.08); }

.pc-eyebrow {
  color: #6756e8;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: .12em;
}

.pc-section-title h2.ant-typography {
  margin-top: 13px;
  max-width: 850px;
  color: #171522;
  font-size: clamp(35px, 3vw, 48px);
  line-height: 1.08;
  letter-spacing: -.04em;
}

.pc-trend-card.ant-card {
  overflow: hidden;
  border: 1px solid rgba(34,28,73,.08);
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 18px 50px rgba(47,38,90,.08);
}

.pc-trend-card .ant-card-body {
  min-height: 388px;
  padding: 14px 14px 22px;
  align-items: flex-start;
  text-align: left;
}

.pc-trend-image {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 10;
  margin-bottom: 22px;
  border-radius: 20px;
  box-shadow: none;
  object-fit: cover;
  transition: transform 500ms cubic-bezier(.2,.8,.2,1), filter 300ms ease;
}

.pc-trend-card:hover .pc-trend-image { transform: scale(1.025); filter: saturate(1.08); }

.pc-trend-card h4.ant-typography {
  padding: 0 10px;
  color: #171522;
  font-size: 20px;
}

.pc-trend-card h4.ant-typography::after { display: none; }
.pc-trend-card p.ant-typography { padding: 0 10px; color: #6d687d; white-space: normal; }
.pc-trend-card .pc-card-action { margin-left: 10px; color: #6554e9; }

.pc-case-card.ant-card,
.pc-destination-card.ant-card,
.pc-capability-card.ant-card {
  overflow: hidden;
  border-radius: 28px;
  border-color: rgba(34,28,73,.08);
  box-shadow: 0 18px 48px rgba(47,38,90,.08);
}

.pc-case-card .ant-card-cover img { border-radius: 0; }

.pc-capability-card.ant-card {
  position: relative;
  min-height: 310px;
  background: #d9d7e4;
  border-color: rgba(34,28,73,.08);
}

.pc-capability-card .ant-card-body {
  position: relative;
  min-height: 310px;
  padding: 0;
  display: block;
}

.pc-capability-image,
.pc-capability-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.pc-capability-image {
  object-fit: cover;
  filter: saturate(.94) contrast(1.02);
  transition: transform 520ms cubic-bezier(.2,.8,.2,1), filter 300ms ease;
}

.pc-capability-shade {
  background:
    linear-gradient(180deg, rgba(16,14,29,.04) 18%, rgba(16,14,29,.3) 52%, rgba(16,14,29,.9) 100%),
    linear-gradient(120deg, rgba(120,103,255,.13), transparent 52%);
}

.pc-capability-content {
  position: absolute;
  z-index: 2;
  inset: auto 0 0;
  padding: 26px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.pc-capability-card:hover .pc-capability-image {
  transform: scale(1.045);
  filter: saturate(1.08) contrast(1.04);
}

.pc-capability-card h4.ant-typography { color: #fff; text-shadow: 0 2px 16px rgba(0,0,0,.28); }
.pc-capability-card p.ant-typography,
.pc-capability-card div.ant-typography { color: rgba(255,255,255,.78); text-shadow: 0 2px 14px rgba(0,0,0,.26); }
.pc-info-card .pc-capability-avatar { color: #171522; background: var(--quest-lime); }

.pc-process-section {
  padding-bottom: 92px;
}

.pc-process-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(420px, .92fr);
  gap: clamp(38px, 5vw, 72px);
  align-items: stretch;
}

.pc-process-visual {
  position: relative;
  min-height: 500px;
  margin: 0;
  overflow: hidden;
  border-radius: 34px;
  background: #dfe7eb;
}

.pc-process-visual > img,
.pc-process-visual-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.pc-process-visual > img { object-fit: cover; }
.pc-process-visual-shade {
  background: linear-gradient(180deg, rgba(16,14,29,.04) 24%, rgba(16,14,29,.2) 55%, rgba(16,14,29,.86) 100%);
}

.pc-process-visual figcaption {
  position: absolute;
  z-index: 2;
  inset: auto 34px 32px;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pc-process-visual figcaption span {
  color: #c9ff62;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: .12em;
}

.pc-process-visual figcaption strong {
  max-width: 560px;
  font-size: clamp(25px, 2.3vw, 36px);
  line-height: 1.25;
  letter-spacing: -.025em;
}

.pc-process-list {
  margin: 0;
  padding: 0;
  border-top: 1px solid rgba(34,28,73,.12);
  list-style: none;
}

.pc-process-list li {
  min-height: 124px;
  padding: 22px 0;
  border-bottom: 1px solid rgba(34,28,73,.12);
  display: grid;
  grid-template-columns: 36px 44px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
}

.pc-process-index {
  align-self: start;
  padding-top: 4px;
  color: #8d879c;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
}

.pc-process-list .pc-capability-avatar {
  color: #171522;
  background: #c9ff62;
}

.pc-process-list h4.ant-typography {
  margin: 0 0 7px;
  color: #171522;
  font-size: 18px;
}

.pc-process-list p.ant-typography,
.pc-process-list div.ant-typography {
  margin: 0;
  color: #746f82;
  line-height: 1.65;
}

.pc-footer { padding: 36px 56px; color: #fff; background: #11101c; border-top: 0; }
.pc-footer .ant-typography,
.pc-footer .ant-typography-secondary { color: rgba(255,255,255,.62); }
.pc-footer strong.ant-typography { color: #fff; }

@media (max-width: 1180px) {
  .pc-hero { min-height: auto; }
  .pc-hero-inner { grid-template-columns: 1fr; }
  .pc-hero-copy { max-width: 850px; }
  .pc-hero-showcase { justify-self: center; }
  .pc-process-layout { grid-template-columns: 1fr; }
  .pc-process-visual { min-height: 430px; }
}

@media (max-width: 720px) {
  .pc-hero { padding: 42px 18px 58px; }
  .pc-hero-title.ant-typography { font-size: clamp(45px, 13vw, 64px); }
  .pc-hero-status { max-width: 100%; }
  .pc-status-detail { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pc-hero-actions { width: 100%; }
  .pc-hero-actions .ant-space-item { width: 100%; }
  .pc-hero-actions .ant-btn { width: 100%; }
  .pc-stats { margin-top: 26px; }
  .pc-stats .ant-col {
    flex: 0 0 33.333333%;
    max-width: 33.333333%;
  }
  .pc-stats .ant-statistic {
    min-height: 76px;
    padding: 12px 10px;
    border-radius: 15px;
  }
  .pc-stats .ant-statistic-title { font-size: 9px; white-space: nowrap; }
  .pc-stats .ant-statistic-content { font-size: 21px; }
  .pc-hero-showcase { width: 100%; height: clamp(390px, 113vw, 520px); }
  .pc-hero-console { top: 0; right: 0; width: 180px; }
  .pc-section { padding: 58px 0; }
  .pc-section-title h2.ant-typography { font-size: 34px; }
  .pc-trend-card .ant-card-body { min-height: 0; }
  .pc-process-visual { min-height: 380px; border-radius: 26px; }
  .pc-process-visual figcaption { inset: auto 24px 24px; }
  .pc-process-list li { grid-template-columns: 30px 40px minmax(0,1fr); gap: 12px; }
}
`;
