import { useEffect, useRef, useState } from 'react';
import { requestDeviceCurrentPosition } from '@/lib/device-location';
import { nearbyCategoryPreset } from '@/lib/web-draw-flow';

type Preferences = { availableMinutes: number; partySize: number; budget: number; mood: string; kind: string; maxWalkMinutes: number; allowUnverified: boolean };
type Result = {
  status: 'ready' | 'conditional' | 'no_match'; city: string; generatedAt: string; expiresAt?: string;
  message?: string; generation?: 'ai' | 'rules'; excluded: Record<string, number>;
  weather: { condition: string; temperature: number | null; observedAt: string } | null;
  warnings?: string[];
  plan?: {
    title: string; place: { id: string; name: string; address: string; photoUrl: string | null; sourceUrl: string; openingToday: string | null; phone: string | null };
    playIdeas: string[];
    timeline: { phase: string; label: string; startsAt: string; endsAt: string; minutes: number }[];
    totalMinutes: number; bufferMinutes: number; walkingMeters: number; navigationUrl: string;
    budget: { capPerPersonYuan: number; referencePerPersonYuan: number | null; reservePerPersonYuan: number | null; groupReferenceYuan: number | null };
  };
};
const initialPreferences: Preferences = { availableMinutes: 120, partySize: 2, budget: 100, mood: '放松', kind: 'any', maxWalkMinutes: 20, allowUnverified: false };
const clockLabel = (iso: string) => new Date(iso).toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false });
const timelineClock = (iso: string, reference: string) => {
  const day = (value: string) => Math.floor((Date.parse(value) + 8 * 3600_000) / 86400_000);
  return `${day(iso) > day(reference) ? '次日 ' : ''}${clockLabel(iso)}`;
};

