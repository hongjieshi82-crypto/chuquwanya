import { type Href, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useApp } from '@/contexts/app-context';
import { addTodo, getRecommendedActivities } from '@/services/api';

export default function PcLandingScreen() {
  const router = useRouter();
  const { user } = useApp();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === 'gravity-home:navigate') {
        const href = event.data.href;
        if (typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//')) return;
        router.push(href as Href);
        return;
      }
      const actionType = event.data?.type;
      if (actionType !== 'gravity-home:add-trip' && actionType !== 'gravity-home:open-guide') return;
      const cityId = Number(event.data.cityId);
      const channel = typeof event.data.channel === 'string' ? event.data.channel : undefined;
      const offset = Number(event.data.offset) || 0;
      if (!Number.isFinite(cityId)) return;
      if (actionType === 'gravity-home:add-trip') {
        iframeRef.current?.contentWindow?.postMessage({ type: 'gravity-home:add-trip-status', status: 'loading' }, window.location.origin);
      }
      try {
        const recommendations = await getRecommendedActivities({ cityId, channel, sourceType: 'itinerary_workbook', limit: 1, offset });
        const activity = recommendations.items[0];
        if (!activity) throw new Error('这一组攻略暂时没有可加入的玩法，请换一批再试。');
        if (actionType === 'gravity-home:open-guide') {
          router.push(`/activity/${activity.id}?source=ai` as Href);
          return;
        }
        const added = await addTodo({ userId: user?.id, activityId: activity.id });
        iframeRef.current?.contentWindow?.postMessage({
          type: 'gravity-home:add-trip-status',
          status: 'success',
          alreadyExists: added.alreadyExists,
          title: activity.title,
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

  return (
    <iframe
      ref={iframeRef}
      allow="geolocation"
      aria-label="粗去玩鸭周末灵感首页"
      src="/gravity-home/index.html?v=guide-detail-link-68"
      style={{
        width: '100%',
        height: '100dvh',
        display: 'block',
        border: 0,
        background: '#0d0d13',
      }}
      title="粗去玩鸭周末灵感首页"
    />
  );
}
