import CompassOutlinedSvg from '@ant-design/icons-svg/es/asn/CompassOutlined';
import CheckCircleOutlinedSvg from '@ant-design/icons-svg/es/asn/CheckCircleOutlined';
import DownloadOutlinedSvg from '@ant-design/icons-svg/es/asn/DownloadOutlined';
import EnvironmentOutlinedSvg from '@ant-design/icons-svg/es/asn/EnvironmentOutlined';
import GiftOutlinedSvg from '@ant-design/icons-svg/es/asn/GiftOutlined';
import HeartFilledSvg from '@ant-design/icons-svg/es/asn/HeartFilled';
import HeartOutlinedSvg from '@ant-design/icons-svg/es/asn/HeartOutlined';
import ReloadOutlinedSvg from '@ant-design/icons-svg/es/asn/ReloadOutlined';
import ShareAltOutlinedSvg from '@ant-design/icons-svg/es/asn/ShareAltOutlined';
import ThunderboltOutlinedSvg from '@ant-design/icons-svg/es/asn/ThunderboltOutlined';
import type { AbstractNode, IconDefinition } from '@ant-design/icons-svg/es/types';
import {
  App,
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  ConfigProvider,
  Descriptions,
  Divider,
  Flex,
  Layout,
  Row,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import 'antd/dist/reset.css';
import { Asset } from 'expo-asset';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SVGProps } from 'react';
import { useApp } from '@/contexts/app-context';
import { formatBudget, formatDistanceMetric, formatDuration } from '@/formatters';
import {
  clearPendingPcBoxDraw,
  readPendingPcBoxDraw,
  type PendingPcBoxDraw,
} from '@/lib/pc-box-open-state';
import { ApiHttpError } from '@/services/api';
import { palette, radii } from '@/theme';
import type { Activity, DrawResult } from '@/types';

const { Content } = Layout;
const { Paragraph, Text, Title } = Typography;

const MIN_OPENING_MS = 2_300;
const EXIT_TRANSITION_MS = 280;

type PcIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

type DrawOutcome = { ok: true } | { ok: false; reason: unknown };

const openToken = {
  canvas: palette.canvas,
  surface: palette.surface,
  paper: palette.paper,
  ink: palette.ink,
  text: palette.text,
  muted: palette.muted,
  primary: palette.primary,
  primaryDark: palette.primaryDark,
  primaryLight: palette.primaryLight,
  primarySoft: palette.primarySoft,
  border: palette.border,
  sky: palette.sky,
  skySoft: palette.skySoft,
  sunset: palette.sunset,
  dune: palette.dune,
  seafoam: palette.seafoam,
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
        className={className ? `pc-box-open-icon ${className}` : 'pc-box-open-icon'}
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

const CompassOutlined = createPcIcon(CompassOutlinedSvg);
const CheckCircleOutlined = createPcIcon(CheckCircleOutlinedSvg);
const DownloadOutlined = createPcIcon(DownloadOutlinedSvg);
const EnvironmentOutlined = createPcIcon(EnvironmentOutlinedSvg);
const GiftOutlined = createPcIcon(GiftOutlinedSvg);
const HeartFilled = createPcIcon(HeartFilledSvg);
const HeartOutlined = createPcIcon(HeartOutlinedSvg);
const ReloadOutlined = createPcIcon(ReloadOutlinedSvg);
const ShareAltOutlined = createPcIcon(ShareAltOutlinedSvg);
const ThunderboltOutlined = createPcIcon(ThunderboltOutlinedSvg);

const resultFallbackImage = require('../../../assets/images/pc-hero-west-lake.jpg') as number;


function getAddToPlanErrorMessage(reason: unknown) {
  if (reason instanceof ApiHttpError) {
    if (reason.code === 'WEEKLY_TODO_LIMIT_REACHED') {
      return '本周计划已满，当前版本每周暂限 1 条。';
    }

    if (reason.code === 'TODO_DATE_OUT_OF_CURRENT_WEEK') {
      return reason.message || '只能加入本周内的约定，请回到行程页选择本周日期。';
    }

    if (reason.code === 'TODO_DATE_IN_PAST') {
      return reason.message || '不能选择今天以前的日期，请重新选择本周日期。';
    }

    if (reason.status === 401) {
      return '当前体验会话已过期，请刷新后重试。';
    }

    return reason.message || '加入本周约定失败，请稍后重试。';
  }

  return reason instanceof Error && reason.message
    ? reason.message
    : '加入本周约定失败，请稍后重试。';
}

function wait(durationMs: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, durationMs));
}

function getResultCover(activity: Activity) {
  if (activity.coverImageUri) return activity.coverImageUri;
  return Asset.fromModule(resultFallbackImage).uri;
}

