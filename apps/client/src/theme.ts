import { Platform } from 'react-native';

/**
 * 懒得动 · 智能设备灵感视觉主题 v0.6
 * 参考图方向：浅紫蓝渐变、圆润白卡、可爱 IP、健康设备 App 的轻快感。
 */
export const palette = {
  // 背景 · 冰蓝紫柔光
  canvas: '#F3F0FF',
  surface: '#FFFFFF',
  paper: '#F8F7FF',
  contour: '#E8E1FF',

  // 文字 · 柔和深紫层级
  ink: '#181433',
  text: '#3F3A62',
  muted: '#7C77A3',
  placeholder: '#AAA5C8',

  // 主色 · 参考图紫蓝
  primary: '#7565F6',
  primaryDark: '#5C4DE0',
  primaryLight: '#9D8CFF',
  primarySoft: '#EEEAFE',

  // 辅助蓝阶 · 清透健康感
  sky: '#8EC8FF',
  skySoft: '#EAF6FF',
  coast: '#5EACEB',

  // 暖色 · 激励与活动点
  sunset: '#FF8F73',
  sunsetSoft: '#FFF0EA',
  dune: '#FFD36A',
  duneSoft: '#FFF8D9',

  // 功能色
  coral: '#FF6B8E',
  coralSoft: '#FFEAF1',
  seafoam: '#62DCA8',
  seafoamSoft: '#E9FBF3',
  yellow: '#FFD36A',
  yellowSoft: '#FFF8D9',
  greenSoft: '#E9FBF3',
  graySoft: '#F8F7FF',

  // 状态
  success: '#43C888',
  warning: '#FFAA43',
  error: '#F05B6B',
  errorSoft: '#FFE8EC',
  info: '#7565F6',

  // 边框
  border: '#E9E4FA',
  borderStrong: '#D8CFF6',
  white: '#FFFFFF',

  /** 价格 / 强调数字专用 */
  price: '#7565F6',
} as const;

/**
 * 历史版本色值存档（仅供回溯对照，勿在新代码中引用）
 * v0.3 dusk: primary #5E4AE3 / v0.4 coastal: primary #0891B2
 * v0.5 ctrip: primary #0086F6 / v0.6 otter-device（当前）: primary #7565F6
 */
export const _legacyTokens = {
  /** v0.2 pine 旧版色值 */
  pine: { canvas: '#FFFAF2', primary: '#7157FF', ink: '#16152A', border: '#ECE6DE' },
  /** v0.4 coastal 旧版色值 */
  coastal: { canvas: '#F0FAFF', primary: '#0891B2', primaryDark: '#0E7490' },
  /** v0.5 ctrip 旧版色值 */
  ctrip: { canvas: '#F4F4F4', primary: '#0086F6', primaryDark: '#006FD6' },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

/** 参考图卡片更圆润，偏柔和设备 App 感 */
export const radii = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 16,
  xl: 22,
  '2xl': 30,
  pill: 999,
} as const;

export const typography = {
  display: Platform.OS === 'web' ? 36 : 32,
  h1: 24,
  h2: 18,
  h3: 16,
  body: 14,
  caption: 12,
  label: 11,
  numLarge: 26,
  hero: Platform.OS === 'web' ? 40 : 36,
  price: 22,
} as const;

