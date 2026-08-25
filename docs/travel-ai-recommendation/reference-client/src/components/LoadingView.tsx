import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface Props {
  message?: string;
  skeletonCount?: number;
}

export function LoadingView({ message = "加载中…", skeletonCount = 3 }: Props) {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <Animated.View key={i} style={[styles.skeleton, { opacity: pulse }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  message: { fontSize: 14, color: "#6B7C8F", marginBottom: 4 },
  skeleton: {
    height: 96,
    backgroundColor: "#E4ECF4",
    borderRadius: 16,
  },
});