export default function PcBoxOpenScreen() {
  const router = useRouter();
  const { clearError, isBooting, startDraw } = useApp();
  const [pendingDraw] = useState<PendingPcBoxDraw | null>(() => readPendingPcBoxDraw());
  const [attempt, setAttempt] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(() =>
    pendingDraw ? null : '没有找到待开启的盲盒，请返回设置页重新选择偏好。',
  );
  const startedAttemptRef = useRef<number | null>(null);
  const runIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const executeDraw = useCallback(
    async (input: PendingPcBoxDraw, runId: number) => {
      setDrawError(null);
      setIsLeaving(false);
      setIsOpening(true);
      clearError();

      const outcomePromise: Promise<DrawOutcome> = startDraw(
        input.cityId,
        input.preferences,
      ).then(
        () => ({ ok: true }),
        (reason: unknown) => ({ ok: false, reason }),
      );

      await wait(MIN_OPENING_MS);
      const outcome = await outcomePromise;

      if (!mountedRef.current || runId !== runIdRef.current) return;

      if (!outcome.ok) {
        setIsOpening(false);
        setDrawError(
          outcome.reason instanceof Error
            ? outcome.reason.message
            : '盲盒开启失败，请稍后重试。',
        );
        return;
      }

      setIsLeaving(true);
      await wait(EXIT_TRANSITION_MS);
      if (!mountedRef.current || runId !== runIdRef.current) return;

      clearPendingPcBoxDraw();
      router.replace('/box/result');
    },
    [clearError, router, startDraw],
  );

  useEffect(() => {
    if (isBooting || startedAttemptRef.current === attempt) return;

    startedAttemptRef.current = attempt;
    if (!pendingDraw) {
      return;
    }

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    void executeDraw(pendingDraw, runId);
  }, [attempt, executeDraw, isBooting, pendingDraw]);

  const retryDraw = () => {
    if (!pendingDraw || isBooting || isOpening) return;
    setDrawError(null);
    setIsLeaving(false);
    setAttempt((value) => value + 1);
  };

  const returnToConfig = () => {
    runIdRef.current += 1;
    router.replace('/box/config');
  };

  const statusText = isBooting
    ? '正在准备旅行数据…'
    : isOpening
      ? '正在匹配目的地…'
      : '准备开启';

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: openToken.primary,
          colorInfo: openToken.primary,
          colorText: openToken.ink,
          colorTextSecondary: openToken.text,
          colorTextTertiary: openToken.muted,
          colorBgLayout: openToken.canvas,
          colorBgContainer: openToken.surface,
          colorBorder: openToken.border,
          borderRadius: radii.lg,
          borderRadiusLG: radii.xl,
          fontFamily:
            'Inter, PingFang SC, Microsoft YaHei, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        },
        components: {
          Button: {
            borderRadius: radii.pill,
            controlHeightLG: 52,
            primaryShadow: '0 12px 28px rgba(90, 72, 188, 0.24)',
          },
          Card: {
            borderRadiusLG: radii['2xl'],
          },
          Tag: {
            borderRadiusSM: radii.pill,
            defaultBg: openToken.primarySoft,
            defaultColor: openToken.primaryDark,
          },
        },
      }}>
      <div className="pc-box-open-page">
        <style>{pcBoxOpenCss}{pcBoxResultCss}</style>
        <Layout className="pc-box-open-layout">
          <Content className="pc-box-open-content">
            <Card
              className={`pc-box-open-card${isOpening ? ' is-opening' : ''}${
                isLeaving ? ' is-leaving' : ''
              }`}
              variant="borderless">
              <Tag className="pc-box-open-badge" icon={<ThunderboltOutlined />}>
                AI 旅行盲盒
              </Tag>

              <div className="pc-box-open-copy">
                <Title>旅行盲盒</Title>
                <Paragraph className="pc-box-open-subtitle">开启你的未知旅程</Paragraph>
                <Text className="pc-box-open-quote">
                  少一点攻略焦虑，多一点未知惊喜。
                </Text>
              </div>

              <div className="pc-box-open-action">
                <Button
                  className="pc-box-open-button"
                  type="primary"
                  size="large"
                  icon={<GiftOutlined size={20} />}
                  disabled={isBooting || isLeaving}
                  loading={isBooting || isOpening}>
                  {statusText}
                </Button>

                {drawError ? (
                  <Alert
                    className="pc-box-open-error"
                    type="error"
                    showIcon
                    title="盲盒开启失败"
                    description={drawError}
                    action={
                      <Space size={8} wrap>
                        {pendingDraw ? (
                          <Button
                            size="small"
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={retryDraw}>
                            重新开启
                          </Button>
                        ) : null}
                        <Button size="small" onClick={returnToConfig}>
                          返回设置
                        </Button>
                      </Space>
                    }
                  />
                ) : null}
              </div>

              <Space className="pc-box-open-hints" size={18} wrap>
                <Text>
                  <ReloadOutlined /> 完全随机
                </Text>
                <Text>
                  <CompassOutlined /> 偏好匹配
                </Text>
              </Space>

              <div
                key={attempt}
                className="pc-box-open-visual"
                aria-hidden="true">
                <div className="pc-box-open-magic-stage">
                  {Array.from({ length: 18 }, (_, index) => (
                    <span key={index} className="pc-box-open-spark" />
                  ))}
                  <span className="pc-box-open-orbit pc-box-open-orbit-one" />
                  <span className="pc-box-open-orbit pc-box-open-orbit-two" />
                  <span className="pc-box-open-stage-light" />
                </div>

                <div className="pc-loot-scene">
                  <span className="pc-loot-burst" />
                  <span className="pc-loot-shockwave" />
                  <span className="pc-loot-floor-glow" />

                  <svg
                    className="pc-loot-chest"
                    viewBox="0 0 360 330"
                    role="presentation">
                    <defs>
                      <linearGradient id="loot-body" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#A99BFF" />
                        <stop offset="0.46" stopColor="#7461E9" />
                        <stop offset="1" stopColor="#3E2A9B" />
                      </linearGradient>
                      <linearGradient id="loot-body-side" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0" stopColor="#4C35B0" />
                        <stop offset="1" stopColor="#291B71" />
                      </linearGradient>
                      <linearGradient id="loot-lid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#C9C1FF" />
                        <stop offset="0.42" stopColor="#8B79F4" />
                        <stop offset="1" stopColor="#5943C8" />
                      </linearGradient>
                      <linearGradient id="loot-gold" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#FFF1AE" />
                        <stop offset="0.48" stopColor="#E9C96F" />
                        <stop offset="1" stopColor="#B98B32" />
                      </linearGradient>
                      <radialGradient id="loot-gem" cx="38%" cy="28%" r="76%">
                        <stop offset="0" stopColor="#FFFFFF" />
                        <stop offset="0.2" stopColor="#D8D1FF" />
                        <stop offset="0.56" stopColor="#8B78FF" />
                        <stop offset="1" stopColor="#4B2AC3" />
                      </radialGradient>
                      <filter id="loot-shadow" x="-50%" y="-50%" width="200%" height="220%">
                        <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#2B176C" floodOpacity="0.34" />
                      </filter>
                      <filter id="loot-gem-glow" x="-120%" y="-120%" width="340%" height="340%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <ellipse className="pc-loot-svg-shadow" cx="180" cy="296" rx="112" ry="19" />

                    <g className="pc-loot-chest-body" filter="url(#loot-shadow)">
                      <path d="M66 151 H294 V270 Q294 290 274 290 H86 Q66 290 66 270 Z" fill="url(#loot-body)" />
                      <path d="M258 151 H294 V270 Q294 290 274 290 H258 Z" fill="url(#loot-body-side)" opacity="0.74" />
                      <path d="M66 170 H294 V191 H66 Z" fill="url(#loot-gold)" />
                      <path d="M91 191 H110 V290 H91 Z" fill="url(#loot-gold)" opacity="0.92" />
                      <path d="M250 191 H269 V290 H250 Z" fill="url(#loot-gold)" opacity="0.78" />
                      <path d="M70 266 H290 V278 Q290 290 276 290 H84 Q70 290 70 278 Z" fill="#392187" opacity="0.74" />
                      <path d="M78 202 Q117 187 154 204 T230 201 T285 198" fill="none" stroke="#C9BEFF" strokeWidth="3" opacity="0.28" />
                      <path d="M78 222 Q126 207 171 224 T284 218" fill="none" stroke="#E6E1FF" strokeWidth="2" opacity="0.18" />

                      <g className="pc-loot-lock">
                        <path d="M149 175 H211 V225 Q211 239 197 239 H163 Q149 239 149 225 Z" fill="url(#loot-gold)" />
                        <path d="M180 184 L199 204 L180 229 L161 204 Z" fill="url(#loot-gem)" filter="url(#loot-gem-glow)" />
                        <path d="M180 188 L193 203 L180 198 L167 203 Z" fill="#FFFFFF" opacity="0.5" />
                      </g>
                    </g>

                    <g className="pc-loot-chest-lid" filter="url(#loot-shadow)">
                      <path d="M56 142 Q58 77 115 56 Q180 31 245 56 Q302 77 304 142 Z" fill="url(#loot-lid)" />
                      <path d="M68 126 Q78 82 124 67 Q180 49 236 67 Q282 82 292 126" fill="none" stroke="#E7E2FF" strokeWidth="5" opacity="0.44" />
                      <path d="M56 132 H304 V161 H56 Z" fill="url(#loot-gold)" />
                      <path d="M91 76 L111 68 V132 H91 Z" fill="url(#loot-gold)" opacity="0.92" />
                      <path d="M249 68 L269 76 V132 H249 Z" fill="url(#loot-gold)" opacity="0.78" />
                      <path d="M78 111 Q135 86 180 102 Q225 86 282 111" fill="none" stroke="#FFFFFF" strokeWidth="4" opacity="0.16" />
                    </g>
                  </svg>

                  <div className="pc-loot-reward pc-loot-reward-compass">
                    <CompassOutlined size={28} />
                  </div>
                  <div className="pc-loot-reward pc-loot-reward-location">
                    <EnvironmentOutlined size={28} />
                  </div>
                  <div className="pc-loot-reward pc-loot-reward-spark">
                    <ThunderboltOutlined size={28} />
                  </div>
                  <div className="pc-loot-rarity">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>

              <Text className="pc-box-open-live-status" aria-live="polite">
                {pendingDraw?.summary ?? statusText}
              </Text>
            </Card>
          </Content>
        </Layout>
      </div>
    </ConfigProvider>
  );
}

export function PcBoxResultScreen() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: openToken.primary,
          colorInfo: openToken.primary,
          colorText: openToken.ink,
          colorTextSecondary: openToken.text,
          colorTextTertiary: openToken.muted,
          colorBgLayout: openToken.canvas,
          colorBgContainer: openToken.surface,
          colorBorder: openToken.border,
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
        },
      }}>
      <App>
        <PcBoxResultContent />
      </App>
    </ConfigProvider>
  );
}

