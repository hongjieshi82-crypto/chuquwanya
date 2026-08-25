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
  Steps,
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
const cafeImage = require('../../../assets/images/blindbox-scene-cafe.png') as StaticAsset;
const seasideImage = require('../../../assets/images/blindbox-scene-seaside.png') as StaticAsset;
const picnicImage = require('../../../assets/images/blindbox-scene-picnic.png') as StaticAsset;
const amusementImage = require('../../../assets/images/blindbox-scene-amusement.png') as StaticAsset;
const parkImage = require('../../../assets/images/blindbox-scene-park.png') as StaticAsset;
const westLakeImage = require('../../../assets/images/pc-hero-west-lake.jpg') as StaticAsset;
const shenzhenBayImage = require('../../../assets/images/pc-hero-shenzhen-bay.jpg') as StaticAsset;

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

const sceneImages = [cafeImage, seasideImage, picnicImage, amusementImage, parkImage] as const;
const tagCategoryOrder = ['scene', 'theme', 'audience', 'food', 'season', 'other'];
const tagCategoryImages: Record<string, PcImageSource> = {
  scene: westLakeImage,
  theme: cafeImage,
  audience: picnicImage,
  food: seasideImage,
  season: shenzhenBayImage,
  other: westLakeImage,
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

  return [
    { label: '精选目的地', value: data.loading ? '--' : data.destinations.length, suffix: data.loading ? undefined : '个' },
    { label: '旅行风格', value: data.loading ? '--' : data.tags.length, suffix: data.loading ? undefined : '种' },
    {
      label: hotCount > 0 ? '热门城市' : '平均好评',
      value: data.loading ? '--' : hotCount || averageRating,
      suffix: data.loading ? undefined : hotCount > 0 ? '个' : '分',
      precision: hotCount > 0 ? 0 : 1,
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
  { icon: <GiftOutlined />, title: '有点未知感', desc: '不用先研究完整攻略，也能得到一个能出发的选择。' },
  { icon: <RobotOutlined />, title: '少做选择题', desc: '把距离、时间、预算和偏好放在一起，帮你快速缩小范围。' },
  { icon: <AimOutlined />, title: '不合适就换', desc: '想安静、想热闹、想省钱，都可以换个方向重新开盒。' },
  { icon: <GlobalOutlined />, title: '出门前看清楚', desc: '先在电脑上挑好方向，路上再用手机继续查看和调整。' },
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
                  <Tag color={liveData.error ? 'warning' : liveData.loading ? 'processing' : 'purple'} icon={<SparkIcon />}>
                    {liveData.loading
                      ? '正在为你挑选灵感'
                      : liveData.error
                        ? '内容稍后刷新'
                        : `${liveData.destinations.length} 个目的地等你开盒`}
                  </Tag>
                  <Title className="pc-hero-title">开启你的专属旅行盲盒</Title>
                  <Paragraph className="pc-hero-desc">
                    告别攻略焦虑，让AI为你定制独一无二的旅行计划。少一点纠结，多一点马上出门的轻松感。
                  </Paragraph>
                  <Space className="pc-hero-actions" size={14} wrap>
                    <Button
                      type="primary"
                      size="large"
                      icon={<GiftOutlined />}
                      onClick={() => router.push('/box/config')}>
                      立即开启盲盒
                    </Button>
                    <Button size="large" icon={<CompassOutlined />} href="#目的地">
                      探索目的地
                    </Button>
                  </Space>
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
                  {heroCards.map((item, index) => (
                    <figure
                      key={item.id}
                      className={`pc-hero-photo-card pc-hero-photo-card-${index + 1}`}
                      data-anime="float-card">
                      <img src={imageUri(item.image)} alt={`${item.title}实地景色`} />
                      <figcaption>{item.title}</figcaption>
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
                          cover={<img src={imageUri(item.image)} alt={item.title} />}>
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
                            <img className="pc-destination-img" src={imageUri(item.image)} alt={item.title} />
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

              <section id="AI规划师" className="pc-section" data-anime="reveal">
                <SectionTitle eyebrow="适合懒得做攻略的你" title="把纠结留给我们，把出门留给今天" />
                <Row gutter={[18, 18]}>
                  {capabilityCards.map((item) => (
                    <Col xs={24} md={12} xl={6} key={item.title}>
                      <Card className="pc-capability-card pc-info-card" variant="borderless">
                        <Avatar className="pc-capability-avatar" icon={item.icon} />
                        <Title level={4}>{item.title}</Title>
                        <Paragraph>{item.desc}</Paragraph>
                      </Card>
                    </Col>
                  ))}
                </Row>
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

function SparkIcon() {
  return <ThunderboltOutlined />;
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
`;
