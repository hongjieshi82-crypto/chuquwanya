import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { bottomTabIcons, type BottomTabId } from '@/constants/bottom-tab-icons';
import { useLayoutInsets } from '@/hooks/use-layout-insets';
import { components, palette, shadows } from '@/theme';

const TAB_HORIZONTAL_INSET = 12;

function TabIcon({ name, label, focused }: { name: BottomTabId; label: string; focused: boolean }) {
  const source = bottomTabIcons[name][focused ? 'active' : 'inactive'];

  return (
    <View style={styles.tabContent}>
      <Image resizeMode="contain" source={source} style={styles.iconImage} />
      <Text numberOfLines={1} style={[styles.iconLabel, focused && styles.iconLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

function MinimalTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const layout = useLayoutInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.tabBarOuter, { bottom: layout.bottom + components.bottomTabFloatGap }]}>
      <View style={[styles.tabBarPill, shadows.tabBar]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key]?.options;
          const label = route.name === 'index' ? '首页' : '本周计划';
          const icon: BottomTabId = route.name === 'index' ? 'home' : 'todos';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [styles.tabItem, pressed && styles.pressed]}>
              <TabIcon name={icon} label={label} focused={focused} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <MinimalTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: '首页' }} />
      <Tabs.Screen name="todos" options={{ title: '本周计划' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: TAB_HORIZONTAL_INSET,
    alignItems: 'center',
  },
  tabBarPill: {
    width: '100%',
    maxWidth: 430,
    height: components.bottomTabHeight,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.98)',
    flexDirection: 'row',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { boxShadow: '0 14px 30px rgba(54, 42, 130, 0.14)' } : {}),
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabContent: { height: 42, alignItems: 'center', justifyContent: 'center', gap: 4 },
  iconImage: { width: 24, height: 24 },
  iconLabel: {
    color: palette.muted,
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 12,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  iconLabelActive: { color: palette.primary },
  pressed: { opacity: 0.72 },
});
