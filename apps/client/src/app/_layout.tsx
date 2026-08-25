import { Provider as AntdProvider } from '@ant-design/react-native';
import { Slot, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { antdTheme } from '@/antd-theme';
import { PcExperienceShell } from '@/components/pc-experience-shell';
import { AppProvider } from '@/contexts/app-context';
import { palette } from '@/theme';

const pcPaths = new Set([
  '/pc',
  '/destinations',
  '/box/config',
  '/box/open',
  '/box/result',
  '/trips',
  '/place',
  '/theme',
]);

function AppStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.canvas },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="draw" />
      <Stack.Screen name="activity/[id]" />
      <Stack.Screen name="map" />
      <Stack.Screen name="join-plan" />
      <Stack.Screen name="complete-checkin" />
      <Stack.Screen name="user-agreement" />
      <Stack.Screen name="privacy-policy" />
    </Stack>
  );
}

export default function RootLayout() {
  const pathname = usePathname();
  const isPcPage = Platform.OS === 'web' && pcPaths.has(pathname);

  return (
    <SafeAreaProvider>
      <AntdProvider theme={antdTheme}>
        <AppProvider>
          <StatusBar style="dark" />
          {isPcPage ? (
            <PcExperienceShell>
              <Slot />
            </PcExperienceShell>
          ) : (
            <AppStack />
          )}
        </AppProvider>
      </AntdProvider>
    </SafeAreaProvider>
  );
}
