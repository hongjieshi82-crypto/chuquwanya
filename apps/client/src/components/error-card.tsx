import { Result } from '@ant-design/react-native';
import { StyleSheet } from 'react-native';

import { palette, radii, spacing } from '@/theme';

export function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void | Promise<void>;
}) {
  return (
    <Result
      buttonText={onRetry ? '重试' : undefined}
      buttonType="ghost"
      message={message}
      onButtonClick={onRetry ? () => void onRetry() : undefined}
      style={styles.card}
      title="暂时没接上"
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.errorSoft,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
