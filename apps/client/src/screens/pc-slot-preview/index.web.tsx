import ArrowLeftOutlinedSvg from '@ant-design/icons-svg/es/asn/ArrowLeftOutlined';
import ReloadOutlinedSvg from '@ant-design/icons-svg/es/asn/ReloadOutlined';
import type { AbstractNode, IconDefinition } from '@ant-design/icons-svg/es/types';
import { Alert, Button, ConfigProvider, Typography } from 'antd';
import 'antd/dist/reset.css';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, SVGProps } from 'react';
import { Image as NativeImage } from 'react-native';

import { useApp } from '@/contexts/app-context';
import { formatBudget, formatDuration } from '@/formatters';
import {
  clearPendingPcBoxDraw,
  readPendingPcBoxDraw,
  type PendingPcBoxDraw,
} from '@/lib/pc-box-open-state';
import type { Preferences } from '@/types';

const { Text } = Typography;
const LAUNCH_CHARGE_MS = 420;
const SPIN_MINIMUM_MS = 3_200;
const REEL_STOP_GAP_MS = 560;
const SYMBOL_COUNT = 12;
const REEL_SYMBOLS = Array.from({ length: SYMBOL_COUNT * 2 }, (_, index) => index % SYMBOL_COUNT);
type StaticAsset = number | string | { uri: string };
const reelIconAssets = [
  [
    require('../../../assets/images/slot-preview/icons-fast/reel-1/01.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-1/02.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-1/03.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-1/04.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-1/05.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-1/06.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-1/07.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-1/08.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-1/09.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-1/10.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-1/11.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-1/12.png'),
  ],
  [
    require('../../../assets/images/slot-preview/icons-fast/reel-2/01.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-2/02.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-2/03.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-2/04.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-2/05.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-2/06.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-2/07.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-2/08.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-2/09.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-2/10.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-2/11.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-2/12.png'),
  ],
  [
    require('../../../assets/images/slot-preview/icons-fast/reel-3/01.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-3/02.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-3/03.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-3/04.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-3/05.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-3/06.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-3/07.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-3/08.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-3/09.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-3/10.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-3/11.png'),
    require('../../../assets/images/slot-preview/icons-fast/reel-3/12.png'),
  ],
] as StaticAsset[][];
const machineShellAsset = require('../../../assets/images/slot-preview/travel-slot-machine-shell-sliders-up-v10-web.jpg') as StaticAsset;
const portraitMachineShellAsset = require('../../../assets/images/slot-preview/travel-slot-machine-shell-portrait-sliders-up-v10-web.jpg') as StaticAsset;
const leverAsset = require('../../../assets/images/slot-preview/travel-slot-lever-original-v1.png') as StaticAsset;
const portraitLeverAsset = require('../../../assets/images/slot-preview/travel-slot-lever-portrait-original-v1.png') as StaticAsset;
const leverButtonLogoAsset = require('../../../assets/images/slot-preview/duck-lever-button-v1.png') as StaticAsset;
const pixelPanelAsset = require('../../../assets/images/slot-preview/duck-pixel-panel-v1.png') as StaticAsset;

function assetUri(source: StaticAsset) {
  if (typeof source === 'string') return source;
  if (typeof source === 'object' && source.uri) return source.uri;
  if (typeof source !== 'number') return '';
  const resolveAssetSource = NativeImage.resolveAssetSource as
    | ((asset: number) => { uri?: string } | undefined)
    | undefined;
  return resolveAssetSource?.(source)?.uri ?? '';
}

const reelIconUris = reelIconAssets.map((assets) => assets.map(assetUri));
const machineShellUri = assetUri(machineShellAsset);
const portraitMachineShellUri = assetUri(portraitMachineShellAsset);
const leverUri = assetUri(leverAsset);
const portraitLeverUri = assetUri(portraitLeverAsset);
const leverButtonLogoUri = assetUri(leverButtonLogoAsset);
const pixelPanelUri = assetUri(pixelPanelAsset);

type SlotStage = 'idle' | 'launching' | 'spinning' | 'settling' | 'revealed' | 'error';

type SlotIconProps = SVGProps<SVGSVGElement> & { size?: number };

function getIconNode(definition: IconDefinition): AbstractNode {
  return typeof definition.icon === 'function'
    ? definition.icon('#352116', '#ff7a23')
    : definition.icon;
}

function collectPaths(node: AbstractNode): string[] {
  const currentPath = node.tag === 'path' ? node.attrs.d : undefined;
  const childPaths = node.children?.flatMap(collectPaths) ?? [];
  return currentPath ? [currentPath, ...childPaths] : childPaths;
}

function createSlotIcon(definition: IconDefinition) {
  const iconNode = getIconNode(definition);
  const paths = collectPaths(iconNode);
  return function SlotIcon({ size = 18, ...props }: SlotIconProps) {
    return (
      <svg aria-hidden="true" focusable="false" height={size} viewBox={iconNode.attrs.viewBox} width={size} {...props}>
        {paths.map((d, index) => <path key={index} d={d} fill="currentColor" />)}
      </svg>
    );
  };
}

const ArrowLeftOutlined = createSlotIcon(ArrowLeftOutlinedSvg);
const ReloadOutlined = createSlotIcon(ReloadOutlinedSvg);

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

function PixelMatrixText({ className, text }: { className: string; text: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const context = canvas.getContext('2d');
      if (!context) return;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);

      const targetCell = rect.width < 260 ? 3 : 4.6;
      const columns = Math.min(180, Math.max(48, Math.floor(rect.width / targetCell)));
      const rows = Math.min(36, Math.max(11, Math.floor(rect.height / targetCell)));
      const mask = document.createElement('canvas');
      mask.width = columns;
      mask.height = rows;
      const maskContext = mask.getContext('2d', { willReadFrequently: true });
      if (!maskContext) return;

      let fontSize = Math.max(9, Math.floor(rows * .82));
      maskContext.font = `1000 ${fontSize}px PingFang SC, Microsoft YaHei, sans-serif`;
      while (fontSize > 8 && maskContext.measureText(text).width > columns - 4) {
        fontSize -= 1;
        maskContext.font = `1000 ${fontSize}px PingFang SC, Microsoft YaHei, sans-serif`;
      }
      maskContext.textAlign = 'center';
      maskContext.textBaseline = 'middle';
      maskContext.fillStyle = '#fff';
      maskContext.fillText(text, columns / 2, rows / 2 + .35);

      const pixels = maskContext.getImageData(0, 0, columns, rows).data;
      const cellWidth = rect.width / columns;
      const cellHeight = rect.height / rows;
      context.shadowColor = 'rgba(190, 255, 255, 1)';
      context.shadowBlur = Math.max(3, cellWidth * 2.1);
      let litCells = 0;

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns; x += 1) {
          const alpha = pixels[(y * columns + x) * 4 + 3];
          if (alpha < 88) continue;
          litCells += 1;
          const intensity = alpha / 255;
          context.fillStyle = y < rows * .46
            ? `rgba(255, 255, 255, ${.9 + intensity * .1})`
            : `rgba(205, 251, 255, ${.86 + intensity * .14})`;
          context.fillRect(
            x * cellWidth + cellWidth * .14,
            y * cellHeight + cellHeight * .16,
            Math.max(1, cellWidth * .7),
            Math.max(1, cellHeight * .66),
          );
        }
      }
      canvas.dataset.litCells = String(litCells);
    };

    const observer = new ResizeObserver(render);
    observer.observe(canvas.parentElement ?? canvas);
    render();
    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(render);
    });
    const delayedRender = window.setTimeout(render, 180);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(firstFrame);
      window.clearTimeout(delayedRender);
    };
  }, [text]);

  return <canvas ref={canvasRef} className={className} aria-label={text} />;
}

function SlotReel({
  index,
  isSpinning,
  isStopped,
  finalSymbol,
}: {
  index: number;
  isSpinning: boolean;
  isStopped: boolean;
  finalSymbol: number;
}) {
  const trackStyle = {
    '--reel-duration': `${760 + index * 110}ms`,
    '--reel-idle-duration': `${13_800 + index * 2_300}ms`,
    '--reel-delay': `${index * -2_650}ms`,
    '--cycle-offset-desktop': '-2112px',
    '--cycle-offset-portrait': '-1416px',
    '--stop-offset': `${-(SYMBOL_COUNT + finalSymbol) * 176 + 176}px`,
    '--stop-offset-portrait': `${-(SYMBOL_COUNT + finalSymbol) * 118 + 118}px`,
  } as CSSProperties;

  return (
    <div className={`travel-slot-reel${isSpinning ? ' is-spinning' : ''}${isStopped ? ' is-stopped' : ''}`}>
      <div className="travel-slot-reel-glass" />
      <div className="travel-slot-track" style={trackStyle}>
        {REEL_SYMBOLS.map((symbol, symbolIndex) => (
          <div className="travel-slot-symbol" key={`${symbol}-${symbolIndex}`}>
            <span className="travel-slot-sprite-frame">
              <img
                className="travel-slot-sprite"
                decoding="async"
                fetchPriority={symbolIndex < 4 ? 'auto' : 'low'}
                loading={symbolIndex < 4 ? 'eager' : 'lazy'}
                src={reelIconUris[index][symbol]}
                alt=""
              />
            </span>
          </div>
        ))}
      </div>
      <span className="travel-slot-payline" />
    </div>
  );
}

