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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, SVGProps } from 'react';
import { useApp } from '@/contexts/app-context';
import { formatBudget, formatDistanceMetric, formatDuration } from '@/formatters';
import {
  clearPendingPcBoxDraw,
  readPendingPcBoxDraw,
  type PendingPcBoxDraw,
} from '@/lib/pc-box-open-state';
import { ApiHttpError } from '@/services/api';
import { createDemoDraw, demoCityImageUris } from '@/services/demo-data';
import { palette, radii } from '@/theme';
import type { Activity, DrawResult } from '@/types';

const { Content } = Layout;
const { Paragraph, Text, Title } = Typography;

const MIN_OPENING_MS = 3_000;
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

function loadPosterImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('目的地图片加载失败'));
    image.src = source;
  });
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function wrapPosterText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const characters = Array.from(text);
  const lines: string[] = [];
  let line = '';

  characters.forEach((character) => {
    const candidate = `${line}${character}`;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = character;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);

  if (lines.length > maxLines) {
    const visible = lines.slice(0, maxLines);
    visible[maxLines - 1] = `${visible[maxLines - 1].slice(0, -1)}…`;
    return visible;
  }
  return lines;
}

async function createTripPoster(
  activity: Activity,
  recommendation: DrawResult['recommendation'],
  recommendationReasons: string[],
  activitySteps: string[],
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1600;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器不支持生成行程图');

  context.fillStyle = '#f6f3ff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const cover = await loadPosterImage(getResultCover(activity));
  drawCoverImage(context, cover, 0, 0, canvas.width, 650);
  const heroGradient = context.createLinearGradient(0, 140, 0, 650);
  heroGradient.addColorStop(0, 'rgba(21, 17, 48, .04)');
  heroGradient.addColorStop(1, 'rgba(21, 17, 48, .92)');
  context.fillStyle = heroGradient;
  context.fillRect(0, 0, canvas.width, 650);

  context.fillStyle = '#c9ff62';
  context.beginPath();
  context.roundRect(70, 78, 250, 58, 29);
  context.fill();
  context.fillStyle = '#171522';
  context.font = '700 27px PingFang SC, Microsoft YaHei, sans-serif';
  context.fillText(`${activity.cityName} · ${activity.district}`, 96, 117);

  context.fillStyle = '#fff';
  context.font = '900 66px PingFang SC, Microsoft YaHei, sans-serif';
  const titleLines = wrapPosterText(context, activity.title, 920, 2);
  titleLines.forEach((line, index) => context.fillText(line, 70, 390 + index * 80));
  const summaryY = 390 + titleLines.length * 80 + 18;
  context.fillStyle = 'rgba(255,255,255,.86)';
  context.font = '500 29px PingFang SC, Microsoft YaHei, sans-serif';
  wrapPosterText(context, activity.summary, 920, 2)
    .forEach((line, index) => context.fillText(line, 70, summaryY + index * 43));

  const stats = [
    ['建议时长', formatDuration(activity.durationMinutes)],
    ['预计预算', formatBudget(activity.budgetYuan)],
    ['距离参考', formatDistanceMetric(activity.distanceKm, recommendation?.constraintSummary.distance)],
  ];
  stats.forEach(([label, value], index) => {
    const x = 70 + index * 320;
    context.fillStyle = '#fff';
    context.beginPath();
    context.roundRect(x, 700, 292, 132, 28);
    context.fill();
    context.fillStyle = '#918ba2';
    context.font = '600 23px PingFang SC, Microsoft YaHei, sans-serif';
    context.fillText(label, x + 28, 744);
    context.fillStyle = '#332b69';
    context.font = '800 32px PingFang SC, Microsoft YaHei, sans-serif';
    context.fillText(value, x + 28, 793);
  });

  context.fillStyle = '#171522';
  context.font = '900 38px PingFang SC, Microsoft YaHei, sans-serif';
  context.fillText('为什么推荐', 70, 920);
  context.font = '500 27px PingFang SC, Microsoft YaHei, sans-serif';
  context.fillStyle = '#625d6d';
  let reasonY = 973;
  recommendationReasons.slice(0, 2).forEach((reason) => {
    context.fillStyle = '#7565f6';
    context.beginPath();
    context.arc(84, reasonY - 9, 10, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#625d6d';
    wrapPosterText(context, reason, 900, 2).forEach((line, index) => {
      context.fillText(line, 112, reasonY + index * 39);
    });
    reasonY += 95;
  });

  context.fillStyle = '#171522';
  context.font = '900 38px PingFang SC, Microsoft YaHei, sans-serif';
  context.fillText('今天怎么玩', 70, 1195);
  activitySteps.slice(0, 3).forEach((step, index) => {
    const y = 1245 + index * 88;
    context.fillStyle = '#ede9ff';
    context.beginPath();
    context.roundRect(70, y - 40, 64, 64, 20);
    context.fill();
    context.fillStyle = '#6857e8';
    context.font = '900 26px ui-monospace, monospace';
    context.fillText(String(index + 1).padStart(2, '0'), 84, y + 1);
    context.fillStyle = '#403a4f';
    context.font = '600 27px PingFang SC, Microsoft YaHei, sans-serif';
    wrapPosterText(context, step, 835, 1).forEach((line) => context.fillText(line, 165, y));
  });

  context.fillStyle = '#7565f6';
  context.font = '900 25px PingFang SC, Microsoft YaHei, sans-serif';
  context.fillText('粗去玩鸭！  ·  WEEKEND ORACLE', 70, 1540);
  context.fillStyle = '#8c8598';
  context.font = '500 22px PingFang SC, Microsoft YaHei, sans-serif';
  context.fillText('少做选择题，只给一个现在能出发的方案。', 590, 1540);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('行程图生成失败')), 'image/jpeg', 0.9);
  });
}

