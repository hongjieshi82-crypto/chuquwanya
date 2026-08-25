import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";

interface Props {
  text: string;
}

/** LLM 流式输出：逐字淡入，提升感知速度 */
export function StreamingText({ text }: Props) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ]),
    ).start();
  }, [opacity]);

  return (
    <Animated.Text style={[styles.text, { opacity }]}>
      {text || "…"}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 14, lineHeight: 22, color: "#334155", fontFamily: "Menlo" },
});
