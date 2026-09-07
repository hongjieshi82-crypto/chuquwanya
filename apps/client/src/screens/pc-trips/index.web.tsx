import {
  ArrowRightOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfigProvider,
  Dropdown,
  Empty,
  Popconfirm,
  Modal,
  Input,
  Radio,
  Segmented,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import { useApp } from '@/contexts/app-context';
import { PcDatePicker } from '@/components/pc-date-picker';
import { resolveCuratedActivityCover } from '@/services/demo-data';
import { getActivity, getTodos, getSavedActivities, getTripProgress, saveTripProgress, scheduleTodo, submitTripFeedback, startTodo, updateTodoStatus } from '@/services/api';
import { addDays, calendarText, chinaDate, departureFailure, validDepartureDate } from '@/lib/departure-policy';
import { palette, radii } from '@/theme';
import type { Activity, Todo, TodoStatus } from '@/types';

const { Paragraph, Title } = Typography;

type TripFilter = 'all' | 'saved' | 'upcoming' | 'in_progress' | 'completed';

const filterOptions: { label: string; value: TripFilter }[] = [
  { label: '全部行程', value: 'all' },
  { label: '已收藏', value: 'saved' },
  { label: '待出发', value: 'upcoming' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
];

const statusMeta: Record<TodoStatus, { label: string; color: string; className: string }> = {
  pending: { label: '待出发', color: 'gold', className: 'is-pending' },
  in_progress: { label: '进行中', color: 'processing', className: 'is-progress' },
  completed: { label: '已完成', color: 'success', className: 'is-completed' },
  cancelled: { label: '已取消', color: 'default', className: 'is-cancelled' },
};

const tripsCss = `
.pc-trips-page {
  min-height: calc(100dvh - 76px);
  padding: 58px 56px 88px;
  color: #f7f7f2;
  background:
    radial-gradient(circle at 8% 8%, rgba(168, 216, 64, .15), transparent 30%),
    radial-gradient(circle at 92% 12%, rgba(72, 173, 255, .14), transparent 32%),
    linear-gradient(145deg, #111419 0%, #101018 48%, #111712 100%);
  background-attachment: fixed;
}
.pc-trips-page::before { content: ''; position: fixed; inset: 0; pointer-events: none; opacity: .22; background-image: radial-gradient(rgba(255,255,255,.28) .7px, transparent .7px); background-size: 18px 18px; mask-image: linear-gradient(to bottom, black, transparent 72%); }
.pc-trips-container { position: relative; z-index: 1; width: min(1280px, 100%); margin: 0 auto; }
.pc-trips-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; margin-bottom: 38px; }
.pc-trips-title.ant-typography { margin: 0; color: #f7f7f2; font-size: clamp(40px, 4vw, 62px); font-weight: 900; line-height: 1.04; letter-spacing: -.045em; }
.pc-trips-subtitle.ant-typography { display: block; margin-top: 14px; color: rgba(255,255,255,.58); font-size: 16px; }
.pc-trips-create.ant-btn { height: 52px; padding-inline: 24px; border: 0; border-radius: 999px; color: #111419; background: #c9ff62; box-shadow: 0 12px 34px rgba(201,255,98,.18); font-weight: 850; }
.pc-trips-create.ant-btn:hover { color: #111419 !important; background: #dcff9b !important; transform: translateY(-2px); }
.pc-trips-edit.ant-btn { height: 52px; padding-inline: 22px; border-color: rgba(255,255,255,.2); border-radius: 999px; color: rgba(255,255,255,.82); background: rgba(255,255,255,.055); font-weight: 800; }
.pc-trips-edit.ant-btn:hover, .pc-trips-edit.is-active { color: #c9ff62 !important; border-color: #c9ff62 !important; background: rgba(201,255,98,.08) !important; }
.pc-trips-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.pc-trips-segmented.ant-segmented { width: min(540px, 100%); padding: 5px; border: 1px solid rgba(255,255,255,.1); border-radius: 999px; background: rgba(255,255,255,.055); box-shadow: inset 0 1px 0 rgba(255,255,255,.05); }
.pc-trips-segmented .ant-segmented-group { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); width: 100%; }
.pc-trips-segmented .ant-segmented-item { min-width: 0; min-height: 36px; padding-inline: 0; border-radius: 999px; color: rgba(255,255,255,.58); font-size: 13px; font-weight: 600; text-align: center; }
.pc-trips-segmented .ant-segmented-item-label { display: flex; align-items: center; justify-content: center; width: 100%; }
.pc-trips-segmented .ant-segmented-item-selected { color: #10130d; background: #c9ff62; box-shadow: none; font-weight: 900; }
.pc-trips-summary { color: rgba(255,255,255,.46); font-size: 13px; }
.pc-trips-summary b { color: #c9ff62; font-weight: 800; }
.pc-trips-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.pc-saved-card{min-height:250px;overflow:hidden;border:1px solid rgba(255,255,255,.15);border-radius:26px;display:grid;grid-template-columns:minmax(280px,34%) minmax(0,1fr);background:rgba(8,9,11,.9);box-shadow:0 20px 56px rgba(0,0,0,.24);transition:border-color .28s ease,transform .3s cubic-bezier(.2,.8,.2,1),box-shadow .3s ease}.pc-saved-card:hover{border-color:rgba(201,255,98,.64);transform:translateY(-4px);box-shadow:0 25px 62px rgba(0,0,0,.36),0 0 30px rgba(201,255,98,.08)}.pc-saved-card-media{position:relative;min-height:250px;overflow:hidden;background:linear-gradient(145deg,#20291d,#101519)}.pc-saved-card-media img{width:100%;height:100%;display:block;object-fit:cover;transition:transform .5s ease}.pc-saved-card:hover .pc-saved-card-media img{transform:scale(1.035)}.pc-saved-card-media::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 42%,rgba(5,7,6,.72))}.pc-saved-card-media span{position:absolute;z-index:1;left:22px;bottom:20px;padding:8px 12px;border:1px solid rgba(201,255,98,.45);border-radius:999px;color:#e5ffc0;background:rgba(8,10,9,.7);font-size:11px;font-weight:850;backdrop-filter:blur(12px)}.pc-saved-card-content{min-width:0;padding:30px 34px;display:flex;flex-direction:column;justify-content:center}.pc-saved-card-content small{color:#c9ff62;font:800 10px/1 ui-monospace,monospace;letter-spacing:.14em}.pc-saved-card-content h3{margin:13px 0 9px;color:#f7f7f2;font-size:clamp(26px,2.1vw,36px);line-height:1.15;letter-spacing:-.035em}.pc-saved-card-content p{margin:0;color:rgba(255,255,255,.48);font-size:14px}.pc-saved-card-content .ant-btn{align-self:flex-start;height:48px;margin-top:25px;padding-inline:23px;border:0;border-radius:999px;color:#11150d;background:#c9ff62;font-weight:900}.pc-saved-card-content .ant-btn:hover{color:#11150d!important;background:#dcff9b!important}
.pc-trip-card.ant-card { position: relative; overflow: hidden; min-height: 540px; border: 1px solid rgba(223,228,216,.95); border-radius: 24px; background: #fbfcf8; box-shadow: 0 18px 44px rgba(0,0,0,.18); transition: transform .28s cubic-bezier(.2,.8,.2,1), border-color .28s ease, box-shadow .28s ease; animation: trip-card-in .55s both; }
.pc-trip-card.ant-card:nth-child(2) { animation-delay: .07s; }.pc-trip-card.ant-card:nth-child(3) { animation-delay: .14s; }.pc-trip-card.ant-card:nth-child(4) { animation-delay: .21s; }
.pc-trip-card.ant-card::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(120deg, transparent 25%, rgba(201,255,98,.06), transparent 70%); transform: translateX(-110%); transition: transform .65s ease; }
.pc-trip-card.ant-card:hover { transform: translateY(-7px); border-color: rgba(201,255,98,.42); box-shadow: 0 24px 54px rgba(0,0,0,.32); }.pc-trip-card.ant-card:hover::after { transform: translateX(110%); }
.pc-trip-card .ant-card-body { display: flex; flex-direction: column; height: 100%; min-height: 540px; padding: 0; }
.pc-trip-cover { position: relative; flex: 0 0 auto; height: 220px; overflow: hidden; background: radial-gradient(circle at 72% 28%, color-mix(in srgb, var(--trip-accent) 55%, transparent), transparent 34%), linear-gradient(145deg,#2b3930,#17202a); }
.pc-trip-cover img { width: 100%; height: 100%; display: block; object-fit: cover; transition: transform .65s cubic-bezier(.2,.8,.2,1); }.pc-trip-card:hover .pc-trip-cover img { transform: scale(1.055); }
.pc-trip-cover-placeholder { width: 100%; height: 100%; display: grid; place-items: center; color: rgba(255,255,255,.2); font-size: 36px; font-weight: 900; letter-spacing: -.04em; }
.pc-trip-cover-shade { position: absolute; inset: 0; background: linear-gradient(180deg,rgba(4,7,8,.06),rgba(7,9,12,.58)); }
.pc-trip-date { position: absolute; left: 18px; bottom: 18px; z-index: 1; display: inline-flex; flex-direction: column; align-items: flex-start; justify-content: center; width: 70px; height: 66px; padding-left: 13px; border: 1px solid rgba(201,255,98,.36); border-radius: 14px; color: #c9ff62; background: rgba(10,13,15,.7); box-shadow: 0 10px 26px rgba(0,0,0,.24); backdrop-filter: blur(13px); }
.pc-trip-date span { font-size: 11px; font-weight: 750; line-height: 1.1; }.pc-trip-date b { margin-top: 4px; font: 900 25px/1 ui-monospace,SFMono-Regular,Menlo,monospace; }
.pc-trip-mobile-corner-meta { display: none; }
.pc-trips-mobile-menu { display: none; }
.pc-trip-cover-actions { position: absolute; top: 17px; right: 14px; z-index: 2; }
.pc-trip-status.ant-tag { display: inline-flex; align-items: center; gap: 7px; height: 30px; margin: 0; padding: 0 12px; border: 1px solid rgba(255,255,255,.16); border-radius: 999px; color: #fff; background: rgba(10,13,15,.68); box-shadow: 0 8px 22px rgba(0,0,0,.18); font-size: 12px; font-weight: 750; line-height: 28px; backdrop-filter: blur(12px); }
.pc-trip-status i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; box-shadow: 0 0 10px currentColor; }
.pc-trip-status.is-pending { color: #f4d277; }.pc-trip-status.is-progress { color: #84c8ff; }.pc-trip-status.is-completed { color: #c9ff62; }.pc-trip-status.is-cancelled { color: #aaaab3; }
.pc-trip-overflow.ant-btn { width: 30px; height: 30px; color: #fff; background: rgba(10,13,15,.68); backdrop-filter: blur(12px); }
.pc-trip-content { display: flex; flex: 1; flex-direction: column; padding: 27px 26px 25px; }
.pc-trip-title.ant-typography { margin: 0 0 10px; color: #171c18; font-size: 25px; font-weight: 900; line-height: 1.35; letter-spacing: .01em; }
.pc-trip-summary.ant-typography { display: -webkit-box; min-height: 52px; margin: 0; overflow: hidden; color: #626a63; font-size: 16px; line-height: 26px; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.pc-trip-meta { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 13px 16px; margin-top: 22px; padding-top: 20px; border-top: 1px solid #e2e7dd; color: #555e57; font-size: 14px; font-weight: 600; }.pc-trip-meta-item:last-child { grid-column: 1 / -1; }
.pc-trip-meta-item { position: relative; display: flex; align-items: center; gap: 7px; min-width: 0; }
.pc-trip-meta-item svg { color: #6f9821; }
.pc-trip-meta-item span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pc-trip-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 19px; }
.pc-trip-detail.ant-btn { padding: 0; color: #567c16; font-size: 15px; font-weight: 850; }.pc-trip-detail.ant-btn:hover { color: #38550b !important; }
.pc-trip-start.ant-btn { height: 40px; padding-inline: 18px; border: 0; border-radius: 999px; color: #10130d; background: #c9ff62; box-shadow: none; font-size: 14px; font-weight: 850; }
.pc-trip-countdown { margin-left: auto; min-width: 190px; height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: 0 22px; border: 1px solid rgba(201,255,98,.42); border-radius: 999px; color: #dfffaa; background: rgba(201,255,98,.07); font-size: 14px; font-weight: 800; letter-spacing: .01em; }
.pc-trip-countdown b { margin: 0 4px; color: #c9ff62; font: 900 18px/1 ui-monospace,monospace; }
.pc-trip-countdown.is-expired { border-color: rgba(244,210,119,.34); color: #f4d277; background: rgba(244,210,119,.055); }
.pc-trip-delete.ant-btn { height: 40px; padding-inline: 18px; border-radius: 999px; font-size: 14px; font-weight: 800; }
.pc-trips-empty.ant-empty { margin: 0; padding: 72px 24px; border: 1px dashed rgba(201,255,98,.24); border-radius: 22px; background: rgba(255,255,255,.035); }.pc-trips-empty .ant-empty-description { color: rgba(255,255,255,.58); font-size: 17px; }.pc-trips-empty .ant-empty-image { height: 190px; margin-bottom: 20px; }.pc-trips-empty .ant-empty-image img { width: 190px; height: 190px; object-fit: contain; }.pc-trips-empty .ant-btn { height: 52px; padding-inline: 26px; border-radius: 999px; font-size: 16px; font-weight: 850; }
.pc-trips-loading { display: grid; min-height: 280px; place-items: center; border: 1px solid rgba(255,255,255,.1); border-radius: 22px; background: rgba(255,255,255,.035); }.pc-trips-loading .ant-spin-text { color: rgba(255,255,255,.6); }
@keyframes trip-card-in { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
@media (max-width: 1100px) { .pc-trips-page { padding-inline: 28px; } .pc-trips-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 680px) { .pc-trips-page { padding: 30px 16px 48px; } .pc-trips-heading, .pc-trips-toolbar { align-items: flex-start; flex-direction: column; } .pc-trips-create { width: 100%; } .pc-trips-segmented { width: 100%; overflow-x: auto; } .pc-trips-grid { grid-template-columns: 1fr; } .pc-trips-title.ant-typography { font-size: 26px; } }
@media (prefers-reduced-motion: reduce) { .pc-trip-card.ant-card { animation: none; transition: none; }.pc-trip-card.ant-card:hover { transform: none; }.pc-trip-card.ant-card::after { display: none; } }

/* Dark editorial trip archive: visually continuous with the landing experience. */
.pc-trips-container { width: min(1380px, 100%); }
.pc-trips-heading { margin-bottom: 46px; }
.pc-trips-title.ant-typography { font-size: clamp(54px, 5.6vw, 92px); line-height: .96; }
.pc-trips-subtitle.ant-typography { margin-top: 18px; font-size: 17px; }
.pc-trips-grid { grid-template-columns: 1fr; gap: 20px; }
.pc-trip-card.ant-card {
  min-height: 310px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 26px;
  color: #f7f7f2;
  background: rgba(8,9,11,.92);
  box-shadow: 0 20px 56px rgba(0,0,0,.24);
  cursor: pointer;
}
.pc-trip-card.ant-card:hover { border-color: #c9ff62; box-shadow: 0 0 0 1px rgba(201,255,98,.2), 0 26px 64px rgba(0,0,0,.38), 0 0 34px rgba(201,255,98,.1); }
.pc-trip-card.ant-card:has(.pc-trip-status.is-pending) { border-color: rgba(201,255,98,.42); }
.pc-trip-card.ant-card:has(.pc-trip-status.is-progress) { border-color: rgba(132,200,255,.42); }
.pc-trip-card.ant-card:has(.pc-trip-status.is-completed) { opacity: .78; filter: saturate(.72); }
.pc-trip-card .ant-card-body { display: grid; grid-template-columns: minmax(320px, 38%) minmax(0, 1fr); min-height: 310px; height: auto; }
.pc-trip-cover { height: 310px; min-height: 310px; border-right: 1px solid rgba(255,255,255,.12); }
.pc-trip-cover-shade { background: linear-gradient(180deg,rgba(4,7,8,.02),rgba(7,9,12,.62)); }
.pc-trip-content { min-width: 0; min-height: 310px; padding: 34px 38px 30px; }
.pc-trip-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 22px; }
.pc-trip-title-row .pc-trip-status.ant-tag { flex: 0 0 auto; height: 38px; padding-inline: 16px; color: #c9ff62 !important; border-color: rgba(201,255,98,.58) !important; background: #171b13 !important; box-shadow: 0 0 18px rgba(201,255,98,.1); font-size: 14px; font-weight: 850; line-height: 36px; }
.pc-trip-title-row .pc-trip-status.is-pending { color: #f4d277 !important; border-color: rgba(244,210,119,.5) !important; background: #1c1910 !important; }
.pc-trip-title-row .pc-trip-status.is-progress { color: #84c8ff !important; border-color: rgba(132,200,255,.54) !important; background: #101820 !important; }
.pc-trip-title-row .pc-trip-status.is-completed { color: #c9ff62 !important; }
.pc-trip-title.ant-typography { max-width: 820px; margin-bottom: 12px; color: #f7f7f2; font-size: clamp(27px, 2.1vw, 38px); line-height: 1.16; letter-spacing: -.035em; }
.pc-trip-summary.ant-typography { min-height: auto; color: rgba(255,255,255,.58); font-size: 16px; }
.pc-trip-meta { grid-template-columns: repeat(3,minmax(0,1fr)); margin-top: 25px; padding-top: 22px; border-color: rgba(255,255,255,.12); color: rgba(255,255,255,.66); }
.pc-trip-meta-item:last-child { grid-column: auto; }
.pc-trip-meta-item svg { color: #c9ff62; }
.pc-trip-actions { padding-top: 24px; }
.pc-trip-detail.ant-btn { color: #c9ff62; }
.pc-trip-detail.ant-btn:hover { color: #dcff9b !important; }
.pc-trip-start.ant-btn { height: 44px; padding-inline: 22px; }
.pc-trip-date { top: 22px; bottom: auto; left: 22px; width: 94px; height: 88px; padding-left: 17px; border-radius: 18px; }
.pc-trip-date span { font-size: 13px; }
.pc-trip-date b { margin-top: 6px; font-size: 34px; }
.pc-trip-meta { grid-template-columns: repeat(4,minmax(0,1fr)); gap: 10px; }
.pc-trip-meta-item { min-height: 76px; padding: 14px 15px; align-items: flex-start; border: 1px solid rgba(255,255,255,.1); border-radius: 15px; background: rgba(255,255,255,.035); }
.pc-trip-meta-item > div { min-width: 0; }
.pc-trip-meta-item small { display: block; margin-bottom: 8px; color: rgba(255,255,255,.38); font-size: 11px; font-weight: 750; letter-spacing: .08em; }
.pc-trip-meta-item strong { display: block; overflow: hidden; color: #f7f7f2; font-size: 16px; font-weight: 850; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
.pc-trip-date-edit{position:absolute;right:10px;top:10px;min-height:28px;padding:0 10px;border:1px solid rgba(201,255,98,.34);border-radius:999px;color:#dfffaa;background:rgba(201,255,98,.055);font-size:11px;font-weight:850;cursor:pointer;transition:border-color .2s ease,background .2s ease,color .2s ease}.pc-trip-date-edit:hover,.pc-trip-date-edit:focus-visible{border-color:#c9ff62;color:#11150d;background:#c9ff62;outline:0}.pc-trip-meta-item:has(.pc-trip-date-edit)>div{padding-right:48px}
.pc-trip-actions { justify-content: flex-start; margin-top: 22px; padding-top: 0; }
.pc-trip-start.ant-btn { margin-left: auto; }
.pc-trip-progress { grid-column: 1 / -1; margin: 0 28px 28px; padding: 24px 26px 22px; overflow: hidden; border: 1px solid rgba(201,255,98,.22); border-radius: 20px; background: linear-gradient(135deg,rgba(201,255,98,.075),rgba(132,200,255,.025)); animation: trip-progress-open .48s cubic-bezier(.2,.8,.2,1) both; }
.pc-trip-progress-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
.pc-trip-progress-head small { display: block; margin-bottom: 7px; color: rgba(255,255,255,.42); font-size: 11px; font-weight: 800; letter-spacing: .1em; }
.pc-trip-progress-head strong { color: #fff; font-size: 22px; }
.pc-trip-progress-head b { color: #c9ff62; font: 900 28px/1 ui-monospace,monospace; }
.pc-trip-progress-head-tools{display:flex;align-items:center;gap:13px}.pc-trip-progress-head-tools .pc-trip-progress-more.ant-btn{width:42px;min-width:42px;padding:0;border-radius:50%}
.pc-trip-progress-track { position: relative; display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 18px; }
.pc-trip-progress-track::before { content: ''; position: absolute; left: 19px; right: 19px; top: 18px; height: 2px; background: rgba(255,255,255,.12); }
.pc-trip-progress-track::after { content: ''; position: absolute; left: 19px; top: 18px; width: var(--trip-progress); height: 2px; background: #c9ff62; box-shadow: 0 0 14px rgba(201,255,98,.5); transition: width .42s cubic-bezier(.2,.8,.2,1); }
.pc-trip-progress-step { position: relative; z-index: 1; min-width: 0; }
.pc-trip-progress-step i { display: grid; place-items: center; width: 38px; height: 38px; margin-bottom: 12px; border: 2px solid rgba(255,255,255,.2); border-radius: 50%; color: rgba(255,255,255,.48); background: #0b0c0d; font: 850 13px/1 ui-monospace,monospace; }
.pc-trip-progress-step.is-current i, .pc-trip-progress-step.is-done i { color: #11150d; border-color: #c9ff62; background: #c9ff62; box-shadow: 0 0 18px rgba(201,255,98,.24); }
.pc-trip-progress-step span { display: block; color: rgba(255,255,255,.45); font-size: 12px; font-weight: 700; }
.pc-trip-progress-step strong { display: block; margin-top: 7px; overflow: hidden; color: rgba(255,255,255,.84); font-size: 18px; font-weight:850; line-height: 1.35; letter-spacing:-.015em; text-overflow: ellipsis; white-space: nowrap; }
.pc-trip-progress-step.is-current strong { color: #fff; font-size:20px; text-shadow:0 0 18px rgba(201,255,98,.1) }
.pc-trip-progress-action { display: flex; align-items:center; justify-content: flex-end; gap:10px; margin-top: 22px; }
.pc-trip-progress-nav.ant-btn,.pc-trip-progress-control.ant-btn,.pc-trip-progress-more.ant-btn{height:44px;margin:0;padding-inline:18px;border:1px solid rgba(255,255,255,.16);border-radius:999px;color:rgba(255,255,255,.76);background:rgba(255,255,255,.04);box-shadow:none;font-weight:800}.pc-trip-progress-nav.ant-btn{margin-right:auto;border-color:rgba(201,255,98,.28);color:#dfffaa;background:rgba(201,255,98,.055)}.pc-trip-progress-nav.ant-btn:hover,.pc-trip-progress-control.ant-btn:hover,.pc-trip-progress-more.ant-btn:hover{border-color:rgba(201,255,98,.62)!important;color:#dfffaa!important;background:rgba(201,255,98,.08)!important}.pc-trip-progress-control.ant-btn.is-paused{border-color:#c9ff62;color:#11150d;background:#c9ff62}.pc-trip-progress-action .ant-btn:disabled{border-color:rgba(255,255,255,.08)!important;color:rgba(255,255,255,.24)!important;background:rgba(255,255,255,.025)!important}
.pc-trip-progress-next.ant-btn { min-width:132px;height:44px;padding-inline:22px;border:0;border-radius:999px;color:#11150d;background:#c9ff62;box-shadow:0 10px 26px rgba(201,255,98,.15);font-weight:900}.pc-trip-progress-next.ant-btn:hover{color:#11150d!important;background:#dcff9b!important}.pc-trip-progress-menu .ant-dropdown-menu{min-width:178px;padding:8px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:#151819;box-shadow:0 22px 54px rgba(0,0,0,.48)}.pc-trip-progress-menu .ant-dropdown-menu-item{min-height:42px;padding:9px 12px;border-radius:10px;color:rgba(255,255,255,.72);font-weight:750}.pc-trip-progress-menu .ant-dropdown-menu-item:hover{color:#fff;background:rgba(201,255,98,.08)!important}.pc-trip-progress-menu .ant-dropdown-menu-item-danger{color:#ff9b8c!important}.pc-trip-progress-menu .ant-dropdown-menu-item-disabled{color:rgba(255,255,255,.22)!important}
.pc-trip-route-layout { display: grid; grid-template-columns: minmax(0,.9fr) minmax(360px,1.1fr); gap: 24px; }
.pc-trip-route-list { position: relative; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; padding: 8px 0; }
.pc-trip-route-list::before { content: ''; position: absolute; left: 21px; top: 30px; bottom: 30px; width: 2px; background: rgba(255,255,255,.12); }
.pc-trip-route-list::after { content: ''; position: absolute; left: 21px; top: 30px; width: 2px; height: var(--trip-progress); max-height: calc(100% - 60px); background: #c9ff62; box-shadow: 0 0 14px rgba(201,255,98,.46); transition: height .42s cubic-bezier(.2,.8,.2,1); }
.pc-trip-route-step { position: relative; z-index: 1; display: grid; grid-template-columns: 44px minmax(0,1fr); align-items: center; gap: 16px; min-height: 68px; padding: 9px 14px 9px 0; border: 1px solid transparent; border-radius: 16px; transition: background .3s ease, border-color .3s ease, opacity .3s ease; }
.pc-trip-route-step i { display: grid; place-items: center; width: 44px; height: 44px; border: 2px solid rgba(255,255,255,.2); border-radius: 50%; color: rgba(255,255,255,.48); background: #0b0c0d; font: 850 13px/1 ui-monospace,monospace; }
.pc-trip-route-step span { display: block; margin-bottom: 5px; color: rgba(255,255,255,.4); font-size: 11px; font-weight: 800; letter-spacing: .08em; }
.pc-trip-route-step strong { display: block; color: rgba(255,255,255,.68); font-size: 15px; line-height: 1.35; }
.pc-trip-route-step.is-done { opacity: .66; }
.pc-trip-route-step.is-done i, .pc-trip-route-step.is-current i { color: #10140d; border-color: #c9ff62; background: #c9ff62; }
.pc-trip-route-step.is-current { padding-left: 10px; border-color: rgba(201,255,98,.26); background: rgba(201,255,98,.065); }
.pc-trip-route-step.is-current strong { color: #fff; font-size: 17px; }
.pc-trip-current-step { display: flex; flex-direction: column; justify-content: center; min-height: 250px; padding: 28px 30px; border: 1px solid rgba(255,255,255,.12); border-radius: 19px; background: #0d0f0e; box-shadow: inset 0 1px rgba(255,255,255,.04); animation: current-step-in .42s cubic-bezier(.2,.8,.2,1) both; }
.pc-trip-current-step > small { color: #c9ff62; font: 850 10px/1 ui-monospace,monospace; letter-spacing: .13em; }
.pc-trip-current-step > span { margin-top: 22px; color: rgba(255,255,255,.42); font-size: 12px; font-weight: 800; }
.pc-trip-current-step h4 { max-width: 620px; margin: 8px 0 0; color: #fff; font-size: clamp(24px,2vw,34px); line-height: 1.12; letter-spacing: -.035em; }
.pc-trip-current-step p { margin: 15px 0 0; color: rgba(255,255,255,.48); font-size: 14px; }
.pc-trip-current-step .pc-trip-progress-action { margin-top: 28px; }
@keyframes current-step-in { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: none; } }
/* Equal three-stop progress: start, exact center, and end. */
.pc-trip-progress-track { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 0; padding: 3px 0 0; }
.pc-trip-progress-track::before, .pc-trip-progress-track::after { left: 22px; right: 22px; top: 24px; width: auto; height: 2px; }
.pc-trip-progress-track::after { transform: scaleX(var(--trip-progress-ratio)); transform-origin: left center; transition: transform .46s cubic-bezier(.2,.8,.2,1); }
.pc-trip-progress-step { display: flex; flex-direction: column; min-width: 0; align-items: flex-start; text-align: left; }
.pc-trip-progress-step:nth-child(2) { align-items: center; text-align: center; }
.pc-trip-progress-step:nth-child(3) { align-items: flex-end; text-align: right; }
.pc-trip-progress-step i { width: 46px; height: 46px; margin-bottom: 15px; border-width: 2px; background: #0b0d0c; font-size: 13px; }
.pc-trip-progress-step.is-done i { color: #c9ff62; border-color: #c9ff62; background: #0b0d0c; box-shadow: 0 0 18px rgba(201,255,98,.22); }
.pc-trip-progress-step.is-done i svg { width: 100%; height: 100%; display: block; }
.pc-trip-progress-step.is-current i { color: #c9ff62; border: 4px solid #c9ff62; background: #11150f; box-shadow: 0 0 0 5px rgba(201,255,98,.08), 0 0 24px rgba(201,255,98,.24); }
.pc-trip-current-dot { width: 14px; height: 14px; border-radius: 50%; background: #c9ff62; box-shadow: 0 0 12px rgba(201,255,98,.72); }
.pc-trip-progress-step span { color: rgba(255,255,255,.38); font-size: 11px; font-weight: 800; letter-spacing: .08em; }
.pc-trip-progress-step strong { width: min(360px,92%); margin-top: 8px; color: rgba(255,255,255,.82); font-size: 18px; font-weight:850; line-height: 1.35; letter-spacing:-.015em; white-space: normal; }
.pc-trip-progress-step.is-current span { color: #c9ff62; }
.pc-trip-progress-step.is-current strong { color: #fff; font-size: 20px; }
.pc-trip-progress-action { margin-top: 26px; }
@keyframes trip-progress-open { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: none; } }

/* Four equal navigation states: the selected pill fills one complete quarter. */
.pc-trips-segmented.ant-segmented { width: min(760px, 100%); padding: 5px; }
.pc-trips-segmented .ant-segmented-group { display: flex !important; width: 100%; align-items: stretch; }
.pc-trips-segmented .ant-segmented-item { display: flex; flex: 1 1 20%; width: 20%; min-width: 0; min-height: 52px; align-items: center; justify-content: center; padding: 0 !important; border-radius: 999px; font-size: 16px; font-weight: 720; line-height: 1; }
.pc-trips-segmented .ant-segmented-item-label { width: 100%; min-height: 52px; display: flex; align-items: center; justify-content: center; padding: 0 18px; text-align: center; line-height: 1; }
.pc-trips-segmented .ant-segmented-item-selected { font-weight: 900; }
.pc-trips-segmented .ant-segmented-thumb { border-radius: 999px; background: #c9ff62; box-shadow: 0 0 20px rgba(201,255,98,.14); }

@media (max-width: 900px) {
  .pc-trip-card .ant-card-body { grid-template-columns: 300px minmax(0,1fr); }
  .pc-trip-meta { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .pc-trip-meta-item:last-child { grid-column: 1 / -1; }
  .pc-trip-route-layout { grid-template-columns: 1fr; }
  .pc-trip-current-step { min-height: 220px; }
}

@media (max-width: 680px) {
  .pc-trips-title.ant-typography { font-size: 42px; }
  .pc-trip-card .ant-card-body { display: flex; min-height: 0; }
  .pc-trip-cover { height: 220px; min-height: 220px; border-right: 0; border-bottom: 1px solid rgba(255,255,255,.12); }
  .pc-trip-content { padding: 26px 22px 22px; }
  .pc-trip-progress { margin: 0 16px 16px; }
  .pc-trip-title.ant-typography { font-size: 27px; }
  .pc-trips-segmented .ant-segmented-item, .pc-trips-segmented .ant-segmented-item-label { min-height: 46px; font-size: 13px; }
  .pc-saved-card{grid-template-columns:1fr}.pc-saved-card-media{min-height:210px}.pc-saved-card-content{padding:24px 22px}
  .pc-trip-progress-step strong,.pc-trip-progress-step.is-current strong{font-size:14px;line-height:1.4}
  .pc-trip-progress-action{display:grid;grid-template-columns:1fr 1fr}.pc-trip-progress-nav.ant-btn{grid-column:1/-1;width:100%}.pc-trip-progress-next.ant-btn{width:100%}
}

.pc-trip-schedule-modal .ant-modal-container{padding:0!important;overflow:hidden!important;border:1px solid rgba(201,255,98,.25)!important;border-radius:28px!important;background:linear-gradient(145deg,#141718,#0a0c0d)!important;box-shadow:0 36px 110px rgba(0,0,0,.66),0 0 42px rgba(201,255,98,.08)!important}.pc-trip-schedule-modal .ant-modal-container::before{content:'';position:absolute;inset:0 0 auto;height:3px;background:#c9ff62;box-shadow:0 0 22px rgba(201,255,98,.38)}.pc-trip-schedule-modal .ant-modal-header{margin:0;padding:34px 34px 0;background:transparent!important}.pc-trip-schedule-modal .ant-modal-title{color:#fff!important}.pc-trip-schedule-title small{display:block;margin-bottom:9px;color:#c9ff62;font:800 9px/1 ui-monospace,monospace;letter-spacing:.15em}.pc-trip-schedule-title strong{display:block;color:#fff;font-size:28px;line-height:1.15}.pc-trip-schedule-copy{margin:0 0 17px;color:rgba(255,255,255,.45);font-size:13px;line-height:1.6}.pc-trip-schedule-modal .ant-modal-body{padding:18px 34px 30px}.pc-trip-schedule-modal .ant-modal-footer{display:flex;justify-content:flex-end;gap:10px;margin:0;padding:20px 34px 28px;border-top:1px solid rgba(255,255,255,.1)}.pc-trip-schedule-modal .ant-modal-close{top:26px;right:27px;width:42px;height:42px;border:1px solid rgba(255,255,255,.14);border-radius:50%;color:rgba(255,255,255,.58);background:rgba(255,255,255,.035);box-shadow:none!important}.pc-trip-schedule-modal .ant-modal-close:hover{border-color:rgba(201,255,98,.62);color:#c9ff62;background:rgba(201,255,98,.07)}.pc-trip-schedule-modal .ant-btn{height:48px;margin:0!important;padding-inline:24px;border-radius:999px;font-weight:850}.pc-trip-schedule-modal .ant-btn-default{border-color:rgba(255,255,255,.18)!important;color:rgba(255,255,255,.76)!important;background:rgba(255,255,255,.045)!important;box-shadow:none!important}.pc-trip-schedule-modal .ant-btn-default:hover{border-color:rgba(201,255,98,.54)!important;color:#dfffaa!important;background:rgba(201,255,98,.07)!important}.pc-trip-schedule-modal .ant-btn-primary{min-width:126px;border-color:#c9ff62!important;color:#11150d!important;background:#c9ff62!important;box-shadow:0 10px 26px rgba(201,255,98,.15)!important}.pc-trip-schedule-modal .ant-btn-primary:hover{background:#dcff9b!important}.pc-trip-schedule-modal .ant-btn-primary:disabled{opacity:.42!important}

.pc-trip-feedback-modal .ant-modal-mask { background: rgba(3,5,6,.76)!important; backdrop-filter: blur(9px); }
.pc-trip-feedback-modal .ant-modal-container { position: relative; padding: 0!important; overflow: hidden!important; border: 1px solid rgba(201,255,98,.28)!important; border-radius: 28px!important; background: linear-gradient(145deg,#141817,#090b0c)!important; box-shadow: 0 34px 110px rgba(0,0,0,.72),0 0 46px rgba(201,255,98,.08)!important; }
.pc-trip-feedback-modal .ant-modal-container::before { content: ''; position: absolute; inset: 0 0 auto; height: 3px; background: #c9ff62; box-shadow: 0 0 22px rgba(201,255,98,.4); }
.pc-trip-feedback-modal .ant-modal-header { margin: 0; padding: 34px 34px 0; background: transparent!important; }
.pc-trip-feedback-modal .ant-modal-title { color: #fff!important; }
.pc-trip-feedback-title small { display: block; margin-bottom: 10px; color: #c9ff62; font: 800 9px/1 ui-monospace,monospace; letter-spacing: .16em; }
.pc-trip-feedback-title strong { display: block; color: #fff; font-size: 28px; line-height: 1.15; }
.pc-trip-feedback-modal .ant-modal-body { padding: 18px 34px 28px; }
.pc-trip-feedback-copy { margin: 0 0 18px; color: rgba(255,255,255,.48); font-size: 14px; line-height: 1.6; }
.pc-trip-feedback-options { display: grid!important; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; width: 100%; }
.pc-trip-feedback-options .ant-radio-button-wrapper { display: flex; align-items: center; justify-content: center; height: 50px; padding: 0 14px; border: 1px solid rgba(255,255,255,.13)!important; border-radius: 15px!important; color: rgba(255,255,255,.68); background: rgba(255,255,255,.035)!important; box-shadow: none!important; font-size: 14px; font-weight: 800; }
.pc-trip-feedback-options .ant-radio-button-wrapper::before { display: none!important; }
.pc-trip-feedback-options .ant-radio-button-wrapper:hover { border-color: rgba(201,255,98,.5)!important; color: #dfffaa; background: rgba(201,255,98,.06)!important; }
.pc-trip-feedback-options .ant-radio-button-wrapper-checked { border-color: #c9ff62!important; color: #11150d!important; background: #c9ff62!important; }
.pc-trip-feedback-note.ant-input { min-height: 108px; margin-top: 14px; padding: 15px 16px; resize: vertical; border: 1px solid rgba(255,255,255,.13); border-radius: 16px; color: #f7f7f2; background: rgba(255,255,255,.035); box-shadow: none; }
.pc-trip-feedback-note.ant-input::placeholder { color: rgba(255,255,255,.27); }
.pc-trip-feedback-note.ant-input:hover,.pc-trip-feedback-note.ant-input:focus { border-color: rgba(201,255,98,.62); background: rgba(201,255,98,.035); box-shadow: 0 0 0 3px rgba(201,255,98,.06); }
.pc-trip-feedback-modal .ant-modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin: 0; padding: 20px 34px 28px; border-top: 1px solid rgba(255,255,255,.1); }
.pc-trip-feedback-modal .ant-modal-close { top: 26px; right: 27px; width: 42px; height: 42px; border: 1px solid rgba(255,255,255,.14); border-radius: 50%; color: rgba(255,255,255,.58); background: rgba(255,255,255,.035); }
.pc-trip-feedback-modal .ant-modal-close:hover { border-color: rgba(201,255,98,.62); color: #c9ff62; background: rgba(201,255,98,.07); }
.pc-trip-feedback-modal .ant-btn { height: 48px; margin: 0!important; padding-inline: 24px; border-radius: 999px; font-weight: 850; }
.pc-trip-feedback-modal .ant-btn-default { border-color: rgba(255,255,255,.18)!important; color: rgba(255,255,255,.76)!important; background: rgba(255,255,255,.045)!important; box-shadow: none!important; }
.pc-trip-feedback-modal .ant-btn-primary { min-width: 168px; border-color: #c9ff62!important; color: #11150d!important; background: #c9ff62!important; box-shadow: 0 10px 26px rgba(201,255,98,.15)!important; }
.pc-trip-feedback-modal .ant-btn-primary:disabled { opacity: .38!important; }
@media (max-width: 680px) { .pc-trip-feedback-modal .ant-modal { width: calc(100vw - 28px)!important; max-width: none; } .pc-trip-feedback-modal .ant-modal-header { padding: 28px 24px 0; } .pc-trip-feedback-modal .ant-modal-body { padding: 16px 24px 23px; } .pc-trip-feedback-modal .ant-modal-footer { padding: 17px 24px 23px; } .pc-trip-feedback-title strong { padding-right: 40px; font-size: 24px; } .pc-trip-feedback-options { grid-template-columns: 1fr 1fr; } .pc-trip-feedback-options .ant-radio-button-wrapper { height: 46px; padding-inline: 8px; font-size: 13px; } }

/* Shared first-level page frame: aligned to the landing page's 7.4vw content edge. */
.pc-trip-cover { isolation: isolate; line-height: 0; }
.pc-trip-cover img { position: absolute; z-index: 0; inset: 0; width: 100%; height: 100%; min-height: 100%; object-fit: cover; }
.pc-trip-cover-shade { display: none; }
.pc-trip-date,.pc-trip-cover-actions { z-index: 2; }
.pc-trips-page { padding: 64px 7.4vw 96px; }
.pc-trips-container { width: 100%; max-width: none; }
.pc-trips-heading { justify-content: flex-end; margin-bottom: 22px; }
.pc-trips-toolbar { align-items: center; margin-bottom: 24px; }
.pc-trips-segmented.ant-segmented { width: min(680px,55%); height: 56px; padding: 5px; }
.pc-trips-segmented .ant-segmented-group { height: 100%; }
.pc-trips-segmented .ant-segmented-item,.pc-trips-segmented .ant-segmented-item-label { min-height: 46px; line-height: 46px; }
.pc-trips-toolbar-actions.ant-space { flex: 0 0 auto; align-items: center; }
.pc-trips-toolbar-actions .ant-btn { height: 56px; }
.pc-trips-refresh.ant-btn { width: 56px; padding: 0; border: 1px solid rgba(255,255,255,.18); border-radius: 18px; color: rgba(255,255,255,.72); background: rgba(255,255,255,.045); }
.pc-trips-refresh.ant-btn:hover { color: #c9ff62 !important; border-color: rgba(201,255,98,.58) !important; background: rgba(201,255,98,.07) !important; }
.pc-trips-edit.ant-btn,.pc-trips-create.ant-btn { height: 56px; }

@media (max-width: 1023px) { .pc-trips-page { padding: 52px 6vw 80px; } }
@media (max-width: 900px) {
  .pc-trips-toolbar { align-items: stretch; flex-direction: column; }
  .pc-trips-segmented.ant-segmented { width: 100%; }
  .pc-trips-toolbar-actions.ant-space { width: 100%; justify-content: flex-end; }
}
@media (max-width: 680px) {
  .pc-trips-page { padding: 34px 16px 56px; }
  .pc-trips-toolbar-actions.ant-space { display: grid; grid-template-columns: 52px minmax(0,1fr) minmax(0,1.15fr); }
  .pc-trips-toolbar-actions .ant-space-item { min-width: 0; }
  .pc-trips-toolbar-actions .ant-btn { width: 100%; padding-inline: 10px; }
  .pc-trips-refresh.ant-btn { width: 52px; }
}

/* Unified interactive-card hover. */
.pc-trip-card.ant-card { transition: transform .34s cubic-bezier(.2,.8,.2,1),border-color .28s ease,box-shadow .34s ease; }
.pc-trip-card.ant-card:hover,.pc-trip-card.ant-card:focus-within { transform: translateY(-6px) scale(1.01); border: 2px solid #c9ff62; box-shadow: 0 0 0 1px rgba(201,255,98,.18),0 26px 64px rgba(0,0,0,.42),0 0 30px rgba(201,255,98,.13); }
`;

function getErrorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : '行程暂时加载失败，请稍后重试。';
}

function dateParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { month: '行程', day: '--', compact: '-- / --' };
  const compactMonth = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return { month: `${date.getMonth() + 1} 月`, day, compact: `${compactMonth} / ${day}` };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '待定日期';
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(date);
}

