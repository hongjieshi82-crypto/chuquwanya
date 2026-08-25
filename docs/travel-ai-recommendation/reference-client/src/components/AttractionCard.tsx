import { StyleSheet, Text, View } from "react-native";

interface Props {
  name: string;
  rating: number;
  priceRange: string;
  score: number;
  matchTags: string[];
}

export function AttractionCard({ name, rating, priceRange, score, matchTags }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.score}>{(score * 100).toFixed(0)}分</Text>
      </View>
      <Text style={styles.meta}>⭐ {rating.toFixed(1)} · ¥{priceRange}</Text>
      <View style={styles.tags}>
        {matchTags.map((tag) => (
          <Text key={tag} style={styles.tag}>{tag}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E4ECF4",
  },
  header: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 17, fontWeight: "600", color: "#1A2B3C", flex: 1 },
  score: { fontSize: 13, color: "#0086F6", fontWeight: "700" },
  meta: { fontSize: 13, color: "#6B7C8F", marginTop: 6 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: {
    fontSize: 11,
    color: "#0086F6",
    backgroundColor: "#E8F4FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
