import { useState } from 'react';
import type { Activity } from '@/types';
import { PcDatePicker } from '@/components/pc-date-picker';
import { addDays, chinaDate, departureAdvisory, departureFailure, nextWeekend, validDepartureDate, withDeparture } from '@/lib/departure-policy';

export function TripPlanningActions({ activity, onSchedule, alreadyAdded, onViewTrips, initialOpen }: { activity: Activity; onSchedule: (date: string, time?: string) => Promise<unknown>; alreadyAdded?: boolean; onViewTrips: () => void; initialOpen?: boolean }) {
  const [showDate, setShowDate] = useState(initialOpen ?? false);
  const [date, setDate] = useState(activity.plannedDate ?? ((activity.itinerary?.daysCount ?? 1) > 1 ? nextWeekend() : departureFailure(activity, { departureMode: 'plan', departureDate: chinaDate() }) ? addDays(chinaDate(), 1) : chinaDate()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [advisory, setAdvisory] = useState('');
  const days = activity.itinerary?.daysCount ?? 1;
  async function schedule(now: boolean, advisoryAccepted = false) {
    if (busy) return;
    const prefs = { departureMode: now ? 'now' as const : 'plan' as const, departureDate: now ? chinaDate() : date };
    const failure = departureFailure(activity, prefs);
    if (failure) { setError(failure); return; }
    const nextAdvisory = departureAdvisory(activity, prefs);
    if (nextAdvisory && !advisoryAccepted) { setAdvisory(nextAdvisory); setError(''); return; }
    setBusy(true); setError(''); setAdvisory('');
    try { const planned = withDeparture(activity, prefs); await onSchedule(planned.plannedDate!, planned.plannedArrival); onViewTrips(); }
    catch (e) { setError(e instanceof Error ? e.message : '安排失败，请重试'); }
    finally { setBusy(false); }
  }
  return <div className="trip-planning-actions">
    <style>{tripPlanningCss}</style>
    {alreadyAdded ? <button className="itinerary-primary" onClick={onViewTrips}>查看我的行程</button> : <>
      <div className="trip-planning-primary-row">
        <button type="button" className="trip-planning-plan" disabled={busy} onClick={() => { setShowDate((v) => !v); setAdvisory(''); }}>安排出发日期</button>
        {days === 1 ? <button type="button" className="itinerary-primary trip-planning-now" disabled={busy} onClick={() => void schedule(true)}>现在出发</button> : null}
      </div>
      {advisory ? <section className="trip-planning-advisory" role="alert"><div><small>BEFORE YOU GO</small><strong>出发前确认一下</strong><p>{advisory}</p></div><div><button type="button" onClick={() => setAdvisory('')}>先不出发</button><button type="button" onClick={() => void schedule(true, true)}>我知道了，继续出发</button></div></section> : null}
      {showDate ? <div className="trip-planning-date-panel">
        <div className="trip-planning-date-heading"><small>PLAN YOUR TRIP</small><strong>选个出发日</strong><span>安排后会进入“待出发”</span></div>
        <PcDatePicker ariaLabel="安排出发日期" value={date} onChange={setDate} />
        {validDepartureDate(date) && days > 1 ? <p>行程至 {addDays(date, days - 1)}，共 {days} 天</p> : null}
        <button className="itinerary-primary trip-planning-confirm" disabled={busy || !validDepartureDate(date)} onClick={() => void schedule(false)}>确认安排 <span>→</span></button>
      </div> : null}
    </>}
    {error ? <p className="trip-planning-error" role="alert">{error}</p> : null}
  </div>;
}

const tripPlanningCss = `
.trip-planning-actions{display:grid;gap:12px;margin-top:22px}.trip-planning-primary-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.trip-planning-primary-row>button{min-height:58px;border-radius:16px;font-size:16px;font-weight:900;cursor:pointer}.trip-planning-plan{border:1px solid rgba(201,255,98,.42);color:#dfffaa;background:rgba(201,255,98,.055)}.trip-planning-plan:hover{border-color:#c9ff62;background:rgba(201,255,98,.1)}.trip-planning-now{width:100%}.trip-planning-date-panel{position:relative;padding:22px;border:1px solid rgba(201,255,98,.24);border-radius:20px;background:linear-gradient(145deg,rgba(201,255,98,.065),rgba(255,255,255,.025));box-shadow:inset 0 1px rgba(255,255,255,.04)}.trip-planning-date-heading{display:grid;grid-template-columns:1fr auto;align-items:end;margin-bottom:16px}.trip-planning-date-heading small{grid-column:1/-1;margin-bottom:6px;color:#c9ff62;font:800 9px/1 ui-monospace,monospace;letter-spacing:.15em}.trip-planning-date-heading strong{color:#fff;font-size:19px}.trip-planning-date-heading span{color:rgba(255,255,255,.4);font-size:11px}.trip-planning-date-panel>p{margin:11px 0 0;color:#b8c8aa;font-size:12px}.trip-planning-confirm{width:100%;min-height:54px!important;margin-top:15px!important}.trip-planning-confirm span{margin-left:10px}.trip-planning-advisory{padding:20px;border:1px solid rgba(255,180,92,.3);border-radius:18px;background:linear-gradient(145deg,rgba(255,176,83,.09),rgba(255,255,255,.025))}.trip-planning-advisory small{display:block;color:#ffbf72;font:800 9px/1 ui-monospace,monospace;letter-spacing:.14em}.trip-planning-advisory strong{display:block;margin-top:8px;color:#fff;font-size:18px}.trip-planning-advisory p{margin:9px 0 0;color:#c8c1b3;font-size:13px;line-height:1.7}.trip-planning-advisory>div:last-child{display:flex;justify-content:flex-end;gap:9px;margin-top:16px}.trip-planning-advisory button{min-height:44px;padding:0 16px;border:1px solid rgba(255,255,255,.16);border-radius:999px;color:#d9ddd4;background:rgba(255,255,255,.04);font-weight:800}.trip-planning-advisory button:last-child{border-color:#c9ff62;color:#11150d;background:#c9ff62}.trip-planning-error{margin:0;color:#ffb2a5;font-size:13px}
@media(max-width:640px){.trip-planning-primary-row{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.trip-planning-primary-row>button{min-height:54px;padding:0 10px;font-size:14px}.trip-planning-date-panel{padding:17px}.trip-planning-date-heading span{display:none}.trip-planning-advisory>div:last-child{display:grid;grid-template-columns:1fr}.trip-planning-advisory button{width:100%}}
`;
