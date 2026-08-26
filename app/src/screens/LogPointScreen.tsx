import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api, Preset, UserSummary } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import PointPop from "../components/PointPop";
import { colors, fontSizes, radii, shadow, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "LogPoint">;

export default function LogPointScreen({ route, navigation }: Props) {
  const { groupId, preselectedRecipientId } = route.params;
  const { user } = useAuth();
  const [members, setMembers] = useState<UserSummary[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [recipient, setRecipient] = useState<UserSummary | null>(null);
  const [preset, setPreset] = useState<Preset | null>(null);
  const [customValue, setCustomValue] = useState(1);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [popValue, setPopValue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [groupRes, presetsRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get<Preset[]>("/presets"),
      ]);
      const others: UserSummary[] = groupRes.data.memberships
        .map((m: any) => m.user)
        .filter((u: UserSummary) => u.id !== user?.id);
      setMembers(others);
      setPresets(presetsRes.data);
      if (preselectedRecipientId) {
        setRecipient(others.find((o) => o.id === preselectedRecipientId) || null);
      }
    })();
  }, [groupId]);

  const submit = async () => {
    if (!recipient || !preset) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post("/points", {
        groupId,
        recipientId: recipient.id,
        presetId: preset.id,
        customValue: preset.isCustom ? customValue : undefined,
        note: note.trim() || undefined,
      });
      setPopValue(res.data.value);
      setTimeout(() => navigation.goBack(), 900);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Couldn't log that point.");
      setSubmitting(false);
    }
  };

  const positivePresets = presets.filter((p) => p.polarity === "POSITIVE");
  const negativePresets = presets.filter((p) => p.polarity === "NEGATIVE");

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.stepLabel}>1. Who's this about?</Text>
        <View style={styles.friendRow}>
          {members.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.friendChip, recipient?.id === m.id && styles.friendChipSelected]}
              onPress={() => setRecipient(m)}
            >
              <Avatar emoji={m.emoji} size={44} />
              <Text style={styles.friendName}>{m.displayName}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {recipient && (
          <>
            <Text style={styles.stepLabel}>2. What happened?</Text>
            <Text style={styles.groupLabel}>Good stuff</Text>
            <View style={styles.presetGrid}>
              {positivePresets.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.presetChip, preset?.id === p.id && styles.presetChipPositiveSelected]}
                  onPress={() => {
                    setPreset(p);
                    setCustomValue(1);
                  }}
                >
                  <Text style={styles.presetLabel}>{p.label}</Text>
                  <Text style={styles.presetValuePositive}>
                    {p.isCustom ? `+1 to +${p.customCap}` : `+${p.defaultValue}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.groupLabel}>Not so much</Text>
            <View style={styles.presetGrid}>
              {negativePresets.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.presetChip, preset?.id === p.id && styles.presetChipNegativeSelected]}
                  onPress={() => {
                    setPreset(p);
                    setCustomValue(1);
                  }}
                >
                  <Text style={styles.presetLabel}>{p.label}</Text>
                  <Text style={styles.presetValueNegative}>
                    {p.isCustom ? `-1 to -${p.customCap}` : p.defaultValue}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {preset?.isCustom && (
          <View style={styles.customRow}>
            <Text style={styles.stepLabel}>Set the value (1-{preset.customCap})</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setCustomValue((v) => Math.max(1, v - 1))}
              >
                <Text style={styles.stepperText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{customValue}</Text>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setCustomValue((v) => Math.min(preset.customCap || 1, v + 1))}
              >
                <Text style={styles.stepperText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {preset && (
          <>
            <Text style={styles.stepLabel}>3. Add a note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="and he paid, absolute legend"
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
              maxLength={280}
              multiline
            />
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      {recipient && preset && (
        <TouchableOpacity style={styles.submitButton} onPress={submit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              Send to {recipient.displayName}
            </Text>
          )}
        </TouchableOpacity>
      )}

      <PointPop value={popValue ?? 0} visible={popValue !== null} onDone={() => setPopValue(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 120 },
  stepLabel: { fontSize: fontSizes.md, fontWeight: "700", color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  groupLabel: { fontSize: fontSizes.sm, color: colors.textMuted, fontWeight: "600", marginTop: spacing.sm, marginBottom: spacing.xs },
  friendRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  friendChip: {
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  friendChipSelected: { borderColor: colors.primary, backgroundColor: colors.pendingBg },
  friendName: { marginTop: 4, fontSize: fontSizes.xs, color: colors.text, fontWeight: "600" },
  presetGrid: { gap: spacing.sm },
  presetChip: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    ...shadow,
  },
  presetChipPositiveSelected: { borderColor: colors.positive },
  presetChipNegativeSelected: { borderColor: colors.negative },
  presetLabel: { fontSize: fontSizes.sm, color: colors.text, fontWeight: "600", flex: 1 },
  presetValuePositive: { fontSize: fontSizes.md, fontWeight: "800", color: colors.positive },
  presetValueNegative: { fontSize: fontSizes.md, fontWeight: "800", color: colors.negative },
  customRow: { marginTop: spacing.sm },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.lg },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  stepperText: { fontSize: fontSizes.lg, fontWeight: "800", color: colors.text },
  stepperValue: { fontSize: fontSizes.xl, fontWeight: "800", color: colors.text, minWidth: 40, textAlign: "center" },
  noteInput: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: fontSizes.sm,
    color: colors.text,
    minHeight: 60,
    textAlignVertical: "top",
  },
  submitButton: {
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
  submitText: { color: "#fff", fontSize: fontSizes.md, fontWeight: "700" },
  error: { color: colors.negative, marginTop: spacing.md, textAlign: "center" },
});
