import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css';
import { usePathname } from 'expo-router';
import { useEffect, useState, type PropsWithChildren } from 'react';

import { PC_TOP_NAV_KEYS, PcTopNav, getPcTopNavItems } from '@/components/pc-top-nav';
import { useApp } from '@/contexts/app-context';
import { palette, radii } from '@/theme';

const shellToken = {
  ink: palette.ink,
  text: palette.text,
  primary: palette.primary,
  primaryDark: palette.primaryDark,
  primarySoft: palette.primarySoft,
  border: palette.border,
};

const cityCoordinates: Record<string, [number, number]> = {
  '北京': [39.9042, 116.4074], '上海': [31.2304, 121.4737], '杭州': [30.2741, 120.1551], '深圳': [22.5431, 114.0579],
  '广州': [23.1291, 113.2644], '天津': [39.0842, 117.2009], '青岛': [36.0671, 120.3826], '南京': [32.0603, 118.7969],
  '武汉': [30.5928, 114.3055], '成都': [30.5728, 104.0668], '西安': [34.3416, 108.9398], '长沙': [28.2282, 112.9388],
};

const pcExperienceShellCss = `
.pc-experience-shell {
  min-height: 100dvh;
  color: ${shellToken.ink};
  background: ${palette.canvas};
}

.pc-experience-shell-header {
  --pc-unified-nav-height: clamp(84px, 5.2vw, 104px);
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--pc-unified-nav-height);
  padding: 0 4.2vw;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  line-height: normal;
  color: #fff;
  background: rgba(13, 13, 19, .96);
  border-bottom: 1px solid rgba(255, 255, 255, .08);
  box-shadow: 0 12px 40px rgba(0, 0, 0, .18);
  backdrop-filter: blur(22px);
  font-family: Inter, "PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.pc-experience-shell-header .pc-top-nav-menu.ant-menu-horizontal { gap: clamp(42px, 2.9vw, 64px); }
.pc-experience-shell-header .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item {
  height: var(--pc-unified-nav-height);
  font-size: clamp(18px, 1.1vw, 24px);
  font-weight: 760;
  line-height: var(--pc-unified-nav-height);
  font-family: Inter, "PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}
.pc-experience-shell-header .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item::after {
  bottom: clamp(18px, 1.2vw, 25px);
}

.pc-experience-shell-header .pc-experience-shell-brand { color: #fff; }
.pc-experience-shell-header .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item { color: rgba(255, 255, 255, .72); }
.pc-experience-shell-header .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item:hover,
.pc-experience-shell-header .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item-selected { color: #c9ff62; }
.pc-experience-shell-header .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item:hover::after,
.pc-experience-shell-header .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item-selected::after { border-bottom-color: #c9ff62; }
.pc-experience-shell-header .pc-experience-shell-cta.ant-btn { border-color: #c9ff62; color: #171520; background: #c9ff62; box-shadow: 0 10px 28px rgba(201, 255, 98, .18); }
.pc-experience-shell-header .pc-experience-shell-cta.ant-btn:hover { border-color: #dcff9b; color: #171520; background: #dcff9b; }

.pc-experience-shell-header.pc-experience-shell-header-home,
.pc-experience-shell-header.pc-experience-shell-header-blindbox {
  color: #fff;
  background: rgba(13, 13, 19, .96);
  border-bottom-color: rgba(255, 255, 255, .08);
  box-shadow: 0 12px 40px rgba(0, 0, 0, .18);
  backdrop-filter: blur(22px);
}

.pc-experience-shell-header.pc-experience-shell-header-home { display: none; }
.pc-experience-shell-header.pc-experience-shell-header-home + .pc-experience-shell-content { min-height: 100dvh; }

.pc-experience-shell-header-home .pc-experience-shell-brand,
.pc-experience-shell-header-home .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item,
.pc-experience-shell-header-blindbox .pc-experience-shell-brand,
.pc-experience-shell-header-blindbox .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item {
  color: rgba(255, 255, 255, .72);
}

.pc-experience-shell-header-home .pc-experience-shell-brand,
.pc-experience-shell-header-blindbox .pc-experience-shell-brand {
  color: #fff;
}

.pc-experience-shell-header-home .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item:hover,
.pc-experience-shell-header-home .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item-selected,
.pc-experience-shell-header-blindbox .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item:hover,
.pc-experience-shell-header-blindbox .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item-selected {
  color: #c9ff62;
}

.pc-experience-shell-header-home .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item:hover::after,
.pc-experience-shell-header-home .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item-selected::after,
.pc-experience-shell-header-blindbox .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item:hover::after,
.pc-experience-shell-header-blindbox .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item-selected::after {
  border-bottom-color: #c9ff62;
}

.pc-experience-shell-header-home .pc-experience-shell-cta.ant-btn,
.pc-experience-shell-header-blindbox .pc-experience-shell-cta.ant-btn {
  border-color: #c9ff62;
  color: #171520;
  background: #c9ff62;
  box-shadow: 0 10px 28px rgba(201, 255, 98, .18);
}

.pc-experience-shell-header-home .pc-top-nav-actions > .ant-btn {
  min-width: 100px;
  height: clamp(48px, 3vw, 54px);
  padding-inline: clamp(22px, 1.5vw, 30px);
  border: 0;
  border-radius: ${radii.pill}px;
  color: #171520;
  background: #c9ff62;
  font-size: clamp(14px, .8vw, 17px);
  font-weight: 850;
}

.pc-experience-shell-header-home .pc-top-nav-actions > .ant-btn:hover {
  color: #171520;
  background: #dcff9b;
}

.pc-experience-shell-header-home .pc-experience-shell-cta.ant-btn:hover,
.pc-experience-shell-header-blindbox .pc-experience-shell-cta.ant-btn:hover {
  border-color: #dcff9b;
  color: #171520;
  background: #dcff9b;
}

.pc-experience-shell-header.pc-experience-shell-header-destinations {
  color: #fff;
  background: rgba(13, 13, 19, .96);
  border-bottom-color: rgba(255, 255, 255, .08);
  box-shadow: 0 12px 40px rgba(0, 0, 0, .18);
  backdrop-filter: blur(22px);
  transition: background .2s ease, border-color .2s ease, box-shadow .2s ease, backdrop-filter .2s ease;
}

.pc-experience-shell-header.pc-experience-shell-header-destinations.is-scrolled {
  background: rgba(13, 13, 19, .98);
  border-bottom-color: rgba(255, 255, 255, .1);
  box-shadow: 0 12px 40px rgba(0, 0, 0, .22);
  backdrop-filter: blur(24px);
}

.pc-experience-shell-brand {
  display: inline-flex;
  align-items: center;
  gap: 13px;
  min-width: 176px;
  color: #fff;
  font-size: clamp(18px, 1.05vw, 22px);
  font-weight: 900;
  line-height: 1;
  text-decoration: none;
}

.pc-experience-shell-brand img {
  width: clamp(42px, 2.6vw, 52px);
  height: clamp(42px, 2.6vw, 52px);
  object-fit: contain;
}

.pc-experience-shell-menu {
  position: absolute;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: max-content;
  min-width: max-content;
  flex: none;
  transform: translateX(-50%);
}

.pc-experience-shell-cta {
  width: 148px;
  min-width: 148px;
  height: clamp(48px, 3vw, 54px);
  border: 0;
  border-radius: ${radii.pill}px;
  font-size: clamp(14px, .8vw, 17px);
  font-weight: 850;
  box-shadow: 0 10px 24px rgba(126, 166, 31, 0.3);
  background: linear-gradient(135deg, ${shellToken.primary} 0%, ${palette.sky} 100%);
}

.pc-home-city-control { width: 224px; min-width: 224px; min-height: 52px; padding: 5px 6px 5px 14px; border: 1px solid rgba(255,255,255,.16); border-radius: 999px; display: flex; align-items: center; justify-content:flex-end; gap: 14px; background: rgba(8,8,11,.72); }
.pc-home-city-control label { color: #85848d; font-size: 11px; font-weight: 700; white-space: nowrap; }
.pc-home-city-control select { width: 56px; min-width: 56px; flex: 0 0 56px; height: 38px; padding: 0; border: 0; outline: 0; color: #fff; background: transparent; font-size: 15px; font-weight: 850; text-align: center; cursor: pointer; }
.pc-home-city-control select option { color: #fff; background: #17171d; }
.pc-home-city-control button { min-width: 70px; height: 40px; padding: 0 18px; border: 0; border-radius: 999px; color: #15170f; background: #c9ff62; font-size: 13px; font-weight: 900; cursor: pointer; }

.pc-experience-shell-content {
  min-height: calc(100dvh - 104px);
}
.pc-experience-shell-content .pc-page,
.pc-experience-shell-content .pc-box-page,
.pc-experience-shell-content .pc-box-open-page,
.pc-experience-shell-content .pc-layout,
.pc-experience-shell-content .pc-box-layout,
.pc-experience-shell-content .pc-box-open-layout {
  min-height: calc(100dvh - 104px);
}

@media (max-width: 980px) {
  .pc-experience-shell-header {
    height: auto;
    min-height: 76px;
    padding: 14px 22px;
    flex-wrap: wrap;
  }

  .pc-experience-shell-menu {
    position: static;
    order: 3;
    width: 100%;
    min-width: 0;
    flex-basis: 100%;
    transform: none;
  }
}

@media (max-width: 640px) {
  .pc-experience-shell-header {
    padding-inline: 16px;
  }

  .pc-experience-shell-brand {
    min-width: 0;
  }

  .pc-experience-shell-header .pc-top-nav-actions {
    width: auto;
  }
}

/* One desktop navigation language, matching the Weekend Inspiration page. */
@media (min-width: 761px) {
  .pc-experience-shell-header.pc-experience-shell-header-home { display: flex; }
  .pc-experience-shell-header-home + .pc-experience-shell-content { min-height: calc(100dvh - clamp(84px,5.2vw,104px)); }
  .pc-experience-shell-header {
    height: clamp(84px,5.2vw,104px);
    min-height: 0;
    padding: 0 4.2vw;
    gap: 28px;
    flex-wrap: nowrap;
    background: #0d0d13;
    border-bottom: 1px solid rgba(255,255,255,.12);
    box-shadow: none;
  }
  .pc-experience-shell .pc-experience-shell-header,
  .pc-experience-shell .pc-experience-shell-header.pc-experience-shell-header-home,
  .pc-experience-shell .pc-experience-shell-header.pc-experience-shell-header-blindbox,
  .pc-experience-shell .pc-experience-shell-header.pc-experience-shell-header-destinations { background: #0d0d13; }
  .pc-experience-shell-brand { gap: 13px; min-width: 176px; font-size: clamp(18px,1.05vw,22px); }
  .pc-experience-shell-brand img { width: clamp(42px,2.6vw,52px); height: clamp(42px,2.6vw,52px); border-radius: 13px; }
  .pc-experience-shell-brand,.pc-top-nav-end { align-self: center; }
  .pc-experience-shell-menu { position: absolute; top: 50%; left: 50%; width: max-content; min-width: max-content; transform: translate(-50%,-50%); }
  .pc-experience-shell-header .pc-top-nav-menu.ant-menu-horizontal { gap: clamp(42px,2.9vw,64px); }
  .pc-experience-shell-header .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item { height: clamp(84px,5.2vw,104px); padding-inline: 2px; color: #c9c8cf; font-size: clamp(18px,1.1vw,24px); line-height: clamp(84px,5.2vw,104px); }
  .pc-experience-shell-header .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item-selected { color: #fff; }
  .pc-experience-shell-header .pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item::after { bottom: clamp(18px,1.2vw,25px); border-bottom-width: 4px; border-radius: 4px; }
  .pc-experience-shell-cta { width: 148px; min-width: 148px; height: clamp(48px,3vw,54px); font-size: clamp(14px,.8vw,17px); box-shadow: none; background: #c9ff62; }
}
`;