function PcBoxResultContent() {
  const router = useRouter();
  const { addCurrentDrawToTodos, currentDraw, reroll } = useApp();
  const { message } = App.useApp();
  const [isRerolling, setIsRerolling] = useState(false);
  const [isAddingToPlan, setIsAddingToPlan] = useState(false);

  const handleReroll = async () => {
    if (!currentDraw || currentDraw.attemptsRemaining <= 0 || isRerolling) return;

    setIsRerolling(true);
    try {
      await reroll();
      message.success('已为你换了一个新选择');
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : '重新抽取失败，请稍后重试。');
    } finally {
      setIsRerolling(false);
    }
  };

  const handleAddToPlan = async () => {
    if (!currentDraw || isAddingToPlan) return;

    setIsAddingToPlan(true);
    try {
      const result = await addCurrentDrawToTodos();
      message.success(result.alreadyExists ? '该行程已在本周约定中' : '已加入本周约定');
      router.replace('/trips');
    } catch (reason) {
      message.error(getAddToPlanErrorMessage(reason));
    } finally {
      setIsAddingToPlan(false);
    }
  };

  return (
    <div className="pc-box-open-page">
      <style>{pcBoxResultCss}</style>
      {currentDraw ? (
        <PcBoxResult
          draw={currentDraw}
          isAddingToPlan={isAddingToPlan}
          isRerolling={isRerolling}
          onAddToPlan={() => void handleAddToPlan()}
          onReroll={() => void handleReroll()}
          onReset={() => router.replace('/box/config')}
        />
      ) : (
        <main className="pc-box-result-empty">
          <Card>
            <Title level={3}>还没有盲盒结果</Title>
            <Paragraph>先选择偏好并开启盲盒，我们会为你生成一份可执行的出行建议。</Paragraph>
            <Button type="primary" icon={<GiftOutlined />} onClick={() => router.replace('/box/config')}>
              去开启盲盒
            </Button>
          </Card>
        </main>
      )}
    </div>
  );
}

