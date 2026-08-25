import { StyleSheet, Text, View } from 'react-native';

import { BackImageButton } from '@/components/back-image-button';
import { palette, radii, spacing, typography } from '@/theme';

/** 携程式内页顶栏：返回 + 标题 + 可选步骤 */
export function InnerPageHeader({
  title,
  step,
  onBack,
  variant = 'default',
}: {
  title?: string;
  step?: string;
  onBack: () => void;
  variant?: 'default' | 'light';
}) {
  const light = variant === 'light';
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <BackImageButton onPress={onBack} />
        {step ? <Text style={[styles.step, light && styles.stepLight]}>{step}</Text> : null}
      </View>
      {title ? <Text style={[styles.title, light && styles.titleLight]}>{title}</Text> : null}
    </View>
  );
}

/** 携程式步骤进度条 */
export function StepProgress({ value }: { value: number }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, value))}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  step: { color: palette.muted, fontSize: typography.caption },
  stepLight: { color: 'rgba(255,255,255,0.75)' },
  title: { color: palette.ink, fontSize: typography.h2, fontWeight: '900' },
  titleLight: { color: palette.white },
  track: {
    height: 4,
    borderRadius: radii.xs,
    backgroundColor: palette.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  fill: { height: '100%', backgroundColor: palette.primary, borderRadius: radii.xs },
});
