import { type Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { PcQuickDrawModal, type QuickDrawSubmission } from '@/components/pc-quick-draw-modal';
import { useApp } from '@/contexts/app-context';
import { savePendingPcBoxDraw } from '@/lib/pc-box-open-state';
import { getRecommendedActivities } from '@/services/api';

const MOBILE_BREAKPOINT = 760;
const DESKTOP_CANVAS_WIDTH = 1280;
const DESKTOP_CONTENT_HEIGHT = 636;

function useViewportLayout() {
  const [layout, setLayout] = useState(() => {
    const width = typeof window === 'undefined' ? DESKTOP_CANVAS_WIDTH : window.innerWidth;
    const height = typeof window === 'undefined' ? 720 : window.innerHeight;
    const isMobile = width <= MOBILE_BREAKPOINT;
    const headerHeight = isMobile ? 0 : Math.min(104, Math.max(84, width * .052));
    return {
      isMobile,
      headerHeight,
      scale: isMobile ? 1 : Math.min(width / DESKTOP_CANVAS_WIDTH, (height - headerHeight) / DESKTOP_CONTENT_HEIGHT),
    };
  });

  useEffect(() => {
    const update = () => {
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
      const headerHeight = isMobile ? 0 : Math.min(104, Math.max(84, window.innerWidth * .052));
      setLayout({
        isMobile,
        headerHeight,
        scale: isMobile ? 1 : Math.min(window.innerWidth / DESKTOP_CANVAS_WIDTH, (window.innerHeight - headerHeight) / DESKTOP_CONTENT_HEIGHT),
      });
    };
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  return layout;
}

export default function PcLandingScreen() {
  const router = useRouter();
  const { cities, isRegistered, selectedCityId, user, setSelectedCityId } = useApp();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [quickDrawLock, setQuickDrawLock] = useState<{ cityId: number; cityName: string; categoryLabel?: string } | null>(null);
  const { headerHeight, isMobile, scale } = useViewportLayout();

  const syncCitiesToHome = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({
      type: 'gravity-home:cities',
      cities: cities.map(({ id, name }) => ({ id, name })),
      selectedCityName: cities.find((city) => city.id === selectedCityId)?.name,
    }, window.location.origin);
  }, [cities, selectedCityId]);

  useEffect(() => {
    syncCitiesToHome();
  }, [syncCitiesToHome]);

  useEffect(() => {
    const previousOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    window.scrollTo(0, 0);
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === 'gravity-home:city-selected') {
        const id = Number(event.data.cityId);
        if (Number.isInteger(id) && id > 0) setSelectedCityId(id);
        return;
      }
      if (event.data?.type === 'gravity-home:navigate') {
        const href = event.data.href;
        if (typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//')) return;
        router.push(href as Href);
        return;
      }
      if (event.data?.type === 'gravity-home:open-quick-draw') {
        const cityId = Number(event.data.cityId);
        const cityName = typeof event.data.cityName === 'string' ? event.data.cityName : '北京';
        const categoryLabel = typeof event.data.categoryLabel === 'string' ? event.data.categoryLabel : undefined;
        if (Number.isFinite(cityId)) setQuickDrawLock({ cityId, cityName, categoryLabel });
        return;
      }
      if (event.data?.type === 'gravity-home:request-guides') {
        const cityId = Number(event.data.cityId);
        const offset = Number(event.data.offset) || 0;
        if (!Number.isFinite(cityId)) return;
        try {
          const recommendations = await getRecommendedActivities({ cityId, sourceType: 'itinerary_workbook', limit: 4, offset });
          iframeRef.current?.contentWindow?.postMessage({
            type: 'gravity-home:guides',
            cityId,
            items: recommendations.items,
          }, window.location.origin);
        } catch (reason) {
          iframeRef.current?.contentWindow?.postMessage({
            type: 'gravity-home:guides-error',
            message: reason instanceof Error ? reason.message : '攻略加载失败',
          }, window.location.origin);
        }
        return;
      }
      const actionType = event.data?.type;
      if (actionType !== 'gravity-home:add-trip' && actionType !== 'gravity-home:open-guide') return;
      const cityId = Number(event.data.cityId);
      const channel = typeof event.data.channel === 'string' ? event.data.channel : undefined;
      const offset = Number(event.data.offset) || 0;
      const activityId = Number(event.data.activityId);
      if (!Number.isFinite(cityId)) return;
      if (actionType === 'gravity-home:add-trip') {
        iframeRef.current?.contentWindow?.postMessage({ type: 'gravity-home:add-trip-status', status: 'loading' }, window.location.origin);
      }
      try {
        const recommendations = Number.isFinite(activityId)
          ? null
          : await getRecommendedActivities({ cityId, channel, sourceType: 'itinerary_workbook', limit: 1, offset });
        const activity = recommendations?.items[0];
        const resolvedActivityId = Number.isFinite(activityId) ? activityId : activity?.id;
        if (!resolvedActivityId) throw new Error('这一组攻略暂时没有可加入的玩法，请换一批再试。');
        if (actionType === 'gravity-home:open-guide') {
          router.push(`/activity/${resolvedActivityId}` as Href);
          return;
        }
        router.push(`/activity/${resolvedActivityId}?intent=schedule` as Href);
        iframeRef.current?.contentWindow?.postMessage({
          type: 'gravity-home:add-trip-status',
          status: 'cancelled',
        }, window.location.origin);
      } catch (reason) {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'gravity-home:add-trip-status',
          status: 'error',
          message: reason instanceof Error ? reason.message : '加入行程失败，请稍后再试。',
        }, window.location.origin);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router, user?.id, setSelectedCityId]);

  const startQuickDraw = ({ preferences, summary }: QuickDrawSubmission) => {
    if (!quickDrawLock) return;
    if (!savePendingPcBoxDraw({ cityId: quickDrawLock.cityId, preferences, summary })) return;
    setQuickDrawLock(null);
    router.push('/box/slot-preview');
  };

  return <>
    <div style={isMobile ? { position: 'fixed', inset: 0, width: '100dvw', height: '100dvh', overflow: 'hidden', background: '#0d0d13' } : { position: 'relative', width: '100%', height: `calc(100dvh - ${headerHeight}px)`, overflow: 'hidden', background: '#0d0d13' }}>
      <iframe
        className="mobile-home-frame"
        ref={iframeRef}
        onLoad={syncCitiesToHome}
        allow="geolocation"
        aria-label="粗去玩鸭周末灵感首页"
        src={`/gravity-home/index.html?v=${isMobile ? 'mobile-layout-v8' : 'desktop-shared-nav-v1'}&auth=${isRegistered ? 'registered' : 'guest'}${isMobile ? '' : '&externalNav=1'}`}
        style={isMobile ? {
          width: '100%',
          height: '100dvh',
          display: 'block',
          border: 0,
          background: '#0d0d13',
        } : {
          position: 'absolute',
          left: `calc(50% - ${(DESKTOP_CANVAS_WIDTH * scale) / 2}px)`,
          top: 0,
          width: DESKTOP_CANVAS_WIDTH,
          height: DESKTOP_CONTENT_HEIGHT,
          display: 'block',
          border: 0,
          background: '#0d0d13',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        title="粗去玩鸭周末灵感首页"
      />
    </div>
    <PcQuickDrawModal lock={quickDrawLock} open={Boolean(quickDrawLock)} onClose={() => setQuickDrawLock(null)} onSubmit={startQuickDraw} />
  </>;
}