export default function PcSlotPreviewScreen() {
  const router = useRouter();
  const { cities, clearError, currentDraw, isBooting, reroll, selectedCityId, startDraw } = useApp();
  const [pendingDraw] = useState<PendingPcBoxDraw | null>(() => readPendingPcBoxDraw());
  const [stage, setStage] = useState<SlotStage>('idle');
  const [stoppedReels, setStoppedReels] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLeverPulling, setIsLeverPulling] = useState(false);
  const runIdRef = useRef(0);
  const mountedRef = useRef(true);
  const leverTimerRef = useRef<number | null>(null);

  const finalSymbols = useMemo(() => {
    const seed = currentDraw?.activity.id ?? pendingDraw?.cityId ?? 5;
    return [seed % SYMBOL_COUNT, (seed * 3 + 4) % SYMBOL_COUNT, (seed * 7 + 9) % SYMBOL_COUNT];
  }, [currentDraw?.activity.id, pendingDraw?.cityId]);

  const directDrawInput = useMemo(() => {
    const city = cities.find((item) => item.id === selectedCityId) ?? cities[0] ?? null;
    if (!city) return null;

    const preferences: Preferences = {
      partySize: 1,
      durationMinutes: null,
      budgetMax: 200,
      mood: '放松',
      randomLevel: 70,
      category: '不限',
      environment: 'either',
      radiusKm: 10,
      originName: city.name,
      originLatitude: null,
      originLongitude: null,
      originAccuracyMeters: null,
      originSource: 'manual',
      destinationScope: 'nearby',
      travelDuration: 'same-day',
      clientSource: 'pc',
      destinationScopeLabel: `${city.name}本地`,
      travelDurationLabel: '当天',
      budgetLabel: '适中',
      surpriseLevelLabel: '高惊喜',
    };

    return { cityId: city.id, preferences };
  }, [cities, selectedCityId]);

  useEffect(() => () => {
    mountedRef.current = false;
    runIdRef.current += 1;
    if (leverTimerRef.current !== null) window.clearTimeout(leverTimerRef.current);
  }, []);

  const startSlotDraw = useCallback(async () => {
    if (isBooting || stage === 'launching' || stage === 'spinning' || stage === 'settling') return;
    if (stage === 'revealed' && currentDraw && currentDraw.attemptsRemaining <= 0) return;

    const isRepeatDraw = stage === 'revealed' && currentDraw !== null;
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    setErrorMessage(null);
    setStoppedReels(0);
    setStage('launching');
    setIsLeverPulling(true);
    if (leverTimerRef.current !== null) window.clearTimeout(leverTimerRef.current);
    leverTimerRef.current = window.setTimeout(() => {
      setIsLeverPulling(false);
      leverTimerRef.current = null;
    }, 1_520);
    clearError();
    window.navigator.vibrate?.(28);

    const drawPromise = isRepeatDraw
      ? reroll()
      : pendingDraw
        ? startDraw(pendingDraw.cityId, pendingDraw.preferences)
        : currentDraw
          ? wait(760)
          : directDrawInput
            ? startDraw(directDrawInput.cityId, directDrawInput.preferences)
            : Promise.reject(new Error('城市数据尚未准备完成，请稍后重试。'));
    await wait(LAUNCH_CHARGE_MS);
    if (!mountedRef.current || runId !== runIdRef.current) return;
    setStage('spinning');
    const [drawOutcome] = await Promise.allSettled([drawPromise, wait(SPIN_MINIMUM_MS)]);
    if (!mountedRef.current || runId !== runIdRef.current) return;

    if (drawOutcome.status === 'rejected') {
      setStage('error');
      setErrorMessage(drawOutcome.reason instanceof Error ? drawOutcome.reason.message : '抽取失败，请稍后重试。');
      return;
    }

    setStage('settling');
    for (let reel = 1; reel <= 3; reel += 1) {
      await wait(REEL_STOP_GAP_MS);
      if (!mountedRef.current || runId !== runIdRef.current) return;
      setStoppedReels(reel);
      window.navigator.vibrate?.(reel === 3 ? [35, 25, 75] : 28);
    }

    setStage('revealed');
    if (pendingDraw && !isRepeatDraw) clearPendingPcBoxDraw();
  }, [clearError, currentDraw, directDrawInput, isBooting, pendingDraw, reroll, stage, startDraw]);

  const resetPreview = () => {
    runIdRef.current += 1;
    if (leverTimerRef.current !== null) window.clearTimeout(leverTimerRef.current);
    leverTimerRef.current = null;
    setIsLeverPulling(false);
    setStoppedReels(0);
    setStage('idle');
    setErrorMessage(null);
  };

  const isActive = stage === 'launching' || stage === 'spinning' || stage === 'settling';
  const areReelsMoving = stage === 'spinning' || stage === 'settling';
  const statusLabel = isBooting
    ? '正在准备旅行数据…'
    : stage === 'launching'
      ? '能量注入中…'
      : stage === 'spinning'
      ? '高速匹配中…'
      : stage === 'settling'
        ? `锁定滚轮 ${stoppedReels}/3`
        : stage === 'revealed'
          ? currentDraw?.activity.title ?? '目的地已锁定'
          : '拉下摇杆，交给旅行运气';
  const compactDisplayTitle = isBooting
    ? '准备中'
    : stage === 'launching'
      ? '运气加载'
      : stage === 'spinning'
        ? '景点匹配中'
        : stage === 'settling'
          ? `${stoppedReels}/3 锁定中`
          : stage === 'revealed'
            ? '目的地锁定'
            : stage === 'error'
              ? '信号中断'
              : '下一站？';

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#ff7426', borderRadius: 18, fontFamily: 'Inter, PingFang SC, Microsoft YaHei, sans-serif' } }}>
      <main className={`travel-slot-page stage-${stage}${isLeverPulling ? ' is-lever-pulling' : ''}`}>
        <style>{travelSlotCss}</style>
        <section className="travel-slot-stage" aria-live="polite">
          <div className="travel-slot-machine">
            <picture className="travel-slot-shell-picture">
              <source media="(max-aspect-ratio: 4/3)" srcSet={portraitMachineShellUri} />
              <img className="travel-slot-shell-image" decoding="async" fetchPriority="high" loading="eager" src={machineShellUri} alt="" />
            </picture>
            <div className="travel-slot-lever-art travel-slot-lever-art-landscape" aria-hidden="true">
              <img className="travel-slot-lever-image travel-slot-lever-complete-art" src={leverUri} alt="" />
            </div>
            <div className="travel-slot-lever-art travel-slot-lever-art-portrait" aria-hidden="true">
              <img className="travel-slot-lever-image travel-slot-lever-complete-art" src={portraitLeverUri} alt="" />
            </div>
            <div className="travel-slot-lever-logo" aria-hidden="true">
              <img src={leverButtonLogoUri} alt="" />
            </div>
            <img className="travel-slot-pixel-panel-art" src={pixelPanelUri} alt="鸭鸭像素屏" />
            <span className="travel-slot-win-flash" aria-hidden="true" />
            <span className="travel-slot-speed-vignette" aria-hidden="true" />
            <Button
              className="travel-slot-back"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.replace('/box/config')}>
              返回
            </Button>
            <span className="travel-slot-preview-badge">SLOT MACHINE / TRAVEL EDITION</span>
            <div className="travel-slot-top-lights" aria-hidden="true">
              {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
            </div>

            <div className="travel-slot-marquee">
              <div className="travel-slot-display-copy">
                <PixelMatrixText className="travel-slot-matrix-title" text={compactDisplayTitle} />
              </div>
              <span className="travel-slot-display-pips" aria-hidden="true">
                {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
              </span>
            </div>

            <div className="travel-slot-face">
              <aside className="travel-slot-left-panel" aria-hidden="true">
                <span className="travel-slot-mini-screen">🦆</span>
                <i className="travel-slot-speaker" />
                <i className="travel-slot-speaker" />
                <div className="travel-slot-meter"><span /></div>
              </aside>

              <div className="travel-slot-window">
                <div className="travel-slot-reels">
                  {[0, 1, 2].map((reelIndex) => (
                    <SlotReel
                      finalSymbol={finalSymbols[reelIndex]}
                      index={reelIndex}
                      isSpinning={areReelsMoving && reelIndex >= stoppedReels}
                      isStopped={stoppedReels > reelIndex || stage === 'revealed'}
                      key={reelIndex}
                    />
                  ))}
                </div>
                <span className="travel-slot-pointer travel-slot-pointer-left">▶</span>
                <span className="travel-slot-pointer travel-slot-pointer-right">◀</span>
                {stage === 'revealed' && currentDraw ? (
                  <section className="travel-slot-result" aria-label={`推荐结果：${currentDraw.activity.title}`}>
                    <div className="travel-slot-result-media">
                      {currentDraw.activity.coverImageUri?.trim() ? (
                        <img src={currentDraw.activity.coverImageUri} alt={currentDraw.activity.title} />
                      ) : (
                        <span aria-hidden="true">🗺️</span>
                      )}
                    </div>
                    <div className="travel-slot-result-copy">
                      <span className="travel-slot-result-badge">
                        {currentDraw.recommendation?.display.badge ?? `${currentDraw.activity.cityName}已锁定`}
                      </span>
                      <h1>{currentDraw.activity.title}</h1>
                      <p>{currentDraw.activity.summary}</p>
                      <div className="travel-slot-result-meta">
                        <span>{currentDraw.activity.cityName} · {currentDraw.activity.district}</span>
                        <span>{formatDuration(currentDraw.activity.durationMinutes)}</span>
                        <span>{formatBudget(currentDraw.activity.budgetYuan)}</span>
                      </div>
                      <div className="travel-slot-result-actions">
                        <button
                          disabled={currentDraw.attemptsRemaining <= 0}
                          onClick={() => void startSlotDraw()}>
                          {currentDraw.attemptsRemaining > 0 ? `再抽一次 · 剩 ${currentDraw.attemptsRemaining} 次` : '本轮机会已用完'}
                        </button>
                        <button onClick={() => router.push('/box/result')}>查看完整方案</button>
                      </div>
                    </div>
                  </section>
                ) : null}
              </div>

              <button
                aria-label="拉下摇杆开始抽取"
                className="travel-slot-lever"
                disabled={isBooting || isActive || (stage === 'revealed' && (currentDraw?.attemptsRemaining ?? 0) <= 0)}
                onClick={() => void startSlotDraw()}>
                <span className="travel-slot-lever-ball">🦆</span>
                <span className="travel-slot-lever-stick" />
                <span className="travel-slot-lever-base" />
              </button>
            </div>

            <div className="travel-slot-controls">
              <div className="travel-slot-confetti" aria-hidden="true">
                {Array.from({ length: 14 }, (_, index) => <i key={index} />)}
              </div>
              <span className="travel-slot-orb orb-one" />
              <button
                aria-label="启动旅行"
                className="travel-slot-main-button"
                disabled={isBooting || isActive || (stage === 'revealed' && (currentDraw?.attemptsRemaining ?? 0) <= 0)}
                onClick={() => void startSlotDraw()}
              />
              <span className="travel-slot-orb orb-two" />
              <span className="travel-slot-orb orb-three" />
              <div className="travel-slot-status">
                <i className={isActive ? 'is-live' : ''} />
                <Text>{statusLabel}</Text>
              </div>
              <Text className="travel-slot-summary-inline">
                {pendingDraw?.summary ?? 'DEMO MODE · 3 REELS × 12 DESTINATIONS'}
              </Text>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <Alert
            className="travel-slot-error"
            type="error"
            showIcon
            title="老虎机抽取失败"
            description={errorMessage}
            action={stage === 'error'
              ? <Button size="small" icon={<ReloadOutlined />} onClick={resetPreview}>重新试一次</Button>
              : <Button size="small" onClick={() => router.replace('/box/config')}>返回设置</Button>}
          />
        ) : null}
      </main>
    </ConfigProvider>
  );
}

