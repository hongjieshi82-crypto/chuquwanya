import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import type { BottomTabId } from '@/constants/bottom-tab-icons';
import { useLayoutInsets } from '@/hooks/use-layout-insets';
import { components } from '@/theme';

const TAB_HORIZONTAL_INSET = 12;

function TabIcon({ name, focused }: { name: BottomTabId; focused: boolean }) {
  return (
    <View style={styles.tabContent}>
      <AppIcon
        color={focused ? '#C9FF62' : 'rgba(255,255,255,.42)'}
        name={name === 'home' ? 'home' : 'itinerary'}
        size={25}
      />
    </View>
  );
}

function MinimalTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const layout = useLayoutInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.tabBarOuter, { bottom: layout.bottom + components.bottomTabFloatGap }]}>
      <View style={styles.tabBarPill}>
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
              <TabIcon name={icon} focused={focused} />
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
    width: 176,
    height: 58,
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabContent: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.72 },
});