function PcBoxResult({
  draw,
  isAddingToPlan,
  isRerolling,
  onAddToPlan,
  onReroll,
  onReset,
}: {
  draw: DrawResult;
  isAddingToPlan: boolean;
  isRerolling: boolean;
  onAddToPlan: () => void;
  onReroll: () => void;
  onReset: () => void;
}) {
  const { message } = App.useApp();
  const { activity, attemptsRemaining, recommendation } = draw;
  const [isFavorite, setIsFavorite] = useState(false);
  const activitySteps = activity.steps.length
    ? activity.steps
    : ['抵达后先熟悉周边环境', '按自己的节奏体验核心玩法', '留出时间休息和拍照'];
  const checklist = ['身份证或学生证', '充电宝和数据线', '雨伞或轻便雨衣', '舒适步行鞋', '少量现金和常用药'];
  const recommendationReasons = [
    recommendation?.reason,
    `符合${activity.mood}心情与${activity.category}玩法偏好。`,
    `预计${formatDuration(activity.durationMinutes)}，预算约${formatBudget(activity.budgetYuan)}，安排起来更轻松。`,
  ].filter((reason): reason is string => Boolean(reason));

  const shareResult = async () => {
    const text = `我在懒得动抽到了「${activity.title}」，${activity.summary}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: '旅行盲盒结果', text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(text);
        message.success('分享文案已复制');
      }
    } catch {
      // 用户取消系统分享时无需额外提示。
    }
  };

  const exportResult = () => {
    window.print();
  };

  return (
    <main className="pc-box-result">
      <Card className="pc-box-result-hero" variant="borderless">
        <img className="pc-box-result-cover" src={getResultCover(activity)} alt={activity.title} />
        <div className="pc-box-result-cover-shade" />
        <div className="pc-box-result-hero-copy">
          <Tag className="pc-box-result-place" icon={<EnvironmentOutlined />}>
            {activity.cityName} · {activity.district}
          </Tag>
          <Title level={1}>{activity.title}</Title>
          <Paragraph>{activity.summary}</Paragraph>
          <Space className="pc-box-result-meta" size={[10, 10]} wrap>
            <Tag>⏱ {formatDuration(activity.durationMinutes)}</Tag>
            <Tag>💰 {formatBudget(activity.budgetYuan)}</Tag>
            <Tag>📍 {formatDistanceMetric(activity.distanceKm, recommendation?.constraintSummary.distance)}</Tag>
            <Tag color="purple">✨ {recommendation?.display.badge ?? '为你精选'}</Tag>
          </Space>
        </div>
      </Card>

      <Card className="pc-box-result-toolbar" variant="borderless">
        <Flex align="center" gap={10} justify="space-between" wrap>
          <Space wrap>
            <Button
              icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
              type={isFavorite ? 'primary' : 'default'}
              onClick={() => {
                setIsFavorite((value) => !value);
                message.success(isFavorite ? '已取消收藏' : '已收藏这次灵感');
              }}>
              {isFavorite ? '已收藏' : '收藏'}
            </Button>
            <Button icon={<ShareAltOutlined />} onClick={() => void shareResult()}>
              分享
            </Button>
            <Button icon={<DownloadOutlined />} onClick={exportResult}>
              导出 PDF
            </Button>
          </Space>
          <Space wrap>
            <Text type="secondary">还可重抽 {attemptsRemaining} 次</Text>
            <Button disabled={attemptsRemaining <= 0} loading={isRerolling} icon={<ReloadOutlined />} onClick={onReroll}>
              再抽一次
            </Button>
            <Button
              type="primary"
              disabled={isAddingToPlan}
              icon={<CheckCircleOutlined />}
              loading={isAddingToPlan}
              onClick={onAddToPlan}>
              加入本周约定
            </Button>
          </Space>
        </Flex>
      </Card>

      <Row className="pc-box-result-layout" gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <div className="pc-box-result-main">
            <Card className="pc-box-result-card" title="行程总览">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <div className="pc-box-result-overview-item">
                    <Text type="secondary">适合心情</Text>
                    <Text strong>{activity.mood}</Text>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="pc-box-result-overview-item">
                    <Text type="secondary">建议时长</Text>
                    <Text strong>{formatDuration(activity.durationMinutes)}</Text>
                  </div>
                </Col>
              </Row>
            </Card>

            <Card
              className="pc-box-result-card"
              title="为什么推荐你来这里"
              extra={<Tag color="purple">AI 匹配依据</Tag>}>
              <Space className="pc-box-result-reasons" orientation="vertical" size={12}>
                {recommendationReasons.map((reason, index) => (
                  <div className="pc-box-result-reason" key={`reason-${index}`}>
                    <CheckCircleOutlined size={18} />
                    <Text>{reason}</Text>
                  </div>
                ))}
              </Space>
              <Divider />
              <Space wrap>
                {Array.from(
                  new Set(
                    [activity.category, activity.mood, ...activity.moodTags.slice(0, 3)]
                      .map((tag) => String(tag).trim())
                      .filter(Boolean),
                  ),
                ).map((tag, index) => (
                  <Tag color="blue" key={`match-tag-${index}`}>
                    {tag}
                  </Tag>
                ))}
              </Space>
            </Card>

            <Card className="pc-box-result-card" title="今天该怎么玩" extra={<Text type="secondary">用户视角路线</Text>}>
              <Timeline
                items={activitySteps.map((step, index) => ({
                  color: index === 0 ? openToken.primary : openToken.sky,
                  content: (
                    <div className="pc-box-result-timeline-item">
                      <Text strong>{['准备出发', '沉浸体验', '轻松收尾'][index] ?? `第 ${index + 1} 步`}</Text>
                      <Paragraph>{step}</Paragraph>
                    </div>
                  ),
                }))}
              />
            </Card>

            <Card className="pc-box-result-card" title="出发前清单" extra={<Text type="secondary">少漏带东西</Text>}>
              <Row gutter={[12, 12]}>
                {checklist.map((item) => (
                  <Col xs={24} sm={12} key={item}>
                    <Checkbox className="pc-box-result-check">{item}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Card>
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <aside className="pc-box-result-side">
            <Card className="pc-box-result-card" title="目的地信息">
              <Paragraph>{activity.description || activity.summary}</Paragraph>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="城市地点">{activity.cityName} · {activity.district}</Descriptions.Item>
                <Descriptions.Item label="详细地址">{activity.address || '出发前请查看导航'}</Descriptions.Item>
                <Descriptions.Item label="适合人群">{activity.minPartySize}–{activity.maxPartySize} 人同行</Descriptions.Item>
                <Descriptions.Item label="盲盒等级">{recommendation?.display.badge ?? '为你精选'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="pc-box-result-card" title="出行提醒">
              <Paragraph>{activity.tips[0] ?? '建议出发前再次确认天气、开放时间与交通班次。'}</Paragraph>
            </Card>

            <Card className="pc-box-result-card" title="旅行风险提醒">
              <Space orientation="vertical" size={12}>
                <div><Text strong>天气变化</Text><Paragraph>出发前一天确认天气，雨天准备室内备选方案。</Paragraph></div>
                <div><Text strong>人流排队</Text><Paragraph>周末热门地点人流较多，建议预留弹性时间。</Paragraph></div>
              </Space>
            </Card>

            <Button block className="pc-box-result-reset" onClick={onReset}>
              返回设置，重新匹配偏好
            </Button>
          </aside>
        </Col>
      </Row>
    </main>
  );
}

const pcBoxOpenCss = `
.pc-box-open-page {
  min-height: 100dvh;
  color: ${openToken.ink};
  background: ${openToken.canvas};
}

.pc-box-open-layout {
  min-height: 100dvh;
  background: transparent;
}

.pc-box-open-header {
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
  border-bottom: 1px solid ${openToken.border};
  backdrop-filter: blur(18px);
}

.pc-box-open-brand {
  min-width: 148px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: ${openToken.ink};
  font-size: 18px;
  font-weight: 900;
  text-decoration: none;
}

.pc-box-open-brand img {
  width: 38px;
  height: 38px;
  object-fit: contain;
}

.pc-box-open-nav {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 26px;
}

.pc-box-open-nav a {
  padding-bottom: 6px;
  border-bottom: 3px solid transparent;
  color: ${openToken.text};
  font-weight: 700;
  line-height: 1.2;
  text-decoration: none;
  white-space: nowrap;
}

.pc-box-open-nav a:hover,
.pc-box-open-nav a.active {
  color: ${openToken.primary};
}

.pc-box-open-nav a.active {
  border-bottom-color: ${openToken.primary};
}

.pc-box-open-back.ant-btn {
  min-width: 112px;
  color: ${openToken.text};
  font-weight: 800;
}

.pc-box-open-content {
  min-height: calc(100dvh - 76px);
  padding: 48px 40px 64px;
  background:
    radial-gradient(circle at 16% 18%, rgba(117, 101, 246, 0.14), transparent 30%),
    radial-gradient(circle at 84% 20%, rgba(142, 200, 255, 0.15), transparent 28%),
    radial-gradient(circle at 72% 82%, rgba(157, 140, 255, 0.12), transparent 34%),
    linear-gradient(135deg, ${openToken.primarySoft}, ${openToken.canvas});
}

.pc-box-open-card.ant-card {
  width: 100%;
  max-width: 1080px;
  min-height: calc(100dvh - 188px);
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 36px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 28px 70px rgba(90, 72, 188, 0.16);
  backdrop-filter: blur(16px);
  transition: opacity 280ms ease, transform 280ms ease, filter 280ms ease;
}

.pc-box-open-card.is-leaving {
  opacity: 0;
  transform: translateY(-12px);
  filter: blur(5px);
}

.pc-box-open-card .ant-card-body {
  min-height: inherit;
  padding: 44px 56px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  grid-template-areas:
    "badge visual"
    "copy visual"
    "action visual"
    "hints visual"
    "status visual";
  align-content: center;
  align-items: center;
  gap: 20px 72px;
}

.pc-box-open-badge.ant-tag {
  grid-area: badge;
  justify-self: start;
  align-self: end;
  margin: 0;
  padding: 7px 14px;
  border: 0;
  color: ${openToken.surface};
  background: linear-gradient(135deg, ${openToken.primary}, ${openToken.primaryLight});
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 8px 22px rgba(117, 101, 246, 0.24);
}

.pc-box-open-copy {
  grid-area: copy;
  min-width: 0;
}

.pc-box-open-copy h1.ant-typography {
  margin: 0 0 12px;
  color: ${openToken.ink};
  font-size: clamp(44px, 5vw, 68px);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.pc-box-open-subtitle.ant-typography {
  margin: 0 0 14px;
  color: ${openToken.primaryDark};
  font-size: 20px;
  font-weight: 800;
}

.pc-box-open-quote {
  display: block;
  color: ${openToken.muted};
  font-size: 15px;
  line-height: 1.7;
}

.pc-box-open-action {
  grid-area: action;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
}

.pc-box-open-button.ant-btn {
  width: 320px;
  min-height: 64px;
  padding: 0 30px;
  border-radius: ${radii.pill}px;
  font-size: 18px;
  font-weight: 900;
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.pc-box-open-button.ant-btn:not(:disabled):hover {
  transform: translateY(-2px);
}

.pc-box-open-button.ant-btn:not(:disabled):active {
  transform: scale(0.98);
}

.pc-box-open-error.ant-alert {
  width: min(100%, 470px);
  border-radius: ${radii.lg}px;
}

.pc-box-open-hints {
  grid-area: hints;
  justify-self: start;
}

.pc-box-open-hints .ant-typography {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${openToken.muted};
  font-size: 13px;
  font-weight: 700;
}

.pc-box-open-live-status {
  grid-area: status;
  min-width: 0;
  overflow: hidden;
  color: ${openToken.muted};
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-box-open-visual {
  position: relative;
  grid-area: visual;
  width: 420px;
  height: 420px;
  display: grid;
  place-items: center;
}

.pc-box-open-magic-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.pc-box-open-stage-light {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 360px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 211, 106, 0.28), transparent 66%);
  filter: blur(12px);
  transform: translate(-50%, -50%);
  animation: pcBoxOpenStageBreath 2.8s ease-in-out infinite;
}

.pc-box-open-orbit {
  position: absolute;
  left: 50%;
  top: 50%;
  border: 1px solid rgba(117, 101, 246, 0.22);
  border-radius: 50%;
  transform: translate(-50%, -50%) rotate(-12deg);
  box-shadow: 0 0 24px rgba(117, 101, 246, 0.12);
}

.pc-box-open-orbit-one {
  width: 390px;
  height: 112px;
  animation: pcBoxOpenOrbitSpin 5.8s linear infinite;
}

.pc-box-open-orbit-two {
  width: 310px;
  height: 90px;
  border-color: rgba(142, 200, 255, 0.38);
  animation: pcBoxOpenOrbitSpinReverse 7.2s linear infinite;
}

.pc-box-open-spark {
  position: absolute;
  left: var(--x, 50%);
  top: var(--y, 50%);
  width: var(--size, 4px);
  height: var(--size, 4px);
  border-radius: 999px;
  background: var(--spark-color, ${openToken.dune});
  box-shadow: 0 0 14px var(--spark-color, ${openToken.dune});
  opacity: 0.24;
  animation: pcBoxOpenSparkFloat var(--duration, 3.4s) ease-in-out infinite;
  animation-delay: var(--delay, 0s);
}

.pc-box-open-spark:nth-child(1) { --x: 12%; --y: 18%; --size: 5px; }
.pc-box-open-spark:nth-child(2) { --x: 22%; --y: 34%; --size: 3px; --spark-color: ${openToken.sunset}; --delay: .2s; }
.pc-box-open-spark:nth-child(3) { --x: 78%; --y: 18%; --spark-color: ${openToken.sky}; --delay: .4s; }
.pc-box-open-spark:nth-child(4) { --x: 88%; --y: 38%; --size: 5px; --spark-color: ${openToken.primaryLight}; --delay: .1s; }
.pc-box-open-spark:nth-child(5) { --x: 16%; --y: 62%; --spark-color: ${openToken.seafoam}; --delay: .7s; }
.pc-box-open-spark:nth-child(6) { --x: 82%; --y: 64%; --spark-color: ${openToken.sunset}; --delay: .5s; }
.pc-box-open-spark:nth-child(7) { --x: 42%; --y: 16%; --size: 3px; --spark-color: #fff; --delay: .9s; }
.pc-box-open-spark:nth-child(8) { --x: 58%; --y: 20%; --spark-color: ${openToken.dune}; --delay: .3s; }
.pc-box-open-spark:nth-child(9) { --x: 9%; --y: 48%; --spark-color: ${openToken.sky}; --delay: .6s; }
.pc-box-open-spark:nth-child(10) { --x: 92%; --y: 52%; --spark-color: ${openToken.primaryLight}; --delay: .8s; }
.pc-box-open-spark:nth-child(11) { --x: 35%; --y: 75%; --delay: .4s; }
.pc-box-open-spark:nth-child(12) { --x: 65%; --y: 76%; --size: 5px; --spark-color: ${openToken.sunset}; --delay: .2s; }
.pc-box-open-spark:nth-child(13) { --x: 48%; --y: 68%; --spark-color: #fff; --delay: .5s; }
.pc-box-open-spark:nth-child(14) { --x: 28%; --y: 22%; --spark-color: ${openToken.seafoam}; --delay: .1s; }
.pc-box-open-spark:nth-child(15) { --x: 73%; --y: 31%; --spark-color: ${openToken.primaryLight}; --delay: .7s; }
.pc-box-open-spark:nth-child(16) { --x: 18%; --y: 78%; --spark-color: ${openToken.dune}; --delay: .9s; }
.pc-box-open-spark:nth-child(17) { --x: 86%; --y: 78%; --spark-color: ${openToken.sky}; --delay: .3s; }
.pc-box-open-spark:nth-child(18) { --x: 50%; --y: 10%; --size: 5px; --spark-color: #fff; --delay: .6s; }

.pc-box-open-gift {
  position: relative;
  z-index: 3;
  width: 210px;
  height: 232px;
  border-radius: 34px;
  background:
    linear-gradient(90deg, transparent 42%, rgba(142, 200, 255, 0.9) 43% 57%, transparent 58%),
    linear-gradient(145deg, ${openToken.primaryLight}, ${openToken.primary} 52%, ${openToken.primaryDark});
  box-shadow:
    0 22px 48px rgba(90, 72, 188, 0.28),
    inset 0 0 0 1px rgba(255, 255, 255, 0.28);
  transform-style: preserve-3d;
}

.pc-box-open-lid {
  position: absolute;
  top: -18px;
  left: 34px;
  z-index: 5;
  width: 142px;
  height: 42px;
  border-radius: 19px 19px 8px 8px;
  background:
    linear-gradient(90deg, transparent 42%, rgba(142, 200, 255, 0.94) 43% 57%, transparent 58%),
    linear-gradient(145deg, ${openToken.primaryLight}, ${openToken.primary});
  box-shadow: 0 12px 24px rgba(90, 72, 188, 0.22);
  transform-origin: 50% 100%;
}

.pc-box-open-gift-body {
  position: relative;
  z-index: 3;
  height: 100%;
  padding: 40px 34px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  place-items: center;
  gap: 28px;
}

.pc-box-open-gift-body::before,
.pc-box-open-gift-body::after {
  content: "";
  position: absolute;
  border-radius: 12px;
  background: rgba(142, 200, 255, 0.88);
}

.pc-box-open-gift-body::before {
  top: 0;
  left: 96px;
  width: 19px;
  height: 100%;
}

.pc-box-open-gift-body::after {
  top: 104px;
  right: 0;
  left: 0;
  height: 19px;
}

.pc-box-open-gift-body span {
  position: relative;
  z-index: 2;
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: ${openToken.primaryDark};
  background: ${openToken.surface};
  box-shadow: 0 4px 12px rgba(24, 20, 51, 0.14);
}

.pc-box-open-aura,
.pc-box-open-burst,
.pc-box-open-shockwave {
  position: absolute;
  left: 50%;
  top: 48%;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.pc-box-open-aura {
  z-index: 0;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  opacity: 0;
  background:
    radial-gradient(circle, rgba(255,255,255,.76), rgba(255,211,106,.28) 36%, transparent 66%),
    conic-gradient(from 20deg, transparent, rgba(142,200,255,.7), transparent, rgba(117,101,246,.42), transparent);
}

.pc-box-open-burst {
  z-index: 1;
  width: 440px;
  height: 440px;
  border-radius: 50%;
  opacity: 0;
  background: radial-gradient(circle, rgba(255,255,255,.96), rgba(255,211,106,.52) 22%, rgba(117,101,246,.16) 52%, transparent 70%);
  transform: translate(-50%, -50%) scale(.24);
}

.pc-box-open-shockwave {
  z-index: 2;
  width: 184px;
  height: 184px;
  border: 2px solid rgba(255,255,255,.82);
  border-radius: 50%;
  opacity: 0;
  box-shadow: 0 0 24px rgba(255,255,255,.7), 0 0 42px rgba(142,200,255,.44);
}

.pc-box-open-confetti {
  position: absolute;
  left: 50%;
  top: 52%;
  z-index: 6;
  width: 9px;
  height: 20px;
  border-radius: 4px;
  opacity: 0;
  background: var(--confetti-color, ${openToken.dune});
  box-shadow: 0 0 12px rgba(255, 211, 106, 0.48);
  pointer-events: none;
}

.pc-box-open-confetti:nth-of-type(1) { --x: -130px; --y: -128px; --r: -300deg; --confetti-color: ${openToken.primary}; }
.pc-box-open-confetti:nth-of-type(2) { --x: -84px; --y: -164px; --r: 240deg; --confetti-color: ${openToken.dune}; }
.pc-box-open-confetti:nth-of-type(3) { --x: -22px; --y: -150px; --r: -210deg; --confetti-color: ${openToken.sky}; }
.pc-box-open-confetti:nth-of-type(4) { --x: 48px; --y: -166px; --r: 320deg; --confetti-color: ${openToken.seafoam}; }
.pc-box-open-confetti:nth-of-type(5) { --x: 112px; --y: -128px; --r: -260deg; --confetti-color: ${openToken.primaryLight}; }
.pc-box-open-confetti:nth-of-type(6) { --x: 132px; --y: -62px; --r: 210deg; --confetti-color: ${openToken.sunset}; }
.pc-box-open-confetti:nth-of-type(7) { --x: -126px; --y: -58px; --r: 190deg; --confetti-color: ${openToken.sky}; }
.pc-box-open-confetti:nth-of-type(8) { --x: 32px; --y: -190px; --r: -240deg; --confetti-color: ${openToken.primary}; }
.pc-box-open-confetti:nth-of-type(9) { --x: -38px; --y: -198px; --r: 280deg; --confetti-color: ${openToken.primaryDark}; }
.pc-box-open-confetti:nth-of-type(10) { --x: 142px; --y: -98px; --r: -220deg; --confetti-color: ${openToken.seafoam}; }

.pc-box-open-card.is-opening .pc-box-open-gift {
  animation:
    pcBoxOpenRumble .18s ease-in-out 0s 8,
    pcBoxOpenBigShake .42s cubic-bezier(.18,.89,.32,1.28) 1.24s 2,
    pcBoxOpenLift .62s ease 2.02s forwards;
}

.pc-box-open-card.is-opening .pc-box-open-lid {
  animation: pcBoxOpenLid .78s cubic-bezier(.2,.9,.2,1) 1.82s forwards;
}

.pc-box-open-card.is-opening .pc-box-open-aura {
  animation: pcBoxOpenAuraSpin 2.6s linear infinite, pcBoxOpenAuraIn .45s ease forwards;
}

.pc-box-open-card.is-opening .pc-box-open-burst {
  animation: pcBoxOpenBurst 1.08s ease-out 1.38s forwards;
}

.pc-box-open-card.is-opening .pc-box-open-shockwave {
  animation: pcBoxOpenShockwave .72s cubic-bezier(.12,.78,.28,1) 1.62s forwards;
}

.pc-box-open-card.is-opening .pc-box-open-gift-body span {
  animation: pcBoxOpenIconFloat .82s ease-out 2.02s both;
}

.pc-box-open-card.is-opening .pc-box-open-gift-body span:nth-child(2) { animation-delay: 2.08s; }
.pc-box-open-card.is-opening .pc-box-open-gift-body span:nth-child(3) { animation-delay: 2.14s; }
.pc-box-open-card.is-opening .pc-box-open-gift-body span:nth-child(4) { animation-delay: 2.20s; }

.pc-box-open-card.is-opening .pc-box-open-confetti {
  animation: pcBoxOpenConfetti 1.16s cubic-bezier(.12,.78,.28,1) 2s forwards;
}

.pc-box-open-card.is-opening .pc-box-open-stage-light {
  animation: pcBoxOpenStageCharge 2.3s cubic-bezier(.18,.74,.2,1) both;
}

.pc-box-open-card.is-opening .pc-box-open-spark {
  animation: pcBoxOpenSparkCharge 2.3s cubic-bezier(.18,.74,.2,1) both;
  animation-delay: var(--delay, 0s);
}

@keyframes pcBoxOpenRumble {
  0%, 100% { transform: rotate(0) translate(0); }
  25% { transform: rotate(-2.6deg) translate(-3px, -2px); }
  50% { transform: rotate(2.4deg) translate(3px, 1px); }
  75% { transform: rotate(-1.8deg) translate(-2px, 2px); }
}

@keyframes pcBoxOpenBigShake {
  0%, 100% { transform: rotate(0) translateY(0) scale(1); }
  20% { transform: rotate(-7deg) translate(-8px, -7px) scale(1.03); }
  42% { transform: rotate(7deg) translate(8px, 4px) scale(1.05); }
  64% { transform: rotate(-5deg) translate(-6px, 2px) scale(1.04); }
  82% { transform: rotate(4deg) translate(5px, -4px) scale(1.02); }
}

@keyframes pcBoxOpenLift { to { transform: translateY(-14px) scale(1.04); } }
@keyframes pcBoxOpenLid { to { transform: translateY(-48px) rotateX(64deg) rotate(-7deg); } }
@keyframes pcBoxOpenAuraIn { to { opacity: 1; } }
@keyframes pcBoxOpenAuraSpin { to { transform: translate(-50%, -50%) rotate(360deg); } }

@keyframes pcBoxOpenBurst {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(.24); }
  32% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2.1); }
}

@keyframes pcBoxOpenShockwave {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(.42); }
  20% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2.4); }
}

@keyframes pcBoxOpenIconFloat {
  0% { transform: translateY(0) scale(1); filter: brightness(1); }
  45% { transform: translateY(-18px) scale(1.16); filter: brightness(1.12); }
  100% { transform: translateY(-8px) scale(1.04); filter: brightness(1); }
}

@keyframes pcBoxOpenConfetti {
  0% { opacity: 0; transform: translate(0) rotate(0) scale(.45); }
  18%, 72% { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--x), var(--y)) rotate(var(--r)) scale(1); }
}