const travelSlotCss = String.raw`
html, body { width: 100%; min-height: 100%; margin: 0; background: #f47b22; }
.travel-slot-page {
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  color: #3b2418;
  background: #f47b22;
  font-family: Inter, PingFang SC, Microsoft YaHei, sans-serif;
}
.travel-slot-stage { width: 100%; height: 100%; }
.travel-slot-machine {
  position: relative;
  width: 100%;
  height: 100%;
  padding: clamp(18px, 3vh, 34px) clamp(24px, 4.2vw, 68px) clamp(16px, 2.6vh, 30px);
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background:
    radial-gradient(circle at 4% 10%, rgba(255,255,255,.45), transparent 16%),
    radial-gradient(circle at 94% 88%, rgba(130,38,9,.14), transparent 24%),
    linear-gradient(110deg, rgba(255,255,255,.58), transparent 18% 70%, rgba(168,72,18,.1)),
    linear-gradient(145deg, #ffd582, #ff9c3f 62%, #f47722);
  box-shadow: inset 0 5px 0 rgba(255,255,255,.7), inset 0 -16px 30px rgba(139,48,9,.2);
  display: grid;
  grid-template-rows: minmax(78px, 15vh) minmax(0, 1fr) minmax(108px, 21vh);
  gap: clamp(10px, 2vh, 22px);
  isolation: isolate;
}
.travel-slot-machine::before { content: ''; position: absolute; inset: clamp(8px,1vw,16px); z-index: -1; border: 3px solid rgba(218,92,22,.4); border-radius: clamp(18px,2vw,32px); pointer-events: none; }
.travel-slot-back.ant-btn { position: absolute; left: clamp(18px,2.2vw,36px); top: clamp(18px,2.5vh,32px); z-index: 10; color: #7d350f; border: 2px solid rgba(135,52,12,.2); background: rgba(255,240,185,.82); box-shadow: 0 4px 0 rgba(165,65,15,.2); }
.travel-slot-preview-badge { position: absolute; right: clamp(18px,2.2vw,36px); top: clamp(20px,2.7vh,34px); z-index: 10; color: rgba(118,48,13,.66); font: 900 clamp(8px,.7vw,11px) ui-monospace, monospace; letter-spacing: .14em; }
.travel-slot-top-lights { position: absolute; left: 50%; top: 8px; display: flex; gap: clamp(34px,5.8vw,100px); transform: translateX(-50%); }
.travel-slot-top-lights i { width: clamp(13px,1.2vw,20px); height: clamp(13px,1.2vw,20px); border: 3px solid #fff2c9; border-radius: 50%; background: #ff6c25; box-shadow: 0 3px 5px rgba(122,47,7,.24), inset 0 2px 3px rgba(255,255,255,.8); }
.stage-spinning .travel-slot-top-lights i, .stage-settling .travel-slot-top-lights i { animation: travelSlotBlink .5s steps(1) infinite; animation-delay: calc(var(--i, 0) * .08s); }
.travel-slot-marquee { width: min(64vw, 980px); height: 100%; min-height: 0; margin: 0 auto; padding: 8px clamp(20px,3vw,48px); border: clamp(6px,.7vw,11px) solid #f07a26; border-radius: clamp(22px,2.4vw,38px); color: #fff; background: linear-gradient(180deg, #36c6f5, #196bd8); box-shadow: inset 0 0 34px rgba(255,255,255,.38), 0 clamp(6px,1vh,10px) 0 #c85619; display: flex; align-items: center; justify-content: space-between; text-align: center; }
.travel-slot-marquee small { display: block; color: #bff7ff; font: 900 10px ui-monospace, monospace; letter-spacing: .24em; }
.travel-slot-marquee strong { display: block; margin-top: 3px; font-size: clamp(22px, 3vw, 46px); font-weight: 950; text-shadow: 0 4px 0 rgba(17,73,145,.46); }
.travel-slot-star { color: #ffe45f; font-size: clamp(27px,3vw,52px); filter: drop-shadow(0 4px 0 #dc8917); }
.travel-slot-face { min-height: 0; display: grid; grid-template-columns: clamp(82px,10vw,164px) 1fr clamp(88px,10vw,170px); align-items: stretch; gap: clamp(12px,2vw,34px); }
.travel-slot-left-panel { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: clamp(12px,2vh,22px); }
.travel-slot-mini-screen { width: clamp(66px,7vw,112px); height: clamp(66px,7vw,112px); border: clamp(5px,.55vw,9px) solid #f6b457; border-radius: clamp(16px,1.6vw,26px); background: #392a2a; display: grid; place-items: center; font-size: clamp(33px,4vw,64px); box-shadow: inset 0 0 18px #000, 0 7px 0 #d6681e; }
.travel-slot-speaker { width: clamp(45px,5.5vw,90px); height: clamp(8px,.8vw,13px); border-radius: 99px; background: #d8651d; box-shadow: 0 clamp(13px,1.5vh,22px) 0 #d8651d, 0 clamp(26px,3vh,44px) 0 #d8651d; }
.travel-slot-meter { width: clamp(25px,2.5vw,42px); height: clamp(82px,13vh,140px); margin-top: clamp(18px,3vh,38px); padding: 5px; border-radius: 22px; background: #fff0bf; box-shadow: inset 0 0 0 4px #d96720; }
.travel-slot-meter span { display: block; width: 100%; height: 64%; margin-top: 24px; border-radius: 9px; background: linear-gradient(#b9ef58, #69d568); }
.travel-slot-window { position: relative; height: 100%; min-height: 0; padding: clamp(10px,1.2vw,18px); border: clamp(8px,.85vw,14px) solid #eb7223; border-radius: clamp(28px,3vw,48px); background: #6e2d1b; box-shadow: inset 0 9px 22px rgba(68,19,8,.5), 0 clamp(7px,1.2vh,13px) 0 #c95516; }
.travel-slot-reels { height: 100%; overflow: hidden; border: 4px solid #7c3118; border-radius: 20px; background: #fff5dc; display: grid; grid-template-columns: repeat(3, 1fr); }
.travel-slot-reel { --cell-h: 126px; position: relative; min-width: 0; overflow: hidden; border-right: 3px solid rgba(125,52,23,.28); background: linear-gradient(90deg, #f2d09e, #fff9e8 20% 80%, #e8bd7c); }
.travel-slot-reel:last-child { border-right: 0; }
.travel-slot-track { position: absolute; left: 0; top: -54px; width: 100%; will-change: transform, filter; }
.travel-slot-reel.is-spinning .travel-slot-track { animation: travelSlotReelSpin var(--reel-duration) linear infinite; filter: blur(3px) saturate(1.12); }
.travel-slot-reel.is-stopped .travel-slot-track { animation: none; transform: translateY(var(--stop-offset)); filter: none; transition: transform .76s cubic-bezier(.12,.86,.22,1.18), filter .18s; }
.travel-slot-symbol { height: var(--cell-h); display: grid; place-items: center; }
.travel-slot-sprite { width: clamp(112px,14vw,220px); height: clamp(98px,12vw,180px); display: block; border-radius: 22px; background-repeat: no-repeat; background-size: 400% 300%; filter: drop-shadow(0 10px 9px rgba(86,42,15,.22)); transform: scale(.92); }
.travel-slot-reel-glass { position: absolute; inset: 0; z-index: 3; pointer-events: none; background: linear-gradient(180deg, rgba(92,39,16,.35), transparent 20% 77%, rgba(91,36,14,.34)), linear-gradient(90deg, rgba(255,255,255,.36), transparent 23% 80%, rgba(100,35,11,.16)); }
.travel-slot-payline { position: absolute; left: 0; right: 0; top: 50%; z-index: 4; height: 2px; opacity: .34; background: #ff702a; box-shadow: 0 0 12px #ff9c58; }
.travel-slot-pointer { position: absolute; top: 50%; z-index: 8; color: #fff9c6; font-size: 27px; text-shadow: 0 3px 0 #b94c16; transform: translateY(-50%); }
.travel-slot-pointer-left { left: -25px; }
.travel-slot-pointer-right { right: -25px; }
.travel-slot-lever { position: relative; width: 100%; height: 100%; border: 0; background: transparent; cursor: pointer; }
.travel-slot-lever:disabled { cursor: default; }
.travel-slot-lever-ball { position: absolute; left: 50%; top: 0; z-index: 3; width: clamp(70px,7.2vw,118px); height: clamp(70px,7.2vw,118px); border: clamp(5px,.55vw,9px) solid #fff0a7; border-radius: 50%; background: linear-gradient(145deg, #fff082, #ffb82e 58%, #f1831b); box-shadow: 0 14px 18px rgba(125,51,9,.26), inset 5px 6px 12px rgba(255,255,255,.7); display: grid; place-items: center; font-size: clamp(33px,4vw,62px); transform: translateX(-50%); transition: transform .26s cubic-bezier(.2,.8,.2,1); }
.travel-slot-lever-stick { position: absolute; left: 50%; top: clamp(56px,6vw,100px); width: clamp(16px,1.5vw,25px); height: 54%; border: 4px solid #922f17; border-radius: 12px; background: linear-gradient(90deg, #e8622f, #fff0a8 48%, #dc4d21); transform: translateX(-50%); transform-origin: center bottom; transition: transform .34s cubic-bezier(.2,.8,.2,1); }
.travel-slot-lever-base { position: absolute; left: 50%; bottom: 0; width: clamp(68px,7vw,118px); height: clamp(82px,13vh,138px); border: clamp(6px,.6vw,10px) solid #c74e17; border-radius: clamp(18px,2vw,32px); background: #ffb84c; box-shadow: inset 0 5px rgba(255,255,255,.5), 0 9px 0 #a93c13; transform: translateX(-50%); }
.stage-spinning .travel-slot-lever-ball, .stage-settling .travel-slot-lever-ball { transform: translate(-50%, 120px); }
.stage-spinning .travel-slot-lever-stick, .stage-settling .travel-slot-lever-stick { transform: translateX(-50%) rotateX(58deg); }
.travel-slot-controls { position: relative; height: 100%; min-height: 0; margin: 0 clamp(12px,2vw,32px); border-radius: clamp(25px,3vw,48px); background: linear-gradient(180deg, #ffd888, #f79837); box-shadow: inset 0 5px 0 rgba(255,255,255,.58), 0 clamp(7px,1vh,12px) 0 #ce5d18; display: flex; align-items: center; justify-content: center; gap: clamp(18px,4vw,68px); }
.travel-slot-main-button { position: relative; z-index: 3; width: clamp(190px,24vw,390px); height: clamp(76px,12vh,132px); border: clamp(7px,.8vw,12px) solid #df601c; border-radius: clamp(26px,3vw,46px); color: #74300f; background: linear-gradient(180deg, #fff16e, #ffad21); box-shadow: 0 clamp(9px,1.4vh,15px) 0 #a83a12, inset 0 6px 0 rgba(255,255,255,.66); font-size: clamp(19px,2.2vw,36px); font-weight: 950; cursor: pointer; transition: transform .15s, box-shadow .15s; }
.travel-slot-main-button:active:not(:disabled) { transform: translateY(6px); box-shadow: 0 3px 0 #a83a12, inset 0 4px rgba(255,255,255,.6); }
.travel-slot-main-button:disabled { cursor: default; }
.stage-spinning .travel-slot-main-button { animation: travelSlotButtonPulse .58s ease-in-out infinite alternate; }
.travel-slot-orb { width: clamp(55px,7vw,112px); height: clamp(55px,7vw,112px); border: clamp(5px,.6vw,9px) solid rgba(144,54,25,.23); border-radius: 50%; box-shadow: inset 7px 8px 13px rgba(255,255,255,.58), 0 8px 11px rgba(129,51,18,.19); }
.orb-one { background: #6cbcf6; }
.orb-two { background: #bce84d; }
.orb-three { background: #d778ee; }
.travel-slot-status { position: absolute; left: 18px; bottom: 11px; display: flex; align-items: center; gap: 7px; }
.travel-slot-status i { width: 8px; height: 8px; border-radius: 50%; background: #a66b37; }
.travel-slot-status i.is-live { background: #5cc850; box-shadow: 0 0 10px #5cc850; animation: travelSlotBlink .65s steps(1) infinite; }
.travel-slot-status .ant-typography { color: #8c491d; font-size: 10px; font-weight: 800; }
.travel-slot-summary-inline { position: absolute; right: 20px; bottom: 10px; max-width: 46%; overflow: hidden; color: rgba(112,55,22,.68) !important; font-size: clamp(8px,.7vw,11px); font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.travel-slot-confetti i { position: absolute; left: calc(5% + var(--x, 0%)); top: var(--y, 20%); width: 8px; height: 4px; border-radius: 4px; background: var(--c, #d578ee); transform: rotate(var(--r, 12deg)); }
.travel-slot-confetti i:nth-child(1) { --x: 3%; --y: 18%; --c:#63cbee; }.travel-slot-confetti i:nth-child(2) { --x: 12%; --y: 72%; --c:#b5e34c; }.travel-slot-confetti i:nth-child(3) { --x: 21%; --y: 23%; --c:#ef6c67; }.travel-slot-confetti i:nth-child(4) { --x: 31%; --y: 78%; }.travel-slot-confetti i:nth-child(5) { --x: 42%; --y: 18%; --c:#60cfea; }.travel-slot-confetti i:nth-child(6) { --x: 55%; --y: 80%; --c:#b7e24b; }.travel-slot-confetti i:nth-child(7) { --x: 66%; --y: 19%; --c:#ef7063; }.travel-slot-confetti i:nth-child(8) { --x: 77%; --y: 73%; }.travel-slot-confetti i:nth-child(9) { --x: 84%; --y: 28%; --c:#5bcbe9; }
.travel-slot-error { position: fixed; left: 50%; bottom: 28px; z-index: 20; width: min(calc(100% - 32px), 620px); transform: translateX(-50%); box-shadow: 0 18px 60px rgba(113,45,16,.24); }
.stage-revealed .travel-slot-machine { animation: travelSlotWin .68s cubic-bezier(.16,1,.3,1) both; }
.stage-revealed .travel-slot-top-lights i { background: #d9ff68; box-shadow: 0 0 18px #d9ff68, inset 0 2px #fff; }
.stage-revealed .travel-slot-marquee { animation: travelSlotMarqueeWin .45s ease-in-out infinite alternate; }
@keyframes travelSlotReelSpin { from { transform: translateY(0); } to { transform: translateY(-1512px); } }
@keyframes travelSlotBlink { 0%,48% { opacity: 1; } 49%,100% { opacity: .3; } }
@keyframes travelSlotButtonPulse { from { filter: brightness(1); transform: scale(1); } to { filter: brightness(1.12); transform: scale(1.035); } }
@keyframes travelSlotWin { 0% { transform: scale(.98); } 48% { transform: scale(1.025) rotate(-.35deg); } 72% { transform: scale(1.012) rotate(.28deg); } 100% { transform: scale(1); } }
@keyframes travelSlotMarqueeWin { from { filter: brightness(1); } to { filter: brightness(1.24) drop-shadow(0 0 14px rgba(81,215,255,.5)); } }
@media (max-width: 720px) {
  .travel-slot-page { overflow: hidden; }
  .travel-slot-back.ant-btn { left: 9px; top: 9px; width: 38px; padding: 0; font-size: 0; }
  .travel-slot-preview-badge { display: none; }
  .travel-slot-machine { padding: 12px 10px 13px; border-radius: 0; grid-template-rows: 76px minmax(0, 1fr) 92px; gap: 10px; }
  .travel-slot-marquee { width: calc(100% - 76px); height: 100%; min-height: 0; margin: 0 auto; border-width: 5px; }
  .travel-slot-marquee strong { font-size: 17px; }
  .travel-slot-face { grid-template-columns: 42px 1fr 45px; gap: 6px; }
  .travel-slot-left-panel { height: 100%; gap: 9px; }
  .travel-slot-mini-screen { width: 41px; height: 44px; border-width: 4px; font-size: 21px; }
  .travel-slot-speaker { width: 29px; height: 6px; box-shadow: 0 9px 0 #d8651d, 0 18px 0 #d8651d; }
  .travel-slot-meter { width: 18px; height: 70px; }
  .travel-slot-window { height: 100%; padding: 8px; border-width: 6px; border-radius: 24px; }
  .travel-slot-reel { --cell-h: 102px; }
  .travel-slot-track { top: -43px; }
  .travel-slot-reel.is-stopped .travel-slot-track { transform: translateY(var(--stop-offset-mobile)); }
  .travel-slot-reel.is-spinning .travel-slot-track { animation-name: travelSlotReelSpinMobile; }
  .travel-slot-sprite { width: 82px; height: 78px; border-radius: 12px; }
  .travel-slot-lever { width: 43px; height: 100%; }
  .travel-slot-lever-ball { width: 44px; height: 44px; border-width: 3px; font-size: 21px; }
  .travel-slot-lever-stick { top: 38px; width: 11px; height: 121px; }
  .travel-slot-lever-base { width: 42px; height: 59px; border-width: 4px; }
  .stage-spinning .travel-slot-lever-ball, .stage-settling .travel-slot-lever-ball { transform: translate(-50%, 92px); }
  .travel-slot-controls { height: 100%; min-height: 0; margin: 0 8px; gap: 9px; }
  .travel-slot-main-button { width: 130px; height: 60px; border-width: 5px; font-size: 15px; }
  .travel-slot-orb { width: 36px; height: 36px; border-width: 3px; }
  .travel-slot-status { display: none; }
  .travel-slot-summary-inline { display: none; }
}
@keyframes travelSlotReelSpinMobile { from { transform: translateY(0); } to { transform: translateY(-1224px); } }
@media (prefers-reduced-motion: reduce) {
  .travel-slot-reel.is-spinning .travel-slot-track { animation-duration: 1.8s; filter: none; }
  .stage-spinning .travel-slot-main-button, .stage-revealed .travel-slot-machine, .stage-revealed .travel-slot-marquee { animation: none; }
}

/* V2 hybrid renderer: cinematic 3D shell + live DOM reels and feedback layers. */
html, body { overflow: hidden; background: #171b12; }
.travel-slot-page { background: #171b12; }
.travel-slot-machine {
  position: relative;
  width: 100vw;
  height: 100dvh;
  padding: 0;
  overflow: hidden;
  background: #f4f7ee;
  display: block;
  transform: translateZ(0);
}
.travel-slot-machine::before { display: none; }
.travel-slot-shell-image {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  user-select: none;
  pointer-events: none;
}
.travel-slot-shell-portrait { display: none; }
.travel-slot-machine > *:not(.travel-slot-shell-image) { z-index: 2; }
.travel-slot-pixel-panel-art {
  position: absolute;
  left: 7.1%;
  top: 27.2%;
  z-index: 6;
  width: 10.2%;
  height: 18.15%;
  display: block;
  object-fit: contain;
  pointer-events: none;
  filter: drop-shadow(0 5px 8px rgba(26,31,22,.18));
}
.travel-slot-pixel-face {
  --pixel-gap: clamp(1px,.13vw,2px);
  position: absolute;
  left: 9.05%;
  top: 28.1%;
  z-index: 6;
  width: 6.65%;
  height: 10.8%;
  padding: 1.1% .78%;
  border-radius: 17%;
  background: radial-gradient(circle at 48% 42%, #223429 0%, #101a14 68%, #09100c 100%);
  box-shadow: inset 0 5px 12px rgba(0,0,0,.62), inset 0 -2px 4px rgba(136,170,128,.13), 0 0 7px rgba(23,27,18,.3);
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  grid-template-rows: repeat(9, 1fr);
  gap: var(--pixel-gap);
  pointer-events: none;
}
.travel-slot-pixel-face::after {
  content: '';
  position: absolute;
  inset: 7%;
  border-radius: 13%;
  background: repeating-linear-gradient(180deg, transparent 0 4px, rgba(178,255,169,.055) 4px 5px);
  box-shadow: inset 0 0 12px rgba(119,255,142,.08);
  pointer-events: none;
}
.travel-slot-pixel-face i { position: relative; z-index: 1; border-radius: 24%; background: rgba(201,255,98,.018); }
.travel-slot-pixel-face i.is-lit {
  background: #ccff70;
  box-shadow: 0 0 3px #d7ff75, 0 0 7px rgba(201,255,98,.72);
  animation: travelSlotFaceGlow 2.1s ease-in-out infinite alternate;
}
.travel-slot-pixel-face i.is-eye { background: #e7ffae; box-shadow: 0 0 4px #edffc2, 0 0 9px rgba(201,255,98,.9); }
.travel-slot-pixel-face i.is-cheek { background: #ffd86d; box-shadow: 0 0 4px #ffd86d, 0 0 8px rgba(255,169,73,.72); }
.travel-slot-pixel-face i.is-nose { opacity: .78; }
.travel-slot-pixel-face i.is-mouth { background: #bfff61; }
.travel-slot-back.ant-btn {
  left: 1.5vw;
  top: 1.6vh;
  z-index: 20;
  height: clamp(32px, 4.8vh, 46px);
  padding-inline: 15px;
  color: #171b12;
  border: 1px solid rgba(23,27,18,.18);
  background: rgba(244,247,238,.74);
  box-shadow: 0 8px 24px rgba(23,27,18,.13), inset 0 1px rgba(255,255,255,.8);
  backdrop-filter: blur(12px);
}
.travel-slot-preview-badge { display: none; }
.travel-slot-top-lights { display: none; }
.travel-slot-marquee {
  position: absolute;
  left: 27.1%;
  top: 9.6%;
  z-index: 4;
  width: 46.4%;
  height: 8.9%;
  min-height: 0;
  margin: 0;
  padding: 0 4%;
  border: 0;
  border-radius: 999px;
  color: #f4f7ee;
  background: transparent;
  box-shadow: none;
  overflow: hidden;
  display: grid;
  place-items: center;
  isolation: isolate;
}
.travel-slot-marquee::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 20%, rgba(255,255,255,.34) 45%, transparent 70%);
  transform: translateX(-130%);
  pointer-events: none;
  display: none;
}
.travel-slot-display-copy { position: absolute; inset: 0; z-index: 2; display: grid; place-items: center; text-align: center; }
.travel-slot-matrix-title {
  position: absolute;
  left: 8%;
  top: 18%;
  width: 84%;
  height: 72%;
  image-rendering: pixelated;
  filter: brightness(1.34) contrast(1.12) drop-shadow(0 0 7px rgba(190,255,255,1)) drop-shadow(0 0 15px rgba(75,207,255,.9));
  animation: travelSlotMatrixIn .38s steps(5,end) both;
}
.travel-slot-marquee small {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(7px,.7vw,12px);
  color: rgba(227,255,173,.84);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: clamp(6px,.56vw,10px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: .28em;
}
.travel-slot-marquee small i {
  padding: .22em .52em;
  border: 1px solid rgba(201,255,98,.55);
  border-radius: 999px;
  color: #171b12;
  background: #c9ff62;
  font-size: .76em;
  font-style: normal;
  letter-spacing: .08em;
  box-shadow: 0 0 10px rgba(201,255,98,.55);
}
.travel-slot-marquee strong {
  position: relative;
  display: inline-block;
  margin-top: .45vh;
  color: transparent;
  background: linear-gradient(180deg, #fff 0%, #efffff 50%, #bcecff 100%);
  background-clip: text;
  -webkit-background-clip: text;
  font-family: "Arial Rounded MT Bold", "SF Pro Rounded", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: clamp(17px, 2.12vw, 38px);
  font-weight: 1000;
  line-height: 1;
  letter-spacing: .035em;
  -webkit-text-stroke: .45px rgba(255,255,255,.42);
  filter: drop-shadow(0 2px 0 rgba(19,77,155,.72)) drop-shadow(0 0 8px rgba(126,230,255,.72));
  animation: travelSlotTitleIn .52s cubic-bezier(.16,1,.3,1) both;
}
.travel-slot-title-compact { display: none; }
.travel-slot-display-pips {
  position: absolute;
  right: 4.5%;
  bottom: 15%;
  display: none;
  gap: clamp(3px,.3vw,6px);
}
.travel-slot-display-pips i {
  width: clamp(3px,.32vw,6px);
  height: clamp(3px,.32vw,6px);
  border-radius: 50%;
  background: rgba(227,255,173,.38);
  box-shadow: 0 0 7px rgba(201,255,98,.55);
  animation: travelSlotPip 1.2s steps(1) infinite;
  animation-delay: calc(var(--pip, 0) * .12s);
}
.travel-slot-display-pips i:nth-child(2) { animation-delay: .12s; }
.travel-slot-display-pips i:nth-child(3) { animation-delay: .24s; }
.travel-slot-display-pips i:nth-child(4) { animation-delay: .36s; }
.travel-slot-display-pips i:nth-child(5) { animation-delay: .48s; }
.travel-slot-display-pips i:nth-child(6) { animation-delay: .6s; }
.travel-slot-display-pips i:nth-child(7) { animation-delay: .72s; }
.travel-slot-face {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: block;
}
.travel-slot-left-panel { display: none; }
.travel-slot-window {
  position: absolute;
  left: 21.9%;
  top: 26.8%;
  width: 57.2%;
  height: 46.7%;
  min-height: 0;
  padding: 0;
  border: 0;
  border-radius: clamp(19px, 2.2vw, 38px);
  overflow: hidden;
  background: #f7f8f2;
  box-shadow: inset 0 18px 30px rgba(23,27,18,.16), inset 0 -14px 28px rgba(23,27,18,.12);
}
.travel-slot-reels {
  height: 100%;
  border: 0;
  border-radius: inherit;
  background: #f7f8f2;
  overflow: hidden;
  transform: translateZ(0);
}
.travel-slot-reel {
  --cell-h: 176px;
  overflow: hidden;
  border-right: clamp(2px,.25vw,5px) solid rgba(23,27,18,.16);
  background:
    linear-gradient(90deg, rgba(23,27,18,.12), transparent 13% 87%, rgba(23,27,18,.12)),
    linear-gradient(180deg, #e8eadf, #fff 20% 80%, #e0e4d5);
  box-shadow: inset 0 0 24px rgba(23,27,18,.08);
}
.travel-slot-reel:last-child { border-right: 0; }
.travel-slot-track { top: calc(50% - 264px); --cycle-offset-active: var(--cycle-offset-desktop); }
.travel-slot-symbol { height: var(--cell-h); }
.travel-slot-sprite-frame {
  position: relative;
  width: clamp(126px, 12vw, 178px);
  aspect-ratio: 384 / 341;
  overflow: hidden;
  border-radius: clamp(14px,1.4vw,22px);
  display: grid;
  place-items: center;
  contain: paint;
}
.travel-slot-sprite {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: inherit;
  object-fit: contain;
  object-position: center;
  filter: drop-shadow(0 10px 8px rgba(23,27,18,.2));
}
.travel-slot-reel-glass {
  background:
    linear-gradient(180deg, rgba(23,27,18,.48), transparent 21% 78%, rgba(23,27,18,.42)),
    linear-gradient(105deg, rgba(255,255,255,.48), transparent 22% 69%, rgba(255,255,255,.22));
  mix-blend-mode: multiply;
}
.travel-slot-payline {
  height: 2px;
  opacity: .22;
  background: #c9ff62;
  box-shadow: 0 0 14px rgba(201,255,98,.7);
}
.travel-slot-pointer {
  top: 50%;
  color: #c9ff62;
  font-size: clamp(20px,2.4vw,38px);
  text-shadow: 0 0 18px rgba(201,255,98,.72), 0 2px 0 #171b12;
}
.travel-slot-pointer-left { left: -.2%; }
.travel-slot-pointer-right { right: -.2%; }
.stage-revealed .travel-slot-window {
  box-shadow:
    0 0 26px rgba(201,255,98,.95),
    0 0 68px rgba(105,207,255,.78),
    inset 0 0 34px rgba(255,255,255,.72);
  animation: travelSlotScreenWake .7s cubic-bezier(.16,1,.3,1) both;
}
.travel-slot-result {
  position: absolute;
  inset: 0;
  z-index: 12;
  display: grid;
  grid-template-columns: minmax(150px, .68fr) minmax(0, 1.32fr);
  gap: clamp(16px,1.8vw,30px);
  padding: clamp(18px,2vw,32px);
  color: #f8fff0;
  background:
    radial-gradient(circle at 15% 18%, rgba(201,255,98,.3), transparent 35%),
    linear-gradient(125deg, rgba(17,29,14,.97), rgba(29,55,32,.96) 52%, rgba(26,70,77,.96));
  opacity: 0;
  animation: travelSlotResultIn .72s .3s cubic-bezier(.16,1,.3,1) forwards;
}
.travel-slot-result::before {
  content: '';
  position: absolute;
  inset: -30%;
  z-index: 4;
  pointer-events: none;
  background: radial-gradient(circle, rgba(255,255,255,.98), rgba(201,255,98,.55) 28%, transparent 62%);
  animation: travelSlotResultFlash .72s ease-out both;
}
.travel-slot-result-media {
  position: relative;
  z-index: 2;
  min-width: 0;
  overflow: hidden;
  border: 2px solid rgba(226,255,173,.56);
  border-radius: clamp(14px,1.5vw,24px);
  background: linear-gradient(145deg, #c9ff62, #76bce3);
  box-shadow: 0 15px 30px rgba(0,0,0,.28), inset 0 0 18px rgba(255,255,255,.28);
}
.travel-slot-result-media img { width: 100%; height: 100%; display: block; object-fit: cover; }
.travel-slot-result-media > span { width: 100%; height: 100%; display: grid; place-items: center; font-size: clamp(44px,6vw,88px); }
.travel-slot-result-copy {
  position: relative;
  z-index: 2;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}
.travel-slot-result-badge {
  max-width: 100%;
  margin-bottom: clamp(7px,.9vh,12px);
  padding: 5px 11px;
  overflow: hidden;
  border: 1px solid rgba(217,255,104,.55);
  border-radius: 999px;
  color: #d9ff68;
  background: rgba(201,255,98,.12);
  font-size: clamp(10px,.9vw,14px);
  font-weight: 900;
  letter-spacing: .06em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.travel-slot-result h1 {
  max-width: 100%;
  margin: 0 0 clamp(7px,.9vh,12px);
  overflow: hidden;
  color: #fff;
  font-size: clamp(27px,2.8vw,48px);
  font-weight: 1000;
  line-height: 1.04;
  letter-spacing: -.03em;
  text-wrap: balance;
  text-shadow: 0 3px 16px rgba(0,0,0,.35);
}
.travel-slot-result p {
  display: -webkit-box;
  max-width: 100%;
  margin: 0 0 clamp(10px,1.2vh,16px);
  overflow: hidden;
  color: rgba(244,255,236,.82);
  font-size: clamp(12px,1.05vw,16px);
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.travel-slot-result-meta { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: clamp(11px,1.4vh,18px); }
.travel-slot-result-meta span {
  padding: 5px 10px;
  border-radius: 10px;
  color: rgba(255,255,255,.88);
  background: rgba(255,255,255,.1);
  font-size: clamp(10px,.82vw,13px);
  line-height: 1;
}
.travel-slot-result-actions { display: flex; gap: 8px; width: 100%; }
.travel-slot-result-actions button {
  min-width: 0;
  min-height: 38px;
  padding: 9px 14px;
  border: 1px solid rgba(217,255,104,.46);
  border-radius: 10px;
  color: #f5ffe8;
  background: rgba(201,255,98,.12);
  font: inherit;
  font-size: clamp(10px,.88vw,14px);
  font-weight: 900;
  cursor: pointer;
}
.travel-slot-result-actions button:last-child { color: #263816; background: #d9ff68; }
.travel-slot-result-actions button:disabled { opacity: .48; cursor: default; }
.travel-slot-lever {
  position: absolute;
  right: 5.1%;
  top: calc(16.5% - 54px);
  z-index: 8;
  width: 10.8%;
  height: 55%;
  opacity: 1;
  overflow: visible;
  transform: none;
}
.travel-slot-lever-ball,
.travel-slot-lever-stick,
.travel-slot-lever-base { display: none; }
.travel-slot-lever-art {
  position: absolute;
  inset: 0;
  z-index: 7;
  width: 100%;
  height: 100%;
  pointer-events: none;
  will-change: transform;
}
.travel-slot-lever-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: fill;
  pointer-events: none;
}
.travel-slot-lever-art-landscape { --lever-scale: .63; --lever-shift-x: calc(.4vw - 1px); --lever-lift: calc(-11.5vh - 54px); transform: translate(var(--lever-shift-x), var(--lever-lift)) scale(var(--lever-scale)); transform-origin: 87.75% 60%; }
.travel-slot-lever-art-portrait { --lever-scale: .78; --lever-shift-x: 0vw; --lever-lift: -10.4vh; display: none; transform: translate(var(--lever-shift-x), var(--lever-lift)) scale(var(--lever-scale)); transform-origin: 91.8% 55.2%; }
.travel-slot-lever-complete-art {
  z-index: 1;
  opacity: 1;
  mix-blend-mode: normal;
  filter: none;
}
.travel-slot-lever-logo {
  position: absolute;
  left: 81.87%;
  top: 56.7%;
  z-index: 6;
  width: 11.3%;
  height: 20.1%;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  pointer-events: none;
}
.travel-slot-lever-logo img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center;
}
.is-lever-pulling .travel-slot-lever-art { animation: travelSlotLeverAssemblyPhysics 1.48s cubic-bezier(.2,.72,.2,1) both; }
.travel-slot-machine > .travel-slot-lever-art { z-index: 7; }
.travel-slot-controls {
  position: absolute;
  inset: 0;
  z-index: 5;
  width: 100%;
  height: 100%;
  min-height: 0;
  margin: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  display: block;
  pointer-events: none;
}
.travel-slot-main-button {
  position: absolute;
  left: 36.8%;
  top: 79.5%;
  z-index: 8;
  width: 26.4%;
  height: 15.5%;
  border: 0;
  border-radius: 28%;
  color: #171b12;
  background: transparent;
  box-shadow: none;
  padding: 0;
  display: grid;
  place-items: center;
  font-size: clamp(22px,2.2vw,38px);
  font-weight: 950;
  pointer-events: auto;
  text-shadow: 0 1px rgba(255,255,255,.52);
}
.travel-slot-main-button::after {
  content: '';
  position: absolute;
  inset: 7%;
  border-radius: 24%;
  opacity: 0;
  box-shadow: 0 0 35px rgba(201,255,98,.85), inset 0 0 24px rgba(255,255,255,.46);
  transition: opacity .2s;
}
.travel-slot-main-button:active:not(:disabled) { transform: translateY(5px) scale(.98); box-shadow: none; }
.travel-slot-orb { display: none; }
.travel-slot-status {
  left: 5.8%;
  bottom: 3.4%;
  gap: 8px;
}
.travel-slot-status i { background: #78806e; }
.travel-slot-status i.is-live { background: #c9ff62; box-shadow: 0 0 12px #c9ff62; }
.travel-slot-status .ant-typography { color: rgba(23,27,18,.7); font-size: clamp(8px,.72vw,12px); }
.travel-slot-summary-inline { right: 5.7%; bottom: 3.4%; color: rgba(23,27,18,.56) !important; }
.travel-slot-confetti { position: absolute; inset: 0; opacity: 0; }
.travel-slot-win-flash,
.travel-slot-speed-vignette {
  position: absolute;
  inset: 0;
  z-index: 7;
  opacity: 0;
  pointer-events: none;
}
.travel-slot-win-flash {
  background: radial-gradient(ellipse at 50% 50%, rgba(255,255,255,.9), rgba(201,255,98,.52) 20%, transparent 55%);
  mix-blend-mode: screen;
}
.travel-slot-speed-vignette {
  background: repeating-linear-gradient(90deg, transparent 0 5%, rgba(142,200,255,.12) 5.3%, transparent 5.7% 11%);
  mask-image: radial-gradient(ellipse at 50% 50%, #000 10%, transparent 67%);
}
.travel-slot-reel.is-spinning .travel-slot-track {
  animation: travelSlotReelSpinV2 var(--reel-duration) linear infinite;
  filter: blur(7px) saturate(1.25) brightness(1.08);
}
.stage-idle .travel-slot-track {
  animation: travelSlotReelIdle var(--reel-idle-duration) linear infinite;
  animation-delay: var(--reel-delay);
  filter: saturate(1.03) brightness(1.02);
}
.stage-idle .travel-slot-sprite-frame { animation: travelSlotIconFloat 2.8s ease-in-out infinite alternate; }
.stage-idle .travel-slot-shell-image { animation: travelSlotIdleBreath 3.6s ease-in-out infinite alternate; }
.stage-idle .travel-slot-marquee::after { animation: travelSlotDisplaySweep 2.8s ease-in-out infinite; }
.stage-launching .travel-slot-track {
  animation: travelSlotReelIdle 4.2s linear infinite;
  animation-delay: var(--reel-delay);
  filter: blur(3px) saturate(1.15) brightness(1.08);
}
.travel-slot-reel.is-stopped .travel-slot-track {
  transform: translateY(var(--stop-offset));
  transition: transform 1.08s cubic-bezier(.08,.82,.2,1.12), filter .24s ease-out;
  animation: none;
}
.stage-launching .travel-slot-machine { animation: travelSlotChargeV2 .42s cubic-bezier(.2,.8,.2,1) both; }
.stage-launching .travel-slot-main-button { transform: translateY(6px) scale(.975); filter: brightness(1.08); }
.stage-launching .travel-slot-main-button::after,
.stage-spinning .travel-slot-main-button::after,
.stage-settling .travel-slot-main-button::after { opacity: 1; }
.stage-launching .travel-slot-marquee::after { animation: travelSlotDisplaySweep .42s ease-out both; }
.stage-spinning .travel-slot-shell-image { animation: travelSlotCabinetHum .11s linear infinite alternate; }
.stage-spinning .travel-slot-speed-vignette { animation: travelSlotSpeedPulse .48s ease-in-out infinite alternate; }
.stage-spinning .travel-slot-window { box-shadow: inset 0 20px 32px rgba(23,27,18,.25), inset 0 -18px 30px rgba(23,27,18,.22), 0 0 28px rgba(142,200,255,.3); }
.stage-settling .travel-slot-machine { animation: travelSlotBrakeHit .56s ease-out infinite; }
.stage-settling .travel-slot-marquee::after { animation: travelSlotDisplaySweep .52s ease-out infinite; }
.stage-revealed .travel-slot-machine { animation: travelSlotWinV2 1s cubic-bezier(.16,1,.3,1) both; }
.stage-revealed .travel-slot-win-flash { animation: travelSlotWinFlash .9s ease-out both; }
.stage-revealed .travel-slot-marquee { filter: brightness(1.18) drop-shadow(0 0 18px rgba(142,200,255,.7)); }
.stage-revealed .travel-slot-confetti { opacity: 1; animation: travelSlotConfettiBurst 1s ease-out both; }
@keyframes travelSlotReelSpinV2 { from { transform: translateY(0); } to { transform: translateY(var(--cycle-offset-active)); } }
@keyframes travelSlotReelIdle { from { transform: translateY(0); } to { transform: translateY(var(--cycle-offset-active)); } }
@keyframes travelSlotIconFloat { from { transform: translateY(-3px); } to { transform: translateY(3px); } }
@keyframes travelSlotIdleBreath { from { filter: brightness(1) saturate(1); } to { filter: brightness(1.035) saturate(1.04); } }
@keyframes travelSlotTitleIn { from { opacity: 0; transform: translateY(8px) scale(.92); filter: blur(5px); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes travelSlotMatrixIn { from { opacity: 0; transform: scaleX(.7); } to { opacity: 1; transform: scaleX(1); } }
@keyframes travelSlotPip { 0%,35% { opacity: .3; transform: scale(.8); } 36%,100% { opacity: 1; transform: scale(1); background: #c9ff62; } }
@keyframes travelSlotChargeV2 {
  0% { transform: scale(1); filter: brightness(1); }
  48% { transform: scale(.992); filter: brightness(.94) saturate(.92); }
  72% { transform: scale(1.006); filter: brightness(1.13) saturate(1.12); }
  100% { transform: scale(1); filter: brightness(1.04); }
}
@keyframes travelSlotDisplaySweep { from { transform: translateX(-130%); } to { transform: translateX(130%); } }
@keyframes travelSlotFaceGlow { from { opacity: .78; filter: brightness(.9); } to { opacity: 1; filter: brightness(1.18); } }
@keyframes travelSlotLeverAssemblyPhysics {
  0% { transform: translate(var(--lever-shift-x), var(--lever-lift)) rotate(0deg) scale(var(--lever-scale)); }
  36%, 54% { transform: translate(var(--lever-shift-x), calc(var(--lever-lift) + 1.8vh)) rotate(12deg) scale(var(--lever-scale)); }
  74% { transform: translate(var(--lever-shift-x), calc(var(--lever-lift) - .45vh)) rotate(-2deg) scale(var(--lever-scale)); }
  86% { transform: translate(var(--lever-shift-x), calc(var(--lever-lift) + .2vh)) rotate(.8deg) scale(var(--lever-scale)); }
  94% { transform: translate(var(--lever-shift-x), calc(var(--lever-lift) - .08vh)) rotate(-.3deg) scale(var(--lever-scale)); }
  100% { transform: translate(var(--lever-shift-x), var(--lever-lift)) rotate(0deg) scale(var(--lever-scale)); }
}
@keyframes travelSlotCabinetHum { from { transform: translateX(-.55px); } to { transform: translateX(.55px); } }
@keyframes travelSlotSpeedPulse { from { opacity: .22; transform: scaleX(.96); } to { opacity: .68; transform: scaleX(1.03); } }
@keyframes travelSlotBrakeHit {
  0%,100% { transform: translate(0); }
  22% { transform: translate(-1.5px,.5px); }
  44% { transform: translate(1.5px,-.5px); }
}
@keyframes travelSlotWinV2 {
  0% { transform: scale(.994); filter: brightness(1); }
  30% { transform: scale(1.012); filter: brightness(1.2) saturate(1.16); }
  58% { transform: scale(.998); }
  100% { transform: scale(1); filter: brightness(1.06); }
}
@keyframes travelSlotWinFlash { 0% { opacity: 0; transform: scale(.4); } 24% { opacity: .9; } 100% { opacity: 0; transform: scale(1.45); } }
@keyframes travelSlotScreenWake {
  0% { filter: brightness(1); transform: scale(1); }
  24% { filter: brightness(2.2) saturate(1.35); transform: scale(1.012); }
  58% { filter: brightness(1.35) saturate(1.12); transform: scale(.998); }
  100% { filter: brightness(1.08); transform: scale(1); }
}
@keyframes travelSlotResultFlash {
  0% { opacity: 0; transform: scale(.35); }
  28% { opacity: 1; }
  100% { opacity: 0; transform: scale(1.6); }
}
@keyframes travelSlotResultIn {
  from { opacity: 0; transform: scale(.94); filter: blur(8px) brightness(1.7); }
  to { opacity: 1; transform: scale(1); filter: blur(0) brightness(1); }
}
@keyframes travelSlotConfettiBurst { from { transform: translateY(24px) scale(.6); filter: brightness(1.4); } to { transform: translateY(-35px) scale(1); filter: brightness(1); } }
@media (max-aspect-ratio: 4/3) {
  .travel-slot-shell-landscape { display: none; }
  .travel-slot-shell-portrait { display: block; }
  .travel-slot-lever-art-landscape { display: none; }
  .travel-slot-lever-art-portrait { display: block; }
  .travel-slot-lever-depth-landscape { display: none; }
  .travel-slot-lever-depth-portrait { display: block; }
  .travel-slot-pixel-panel-art { left: 3.1%; top: 37.3%; width: 15%; height: 11%; }
  .travel-slot-back.ant-btn { left: 2.2%; top: 1.2%; width: 38px; height: 38px; padding: 0; border-radius: 50%; font-size: 0; }
  .travel-slot-marquee { left: 25%; top: 10.1%; width: 50%; height: 5.6%; padding: 0 7%; }
  .travel-slot-matrix-title { left: 2%; top: 13%; width: 96%; height: 82%; }
  .travel-slot-display-pips { display: none; }
  .travel-slot-window { left: 18.4%; top: 22.6%; width: 63.5%; height: 45.8%; border-radius: clamp(18px,5vw,30px); }
  .travel-slot-result { display: block; padding: 12px; }
  .travel-slot-result-media { position: absolute; inset: 0; border: 0; border-radius: 0; opacity: .5; }
  .travel-slot-result-media::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,25,17,.18), rgba(10,25,17,.92) 62%); }
  .travel-slot-result-copy { height: 100%; justify-content: flex-end; align-items: center; text-align: center; }
  .travel-slot-result-badge { margin-bottom: 5px; }
  .travel-slot-result h1 { margin-bottom: 5px; font-size: clamp(17px,5vw,24px); }
  .travel-slot-result p { display: none; }
  .travel-slot-result-meta { justify-content: center; margin-bottom: 7px; }
  .travel-slot-result-meta span:nth-child(n+2) { display: none; }
  .travel-slot-result-actions { justify-content: center; gap: 5px; }
  .travel-slot-result-actions button { padding: 6px 8px; font-size: clamp(8px,2.4vw,11px); }
  .travel-slot-reel { --cell-h: 118px; }
  .travel-slot-track { top: calc(50% - 177px); --cycle-offset-active: var(--cycle-offset-portrait); }
  .travel-slot-reel.is-stopped .travel-slot-track { transform: translateY(var(--stop-offset-portrait)); }
  .travel-slot-sprite-frame { width: min(92%, 108px); }
  .travel-slot-pointer-left { left: -.8%; }
  .travel-slot-pointer-right { right: -.8%; }
  .travel-slot-lever-logo { left: 80.9%; top: 59.2%; width: 15%; height: 11%; }
  .travel-slot-lever { right: 3%; top: 21.1%; width: 13%; height: 45%; }
  .travel-slot-main-button { left: 61.2%; top: 72.1%; width: 24%; height: 10.2%; font-size: clamp(20px,5.6vw,25px); }
  .travel-slot-status { left: 5%; bottom: 2.5%; }
  .travel-slot-summary-inline { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .stage-spinning .travel-slot-shell-image,
  .stage-spinning .travel-slot-speed-vignette,
  .stage-settling .travel-slot-machine,
  .stage-idle .travel-slot-track,
  .stage-idle .travel-slot-sprite,
  .stage-idle .travel-slot-shell-image,
  .stage-idle .travel-slot-marquee::after,
  .is-lever-pulling .travel-slot-lever-art { animation: none; }
  .travel-slot-reel.is-spinning .travel-slot-track { filter: blur(2px); animation-duration: 3.8s; }
}
`;