function daysFromToday(value: string) {
  const target = Date.parse(`${value.slice(0, 10)}T00:00:00+08:00`);
  const today = Date.parse(`${chinaDate()}T00:00:00+08:00`);
  if (Number.isNaN(target)) return 0;
  return Math.round((target - today) / 86_400_000);
}

function formatDuration(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return '时间待定';
  return minutes < 60 ? `${minutes} 分钟` : `${Math.round((minutes / 60) * 10) / 10} 小时`;
}

function cleanTripTitle(value: string) {
  return value.replace(/\s*0[1-9]\s*$/, '').trim();
}

function matchesFilter(item: Todo, filter: TripFilter) {
  if (filter === 'all') return true;
  if (filter === 'upcoming') return item.status === 'pending';
  return item.status === filter;
}

function TripCard({
  activity,
  coverImageUri,
  item,
  isCompleting,
  isDeleting,
  isEditing,
  isStarting,
  onComplete,
  onDelete,
  onStart,
  onReschedule,
}: {
  activity?: Activity | null;
  coverImageUri?: string | null;
  item: Todo;
  isCompleting: boolean;
  isDeleting: boolean;
  isEditing: boolean;
  isStarting: boolean;
  onComplete: (item: Todo, early?: boolean) => void;
  onDelete: (item: Todo) => void;
  onStart: (item: Todo) => void;
  onReschedule: (item: Todo) => void;
}) {
  const router = useRouter();
  const [storedStep, setActiveStep] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const value = Number(window.localStorage.getItem(`lazyde:trip-step:${item.id}`));
    return Number.isFinite(value) && value >= 0 ? value : 0;
  });
  const detailHref = `/activity/${item.activityId}?plannedDate=${encodeURIComponent(item.scheduledDate)}&plannedTime=${encodeURIComponent(item.scheduledTime ?? "")}` as const;
  const status = statusMeta[item.status];
  const displayTitle = cleanTripTitle(item.title);
  const date = dateParts(item.scheduledDate || item.createdAt);
  const effectiveCoverImageUri = coverImageUri || resolveCuratedActivityCover(item);
  const progressSteps = activity?.steps?.length
    ? activity.steps
    : ['按导航前往目的地', '完成今天的核心体验', '留下一张照片或一句感受'];
  const activeStep = Math.min(storedStep, Math.max(0, progressSteps.length - 1));
  const [paused, setPaused] = useState(() => { try { return typeof window !== 'undefined' && window.localStorage.getItem(`lazyde:trip-paused:${item.id}`) === 'yes'; } catch { return false; } });
  const [skipped, setSkipped] = useState<number[]>(() => { try { const value = typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem(`lazyde:trip-skipped:${item.id}`) ?? '[]') : []; return Array.isArray(value) ? value.filter(Number.isInteger) : []; } catch { return []; } });
  const currentStop = activity?.itinerary?.stops[Math.min(activeStep, progressSteps.length - 1)];
  const currentNavigation = currentStop?.navigationUrl ?? item.navigationUrl;
  const [progressReady, setProgressReady] = useState(false);
  const [progressError, setProgressError] = useState('');
  const lastProgress = useRef('');
  const progressQueue = useRef(Promise.resolve());

  useEffect(() => {
    if (item.status !== 'in_progress') return;
    let cancelled = false;
    void getTripProgress(item.id).then((progress) => {
      if (cancelled) return;
      lastProgress.current = JSON.stringify(progress);
      setActiveStep(progress.activeStep); setPaused(progress.paused); setSkipped(progress.skipped);
      setProgressReady(true); setProgressError('');
    }).catch(() => { if (!cancelled) setProgressError('行程进度加载失败，请刷新后重试。'); });
    return () => { cancelled = true; };
  }, [item.id, item.status]);

  useEffect(() => {
    if (!progressReady || item.status !== 'in_progress') return;
    const progress = {activeStep, paused, skipped};
    const snapshot = JSON.stringify(progress);
    if (snapshot !== lastProgress.current) {
      lastProgress.current = snapshot;
      progressQueue.current = progressQueue.current.then(async () => {
        try { await saveTripProgress(item.id, progress); setProgressError(''); }
        catch { setProgressError('进度同步失败，请保持页面打开并重试操作。'); }
      });
    }
    try {
      window.localStorage.setItem(`lazyde:trip-step:${item.id}`, String(activeStep));
      window.localStorage.setItem(`lazyde:trip-paused:${item.id}`, paused ? 'yes' : 'no');
      window.localStorage.setItem(`lazyde:trip-skipped:${item.id}`, JSON.stringify(skipped));
    } catch {}
  }, [activeStep, item.id, item.status, paused, skipped, progressReady]);
  function downloadCalendar() {
    const text = calendarText({ id: item.id, title: item.title, date: item.scheduledDate, days: activity?.itinerary?.daysCount ?? 1, address: item.address, description: item.summary });
    const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `trip-${item.id}.ics`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const menuItems: MenuProps['items'] = [
    { key: 'detail', label: '查看详情', icon: <ArrowRightOutlined /> },
    { key: 'calendar', label: '添加到日历', icon: <CalendarOutlined /> },
  ];
  const progressMenu: MenuProps = {
    items: [
      { key: 'previous', label: '回到上一步', disabled: activeStep === 0 },
      { key: 'skip', label: '跳过当前步骤', disabled: paused },
      { type: 'divider' },
      { key: 'end', label: '提前结束行程', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'previous') setActiveStep(Math.max(0, activeStep - 1));
      if (key === 'skip') {
        setSkipped((values) => [...new Set([...values, activeStep])]);
        if (activeStep === progressSteps.length - 1) onComplete(item, true);
        else setActiveStep(activeStep + 1);
      }
      if (key === 'end') onComplete(item, true);
    },
  };

  return (
    <Card
      className="pc-trip-card"
      role="link"
      tabIndex={0}
      variant="borderless"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('button, a, [role="menuitem"]')) return;
        router.push(detailHref);
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' || event.target !== event.currentTarget) return;
        router.push(detailHref);
      }}>
      <div className="pc-trip-cover" style={{ '--trip-accent': item.accentColor || '#c9ff62' } as CSSProperties}>
        {effectiveCoverImageUri ? <img alt={`${displayTitle}场景图`} src={effectiveCoverImageUri} /> : <div className="pc-trip-cover-placeholder"><span>{item.cityName || '周末出发'}</span></div>}
        <div className="pc-trip-cover-shade" />
        <div className="pc-trip-date"><span>{date.month}</span><b>{date.day}</b></div>
        <div className="pc-trip-mobile-corner-meta">
          <time>{date.compact}</time>
          <span className={`pc-trip-mobile-status ${status.className}`}><i />{status.label}</span>
        </div>
        <Space className="pc-trip-cover-actions" size={7} align="start">
          <Dropdown menu={{ items: menuItems, onClick: ({ key }) => { if (key === 'detail') router.push(detailHref); if (key === 'calendar') downloadCalendar(); } }} trigger={['click']}>
            <Button aria-label="行程更多操作" className="pc-trip-overflow" icon={<MoreOutlined />} type="text" />
          </Dropdown>
        </Space>
      </div>
      <div className="pc-trip-content">
        <div className="pc-trip-title-row">
          <Title className="pc-trip-title" level={4}>{displayTitle}</Title>
          <Tag className={`pc-trip-status ${status.className}`} color={status.color}><i />{status.label}</Tag>
        </div>
        <Paragraph className="pc-trip-summary">{item.summary || '一场为你准备的城市探索，随时出发。'}</Paragraph>
        <div className="pc-trip-meta">
          <div className="pc-trip-meta-item"><CalendarOutlined /><div><small>日期</small><strong>{formatDate(item.scheduledDate || item.createdAt)}</strong></div>{item.status === 'pending' ? <button className="pc-trip-date-edit" type="button" onClick={() => onReschedule(item)}>改期</button> : null}</div>
          <div className="pc-trip-meta-item"><EnvironmentOutlined /><div><small>地点</small><strong>{[item.cityName, item.district || item.address].filter(Boolean).join(' · ') || '待定'}</strong></div></div>
          <div className="pc-trip-meta-item"><ClockCircleOutlined /><div><small>时长</small><strong>{formatDuration(item.durationMinutes)}</strong></div></div>
          <div className="pc-trip-meta-item"><DollarOutlined /><div><small>预算</small><strong>{item.budgetYuan ? `¥${item.budgetYuan}` : '待定'}</strong></div></div>
        </div>
        <div className="pc-trip-actions">
          {isEditing ? (
            <Popconfirm title="删除这条行程？" description="删除后将从我的行程中移除。" okText="删除" cancelText="保留" okButtonProps={{ danger: true }} onConfirm={() => onDelete(item)}>
              <Button className="pc-trip-delete" danger icon={<DeleteOutlined />} loading={isDeleting}>删除行程</Button>
            </Popconfirm>
          ) : null}
          {!isEditing && item.status === 'pending' && daysFromToday(item.scheduledDate) > 0 ? <div className="pc-trip-countdown" aria-label={`距离出发还有 ${daysFromToday(item.scheduledDate)} 天`}>距离出发还有 <b>{daysFromToday(item.scheduledDate)}</b> 天</div> : null}
          {!isEditing && item.status === 'pending' && daysFromToday(item.scheduledDate) < 0 ? <div className="pc-trip-countdown is-expired">出发日期已过 · 请改期</div> : null}
          {!isEditing && item.status === 'pending' && daysFromToday(item.scheduledDate) === 0 ? <Button className="pc-trip-start" loading={isStarting} type="primary" onClick={() => onStart(item)}>开始行程</Button> : null}
          {/* An in-progress trip may only be completed from the final step below. */}
          {!isEditing && item.status === 'completed' ? <><Badge color="#78a927" text={<span style={{ color: 'rgba(255,255,255,.72)', fontSize: 14 }}>{item.feedbackVerdict === 'ended_early' ? '已提前结束' : item.feedbackVerdict ? '已完成并记录感受' : '已完成'}</span>} /><Button onClick={() => onComplete(item)}>记录 / 修改感受</Button></> : null}
        </div>
      </div>
      {item.status === 'in_progress' && !isEditing ? (
          <section className="pc-trip-progress" aria-label="行程执行进度">
            <div className="pc-trip-progress-head">
              <div><small>LIVE ROUTE</small><strong>{paused ? '行程已暂停' : '行程进行中'}</strong></div>
              <div className="pc-trip-progress-head-tools">
                <b>{String(activeStep + 1).padStart(2, '0')} / {String(progressSteps.length).padStart(2, '0')}</b>
                <Dropdown classNames={{ root: 'pc-trip-progress-menu' }} trigger={['click']} placement="bottomRight" menu={progressMenu}>
                  <Button disabled={!progressReady} aria-label="更多行程操作" className="pc-trip-progress-more" icon={<MoreOutlined />} />
                </Dropdown>
              </div>
            </div>
            <div className="pc-trip-progress-track" style={{ '--trip-progress-ratio': progressSteps.length <= 1 ? 1 : activeStep / (progressSteps.length - 1) } as CSSProperties}>
              {progressSteps.map((step, index) => (
                <div className={`pc-trip-progress-step${index < activeStep ? ' is-done' : ''}${index === activeStep ? ' is-current' : ''}`} key={`${item.id}-${step}`}>
                  <i>{index < activeStep ? (
                    <svg aria-hidden="true" viewBox="0 0 1024 1024">
                      <path d="M512 1024C229.216 1024 0 794.784 0 512S229.216 0 512 0s512 229.216 512 512-229.216 512-512 512z m-49.568-377.152l-146.496-148.224-96.512 92.256c70.208 37.76 168.64 106.816 252.896 213.696 59.52-111.936 243.008-340.896 332.256-361.28-14.4-57.728-22.56-166.016 0-223.872-183.04 120.704-342.144 427.424-342.144 427.424z" fill="currentColor" />
                    </svg>
                  ) : index === activeStep ? <span className="pc-trip-current-dot" /> : String(index + 1).padStart(2, '0')}</i>
                  <strong>{step}{skipped.includes(index) ? ' · 已跳过' : ''}</strong>
                </div>
              ))}
            </div>
            {currentStop ? <p style={{ color: '#b7c2ac', lineHeight: 1.8, margin: '16px 0' }}>{currentStop.day ? `第 ${currentStop.day} 天 · ` : ''}{currentStop.place ? `${currentStop.place} · ` : ''}约 {currentStop.minutes} 分钟<br />{currentStop.description}</p> : null}
            {progressError ? <div role="alert" style={{color:'#ff9b8c'}}>{progressError}<Button className="pc-trip-progress-control" onClick={() => {
              if (progressReady) {
                void saveTripProgress(item.id, {activeStep, paused, skipped}).then(() => setProgressError('')).catch(() => setProgressError('进度同步失败，请重试。'));
              } else {
                void getTripProgress(item.id).then((progress) => {lastProgress.current = JSON.stringify(progress); setActiveStep(progress.activeStep); setPaused(progress.paused); setSkipped(progress.skipped); setProgressReady(true); setProgressError('');}).catch(() => setProgressError('进度加载失败，请重试。'));
              }
            }}>重试同步</Button></div> : null}
            <div className="pc-trip-progress-action" inert={!progressReady}>
              {currentNavigation ? <Button className="pc-trip-progress-nav" icon={<EnvironmentOutlined />} onClick={() => window.open(currentNavigation, '_blank', 'noopener,noreferrer')}>打开当前地点导航</Button> : null}
              <Button className={`pc-trip-progress-control${paused ? ' is-paused' : ''}`} onClick={() => setPaused((value) => !value)}>{paused ? '继续行程' : '暂停'}</Button>
              <Button className="pc-trip-progress-next" disabled={paused} loading={isCompleting} onClick={() => {
                setSkipped((values) => values.filter((value) => value !== activeStep));
                if (activeStep >= progressSteps.length - 1) onComplete(item);
                else setActiveStep((value) => Math.min(value + 1, progressSteps.length - 1));
              }}>{activeStep >= progressSteps.length - 1 ? '完成行程' : '完成此步'}</Button>
            </div>
          </section>
        ) : null}
    </Card>
  );
}

