import { StyleSheet, Text, View } from "react-native";

interface Props {
  reason: string;
  strategies: string[];
}

const STRATEGY_LABEL: Record<string, string> = {
  semantic: "语义匹配",
  tag: "标签匹配",
  collaborative: "相似用户",
  behavior: "行为偏好",
};

export function RecommendReasonBadge({ reason, strategies }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.reason}>💡 {reason}</Text>
      <View style={styles.badges}>
        {strategies.map((s) => (
          <Text key={s} style={styles.badge}>{STRATEGY_LABEL[s] ?? s}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#F8FBFF",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#0086F6",
  },
  reason: { fontSize: 13, color: "#334155", lineHeight: 20 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  badge: {
    fontSize: 10,
    color: "#0086F6",
    backgroundColor: "#E8F4FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
