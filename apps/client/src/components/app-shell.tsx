import { type PropsWithChildren } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { DynamicIslandOverlay } from '@/components/dynamic-island-overlay';
import { useLayoutInsets } from '@/hooks/use-layout-insets';
import { palette, safeArea } from '@/theme';

type AppShellProps = PropsWithChildren<{
  phonePreview?: boolean;
  screenTone?: 'default' | 'invite';
}>;

export function AppShell({ children, phonePreview = false, screenTone = 'default' }: AppShellProps) {
  const insets = useLayoutInsets();
  const { width } = useWindowDimensions();
  const showPhonePreview = Platform.OS === 'web' && (phonePreview || width > 430);
  const isInviteTone = screenTone === 'invite';

  if (showPhonePreview) {
    return (
      <View style={[styles.shell, styles.previewStage, isInviteTone && styles.shellInvite]}>
        <View style={[styles.phoneScreen, styles.previewScreen, isInviteTone && styles.phoneScreenInvite]}>
          <View style={styles.phoneContent}>{children}</View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.shell,
        isInviteTone && styles.shellInvite,
        { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right },
      ]}>
      <DynamicIslandOverlay />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: palette.canvas,
    minHeight: Platform.OS === 'web' ? ('100dvh' as unknown as number) : undefined,
    position: 'relative',
  },
  shellInvite: {
    backgroundColor: '#E9F6FF',
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage:
            'linear-gradient(180deg, rgba(243,240,255,0) 46%, #F3F0FF 78%), radial-gradient(ellipse at 51% 12%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.28) 28%, rgba(255,255,255,0) 58%), linear-gradient(112deg, #D8F5FF 0%, #E9F1FF 43%, #FFF4CC 100%)',
        } as const)
      : {}),
  },
  previewStage: {
    backgroundColor: palette.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: palette.canvas,
    paddingTop: safeArea.dynamicIslandTop,
    paddingBottom: safeArea.bottomInset,
    position: 'relative',
  },
  phoneScreenInvite: {
    backgroundColor: '#E9F6FF',
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage:
            'linear-gradient(180deg, rgba(243,240,255,0) 46%, #F3F0FF 76%), radial-gradient(ellipse at 51% 16%, rgba(255,255,255,0.66) 0%, rgba(255,255,255,0.30) 30%, rgba(255,255,255,0) 60%), linear-gradient(112deg, #D8F5FF 0%, #E9F1FF 43%, #FFF4CC 100%)',
        } as const)
      : {}),
  },
  previewScreen: {
    width: '100%',
    maxWidth: 430,
    height: Platform.OS === 'web' ? ('100dvh' as unknown as number) : undefined,
    paddingTop: 32,
  },
  phoneContent: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 1040,
    alignSelf: 'center',
    position: 'relative',
  },
});
