import { useEffect, useRef } from 'react';
import { createGachaWorld, projectGachaBody } from '@/lib/gacha-physics';
import './mobile-gacha-machine.css';

// Includes motor slowdown, the drop, a rebound, and a short highlight hold.
export const GACHA_REVEAL_MS = 2_450;

export type GachaStage = 'idle' | 'launching' | 'spinning' | 'settling' | 'revealed' | 'error';
const ballNames = [
  ['city', ['01-长城烽火台','02-西湖石桥','03-张家界峰林','04-桂林竹筏','05-故宫角楼','06-九寨沟瀑布','07-青岛海岸','08-重庆轻轨','09-上海天际线','10-西安钟楼','11-哈尔滨冰堡','12-大理洱海']],
  ['play', ['01-森林温泉','02-雪山木屋','03-沙漠营地','04-茶园梯田','05-金色稻田','06-缤纷夜市','07-当代美术馆','08-海底隧道','09-草原越野','10-海边冲浪','11-湖畔骑行','12-灯笼古街']],
  ['nature', ['01-薰衣草风车','02-峡谷玻璃桥','03-湖面皮划艇','04-热带珊瑚岛','05-发光溶洞','06-樱花山地火车','07-向日葵农场','08-山顶天文台','09-原始森林','10-火山湖','11-海岸悬崖','12-高山木屋']],
] as const;
const balls = ballNames.flatMap(([category, names]) => names.map((name) => ({category, src: `/gravity-home/assets/icons/${category}/${name}.avif`} )));
const chamberBalls = balls;

function BallPool({ stage }: { stage: GachaStage }) {
  const poolRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<ReturnType<typeof createGachaWorld> | null>(null);
  useEffect(() => {
    const pool = poolRef.current;
    if (!pool) return;
    const world = worldRef.current ?? (worldRef.current = createGachaWorld(chamberBalls.length));
    const nodes = [...pool.querySelectorAll<HTMLElement>('.gacha-ball')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stirring = !reduced && (stage === 'launching' || stage === 'spinning');
    world.bodies.forEach((b, i) => {
      const projected = projectGachaBody(b, world);
      nodes[i].style.width = `${projected.r * 2 / world.width * 100}%`;
      nodes[i].style.zIndex = String(projected.layer);
    });
    const paint = () => world.bodies.forEach((b, i) => {
      const node = nodes[i];
      const projected = projectGachaBody(b, world);
      node.style.left = `${projected.x / world.width * 100}%`;
      node.style.top = `${projected.y / world.height * 100}%`;
      node.style.transform = 'translate(-50%, -50%)';
      // The 3D landmark stays readable inside the clear shell; it only rocks
      // slightly as the sphere tumbles instead of spinning like a flat sticker.
      node.style.setProperty('--ball-angle', `${Math.sin(b.angle) * .11}rad`);
    });
    paint();
    let frame = 0, last = 0, elapsed = 0;
    const tick = (now: number) => {
      const dt = Math.min(last ? (now - last) / 1000 : 1 / 60, 1 / 30);
      last = now;
      if (!document.hidden) {
        // Match the brisk cadence of the reference machine while keeping the
        // solver on small fixed-like substeps for stable collisions.
        const simulationDt = dt * (stirring ? 1.85 : 1.35);
        const steps = Math.ceil(simulationDt * 90);
        for (let step = 0; step < steps; step++) world.step(simulationDt / steps, stirring);
        paint(); elapsed += dt;
      }
      if (stirring || elapsed < 2.5) frame = requestAnimationFrame(tick);
    };
    if (!reduced && (stirring || stage === 'settling' || stage === 'error')) frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stage]);
  return <div className="gacha-pool" ref={poolRef} aria-hidden="true">
    {chamberBalls.map(({src, category}) => <span className="gacha-ball" data-category={category} key={src}>
      <img src={src} alt="" decoding="async" draggable={false} />
    </span>)}
  </div>;
}

export function MobileGachaMachine({ stage, ready, onStart, winnerSeed }: {
  stage: GachaStage; ready: boolean; onStart: () => void; winnerSeed: number;
}) {
  useEffect(() => {
    if (stage !== 'launching' && stage !== 'spinning' && stage !== 'settling') return;
    if (!('vibrate' in window.navigator) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const pulse = () => {
      if (stage === 'launching') window.navigator.vibrate?.([12, 34, 18]);
      else if (stage === 'spinning') window.navigator.vibrate?.(11);
      else window.navigator.vibrate?.([18, 42, 34]);
    };
    pulse();
    const timer = stage === 'spinning' ? window.setInterval(pulse, 520) : null;
    return () => {
      if (timer !== null) window.clearInterval(timer);
      window.navigator.vibrate?.(0);
    };
  }, [stage]);

  const busy = stage === 'launching' || stage === 'spinning' || stage === 'settling';
  const message = !ready ? 'LOADING' : stage === 'launching' ? 'START' : stage === 'spinning' ? 'ROLLING' : stage === 'settling' ? 'LUCKY!' : stage === 'error' ? 'RETRY' : 'READY';
  const winner = balls[Math.abs(winnerSeed) % balls.length];
  return <div className={`gacha-machine gacha-${stage}`}>
    <img className="gacha-shell" src="/media/ui/mobile-travel-gacha-v4-fullscreen.webp" alt="奶油白旅行扭蛋机" fetchPriority="high" draggable={false} />
    <div className="gacha-marquee-lights" aria-hidden="true">
      {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
    </div>
    <div className="gacha-console-lights gacha-console-lights-left" aria-hidden="true">{Array.from({ length: 3 }, (_, index) => <i key={index} />)}</div>
    <div className="gacha-console-lights gacha-console-lights-right" aria-hidden="true">{Array.from({ length: 3 }, (_, index) => <i key={index} />)}</div>
    <div className="gacha-display" role="status" aria-live="polite">{message}</div>
    <BallPool stage={stage} />
    <div className="gacha-glass" aria-hidden="true" />
    <button className="gacha-knob" type="button" disabled={!ready || busy} aria-label={stage === 'error' ? '重新转动旋钮抽取' : '转动旋钮，抽取旅行方案'} onClick={onStart}>
      <span className="gacha-knob-face" aria-hidden="true"><i /></span>
    </button>
    <span className="gacha-knob-mark" aria-hidden="true">↻</span>
    <div className="gacha-output" aria-hidden="true"><span className="gacha-ball gacha-prize" data-category={winner.category}><img src={winner.src} alt="" /></span></div>
  </div>;
}
