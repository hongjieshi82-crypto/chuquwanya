import type { ImageSourcePropType } from 'react-native';

export type BottomTabId = 'home' | 'todos' | 'profile';

export const bottomTabIcons: Record<
  BottomTabId,
  { active: ImageSourcePropType; inactive: ImageSourcePropType }
> = {
  home: {
    active: require('../../assets/images/tabIcons/tab-home-active.png'),
    inactive: require('../../assets/images/tabIcons/tab-home-inactive.png'),
  },
  todos: {
    active: require('../../assets/images/tabIcons/tab-todos-active.png'),
    inactive: require('../../assets/images/tabIcons/tab-todos-inactive.png'),
  },
  profile: {
    active: require('../../assets/images/tabIcons/tab-profile-active.png'),
    inactive: require('../../assets/images/tabIcons/tab-profile-inactive.png'),
  },
};
