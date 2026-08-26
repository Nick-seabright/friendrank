import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api, Group } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { colors, fontSizes, radii, shadow, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "GroupsList">;

export default function GroupsListScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await api.get<Group[]>("/groups");
    setGroups(res.data);
  }, []);

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
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey {user?.emoji} {user?.displayName}</Text>
          <Text style={styles.title}>Your groups</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No groups yet. Start one or join with a code.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("GroupHome", { groupId: item.id, groupName: item.name })}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>
              {item.memberCount ?? "?"} member{item.memberCount === 1 ? "" : "s"} · code {item.inviteCode}
            </Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("CreateJoinGroup")}>
        <Text style={styles.fabText}>+ New / Join Group</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  greeting: { color: colors.textMuted, fontSize: fontSizes.sm },
  title: { color: colors.text, fontSize: fontSizes.xl, fontWeight: "800" },
  logout: { color: colors.negative, fontWeight: "600" },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow,
  },
  cardTitle: { fontSize: fontSizes.lg, fontWeight: "700", color: colors.text },
  cardSub: { fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 4 },
  empty: { padding: spacing.xl, alignItems: "center" },
  emptyText: { color: colors.textMuted, textAlign: "center", fontSize: fontSizes.md },
  fab: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    ...shadow,
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: fontSizes.md },
});
