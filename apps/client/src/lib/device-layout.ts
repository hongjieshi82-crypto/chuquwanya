import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

import { components, deviceModels, safeArea, type DeviceModel, type DeviceProfile } from '@/theme';

export type { DeviceModel, DeviceProfile };

export type LayoutInsets = EdgeInsets & {
  model: DeviceModel;
  profile: DeviceProfile;
  hasDynamicIsland: boolean;
  hasNotch: boolean;
  /** 灵动岛胶囊尺寸（非灵动岛机型为 null） */
  island: { width: number; height: number; offsetTop: number } | null;
  contentStartY: number;
  /** 底部 Tab 总高度（内容区 + home 条），与 React Navigation 计算方式一致 */
  tabBarHeight: number;
  fixedBottomBarHeight: number;
  isMobileWeb: boolean;
  isWebDesktop: boolean;
};

const MOBILE_WEB_MAX_WIDTH = 430;

/** React Navigation BottomTabBar 内容区高度（与 theme.components.bottomTabHeight 一致） */
const TAB_BAR_CONTENT_HEIGHT = 65;
/** 悬浮 Tab 栏距底边留白（与 theme.components.bottomTabFloatGap 一致） */
const TAB_BAR_FLOAT_GAP = 12;

function getModelSpec(model: DeviceModel) {
  return deviceModels[model];
}

/** 根据系统 safe-area top 推断形态（真机兜底） */
export function inferProfileFromTopInset(top: number): DeviceProfile {
  if (top >= safeArea.dynamicIslandThreshold) return 'dynamic-island';
  if (top >= safeArea.notchThreshold) return 'notch';
  return 'classic';
}

/** 真机：expo-device 识别具体 iPhone 型号 */
function detectNativeModel(): DeviceModel {
  if (Platform.OS === 'android') return 'android-default';

  const name = (Device.modelName ?? '').toLowerCase();

  if (name.includes('iphone 16 pro')) return 'iphone-16-pro';
  if (name.includes('iphone 15 pro')) return 'iphone-15-pro';
  if (name.includes('iphone 14 pro')) return 'iphone-14-pro';
  if (name.includes('iphone 16')) return 'iphone-16';
  if (name.includes('iphone 15')) return 'iphone-15';
  if (name.includes('iphone 14')) return 'iphone-14';
  if (name.includes('iphone 13')) return 'iphone-13';
  if (name.includes('iphone se')) return 'iphone-se-3';
  if (name.includes('iphone 12')) return 'iphone-13';
  if (name.includes('iphone 11')) return 'iphone-13';
  if (name.includes('iphone x')) return 'iphone-13';

  return 'iphone-15-pro';
}

/** Web 预览：?device=iphone-15-pro|iphone-14|iphone-se-3 等 */
function getWebModelOverride(): DeviceModel | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('device');
  if (!value) return null;

  const aliases: Record<string, DeviceModel> = {
    island: 'iphone-15-pro',
    'dynamic-island': 'iphone-15-pro',
    'iphone-16-pro': 'iphone-16-pro',
    'iphone-15-pro': 'iphone-15-pro',
    'iphone-14-pro': 'iphone-14-pro',
    'iphone-16': 'iphone-16',
    'iphone-15': 'iphone-15',
    'iphone-14': 'iphone-14',
    'iphone-13': 'iphone-13',
    notch: 'iphone-14',
    'iphone-se': 'iphone-se-3',
    'iphone-se-3': 'iphone-se-3',
    se: 'iphone-se-3',
    classic: 'iphone-se-3',
    android: 'android-default',
  };

  return aliases[value] ?? null;
}

function resolveModel(windowWidth: number, topFromEnv: number): DeviceModel {
  if (Platform.OS === 'web') {
    if (windowWidth > MOBILE_WEB_MAX_WIDTH) return 'web-desktop';
    // 默认 Web 移动端不模拟 iPhone；仅 ?device= 时进入机型预览
    return getWebModelOverride() ?? 'web-mobile';
  }
  if (topFromEnv > 0) {
    const profile = inferProfileFromTopInset(topFromEnv);
    if (profile === 'dynamic-island') return detectNativeModel();
    if (profile === 'notch') {
      const native = detectNativeModel();
      if (native !== 'iphone-15-pro' && native !== 'iphone-16-pro' && native !== 'iphone-14-pro') {
        return native;
      }
      return 'iphone-14';
    }
    return 'iphone-se-3';
  }
  return detectNativeModel();
}

function buildLayoutInsets(
  top: number,
  bottom: number,
  left: number,
  right: number,
  model: DeviceModel,
  isMobileWeb: boolean,
  isWebDesktop: boolean,
): LayoutInsets {
  const spec = getModelSpec(model);
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + TAB_BAR_FLOAT_GAP + bottom;
  const fixedBottomBarHeight = components.h5FixedCtaHeight + bottom;

  return {
    top,
    bottom,
    left,
    right,
    model,
    profile: spec.profile,
    hasDynamicIsland: spec.profile === 'dynamic-island',
    hasNotch: spec.profile === 'notch',
    island: spec.island,
    contentStartY: top + safeArea.topBarHeight,
    tabBarHeight,
    fixedBottomBarHeight,
    isMobileWeb,
    isWebDesktop,
  };
}

/**
 * 统一解析布局安全区：
 * - 真机：SafeAreaInsets + expo-device 型号
 * - Web 窄屏：设计 token + ?device= 切换机型
 */
export function resolveLayoutInsets(raw: EdgeInsets, windowWidth: number): LayoutInsets {
  const isMobileWeb = Platform.OS === 'web' && windowWidth <= MOBILE_WEB_MAX_WIDTH;
  const isWebDesktop = Platform.OS === 'web' && windowWidth > MOBILE_WEB_MAX_WIDTH;

  if (isWebDesktop) {
    return buildLayoutInsets(0, 0, raw.left, raw.right, 'web-desktop', false, true);
  }

  const topFromEnv = raw.top;
  const bottomFromEnv = raw.bottom;
  const model = resolveModel(windowWidth, topFromEnv);
  const spec = getModelSpec(model);

  if (topFromEnv > 0 || bottomFromEnv > 0) {
    return buildLayoutInsets(
      topFromEnv,
      bottomFromEnv,
      raw.left,
      raw.right,
      model,
      isMobileWeb,
      false,
    );
  }

  if (isMobileWeb) {
    // 无 env 时不模拟 Home 条；top 仅在 ?device= 预览模式下使用设计稿值
    return buildLayoutInsets(
      topFromEnv > 0 ? topFromEnv : spec.top,
      bottomFromEnv,
      raw.left,
      raw.right,
      model,
      true,
      false,
    );
  }

  return buildLayoutInsets(
    spec.top,
    bottomFromEnv,
    raw.left,
    raw.right,
    model,
    false,
    false,
  );
}

/** 是否处于 Web 灵动岛机型预览（需 URL ?device=iphone-15-pro 等） */
export function isDynamicIslandPreviewActive(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const model = getWebModelOverride();
  if (!model) return false;
  return deviceModels[model].profile === 'dynamic-island';
}

/** 传给 Tabs 的 safeAreaInsets */
export function getTabSafeAreaInsets(layout: LayoutInsets): EdgeInsets {
  return {
    top: 0,
    left: layout.left,
    right: layout.right,
    bottom: layout.bottom,
  };
}
