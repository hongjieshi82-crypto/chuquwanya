import { ScrollView, StyleSheet, Text, View } from "react-native";

interface Props {
  rawJson: string;
}

export function AITripCard({ rawJson }: Props) {
  let trip: {
    tripTitle?: string;
    summary?: string;
    days?: Array<{ day: number; theme: string; items: Array<{ name: string; type: string }> }>;
    totalBudgetEstimate?: string;
    travelTips?: string[];
  } = {};

  try {
    trip = JSON.parse(rawJson.replace(/```json|```/g, "").trim());
  } catch {
    return (
      <View style={styles.card}>
        <Text style={styles.error}>行程 JSON 解析失败，请重试</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.card}>
      <Text style={styles.title}>{trip.tripTitle ?? "AI 行程"}</Text>
      {trip.summary ? <Text style={styles.summary}>{trip.summary}</Text> : null}

      {trip.days?.map((day) => (
        <View key={day.day} style={styles.dayBlock}>
          <Text style={styles.dayTitle}>Day {day.day} · {day.theme}</Text>
          {day.items.map((item, idx) => (
            <Text key={idx} style={styles.item}>
              · [{item.type}] {item.name}
            </Text>
          ))}
        </View>
      ))}

      {trip.totalBudgetEstimate ? (
        <Text style={styles.budget}>预估总费用：{trip.totalBudgetEstimate}</Text>
      ) : null}

      {trip.travelTips?.map((tip, i) => (
        <Text key={i} style={styles.tip}>💡 {tip}</Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E4ECF4",
    maxHeight: 480,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#1A2B3C" },
  summary: { fontSize: 14, color: "#6B7C8F", marginTop: 8 },
  dayBlock: { marginTop: 16 },
  dayTitle: { fontSize: 15, fontWeight: "600", color: "#0086F6" },
  item: { fontSize: 14, color: "#334155", marginTop: 6, paddingLeft: 4 },
  budget: { fontSize: 14, fontWeight: "600", color: "#FF7700", marginTop: 16 },
  tip: { fontSize: 13, color: "#6B7C8F", marginTop: 8 },
  error: { color: "#E53E3E" },
});
