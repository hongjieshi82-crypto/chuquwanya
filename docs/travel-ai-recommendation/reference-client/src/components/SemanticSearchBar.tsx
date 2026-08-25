import { Pressable, StyleSheet, TextInput, View } from "react-native";

interface Props {
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  onSubmit: (text: string) => void;
}

export function SemanticSearchBar({ value, placeholder, onChangeText, onSubmit }: Props) {
  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#9AAFC0"
        onChangeText={onChangeText}
        onSubmitEditing={() => onSubmit(value)}
        returnKeyType="search"
      />
      <Pressable style={styles.btn} onPress={() => onSubmit(value)}>
        {/* 图标可替换为 @expo/vector-icons */}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4ECF4",
    overflow: "hidden",
  },
  input: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  btn: { width: 48, backgroundColor: "#0086F6" },
});
