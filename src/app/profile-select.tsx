import { router, useFocusEffect } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton, EmptyState, GlassPanel, PageHeader, Pill, V21Screen } from "../components/NutriLensV21";
import { getActiveProfileId, getUserProfiles, setActiveProfileId, UserProfile } from "../storage/profileStorage";
import { COLORS, RADIUS, SPACING } from "../theme";

export default function ProfileSelectScreen() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      async function load() {
        setProfiles(await getUserProfiles());
        setActiveId(await getActiveProfileId());
      }
      load();
    }, [])
  );

  async function selectProfile(profile: UserProfile) {
    await setActiveProfileId(profile.id);
    router.replace("/home");
  }

  return (
    <V21Screen>
      <PageHeader title="Select Profile" subtitle="Choose the avoid list you want to use for scanning." />

      {profiles.length === 0 ? (
        <EmptyState title="No profiles yet" message="Create your first profile to start scanning products with NutriLens." />
      ) : (
        <View style={styles.list}>
          {profiles.map((profile) => {
            const selected = profile.id === activeId;
            return (
              <Pressable key={profile.id} onPress={() => selectProfile(profile)} style={[styles.profileCard, selected && styles.profileCardSelected]}>
                <View style={styles.profileTop}>
                  <View>
                    <Text style={[styles.profileName, selected && styles.profileNameSelected]}>{profile.name}</Text>
                    <Text style={styles.profileMeta}>{profile.avoidIds.length} avoid-list selections</Text>
                  </View>
                  {selected ? <Pill tone="safe">Active</Pill> : <Pill>Select</Pill>}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <GlassPanel style={styles.actionsPanel}>
        <ActionButton title="Create New Profile" subtitle="Add another avoid list" icon="＋" onPress={() => router.push("/profile-setup")} variant="primary" />
        <ActionButton title="Manage Profiles" subtitle="Edit or delete profiles" icon="⚙️" onPress={() => router.push("/profile-manage")} />
      </GlassPanel>
    </V21Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: SPACING.md },
  profileCard: { backgroundColor: "rgba(255,255,255,0.88)", borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg },
  profileCardSelected: { backgroundColor: "rgba(5,123,117,0.08)", borderColor: "rgba(5,123,117,0.34)" },
  profileTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.md },
  profileName: { color: COLORS.text, fontSize: 20, fontWeight: "900" },
  profileNameSelected: { color: COLORS.primary },
  profileMeta: { marginTop: 4, color: COLORS.muted, fontWeight: "700" },
  actionsPanel: { marginTop: SPACING.lg, gap: SPACING.md },
});
