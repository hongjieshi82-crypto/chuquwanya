import { useRef, useState } from 'react';
import type { Activity } from '@/types';
import { PhotoCredit } from '@/components/photo-credit';
import { TripPlanningActions } from '@/components/trip-planning-actions';
import { saveActivity } from '@/services/api';
import { practicalPreparation, practicalReplacement, timelineRows } from '../../../api/src/itinerary-policy';

type PcItineraryDetailProps = {
  activity: Activity;
  userId?: number;
  scheduleInitially?: boolean;
  isAlreadyAdded?: boolean;
  onAdd: (date: string, time?: string) => Promise<{ alreadyExists: boolean }>;
  onBack: () => void;
  onMap: () => void;
  onViewTrips: () => void;
};

export function PcItineraryDetail({ activity: input, userId, scheduleInitially, isAlreadyAdded = false, onAdd, onBack, onMap, onViewTrips }: PcItineraryDetailProps) {
  const replacement = practicalReplacement(input);
  const activity = { ...input, ...(replacement ?? {}), id: input.id };
  if (input.plannedArrival && activity.itinerary) activity.itinerary = { ...activity.itinerary, arrival: input.plannedArrival };
  const plan = activity.itinerary;
  const planningRef = useRef<HTMLDivElement>(null);
  const [checkedPrepItems, setCheckedPrepItems] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [favoriteError, setFavoriteError] = useState('');
  const preparation = plan?.preparation ?? practicalPreparation(activity.environment);
  const rows = plan ? timelineRows(plan) : activity.steps.map((title) => ({
    title, time: '', endTime: '', minutes: 0, transferMinutes: 0, kind: 'visit' as const,
    description: '', meals: undefined, image: undefined, day: 1,
  }));
  const unreviewed = !plan && (activity.sourceType === 'itinerary_workbook' || /·(?:一日|周末|假期)/.test(activity.title));
  const cover = activity.coverImageUri?.trim();
  const hours = activity.durationMinutes / 60;
  const elapsed = Number.isInteger(hours) ? hours : hours.toFixed(1);
  const reservation = plan?.reservation || (activity.reservationRequired === 'yes' ? '出发前先完成预约，并核对所选日期开放时间。' : '开放时间、门票及预约要求尚需确认。');

  const addButton = <button className="itinerary-primary compact" disabled={unreviewed} type="button" onClick={() => isAlreadyAdded ? onViewTrips() : planningRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>{isAlreadyAdded ? '查看我的行程' : '安排出发 / 收藏'}</button>;
  return (
    <div className="itinerary-detail-page" style={{ backgroundColor: '#090b09', minHeight: '100dvh' }}>
      <style>{detailCss}</style>
      <header className="itinerary-detail-nav"><button type="button" onClick={onBack}>← 返回灵感路线</button><span>{activity.cityName} · 路线安排</span>{addButton}</header>
      <section className="itinerary-detail-hero">
        {cover ? <img src={cover} alt={activity.address || activity.title} /> : null}
        <div className="itinerary-image-shade" />
        <button aria-pressed={isFavorite} className={`itinerary-favorite${isFavorite ? ' is-saved' : ''}`} disabled={favoriteBusy} type="button" onClick={() => {
          if (isFavorite || favoriteBusy) return;
          setFavoriteBusy(true); setFavoriteError('');
          void saveActivity(activity.id, userId).then(() => setIsFavorite(true)).catch((reason) => setFavoriteError(reason instanceof Error ? reason.message : '收藏失败，请重试')).finally(() => setFavoriteBusy(false));
        }}>
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg>
          <span>{isFavorite ? '已收藏' : '收藏'}</span>
        </button>
        {favoriteError ? <span className="itinerary-favorite-error" role="alert">{favoriteError}</span> : null}
        <div className="itinerary-detail-title">
          <span className="itinerary-status">参考行程 · {activity.plannedDate ? `${activity.plannedDate} 出发` : '出行日期待安排'}</span>
          <h1>{activity.title}</h1><p>{activity.summary}</p>
        </div>
        <div className="itinerary-hero-stats">
          <div><small>{plan?.daysCount ? `${plan.daysCount}天体验合计（不含往返）` : '预计游玩（不含往返）'}</small><b>{elapsed} 小时</b></div>
          <div><small>起点距离</small><b>{activity.distanceKm > 0 ? `${activity.distanceKm.toFixed(1)} 公里` : '请查看地图'}</b></div>
          <div><small>参考预算 / 人</small><b>约 ¥{activity.budgetYuan}</b></div>
          <div><small>适合人数</small><b>{activity.minPartySize}–{activity.maxPartySize} 人</b></div>
        </div>
      </section>
      <PhotoCredit activity={activity} />
      {!unreviewed ? <div ref={planningRef} style={{ width: '85.2%', margin: '24px auto' }}><TripPlanningActions activity={activity} initialOpen={scheduleInitially} alreadyAdded={isAlreadyAdded} onSchedule={onAdd} onViewTrips={onViewTrips} /></div> : null}
      <div className="itinerary-detail-body">
        <aside>
          <div className="itinerary-aside-card">
            <h3>抵达与预约</h3>
            <ul><li><span>目的地</span><b>{activity.address}</b></li><li><span>参考抵达</span><b>{plan?.arrival ?? '按开放及交通安排'}</b></li><li><span>所在区域</span><b>{activity.cityName} · {activity.district}</b></li></ul>
            {plan ? <p>{plan.arrivalNote}</p> : null}<p>{reservation}</p>
            {plan?.source ? <a className="itinerary-source-link" href={plan.source} target="_blank" rel="noreferrer">查看官方 / 来源信息</a> : null}
          </div>
          <div className="itinerary-aside-card itinerary-prep-card">
            <h3>出发前准备</h3>
            <div className="itinerary-prep-list">{preparation.map((item) => (
              <button key={item} type="button" aria-pressed={checkedPrepItems.includes(item)} className={checkedPrepItems.includes(item) ? 'is-checked' : ''} onClick={() => setCheckedPrepItems((current) => current.includes(item) ? current.filter((s) => s !== item) : [...current, item])}><i>{checkedPrepItems.includes(item) ? '✓' : ''}</i><span>{item}</span></button>
            ))}</div>
          </div>
          <div className="itinerary-aside-card"><h3>出行日天气</h3><p>{activity.plannedDate ? `计划于 ${activity.plannedDate} 出发。当前页面未取得该日预报，请在出行前核对天气和场馆公告。` : '先收藏不需要日期；安排出发后，请核对所选日期的天气与场馆公告。'}</p>{plan?.weatherContingency ? <p>{plan.weatherContingency}</p> : null}</div>
        </aside>
        <section className="itinerary-timeline-detail">
          <div className="itinerary-body-title"><div><h2>这趟行程这样安排</h2></div><button type="button" onClick={onMap}>地图总览</button></div>
          <p className="itinerary-schedule-note">{unreviewed ? '这条旧路线存在未核验的跨区与时间安排，已停止新推荐。请返回重新选择。' : plan ? '以下时间为参考节奏，已包含标注的步行、排队与停留；请按预约和实际交通调整。' : '以下为原始路线顺序，尚无可靠的分段耗时；不提供虚构到达时间。'}</p>
          {!unreviewed ? rows.map((row, index) => (
            <article className="itinerary-stop-detail" key={index}>
              <div className="itinerary-pin"><i /></div>
              <div className="itinerary-stop-copy">
                <div className="itinerary-stop-meta">{plan?.daysCount ? <span>第 {row.day ?? 1} 天</span> : null}<time>{row.time ? `${row.time}–${row.endTime}` : `第 ${index + 1} 步`}</time>{row.minutes > 0 ? <span>约 {row.minutes} 分钟</span> : null}</div>
                {row.transferMinutes > 0 ? <p className="itinerary-transfer">上一段后预留 {row.transferMinutes} 分钟园内 / 街区步行</p> : null}
                <h3>{row.title}</h3>{row.description ? <p>{row.description}</p> : null}
                {row.meals?.length ? <div className="itinerary-meal-options"><small>就近任选一家 · 请核对营业与等位</small>{row.meals.map((meal) => <div key={meal.name}><h4>{meal.name}</h4><span>{meal.area}</span><p>{meal.note}</p><a href={`https://uri.amap.com/search?keyword=${encodeURIComponent(activity.cityName + ' ' + meal.name)}`} target="_blank" rel="noreferrer">查位置与门店</a><a href={meal.source} target="_blank" rel="noreferrer">餐厅来源</a></div>)}</div> : null}
                {row.image ? <div className="itinerary-photo-strip"><img src={row.image} alt={row.title} /></div> : null}
              </div>
            </article>
          )) : null}
          <div className="itinerary-finish-card"><h3>{unreviewed ? '请选择已整理的路线' : '按实际游玩进度返程'}</h3><p>返程耗时以出发时地图为准；延误时优先缩减项目，不压缩用餐和休息。</p>{addButton}</div>
        </section>
      </div>
    </div>
  );
}

const detailCss = `
html:has(.itinerary-detail-page),body:has(.itinerary-detail-page),#root:has(.itinerary-detail-page),#root:has(.itinerary-detail-page)>div{min-height:100%;background:#090b09!important}
.itinerary-detail-page{--lime:#baff4a;min-height:100dvh;color:#fff;background:#090b09;font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif}.itinerary-detail-page *{box-sizing:border-box}.itinerary-detail-nav{position:sticky;z-index:20;top:0;height:72px;padding:0 4vw;border-bottom:1px solid #222822;display:flex;align-items:center;justify-content:space-between;background:#090b09}.itinerary-detail-nav button{border:0;color:#cbd0c8;background:none;font-weight:650;cursor:pointer}.itinerary-detail-nav>span{color:#656d63;font:500 11px ui-monospace,monospace;letter-spacing:.12em}.itinerary-primary{height:48px;padding:0 22px;border:0;border-radius:14px!important;color:#10150d!important;background:var(--lime)!important;box-shadow:0 8px 24px rgba(186,255,74,.12);font-weight:800;cursor:pointer}.itinerary-primary.compact{height:40px;padding-inline:20px}.itinerary-detail-hero{position:relative;height:620px;overflow:hidden}.itinerary-detail-hero>img{width:100%;height:100%;object-fit:cover;filter:saturate(.75) contrast(1.06)}.itinerary-image-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(9,11,9,.91) 0,rgba(9,11,9,.4) 50%,rgba(9,11,9,.13)),linear-gradient(0deg,#090b09 0,transparent 38%)}.itinerary-detail-title{position:absolute;left:8vw;top:130px;width:min(760px,70vw)}.itinerary-status{color:#e8f6dd;font:500 12px ui-monospace,monospace;letter-spacing:.08em}.itinerary-status i{display:inline-block;width:8px;height:8px;margin-right:8px;border-radius:50%;background:var(--lime);box-shadow:0 0 14px var(--lime)}.itinerary-detail-title h1{margin:20px 0;color:#fff;font-size:clamp(54px,4.2vw,76px);line-height:1.04;letter-spacing:-.055em}.itinerary-detail-title p{margin:0;color:#d4d8d0;font-size:19px}.itinerary-hero-stats{position:absolute;left:8vw;right:8vw;bottom:34px;padding:24px 0;border-top:1px solid rgba(255,255,255,.26);display:grid;grid-template-columns:repeat(4,1fr)}.itinerary-hero-stats>div{padding-left:26px;border-right:1px solid rgba(255,255,255,.18)}.itinerary-hero-stats>div:first-child{padding-left:0}.itinerary-hero-stats>div:last-child{border:0}.itinerary-hero-stats small{display:block;margin-bottom:7px;color:#9da498;font-size:11px}.itinerary-hero-stats b{font-size:18px}.itinerary-detail-body{width:min(1280px,88vw);margin:0 auto;padding:80px 0 130px;display:grid;grid-template-columns:280px 1fr;gap:80px}.itinerary-aside-card{margin-bottom:18px;padding:24px;border:1px solid #293027;border-radius:18px;background:#101310}.itinerary-eyebrow{color:var(--lime);font:500 12px ui-monospace,monospace;letter-spacing:.14em}.itinerary-aside-card h3{margin:10px 0 20px;font-size:18px}.itinerary-aside-card ul{margin:0;padding:0;list-style:none}.itinerary-aside-card li{padding:12px 0;border-top:1px solid #282d27;display:flex;justify-content:space-between;gap:12px;font-size:12px}.itinerary-aside-card li span,.itinerary-aside-card p{color:#838b81}.itinerary-aside-card li b{max-width:150px;font-weight:500;text-align:right}.itinerary-aside-card p{margin:10px 0 0;font-size:13px;line-height:1.8}.itinerary-aside-card.accent{border:0;color:#111;background:var(--lime)}.itinerary-aside-card.accent span{font-weight:800}.itinerary-aside-card.accent p{color:#253016}.itinerary-body-title{margin-bottom:54px;display:flex;align-items:flex-end;justify-content:space-between}.itinerary-body-title h2{margin:8px 0 0;font-size:36px}.itinerary-body-title button{border:0;color:var(--lime);background:none;cursor:pointer}.itinerary-stop-detail{position:relative;padding-bottom:70px;display:grid;grid-template-columns:95px 24px 1fr;gap:18px}.itinerary-stop-detail time{color:var(--lime);font:500 16px ui-monospace,monospace}.itinerary-stop-detail time small{display:block;margin-top:8px;color:#686f66;font:400 10px sans-serif}.itinerary-pin::after{content:"";position:absolute;top:16px;bottom:0;margin-left:5px;border-left:1px solid #394235}.itinerary-pin i{position:relative;z-index:1;display:block;width:12px;height:12px;border:2px solid var(--lime);border-radius:50%;background:#101310}.itinerary-stop-no{color:#778074;font:500 11px ui-monospace,monospace;letter-spacing:.1em}.itinerary-stop-copy h3{margin:9px 0 14px;font-size:25px}.itinerary-stop-copy>p{max-width:690px;margin:0 0 18px;color:#a6aca3;line-height:1.85}.itinerary-tip{padding:13px 15px;border-left:2px solid var(--lime);color:#8f988b;background:#141914;font-size:12px}.itinerary-stop-detail.feature .itinerary-stop-copy{margin-top:-28px;padding:28px;border:1px solid #3c4b35;border-radius:20px;background:#111511}.itinerary-photo-strip{height:220px;margin:22px 0 10px;display:grid;grid-template-columns:1.4fr 1fr;gap:7px}.itinerary-photo-strip img{width:100%;height:100%;border-radius:8px;object-fit:cover}.itinerary-finish-card{margin-left:155px;padding:34px;border:1px solid var(--lime);border-radius:22px;background:linear-gradient(120deg,#182313,#0d110d)}.itinerary-finish-card>span{color:var(--lime);font-size:12px}.itinerary-finish-card h3{margin:10px 0;font-size:27px}.itinerary-finish-card p{color:#7f877c;font-size:13px}.itinerary-finish-card button{margin-top:18px}
.itinerary-favorite{position:absolute;z-index:4;right:7.4vw;top:34px;min-width:108px;height:46px;padding:0 17px;border:1px solid rgba(255,255,255,.32);border-radius:999px;display:inline-flex;align-items:center;justify-content:center;gap:9px;color:#fff;background:rgba(8,11,9,.5);font-weight:850;cursor:pointer;backdrop-filter:blur(14px)}.itinerary-favorite svg{width:20px;height:20px;fill:transparent;stroke:currentColor;stroke-width:1.8}.itinerary-favorite:hover,.itinerary-favorite.is-saved{border-color:var(--lime);color:#e7ffc0;background:rgba(201,255,98,.12)}.itinerary-favorite.is-saved svg{fill:var(--lime);stroke:var(--lime)}.itinerary-favorite-error{position:absolute;z-index:4;right:7.4vw;top:88px;color:#ffaaa0;font-size:12px}
.itinerary-primary:disabled{cursor:wait;opacity:.72}.itinerary-add-error{display:block;margin-top:12px;color:#ff9b9b;font-size:12px}
.itinerary-primary{display:inline-flex;align-items:center;justify-content:center;gap:10px;font-weight:950}.itinerary-add-icon{display:inline-flex;width:19px;height:19px;align-items:center;justify-content:center;font:normal 1000 22px/19px Arial,sans-serif;transform:translateY(-1px)}
.itinerary-prep-card{background:linear-gradient(145deg,rgba(186,255,74,.07),#101310 72%)}.itinerary-prep-list{display:grid;gap:8px}.itinerary-prep-list button{width:100%;min-height:42px;padding:8px 10px;border:1px solid #2d352b;border-radius:11px;display:grid;grid-template-columns:22px 1fr;gap:10px;align-items:center;color:#c9cec6;background:rgba(255,255,255,.025);font:500 12px/1.45 inherit;text-align:left;cursor:pointer;transition:border-color .2s ease,background .2s ease,color .2s ease}.itinerary-prep-list button:hover{border-color:rgba(186,255,74,.45);background:rgba(186,255,74,.055)}.itinerary-prep-list button>i{width:20px;height:20px;border:1px solid #596055;border-radius:6px;display:grid;place-items:center;color:#10150d;background:transparent;font:normal 900 13px/1 sans-serif}.itinerary-prep-list button.is-checked{color:#7d857a;background:rgba(186,255,74,.035)}.itinerary-prep-list button.is-checked>i{border-color:var(--lime);background:var(--lime)}.itinerary-prep-list button.is-checked>span{text-decoration:line-through;text-decoration-color:#697064}
.itinerary-detail-page{--secondary-nav-height:clamp(84px,5.2vw,104px)}.itinerary-detail-nav{height:var(--secondary-nav-height);padding-inline:7.4vw}.itinerary-detail-title{left:7.4vw}.itinerary-hero-stats{left:7.4vw;right:7.4vw}.itinerary-detail-body{width:85.2vw;max-width:none}.itinerary-detail-nav>button:first-child{color:#e2e7df;font-size:clamp(15px,1vw,19px);font-weight:800}.itinerary-detail-nav>span{color:#858d82;font-size:clamp(12px,.78vw,15px);font-weight:600}.itinerary-detail-nav .itinerary-primary.compact{height:52px;padding-inline:26px;font-size:clamp(14px,.92vw,17px);font-weight:950}
@media(max-width:850px){.itinerary-detail-hero{height:570px}.itinerary-detail-title{left:7vw;top:100px}.itinerary-detail-title h1{font-size:52px}.itinerary-hero-stats{grid-template-columns:1fr 1fr;gap:20px}.itinerary-hero-stats>div{padding-left:0}.itinerary-detail-body{padding-top:40px;grid-template-columns:1fr;gap:35px}.itinerary-detail-body>aside{display:grid;grid-template-columns:1fr 1fr;gap:12px}.itinerary-aside-card{margin:0}.itinerary-aside-card:last-child{display:none}.itinerary-stop-detail{grid-template-columns:65px 18px 1fr;gap:10px}.itinerary-stop-detail.feature .itinerary-stop-copy{padding:20px}.itinerary-finish-card{margin-left:93px}.itinerary-detail-nav>span{display:none}.itinerary-photo-strip{height:160px}}
@media(max-width:540px){.itinerary-detail-nav{padding-inline:20px}.itinerary-detail-nav .compact{display:none}.itinerary-detail-title h1{font-size:42px}.itinerary-detail-title p{font-size:15px}.itinerary-hero-stats{left:7vw;right:7vw}.itinerary-hero-stats b{font-size:14px}.itinerary-detail-body>aside{grid-template-columns:1fr}.itinerary-aside-card.accent{display:none}.itinerary-body-title h2{font-size:28px}.itinerary-stop-detail{grid-template-columns:1fr;padding-left:22px}.itinerary-stop-detail time{margin-left:-22px}.itinerary-pin{position:absolute;left:0;top:38px}.itinerary-finish-card{margin-left:0}.itinerary-photo-strip{grid-template-columns:1fr}.itinerary-photo-strip img:last-child{display:none}}
.itinerary-detail-page .itinerary-stop-detail{display:grid;grid-template-columns:18px minmax(0,1fr);gap:16px;padding:0 0 36px;margin:0}.itinerary-detail-page .itinerary-pin{position:relative;left:auto;top:5px}.itinerary-detail-page .itinerary-pin::after{left:5px;margin:0;top:14px;bottom:-36px}.itinerary-detail-page .itinerary-stop-copy{min-width:0;padding:0;margin:0}.itinerary-stop-meta{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}.itinerary-stop-meta>span{font-size:12px;color:#9fa99a}.itinerary-detail-page .itinerary-stop-detail time{margin:0;font-size:16px;white-space:nowrap}.itinerary-detail-page .itinerary-transfer{font-size:12px;margin:8px 0;color:#9ca592}.itinerary-schedule-note{color:#a4ae9e;font-size:13px;line-height:1.8;margin:0 0 30px}.itinerary-detail-page .itinerary-body-title{gap:16px;align-items:center}.itinerary-detail-page .itinerary-body-title button{white-space:nowrap;padding:6px 0;border-bottom:1px solid currentColor}.itinerary-detail-page .itinerary-finish-card{margin-left:34px}.itinerary-meal-options{display:grid;gap:10px;margin:20px 0}.itinerary-meal-options>small{color:#c9d8bc}.itinerary-meal-options>div{padding:16px;border:1px solid #354330;border-radius:14px;background:#111711}.itinerary-meal-options h4{margin:0 0 6px;font-size:17px;color:#f4f8ef}.itinerary-meal-options span,.itinerary-meal-options p{font-size:13px;color:#acb7a4;line-height:1.7}.itinerary-meal-options a,.itinerary-source-link{display:inline-block;margin:8px 16px 0 0;color:var(--lime);font-size:13px;text-decoration:underline}.itinerary-detail-page .itinerary-aside-card:last-child{display:block}.itinerary-detail-page .itinerary-stop-copy h3{line-height:1.45;overflow-wrap:anywhere}.itinerary-detail-page .itinerary-photo-strip{grid-template-columns:1fr}.itinerary-detail-page .itinerary-finish-card .compact{display:inline-flex}
@media(max-width:760px){.itinerary-detail-page .itinerary-stop-detail{grid-template-columns:14px minmax(0,1fr);gap:12px}.itinerary-detail-page .itinerary-stop-copy h3{font-size:23px}.itinerary-detail-page .itinerary-finish-card{margin-left:0}.itinerary-detail-page .itinerary-body-title h2{font-size:24px}.itinerary-detail-page .itinerary-detail-nav{position:relative}.itinerary-detail-page .itinerary-stop-meta{gap:8px}}
`;
