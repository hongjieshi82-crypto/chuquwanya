import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { tripApi } from "../../api/recommendationApi";
import { StreamingText } from "../../components/StreamingText";
import { TagSelector } from "../../components/TagSelector";
import { AITripCard } from "../../components/AITripCard";

const PREFERENCE_OPTIONS = ["自然风光", "历史文化", "美食购物", "亲子游", "情侣游"];

export function AITripGenerateScreen() {
  const [destination, setDestination] = useState("云南");
  const [days, setDays] = useState("5");
  const [budget, setBudget] = useState("5000");
  const [travelers, setTravelers] = useState("2");
  const [preferences, setPreferences] = useState<string[]>(["自然风光"]);
  const [streaming, setStreaming] = useState("");
  const [loading, setLoading] = useState(false);
  const [tripJson, setTripJson] = useState<string | null>(null);

  const handleGenerate = () => {
    setLoading(true);
    setStreaming("");
    setTripJson(null);

    tripApi.generateTripStream(
      {
        destination,
        days: Number(days),
        budget: Number(budget),
        travelers: Number(travelers),
        preferences,
        tripType: "情侣游",
      },
      (delta) => setStreaming((prev) => prev + delta),
      (full) => {
        setLoading(false);
        setTripJson(full);
      },
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>AI 智能行程</Text>

      <Text style={styles.label}>目的地</Text>
      <TextInput style={styles.input} value={destination} onChangeText={setDestination} />

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>天数</Text>
          <TextInput style={styles.input} value={days} onChangeText={setDays} keyboardType="number-pad" />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>预算（元）</Text>
          <TextInput style={styles.input} value={budget} onChangeText={setBudget} keyboardType="number-pad" />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>人数</Text>
          <TextInput style={styles.input} value={travelers} onChangeText={setTravelers} keyboardType="number-pad" />
        </View>
      </View>

      <Text style={styles.label}>偏好标签</Text>
      <TagSelector options={PREFERENCE_OPTIONS} selected={preferences} onChange={setPreferences} />

      <Pressable style={styles.button} onPress={handleGenerate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>生成行程</Text>}
      </Pressable>

      {loading && streaming ? (
        <View style={styles.streamBox}>
          <Text style={styles.streamTitle}>AI 正在规划…</Text>
          <StreamingText text={streaming} />
        </View>
      ) : null}

      {tripJson ? <AITripCard rawJson={tripJson} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F8FC" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "700", color: "#1A2B3C" },
  label: { fontSize: 13, color: "#6B7C8F", marginBottom: 4 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E4ECF4",
  },
  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },
  button: {
    backgroundColor: "#0086F6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  streamBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E4ECF4",
  },
  streamTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#1A2B3C" },
});