@keyframes pcBoxOpenStageBreath {
  0%, 100% { opacity: .58; transform: translate(-50%, -50%) scale(.92); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
}

@keyframes pcBoxOpenStageCharge {
  0% { opacity: .42; transform: translate(-50%, -50%) scale(.74); }
  46% { opacity: .72; transform: translate(-50%, -50%) scale(1.02); }
  72% { opacity: 1; transform: translate(-50%, -50%) scale(1.28); }
  100% { opacity: .52; transform: translate(-50%, -50%) scale(1.04); }
}

@keyframes pcBoxOpenOrbitSpin { to { transform: translate(-50%, -50%) rotate(348deg); } }
@keyframes pcBoxOpenOrbitSpinReverse { to { transform: translate(-50%, -50%) rotate(-372deg); } }

@keyframes pcBoxOpenSparkFloat {
  0%, 100% { opacity: .18; transform: translateY(0) scale(.82); }
  45% { opacity: .9; transform: translateY(-16px) scale(1.16); }
}

@keyframes pcBoxOpenSparkCharge {
  0% { opacity: .12; transform: translateY(0) scale(.72); }
  38% { opacity: .7; transform: translateY(-14px) scale(1.12); }
  72% { opacity: 1; transform: translateY(-34px) scale(1.5); }
  100% { opacity: 0; transform: translateY(-54px) scale(.92); }
}

/* Branded game-reward chest: inspired by gacha reveal pacing, drawn locally as SVG. */
.pc-box-open-card .ant-card-body {
  grid-template-columns: minmax(0, 1fr) 460px;
}

.pc-box-open-visual {
  width: 460px;
  height: 460px;
}

.pc-box-open-magic-stage {
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 52%, rgba(255,255,255,.9) 0 12%, rgba(196,183,255,.3) 34%, transparent 66%),
    linear-gradient(180deg, rgba(246,243,255,.2), transparent 70%);
}

