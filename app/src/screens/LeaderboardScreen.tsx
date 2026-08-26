import React, { useCallback, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api, LeaderboardResponse, LeaderboardRow } from "../api/client";
import { useCurrentGroup } from "../context/CurrentGroupContext";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import { colors, fontSizes, radii, shadow, spacing } from "../theme";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardScreen() {
  const { groupId } = useCurrentGroup();
  const { user } = useAuth();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  const load = useCallback(async () => {
    const [lbRes, groupRes] = await Promise.all([
      api.get<LeaderboardResponse>(`/groups/${groupId}/leaderboard`),
      api.get(`/groups/${groupId}`),
    ]);
    setData(lbRes.data);
    setIsCreator(groupRes.data.createdById === user?.id);
  }, [groupId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onReset = () => {
    Alert.alert(
      "Reset leaderboard?",
      "This starts a fresh period. All-time scores stay put — only the live standings reset.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await api.post(`/groups/${groupId}/reset`);
            load();
          },
        },
      ]
    );
  };

  const renderRow = ({ item, index }: { item: LeaderboardRow; index: number }) => (
    <View style={[styles.row, index === 0 && styles.rowFirst]}>
      <Text style={styles.medal}>{MEDALS[index] || `#${index + 1}`}</Text>
      <Avatar emoji={item.user.emoji} size={40} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.user.displayName}</Text>
        <Text style={styles.rowSub}>
          all-time {item.allTimeScore >= 0 ? "+" : ""}
          {item.allTimeScore}
          {item.contestedCount > 0 ? ` · ${item.contestedCount} contested` : ""}
        </Text>
      </View>
      <Text style={[styles.score, item.periodScore < 0 && styles.scoreNegative]}>
        {item.periodScore >= 0 ? "+" : ""}
        {item.periodScore}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.board || []}
        keyExtractor={(r) => r.user.id}
        renderItem={renderRow}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <Text style={styles.periodLabel}>
            Live period since{" "}
            {data ? new Date(data.periodStartAt).toLocaleDateString() : "…"}
          </Text>
        }
      />
      {isCreator && (
        <TouchableOpacity style={styles.resetButton} onPress={onReset}>
          <Text style={styles.resetText}>Reset live period</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: 90 },
  periodLabel: { color: colors.textMuted, fontSize: fontSizes.sm, marginBottom: spacing.md, textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow,
  },
  rowFirst: { borderWidth: 2, borderColor: colors.warning },
  medal: { fontSize: fontSizes.lg, width: 36, textAlign: "center" },
  rowInfo: { flex: 1, marginLeft: spacing.sm },
  rowName: { fontSize: fontSizes.md, fontWeight: "700", color: colors.text },
  rowSub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  score: { fontSize: fontSizes.lg, fontWeight: "800", color: colors.positive },
  scoreNegative: { color: colors.negative },
  resetButton: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  resetText: { color: colors.textMuted, fontWeight: "600" },
});
