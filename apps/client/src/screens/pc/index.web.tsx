import { type Href, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { PcQuickDrawModal, type QuickDrawSubmission } from '@/components/pc-quick-draw-modal';
import { useApp } from '@/contexts/app-context';
import { savePendingPcBoxDraw } from '@/lib/pc-box-open-state';
import { addTodo, getRecommendedActivities } from '@/services/api';

export default function PcLandingScreen() {
  const router = useRouter();
  const { isRegistered, user } = useApp();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [quickDrawLock, setQuickDrawLock] = useState<{ cityId: number; cityName: string; categoryLabel?: string } | null>(null);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
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
        const resolvedTitle = activity?.title ?? '这套攻略';
        if (!resolvedActivityId) throw new Error('这一组攻略暂时没有可加入的玩法，请换一批再试。');
        if (actionType === 'gravity-home:open-guide') {
          router.push(`/activity/${resolvedActivityId}` as Href);
          return;
        }
        const added = await addTodo({ userId: user?.id, activityId: resolvedActivityId });
        iframeRef.current?.contentWindow?.postMessage({
          type: 'gravity-home:add-trip-status',
          status: 'success',
          alreadyExists: added.alreadyExists,
          title: resolvedTitle,
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
  }, [router, user?.id]);

  const startQuickDraw = ({ preferences, summary }: QuickDrawSubmission) => {
    if (!quickDrawLock) return;
    if (!savePendingPcBoxDraw({ cityId: quickDrawLock.cityId, preferences, summary })) return;
    setQuickDrawLock(null);
    router.push('/box/slot-preview');
  };

  return <>
    <iframe
      className="mobile-home-frame"
      ref={iframeRef}
      allow="geolocation"
      aria-label="粗去玩鸭周末灵感首页"
      src={`/gravity-home/index.html?v=auth-cta-76&auth=${isRegistered ? 'registered' : 'guest'}`}
      style={{
        width: '100%',
        height: '100dvh',
        display: 'block',
        border: 0,
        background: '#0d0d13',
      }}
      title="粗去玩鸭周末灵感首页"
    />
    <PcQuickDrawModal lock={quickDrawLock} open={Boolean(quickDrawLock)} onClose={() => setQuickDrawLock(null)} onSubmit={startQuickDraw} />
  </>;
}
