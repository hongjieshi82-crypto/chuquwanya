import { Button, Modal, Typography } from 'antd';
import { useMemo, useState } from 'react';

import { getPcTravelBudgetRange } from '@/constants/pc-travel-budget-tiers';
import type { Preferences } from '@/types';

const { Text, Title } = Typography;

type QuickDrawLock = {
  cityId: number;
  cityName: string;
  categoryLabel?: string;
};

export type QuickDrawSubmission = {
  preferences: Preferences;
  summary: string;
};

export function PcQuickDrawModal({
  lock,
  open,
  onClose,
  onSubmit,
}: {
  lock: QuickDrawLock | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (submission: QuickDrawSubmission) => void;
}) {
  const isRomance = lock?.categoryLabel === '浪漫约会';
  const [partySize, setPartySize] = useState('2 人');
  const [duration, setDuration] = useState('当天');
  const [budget, setBudget] = useState('划算出行');

  const resetSelections = () => {
    setPartySize('2 人');
    setDuration('当天');
    setBudget('划算出行');
  };

  const close = () => {
    resetSelections();
    onClose();
  };

  const title = useMemo(() => {
    if (!lock) return '快速抽取';
    return lock.categoryLabel ? `抽一个${lock.categoryLabel}盲盒` : `抽一条${lock.cityName}玩法`;
  }, [lock]);

  const submit = () => {
    if (!lock) return;
    const partyValue = isRomance ? 2 : partySize === '多人' ? 4 : Number.parseInt(partySize, 10) || 1;
    const normalizedCategory = lock.categoryLabel === '浪漫约会' ? '约会' : lock.categoryLabel ?? '不限';
    const budgetRange = getPcTravelBudgetRange(duration, budget);
    const travelDuration = duration === '当天' ? 'same-day' : duration === '周末游' ? '2-3days' : '4-5days';
    const preferences: Preferences = {
      partySize: partyValue,
      durationMinutes: null,
      budgetMin: budgetRange.min,
      budgetMax: budgetRange.max,
      mood: normalizedCategory === '不限' ? '放松' : normalizedCategory,
      randomLevel: 70,
      category: normalizedCategory,
      environment: 'either',
      radiusKm: null,
      originName: lock.cityName,
      originLatitude: null,
      originLongitude: null,
      originAccuracyMeters: null,
      originSource: 'manual',
      destinationScope: 'nearby',
      travelDuration,
      clientSource: 'pc',
      destinationScopeLabel: `${lock.cityName}本地`,
      travelDurationLabel: duration,
      budgetLabel: budget,
      surpriseLevelLabel: lock.categoryLabel ? `${lock.categoryLabel}分类盲盒` : `${lock.cityName}城市盲盒`,
    };
    onSubmit({
      preferences,
      summary: `${lock.cityName} · ${lock.categoryLabel ?? '本地玩法'} · ${partyValue} 人 · ${duration} · ${budget}`,
    });
    resetSelections();
  };

  const optionGroup = (label: string, values: string[], value: string, setValue: (next: string) => void) => (
    <div className="pc-quick-draw-field">
      <Text>{label}</Text>
      <div className="pc-quick-draw-options">
        {values.map((item) => <button className={item === value ? 'is-selected' : ''} key={item} type="button" onClick={() => setValue(item)}>{item}</button>)}
      </div>
    </div>
  );

  return (
    <Modal
      centered
      className="pc-quick-draw-modal"
      rootClassName="pc-quick-draw-modal-root"
      footer={null}
      open={open}
      width={680}
      styles={{
        mask: { backgroundColor: 'rgba(4,5,7,.78)', backdropFilter: 'blur(14px)' },
        container: {
          overflow: 'hidden',
          padding: 0,
          border: '1px solid rgba(255,255,255,.16)',
          borderRadius: 28,
          color: '#f6f6ef',
          background: 'linear-gradient(145deg,#111416,#0b0d10)',
          boxShadow: '0 34px 100px rgba(0,0,0,.58),0 0 42px rgba(201,255,98,.07)',
        },
        body: { color: '#f6f6ef', background: 'transparent' },
      }}
      onCancel={close}>
      <style>{quickDrawCss}</style>
      <div className="pc-quick-draw-content">
        <small>QUICK BLIND BOX</small>
        <Title level={2}>{title}</Title>
        <p>已锁定 <b>{lock?.cityName}</b>{lock?.categoryLabel ? <> · <b>{lock.categoryLabel}</b></> : null}</p>
        {isRomance ? <div className="pc-quick-draw-fixed"><span>同行人数</span><b>固定 2 人</b></div> : optionGroup('同行人数', ['1 人', '2 人', '多人'], partySize, setPartySize)}
        {optionGroup('出游时长', ['当天', '周末游', '小长假'], duration, setDuration)}
        {optionGroup('预算方式', ['划算出行', '舒服躺玩', '品质享受'], budget, setBudget)}
        <Button className="pc-quick-draw-submit" size="large" type="primary" onClick={submit}>开始抽选　→</Button>
      </div>
    </Modal>
  );
}

