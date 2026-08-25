import { Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 32, gap: 12 },
  title: { fontSize: 15, color: "#6B7C8F", textAlign: "center" },
  button: {
    backgroundColor: "#0086F6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
