import { Button } from '@ant-design/react-native';
import { StyleSheet } from 'react-native';

import { components, radii } from '@/theme';

export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Button
      disabled={disabled || loading}
      loading={loading}
      onPress={onPress}
      size="large"
      style={styles.button}>
      {loading ? '请稍候…' : label}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: components.buttonSecondaryHeight,
    borderRadius: radii.md,
  },
});
