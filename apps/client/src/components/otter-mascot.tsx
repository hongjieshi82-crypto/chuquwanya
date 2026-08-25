import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { palette } from '@/theme';

type OtterMascotProps = {
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

const SIZE_MAP = {
  sm: 0.72,
  md: 1,
  lg: 1.22,
} as const;

/** 参考图风格的轻量 IP：用基础 View 组合，避免额外图片资源拖慢首屏。 */
export function OtterMascot({ size = 'md', style }: OtterMascotProps) {
  const scale = SIZE_MAP[size];
  const width = 120 * scale;
  const height = 136 * scale;

  return (
    <View style={[styles.wrap, { width, height }, style]}>
      <View style={[styles.ear, styles.leftEar, { transform: [{ rotate: '-12deg' }, { scale }] }]} />
      <View style={[styles.ear, styles.rightEar, { transform: [{ rotate: '12deg' }, { scale }] }]} />
      <View style={[styles.body, { transform: [{ scale }] }]}>
        <View style={styles.face}>
          <View style={styles.eye} />
          <View style={[styles.eye, styles.eyeRight]} />
          <View style={styles.nose} />
          <View style={styles.mouth} />
        </View>
        <View style={styles.cheekLeft} />
        <View style={styles.cheekRight} />
        <View style={styles.belly}>
          <Text style={styles.bellyText}>GO</Text>
        </View>
      </View>
      <View style={[styles.arm, styles.leftArm, { transform: [{ rotate: '-18deg' }, { scale }] }]} />
      <View style={[styles.arm, styles.rightArm, { transform: [{ rotate: '22deg' }, { scale }] }]} />
      <View style={[styles.shadow, { transform: [{ scale }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  body: {
    width: 92,
    height: 112,
    borderRadius: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(117,101,246,0.12)',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    zIndex: 2,
  },
  face: {
    width: 66,
    height: 44,
    borderRadius: 24,
    backgroundColor: '#F8F7FF',
    marginTop: 16,
    position: 'relative',
  },
  ear: {
    position: 'absolute',
    top: 16,
    width: 28,
    height: 44,
    borderRadius: 18,
    backgroundColor: palette.primaryLight,
    zIndex: 1,
  },
  leftEar: {
    left: 20,
  },
  rightEar: {
    right: 20,
  },
  eye: {
    position: 'absolute',
    left: 17,
    top: 13,
    width: 5,
    height: 8,
    borderRadius: 3,
    backgroundColor: palette.ink,
  },
  eyeRight: {
    left: 44,
  },
  nose: {
    position: 'absolute',
    left: 29,
    top: 20,
    width: 10,
    height: 7,
    borderRadius: 5,
    backgroundColor: palette.ink,
  },
  mouth: {
    position: 'absolute',
    left: 31,
    top: 29,
    width: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(24,20,51,0.48)',
  },
  cheekLeft: {
    position: 'absolute',
    left: 18,
    top: 54,
    width: 9,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.coralSoft,
  },
  cheekRight: {
    position: 'absolute',
    right: 18,
    top: 54,
    width: 9,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.coralSoft,
  },
  belly: {
    position: 'absolute',
    bottom: 13,
    width: 50,
    height: 28,
    borderRadius: 18,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellyText: {
    color: palette.primaryDark,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  arm: {
    position: 'absolute',
    top: 68,
    width: 22,
    height: 54,
    borderRadius: 14,
    backgroundColor: palette.primaryLight,
    zIndex: 3,
  },
  leftArm: {
    left: 10,
  },
  rightArm: {
    right: 9,
  },
  shadow: {
    position: 'absolute',
    bottom: 2,
    width: 74,
    height: 16,
    borderRadius: 37,
    backgroundColor: 'rgba(84,70,175,0.14)',
    zIndex: 0,
  },
});
