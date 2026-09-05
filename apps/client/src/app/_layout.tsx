import { Provider as AntdProvider } from '@ant-design/react-native';
import { Navigator, Redirect, Slot, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { antdTheme } from '@/antd-theme';
import { PcExperienceShell } from '@/components/pc-experience-shell';
import { AppProvider, useApp } from '@/contexts/app-context';
import { palette } from '@/theme';
import { MobileNavigation } from '@/components/mobile-navigation';
import { MobileLayoutStyles } from '@/components/mobile-layout';

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
      <Stack.Screen
        name="activity/[id]"
        options={Platform.OS === 'web' ? {
          animation: 'none',
          contentStyle: { backgroundColor: '#0d1012' },
        } : undefined}
      />
      <Stack.Screen name="map" />
      <Stack.Screen name="join-plan" />
      <Stack.Screen name="complete-checkin" />
      <Stack.Screen name="user-agreement" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="pc-login" options={Platform.OS === 'web' ? { animation: 'none', contentStyle: { backgroundColor: '#090b09' } } : undefined} />
    </Stack>
  );
}

function RoutedContent() {
  const pathname = usePathname();
  const isPcPage = Platform.OS === 'web' && pcPaths.has(pathname);
  const { isBooting, isRegistered } = useApp();
  const legacyRoutes: Record<string, '/pc' | '/trips' | '/box/config' | '/destinations'> = {
    '/': '/pc', '/todos': '/trips', '/(tabs)': '/pc', '/(tabs)/todos': '/trips',
    '/preferences': '/box/config', '/draw': '/box/config', '/place': '/destinations', '/theme': '/box/config',
  };
  if (Platform.OS === 'web' && legacyRoutes[pathname]) return <Redirect href={legacyRoutes[pathname]} />;
  // Guests may browse the product and configure a draw. Authentication is
  // requested only when they start an account-bound action.
  const isPublicRoute = pathname === '/pc' || pathname === '/destinations' || pathname === '/trips' || pathname === '/box/config' || pathname.startsWith('/activity/') || pathname === '/pc-login' || pathname === '/user-agreement' || pathname === '/privacy-policy';
  const isLocalGuestDrawRoute = __DEV__ && pathname.startsWith('/box/');

  if (!isBooting && !isRegistered && !isPublicRoute && !isLocalGuestDrawRoute) {
    return <Redirect href="/pc-login" />;
  }

  return <>
    {isPcPage ? <PcExperienceShell><Slot /></PcExperienceShell> : Platform.OS === 'web' ? <Slot /> : <AppStack />}
    {Platform.OS === 'web' ? <><MobileLayoutStyles /><MobileNavigation /></> : null}
  </>;
}

export default function RootLayout() {

  return (
    <SafeAreaProvider>
      <AntdProvider theme={antdTheme}>
        <AppProvider>
          <StatusBar style="dark" />
          {Platform.OS === 'web' ? <Navigator><RoutedContent /></Navigator> : <RoutedContent />}
        </AppProvider>
      </AntdProvider>
    </SafeAreaProvider>
  );
}
