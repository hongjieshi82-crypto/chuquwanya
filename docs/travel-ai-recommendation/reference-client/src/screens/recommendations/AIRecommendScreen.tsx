import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { recommendationApi } from "../api/recommendationApi";
import { AttractionCard } from "../components/AttractionCard";
import { RecommendReasonBadge } from "../components/RecommendReasonBadge";
import { LoadingView } from "../components/LoadingView";
import { EmptyState } from "../components/EmptyState";
import type { RecommendItem } from "../types/recommendation";

interface Props {
  destination?: string;
  preferences: string[];
  tripType?: string;
  budget?: number;
  days?: number;
}

export function AIRecommendScreen({
  destination,
  preferences,
  tripType,
  budget,
  days,
}: Props) {
  const [items, setItems] = useState<RecommendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await recommendationApi.getAiRecommendations({
        destination,
        preferences,
        tripType,
        budget,
        days,
      });
      setItems(data.recommendations);
    } catch {
      setError("推荐加载失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [destination, preferences, tripType, budget, days]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingView message="AI 正在为你挑选景点…" skeletonCount={4} />;
  }

  if (error) {
    return <EmptyState title={error} actionLabel="重试" onAction={load} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI 为你推荐</Text>
      <Text style={styles.subtitle}>
        基于你的偏好，从语义、标签、行为、协同过滤多路召回后精排
      </Text>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.attractionId)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <AttractionCard
              name={item.name}
              rating={item.rating}
              priceRange={item.priceRange}
              score={item.score}
              matchTags={item.matchTags}
            />
            <RecommendReasonBadge reason={item.aiReason} strategies={item.recStrategy} />
          </View>
        )}
        ListEmptyComponent={<EmptyState title="暂无推荐结果" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F8FC", padding: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#1A2B3C" },
  subtitle: { fontSize: 13, color: "#6B7C8F", marginTop: 4, marginBottom: 16 },
  list: { gap: 12, paddingBottom: 32 },
  cardWrap: { gap: 8 },
});
