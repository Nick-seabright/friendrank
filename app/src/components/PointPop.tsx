import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { colors, fontSizes, radii } from "../theme";

interface PointPopProps {
  value: number;
  visible: boolean;
  onDone: () => void;
}

export default function PointPop({ value, visible, onDone }: PointPopProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0);
    translateY.setValue(0);
    opacity.setValue(1);

    Animated.sequence([
      Animated.spring(scale, { toValue: 1.15, friction: 4, tension: 140, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(translateY, { toValue: -60, duration: 350, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start(({ finished }) => {
      if (finished) onDone();
    });
  }, [visible]);

  if (!visible) return null;

  const isPositive = value >= 0;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          opacity,
          transform: [{ scale }, { translateY }],
        },
      ]}
    >
      <Text style={[styles.text, { color: isPositive ? colors.positive : colors.negative }]}>
        {isPositive ? "+" : ""}
        {value}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
    top: "40%",
    backgroundColor: colors.card,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: radii.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  text: {
    fontSize: fontSizes.xxl,
    fontWeight: "800",
  },
});