const quickDrawCss = `
.pc-quick-draw-modal-root .ant-modal-container{overflow:hidden!important;padding:0!important;border:1px solid rgba(255,255,255,.16)!important;border-radius:28px!important;color:#f6f6ef!important;background:linear-gradient(145deg,#111416,#0b0d10)!important;box-shadow:0 34px 100px rgba(0,0,0,.58),0 0 42px rgba(201,255,98,.07)!important}
.pc-quick-draw-modal-root .ant-modal-container::before{content:'';position:absolute;z-index:2;inset:0 0 auto;height:3px;background:#c9ff62;box-shadow:0 0 22px rgba(201,255,98,.36)}
.pc-quick-draw-modal-root .ant-modal-close{top:40px;right:42px;width:40px;height:40px;border:1px solid rgba(255,255,255,.14);border-radius:50%;color:rgba(255,255,255,.68);background:rgba(255,255,255,.04)}
.pc-quick-draw-modal-root .ant-modal-close:hover{color:#11150d;background:#c9ff62}
.pc-quick-draw-content{padding:40px 42px 42px}.pc-quick-draw-content>small{color:#c9ff62;font:800 10px/1 ui-monospace,monospace;letter-spacing:.14em}.pc-quick-draw-content h2.ant-typography{max-width:88%;margin:15px 0 0;color:#fff;font-size:42px;line-height:1.08;letter-spacing:-.05em}.pc-quick-draw-content>p{margin:12px 0 28px;color:rgba(255,255,255,.42)}.pc-quick-draw-content>p b{color:rgba(255,255,255,.8)}
.pc-quick-draw-field{margin-top:22px}.pc-quick-draw-field>.ant-typography{display:block;margin-bottom:11px;color:rgba(255,255,255,.52);font-size:13px;font-weight:800}.pc-quick-draw-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.pc-quick-draw-options button{min-height:52px;border:1px solid rgba(255,255,255,.13);border-radius:15px;color:rgba(255,255,255,.68);background:#151719;font-size:15px;font-weight:800;cursor:pointer}.pc-quick-draw-options button:hover{border-color:rgba(201,255,98,.55);color:#fff}.pc-quick-draw-options button.is-selected{border-color:#c9ff62;color:#dfffaa;background:#182014;box-shadow:inset 0 0 0 1px rgba(201,255,98,.07),0 0 18px rgba(201,255,98,.07)}.pc-quick-draw-options button.is-selected::before{content:'';display:inline-block;width:7px;height:7px;margin-right:8px;border-radius:50%;background:#c9ff62;box-shadow:0 0 10px rgba(201,255,98,.7)}
.pc-quick-draw-fixed{min-height:58px;padding:0 18px;border:1px solid rgba(201,255,98,.2);border-radius:16px;display:flex;align-items:center;justify-content:space-between;color:rgba(255,255,255,.46);background:rgba(201,255,98,.045);font-size:13px}.pc-quick-draw-fixed b{color:#dfffaa;font-size:16px}.pc-quick-draw-submit.ant-btn{width:100%;height:60px;margin-top:32px;border:0;border-radius:18px;color:#11150d;background:#c9ff62;font-size:17px;font-weight:950;box-shadow:0 14px 34px rgba(201,255,98,.18)}
@media(max-width:640px){.pc-quick-draw-modal-root .ant-modal-close{top:30px;right:18px}.pc-quick-draw-content{padding:30px 18px 22px}.pc-quick-draw-content h2.ant-typography{font-size:30px}.pc-quick-draw-options{gap:7px}.pc-quick-draw-options button{min-height:47px;padding:0 7px;font-size:12px}}
`;