export default function PcBoxOpenScreen() {
  const router = useRouter();
  const { clearError, isBooting, startDraw } = useApp();
  const [pendingDraw] = useState<PendingPcBoxDraw | null>(() => readPendingPcBoxDraw());
  const [attempt, setAttempt] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [chargeProgress, setChargeProgress] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(() =>
    pendingDraw ? null : '没有找到待开启的盲盒，请返回设置页重新选择偏好。',
  );
  const startedAttemptRef = useRef<number | null>(null);
  const runIdRef = useRef(0);
  const mountedRef = useRef(true);
  const chargeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (chargeTimerRef.current !== null) window.clearInterval(chargeTimerRef.current);
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

  const activateDraw = () => {
    if (
      !pendingDraw ||
      isBooting ||
      isCharging ||
      isOpening ||
      startedAttemptRef.current === attempt
    ) return;

    setDrawError(null);
    setChargeProgress(0);
    setIsCharging(true);
    let progress = 0;
    chargeTimerRef.current = window.setInterval(() => {
      progress = Math.min(100, progress + 8);
      setChargeProgress(progress);
      if (progress < 100) return;

      if (chargeTimerRef.current !== null) window.clearInterval(chargeTimerRef.current);
      chargeTimerRef.current = null;
      setIsCharging(false);
      startedAttemptRef.current = attempt;
      const runId = runIdRef.current + 1;
      runIdRef.current = runId;
      window.navigator.vibrate?.([35, 30, 90]);
      void executeDraw(pendingDraw, runId);
    }, 55);
  };

  const retryDraw = () => {
    if (!pendingDraw || isBooting || isOpening) return;
    setDrawError(null);
    setIsLeaving(false);
    setChargeProgress(0);
    startedAttemptRef.current = null;
    setAttempt((value) => value + 1);
  };

  const returnToConfig = () => {
    runIdRef.current += 1;
    router.replace('/box/config');
  };

  const statusText = isBooting
    ? '正在准备旅行数据…'
    : isCharging
      ? `能量注入 ${chargeProgress}%`
    : isOpening
      ? '正在锁定城市任务…'
      : '点击注入能量';
  const chargeStyle = { '--charge-progress': `${chargeProgress}%` } as CSSProperties;

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: openToken.primary,
          colorInfo: openToken.primary,
          colorTextLightSolid: openToken.ink,
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
            primaryShadow: '0 12px 28px rgba(77, 111, 22, 0.24)',
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
              className={`pc-box-open-card${isCharging ? ' is-charging' : ''}${isOpening ? ' is-opening' : ''}${
                isLeaving ? ' is-leaving' : ''
              }`}
              variant="borderless">
              <Tag className="pc-box-open-badge" icon={<ThunderboltOutlined />}>
                WEEKEND DROP
              </Tag>

              <div className="pc-box-open-copy">
                <Title>抽取你的周末任务</Title>
                <Paragraph className="pc-box-open-subtitle">
                  {isCharging ? '能量正在聚合' : isOpening ? '城市信号高速汇聚' : '等待你的启动指令'}
                </Paragraph>
                <Text className="pc-box-open-quote">
                  聚合你的时间、预算与心情，解锁一张现在就能出发的任务卡。
                </Text>
              </div>

              <div className="pc-box-open-action">
                <div className={`pc-box-charge${isCharging ? ' is-charging' : ''}`} style={chargeStyle}>
                  <Button
                    className="pc-box-open-button"
                    type="primary"
                    size="large"
                    icon={<ThunderboltOutlined size={20} />}
                    disabled={isBooting || isCharging || isOpening || isLeaving || !pendingDraw}
                    loading={isBooting}
                    onClick={activateDraw}>
                    {statusText}
                  </Button>
                  <span className="pc-box-charge-track"><i /></span>
                  <Text className="pc-box-charge-hint">
                    {isCharging ? '保持注意，目的地即将锁定' : '由你亲手启动这次抽取'}
                  </Text>
                </div>

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
                            重新蓄能
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

                <div className="pc-drop-scene">
                  <span className="pc-drop-beam" />
                  <span className="pc-drop-burst" />
                  <span className="pc-drop-shockwave" />
                  <span className="pc-drop-ring pc-drop-ring-one" />
                  <span className="pc-drop-ring pc-drop-ring-two" />
                  <span className="pc-drop-ring pc-drop-ring-three" />
                  <span className="pc-drop-scan-line" />

                  <div className="pc-drop-photo-signals">
                    <img className="pc-drop-photo pc-drop-photo-one" src={demoCityImageUris.beijing} alt="" />
                    <img className="pc-drop-photo pc-drop-photo-two" src={demoCityImageUris.shanghai} alt="" />
                    <img className="pc-drop-photo pc-drop-photo-three" src={demoCityImageUris.yantai} alt="" />
                  </div>

                  <div className="pc-drop-card">
                    <div className="pc-drop-card-face pc-drop-card-front">
                      <span className="pc-drop-card-index">DROP / 001</span>
                      <strong>?</strong>
                      <span className="pc-drop-card-label">DESTINATION LOCKED</span>
                      <i><CompassOutlined size={18} /></i>
                    </div>
                    <div className="pc-drop-card-face pc-drop-card-back">
                      <span className="pc-drop-card-index">CITY SIGNAL FOUND</span>
                      <EnvironmentOutlined size={52} />
                      <b>任务已解锁</b>
                      <span className="pc-drop-card-label">READY TO REVEAL</span>
                    </div>
                  </div>

                  <div className="pc-drop-rarity">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="pc-drop-coordinate">
                    <span>LAT</span><b>••.••••</b>
                    <span>LNG</span><b>•••.••••</b>
                  </div>
                  <span className="pc-drop-combo">SIGNAL CHAIN ×4</span>
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
          colorTextLightSolid: openToken.ink,
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
            primaryShadow: '0 10px 24px rgba(126, 166, 31, 0.28)',
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
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const { addCurrentDrawToTodos, currentDraw, reroll } = useApp();
  const { message } = App.useApp();
  const [isRerolling, setIsRerolling] = useState(false);
  const [isAddingToPlan, setIsAddingToPlan] = useState(false);
  const previewDraw = useMemo(
    () => {
      if (preview !== 'print') return null;
      const draw = createDemoDraw({
          userId: 900001,
          cityId: 1,
          preferences: {
            partySize: 2,
            durationMinutes: null,
            budgetMax: 100,
            mood: '放松',
            randomLevel: 25,
            category: '风景人文',
            environment: 'outdoor',
            radiusKm: null,
            originName: '北京',
            originLatitude: null,
            originLongitude: null,
            originAccuracyMeters: null,
            originSource: 'manual',
            destinationScope: 'nearby',
            travelDuration: 'same-day',
            clientSource: 'pc',
            destinationScopeLabel: '周边',
            travelDurationLabel: '当天',
            budgetLabel: '平价',
            surpriseLevelLabel: '中度',
          },
        });
      return draw;
    },
    [preview],
  );
  const activeDraw = currentDraw ?? previewDraw;

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
      {activeDraw ? (
        <PcBoxResult
          draw={activeDraw}
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
  const [isSavingPoster, setIsSavingPoster] = useState(false);
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
    const text = `我在粗去玩鸭！抽到了「${activity.title}」，${activity.summary}`;

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

  const saveResultPoster = async () => {
    if (isSavingPoster) return;
    const isWechatMobile = /MicroMessenger/i.test(navigator.userAgent) && /Mobile/i.test(navigator.userAgent);
    // 微信会拦截异步完成后才打开的页面，需在用户点击时先预留图片页。
    const wechatPreview = isWechatMobile ? window.open('', '_blank') : null;
    setIsSavingPoster(true);
    try {
      const blob = await createTripPoster(activity, recommendation, recommendationReasons, activitySteps);
      const fileName = `粗去玩鸭！-${activity.cityName}-${activity.title}.jpg`;
      const objectUrl = URL.createObjectURL(blob);
      if (isWechatMobile) {
        if (wechatPreview) {
          wechatPreview.location.href = objectUrl;
        } else {
          window.location.href = objectUrl;
        }
        message.info('行程图已生成，长按图片即可保存到手机');
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
        return;
      }

      const download = document.createElement('a');
      download.href = objectUrl;
      download.download = fileName;
      download.style.display = 'none';
      document.body.appendChild(download);
      download.click();
      download.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2_000);
      message.success('彩色行程图已保存');
    } catch (reason) {
      wechatPreview?.close();
      if (reason instanceof DOMException && reason.name === 'AbortError') return;
      message.error(reason instanceof Error ? reason.message : '行程图生成失败，请稍后重试');
    } finally {
      setIsSavingPoster(false);
    }
  };

  return (
    <main className="pc-box-result">
      <div className="pc-box-screen-content">
      <Card className="pc-box-result-hero" variant="borderless">
        <img className="pc-box-result-cover" src={getResultCover(activity)} alt={activity.title} decoding="async" fetchPriority="high" />
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
            <Tag>✨ {recommendation?.display.badge ?? '为你精选'}</Tag>
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
            <Button icon={<DownloadOutlined />} loading={isSavingPoster} onClick={() => void saveResultPoster()}>
              保存行程图
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
              extra={<Tag>AI 匹配依据</Tag>}>
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
      </div>

      <PcBoxPrintSheet
        activity={activity}
        activitySteps={activitySteps}
        checklist={checklist}
        recommendation={recommendation}
        recommendationReasons={recommendationReasons}
      />
    </main>
  );
}

function PcBoxPrintSheet({
  activity,
  activitySteps,
  checklist,
  recommendation,
  recommendationReasons,
}: {
  activity: Activity;
  activitySteps: string[];
  checklist: string[];
  recommendation: DrawResult['recommendation'];
  recommendationReasons: string[];
}) {
  const printTags = Array.from(
    new Set([activity.category, activity.mood, ...activity.moodTags].map((tag) => String(tag).trim()).filter(Boolean)),
  ).slice(0, 5);

  return (
    <section className="pc-box-print-sheet" aria-label="单页行程 PDF">
      <header className="pc-print-header">
        <div>
          <strong>粗去玩鸭！</strong>
          <span>WEEKEND ORACLE</span>
        </div>
        <p>AI TRAVEL DROP · {activity.cityName.toUpperCase()}</p>
      </header>

      <section className="pc-print-hero">
        <img src={getResultCover(activity)} alt="" />
        <div className="pc-print-hero-shade" />
        <div className="pc-print-hero-copy">
          <span>{activity.cityName} · {activity.district}</span>
          <h1>{activity.title}</h1>
          <p>{activity.summary}</p>
        </div>
      </section>

      <section className="pc-print-stats">
        <div><small>建议时长</small><strong>{formatDuration(activity.durationMinutes)}</strong></div>
        <div><small>预计预算</small><strong>{formatBudget(activity.budgetYuan)}</strong></div>
        <div><small>距离参考</small><strong>{formatDistanceMetric(activity.distanceKm, recommendation?.constraintSummary.distance)}</strong></div>
        <div><small>适合人数</small><strong>{activity.minPartySize}–{activity.maxPartySize} 人</strong></div>
      </section>

      <div className="pc-print-grid">
        <div className="pc-print-main-column">
          <section className="pc-print-block pc-print-reasons">
            <div className="pc-print-block-title"><span>01</span><h2>为什么推荐</h2><small>AI MATCH</small></div>
            <ul>
              {recommendationReasons.slice(0, 3).map((reason, index) => (
                <li key={index}><i>✓</i><span>{reason}</span></li>
              ))}
            </ul>
          </section>

          <section className="pc-print-block pc-print-route">
            <div className="pc-print-block-title"><span>02</span><h2>今天怎么玩</h2><small>3-STEP ROUTE</small></div>
            <ol>
              {activitySteps.slice(0, 3).map((step, index) => (
                <li key={index}>
                  <b>{String(index + 1).padStart(2, '0')}</b>
                  <div><strong>{['准备出发', '沉浸体验', '轻松收尾'][index]}</strong><p>{step}</p></div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="pc-print-side-column">
          <section className="pc-print-block pc-print-place">
            <div className="pc-print-block-title"><span>03</span><h2>目的地信息</h2></div>
            <p>{activity.description || activity.summary}</p>
            <dl>
              <div><dt>地址</dt><dd>{activity.address || '出发前查看导航'}</dd></div>
              <div><dt>心情</dt><dd>{activity.mood}</dd></div>
              <div><dt>类型</dt><dd>{activity.category}</dd></div>
            </dl>
          </section>

          <section className="pc-print-block pc-print-reminder">
            <div className="pc-print-block-title"><span>04</span><h2>出发提醒</h2></div>
            <ul>
              {(activity.tips.length ? activity.tips : ['确认天气与开放时间', '为热门时段预留弹性']).slice(0, 3).map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </section>

          <section className="pc-print-block pc-print-checklist">
            <div className="pc-print-block-title"><span>05</span><h2>随身清单</h2></div>
            <div>{checklist.map((item) => <span key={item}>□ {item}</span>)}</div>
          </section>
        </aside>
      </div>

      <footer className="pc-print-footer">
        <div>{printTags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <p>少做选择题，只给一个现在能出发的方案。</p>
      </footer>
    </section>
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
    radial-gradient(circle at 16% 18%, rgba(126, 166, 31, 0.14), transparent 30%),
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
  box-shadow: 0 28px 70px rgba(77, 111, 22, 0.16);
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
  box-shadow: 0 8px 22px rgba(126, 166, 31, 0.24);
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
  border: 1px solid rgba(126, 166, 31, 0.22);
  border-radius: 50%;
  transform: translate(-50%, -50%) rotate(-12deg);
  box-shadow: 0 0 24px rgba(126, 166, 31, 0.12);
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
    0 22px 48px rgba(77, 111, 22, 0.28),
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
  box-shadow: 0 12px 24px rgba(77, 111, 22, 0.22);
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
    conic-gradient(from 20deg, transparent, rgba(142,200,255,.7), transparent, rgba(126,166,31,.42), transparent);
}

.pc-box-open-burst {
  z-index: 1;
  width: 440px;
  height: 440px;
  border-radius: 50%;
  opacity: 0;
  background: radial-gradient(circle, rgba(255,255,255,.96), rgba(255,211,106,.52) 22%, rgba(126,166,31,.16) 52%, transparent 70%);
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
  background: radial-gradient(ellipse, rgba(98,71,218,.36), rgba(126,166,31,.12) 48%, transparent 74%);
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

/* Digital city-drop reveal: energy rings + a sealed mission card. */
.pc-box-open-content {
  background:
    radial-gradient(circle at 16% 18%, rgba(120,103,255,.34), transparent 31%),
    radial-gradient(circle at 82% 24%, rgba(120,232,255,.16), transparent 28%),
    radial-gradient(circle at 72% 84%, rgba(201,255,98,.08), transparent 24%),
    #11101c;
}

.pc-box-open-content::before {
  content: "";
  position: absolute;
  inset: 76px 0 0;
  opacity: .24;
  pointer-events: none;
  background-image: radial-gradient(rgba(255,255,255,.28) .8px, transparent .8px);
  background-size: 18px 18px;
}

.pc-box-open-card.ant-card {
  border-color: rgba(255,255,255,.1);
  background: rgba(24,22,38,.76);
  box-shadow: 0 34px 100px rgba(0,0,0,.38);
  backdrop-filter: blur(26px);
}

.pc-box-open-badge.ant-tag {
  color: #171520;
  background: #c9ff62;
  box-shadow: 0 10px 28px rgba(201,255,98,.16);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: .1em;
}

.pc-box-open-copy h1.ant-typography {
  color: #fff;
  font-size: clamp(44px, 4.1vw, 52px);
  white-space: nowrap;
}

.pc-box-open-subtitle.ant-typography {
  color: #78e8ff;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 15px;
  letter-spacing: .08em;
}

.pc-box-open-quote,
.pc-box-open-hints .ant-typography,
.pc-box-open-live-status { color: rgba(255,255,255,.52); }

.pc-box-open-button.ant-btn {
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 16px;
  color: #fff;
  background: rgba(255,255,255,.08);
  box-shadow: inset 0 1px rgba(255,255,255,.06);
}

.pc-box-open-button.ant-btn.ant-btn-loading,
.pc-box-open-button.ant-btn:disabled {
  color: #171520;
  background: #c9ff62;
  border-color: #c9ff62;
}

.pc-box-charge {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.pc-box-charge-track {
  width: 100%;
  height: 5px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255,255,255,.1);
}

.pc-box-charge-track i {
  display: block;
  width: var(--charge-progress, 0%);
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #c9ff62, #78e8ff 58%, #ff795e);
  box-shadow: 0 0 16px rgba(120,232,255,.7);
  transition: width 45ms linear;
}

.pc-box-charge-hint.ant-typography {
  color: rgba(255,255,255,.42);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: .06em;
}

.pc-box-charge.is-charging .pc-box-open-button.ant-btn {
  color: #171520;
  background: #c9ff62;
  animation: pcChargeButtonPulse .38s ease-in-out infinite alternate;
}

.pc-box-open-magic-stage {
  border: 1px solid rgba(255,255,255,.08);
  background:
    radial-gradient(circle at 50% 50%, rgba(120,103,255,.22), transparent 48%),
    rgba(255,255,255,.025);
  box-shadow: inset 0 0 80px rgba(120,103,255,.08);
}

.pc-box-open-stage-light { opacity: .35; background: radial-gradient(circle, rgba(120,232,255,.24), transparent 66%); }
.pc-box-open-orbit { border-color: rgba(120,232,255,.13); box-shadow: none; }

.pc-drop-scene {
  position: relative;
  z-index: 3;
  width: 430px;
  height: 430px;
  display: grid;
  place-items: center;
  perspective: 1200px;
  isolation: isolate;
}

.pc-drop-beam,
.pc-drop-burst,
.pc-drop-shockwave,
.pc-drop-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.pc-drop-beam {
  z-index: 0;
  width: 190px;
  height: 390px;
  opacity: .34;
  background: linear-gradient(180deg, transparent, rgba(120,232,255,.26) 38%, rgba(201,255,98,.2) 58%, transparent);
  filter: blur(18px);
  clip-path: polygon(42% 0, 58% 0, 100% 100%, 0 100%);
}

.pc-drop-ring {
  z-index: 1;
  border: 1px solid rgba(120,232,255,.32);
  border-radius: 50%;
  box-shadow: 0 0 30px rgba(120,232,255,.08);
}

.pc-drop-ring-one { width: 360px; height: 118px; transform: translate(-50%,-50%) rotate(-13deg); animation: pcDropRing 7s linear infinite; }
.pc-drop-ring-two { width: 290px; height: 96px; border-style: dashed; border-color: rgba(201,255,98,.28); transform: translate(-50%,-50%) rotate(22deg); animation: pcDropRingReverse 5.6s linear infinite; }
.pc-drop-ring-three { width: 230px; height: 230px; border-color: rgba(170,114,255,.18); }

.pc-drop-photo-signals {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}

.pc-drop-photo {
  position: absolute;
  width: 118px;
  height: 76px;
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 15px;
  object-fit: cover;
  opacity: .25;
  filter: grayscale(.75) saturate(.7) brightness(.72);
  box-shadow: 0 16px 42px rgba(0,0,0,.3);
}

.pc-drop-photo::after { content: ""; position: absolute; inset: 0; }
.pc-drop-photo-one { left: 5px; top: 82px; --photo-r: -11deg; transform: rotate(-11deg); }
.pc-drop-photo-two { right: 0; top: 58px; --photo-r: 9deg; transform: rotate(9deg); }
.pc-drop-photo-three { right: 14px; bottom: 58px; --photo-r: -7deg; transform: rotate(-7deg); }

.pc-drop-scan-line {
  position: absolute;
  left: 50%;
  top: 18%;
  z-index: 7;
  width: 238px;
  height: 2px;
  opacity: .24;
  background: linear-gradient(90deg, transparent, #78e8ff 18% 82%, transparent);
  box-shadow: 0 0 18px rgba(120,232,255,.72);
  transform: translateX(-50%);
}

.pc-drop-card {
  position: relative;
  z-index: 5;
  width: 222px;
  height: 304px;
  transform-style: preserve-3d;
  transform: rotateY(-8deg) rotateX(3deg);
  animation: pcDropCardIdle 3s ease-in-out infinite;
}

.pc-drop-card-face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 28px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow: 0 32px 80px rgba(0,0,0,.44), inset 0 1px rgba(255,255,255,.12);
}

.pc-drop-card-face::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(118deg, transparent 28%, rgba(255,255,255,.12) 42%, transparent 54%),
    radial-gradient(circle at 20% 12%, rgba(120,232,255,.2), transparent 28%);
  transform: translateX(-55%);
}

.pc-drop-card-front {
  padding: 22px;
  color: #fff;
  background:
    linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px),
    linear-gradient(145deg, #25213d, #171522 72%);
  background-size: 22px 22px, 22px 22px, auto;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.pc-drop-card-front strong {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1em;
  display: block;
  text-align: center;
  color: transparent;
  background: linear-gradient(145deg, #fff, #78e8ff 48%, #c9ff62);
  background-clip: text;
  -webkit-background-clip: text;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 104px;
  font-weight: 500;
  line-height: 1;
  text-shadow: 0 0 42px rgba(120,232,255,.16);
  transform: translate(-50%, -50%);
  transform-origin: center;
}

.pc-drop-card-front i {
  position: absolute;
  right: 20px;
  bottom: 18px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: #171520;
  background: #c9ff62;
  display: grid;
  place-items: center;
}

.pc-drop-card-index,
.pc-drop-card-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .12em;
}

.pc-drop-card-index { color: rgba(255,255,255,.48); }
.pc-drop-card-label { color: rgba(255,255,255,.34); }

.pc-drop-card-back {
  padding: 24px;
  color: #171520;
  background: linear-gradient(145deg, #c9ff62, #78e8ff 52%, #ff795e);
  opacity: 0;
  transform: rotateY(82deg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 13px;
  text-align: center;
}

.pc-drop-card-back .pc-drop-card-index { position: absolute; top: 20px; left: 22px; color: rgba(23,21,32,.52); }
.pc-drop-card-back .pc-drop-card-label { color: rgba(23,21,32,.52); }
.pc-drop-card-back b { font-size: 25px; font-weight: 950; }

.pc-drop-rarity {
  position: absolute;
  left: 50%;
  bottom: 18px;
  z-index: 7;
  display: flex;
  gap: 8px;
  transform: translateX(-50%);
}

.pc-drop-rarity span {
  width: 34px;
  height: 5px;
  border-radius: 999px;
  background: rgba(255,255,255,.12);
}

.pc-drop-coordinate {
  position: absolute;
  left: 7px;
  bottom: 42px;
  z-index: 4;
  display: grid;
  grid-template-columns: auto auto;
  gap: 3px 9px;
  color: rgba(255,255,255,.32);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 8px;
  letter-spacing: .08em;
}

.pc-drop-coordinate b { color: rgba(120,232,255,.5); font-weight: 600; }

.pc-drop-combo {
  position: absolute;
  right: 5px;
  top: 194px;
  z-index: 9;
  padding: 7px 10px;
  border: 1px solid rgba(201,255,98,.34);
  border-radius: 999px;
  color: #c9ff62;
  opacity: 0;
  background: rgba(17,16,28,.76);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: .08em;
  box-shadow: 0 0 22px rgba(201,255,98,.12);
}

.pc-drop-burst {
  z-index: 2;
  width: 310px;
  height: 310px;
  border-radius: 50%;
  opacity: 0;
  background:
    repeating-conic-gradient(from 4deg, rgba(201,255,98,.8) 0 1.4deg, transparent 1.4deg 13deg),
    radial-gradient(circle, rgba(255,255,255,.9), rgba(120,232,255,.34) 25%, transparent 66%);
  mask-image: radial-gradient(circle, transparent 0 16%, #000 27%, transparent 72%);
  -webkit-mask-image: radial-gradient(circle, transparent 0 16%, #000 27%, transparent 72%);
}

.pc-drop-shockwave {
  z-index: 3;
  width: 180px;
  height: 180px;
  border: 2px solid rgba(201,255,98,.82);
  border-radius: 50%;
  opacity: 0;
  box-shadow: 0 0 34px rgba(201,255,98,.46);
}

.pc-box-open-card.is-opening .pc-drop-card {
  animation: pcDropCardReveal 2.25s cubic-bezier(.2,.76,.18,1) both;
}

.pc-box-open-card.is-charging .pc-drop-card {
  animation: pcDropChargeTension .13s ease-in-out infinite alternate;
}

.pc-box-open-card.is-charging .pc-drop-ring-one { animation-duration: 1.1s; }
.pc-box-open-card.is-charging .pc-drop-ring-two { animation-duration: .82s; }
.pc-box-open-card.is-charging .pc-drop-beam { opacity: .76; filter: blur(12px); }
.pc-box-open-card.is-charging .pc-drop-photo { opacity: .52; filter: grayscale(.35) brightness(.82); }

.pc-box-open-card.is-opening {
  animation: pcDropStageKick 2.35s linear both;
}

.pc-box-open-card.is-opening .pc-drop-scene::after {
  content: "";
  position: absolute;
  inset: -8%;
  z-index: 2;
  border-radius: 50%;
  opacity: 0;
  background: repeating-conic-gradient(from 0deg, transparent 0 5deg, rgba(120,232,255,.13) 5deg 6deg, transparent 6deg 13deg);
  mask-image: radial-gradient(circle, transparent 0 34%, #000 36%, transparent 72%);
  -webkit-mask-image: radial-gradient(circle, transparent 0 34%, #000 36%, transparent 72%);
  animation: pcDropSpeedLines .78s ease-out 1.18s both;
}

.pc-box-open-card.is-opening .pc-drop-card-front {
  animation: pcDropFrontExit .48s cubic-bezier(.55,.02,.68,.53) 1.02s forwards;
}

.pc-box-open-card.is-opening .pc-drop-card-back {
  animation: pcDropBackEnter .62s cubic-bezier(.16,1,.3,1) 1.22s forwards;
}

.pc-box-open-card.is-opening .pc-drop-card-face::before { animation: pcDropSheen 1.5s ease .18s both; }
.pc-box-open-card.is-opening .pc-drop-beam { animation: pcDropBeam 2.2s ease both; }
.pc-box-open-card.is-opening .pc-drop-ring-one { animation-duration: 1.7s; }
.pc-box-open-card.is-opening .pc-drop-ring-two { animation-duration: 1.25s; }
.pc-box-open-card.is-opening .pc-drop-photo-one { animation: pcDropPhotoSignal 1.78s ease .05s both; }
.pc-box-open-card.is-opening .pc-drop-photo-two { animation: pcDropPhotoSignal 1.78s ease .2s both; }
.pc-box-open-card.is-opening .pc-drop-photo-three { animation: pcDropPhotoSignal 1.78s ease .34s both; }
.pc-box-open-card.is-opening .pc-drop-scan-line { animation: pcDropScan 1.42s cubic-bezier(.2,.8,.2,1) .16s both; }
.pc-box-open-card.is-opening .pc-drop-burst { animation: pcDropBurst .8s ease-out 1.35s forwards; }
.pc-box-open-card.is-opening .pc-drop-shockwave { animation: pcDropShockwave .72s ease-out 1.4s forwards; }
.pc-box-open-card.is-opening .pc-drop-combo { animation: pcDropCombo .48s cubic-bezier(.16,1,.3,1) 1.5s forwards; }
.pc-box-open-card.is-opening .pc-drop-rarity span:nth-child(1) { animation: pcDropRarity .25s ease .25s forwards; }
.pc-box-open-card.is-opening .pc-drop-rarity span:nth-child(2) { animation: pcDropRarity .25s ease .52s forwards; }
.pc-box-open-card.is-opening .pc-drop-rarity span:nth-child(3) { animation: pcDropRarity .25s ease .8s forwards; }
.pc-box-open-card.is-opening .pc-drop-rarity span:nth-child(4) { animation: pcDropRarityFinal .4s ease 1.08s forwards; }

@keyframes pcDropCardIdle {
  0%,100% { transform: rotateY(-8deg) rotateX(3deg) translateY(5px); }
  50% { transform: rotateY(-5deg) rotateX(2deg) translateY(-7px); }
}

@keyframes pcChargeButtonPulse { from { transform: scale(1); box-shadow: 0 0 0 rgba(201,255,98,0); } to { transform: scale(1.018); box-shadow: 0 0 28px rgba(201,255,98,.24); } }
@keyframes pcDropChargeTension { from { transform: rotateZ(-.7deg) scale(1.015); filter: brightness(1.04); } to { transform: rotateZ(.7deg) scale(1.035); filter: brightness(1.18); } }
@keyframes pcDropStageKick { 0%,43%,58%,100% { transform: translate(0); } 46% { transform: translate(-7px,2px); } 49% { transform: translate(8px,-3px); } 52% { transform: translate(-5px,-1px); } 55% { transform: translate(3px,1px); } }
@keyframes pcDropSpeedLines { 0% { opacity: 0; transform: scale(.6) rotate(-8deg); } 35% { opacity: 1; } 100% { opacity: 0; transform: scale(1.45) rotate(12deg); } }
@keyframes pcDropCombo { from { opacity: 0; transform: translateX(18px) scale(.72); } to { opacity: 1; transform: translateX(0) scale(1); } }

@keyframes pcDropCardReveal {
  0% { opacity: 0; transform: rotateY(-18deg) rotateX(8deg) translateY(36px) scale(.78); }
  16% { opacity: 1; transform: rotateY(-8deg) rotateX(3deg) translateY(0) scale(1); }
  30% { transform: rotateY(-11deg) rotateZ(-2deg) scale(1.02); }
  38% { transform: rotateY(-3deg) rotateZ(2deg) scale(1.035); }
  48% { transform: rotateY(-6deg) rotateZ(0) scale(1.04); filter: brightness(1); }
  64% { transform: rotateY(0) rotateX(0) translateY(-8px) scale(1.1); filter: brightness(1.24); }
  82% { transform: rotateY(0) translateY(-12px) scale(1.04); filter: brightness(1.05); }
  100% { transform: rotateY(0) translateY(-20px) scale(1.02); }
}

@keyframes pcDropFrontExit { from { opacity: 1; transform: rotateY(0); } to { opacity: 0; transform: rotateY(-82deg) scale(.96); } }
@keyframes pcDropBackEnter { from { opacity: 0; transform: rotateY(82deg) scale(.96); } to { opacity: 1; transform: rotateY(0) scale(1); } }
@keyframes pcDropSheen { from { transform: translateX(-65%); } to { transform: translateX(80%); } }
@keyframes pcDropBeam { 0% { opacity: .12; transform: translate(-50%,-50%) scaleX(.5); } 62% { opacity: .9; transform: translate(-50%,-50%) scaleX(1.2); } 100% { opacity: .25; transform: translate(-50%,-50%) scaleX(.72); } }
@keyframes pcDropPhotoSignal { 0% { opacity: 0; transform: translateY(22px) rotate(var(--photo-r)) scale(.66); filter: grayscale(1) blur(3px) brightness(.54); } 30%,68% { opacity: .86; transform: translateY(0) rotate(var(--photo-r)) scale(1); filter: grayscale(.12) blur(0) brightness(.94); } 100% { opacity: .12; transform: translateY(-15px) rotate(var(--photo-r)) scale(.9); filter: grayscale(.8) blur(2px) brightness(.7); } }
@keyframes pcDropScan { 0% { top: 17%; opacity: 0; } 18% { opacity: 1; } 82% { opacity: .9; } 100% { top: 78%; opacity: 0; } }
@keyframes pcDropRing { to { transform: translate(-50%,-50%) rotate(347deg); } }
@keyframes pcDropRingReverse { to { transform: translate(-50%,-50%) rotate(-338deg); } }
@keyframes pcDropBurst { 0% { opacity: 0; transform: translate(-50%,-50%) scale(.3) rotate(-8deg); } 24% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%,-50%) scale(1.8) rotate(15deg); } }
@keyframes pcDropShockwave { 0% { opacity: 0; transform: translate(-50%,-50%) scale(.4); } 22% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%,-50%) scale(2.25); } }
@keyframes pcDropRarity { to { background: linear-gradient(90deg,#c9ff62,#78e8ff); box-shadow: 0 0 12px rgba(120,232,255,.4); } }
@keyframes pcDropRarityFinal { 0% { transform: scaleX(.3); } 70% { transform: scaleX(1.12); background: #c9ff62; box-shadow: 0 0 18px rgba(201,255,98,.76); } 100% { transform: scaleX(1); background: #c9ff62; box-shadow: 0 0 13px rgba(201,255,98,.56); } }

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

  .pc-drop-scene {
    width: 300px;
    height: 276px;
  }

  .pc-drop-card {
    width: 156px;
    height: 218px;
  }

  .pc-drop-card-face { border-radius: 21px; }
  .pc-drop-card-front { padding: 16px; }
  .pc-drop-card-front strong { font-size: 72px; }
  .pc-drop-card-front i { right: 14px; bottom: 13px; width: 31px; height: 31px; }
  .pc-drop-card-back { padding: 17px; gap: 9px; }
  .pc-drop-card-back b { font-size: 18px; }
  .pc-drop-card-back svg { width: 38px; height: 38px; }
  .pc-drop-ring-one { width: 286px; height: 88px; }
  .pc-drop-ring-two { width: 232px; height: 72px; }
  .pc-drop-ring-three { width: 176px; height: 176px; }
  .pc-drop-beam { width: 150px; height: 270px; }
  .pc-drop-coordinate { display: none; }
  .pc-drop-rarity { bottom: 3px; }
  .pc-drop-rarity span { width: 24px; }
  .pc-drop-photo { width: 78px; height: 52px; border-radius: 10px; }
  .pc-drop-photo-one { left: 2px; top: 55px; }
  .pc-drop-photo-two { right: 0; top: 42px; }
  .pc-drop-photo-three { right: 5px; bottom: 42px; }
  .pc-drop-scan-line { width: 170px; }
  .pc-box-open-copy h1.ant-typography { white-space: normal; }

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

.pc-box-print-sheet { display: none; }

.pc-box-result-empty {
  width: min(calc(100% - 32px), 520px);
  margin: 0 auto;
  padding: 96px 0;
}

.pc-box-result-empty .ant-card {
  border-radius: ${radii.xl}px;
  text-align: center;
  box-shadow: 0 16px 36px rgba(77, 111, 22, .1);
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
  box-shadow: 0 20px 48px rgba(77, 111, 22, .18);
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

.pc-box-result-hero-copy > .ant-typography:not(h1) {
  margin: 12px 0 0;
  color: rgba(255, 255, 255, .9) !important;
  font-size: 17px;
  font-weight: 600;
  text-shadow: 0 2px 12px rgba(16, 12, 37, .45);
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
  box-shadow: 0 10px 24px rgba(77, 111, 22, .08);
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
  box-shadow: 0 12px 28px rgba(77, 111, 22, .08);
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
  border-color: rgba(126, 166, 31, .28);
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

@page { size: A4 portrait; margin: 0; }

@media print {
  html,
  body,
  #root {
    width: 210mm !important;
    height: 297mm !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    background: #fff !important;
  }

  .pc-experience-shell-header,
  .pc-box-screen-content {
    display: none !important;
  }

  .pc-experience-shell,
  .pc-experience-shell-content,
  .pc-box-open-page,
  .pc-box-result {
    width: 210mm !important;
    height: 297mm !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  .pc-box-print-sheet {
    width: 210mm;
    height: 297mm;
    padding: 9mm 11mm 8mm;
    box-sizing: border-box;
    color: #171522;
    background: #f8f7fc;
    display: grid !important;
    grid-template-rows: 10mm 55mm 18mm minmax(0, 1fr) 10mm;
    gap: 4mm;
    font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
    page-break-inside: avoid;
  }

  .pc-print-header {
    border-bottom: .35mm solid rgba(31,25,68,.15);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  .pc-print-header > div { display: flex; align-items: baseline; gap: 3mm; }
  .pc-print-header strong { font-size: 14pt; font-weight: 950; }
  .pc-print-header span,
  .pc-print-header p {
    margin: 0;
    color: #7565f6;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 7pt;
    font-weight: 800;
    letter-spacing: .12em;
  }

  .pc-print-hero {
    position: relative;
    overflow: hidden;
    border-radius: 5mm;
    background: #211b44;
  }

  .pc-print-hero img,
  .pc-print-hero-shade {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .pc-print-hero img { object-fit: cover; object-position: center 52%; }
  .pc-print-hero-shade { background: linear-gradient(90deg, rgba(20,16,46,.9), rgba(20,16,46,.5) 56%, rgba(20,16,46,.12)); }
  .pc-print-hero-copy {
    position: relative;
    z-index: 2;
    width: 68%;
    height: 100%;
    padding: 7mm;
    box-sizing: border-box;
    color: #fff;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  .pc-print-hero-copy > span {
    width: fit-content;
    margin-bottom: 2.2mm;
    padding: 1.2mm 2.4mm;
    border-radius: 99mm;
    background: #c9ff62;
    color: #171522;
    font-size: 7.2pt;
    font-weight: 900;
  }

  .pc-print-hero h1 { margin: 0; font-size: 25pt; line-height: 1.1; letter-spacing: -.035em; }
  .pc-print-hero p { margin: 2.2mm 0 0; color: rgba(255,255,255,.84); font-size: 9pt; line-height: 1.45; }

  .pc-print-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2.5mm;
  }

  .pc-print-stats > div {
    padding: 2.5mm 3mm;
    border: .3mm solid rgba(31,25,68,.1);
    border-radius: 3mm;
    background: #fff;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1mm;
  }

  .pc-print-stats small { color: #8b8598; font-size: 6.8pt; }
  .pc-print-stats strong { color: #332b69; font-size: 10.5pt; }

  .pc-print-grid {
    min-height: 0;
    display: grid;
    grid-template-columns: 1.16fr .84fr;
    gap: 4mm;
  }

  .pc-print-main-column,
  .pc-print-side-column {
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 3.2mm;
  }

  .pc-print-main-column .pc-print-reasons { flex: .8; }
  .pc-print-main-column .pc-print-route { flex: 1.2; }
  .pc-print-side-column .pc-print-place { flex: 1.25; }
  .pc-print-side-column .pc-print-reminder { flex: .72; }
  .pc-print-side-column .pc-print-checklist { flex: 1; }

  .pc-print-block {
    min-height: 0;
    overflow: hidden;
    padding: 3.6mm;
    border: .3mm solid rgba(31,25,68,.1);
    border-radius: 3.5mm;
    background: #fff;
    box-sizing: border-box;
    break-inside: avoid;
  }

  .pc-print-block-title {
    margin-bottom: 2.6mm;
    display: flex;
    align-items: center;
    gap: 2mm;
  }

  .pc-print-block-title > span {
    width: 6mm;
    height: 6mm;
    border-radius: 50%;
    color: #171522;
    background: #c9ff62;
    display: grid;
    place-items: center;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 6.5pt;
    font-weight: 900;
  }

  .pc-print-block-title h2 { margin: 0; flex: 1; font-size: 11pt; }
  .pc-print-block-title small { color: #928ca0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 6pt; letter-spacing: .08em; }

  .pc-print-reasons ul,
  .pc-print-reminder ul,
  .pc-print-route ol { margin: 0; padding: 0; list-style: none; }

  .pc-print-reasons li {
    margin-bottom: 2.2mm;
    display: grid;
    grid-template-columns: 5mm 1fr;
    gap: 1.8mm;
    color: #4e495b;
    font-size: 8pt;
    line-height: 1.42;
  }

  .pc-print-reasons li i {
    width: 4mm;
    height: 4mm;
    border-radius: 50%;
    color: #fff;
    background: #7565f6;
    display: grid;
    place-items: center;
    font-size: 6pt;
    font-style: normal;
  }

  .pc-print-route ol { display: grid; gap: 2mm; }
  .pc-print-route li {
    min-height: 15mm;
    padding: 2.4mm;
    border-radius: 2.5mm;
    background: #f5f3fb;
    display: grid;
    grid-template-columns: 8mm 1fr;
    align-items: center;
    gap: 2.5mm;
  }

  .pc-print-route li > b { color: #7565f6; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 9pt; }
  .pc-print-route li strong { font-size: 8.2pt; }
  .pc-print-route li p { margin: .7mm 0 0; color: #706a7c; font-size: 7.2pt; line-height: 1.35; }

  .pc-print-place > p {
    max-height: 22mm;
    margin: 0 0 2.5mm;
    overflow: hidden;
    color: #625d6d;
    font-size: 7.4pt;
    line-height: 1.42;
  }

  .pc-print-place dl { margin: 0; display: grid; gap: 1.7mm; }
  .pc-print-place dl > div { display: grid; grid-template-columns: 13mm 1fr; gap: 2mm; font-size: 7.2pt; line-height: 1.35; }
  .pc-print-place dt { color: #96909e; }
  .pc-print-place dd { margin: 0; color: #302b3c; font-weight: 700; }

  .pc-print-reminder ul { display: grid; gap: 1.8mm; }
  .pc-print-reminder li { padding-left: 3mm; color: #5e586a; font-size: 7.4pt; line-height: 1.35; position: relative; }
  .pc-print-reminder li::before { content: ""; position: absolute; left: 0; top: 1.5mm; width: 1.3mm; height: 1.3mm; border-radius: 50%; background: #78e8ff; }

  .pc-print-checklist > div:last-child { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 1.7mm 2mm; }
  .pc-print-checklist > div:last-child span { color: #5f596b; font-size: 7pt; line-height: 1.35; }

  .pc-print-footer {
    border-top: .35mm solid rgba(31,25,68,.13);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4mm;
  }

  .pc-print-footer > div { display: flex; gap: 1.5mm; }
  .pc-print-footer span { padding: 1mm 2.2mm; border-radius: 99mm; color: #5546c0; background: #ece9ff; font-size: 6.5pt; font-weight: 800; }
  .pc-print-footer p { margin: 0; color: #878190; font-size: 6.7pt; }
}
`;
