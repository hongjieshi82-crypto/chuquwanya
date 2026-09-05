import { usePathname, useRouter } from 'expo-router';
import { AppIcon, type AppIconName } from './app-icon';

const items: { href: '/pc' | '/trips' | '/box/config' | '/destinations'; label: string; icon: AppIconName }[] = [
  { href: '/pc', label: '周末灵感', icon: 'home' },
  { href: '/trips', label: '我的行程', icon: 'itinerary' },
  { href: '/box/config', label: '旅行抽取', icon: 'sparkle' },
  { href: '/destinations', label: '可玩地点', icon: 'map' },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === '/pc-login') return null;
  return <nav className="mobile-bottom-nav" aria-label="主导航">
    {items.map((item) => {
      const active = pathname === item.href || (item.href === '/box/config' && pathname.startsWith('/box/'));
      return <button key={item.href} type="button" aria-label={item.label} title={item.label} aria-current={active ? 'page' : undefined} onClick={() => router.navigate(item.href)}>
        <AppIcon name={item.icon} size={25} color={active ? '#c9ff62' : '#90998c'} />
        <span className="mobile-nav-dot" />
      </button>;
    })}
  </nav>;
}
