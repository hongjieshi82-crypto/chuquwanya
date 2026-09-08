import { usePathname } from 'expo-router';

const items = [
  { href: '/pc', label: '周末灵感', short: '首页', icon: 'home' },
  { href: '/trips', label: '我的行程', short: '行程', icon: 'suitcase' },
  { href: '/box/config', label: '旅行抽取', short: '扭蛋', icon: 'capsule' },
  { href: '/destinations', label: '可玩地点', short: '探索', icon: 'map' },
] as const;

function NavigationIcon({ name }: { name: typeof items[number]['icon'] }) {
  return <svg className="mobile-nav-icon" aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
    {name === 'home' ? <><path fill="currentColor" fillOpacity=".18" stroke="none" d="M4 10 12 3l8 7v9a2 2 0 0 1-2 2h-4v-7h-4v7H6a2 2 0 0 1-2-2Z"/><path d="m2.5 10.5 8-7a2.3 2.3 0 0 1 3 0l8 7M4.5 9.1v10A1.9 1.9 0 0 0 6.4 21H10v-6.2h4V21h3.6a1.9 1.9 0 0 0 1.9-1.9v-10"/></> : null}
    {name === 'suitcase' ? <><rect x="4" y="6" width="16" height="14" rx="3" fill="currentColor" fillOpacity=".18"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M8 6v14M16 6v14M7 20v1M17 20v1"/><path strokeWidth="1.3" d="M10.5 11.5h3v3h-3z"/></> : null}
    {name === 'capsule' ? <><path fill="currentColor" fillOpacity=".2" stroke="none" d="m5.7 5.7 12.6 12.6a8.9 8.9 0 0 1-12.6-12.6Z"/><circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8M9.5 6.7a6 6 0 0 1 7.8 7.8"/><path d="m10.4 12.7 1.4 1.4"/></> : null}
    {name === 'map' ? <><path fill="currentColor" fillOpacity=".18" stroke="none" d="m3 6 6-3v16l-6 3Zm12-1 6-2v16l-6 3Z"/><path d="m3 6 6-3 6 2 6-2v16l-6 3-6-3-6 3Zm6-3v16m6-14v17"/><circle cx="14.8" cy="9.3" r="3.4" fill="#0d1012"/><circle cx="14.8" cy="9.3" r="1" fill="currentColor" stroke="none"/></> : null}
  </svg>;
}

export function MobileNavigation() {
  const pathname = usePathname();
  if (pathname === '/pc-login') return null;
  return <nav className="mobile-bottom-nav" aria-label="主导航">
    {items.map((item) => {
      const active = pathname === item.href || (item.href === '/box/config' && pathname.startsWith('/box/')) || (item.href === '/trips' && pathname.startsWith('/activity/'));
      return <a key={item.href} href={item.href} aria-label={item.label} title={item.label} aria-current={active ? 'page' : undefined}>
        <span className="mobile-nav-icon-wrap"><NavigationIcon name={item.icon} /></span>
        <span className="mobile-nav-label">{item.short}</span>
      </a>;
    })}
  </nav>;
}
