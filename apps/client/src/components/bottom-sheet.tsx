import { type PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { useLayoutInsets } from '@/hooks/use-layout-insets';
import { palette, radii, shadows, spacing, typography } from '@/theme';

type BottomSheetProps = PropsWithChildren<{
  title: string;
  visible: boolean;
  onClose: () => void;
  edgeToEdge?: boolean;
  showCloseButton?: boolean;
}>;

export function BottomSheet({
  children,
  edgeToEdge = false,
  onClose,
  showCloseButton = true,
  title,
  visible,
}: BottomSheetProps) {
  const insets = useLayoutInsets();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modal}>
        <Pressable
          accessibilityLabel="关闭弹窗"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          pointerEvents="box-none"
          style={[
            styles.sheetWrap,
            {
              paddingBottom: edgeToEdge ? 0 : insets.bottom + spacing.md,
              paddingLeft: edgeToEdge ? 0 : insets.left + spacing.lg,
              paddingRight: edgeToEdge ? 0 : insets.right + spacing.lg,
            },
          ]}>
          <View style={[styles.sheet, edgeToEdge && styles.sheetEdgeToEdge]}>
            <View style={styles.grabber} />
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {showCloseButton ? (
                <Pressable
                  accessibilityLabel="关闭"
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={onClose}
                  style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
                  <AppIcon name="close" size={16} color={palette.muted} />
                </Pressable>
              ) : null}
            </View>
            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(24,20,51,0.34)',
  },
  sheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 430,
    maxHeight: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
    ...shadows.elevated,
  },
  sheetEdgeToEdge: {
    alignSelf: 'stretch',
    maxWidth: '100%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 10,
    marginBottom: 0,
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: palette.borderStrong,
    marginBottom: spacing.md,
  },
  header: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    color: palette.ink,
    fontSize: typography.body,
    lineHeight: 20,
    fontWeight: '900',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.paper,
  },
  pressed: {
    opacity: 0.78,
  },
});
