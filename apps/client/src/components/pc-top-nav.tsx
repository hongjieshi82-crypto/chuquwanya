import { Link, type Href, useRouter } from 'expo-router';
import { CalendarOutlined, DownOutlined, LogoutOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Drawer, Dropdown, Layout, Menu, Space } from 'antd';
import type { ButtonProps, MenuProps } from 'antd';
import { useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { Image as NativeImage } from 'react-native';

import { palette } from '@/theme';
import { useApp } from '@/contexts/app-context';

const { Header } = Layout;

type StaticAsset = number | { uri: string };
type MenuItem = Required<MenuProps>['items'][number];

export type PcTopNavItem = {
  key: string;
  label: string;
  href: string;
  active?: boolean;
};

export type PcTopNavToken = {
  ink?: string;
  text?: string;
  primary?: string;
  border?: string;
};

type PcTopNavAction = {
  label: ReactNode;
  href?: string;
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: ButtonProps['onClick'];
};

export type PcTopNavProps = {
  brandHref?: string;
  brandAriaLabel?: string;
  className?: string;
  brandClassName?: string;
  menuClassName?: string;
  items: PcTopNavItem[];
  selectedKey?: string;
  loginHref?: string;
  showLogin?: boolean;
  primaryAction?: PcTopNavAction;
  extra?: ReactNode;
  dataAnime?: string;
  token?: PcTopNavToken;
};

export const PC_TOP_NAV_KEYS = {
  home: 'home',
  trips: 'trips',
  blindBox: 'blind-box',
  attractions: 'attractions',
} as const;

const brandLogo = require('../../assets/images/chuquwanya-logo.png') as StaticAsset;

const pcTopNavCss = `
.pc-top-nav-menu.ant-menu-horizontal {
  flex: 1;
  min-width: 0;
  justify-content: center;
  gap: 26px;
  border-bottom: 0;
  background: transparent;
  line-height: normal;
}

.pc-top-nav-menu.ant-menu-horizontal::before,
.pc-top-nav-menu.ant-menu-horizontal::after {
  display: none !important;
  content: none !important;
}

.pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item {
  top: 0;
  display: inline-flex;
  align-items: center;
  height: 76px;
  margin: 0;
  padding-inline: 0;
  color: var(--pc-top-nav-text);
  font-size: clamp(18px, 1.05vw, 22px);
  font-weight: 760;
  line-height: 76px;
}

.pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item::after {
  inset-inline: 0;
  bottom: 16px;
  height: 4px;
  border: 0 !important;
  border-radius: 4px;
  background: transparent;
}

.pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item:hover,
.pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item-selected {
  color: var(--pc-top-nav-primary);
}

.pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item:hover::after,
.pc-top-nav-menu.ant-menu-horizontal > .ant-menu-item-selected::after {
  background: var(--pc-top-nav-primary);
}

.pc-top-nav-menu.ant-menu-horizontal .ant-menu-title-content {
  display: inline-flex;
  align-items: center;
  height: 100%;
}

.pc-top-nav-menu.ant-menu-horizontal a,
.pc-top-nav-menu.ant-menu-horizontal a.active {
  display: inline-flex;
  align-items: center;
  height: 100%;
  padding-inline: 2px;
  padding-bottom: 0;
  border-bottom: 0;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  text-decoration: none;
  white-space: nowrap;
}

.pc-top-nav-mobile-trigger { display: none; }
.pc-top-nav-mobile-drawer .ant-drawer-body { padding: 18px; }
.pc-top-nav-mobile-drawer .ant-menu { border-inline-end: 0; }
.pc-top-nav-mobile-actions { display: flex; margin-top: 20px; }
.pc-top-nav-mobile-actions .pc-top-nav-actions { display: flex !important; }
.pc-top-nav-user.ant-btn {
  display: inline-flex;
  align-items: center;
  max-width: 190px;
  height: 42px;
  padding: 0 8px;
  color: var(--pc-top-nav-ink);
  font-weight: 700;
}
.pc-top-nav-user-label {
  max-width: 102px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pc-top-nav-user-chevron { color: #98a2b3; font-size: 11px; }

@media (max-width: 1023px) {
  .pc-top-nav-menu.ant-menu-horizontal,
  .pc-top-nav-actions { display: none; }
  .pc-top-nav-mobile-trigger { display: inline-flex; align-items: center; justify-content: center; }
}
`;

function assetUri(source: StaticAsset) {
  if (typeof source === 'object' && source.uri) {
    return source.uri;
  }

  if (typeof source !== 'number') {
    return '';
  }

  const resolveAssetSource = NativeImage.resolveAssetSource as
    | ((asset: number) => { uri?: string } | undefined)
    | undefined;

  return resolveAssetSource?.(source)?.uri ?? '';
}

function navigateToPageSection(event: ReactMouseEvent<HTMLAnchorElement>, href: string) {
  if (typeof window === 'undefined') return;

  const [pathname, hash = ''] = href.split('#');
  const targetId = decodeURIComponent(hash);
  if (!hash || window.location.pathname !== pathname) return;

  event.preventDefault();
  window.history.replaceState(null, '', href);
  document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function getPcTopNavItems({
  activeKey,
  homeHref = '/pc#top',
}: {
  activeKey?: string;
  homeHref?: string;
} = {}): PcTopNavItem[] {
  return [
    { key: PC_TOP_NAV_KEYS.home, label: '周末灵感', href: homeHref },
    { key: PC_TOP_NAV_KEYS.trips, label: '我的行程', href: '/trips', active: activeKey === PC_TOP_NAV_KEYS.trips },
    {
      key: PC_TOP_NAV_KEYS.blindBox,
      label: '旅行抽取',
      href: '/box/config',
      active: activeKey === PC_TOP_NAV_KEYS.blindBox,
    },
    { key: PC_TOP_NAV_KEYS.attractions, label: '可玩地点', href: '/destinations' },
  ];
}

export function PcTopNav({
  brandHref = '/pc',
  brandAriaLabel = '粗去玩鸭！首页',
  className,
  brandClassName,
  menuClassName,
  items,
  selectedKey,
  loginHref = '/pc-login',
  showLogin = true,
  primaryAction,
  extra,
  dataAnime,
  token,
}: PcTopNavProps) {
  const router = useRouter();
  const { isRegistered, logout, user } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const activeKey = selectedKey ?? items.find((item) => item.active)?.key;
  const menuItems: MenuItem[] = items.map((item) => ({
    key: item.key,
    label: item.href.includes('#') ? (
      <Link
        className={item.active ? 'active' : undefined}
        href={item.href as Href}
        onClick={(event) => navigateToPageSection(event, item.href)}>
        {item.label}
      </Link>
    ) : (
      <Link className={item.active ? 'active' : undefined} href={item.href as Href}>
        {item.label}
      </Link>
    ),
  }));
  const style = {
    '--pc-top-nav-ink': token?.ink ?? palette.ink,
    '--pc-top-nav-text': token?.text ?? palette.text,
    '--pc-top-nav-primary': token?.primary ?? palette.primary,
    '--pc-top-nav-border': token?.border ?? palette.border,
  } as CSSProperties;
  const navigateTo = (
    href: string,
    onClick?: ButtonProps['onClick'],
  ): NonNullable<ButtonProps['onClick']> => (event) => {
    onClick?.(event);

    if (!event.defaultPrevented) {
      router.push(href as Href);
    }
  };
  const userLabel = user?.nickname?.trim() || user?.email?.split('@')[0] || '已登录用户';
  const handleUserMenuClick: NonNullable<MenuProps['onClick']> = ({ key }) => {
    if (key === 'trips') {
      router.push('/trips');
      return;
    }

    if (key === 'logout') {
      void logout();
    }
  };
  const userMenuItems: MenuItem[] = [
    { key: 'trips', label: '我的行程', icon: <CalendarOutlined /> },
    { type: 'divider' },
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined /> },
  ];
  const defaultActions = (
    <Space size={12} className="pc-top-nav-actions">
      {isRegistered ? (
        <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight" trigger={['click']}>
          <Button className="pc-top-nav-user" type="text">
            <Avatar icon={<UserOutlined />} size={28} src={user?.avatarUri ?? undefined} />
            <span className="pc-top-nav-user-label">{userLabel}</span>
            <DownOutlined className="pc-top-nav-user-chevron" />
          </Button>
        </Dropdown>
      ) : showLogin ? (
        <Button type="text" onClick={navigateTo(loginHref)}>
          登录
        </Button>
      ) : null}
      {primaryAction ? (
        primaryAction.href ? (
          <Button
            type="primary"
            className={primaryAction.className}
            icon={primaryAction.icon}
            disabled={primaryAction.disabled}
            loading={primaryAction.loading}
            onClick={navigateTo(primaryAction.href, primaryAction.onClick)}>
            {primaryAction.label}
          </Button>
        ) : (
          <Button
            type="primary"
            className={primaryAction.className}
            icon={primaryAction.icon}
            disabled={primaryAction.disabled}
            loading={primaryAction.loading}
            onClick={primaryAction.onClick}>
            {primaryAction.label}
          </Button>
        )
      ) : null}
    </Space>
  );

  return (
    <>
      <style>{pcTopNavCss}</style>
      <Header className={className} data-anime={dataAnime} style={style}>
        <Link className={brandClassName} href={brandHref as Href} aria-label={brandAriaLabel}>
          <img src={assetUri(brandLogo)} alt="粗去玩鸭！" />
          <span>粗去玩鸭！</span>
        </Link>

        <Menu
          className={['pc-top-nav-menu', menuClassName].filter(Boolean).join(' ')}
          mode="horizontal"
          selectedKeys={activeKey ? [activeKey] : []}
          items={menuItems}
        />

        {extra ?? defaultActions}
        <Button
          aria-label="打开导航菜单"
          className="pc-top-nav-mobile-trigger"
          icon={<MenuOutlined />}
          type="text"
          onClick={() => setIsMobileMenuOpen(true)}
        />
        <Drawer
          className="pc-top-nav-mobile-drawer"
          open={isMobileMenuOpen}
          placement="right"
          title="导航"
          onClose={() => setIsMobileMenuOpen(false)}>
          <Menu
            mode="inline"
            selectedKeys={activeKey ? [activeKey] : []}
            items={menuItems}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="pc-top-nav-mobile-actions">{extra ?? defaultActions}</div>
        </Drawer>
      </Header>
    </>
  );
}
