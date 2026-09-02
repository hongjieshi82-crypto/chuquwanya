import GiftOutlinedSvg from '@ant-design/icons-svg/es/asn/GiftOutlined';
import type { AbstractNode, IconDefinition } from '@ant-design/icons-svg/es/types';
import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css';
import { usePathname } from 'expo-router';
import { useEffect, useState, type PropsWithChildren, type SVGProps } from 'react';

import { PC_TOP_NAV_KEYS, PcTopNav, getPcTopNavItems } from '@/components/pc-top-nav';
import { useApp } from '@/contexts/app-context';
import { palette, radii } from '@/theme';

type PcIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

const shellToken = {
  ink: palette.ink,
  text: palette.text,
  primary: palette.primary,
  primaryDark: palette.primaryDark,
  primarySoft: palette.primarySoft,
  border: palette.border,
};

const pcExperienceShellCss = `
.pc-experience-shell {
  min-height: 100dvh;
  color: ${shellToken.ink};
  background: ${palette.canvas};
}

.pc-experience-shell-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 76px;
  padding: 0 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  line-height: normal;
  color: #fff;
  background: rgba(17, 16, 28, .94);
  border-bottom: 1px solid rgba(255, 255, 255, .08);
  box-shadow: 0 12px 40px rgba(0, 0, 0, .18);
  backdrop-filter: blur(22px);
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
  background: rgba(17, 16, 28, .92);
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

.pc-experience-shell-header-home .pc-experience-shell-cta.ant-btn:hover,
.pc-experience-shell-header-blindbox .pc-experience-shell-cta.ant-btn:hover {
  border-color: #dcff9b;
  color: #171520;
  background: #dcff9b;
}

.pc-experience-shell-header.pc-experience-shell-header-destinations {
  color: #fff;
  background: rgba(17, 16, 28, .94);
  border-bottom-color: rgba(255, 255, 255, .08);
  box-shadow: 0 12px 40px rgba(0, 0, 0, .18);
  backdrop-filter: blur(22px);
  transition: background .2s ease, border-color .2s ease, box-shadow .2s ease, backdrop-filter .2s ease;
}

.pc-experience-shell-header.pc-experience-shell-header-destinations.is-scrolled {
  background: rgba(17, 16, 28, .97);
  border-bottom-color: rgba(255, 255, 255, .1);
  box-shadow: 0 12px 40px rgba(0, 0, 0, .22);
  backdrop-filter: blur(24px);
}

.pc-experience-shell-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 148px;
  color: #fff;
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
  text-decoration: none;
}

.pc-experience-shell-brand img {
  width: 38px;
  height: 38px;
  object-fit: contain;
}

.pc-experience-shell-menu {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.pc-experience-shell-cta {
  min-width: 132px;
  height: 42px;
  border: 0;
  border-radius: ${radii.pill}px;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(126, 166, 31, 0.3);
  background: linear-gradient(135deg, ${shellToken.primary} 0%, ${palette.sky} 100%);
}

.pc-experience-shell-content {
  min-height: calc(100dvh - 76px);
}
.pc-experience-shell-content .pc-page,
.pc-experience-shell-content .pc-box-page,
.pc-experience-shell-content .pc-box-open-page,
.pc-experience-shell-content .pc-layout,
.pc-experience-shell-content .pc-box-layout,
.pc-experience-shell-content .pc-box-open-layout {
  min-height: calc(100dvh - 76px);
}

@media (max-width: 980px) {
  .pc-experience-shell-header {
    height: auto;
    min-height: 76px;
    padding: 14px 22px;
    flex-wrap: wrap;
  }

  .pc-experience-shell-menu {
    order: 3;
    width: 100%;
    flex-basis: 100%;
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
`;

function getIconNode(definition: IconDefinition): AbstractNode {
  return typeof definition.icon === 'function'
    ? definition.icon(palette.primary, palette.sky)
    : definition.icon;
}

function collectPaths(node: AbstractNode): string[] {
  const currentPath = node.tag === 'path' ? node.attrs.d : undefined;
  const childPaths = node.children?.flatMap(collectPaths) ?? [];
  return currentPath ? [currentPath, ...childPaths] : childPaths;
}

function createPcIcon(definition: IconDefinition) {
  const iconNode = getIconNode(definition);
  const paths = collectPaths(iconNode);

  function PcIcon({ size = 16, className, style, ...props }: PcIconProps) {
    return (
      <svg
        aria-hidden="true"
        className={className}
        focusable="false"
        height={size}
        viewBox={iconNode.attrs.viewBox}
        width={size}
        style={style}
        {...props}>
        {paths.map((d, index) => (
          <path key={index} d={d} fill="currentColor" />
        ))}
      </svg>
    );
  }

  return PcIcon;
}

const GiftOutlined = createPcIcon(GiftOutlinedSvg);

export function PcExperienceShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { isBooting } = useApp();
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
            isBlindBoxRoute
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
          primaryAction={
            pathname === '/box/open' || pathname === '/box/result'
              ? undefined
              : {
                  label: '立即抽取',
                  href: pathname === '/box/config' ? undefined : '/box/config',
                  icon: <GiftOutlined />,
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
