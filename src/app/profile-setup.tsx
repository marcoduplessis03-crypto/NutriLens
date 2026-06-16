import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton, GlassPanel, PageHeader, Pill, V21Screen } from "../components/NutriLensV21";
import { AVOID_OPTIONS, createUserProfile } from "../storage/profileStorage";
import { COLORS, RADIUS, SPACING } from "../theme";

export default function ProfileSetupScreen() {
  const [name, setName] = useState("");
  const [avoidIds, setAvoidIds] = useState<string[]>([]);
  const canSave = useMemo(() => name.trim().length > 0, [name]);

  function toggleAvoid(id: string) {
    setAvoidIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  async function handleSave() {
    if (!canSave) return;
    await createUserProfile(name, avoidIds);
    router.replace("/home");
  }

  return (
    <V21Screen>
      <PageHeader title="Create Profile" subtitle="Choose ingredients or nutrient markers you would like NutriLens to flag from available product data." />

      <GlassPanel strong style={styles.panel}>
        <Text style={styles.label}>Profile name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Example: Marco" placeholderTextColor={COLORS.muted} style={styles.input} />

        <View style={styles.sectionHeader}>
          <Text style={styles.label}>Avoid list</Text>
          <Pill>{avoidIds.length} selected</Pill>
        </View>

        <View style={styles.optionList}>
          {AVOID_OPTIONS.map((option) => {
            const selected = avoidIds.includes(option.id);
            return (
              <Pressable key={option.id} onPress={() => toggleAvoid(option.id)} style={[styles.optionCard, selected && styles.optionCardSelected]}>
                <View style={styles.optionTop}>
                  <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>{option.label}</Text>
                  <View style={[styles.checkDot, selected && styles.checkDotSelected]}>{selected ? <Text style={styles.checkText}>✓</Text> : null}</View>
                </View>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </Pressable>
            );
          })}
        </View>

        <ActionButton title="Save Profile" subtitle="Set as active profile" icon="✓" onPress={handleSave} disabled={!canSave} variant="primary" />
      </GlassPanel>
    </V21Screen>
  );
}

const styles = StyleSheet.create({
  panel: { gap: SPACING.md },
  label: { color: COLORS.ink, fontSize: 14, fontWeight: "900" },
  input: { backgroundColor: "rgba(255,255,255,0.95)", borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 14, color: COLORS.text, fontSize: 16, fontWeight: "700" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: SPACING.sm },
  optionList: { gap: SPACING.sm },
  optionCard: { backgroundColor: "rgba(255,255,255,0.88)", borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md },
  optionCardSelected: { backgroundColor: "rgba(5,123,117,0.08)", borderColor: "rgba(5,123,117,0.32)" },
  optionTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.md },
  optionTitle: { color: COLORS.text, fontSize: 15, fontWeight: "900" },
  optionTitleSelected: { color: COLORS.primary },
  optionDescription: { marginTop: 6, color: COLORS.muted, lineHeight: 19, fontWeight: "600", fontSize: 12 },
  checkDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  checkDotSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkText: { color: "#FFFFFF", fontWeight: "900" },
});
