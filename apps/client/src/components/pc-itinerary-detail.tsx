import { useEffect, useState } from 'react';

import type { Activity } from '@/types';

type PcItineraryDetailProps = {
  activity: Activity;
  isAlreadyAdded?: boolean;
  onAdd: () => Promise<{ alreadyExists: boolean }>;
  onBack: () => void;
  onMap: () => void;
};

function splitSteps(activity: Activity) {
  const steps = activity.steps.flatMap((entry) =>
    entry.split(/[；;]/).flatMap((block) =>
      block.trim().replace(/^(D\d+)\s*/i, '').split('—').map((step) => step.trim()).filter(Boolean),
    ),
  );
  return (steps.length ? steps : [
    '从推荐起点出发，先别急着赶路',
    '进入今天的核心区域，完成主要体验',
    '在附近慢慢收尾，留下一张照片或一句记录',
  ]).slice(0, 3);
}

export function PcItineraryDetail({ activity, isAlreadyAdded = false, onAdd, onBack, onMap }: PcItineraryDetailProps) {
  const [addState, setAddState] = useState<'idle' | 'loading' | 'added' | 'existing' | 'error'>('idle');
  const [checkedPrepItems, setCheckedPrepItems] = useState<boolean[]>([false, false, false]);
  const steps = splitSteps(activity);
  const cover = activity.coverImageUri?.trim() || '/media/travel/beijing-olympic-forest.jpg';
  const times = ['14:30', '15:20', '16:40'];
  const durations = ['约 25 分钟', '约 60 分钟', '约 50 分钟'];
  const phases = ['进入状态', '本程高光', '松弛收尾'];
  const tips = activity.tips.length ? activity.tips : [
    `导航到：${activity.address || activity.title}`,
    '拍照提示：人物站在明暗交界处，稍微欠曝会更有氛围',
    '预留足够的返程时间，不用把每一步都赶满',
  ];
  const party = activity.minPartySize === activity.maxPartySize
    ? `${activity.minPartySize} 人`
    : `${activity.minPartySize}–${activity.maxPartySize} 人`;
  const hours = Math.max(1, activity.durationMinutes / 60);
  const weatherCopy = activity.weatherNotes?.trim() || '本周六 · 适合出发';
  const addLabel = addState === 'loading'
    ? '正在加入…'
    : addState === 'added'
      ? '已加入我的行程'
      : addState === 'existing'
        ? '已在我的行程中'
        : '加入我的行程';
  const addIcon = addState === 'added' || addState === 'existing' ? '✓' : '+';

  useEffect(() => {
    if (isAlreadyAdded) setAddState('existing');
  }, [isAlreadyAdded]);

  async function handleAdd() {
    if (addState === 'loading' || addState === 'added' || addState === 'existing') return;
    setAddState('loading');
    try {
      const result = await onAdd();
      setAddState(result.alreadyExists ? 'existing' : 'added');
    } catch {
      setAddState('error');
    }
  }

  return (
    <div className="itinerary-detail-page" style={{ backgroundColor: '#090b09', minHeight: '100dvh' }}>
      <style>{detailCss}</style>
      <header className="itinerary-detail-nav">
        <button type="button" onClick={onBack}>← 返回灵感路线</button>
        <span>PLAN {String(activity.id).padStart(2, '0')} / {activity.cityName.toUpperCase()}</span>
        <button className="itinerary-primary compact" disabled={addState === 'loading' || addState === 'added' || addState === 'existing'} type="button" onClick={() => void handleAdd()}><i className="itinerary-add-icon">{addIcon}</i>{addLabel}</button>
      </header>

      <section className="itinerary-detail-hero">
        <img src={cover} alt={activity.title} />
        <div className="itinerary-image-shade" />
        <div className="itinerary-detail-title">
          <span className="itinerary-status"><i /> {weatherCopy}</span>
          <h1>{activity.title}</h1>
          <p>{activity.summary}</p>
        </div>
        <div className="itinerary-hero-stats">
          <div><small>预计用时</small><b>{Number.isInteger(hours) ? hours : hours.toFixed(1)} 小时</b></div>
          <div><small>行程距离</small><b>{activity.distanceKm > 0 ? `${activity.distanceKm.toFixed(1)} 公里` : '待地图确认'}</b></div>
          <div><small>预计花费</small><b>¥{Math.max(0, Math.round(activity.budgetYuan * .65))}–{activity.budgetYuan}</b></div>
          <div><small>适合</small><b>{party}</b></div>
        </div>
      </section>

      <div className="itinerary-detail-body">
        <aside>
          <div className="itinerary-aside-card">
            <span className="itinerary-eyebrow">BEFORE YOU GO</span>
            <h3>出发前，只记住这些</h3>
            <ul>
              <li><span>集合点</span><b>{activity.address || activity.district}</b></li>
              <li><span>建议抵达</span><b>14:20</b></li>
              <li><span>所在区域</span><b>{activity.cityName} · {activity.district}</b></li>
              <li><span>穿什么</span><b>{activity.environment === 'outdoor' ? '运动鞋＋薄外套' : '舒适轻便即可'}</b></li>
            </ul>
          </div>
          <div className="itinerary-aside-card itinerary-prep-card">
            <span className="itinerary-eyebrow">TO-DO LIST</span>
            <h3>出发前准备</h3>
            <div className="itinerary-prep-list">
              {['一杯喜欢的饮料', '充满电的手机', '一点不赶时间的心情'].map((item, index) => (
                <button
                  aria-pressed={checkedPrepItems[index]}
                  className={checkedPrepItems[index] ? 'is-checked' : ''}
                  key={item}
                  type="button"
                  onClick={() => setCheckedPrepItems((current) => current.map((checked, itemIndex) => itemIndex === index ? !checked : checked))}>
                  <i>{checkedPrepItems[index] ? '✓' : ''}</i><span>{item}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="itinerary-aside-card"><span className="itinerary-eyebrow">FLEXIBLE PLAN</span><h3>临时变天怎么办？</h3><p>{activity.rainFriendly === 'yes' ? '这条路线雨天也可执行，适当缩短户外停留即可。' : '缩短户外停留，优先转入附近室内节点，必要时提前返程。'}</p></div>
        </aside>

        <section className="itinerary-timeline-detail">
          <div className="itinerary-body-title"><div><span className="itinerary-eyebrow">YOUR AFTERNOON</span><h2>今天就按这个节奏走</h2></div><button type="button" onClick={onMap}>地图总览 ↗</button></div>
          {steps.map((step, index) => (
            <article className={`itinerary-stop-detail${index === 1 ? ' feature' : ''}`} key={`${step}-${index}`}>
              <time>{times[index]}<small>{durations[index]}</small></time>
              <div className="itinerary-pin"><i /></div>
              <div className="itinerary-stop-copy">
                <span className="itinerary-stop-no">STOP {String(index + 1).padStart(2, '0')} · {phases[index]}</span>
                <h3>{step}</h3>
                <p>{index === 0 ? activity.summary : index === 1 ? activity.description : '不用特意找“最佳机位”。留一点时间给自己，在最舒服的时候结束今天的路线。'}</p>
                {index === 1 ? <div className="itinerary-photo-strip"><img src={cover} alt="核心体验" /><img src={cover} alt="路线氛围" /></div> : null}
                <div className="itinerary-tip">{index === 0 ? '◉' : index === 1 ? '⌁' : '☀'} {tips[index] || tips[tips.length - 1]}</div>
              </div>
            </article>
          ))}
          <div className="itinerary-finish-card"><span>到这里，今天已经很值了。</span><h3>按自己的节奏从{activity.district}返程</h3><p>附近的交通、洗手间和补给点已纳入路线考量</p><button className="itinerary-primary" disabled={addState === 'loading' || addState === 'added' || addState === 'existing'} type="button" onClick={() => void handleAdd()}><i className="itinerary-add-icon">{addIcon}</i>{addLabel}</button>{addState === 'error' ? <small className="itinerary-add-error">加入失败，请稍后再试</small> : null}</div>
        </section>
      </div>
    </div>
  );
}

const detailCss = `
html:has(.itinerary-detail-page),body:has(.itinerary-detail-page),#root:has(.itinerary-detail-page),#root:has(.itinerary-detail-page)>div{min-height:100%;background:#090b09!important}
.itinerary-detail-page{--lime:#baff4a;min-height:100dvh;color:#fff;background:#090b09;font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif}.itinerary-detail-page *{box-sizing:border-box}.itinerary-detail-nav{position:sticky;z-index:20;top:0;height:72px;padding:0 4vw;border-bottom:1px solid #222822;display:flex;align-items:center;justify-content:space-between;background:#090b09}.itinerary-detail-nav button{border:0;color:#cbd0c8;background:none;font-weight:650;cursor:pointer}.itinerary-detail-nav>span{color:#656d63;font:500 11px ui-monospace,monospace;letter-spacing:.12em}.itinerary-primary{height:48px;padding:0 22px;border:0;border-radius:14px!important;color:#10150d!important;background:var(--lime)!important;box-shadow:0 8px 24px rgba(186,255,74,.12);font-weight:800;cursor:pointer}.itinerary-primary.compact{height:40px;padding-inline:20px}.itinerary-detail-hero{position:relative;height:620px;overflow:hidden}.itinerary-detail-hero>img{width:100%;height:100%;object-fit:cover;filter:saturate(.75) contrast(1.06)}.itinerary-image-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(9,11,9,.91) 0,rgba(9,11,9,.4) 50%,rgba(9,11,9,.13)),linear-gradient(0deg,#090b09 0,transparent 38%)}.itinerary-detail-title{position:absolute;left:8vw;top:130px;width:min(760px,70vw)}.itinerary-status{color:#e8f6dd;font:500 12px ui-monospace,monospace;letter-spacing:.08em}.itinerary-status i{display:inline-block;width:8px;height:8px;margin-right:8px;border-radius:50%;background:var(--lime);box-shadow:0 0 14px var(--lime)}.itinerary-detail-title h1{margin:20px 0;color:#fff;font-size:clamp(54px,4.2vw,76px);line-height:1.04;letter-spacing:-.055em}.itinerary-detail-title p{margin:0;color:#d4d8d0;font-size:19px}.itinerary-hero-stats{position:absolute;left:8vw;right:8vw;bottom:34px;padding:24px 0;border-top:1px solid rgba(255,255,255,.26);display:grid;grid-template-columns:repeat(4,1fr)}.itinerary-hero-stats>div{padding-left:26px;border-right:1px solid rgba(255,255,255,.18)}.itinerary-hero-stats>div:first-child{padding-left:0}.itinerary-hero-stats>div:last-child{border:0}.itinerary-hero-stats small{display:block;margin-bottom:7px;color:#9da498;font-size:11px}.itinerary-hero-stats b{font-size:18px}.itinerary-detail-body{width:min(1280px,88vw);margin:0 auto;padding:80px 0 130px;display:grid;grid-template-columns:280px 1fr;gap:80px}.itinerary-aside-card{margin-bottom:18px;padding:24px;border:1px solid #293027;border-radius:18px;background:#101310}.itinerary-eyebrow{color:var(--lime);font:500 12px ui-monospace,monospace;letter-spacing:.14em}.itinerary-aside-card h3{margin:10px 0 20px;font-size:18px}.itinerary-aside-card ul{margin:0;padding:0;list-style:none}.itinerary-aside-card li{padding:12px 0;border-top:1px solid #282d27;display:flex;justify-content:space-between;gap:12px;font-size:12px}.itinerary-aside-card li span,.itinerary-aside-card p{color:#838b81}.itinerary-aside-card li b{max-width:150px;font-weight:500;text-align:right}.itinerary-aside-card p{margin:10px 0 0;font-size:13px;line-height:1.8}.itinerary-aside-card.accent{border:0;color:#111;background:var(--lime)}.itinerary-aside-card.accent span{font-weight:800}.itinerary-aside-card.accent p{color:#253016}.itinerary-body-title{margin-bottom:54px;display:flex;align-items:flex-end;justify-content:space-between}.itinerary-body-title h2{margin:8px 0 0;font-size:36px}.itinerary-body-title button{border:0;color:var(--lime);background:none;cursor:pointer}.itinerary-stop-detail{position:relative;padding-bottom:70px;display:grid;grid-template-columns:95px 24px 1fr;gap:18px}.itinerary-stop-detail time{color:var(--lime);font:500 16px ui-monospace,monospace}.itinerary-stop-detail time small{display:block;margin-top:8px;color:#686f66;font:400 10px sans-serif}.itinerary-pin::after{content:"";position:absolute;top:16px;bottom:0;margin-left:5px;border-left:1px solid #394235}.itinerary-pin i{position:relative;z-index:1;display:block;width:12px;height:12px;border:2px solid var(--lime);border-radius:50%;background:#101310}.itinerary-stop-no{color:#778074;font:500 11px ui-monospace,monospace;letter-spacing:.1em}.itinerary-stop-copy h3{margin:9px 0 14px;font-size:25px}.itinerary-stop-copy>p{max-width:690px;margin:0 0 18px;color:#a6aca3;line-height:1.85}.itinerary-tip{padding:13px 15px;border-left:2px solid var(--lime);color:#8f988b;background:#141914;font-size:12px}.itinerary-stop-detail.feature .itinerary-stop-copy{margin-top:-28px;padding:28px;border:1px solid #3c4b35;border-radius:20px;background:#111511}.itinerary-photo-strip{height:220px;margin:22px 0 10px;display:grid;grid-template-columns:1.4fr 1fr;gap:7px}.itinerary-photo-strip img{width:100%;height:100%;border-radius:8px;object-fit:cover}.itinerary-finish-card{margin-left:155px;padding:34px;border:1px solid var(--lime);border-radius:22px;background:linear-gradient(120deg,#182313,#0d110d)}.itinerary-finish-card>span{color:var(--lime);font-size:12px}.itinerary-finish-card h3{margin:10px 0;font-size:27px}.itinerary-finish-card p{color:#7f877c;font-size:13px}.itinerary-finish-card button{margin-top:18px}
.itinerary-primary:disabled{cursor:wait;opacity:.72}.itinerary-add-error{display:block;margin-top:12px;color:#ff9b9b;font-size:12px}
.itinerary-primary{display:inline-flex;align-items:center;justify-content:center;gap:10px;font-weight:950}.itinerary-add-icon{display:inline-flex;width:19px;height:19px;align-items:center;justify-content:center;font:normal 1000 22px/19px Arial,sans-serif;transform:translateY(-1px)}
.itinerary-prep-card{background:linear-gradient(145deg,rgba(186,255,74,.07),#101310 72%)}.itinerary-prep-list{display:grid;gap:8px}.itinerary-prep-list button{width:100%;min-height:42px;padding:8px 10px;border:1px solid #2d352b;border-radius:11px;display:grid;grid-template-columns:22px 1fr;gap:10px;align-items:center;color:#c9cec6;background:rgba(255,255,255,.025);font:500 12px/1.45 inherit;text-align:left;cursor:pointer;transition:border-color .2s ease,background .2s ease,color .2s ease}.itinerary-prep-list button:hover{border-color:rgba(186,255,74,.45);background:rgba(186,255,74,.055)}.itinerary-prep-list button>i{width:20px;height:20px;border:1px solid #596055;border-radius:6px;display:grid;place-items:center;color:#10150d;background:transparent;font:normal 900 13px/1 sans-serif}.itinerary-prep-list button.is-checked{color:#7d857a;background:rgba(186,255,74,.035)}.itinerary-prep-list button.is-checked>i{border-color:var(--lime);background:var(--lime)}.itinerary-prep-list button.is-checked>span{text-decoration:line-through;text-decoration-color:#697064}
.itinerary-detail-page{--secondary-nav-height:clamp(84px,5.2vw,104px)}.itinerary-detail-nav{height:var(--secondary-nav-height);padding-inline:7.4vw}.itinerary-detail-title{left:7.4vw}.itinerary-hero-stats{left:7.4vw;right:7.4vw}.itinerary-detail-body{width:85.2vw;max-width:none}.itinerary-detail-nav>button:first-child{color:#e2e7df;font-size:clamp(15px,1vw,19px);font-weight:800}.itinerary-detail-nav>span{color:#858d82;font-size:clamp(12px,.78vw,15px);font-weight:600}.itinerary-detail-nav .itinerary-primary.compact{height:52px;padding-inline:26px;font-size:clamp(14px,.92vw,17px);font-weight:950}
@media(max-width:850px){.itinerary-detail-hero{height:570px}.itinerary-detail-title{left:7vw;top:100px}.itinerary-detail-title h1{font-size:52px}.itinerary-hero-stats{grid-template-columns:1fr 1fr;gap:20px}.itinerary-hero-stats>div{padding-left:0}.itinerary-detail-body{padding-top:40px;grid-template-columns:1fr;gap:35px}.itinerary-detail-body>aside{display:grid;grid-template-columns:1fr 1fr;gap:12px}.itinerary-aside-card{margin:0}.itinerary-aside-card:last-child{display:none}.itinerary-stop-detail{grid-template-columns:65px 18px 1fr;gap:10px}.itinerary-stop-detail.feature .itinerary-stop-copy{padding:20px}.itinerary-finish-card{margin-left:93px}.itinerary-detail-nav>span{display:none}.itinerary-photo-strip{height:160px}}
@media(max-width:540px){.itinerary-detail-nav{padding-inline:20px}.itinerary-detail-nav .compact{display:none}.itinerary-detail-title h1{font-size:42px}.itinerary-detail-title p{font-size:15px}.itinerary-hero-stats{left:7vw;right:7vw}.itinerary-hero-stats b{font-size:14px}.itinerary-detail-body>aside{grid-template-columns:1fr}.itinerary-aside-card.accent{display:none}.itinerary-body-title h2{font-size:28px}.itinerary-stop-detail{grid-template-columns:1fr;padding-left:22px}.itinerary-stop-detail time{margin-left:-22px}.itinerary-pin{position:absolute;left:0;top:38px}.itinerary-finish-card{margin-left:0}.itinerary-photo-strip{grid-template-columns:1fr}.itinerary-photo-strip img:last-child{display:none}}
`;
