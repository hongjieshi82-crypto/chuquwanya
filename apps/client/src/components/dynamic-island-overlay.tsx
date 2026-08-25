import { Platform, StyleSheet, View } from 'react-native';

import { useLayoutInsets } from '@/hooks/use-layout-insets';
import { isDynamicIslandPreviewActive } from '@/lib/device-layout';

/**
 * Web 机型预览用灵动岛装饰（真机由系统绘制，日常 Web 不展示）
 * 仅 URL 带 ?device=iphone-15-pro 等灵动岛机型时显示
 */
export function DynamicIslandOverlay() {
  const { island } = useLayoutInsets();

  if (
    Platform.OS !== 'web' ||
    !isDynamicIslandPreviewActive() ||
    !island
  ) {
    return null;
  }

  return (
    <View style={styles.wrap} pointerEvents="none" accessibilityElementsHidden>
      <View
        style={{
          marginTop: island.offsetTop,
          width: island.width,
          height: island.height,
          borderRadius: island.height / 2,
          backgroundColor: '#141820',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
});