export default function PcTripsScreen() {
  const router = useRouter();
  const { user } = useApp();
  const userId = user?.id;
  const [items, setItems] = useState<Todo[]>([]);
  const [savedItems, setSavedItems] = useState<Activity[]>([]);
  const [completionItem, setCompletionItem] = useState<Todo | null>(null);
  const [verdict, setVerdict] = useState<NonNullable<Todo['feedbackVerdict']> | null>(null);
  const [feeling, setFeeling] = useState('');
  const [scheduleItem, setScheduleItem] = useState<Todo | null>(null);
  const [newDate, setNewDate] = useState('');
  const [savingDate, setSavingDate] = useState(false);
  const [activities, setActivities] = useState<Record<number, Activity | null>>({});
  const [filter, setFilter] = useState<TripFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = useCallback(async (showRefresh = false) => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (showRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const nextItems = await getTodos(userId);
      setItems(nextItems);
      try { setSavedItems(await getSavedActivities(userId)); } catch { setError('收藏暂时加载失败，已安排的行程仍可查看。'); }
      const covers = await Promise.all(nextItems.map(async (item) => {
        try {
          const activity = await getActivity(item.activityId);
          return [item.activityId, activity] as const;
        } catch {
          return [item.activityId, null] as const;
        }
      }));
      setActivities(Object.fromEntries(covers));
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => {
    const timer = window.setTimeout(() => {
      void loadTrips();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadTrips]));

  const visibleItems = useMemo(() => items.filter((item) => item.status !== 'cancelled' && matchesFilter(item, filter)), [filter, items]);

  const handleStart = async (item: Todo) => {
    if (!userId) return;
    setStartingId(item.id);
    setError(null);
    try {
      await startTodo(item.id, userId);
      await loadTrips();
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setStartingId(null);
    }
  };

  const handleComplete = (item: Todo, early = false) => {
    setCompletionItem(item); setVerdict(early ? 'ended_early' : item.feedbackVerdict ?? null); setFeeling(item.feedbackNote ?? ''); setError(null);
  };
  const saveFeedback = async () => {
    const item = completionItem;
    if (!item || !verdict) return;
    if (!userId) return;
    setCompletingId(item.id);
    setError(null);
    try {
      await submitTripFeedback(item.id, verdict, feeling);
      setCompletionItem(null);
      await loadTrips();
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setCompletingId(null);
    }
  };
  const saveNewDate = async () => {
    if (!scheduleItem || !validDepartureDate(newDate)) return;
    const activity = activities[scheduleItem.activityId];
    const failure = activity ? departureFailure(activity, { departureMode: 'plan', departureDate: newDate }) : null;
    if (failure) { setError(failure); return; }
    setSavingDate(true);
    try { await scheduleTodo(scheduleItem.id, newDate, activity?.itinerary?.arrival); setScheduleItem(null); await loadTrips(); }
    catch (e) { setError(getErrorMessage(e)); }
    finally { setSavingDate(false); }
  };

  const handleDelete = async (item: Todo) => {
    if (!userId) return;
    setDeletingId(item.id);
    setError(null);
    try {
      await updateTodoStatus(item.id, 'cancelled', userId);
      await loadTrips();
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ConfigProvider theme={{ token: { borderRadius: radii.lg, colorPrimary: palette.primary, colorTextLightSolid: palette.ink, fontFamily: 'Inter, PingFang SC, Microsoft YaHei, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif' } }}>
      <main className="pc-trips-page">
        <style>{tripsCss}</style>
        <div className="pc-trips-container">
          <div className="pc-trips-toolbar">
            <Segmented className="pc-trips-segmented" options={filterOptions} value={filter} onChange={(value) => setFilter(value as TripFilter)} />
            <Dropdown classNames={{ root: 'pc-trips-manage-popup' }} trigger={['click']} placement="bottomRight" menu={{
              items: [
                { key: 'create', label: '创建新行程', icon: <PlusOutlined /> },
                { key: 'refresh', label: refreshing ? '正在刷新…' : '刷新行程', icon: <ReloadOutlined />, disabled: refreshing },
                { key: 'edit', label: isEditing ? '完成编辑' : '编辑行程', icon: <DeleteOutlined /> },
              ],
              onClick: ({ key }) => {
                if (key === 'create') router.push('/box/config');
                if (key === 'refresh') void loadTrips(true);
                if (key === 'edit') setIsEditing(value => !value);
              },
            }}>
              <Button className={`pc-trips-mobile-menu${isEditing ? ' is-editing' : ''}`} aria-label={isEditing ? '行程管理，编辑中' : '行程管理'} icon={<MoreOutlined />} />
            </Dropdown>
            <Space className="pc-trips-toolbar-actions" size={12}>
              <Button className="pc-trips-refresh" aria-label="刷新行程" icon={<ReloadOutlined />} loading={refreshing} onClick={() => void loadTrips(true)} />
              <Button className={`pc-trips-edit${isEditing ? ' is-active' : ''}`} icon={isEditing ? undefined : <DeleteOutlined />} size="large" onClick={() => setIsEditing((value) => !value)}>{isEditing ? '完成' : '编辑行程'}</Button>
              <Button className="pc-trips-create" icon={<PlusOutlined />} size="large" type="primary" onClick={() => router.push('/box/config')}>创建新行程</Button>
            </Space>
          </div>

          <div className="pc-trips-scroll-region" key={filter} role="region" aria-label="行程卡片列表" tabIndex={0}>
          {error ? <Alert closable description={error} title="加载失败" showIcon style={{ marginBottom: 16 }} type="error" /> : null}
          {loading ? <div className="pc-trips-loading"><Spin description="正在加载你的行程…" /></div> : null}
          {!loading && filter !== 'saved' && visibleItems.length > 0 ? <div className="pc-trips-grid">{visibleItems.map((item) => <TripCard activity={activities[item.activityId]} coverImageUri={activities[item.activityId]?.coverImageUri} isCompleting={completingId === item.id} isDeleting={deletingId === item.id} isEditing={isEditing} isStarting={startingId === item.id} item={item} key={item.id} onReschedule={(todo) => { setScheduleItem(todo); setNewDate(todo.scheduledDate >= chinaDate() ? todo.scheduledDate : chinaDate()); setError(null); }} onComplete={handleComplete} onDelete={(todo) => { void handleDelete(todo); }} onStart={(todo) => { void handleStart(todo); }} />)}</div> : null}
          {!loading && filter === 'saved' && savedItems.length ? <div className="pc-trips-grid">{savedItems.map((activity) => <article className="pc-saved-card" key={activity.id}>
            <div className="pc-saved-card-media">
              {activity.coverImageUri ? <img src={activity.coverImageUri} alt={activity.title} /> : null}
              <span>灵感已收藏</span>
            </div>
            <div className="pc-saved-card-content">
              <small>SAVED INSPIRATION</small>
              <h3>{activity.title}</h3>
              <p>{activity.cityName}{activity.district ? ` · ${activity.district}` : ''} · 还没安排出发日期</p>
              <Button type="primary" onClick={() => router.push(`/activity/${activity.id}?intent=schedule`)}>查看详情并安排 <ArrowRightOutlined /></Button>
            </div>
          </article>)}</div> : null}
          {!loading && (filter === 'saved' ? savedItems.length === 0 : visibleItems.length === 0) ? <Empty className="pc-trips-empty" description={filter === 'saved' ? '喜欢的灵感可以先收藏，不必现在决定出发日期' : filter === 'all' ? '还没有行程，去抽一个目的地吧' : '这个分类里暂时没有行程'} image="/media/ui/empty-explorer-duck.png"><Button icon={<PlusOutlined />} size="large" type="primary" onClick={() => router.push('/box/config')}>发现出游灵感</Button></Empty> : null}
          </div>
        </div>
        <Modal centered className="pc-trip-feedback-modal" rootClassName="pc-trip-feedback-modal" width={620} open={completionItem !== null} title={<div className="pc-trip-feedback-title"><small>TRIP FEEDBACK</small><strong>这趟体验怎么样？</strong></div>} onCancel={() => setCompletionItem(null)} onOk={() => void saveFeedback()} confirmLoading={completingId !== null} okButtonProps={{ disabled: !verdict }} okText="保存感受并完成" cancelText="稍后再说">
          <p className="pc-trip-feedback-copy">选一项即可，文字感受可选；你的反馈会帮助我们把下一次推荐做得更准。</p>
          <Radio.Group className="pc-trip-feedback-options" value={verdict} onChange={(e) => setVerdict(e.target.value)}>
            <Radio.Button value="worth_it">值得再来</Radio.Button>
            <Radio.Button value="okay">还不错</Radio.Button>
            <Radio.Button value="not_for_me">不太适合我</Radio.Button>
            <Radio.Button value="ended_early">提前结束了</Radio.Button>
          </Radio.Group>
          <Input.TextArea className="pc-trip-feedback-note" aria-label="这次出游感受" value={feeling} onChange={(e) => setFeeling(e.target.value)} maxLength={500} placeholder="哪一站最好？有没有关门、排队太久或预算不准？" />
          {error ? <Alert type="error" title={error} style={{ marginTop: 12 }} /> : null}
        </Modal>
        <Modal centered className="pc-trip-schedule-modal" rootClassName="pc-trip-schedule-modal" width={620} open={scheduleItem !== null} title={<div className="pc-trip-schedule-title"><small>RESCHEDULE TRIP</small><strong>修改出发日期</strong></div>} onCancel={() => setScheduleItem(null)} onOk={() => void saveNewDate()} confirmLoading={savingDate} okButtonProps={{ disabled: !validDepartureDate(newDate) }} okText="保存日期" cancelText="取消">
          <p className="pc-trip-schedule-copy">调整后会同步更新这条行程的待出发日期。</p>
          <PcDatePicker ariaLabel="修改出发日期" min={chinaDate()} max={addDays(chinaDate(), 365)} value={newDate} onChange={setNewDate} />
          {error ? <Alert type="error" title={error} style={{ marginTop: 12 }} /> : null}
        </Modal>
      </main>
    </ConfigProvider>
  );
}
