import { type Href, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

export default function PcLandingScreen() {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type !== 'gravity-home:navigate') return;
      const href = event.data.href;
      if (typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//')) return;
      router.push(href as Href);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  return (
    <iframe
      ref={iframeRef}
      aria-label="粗去玩鸭周末灵感首页"
      src="/gravity-home/index.html"
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
