export default function PcLandingScreen() {
  return (
    <iframe
      aria-label="粗去玩鸭周末灵感首页"
      src="/gravity-home/index.html?embedded=1"
      style={{
        width: '100%',
        height: 'calc(100dvh - clamp(84px, 5.2vw, 104px))',
        display: 'block',
        border: 0,
        background: '#0d0d13',
      }}
      title="粗去玩鸭周末灵感首页"
    />
  );
}
