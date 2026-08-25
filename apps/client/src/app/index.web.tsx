import { Redirect } from 'expo-router';
import { useWindowDimensions } from 'react-native';

const DESKTOP_BREAKPOINT = 900;

export default function WebIndexRoute() {
  const { width } = useWindowDimensions();

  return <Redirect href={width >= DESKTOP_BREAKPOINT ? '/pc' : '/(tabs)'} />;
}
