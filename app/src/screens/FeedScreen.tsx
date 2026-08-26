import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api, PointEntry } from "../api/client";
import { useCurrentGroup } from "../context/CurrentGroupContext";
import Avatar from "../components/Avatar";
import { colors, fontSizes, radii, shadow, spacing } from "../theme";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function FeedScreen() {
  const { groupId } = useCurrentGroup();
  const [entries, setEntries] = useState<PointEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await api.get<PointEntry[]>(`/groups/${groupId}/feed`);
    setEntries(res.data);
  }, [groupId]);

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

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nothing logged yet. Go start something.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.status === "DISPUTED" && styles.cardDisputed]}>
            <Avatar emoji={item.recipient?.emoji || "🙂"} size={36} />
            <View style={styles.cardBody}>
              <Text style={styles.cardText}>
                <Text style={styles.bold}>{item.sender.displayName}</Text> gave{" "}
                <Text style={styles.bold}>{item.recipient?.displayName}</Text>{" "}
                <Text style={[styles.value, item.value < 0 && styles.valueNegative]}>
                  {item.value >= 0 ? "+" : ""}
                  {item.value}
                </Text>{" "}
                for {item.preset.label.toLowerCase()}
              </Text>
              {item.note ? <Text style={styles.note}>"{item.note}"</Text> : null}
              <Text style={styles.meta}>
                {timeAgo(item.createdAt)}
                {item.status === "DISPUTED" ? " · 🚩 contested" : ""}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: 40 },
  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow,
  },
  cardDisputed: { borderWidth: 1, borderColor: colors.negative },
  cardBody: { flex: 1, marginLeft: spacing.sm },
  cardText: { color: colors.text, fontSize: fontSizes.sm, lineHeight: 20 },
  bold: { fontWeight: "700" },
  value: { fontWeight: "800", color: colors.positive },
  valueNegative: { color: colors.negative },
  note: { color: colors.textMuted, fontStyle: "italic", marginTop: 4, fontSize: fontSizes.sm },
  meta: { color: colors.textMuted, fontSize: fontSizes.xs, marginTop: 6 },
  empty: { padding: spacing.xl, alignItems: "center" },
  emptyText: { color: colors.textMuted, fontSize: fontSizes.md },
});
