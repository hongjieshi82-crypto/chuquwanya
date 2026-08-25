import { Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export function TagSelector({ options, selected, onChange }: Props) {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <View style={styles.wrap}>
      {options.map((tag) => {
        const active = selected.includes(tag);
        return (
          <Pressable
            key={tag}
            style={[styles.tag, active && styles.tagActive]}
            onPress={() => toggle(tag)}
          >
            <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D8E3EE",
  },
  tagActive: { backgroundColor: "#E8F4FF", borderColor: "#0086F6" },
  tagText: { fontSize: 13, color: "#4A6075" },
  tagTextActive: { color: "#0086F6", fontWeight: "600" },
});
