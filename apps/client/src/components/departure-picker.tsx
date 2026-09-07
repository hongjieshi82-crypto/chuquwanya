import { chinaDate, nextWeekend, addDays, type DepartureMode } from '@/lib/departure-policy';
import { PcDatePicker } from '@/components/pc-date-picker';

export function DeparturePicker({ mode, date, period, onChange }: { mode: DepartureMode; date: string; period: string; onChange: (mode: DepartureMode, date: string) => void }) {
  const multi = period !== '当天';
  const days = period === '小长假' ? 4 : multi ? 2 : 1;
  return <div className="departure-picker">
    <style>{departurePickerCss}</style>
    <div className="departure-picker-heading"><div><small>DEPARTURE</small><strong>什么时候出发？</strong></div><span>选好时机，推荐会更准</span></div>
    <div className="departure-picker-options">{([['idea', '先找灵感', '先看看，不定日期'], ['now', '现在出发', '按今天剩余时间筛选'], ['plan', '约个时间', '安排一个确切日期']] as const).map(([value, label, hint]) => <button key={value} type="button" disabled={value === 'now' && multi} aria-pressed={mode === value} onClick={() => onChange(value, value === 'now' ? chinaDate() : date || (multi ? nextWeekend() : chinaDate()))}><i /><span><b>{label}</b><small>{value === 'now' && multi ? '多日行程请预约时间' : hint}</small></span></button>)}</div>
    {mode === 'plan' ? <div className="departure-picker-date"><PcDatePicker value={date} onChange={(next) => onChange(mode, next)} />{date && multi ? <small>计划 {date} 至 {addDays(date, days - 1)} · 共 {days} 天，每天独立安排</small> : null}</div> : <p className="departure-picker-note">{mode === 'now' ? '默认今天，只保留剩余时间能完成的单日玩法；出发前仍建议确认交通和开放状态。' : '不需要现在选日期。喜欢的先收藏，准备好了再安排。'}</p>}
  </div>;
}

const departurePickerCss = `
.departure-picker{margin-top:28px;padding-top:28px;border-top:1px solid rgba(255,255,255,.1)}
.departure-picker-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:16px}.departure-picker-heading small{display:block;margin-bottom:6px;color:#c9ff62;font:800 9px/1 ui-monospace,monospace;letter-spacing:.15em}.departure-picker-heading strong{color:#f7f7f2;font-size:17px}.departure-picker-heading>span{color:rgba(255,255,255,.36);font-size:11px}
.departure-picker-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.departure-picker-options button{min-width:0;min-height:68px;padding:12px 14px;border:1px solid rgba(255,255,255,.13);border-radius:16px;display:flex;align-items:center;gap:11px;color:rgba(255,255,255,.68);background:#141619;text-align:left;cursor:pointer;transition:border-color .2s ease,background .2s ease,transform .2s ease}.departure-picker-options button:hover:not(:disabled){border-color:rgba(201,255,98,.55);color:#fff;transform:translateY(-2px)}.departure-picker-options button[aria-pressed="true"]{border-color:#c9ff62;color:#dfffaa;background:#182014;box-shadow:inset 0 0 0 1px rgba(201,255,98,.07),0 0 18px rgba(201,255,98,.07)}.departure-picker-options button:disabled{opacity:.34;cursor:not-allowed}.departure-picker-options button>i{width:9px;height:9px;flex:0 0 auto;border:1px solid rgba(255,255,255,.3);border-radius:50%}.departure-picker-options button[aria-pressed="true"]>i{border-color:#c9ff62;background:#c9ff62;box-shadow:0 0 10px rgba(201,255,98,.7)}.departure-picker-options button span{min-width:0}.departure-picker-options b,.departure-picker-options small{display:block}.departure-picker-options b{font-size:14px}.departure-picker-options small{margin-top:5px;overflow:hidden;color:rgba(255,255,255,.36);font-size:10px;font-weight:650;text-overflow:ellipsis;white-space:nowrap}.departure-picker-date{margin-top:14px}.departure-picker-date>small{display:block;margin-top:10px;color:#adbd9f;font-size:12px}.departure-picker-note{margin:13px 2px 0;color:rgba(255,255,255,.42);font-size:11px;line-height:1.65}
@media(max-width:720px){.departure-picker-heading>span{display:none}.departure-picker-options{grid-template-columns:1fr}.departure-picker-options button{min-height:58px}.departure-picker-options small{white-space:normal}}
`;
