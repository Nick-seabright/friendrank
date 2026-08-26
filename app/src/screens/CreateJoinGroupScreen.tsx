import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api/client";
import { colors, fontSizes, radii, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "CreateJoinGroup">;

export default function CreateJoinGroupScreen({ navigation }: Props) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroup = async () => {
    if (!name.trim()) {
      setError("Give your group a name.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/groups", { name: name.trim() });
      navigation.replace("GroupHome", { groupId: res.data.id, groupName: res.data.name });
    } catch (e: any) {
      setError(e?.response?.data?.error || "Couldn't create group.");
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!code.trim()) {
      setError("Enter an invite code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/groups/join", { inviteCode: code.trim().toUpperCase() });
      if (res.data.warning) {
        Alert.alert("Heads up", res.data.warning);
      }
      navigation.replace("GroupHome", { groupId: res.data.group.id, groupName: res.data.group.name });
    } catch (e: any) {
      setError(e?.response?.data?.error || "Couldn't join group.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggle, mode === "create" && styles.toggleActive]}
          onPress={() => setMode("create")}
        >
          <Text style={[styles.toggleText, mode === "create" && styles.toggleTextActive]}>Start a group</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggle, mode === "join" && styles.toggleActive]}
          onPress={() => setMode("join")}
        >
          <Text style={[styles.toggleText, mode === "join" && styles.toggleTextActive]}>Join a group</Text>
        </TouchableOpacity>
      </View>

      {mode === "create" ? (
        <>
          <Text style={styles.label}>Group name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. The Menace Council"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.hint}>Best with 4-8 people. You'll get an invite code to share.</Text>
        </>
      ) : (
        <>
          <Text style={styles.label}>Invite code</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="ABC123"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            value={code}
            onChangeText={setCode}
            maxLength={10}
          />
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.button}
        onPress={mode === "create" ? createGroup : joinGroup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{mode === "create" ? "Create group" : "Join group"}</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: spacing.xl },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    padding: 4,
    marginBottom: spacing.xl,
  },
  toggle: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.pill, alignItems: "center" },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { color: colors.textMuted, fontWeight: "600" },
  toggleTextActive: { color: "#fff" },
  label: { fontSize: fontSizes.sm, color: colors.textMuted, fontWeight: "600", marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  codeInput: { fontSize: fontSizes.lg, letterSpacing: 4, textAlign: "center", fontWeight: "700" },
  hint: { color: colors.textMuted, fontSize: fontSizes.xs, marginTop: spacing.sm },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  buttonText: { color: "#fff", fontSize: fontSizes.md, fontWeight: "700" },
  error: { color: colors.negative, marginTop: spacing.md, textAlign: "center" },
});
