import { Redirect, useLocalSearchParams } from 'expo-router';

/** Legacy compatibility route. Adding now happens on the dark detail page. */
export default function LegacyJoinPlanRedirect() {
  const { activityId } = useLocalSearchParams<{ activityId?: string }>();
  const parsedId = Number(activityId);

  if (Number.isFinite(parsedId) && parsedId > 0) {
    return <Redirect href={`/activity/${parsedId}`} />;
  }

  return <Redirect href="/pc" />;
}
