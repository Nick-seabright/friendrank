import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api, PointEntry } from "../api/client";
import { useCurrentGroup } from "../context/CurrentGroupContext";
import PointPop from "../components/PointPop";
import { colors, fontSizes, radii, shadow, spacing } from "../theme";

export default function ConfirmationsScreen() {
  const { groupId } = useCurrentGroup();
  const [entries, setEntries] = useState<PointEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [popValue, setPopValue] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await api.get<PointEntry[]>("/points/pending");
    setEntries(res.data.filter((e) => e.group?.id === groupId));
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

  const accept = async (entry: PointEntry) => {
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    await api.post(`/points/${entry.id}/accept`);
    setPopValue(entry.value);
  };

  const dispute = async (entry: PointEntry) => {
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    await api.post(`/points/${entry.id}/dispute`);
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
            <Text style={styles.emptyText}>All caught up. Nothing waiting on you.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.bold}>{item.sender.displayName}</Text> gave you{" "}
              <Text style={[styles.value, item.value < 0 && styles.valueNegative]}>
                {item.value >= 0 ? "+" : ""}
                {item.value}
              </Text>{" "}
              for {item.preset.label.toLowerCase()}
            </Text>
            {item.note ? <Text style={styles.note}>"{item.note}"</Text> : null}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.disputeButton} onPress={() => dispute(item)}>
                <Text style={styles.disputeText}>Dispute</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptButton} onPress={() => accept(item)}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <PointPop value={popValue ?? 0} visible={popValue !== null} onDone={() => setPopValue(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: 40 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow,
  },
  cardText: { color: colors.text, fontSize: fontSizes.md, lineHeight: 22 },
  bold: { fontWeight: "700" },
  value: { fontWeight: "800", color: colors.positive },
  valueNegative: { color: colors.negative },
  note: { color: colors.textMuted, fontStyle: "italic", marginTop: 6 },
  actions: { flexDirection: "row", marginTop: spacing.md, gap: spacing.sm },
  disputeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.negative,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  disputeText: { color: colors.negative, fontWeight: "700" },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.positive,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  acceptText: { color: "#fff", fontWeight: "700" },
  empty: { padding: spacing.xl, alignItems: "center" },
  emptyText: { color: colors.textMuted, fontSize: fontSizes.md, textAlign: "center" },
});