.pc-loot-scene {
  position: relative;
  z-index: 3;
  width: 420px;
  height: 400px;
  display: grid;
  place-items: center;
  perspective: 900px;
  isolation: isolate;
}

.pc-loot-chest {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 4;
  width: 360px;
  height: 330px;
  overflow: visible;
  transform: translate(-50%, -47%);
  transform-origin: 50% 72%;
  animation: pcLootIdle 2.8s ease-in-out infinite;
}

.pc-loot-svg-shadow {
  fill: rgba(47, 28, 113, 0.2);
  filter: blur(7px);
}

.pc-loot-chest-lid {
  transform-box: fill-box;
  transform-origin: 50% 100%;
}

.pc-loot-lock {
  transform-box: fill-box;
  transform-origin: center;
  animation: pcLootGemBreath 1.5s ease-in-out infinite;
}

.pc-loot-burst,
.pc-loot-shockwave,
.pc-loot-floor-glow {
  position: absolute;
  left: 50%;
  top: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.pc-loot-floor-glow {
  top: 74%;
  z-index: 0;
  width: 310px;
  height: 78px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(98,71,218,.36), rgba(117,101,246,.12) 48%, transparent 74%);
  filter: blur(10px);
  animation: pcLootFloorBreath 2.2s ease-in-out infinite;
}

