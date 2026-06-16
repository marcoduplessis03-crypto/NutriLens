import { router, useFocusEffect } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton, EmptyState, GlassPanel, PageHeader, Pill, V21Screen } from "../components/NutriLensV21";
import { AVOID_OPTIONS, deleteUserProfile, getActiveProfileId, getUserProfiles, setActiveProfileId, updateUserProfile, UserProfile } from "../storage/profileStorage";
import { COLORS, RADIUS, SPACING } from "../theme";

export default function ProfileManageScreen() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [avoidIds, setAvoidIds] = useState<string[]>([]);

  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? null;

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    const loadedProfiles = await getUserProfiles();
    const loadedActiveId = await getActiveProfileId();
    setProfiles(loadedProfiles);
    setActiveId(loadedActiveId);
    const selected = loadedProfiles.find((profile) => profile.id === selectedProfileId) ?? loadedProfiles.find((profile) => profile.id === loadedActiveId) ?? loadedProfiles[0] ?? null;
    setSelectedProfileId(selected?.id ?? null);
    setName(selected?.name ?? "");
    setAvoidIds(selected?.avoidIds ?? []);
  }

  function openProfile(profile: UserProfile) {
    setSelectedProfileId(profile.id);
    setName(profile.name);
    setAvoidIds(profile.avoidIds);
  }

  function toggleAvoid(id: string) {
    setAvoidIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  async function saveChanges() {
    if (!selectedProfile || !name.trim()) return;
    await updateUserProfile({ ...selectedProfile, name: name.trim(), avoidIds });
    await load();
  }

  async function makeActive() {
    if (!selectedProfile) return;
    await setActiveProfileId(selectedProfile.id);
    await load();
  }

  async function removeProfile() {
    if (!selectedProfile) return;
    Alert.alert("Delete profile?", `Delete ${selectedProfile.name}? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteUserProfile(selectedProfile.id);
          await load();
        },
      },
    ]);
  }

  return (
    <V21Screen>
      <PageHeader title="Manage Profiles" subtitle="Update profile names and avoid-list selections." />

      {profiles.length === 0 ? (
        <EmptyState title="No profiles yet" message="Create a profile to begin using NutriLens." />
      ) : (
        <>
          <View style={styles.profileTabs}>
            {profiles.map((profile) => {
              const selected = selectedProfileId === profile.id;
              return (
                <Pressable key={profile.id} onPress={() => openProfile(profile)} style={[styles.profileTab, selected && styles.profileTabSelected]}>
                  <Text style={[styles.profileTabText, selected && styles.profileTabTextSelected]}>{profile.name}</Text>
                  {profile.id === activeId ? <Text style={styles.activeMini}>ACTIVE</Text> : null}
                </Pressable>
              );
            })}
          </View>

          <GlassPanel strong style={styles.panel}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Profile details</Text>
              {selectedProfile?.id === activeId ? <Pill tone="safe">Active</Pill> : <Pill>Inactive</Pill>}
            </View>

            <TextInput value={name} onChangeText={setName} placeholder="Profile name" placeholderTextColor={COLORS.muted} style={styles.input} />

            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Avoid list</Text>
              <Pill>{avoidIds.length} selected</Pill>
            </View>

            <View style={styles.optionList}>
              {AVOID_OPTIONS.map((option) => {
                const selected = avoidIds.includes(option.id);
                return (
                  <Pressable key={option.id} onPress={() => toggleAvoid(option.id)} style={[styles.optionCard, selected && styles.optionCardSelected]}>
                    <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>{selected ? "✓ " : ""}{option.label}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </Pressable>
                );
              })}
            </View>

            <ActionButton title="Save Changes" subtitle="Update this profile" icon="✓" onPress={saveChanges} variant="primary" />
            <ActionButton title="Set as Active" subtitle="Use this profile for scans" icon="★" onPress={makeActive} disabled={!selectedProfile || selectedProfile.id === activeId} />
            <ActionButton title="Delete Profile" subtitle="Remove this local profile" icon="×" onPress={removeProfile} disabled={!selectedProfile} variant="danger" />
          </GlassPanel>
        </>
      )}

      <View style={styles.bottomAction}>
        <ActionButton title="Create New Profile" subtitle="Add another profile" icon="＋" onPress={() => router.push("/profile-setup")} />
      </View>
    </V21Screen>
  );
}

const styles = StyleSheet.create({
  profileTabs: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.md },
  profileTab: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.pill, backgroundColor: "rgba(255,255,255,0.86)", borderWidth: 1, borderColor: COLORS.border },
  profileTabSelected: { backgroundColor: "rgba(5,123,117,0.10)", borderColor: "rgba(5,123,117,0.30)" },
  profileTabText: { color: COLORS.text, fontWeight: "900" },
  profileTabTextSelected: { color: COLORS.primary },
  activeMini: { marginTop: 2, color: COLORS.teal, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  panel: { gap: SPACING.md },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: SPACING.md },
  label: { color: COLORS.ink, fontSize: 14, fontWeight: "900" },
  input: { backgroundColor: "rgba(255,255,255,0.95)", borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 14, color: COLORS.text, fontSize: 16, fontWeight: "700" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: SPACING.sm },
  optionList: { gap: SPACING.sm },
  optionCard: { backgroundColor: "rgba(255,255,255,0.88)", borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md },
  optionCardSelected: { backgroundColor: "rgba(5,123,117,0.08)", borderColor: "rgba(5,123,117,0.32)" },
  optionTitle: { color: COLORS.text, fontSize: 14, fontWeight: "900" },
  optionTitleSelected: { color: COLORS.primary },
  optionDescription: { marginTop: 5, color: COLORS.muted, fontSize: 12, lineHeight: 18, fontWeight: "600" },
  bottomAction: { marginTop: SPACING.lg },
});
