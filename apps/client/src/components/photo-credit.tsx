import type { Activity } from '@/types';

export function PhotoCredit({ activity }: { activity: Activity }) {
  const credit = activity.coverCredit;
  if (!credit) return null;
  return <aside style={{ flex: 'none', padding: '7px 12px', fontSize: 11, lineHeight: 1.5, color: '#becbb3', background: '#111711' }}>
    {credit.kind === 'illustration' ? '玩法主题示意 · 非地点实拍' : <>
      地点实景 · {credit.author} · <a style={{ color: 'inherit', textDecoration: 'underline' }} href="/media/city-plays/credits.html" target="_blank" rel="noreferrer">图片来源与许可</a>
    </>}
  </aside>;
}
