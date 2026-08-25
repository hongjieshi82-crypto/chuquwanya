import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resolveLayoutInsets, type DeviceModel, type DeviceProfile, type LayoutInsets } from '@/lib/device-layout';

export type { DeviceModel, DeviceProfile, LayoutInsets };

/** 布局安全区：真机读 SafeAreaInsets 并区分灵动岛/刘海/经典；Web 窄屏回退设计 token */
export function useLayoutInsets(): LayoutInsets {
  const raw = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return resolveLayoutInsets(raw, width);
}