export const lineHeights = {
  tight: 1.15,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const components = {
  buttonPrimaryHeight: Platform.OS === 'web' ? 44 : 48,
  buttonSecondaryHeight: Platform.OS === 'web' ? 44 : 48,
  buttonGhostHeight: 40,
  topBarHeight: 56,
  bottomTabHeight: 65,
  /** 悬浮 Tab 栏与屏幕底边的间距 */
  bottomTabFloatGap: 12,
  searchHeight: 44,
  chipHeight: 28,
  tagHeight: 20,
  fabSize: 52,
  minTouchTarget: 44,
  h5FixedCtaHeight: 56,
} as const;

/** 具体手机型号规格（灵动岛 / 刘海 / 经典） */
export type DeviceModel =
  | 'iphone-16-pro'
  | 'iphone-15-pro'
  | 'iphone-14-pro'
  | 'iphone-16'
  | 'iphone-15'
  | 'iphone-14'
  | 'iphone-13'
  | 'iphone-se-3'
  | 'android-default'
  | 'web-mobile'
  | 'web-desktop';

export type DeviceProfile = 'dynamic-island' | 'notch' | 'classic';

type DeviceModelSpec = {
  label: string;
  profile: DeviceProfile;
  top: number;
  bottom: number;
  island: { width: number; height: number; offsetTop: number } | null;
};

export const deviceModels: Record<DeviceModel, DeviceModelSpec> = {
  'iphone-16-pro': {
    label: 'iPhone 16 Pro',
    profile: 'dynamic-island',
    top: 59,
    bottom: 34,
    island: { width: 126, height: 37, offsetTop: 11 },
  },
  'iphone-15-pro': {
    label: 'iPhone 15 Pro',
    profile: 'dynamic-island',
    top: 59,
    bottom: 34,
    island: { width: 126, height: 37, offsetTop: 11 },
  },
  'iphone-14-pro': {
    label: 'iPhone 14 Pro',
    profile: 'dynamic-island',
    top: 59,
    bottom: 34,
    island: { width: 126, height: 37, offsetTop: 11 },
  },
  'iphone-16': {
    label: 'iPhone 16',
    profile: 'notch',
    top: 47,
    bottom: 34,
    island: null,
  },
  'iphone-15': {
    label: 'iPhone 15',
    profile: 'notch',
    top: 47,
    bottom: 34,
    island: null,
  },
  'iphone-14': {
    label: 'iPhone 14',
    profile: 'notch',
    top: 47,
    bottom: 34,
    island: null,
  },
  'iphone-13': {
    label: 'iPhone 13',
    profile: 'notch',
    top: 47,
    bottom: 34,
    island: null,
  },
  'iphone-se-3': {
    label: 'iPhone SE',
    profile: 'classic',
    top: 20,
    bottom: 0,
    island: null,
  },
  'android-default': {
    label: 'Android',
    profile: 'classic',
    top: 24,
    bottom: 0,
    island: null,
  },
  'web-mobile': {
    label: 'Web 移动端',
    profile: 'classic',
    top: 0,
    bottom: 0,
    island: null,
  },
  'web-desktop': {
    label: '桌面 Web',
    profile: 'classic',
    top: 0,
    bottom: 0,
    island: null,
  },
};

export const safeArea = {
  /** top ≥ 此值视为灵动岛机型 */
  dynamicIslandThreshold: 51,
  /** top ≥ 此值且 < dynamicIslandThreshold 视为刘海屏 */
  notchThreshold: 44,
  dynamicIslandTop: 59,
  notchTop: 47,
  classicTop: 20,
  bottomInset: 34,
  classicBottom: 0,
  dynamicIslandWidth: 126,
  dynamicIslandHeight: 37,
  dynamicIslandOffsetTop: 11,
  topBarHeight: 56,
  /** @deprecated 使用 contentStartY(profile) 或 useLayoutInsets().contentStartY */
  contentStartY: 59 + 56,
} as const;

/** 各机型首屏内容起点 Y */
export function contentStartYForProfile(profile: 'dynamic-island' | 'notch' | 'classic'): number {
  const tops = {
    'dynamic-island': safeArea.dynamicIslandTop,
    notch: safeArea.notchTop,
    classic: safeArea.classicTop,
  } as const;
  return tops[profile] + safeArea.topBarHeight;
}

export const shadows = {
  card: Platform.select({
    web: { boxShadow: '0 12px 32px rgba(90, 72, 188, 0.10)' },
    default: {
      shadowColor: '#5A48BC',
      shadowOpacity: 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
  }),
  elevated: Platform.select({
    web: { boxShadow: '0 18px 44px rgba(90, 72, 188, 0.16)' },
    default: {
      shadowColor: '#5A48BC',
      shadowOpacity: 0.16,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 12 },
      elevation: 5,
    },
  }),
  /** 悬浮底部导航栏阴影（高保真稿 bottom-nav） */
  tabBar: Platform.select({
    web: { boxShadow: '0 14px 42px rgba(84, 70, 175, 0.18)' },
    default: {
      shadowColor: '#5446AF',
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    },
  }),
  primaryButton: Platform.select({
    web: { boxShadow: '0 10px 24px rgba(117, 101, 246, 0.30)' },
    default: {
      shadowColor: '#7565F6',
      shadowOpacity: 0.3,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
  }),
} as const;

export const tagColors = {
  hike: { bg: palette.primarySoft, text: palette.primaryDark },
  city: { bg: palette.skySoft, text: palette.coast },
  food: { bg: palette.sunsetSoft, text: palette.sunset },
  season: { bg: palette.duneSoft, text: '#CC8800' },
  camp: { bg: palette.seafoamSoft, text: '#00875A' },
  hot: { bg: palette.sunsetSoft, text: palette.sunset },
} as const;