export function NearbyPlanPanel({ initialCategory }: { initialCategory?: string } = {}) {
  const [preferences, setPreferences] = useState(() => ({ ...initialPreferences, ...nearbyCategoryPreset(initialCategory) }));
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'locating' | 'planning'>('idle');
  const [copied, setCopied] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [now, setNow] = useState(Date.now());
  const sequence = useRef(0);
  const request = useRef<AbortController | null>(null);
  const seen = useRef<string[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => { clearInterval(timer); sequence.current += 1; request.current?.abort(); };
  }, []);

  const change = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    sequence.current += 1;
    request.current?.abort();
    setPhase('idle'); setResult(null); setError(null); seen.current = [];
    setPreferences(current => ({ ...current, [key]: value }));
  };

  async function generate(another = false) {
    if (phase !== 'idle') return;
    if (!Number.isFinite(preferences.budget) || preferences.budget < 0 || preferences.budget > 2000) { setError('请输入 0–2000 元的人均预算。'); return; }
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!apiUrl) { setError('附近攻略服务暂未连接，请稍后重试。'); return; }
    const id = ++sequence.current;
    request.current?.abort();
    setError(null); setResult(null); setCopied(false); setPhotoFailed(false); setPhase('locating');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const coords = await requestDeviceCurrentPosition({ accuracy: 'high' });
      if (id !== sequence.current) return;
      if (coords.accuracy === null || coords.accuracy > 1000) throw new Error('当前位置精度不足，请开启手机精确定位后再试。');
      setPhase('planning');
      const controller = new AbortController(); request.current = controller;
      timer = setTimeout(() => controller.abort(), 45_000);
      const response = await fetch(`${apiUrl.replace(/\/$/, '')}/nearby/plan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude, accuracyMeters: coords.accuracy, locationTimestamp: Date.now(), coordinateSystem: 'wgs84', availableMinutes: preferences.availableMinutes, partySize: preferences.partySize, budgetPerPersonYuan: preferences.budget, mood: preferences.mood, kind: preferences.kind, maxWalkMinutes: preferences.maxWalkMinutes, allowUnverified: preferences.allowUnverified, excludePoiIds: another ? seen.current.slice(-20) : [] }),
      });
      const body = await response.json() as { data?: Result; error?: { message?: string } };
      if (id !== sequence.current) return;
      if (!response.ok || !body.data) throw new Error(body.error?.message || '暂时无法生成攻略，请重试。');
      setResult(body.data); setNow(Date.now());
      if (body.data.plan) {
        seen.current = [...seen.current, body.data.plan.place.id].slice(-20);
      }
    } catch (reason) {
      if (id === sequence.current) setError(reason instanceof Error && reason.name === 'AbortError' ? '查询超时，请重试；没有展示未经核实的攻略。' : reason instanceof Error ? reason.message : '生成失败，请重试。');
    } finally {
      if (timer) clearTimeout(timer);
      if (id === sequence.current) setPhase('idle');
    }
  }

  const plan = result?.plan;
  const expired = Boolean(result?.expiresAt && Date.parse(result.expiresAt) <= now);
  const choices = (label: string, key: 'availableMinutes' | 'mood' | 'kind' | 'maxWalkMinutes', options: Array<[string, string | number]>) => <fieldset className={`nearby-plan-field nearby-plan-field-${key}`}><legend>{label}</legend><div className="nearby-plan-options">{options.map(([title, value]) => <button type="button" key={value} aria-pressed={preferences[key] === value} onClick={() => change(key, value as never)}>{title}</button>)}</div></fieldset>;

  return <section className="nearby-short-plan" aria-label="现在出发的附近攻略">
    <style>{styles}</style>
    <header><small>{initialCategory ? `${initialCategory} · ` : ''}现在出发 · 附近玩一会儿</small><h2>接下来去哪玩？</h2><p>选好今天的状态，让我们从当前位置找一个合适的地方。</p></header>
    {choices('能玩多久（含往返）', 'availableMinutes', [['1 小时', 60], ['2 小时', 120], ['3 小时', 180]])}
    <div className="nearby-plan-numbers">
      <label>一起几个人<select aria-label="附近攻略人数" value={preferences.partySize} onChange={e => change('partySize', Number(e.target.value))}>{[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} 人</option>)}</select></label>
      <label>人均预算上限（元）<input aria-label="附近攻略人均预算" type="number" min="0" max="2000" step="10" value={Number.isFinite(preferences.budget) ? preferences.budget : ''} onChange={e => change('budget', e.target.value === '' ? NaN : Number(e.target.value))} /></label>
    </div>
    {choices('现在的心情', 'mood', [['想放松', '放松'], ['找点新鲜', '探索'], ['一起热闹', '热闹']])}
    {choices('想怎么玩', 'kind', [['帮我决定', 'any'], ['棋牌桌游等', 'games'], ['散步', 'walk'], ['吃喝', 'food'], ['看展探索', 'culture']])}
    {choices('单程最多走', 'maxWalkMinutes', [['10 分钟', 10], ['20 分钟', 20], ['30 分钟', 30]])}
    <label className="nearby-plan-consent"><input type="checkbox" checked={preferences.allowUnverified} onChange={e => change('allowUnverified', e.target.checked)} /><span>也看费用或营业时间待确认的地点（需要我出发前核实）</span></label>
    <button className="nearby-plan-generate" type="button" disabled={phase !== 'idle'} onClick={() => void generate()}>{phase === 'locating' ? '正在获取当前位置…' : phase === 'planning' ? '正在核对路线、天气并安排玩法…' : '定位并生成附近攻略'}</button>
    {error ? <p className="nearby-plan-error" role="alert">{error}</p> : null}
    {result?.status === 'no_match' ? <div className="nearby-plan-result" role="status"><b>{result.message}</b><p>{Object.entries(result.excluded).filter(([, count]) => count > 0).map(([reason, count]) => `${reason} ${count} 处`).join(' · ') || '当前位置附近暂无合适数据。'}</p><p>可以调整步行上限、玩法类型或预算；未核实信息不会自动放宽。</p></div> : null}
    {plan && result ? <article className="nearby-plan-result" aria-label="生成的附近攻略">
      <div className="nearby-plan-meta">{result.city} · {result.generation === 'ai' ? 'AI 安排玩法' : '基础规则整理'} · {clockLabel(result.generatedAt)} 核对</div>
      {plan.place.photoUrl && !photoFailed ? <img className="nearby-plan-photo" src={plan.place.photoUrl} alt={`${plan.place.name}的地点图片，来源高德`} referrerPolicy="no-referrer" onError={() => setPhotoFailed(true)} /> : <div className="nearby-plan-no-photo">{plan.place.name}<small>暂无可用地点照片</small></div>}
      <h3>{plan.title}</h3><p>{plan.place.address}</p>
      <div className="nearby-plan-facts"><span>全程约 {plan.totalMinutes} 分钟，含 {plan.bufferMinutes} 分钟缓冲</span><span>往返步行 {(plan.walkingMeters / 1000).toFixed(1)} 公里</span><span>{plan.budget.referencePerPersonYuan === null ? '实际费用待确认，未保证符合预算' : `参考 ${plan.budget.referencePerPersonYuan} 元/人 · 同行合计约 ${plan.budget.groupReferenceYuan} 元`}</span><span>人均上限 {plan.budget.capPerPersonYuan} 元{plan.budget.reservePerPersonYuan !== null ? `，另留 ${plan.budget.reservePerPersonYuan} 元余量` : ''}</span><span>{result.weather ? `天气：${result.weather.condition} ${result.weather.temperature ?? ''}℃（${result.weather.observedAt}）` : '天气待确认'}</span><span>平台今日营业：{plan.place.openingToday || '未提供'}</span></div>
      <ol className="nearby-plan-timeline">{plan.timeline.map(step => <li key={step.phase}><b>{timelineClock(step.startsAt, result.generatedAt)}–{timelineClock(step.endsAt, result.generatedAt)}</b><span>{step.label} · 约 {step.minutes} 分钟</span></li>)}</ol>
      <h4>到这里可以这样玩</h4><ul>{plan.playIdeas.map(idea => <li key={idea}>{idea}</li>)}</ul>
      <div className="nearby-plan-notes"><b>{expired ? '这份攻略已过有效期，请重新生成后出发' : result.status === 'conditional' ? '这份攻略有待确认项' : '出发前再确认一下'}</b><ul>{result.warnings?.map(warning => <li key={warning}>{warning}</li>)}</ul></div>
      <a className="nearby-plan-source" href={plan.place.sourceUrl} target="_blank" rel="noopener noreferrer">查看高德地点来源与最新营业信息</a>
      <div className="nearby-plan-actions">{!expired ? <a href={plan.navigationUrl} target="_blank" rel="noopener noreferrer">打开步行导航</a> : null}<button type="button" disabled={phase !== 'idle'} onClick={() => void generate(true)}>换个地点</button><button type="button" onClick={() => {
        const text = [plan.title, plan.place.address, `全程约${plan.totalMinutes}分钟（含往返与缓冲）`, plan.budget.referencePerPersonYuan === null ? '费用待核实' : `参考${plan.budget.referencePerPersonYuan}元/人，同行约${plan.budget.groupReferenceYuan}元`, ...plan.timeline.map(step => `${timelineClock(step.startsAt, result.generatedAt)} ${step.label}（约${step.minutes}分钟）`), ...plan.playIdeas, ...(result.warnings || []), plan.place.sourceUrl].join('\n');
        if (!navigator.clipboard) { setError('当前浏览器无法自动复制，请长按攻略文字复制。'); return; }
        void navigator.clipboard.writeText(text).then(() => setCopied(true)).catch(() => setError('复制失败，请长按攻略文字复制。'));
      }}>{copied ? '已复制' : '复制攻略'}</button></div>
    </article> : null}
  </section>;
}

const styles = `
.nearby-short-plan{padding:clamp(18px,3vw,28px);margin:0 auto 24px;max-width:900px;border:1px solid rgba(201,255,98,.3);border-radius:24px;background:linear-gradient(150deg,#19231b,#101414);color:#f6f7f1;min-width:0;box-sizing:border-box}
.nearby-short-plan header small{color:#c9ff62;font-weight:800}.nearby-short-plan h2{font-size:clamp(21px,4vw,28px);line-height:1.4;margin:8px 0}.nearby-short-plan p{font-size:14px;line-height:1.7;color:#c1c9bd;margin:8px 0}
.nearby-plan-field{border:0;padding:0;margin:18px 0;min-width:0}.nearby-plan-field legend,.nearby-plan-numbers label{font-size:13px;font-weight:700;color:#dae1d5;margin-bottom:9px}.nearby-plan-options{display:flex;flex-wrap:wrap;gap:8px}.nearby-short-plan button,.nearby-short-plan select,.nearby-short-plan input{font:inherit}.nearby-plan-options button,.nearby-plan-actions button{min-height:42px;padding:8px 13px;border:1px solid #455044;border-radius:12px;background:#1d261f;color:#e4eadf;cursor:pointer}.nearby-plan-options button[aria-pressed=true]{border-color:#c9ff62;color:#c9ff62;background:#2e3b20}.nearby-plan-numbers{display:grid;grid-template-columns:1fr 1fr;gap:12px}.nearby-plan-numbers label{display:grid;gap:8px;min-width:0}.nearby-plan-numbers select,.nearby-plan-numbers input{width:100%;min-width:0;min-height:44px;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid #455044;background:#111913;color:#f5f7f1;font-size:16px}.nearby-plan-consent{display:flex;align-items:flex-start;gap:8px;font-size:13px;line-height:1.6;color:#c1c9bd}.nearby-plan-consent input{margin-top:4px;width:18px;height:18px;flex:none}.nearby-plan-generate{width:100%;min-height:50px;margin-top:18px;padding:12px;border:0;border-radius:14px;background:#c9ff62;color:#182015;font-weight:850!important;cursor:pointer}.nearby-short-plan button:disabled{opacity:.55;cursor:wait}.nearby-short-plan :focus-visible{outline:2px solid #c9ff62;outline-offset:3px}.nearby-plan-error{color:#ffb9ae!important}
.nearby-plan-result{margin-top:22px;padding:18px;border-radius:18px;background:#0f1712;border:1px solid #354433;min-width:0;overflow-wrap:anywhere}.nearby-plan-meta{font-size:12px;color:#b5c5a9;margin-bottom:12px}.nearby-plan-photo{display:block;width:100%;height:220px;object-fit:cover;border-radius:12px}.nearby-plan-no-photo{min-height:90px;padding:16px;border-radius:12px;background:#233025;display:flex;flex-direction:column;gap:10px;justify-content:center}.nearby-plan-no-photo small{font-size:12px;color:#9baa94}.nearby-plan-result h3{font-size:22px;margin:16px 0 6px;color:#f5f7ee}.nearby-plan-facts{display:grid;gap:8px;font-size:13px;line-height:1.5;margin:16px 0;color:#d4e2cd}.nearby-plan-timeline{padding:0;list-style:none;display:grid;gap:10px}.nearby-plan-timeline li{display:grid;grid-template-columns:105px 1fr;gap:10px;padding:12px 0;border-bottom:1px solid #2b382d;font-size:13px}.nearby-plan-timeline b{color:#c9ff62}.nearby-plan-result h4{font-size:16px;margin-bottom:10px}.nearby-plan-result ul{padding-left:20px;font-size:14px;line-height:1.8}.nearby-plan-notes{background:#29271a;padding:12px;border-radius:10px;color:#ede4bf;font-size:13px}.nearby-plan-notes ul{font-size:12px;margin:8px 0 0}.nearby-plan-source{display:block;margin:14px 0;color:#bdd997;font-size:12px}.nearby-plan-actions{display:flex;flex-wrap:wrap;gap:8px}.nearby-plan-actions a{display:flex;align-items:center;min-height:42px;padding:0 12px;border-radius:12px;background:#c9ff62;color:#182015;font-weight:800}.nearby-plan-actions button{font-size:13px}.nearby-plan-actions a,.nearby-plan-source{text-decoration:none}
@media(max-width:420px){.nearby-plan-result{padding:12px}.nearby-plan-photo{height:180px}.nearby-plan-timeline li{grid-template-columns:1fr;gap:5px}}
`;
