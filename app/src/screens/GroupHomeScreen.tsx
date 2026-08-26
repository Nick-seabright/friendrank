import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api/client";
import { CurrentGroupProvider } from "../context/CurrentGroupContext";
import LeaderboardScreen from "./LeaderboardScreen";
import FeedScreen from "./FeedScreen";
import ConfirmationsScreen from "./ConfirmationsScreen";
import { colors, fontSizes } from "../theme";
import type { RootStackParamList, GroupTabParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "GroupHome">;

const Tab = createBottomTabNavigator<GroupTabParamList>();

const TAB_ICONS: Record<keyof GroupTabParamList, string> = {
  Leaderboard: "🏆",
  Feed: "📜",
  Confirmations: "✅",
};

export default function GroupHomeScreen({ route, navigation }: Props) {
  const { groupId, groupName } = route.params;
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await api.get("/points/pending");
        if (mounted) setPendingCount(res.data.filter((e: any) => e.group?.id === groupId).length);
      } catch {}
    };
    check();
    const interval = setInterval(check, 60000);
    const unsub = navigation.addListener("focus", check);
    return () => {
      mounted = false;
      clearInterval(interval);
      unsub();
    };
  }, [groupId, navigation]);

  useEffect(() => {
    navigation.setOptions({
      title: groupName,
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate("GroupSettings", { groupId, groupName })}>
          <Text style={styles.headerButton}>⚙️</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, groupId, groupName]);

  return (
    <CurrentGroupProvider groupId={groupId} groupName={groupName}>
      <Tab.Navigator
        screenOptions={({ route: r }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[r.name as keyof GroupTabParamList]}</Text>,
          tabBarLabelStyle: { fontSize: fontSizes.xs, fontWeight: "600" },
        })}
      >
        <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Tab.Screen name="Feed" component={FeedScreen} />
        <Tab.Screen
          name="Confirmations"
          component={ConfirmationsScreen}
          options={{ tabBarBadge: pendingCount > 0 ? pendingCount : undefined }}
        />
      </Tab.Navigator>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("LogPoint", { groupId })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </CurrentGroupProvider>
  );
}

const styles = StyleSheet.create({
  headerButton: { fontSize: 20, marginRight: 12 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: "#fff", fontSize: 30, fontWeight: "700", marginTop: -2 },
});
