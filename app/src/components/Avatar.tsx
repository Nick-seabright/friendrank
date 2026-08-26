import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../theme";

export default function Avatar({ emoji, size = 40 }: { emoji: string; size?: number }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ fontSize: size * 0.55 }}>{emoji || "🙂"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.pendingBg,
    alignItems: "center",
    justifyContent: "center",
  },
});