.pc-loot-burst {
  z-index: 1;
  width: 310px;
  height: 310px;
  border-radius: 50%;
  opacity: 0;
  background:
    repeating-conic-gradient(from 4deg, rgba(255,238,171,.88) 0 2deg, transparent 2deg 15deg),
    radial-gradient(circle, rgba(255,255,255,.95), rgba(183,166,255,.42) 28%, transparent 68%);
  mask-image: radial-gradient(circle, transparent 0 14%, #000 25%, transparent 72%);
  -webkit-mask-image: radial-gradient(circle, transparent 0 14%, #000 25%, transparent 72%);
  transform: translate(-50%, -50%) scale(.34) rotate(-8deg);
}

.pc-loot-shockwave {
  z-index: 2;
  width: 190px;
  height: 190px;
  border: 3px solid rgba(255, 241, 174, .82);
  border-radius: 50%;
  opacity: 0;
  box-shadow:
    0 0 28px rgba(255,241,174,.72),
    inset 0 0 28px rgba(200,184,255,.6);
}

.pc-loot-reward {
  position: absolute;
  left: 50%;
  top: 42%;
  z-index: 7;
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border: 2px solid rgba(255,255,255,.86);
  border-radius: 22px;
  color: #6B52E5;
  opacity: 0;
  background:
    linear-gradient(145deg, rgba(255,255,255,.98), rgba(238,233,255,.94));
  box-shadow:
    0 16px 30px rgba(47,28,113,.2),
    0 0 28px rgba(169,151,255,.38),
    inset 0 1px 0 rgba(255,255,255,.92);
  transform: translate(-50%, 38px) scale(.34) rotate(0);
}

.pc-loot-reward::after {
  content: "";
  position: absolute;
  inset: 6px;
  z-index: -1;
  border: 1px solid rgba(123,101,238,.16);
  border-radius: 16px;
}

.pc-loot-reward-compass { --reward-x: -112px; --reward-y: -120px; --reward-r: -10deg; }
.pc-loot-reward-location { --reward-x: 0px; --reward-y: -160px; --reward-r: 4deg; }
.pc-loot-reward-spark { --reward-x: 112px; --reward-y: -116px; --reward-r: 11deg; }

.pc-loot-rarity {
  position: absolute;
  left: 50%;
  bottom: 16px;
  z-index: 8;
  display: flex;
  gap: 9px;
  padding: 9px 13px;
  border: 1px solid rgba(255,255,255,.88);
  border-radius: 999px;
  background: rgba(255,255,255,.7);
  box-shadow: 0 10px 24px rgba(60,42,130,.12);
  backdrop-filter: blur(12px);
  transform: translateX(-50%);
}

.pc-loot-rarity span {
  width: 26px;
  height: 6px;
  border-radius: 999px;
  background: rgba(97,76,188,.15);
  box-shadow: inset 0 0 0 1px rgba(82,60,170,.06);
}

.pc-box-open-card.is-opening .pc-loot-chest {
  animation:
    pcLootEnter .42s cubic-bezier(.18,.89,.32,1.28) both,
    pcLootCharge .16s ease-in-out .5s 5,
    pcLootLift .68s cubic-bezier(.18,.8,.2,1) 1.3s forwards;
}

.pc-box-open-card.is-opening .pc-loot-chest-lid {
  animation: pcLootLidOpen .72s cubic-bezier(.12,.9,.18,1) 1.24s forwards;
}

.pc-box-open-card.is-opening .pc-loot-lock {
  animation: pcLootGemCharge 1.34s ease-in-out forwards;
}

.pc-box-open-card.is-opening .pc-loot-burst {
  animation: pcLootBurst .92s cubic-bezier(.12,.78,.28,1) 1.18s forwards;
}

.pc-box-open-card.is-opening .pc-loot-shockwave {
  animation: pcLootShockwave .76s cubic-bezier(.12,.78,.28,1) 1.3s forwards;
}

.pc-box-open-card.is-opening .pc-loot-reward {
  animation: pcLootRewardReveal .86s cubic-bezier(.15,1.08,.3,1) 1.42s forwards;
}

.pc-box-open-card.is-opening .pc-loot-reward-location { animation-delay: 1.5s; }
.pc-box-open-card.is-opening .pc-loot-reward-spark { animation-delay: 1.58s; }

.pc-box-open-card.is-opening .pc-loot-rarity span:nth-child(1) { animation: pcLootRarity .28s ease .22s forwards; }
.pc-box-open-card.is-opening .pc-loot-rarity span:nth-child(2) { animation: pcLootRarity .28s ease .52s forwards; }
.pc-box-open-card.is-opening .pc-loot-rarity span:nth-child(3) { animation: pcLootRarity .28s ease .82s forwards; }
.pc-box-open-card.is-opening .pc-loot-rarity span:nth-child(4) { animation: pcLootRarityLegendary .45s ease 1.12s forwards; }

@keyframes pcLootIdle {
  0%, 100% { transform: translate(-50%, -47%) translateY(2px); }
  50% { transform: translate(-50%, -47%) translateY(-8px); }
}

@keyframes pcLootFloorBreath {
  0%, 100% { opacity: .56; transform: translate(-50%, -50%) scale(.88); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
}

@keyframes pcLootGemBreath {
  0%, 100% { transform: scale(.94); filter: brightness(.95); }
  50% { transform: scale(1.08); filter: brightness(1.22); }
}

@keyframes pcLootEnter {
  0% { opacity: 0; transform: translate(-50%, -43%) translateY(-36px) scale(.78); }
  100% { opacity: 1; transform: translate(-50%, -47%) scale(1); }
}

@keyframes pcLootCharge {
  0%, 100% { transform: translate(-50%, -47%) rotate(0) scale(1); }
  25% { transform: translate(-50%, -47%) rotate(-2.4deg) scale(1.02); }
  75% { transform: translate(-50%, -47%) rotate(2.4deg) scale(1.035); }
}

@keyframes pcLootLift {
  0% { transform: translate(-50%, -47%) translateY(0) scale(1); }
  42% { transform: translate(-50%, -47%) translateY(-24px) scale(1.08); }
  100% { transform: translate(-50%, -47%) translateY(-15px) scale(1.04); }
}

@keyframes pcLootLidOpen {
  0% { transform: translateY(0) rotateX(0) scaleX(1); }
  52% { transform: translateY(-40px) rotateX(52deg) rotate(-3deg) scaleX(1.03); }
  100% { transform: translateY(-62px) rotateX(72deg) rotate(-5deg) scaleX(1.05); }
}

@keyframes pcLootGemCharge {
  0% { transform: scale(.92); filter: brightness(.9); }
  55% { transform: scale(1.08); filter: brightness(1.25); }
  82% { transform: scale(1.25); filter: brightness(1.7); }
  100% { transform: scale(.96); filter: brightness(1.05); }
}

@keyframes pcLootBurst {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(.28) rotate(-8deg); }
  22% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.72) rotate(18deg); }
}

@keyframes pcLootShockwave {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(.42); }
  24% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2.12); }
}

@keyframes pcLootRewardReveal {
  0% { opacity: 0; transform: translate(-50%, 38px) scale(.34) rotate(0); }
  58% { opacity: 1; transform: translate(calc(-50% + var(--reward-x)), var(--reward-y)) scale(1.08) rotate(var(--reward-r)); }
  100% { opacity: 1; transform: translate(calc(-50% + var(--reward-x)), var(--reward-y)) scale(1) rotate(var(--reward-r)); }
}

