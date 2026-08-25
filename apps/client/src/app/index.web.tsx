import { Redirect } from 'expo-router';

export default function WebIndexRoute() {
  // Web shares one responsive product flow. Native iOS/Android keeps its own tab route.
  return <Redirect href="/pc" />;
}
