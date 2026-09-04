import {
  ArrowRightOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  MoreOutlined,
  PlayCircleOutlined,
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
  Segmented,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';

import { useApp } from '@/contexts/app-context';
import { resolveCuratedActivityCover } from '@/services/demo-data';
import { getActivity, getTodos, startTodo, updateTodoStatus } from '@/services/api';
import { palette, radii } from '@/theme';
import type { Activity, Todo, TodoStatus } from '@/types';

const { Paragraph, Title } = Typography;

type TripFilter = 'all' | 'upcoming' | 'in_progress' | 'completed';

const filterOptions: { label: string; value: TripFilter }[] = [
  { label: '全部行程', value: 'all' },
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
.pc-trip-cover-actions { position: absolute; top: 17px; right: 14px; z-index: 2; }
.pc-trip-status.ant-tag { display: inline-flex; align-items: center; gap: 7px; height: 30px; margin: 0; padding: 0 12px; border: 1px solid rgba(255,255,255,.16); border-radius: 999px; color: #fff; background: rgba(10,13,15,.68); box-shadow: 0 8px 22px rgba(0,0,0,.18); font-size: 12px; font-weight: 750; line-height: 28px; backdrop-filter: blur(12px); }
.pc-trip-status i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; box-shadow: 0 0 10px currentColor; }
.pc-trip-status.is-pending { color: #f4d277; }.pc-trip-status.is-progress { color: #84c8ff; }.pc-trip-status.is-completed { color: #c9ff62; }.pc-trip-status.is-cancelled { color: #aaaab3; }
.pc-trip-overflow.ant-btn { width: 30px; height: 30px; color: #fff; background: rgba(10,13,15,.68); backdrop-filter: blur(12px); }
.pc-trip-content { display: flex; flex: 1; flex-direction: column; padding: 27px 26px 25px; }
.pc-trip-title.ant-typography { margin: 0 0 10px; color: #171c18; font-size: 25px; font-weight: 900; line-height: 1.35; letter-spacing: .01em; }
.pc-trip-summary.ant-typography { display: -webkit-box; min-height: 52px; margin: 0; overflow: hidden; color: #626a63; font-size: 16px; line-height: 26px; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.pc-trip-meta { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 13px 16px; margin-top: 22px; padding-top: 20px; border-top: 1px solid #e2e7dd; color: #555e57; font-size: 14px; font-weight: 600; }.pc-trip-meta-item:last-child { grid-column: 1 / -1; }
.pc-trip-meta-item { display: flex; align-items: center; gap: 7px; min-width: 0; }
.pc-trip-meta-item svg { color: #6f9821; }
.pc-trip-meta-item span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pc-trip-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 19px; }
.pc-trip-detail.ant-btn { padding: 0; color: #567c16; font-size: 15px; font-weight: 850; }.pc-trip-detail.ant-btn:hover { color: #38550b !important; }
.pc-trip-start.ant-btn { height: 40px; padding-inline: 18px; border: 0; border-radius: 999px; color: #10130d; background: #c9ff62; box-shadow: none; font-size: 14px; font-weight: 850; }
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
.pc-trip-actions { justify-content: flex-start; margin-top: 22px; padding-top: 0; }
.pc-trip-start.ant-btn { margin-left: auto; }
.pc-trip-progress { grid-column: 1 / -1; margin: 0 28px 28px; padding: 24px 26px 22px; overflow: hidden; border: 1px solid rgba(201,255,98,.22); border-radius: 20px; background: linear-gradient(135deg,rgba(201,255,98,.075),rgba(132,200,255,.025)); animation: trip-progress-open .48s cubic-bezier(.2,.8,.2,1) both; }
.pc-trip-progress-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
.pc-trip-progress-head small { display: block; margin-bottom: 7px; color: rgba(255,255,255,.42); font-size: 11px; font-weight: 800; letter-spacing: .1em; }
.pc-trip-progress-head strong { color: #fff; font-size: 22px; }
.pc-trip-progress-head b { color: #c9ff62; font: 900 28px/1 ui-monospace,monospace; }
.pc-trip-progress-track { position: relative; display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 18px; }
.pc-trip-progress-track::before { content: ''; position: absolute; left: 19px; right: 19px; top: 18px; height: 2px; background: rgba(255,255,255,.12); }
.pc-trip-progress-track::after { content: ''; position: absolute; left: 19px; top: 18px; width: var(--trip-progress); height: 2px; background: #c9ff62; box-shadow: 0 0 14px rgba(201,255,98,.5); transition: width .42s cubic-bezier(.2,.8,.2,1); }
.pc-trip-progress-step { position: relative; z-index: 1; min-width: 0; }
.pc-trip-progress-step i { display: grid; place-items: center; width: 38px; height: 38px; margin-bottom: 12px; border: 2px solid rgba(255,255,255,.2); border-radius: 50%; color: rgba(255,255,255,.48); background: #0b0c0d; font: 850 13px/1 ui-monospace,monospace; }
.pc-trip-progress-step.is-current i, .pc-trip-progress-step.is-done i { color: #11150d; border-color: #c9ff62; background: #c9ff62; box-shadow: 0 0 18px rgba(201,255,98,.24); }
.pc-trip-progress-step span { display: block; color: rgba(255,255,255,.45); font-size: 12px; font-weight: 700; }
.pc-trip-progress-step strong { display: block; margin-top: 5px; overflow: hidden; color: rgba(255,255,255,.78); font-size: 14px; line-height: 1.4; text-overflow: ellipsis; white-space: nowrap; }
.pc-trip-progress-step.is-current strong { color: #fff; }
.pc-trip-progress-action { display: flex; justify-content: flex-end; margin-top: 22px; }
.pc-trip-progress-nav.ant-btn { height: 42px; margin-right: 10px; padding-inline: 18px; border-color: rgba(255,255,255,.18); border-radius: 999px; color: rgba(255,255,255,.78); background: rgba(255,255,255,.04); font-weight: 800; }
.pc-trip-progress-next.ant-btn { height: 42px; padding-inline: 20px; border: 0; border-radius: 999px; color: #11150d; background: #c9ff62; font-weight: 850; }
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
.pc-trip-current-step .pc-trip-progress-action { justify-content: flex-start; margin-top: 28px; }
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
.pc-trip-progress-step strong { width: min(320px,90%); margin-top: 7px; color: rgba(255,255,255,.68); font-size: 15px; line-height: 1.4; white-space: normal; }
.pc-trip-progress-step.is-current span { color: #c9ff62; }
.pc-trip-progress-step.is-current strong { color: #fff; font-size: 16px; }
.pc-trip-progress-action { justify-content: flex-end; margin-top: 26px; }
@keyframes trip-progress-open { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: none; } }

/* Four equal navigation states: the selected pill fills one complete quarter. */
.pc-trips-segmented.ant-segmented { width: min(760px, 100%); padding: 5px; }
.pc-trips-segmented .ant-segmented-group { display: flex !important; width: 100%; align-items: stretch; }
.pc-trips-segmented .ant-segmented-item { display: flex; flex: 1 1 25%; width: 25%; min-width: 0; min-height: 52px; align-items: center; justify-content: center; padding: 0 !important; border-radius: 999px; font-size: 16px; font-weight: 720; line-height: 1; }
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
}

/* Shared first-level page frame: aligned to the landing page's 7.4vw content edge. */
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
`;

function getErrorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : '行程暂时加载失败，请稍后重试。';
}

function dateParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { month: '行程', day: '--' };
  return { month: `${date.getMonth() + 1} 月`, day: String(date.getDate()).padStart(2, '0') };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '待定日期';
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(date);
}

function formatDuration(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return '时间待定';
  return minutes < 60 ? `${minutes} 分钟` : `${Math.round((minutes / 60) * 10) / 10} 小时`;
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
}: {
  activity?: Activity | null;
  coverImageUri?: string | null;
  item: Todo;
  isCompleting: boolean;
  isDeleting: boolean;
  isEditing: boolean;
  isStarting: boolean;
  onComplete: (item: Todo) => void;
  onDelete: (item: Todo) => void;
  onStart: (item: Todo) => void;
}) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const value = Number(window.localStorage.getItem(`lazyde:trip-step:${item.id}`));
    return Number.isFinite(value) && value >= 0 ? value : 0;
  });
  const status = statusMeta[item.status];
  const date = dateParts(item.scheduledDate || item.createdAt);
  const effectiveCoverImageUri = coverImageUri || resolveCuratedActivityCover(item);
  const progressSteps = activity?.steps?.length
    ? activity.steps.slice(0, 3)
    : ['按导航前往目的地', '完成今天的核心体验', '留下一张照片或一句感受'];

  useEffect(() => {
    window.localStorage.setItem(`lazyde:trip-step:${item.id}`, String(activeStep));
  }, [activeStep, item.id]);
  const menuItems: MenuProps['items'] = [
    { key: 'detail', label: '查看详情', icon: <ArrowRightOutlined /> },
    { key: 'calendar', label: '添加到日历', icon: <CalendarOutlined /> },
  ];

  return (
    <Card
      className="pc-trip-card"
      role="link"
      tabIndex={0}
      variant="borderless"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('button, a, [role="menuitem"]')) return;
        router.push(`/activity/${item.activityId}`);
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' || event.target !== event.currentTarget) return;
        router.push(`/activity/${item.activityId}`);
      }}>
      <div className="pc-trip-cover" style={{ '--trip-accent': item.accentColor || '#c9ff62' } as CSSProperties}>
        {effectiveCoverImageUri ? <img alt={`${item.title}场景图`} src={effectiveCoverImageUri} /> : <div className="pc-trip-cover-placeholder"><span>{item.cityName || '周末出发'}</span></div>}
        <div className="pc-trip-cover-shade" />
        <div className="pc-trip-date"><span>{date.month}</span><b>{date.day}</b></div>
        <Space className="pc-trip-cover-actions" size={7} align="start">
          <Dropdown menu={{ items: menuItems, onClick: ({ key }) => key === 'detail' && router.push(`/activity/${item.activityId}`) }} trigger={['click']}>
            <Button aria-label="行程更多操作" className="pc-trip-overflow" icon={<MoreOutlined />} type="text" />
          </Dropdown>
        </Space>
      </div>
      <div className="pc-trip-content">
        <div className="pc-trip-title-row">
          <Title className="pc-trip-title" level={4}>{item.title}</Title>
          <Tag className={`pc-trip-status ${status.className}`} color={status.color}><i />{status.label}</Tag>
        </div>
        <Paragraph className="pc-trip-summary">{item.summary || '一场为你准备的城市探索，随时出发。'}</Paragraph>
        <div className="pc-trip-meta">
          <div className="pc-trip-meta-item"><CalendarOutlined /><div><small>日期</small><strong>{formatDate(item.scheduledDate || item.createdAt)}</strong></div></div>
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
          {!isEditing && item.status === 'pending' ? <Button className="pc-trip-start" icon={<PlayCircleOutlined />} loading={isStarting} type="primary" onClick={() => onStart(item)}>开始行程</Button> : null}
          {!isEditing && item.status === 'in_progress' ? <Button className="pc-trip-start" loading={isCompleting} type="primary" onClick={() => onComplete(item)}>完成行程</Button> : null}
          {!isEditing && item.status === 'completed' ? <Badge color="#78a927" text={<span style={{ color: 'rgba(255,255,255,.58)', fontSize: 14, fontWeight: 700 }}>已留下回忆</span>} /> : null}
        </div>
      </div>
      {item.status === 'in_progress' && !isEditing ? (
          <section className="pc-trip-progress" aria-label="行程执行进度">
            <div className="pc-trip-progress-head">
              <div><small>LIVE ROUTE</small><strong>行程进行中</strong></div>
              <b>{String(activeStep + 1).padStart(2, '0')} / {String(progressSteps.length).padStart(2, '0')}</b>
            </div>
            <div className="pc-trip-progress-track" style={{ '--trip-progress-ratio': progressSteps.length <= 1 ? 1 : activeStep / (progressSteps.length - 1) } as CSSProperties}>
              {progressSteps.map((step, index) => (
                <div className={`pc-trip-progress-step${index < activeStep ? ' is-done' : ''}${index === activeStep ? ' is-current' : ''}`} key={`${item.id}-${step}`}>
                  <i>{index < activeStep ? (
                    <svg aria-hidden="true" viewBox="0 0 1024 1024">
                      <path d="M512 1024C229.216 1024 0 794.784 0 512S229.216 0 512 0s512 229.216 512 512-229.216 512-512 512z m-49.568-377.152l-146.496-148.224-96.512 92.256c70.208 37.76 168.64 106.816 252.896 213.696 59.52-111.936 243.008-340.896 332.256-361.28-14.4-57.728-22.56-166.016 0-223.872-183.04 120.704-342.144 427.424-342.144 427.424z" fill="currentColor" />
                    </svg>
                  ) : index === activeStep ? <span className="pc-trip-current-dot" /> : String(index + 1).padStart(2, '0')}</i>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>
            <div className="pc-trip-progress-action">
              {item.navigationUrl ? <Button className="pc-trip-progress-nav" icon={<EnvironmentOutlined />} onClick={() => window.open(item.navigationUrl, '_blank', 'noopener,noreferrer')}>打开导航</Button> : null}
              <Button className="pc-trip-progress-next" loading={isCompleting} onClick={() => {
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTrips();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadTrips]);

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

  const handleComplete = async (item: Todo) => {
    if (!userId) return;
    setCompletingId(item.id);
    setError(null);
    try {
      await updateTodoStatus(item.id, 'completed', userId);
      await loadTrips();
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setCompletingId(null);
    }
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
          {error ? <Alert closable description={error} title="加载失败" showIcon style={{ marginBottom: 16 }} type="error" /> : null}
          <div className="pc-trips-toolbar">
            <Segmented className="pc-trips-segmented" options={filterOptions} value={filter} onChange={(value) => setFilter(value as TripFilter)} />
            <Space className="pc-trips-toolbar-actions" size={12}>
              <Button className="pc-trips-refresh" aria-label="刷新行程" icon={<ReloadOutlined />} loading={refreshing} onClick={() => void loadTrips(true)} />
              <Button className={`pc-trips-edit${isEditing ? ' is-active' : ''}`} icon={isEditing ? undefined : <DeleteOutlined />} size="large" onClick={() => setIsEditing((value) => !value)}>{isEditing ? '完成' : '编辑行程'}</Button>
              <Button className="pc-trips-create" icon={<PlusOutlined />} size="large" type="primary" onClick={() => router.push('/box/config')}>创建新行程</Button>
            </Space>
          </div>

          {loading ? <div className="pc-trips-loading"><Spin description="正在加载你的行程…" /></div> : null}
          {!loading && visibleItems.length > 0 ? <div className="pc-trips-grid">{visibleItems.map((item) => <TripCard activity={activities[item.activityId]} coverImageUri={activities[item.activityId]?.coverImageUri} isCompleting={completingId === item.id} isDeleting={deletingId === item.id} isEditing={isEditing} isStarting={startingId === item.id} item={item} key={item.id} onComplete={(todo) => { void handleComplete(todo); }} onDelete={(todo) => { void handleDelete(todo); }} onStart={(todo) => { void handleStart(todo); }} />)}</div> : null}
          {!loading && visibleItems.length === 0 ? <Empty className="pc-trips-empty" description={filter === 'all' ? '还没有行程，去抽一个目的地吧' : '这个分类里暂时没有行程'} image="/media/ui/empty-explorer-duck.png"><Button icon={<PlusOutlined />} size="large" type="primary" onClick={() => router.push('/box/config')}>创建新行程</Button></Empty> : null}
        </div>
      </main>
    </ConfigProvider>
  );
}
