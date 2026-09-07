import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { addDays, chinaDate } from '@/lib/departure-policy';

type PcDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  min?: string;
  max?: string;
};

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function displayDate(value: string) {
  const date = parseDate(value);
  if (!date) return '选择出发日期';
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(date);
}

export function PcDatePicker({ value, onChange, ariaLabel = '选择出发日期', min = chinaDate(), max = addDays(chinaDate(), 365) }: PcDatePickerProps) {
  const initialDate = parseDate(value) ?? parseDate(min) ?? new Date();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const cells = useMemo(() => {
    const firstWeekday = month.getDay();
    const start = new Date(month.getFullYear(), month.getMonth(), 1 - firstWeekday);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [month]);

  const choose = (next: string) => {
    if (next < min || next > max) return;
    onChange(next);
    setOpen(false);
  };

  return (
    <div className="pc-date-picker">
      <style>{datePickerCss}</style>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className={`pc-date-trigger${value ? ' has-value' : ''}`}
        type="button"
        onClick={() => setOpen((current) => !current)}>
        <span className="pc-date-trigger-icon" aria-hidden="true">
          <i /><b>{parseDate(value)?.getDate() ?? '—'}</b>
        </span>
        <span><small>出发日期</small><strong>{displayDate(value)}</strong></span>
        <em aria-hidden="true">{open ? '−' : '＋'}</em>
      </button>
      {open && typeof document !== 'undefined' ? createPortal(
        <div className="pc-date-layer" role="presentation" onMouseDown={() => setOpen(false)}>
        <section className="pc-date-popover" role="dialog" aria-label="日期选择器" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
          <header>
            <div><small>CHOOSE A DATE</small><strong>选择出发日期</strong><span>{month.getFullYear()} 年 {month.getMonth() + 1} 月</span></div>
            <nav aria-label="切换月份">
              <button aria-label="上一个月" type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>←</button>
              <button aria-label="下一个月" type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>→</button>
              <button className="pc-date-close" aria-label="关闭日期选择器" type="button" onClick={() => setOpen(false)}>×</button>
            </nav>
          </header>
          <div className="pc-date-weekdays">{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="pc-date-grid">
            {cells.map((date) => {
              const next = isoDate(date);
              const disabled = next < min || next > max;
              const isOutside = date.getMonth() !== month.getMonth();
              return <button
                aria-label={new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(date)}
                className={`${next === value ? 'is-selected ' : ''}${next === chinaDate() ? 'is-today ' : ''}${isOutside ? 'is-outside' : ''}`}
                disabled={disabled}
                key={next}
                type="button"
                onClick={() => choose(next)}>{date.getDate()}</button>;
            })}
          </div>
          <footer>
            <span>可以随时在“我的行程”中改期</span>
            <button type="button" onClick={() => { const today = chinaDate(); setMonth(parseDate(today) ?? new Date()); choose(today); }}>选择今天</button>
          </footer>
        </section>
        </div>, document.body) : null}
    </div>
  );
}

const datePickerCss = `
.pc-date-picker{position:relative;width:100%;font-family:Inter,"PingFang SC","Microsoft YaHei",sans-serif}
.pc-date-trigger{width:100%;min-height:72px;padding:11px 16px;border:1px solid rgba(255,255,255,.14);border-radius:18px;display:grid;grid-template-columns:44px 1fr 32px;align-items:center;gap:13px;color:#f7f7f2;background:#121416;text-align:left;cursor:pointer;transition:border-color .2s ease,background .2s ease,box-shadow .2s ease}
.pc-date-trigger:hover,.pc-date-trigger:focus-visible,.pc-date-trigger.has-value{border-color:rgba(201,255,98,.62);background:#171d14;box-shadow:0 0 0 3px rgba(201,255,98,.065),0 0 22px rgba(201,255,98,.06);outline:0}
.pc-date-trigger-icon{width:44px;height:44px;border:1px solid rgba(201,255,98,.4);border-radius:13px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#dfffaa;background:rgba(201,255,98,.06)}
.pc-date-trigger-icon i{width:20px;height:4px;margin-bottom:4px;border-top:2px solid currentColor;border-bottom:1px solid currentColor}.pc-date-trigger-icon b{font:900 13px/1 ui-monospace,monospace}
.pc-date-trigger>span:nth-child(2){min-width:0}.pc-date-trigger small{display:block;margin-bottom:5px;color:rgba(255,255,255,.4);font-size:10px;font-weight:800;letter-spacing:.08em}.pc-date-trigger strong{display:block;overflow:hidden;color:#f7f7f2;font-size:16px;font-weight:850;text-overflow:ellipsis;white-space:nowrap}.pc-date-trigger em{color:#c9ff62;font-size:25px;font-style:normal;font-weight:400;text-align:center}
.pc-date-layer{position:fixed;z-index:2000;inset:0;padding:24px;display:grid;place-items:center;background:rgba(3,5,5,.76);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);animation:pc-date-layer-in .2s ease both}
.pc-date-popover{position:relative;width:min(560px,100%);max-height:calc(100dvh - 48px);overflow:auto;padding:28px;border:1px solid rgba(201,255,98,.3);border-radius:26px;color:#f7f7f2;background:linear-gradient(145deg,#171a1b,#0d0f10);box-shadow:0 34px 100px rgba(0,0,0,.62),0 0 42px rgba(201,255,98,.09);animation:pc-date-dialog-in .26s cubic-bezier(.2,.8,.2,1) both}
.pc-date-popover::before{content:'';position:absolute;inset:0 0 auto;height:3px;background:#c9ff62;box-shadow:0 0 22px rgba(201,255,98,.38)}
.pc-date-popover header{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:24px}.pc-date-popover header small{display:block;margin-bottom:7px;color:#c9ff62;font:800 9px/1 ui-monospace,monospace;letter-spacing:.14em}.pc-date-popover header strong{display:block;color:#fff;font-size:24px;line-height:1.2}.pc-date-popover header span{display:block;margin-top:7px;color:rgba(255,255,255,.45);font-size:13px;font-weight:750}.pc-date-popover nav{display:flex;gap:8px}.pc-date-popover nav button{width:42px;height:42px;border:1px solid rgba(255,255,255,.14);border-radius:13px;color:#fff;background:rgba(255,255,255,.045);font-size:18px;cursor:pointer}.pc-date-popover nav button:hover{border-color:#c9ff62;color:#c9ff62}.pc-date-popover nav .pc-date-close{margin-left:4px;border-radius:50%;color:rgba(255,255,255,.58)}
.pc-date-weekdays,.pc-date-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}.pc-date-weekdays{margin-bottom:7px}.pc-date-weekdays span{color:rgba(255,255,255,.35);font-size:11px;font-weight:800;text-align:center}.pc-date-grid button{aspect-ratio:1;border:1px solid transparent;border-radius:12px;color:rgba(255,255,255,.78);background:transparent;font-size:14px;font-weight:750;cursor:pointer}.pc-date-grid button:hover:not(:disabled){border-color:rgba(201,255,98,.48);color:#fff;background:rgba(201,255,98,.08)}.pc-date-grid button.is-outside{color:rgba(255,255,255,.22)}.pc-date-grid button.is-today{border-color:rgba(201,255,98,.38);color:#c9ff62}.pc-date-grid button.is-selected{border-color:#c9ff62;color:#11150d;background:#c9ff62;box-shadow:0 0 18px rgba(201,255,98,.22)}.pc-date-grid button:disabled{opacity:.14;cursor:not-allowed}
.pc-date-popover footer{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:18px;padding-top:17px;border-top:1px solid rgba(255,255,255,.1)}.pc-date-popover footer span{color:rgba(255,255,255,.35);font-size:11px}.pc-date-popover footer button{flex:0 0 auto;min-height:40px;padding:0 15px;border:1px solid rgba(201,255,98,.44);border-radius:999px;color:#dfffaa;background:rgba(201,255,98,.07);font-weight:850;cursor:pointer}
@keyframes pc-date-layer-in{from{opacity:0}to{opacity:1}}@keyframes pc-date-dialog-in{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
@media(max-width:640px){.pc-date-layer{padding:0;place-items:end center}.pc-date-popover{width:100%;max-height:min(86dvh,720px);padding:22px 18px 20px;border-radius:26px 26px 0 0}.pc-date-popover header strong{font-size:21px}.pc-date-popover nav button{width:38px;height:38px}.pc-date-grid{gap:3px}.pc-date-popover footer span{display:none}}
`;
