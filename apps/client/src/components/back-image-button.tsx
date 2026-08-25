import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { palette } from '@/theme';

export function BackImageButton({
  onPress,
  style,
}: {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityLabel="返回"
      accessibilityRole="button"
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [styles.button, style, styles.transparent, pressed && styles.pressed]}>
      <AppIcon name="arrow-left" size={24} color={palette.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.78,
  },
});
