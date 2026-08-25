import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { searchApi } from "../../api/recommendationApi";
import { SemanticSearchBar } from "../../components/SemanticSearchBar";
import { LoadingView } from "../../components/LoadingView";
import { EmptyState } from "../../components/EmptyState";

interface SearchHit {
  id: number;
  type: "attraction" | "destination";
  name: string;
  summary: string;
  score: number;
  tags: string[];
}

export function SemanticSearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) return;

    setLoading(true);
    try {
      const data = await searchApi.semanticSearch(text.trim(), "all");
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>语义搜索</Text>
      <Text style={styles.subtitle}>试试：「适合情侣的海边旅行」或「预算 3000 以内的亲子游」</Text>

      <SemanticSearchBar
        value={query}
        placeholder="用自然语言描述你想去的地方…"
        onChangeText={setQuery}
        onSubmit={handleSearch}
      />

      {loading ? (
        <LoadingView message="理解你的意图中…" skeletonCount={3} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            query.length >= 2 ? (
              <EmptyState title="没有找到语义匹配的结果" />
            ) : (
              <EmptyState title="输入描述开始搜索" />
            )
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.badge}>{item.type === "destination" ? "目的地" : "景点"}</Text>
              </View>
              <Text style={styles.summary} numberOfLines={2}>{item.summary}</Text>
              <Text style={styles.score}>匹配度 {(item.score * 100).toFixed(0)}%</Text>
              <View style={styles.tags}>
                {item.tags.slice(0, 4).map((tag) => (
                  <Text key={tag} style={styles.tag}>{tag}</Text>
                ))}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F8FC", padding: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#1A2B3C" },
  subtitle: { fontSize: 13, color: "#6B7C8F", marginVertical: 8 },
  list: { gap: 12, paddingTop: 12, paddingBottom: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E4ECF4",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 17, fontWeight: "600", color: "#1A2B3C", flex: 1 },
  badge: {
    fontSize: 11,
    color: "#0086F6",
    backgroundColor: "#E8F4FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  summary: { fontSize: 14, color: "#6B7C8F", marginTop: 8 },
  score: { fontSize: 12, color: "#0086F6", marginTop: 8 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: {
    fontSize: 11,
    color: "#4A6075",
    backgroundColor: "#F0F4F8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