@keyframes pcLootRarity {
  to { background: linear-gradient(90deg, #AF9FFF, #7B65EC); box-shadow: 0 0 12px rgba(123,101,236,.48); }
}

@keyframes pcLootRarityLegendary {
  0% { transform: scaleX(.4); background: rgba(97,76,188,.15); }
  64% { transform: scaleX(1.12); background: linear-gradient(90deg, #FFF0A8, #C69B3D); box-shadow: 0 0 18px rgba(255,226,119,.86); }
  100% { transform: scaleX(1); background: linear-gradient(90deg, #FFF0A8, #C69B3D); box-shadow: 0 0 13px rgba(255,226,119,.66); }
}

@media (max-width: 899px) {
  .pc-box-open-content {
    padding: 28px 22px 48px;
  }

  .pc-box-open-card .ant-card-body {
    grid-template-columns: 1fr;
    grid-template-areas:
      "badge"
      "copy"
      "visual"
      "action"
      "hints"
      "status";
    justify-items: center;
    gap: 18px;
  }

  .pc-box-open-badge.ant-tag {
    justify-self: center;
  }

  .pc-box-open-copy {
    text-align: center;
  }

  .pc-box-open-action {
    width: 100%;
    align-items: center;
  }

  .pc-box-open-hints {
    justify-self: center;
  }
}

@media (max-width: 1040px) {
  .pc-box-open-header {
    padding: 0 24px;
  }

  .pc-box-open-nav {
    display: none;
  }
}

@media (max-width: 767px) {
  .pc-box-open-header {
    height: 68px;
    padding: 0 20px;
  }

  .pc-box-open-brand {
    min-width: 0;
  }

  .pc-box-open-brand img {
    width: 34px;
    height: 34px;
  }

  .pc-box-open-back.ant-btn {
    min-width: 0;
    padding-inline: 8px;
  }

  .pc-box-open-content {
    min-height: calc(100dvh - 68px);
    padding: 20px 16px 40px;
  }

  .pc-box-open-card.ant-card {
    min-height: calc(100dvh - 128px);
    border-radius: 28px;
  }

  .pc-box-open-card .ant-card-body {
    padding: 28px 22px;
  }

  .pc-box-open-copy h1.ant-typography {
    font-size: clamp(36px, 12vw, 50px);
  }

  .pc-box-open-subtitle.ant-typography {
    font-size: 17px;
  }

  .pc-box-open-button.ant-btn {
    width: 100%;
  }

  .pc-box-open-visual {
    width: 100%;
    height: 280px;
  }

  .pc-loot-scene {
    width: 300px;
    height: 276px;
  }

  .pc-loot-chest {
    width: 278px;
    height: 255px;
  }

  .pc-loot-floor-glow {
    width: 230px;
    height: 58px;
  }

  .pc-loot-reward {
    width: 52px;
    height: 52px;
    border-radius: 18px;
  }

  .pc-loot-reward svg {
    width: 23px;
    height: 23px;
  }

  .pc-loot-reward-compass { --reward-x: -84px; --reward-y: -88px; }
  .pc-loot-reward-location { --reward-x: 0px; --reward-y: -112px; }
  .pc-loot-reward-spark { --reward-x: 84px; --reward-y: -86px; }

  .pc-loot-rarity {
    bottom: -2px;
    gap: 7px;
    padding: 7px 10px;
  }

  .pc-loot-rarity span {
    width: 20px;
    height: 5px;
  }

  .pc-box-open-gift {
    width: 156px;
    height: 172px;
    border-radius: 28px;
  }

  .pc-box-open-lid {
    top: -15px;
    left: 24px;
    width: 108px;
    height: 34px;
    border-radius: 16px 16px 6px 6px;
  }

  .pc-box-open-gift-body {
    gap: 20px;
    padding: 28px 24px;
  }

  .pc-box-open-gift-body::before {
    left: 70px;
    width: 16px;
  }

  .pc-box-open-gift-body::after {
    top: 76px;
    height: 16px;
  }

  .pc-box-open-gift-body span {
    width: 42px;
    height: 42px;
  }

  .pc-box-open-gift-body svg {
    width: 21px;
    height: 21px;
  }

  .pc-box-open-orbit-one {
    width: 310px;
    height: 92px;
  }

  .pc-box-open-orbit-two {
    width: 246px;
    height: 76px;
  }

  .pc-box-open-aura {
    width: 250px;
    height: 250px;
  }

  .pc-box-open-burst {
    width: 320px;
    height: 320px;
  }

  .pc-box-open-live-status {
    max-width: 100%;
    text-align: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pc-box-open-page *,
  .pc-box-open-page *::before,
  .pc-box-open-page *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
`;

const pcBoxResultCss = `
.pc-box-result {
  width: min(calc(100% - 80px), 1200px);
  margin: 0 auto;
  padding: 44px 0 72px;
  animation: pcBoxResultEnter 420ms cubic-bezier(.22, 1, .36, 1) both;
}

.pc-box-result-empty {
  width: min(calc(100% - 32px), 520px);
  margin: 0 auto;
  padding: 96px 0;
}

.pc-box-result-empty .ant-card {
  border-radius: ${radii.xl}px;
  text-align: center;
  box-shadow: 0 16px 36px rgba(90, 72, 188, .1);
}

.pc-box-result-empty h3.ant-typography {
  color: ${openToken.ink};
}

.pc-box-result-empty p.ant-typography {
  color: ${openToken.text};
  line-height: 1.7;
}

.pc-box-result-hero.ant-card {
  position: relative;
  min-height: 360px;
  overflow: hidden;
  border: 0;
  border-radius: 24px;
  background: ${openToken.primaryDark};
  box-shadow: 0 20px 48px rgba(90, 72, 188, .18);
}

.pc-box-result-hero .ant-card-body {
  min-height: 360px;
  padding: 0;
}

.pc-box-result-cover,
.pc-box-result-cover-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.pc-box-result-cover {
  object-fit: cover;
  object-position: center 52%;
}

.pc-box-result-cover-shade {
  background: linear-gradient(90deg, rgba(24, 20, 51, .72) 0%, rgba(24, 20, 51, .46) 40%, rgba(24, 20, 51, .05) 74%);
}

.pc-box-result-hero-copy {
  position: relative;
  z-index: 1;
  min-height: 360px;
  max-width: 720px;
  padding: 48px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  color: ${openToken.surface};
}

.pc-box-result-place.ant-tag {
  width: fit-content;
  margin: 0 0 14px;
  padding: 6px 12px;
  border: 0;
  border-radius: ${radii.pill}px;
  color: ${openToken.surface};
  background: rgba(255, 255, 255, .2);
  backdrop-filter: blur(8px);
  font-weight: 800;
}

.pc-box-result-hero h1.ant-typography {
  margin: 0;
  color: ${openToken.surface};
  font-size: clamp(34px, 4vw, 48px);
  font-weight: 900;
  line-height: 1.14;
}

.pc-box-result-hero p.ant-typography {
  margin: 12px 0 0;
  color: rgba(255, 255, 255, .9);
  font-size: 17px;
  font-weight: 600;
}

.pc-box-result-meta {
  margin-top: 20px;
}

.pc-box-result-meta .ant-tag {
  margin: 0;
  padding: 5px 10px;
  border: 0;
  border-radius: ${radii.pill}px;
  color: ${openToken.surface};
  background: rgba(255, 255, 255, .18);
  font-weight: 700;
}

.pc-box-result-toolbar.ant-card {
  margin-top: 16px;
  border: 1px solid rgba(232, 225, 255, .9);
  border-radius: ${radii.lg}px;
  box-shadow: 0 10px 24px rgba(90, 72, 188, .08);
}

.pc-box-result-toolbar .ant-card-body {
  padding: 12px 16px;
}

.pc-box-result-layout {
  margin-top: 24px;
}

.pc-box-result-main,
.pc-box-result-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pc-box-result-side {
  position: sticky;
  top: 92px;
}

.pc-box-result-card.ant-card {
  border: 1px solid rgba(232, 225, 255, .92);
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(90, 72, 188, .08);
}

.pc-box-result-card .ant-card-head {
  min-height: 60px;
  padding: 0 22px;
  border-bottom-color: rgba(232, 225, 255, .75);
}

.pc-box-result-card .ant-card-head-title {
  color: ${openToken.ink};
  font-size: 17px;
  font-weight: 900;
}

.pc-box-result-card .ant-card-body {
  padding: 20px 22px;
}

.pc-box-result-overview-item {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-radius: ${radii.lg}px;
  background: ${openToken.canvas};
}

.pc-box-result-reasons {
  width: 100%;
}

.pc-box-result-reason {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: ${openToken.text};
  line-height: 1.65;
}

.pc-box-result-reason .pc-box-open-icon {
  margin-top: 3px;
  color: ${openToken.primary};
}

.pc-box-result-timeline-item p.ant-typography,
.pc-box-result-card p.ant-typography {
  margin: 6px 0 0;
  color: ${openToken.text};
  line-height: 1.65;
}

.pc-box-result-check.ant-checkbox-wrapper {
  width: 100%;
  min-height: 44px;
  padding: 11px 12px;
  border: 1px solid ${openToken.border};
  border-radius: ${radii.md}px;
  background: ${openToken.paper};
  color: ${openToken.text};
  font-weight: 700;
}

.pc-box-result-card .ant-descriptions-item-label {
  color: ${openToken.muted};
  font-weight: 700;
}

.pc-box-result-card .ant-descriptions-item-content {
  color: ${openToken.text};
  font-weight: 700;
}

.pc-box-result-reset.ant-btn {
  height: 44px;
  border-radius: ${radii.pill}px;
  color: ${openToken.primaryDark};
  border-color: rgba(117, 101, 246, .28);
  background: ${openToken.surface};
  font-weight: 800;
}

.pc-box-result-toolbar .ant-btn:not(:disabled):hover,
.pc-box-result-reset.ant-btn:not(:disabled):hover {
  transform: translateY(-1px);
}

@keyframes pcBoxResultEnter {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 991px) {
  .pc-box-result-side {
    position: static;
  }
}

@media (max-width: 720px) {
  .pc-box-result {
    width: min(calc(100% - 32px), 1200px);
    padding: 20px 0 48px;
  }

  .pc-box-result-hero.ant-card,
  .pc-box-result-hero .ant-card-body,
  .pc-box-result-hero-copy {
    min-height: 260px;
  }

  .pc-box-result-hero-copy {
    padding: 24px;
  }

  .pc-box-result-hero p.ant-typography {
    font-size: 14px;
  }

  .pc-box-result-toolbar .ant-flex {
    align-items: stretch;
  }

  .pc-box-result-toolbar .ant-space {
    width: 100%;
  }

  .pc-box-result-toolbar .ant-btn {
    flex: 1;
  }

  .pc-box-result-card .ant-card-body {
    padding: 18px;
  }
}

@media print {
  .pc-experience-shell-header,
  .pc-box-result-toolbar,
  .pc-box-result-reset {
    display: none !important;
  }

  .pc-box-result {
    width: 100%;
    padding: 0;
  }
}
`;
