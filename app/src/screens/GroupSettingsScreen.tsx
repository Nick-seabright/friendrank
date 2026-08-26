import React, { useEffect, useState } from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api, Group } from "../api/client";
import Avatar from "../components/Avatar";
import { colors, fontSizes, radii, shadow, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "GroupSettings">;

export default function GroupSettingsScreen({ route }: Props) {
  const { groupId } = route.params;
  const [group, setGroup] = useState<Group | null>(null);

  useEffect(() => {
    api.get(`/groups/${groupId}`).then((res) => setGroup(res.data));
  }, [groupId]);

  if (!group) return null;

  const shareInvite = () => {
    Share.share({
      message: `Join my FriendRank group "${group.name}" with code ${group.inviteCode}`,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Invite code</Text>
      <View style={styles.codeCard}>
        <Text style={styles.code}>{group.inviteCode}</Text>
      </View>
      <TouchableOpacity style={styles.shareButton} onPress={shareInvite}>
        <Text style={styles.shareText}>Share invite</Text>
      </TouchableOpacity>

      <Text style={[styles.label, { marginTop: spacing.xl }]}>
        Members ({group.memberships?.length || 0})
      </Text>
      {group.memberships?.map((m) => (
        <View key={m.user.id} style={styles.memberRow}>
          <Avatar emoji={m.user.emoji} size={36} />
          <Text style={styles.memberName}>{m.user.displayName}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  label: { fontSize: fontSizes.sm, color: colors.textMuted, fontWeight: "600", marginBottom: spacing.sm },
  codeCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: "center",
    ...shadow,
  },
  code: { fontSize: fontSizes.xxl, fontWeight: "800", letterSpacing: 6, color: colors.primary },
  shareButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  shareText: { color: "#fff", fontWeight: "700" },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  memberName: { fontSize: fontSizes.md, color: colors.text, fontWeight: "600" },
});