export function PcExperienceShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { cities, isBooting, isRegistered, selectedCityId, setSelectedCityId } = useApp();
  const [hasScrolled, setHasScrolled] = useState(false);
  const isBlindBoxRoute =
    pathname === '/box/config' || pathname === '/box/open' || pathname === '/box/result';
  const isHomeRoute = pathname === '/pc';
  const isDestinationRoute = pathname === '/destinations';
  const isTripsRoute = pathname === '/trips';

  useEffect(() => {
    if (!isDestinationRoute) {
      return;
    }
    const updateScrollState = () => setHasScrolled(window.scrollY > 48);
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, [isDestinationRoute]);
  const navItems = getPcTopNavItems({
    activeKey: isBlindBoxRoute
      ? PC_TOP_NAV_KEYS.blindBox
      : isDestinationRoute
        ? PC_TOP_NAV_KEYS.attractions
        : isTripsRoute
          ? PC_TOP_NAV_KEYS.trips
          : undefined,
    homeHref: '/pc#top',
  });

  const startPcBoxDraw = () => {
    window.dispatchEvent(new Event('pc-box-start-draw'));
  };

  const locateHomeCity = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const match = cities.reduce<{ id: number; distance: number } | null>((best, city) => {
        const coordinate = cityCoordinates[city.name];
        if (!coordinate) return best;
        const distance = Math.hypot(coords.latitude - coordinate[0], (coords.longitude - coordinate[1]) * Math.cos(coords.latitude * Math.PI / 180));
        return !best || distance < best.distance ? { id: city.id, distance } : best;
      }, null);
      if (match) setSelectedCityId(match.id);
    });
  };

  const homeCityControl = isHomeRoute ? <div className="pc-home-city-control">
    <label htmlFor="pc-home-city-select">当前城市</label>
    <select id="pc-home-city-select" value={selectedCityId ?? ''} onChange={(event) => setSelectedCityId(Number(event.target.value))}>
      {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
    </select>
    <button type="button" onClick={locateHomeCity}>定位</button>
  </div> : null;

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: shellToken.primary,
          colorInfo: shellToken.primary,
          colorTextLightSolid: shellToken.ink,
          colorText: shellToken.ink,
          colorTextSecondary: shellToken.text,
          colorTextTertiary: palette.muted,
          colorBgLayout: palette.canvas,
          colorBgContainer: palette.surface,
          colorBorder: shellToken.border,
          borderRadius: radii.lg,
          borderRadiusLG: radii.xl,
          fontFamily:
            'Inter, PingFang SC, Microsoft YaHei, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        },
        components: {
          Button: {
            borderRadius: radii.pill,
            controlHeightLG: 48,
            primaryShadow: '0 10px 24px rgba(126, 166, 31, 0.28)',
          },
        },
      }}>
      <div className="pc-experience-shell">
        <style>{pcExperienceShellCss}</style>
        <PcTopNav
          className={
            `pc-experience-shell-header${isHomeRoute ? ' pc-experience-shell-header-home' : ''}${isBlindBoxRoute ? ' pc-experience-shell-header-blindbox' : ''}${isDestinationRoute ? ' pc-experience-shell-header-destinations' : ''}${
              isDestinationRoute && hasScrolled ? ' is-scrolled' : ''
            }`
          }
          brandClassName="pc-experience-shell-brand"
          menuClassName="pc-experience-shell-menu"
          brandHref="/pc#top"
          items={navItems}
          selectedKey={
            isHomeRoute
            ? PC_TOP_NAV_KEYS.home
            : isBlindBoxRoute
            ? PC_TOP_NAV_KEYS.blindBox
            : isDestinationRoute
              ? PC_TOP_NAV_KEYS.attractions
              : isTripsRoute
                ? PC_TOP_NAV_KEYS.trips
                : undefined
          }
          token={shellToken}
          dataAnime="nav"
          showLogin={false}
          extra={homeCityControl}
          primaryAction={
            !isRegistered
              ? {
                  label: '立即登录',
                  href: '/pc-login',
                  className: 'pc-experience-shell-cta pc-header-cta',
                }
              : {
                  label: '立即抽取',
                  href: pathname === '/box/config' ? undefined : '/box/config',
                  className: 'pc-experience-shell-cta pc-header-cta',
                  disabled: pathname === '/box/config' ? isBooting : false,
                  onClick: pathname === '/box/config' ? startPcBoxDraw : undefined,
                }
          }
        />
        <div className="pc-experience-shell-content">{children}</div>
      </div>
    </ConfigProvider>
  );
}
