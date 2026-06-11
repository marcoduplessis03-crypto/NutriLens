import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    getActiveProfileId,
    getUserProfiles,
    setActiveProfile,
    signOutUser,
    UserProfile,
} from "../src/storage/profileStorage";
import { COLORS, RADIUS, SPACING } from "../src/theme";

export default function ProfileSelectScreen() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadProfiles();
    }, [])
  );

  async function loadProfiles() {
    const savedProfiles = await getUserProfiles();
    const activeId = await getActiveProfileId();

    setProfiles(savedProfiles);
    setActiveProfileId(activeId);
  }

  async function handleSelectProfile(profileId: string) {
    await setActiveProfile(profileId);
    router.replace("/profile-select")
  }

  function handleNewProfile() {
    router.push("/profile-setup");
  }

  async function handleSignOut() {
    await signOutUser();
    setActiveProfileId(null);

    Alert.alert(
      "Signed out",
      "No profile is currently selected. Your local profiles are still saved."
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Choose Profile</Text>

      <Text style={styles.subtitle}>
        Select the local scan profile you want to use. Profiles are saved on
        this phone only.
      </Text>

      {profiles.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No profiles yet</Text>
          <Text style={styles.emptyText}>
            Create a profile to choose ingredients and nutrients you want
            NutriLens to watch for.
          </Text>
        </View>
      ) : (
        <View style={styles.profileList}>
          {profiles.map((profile) => {
            const isActive = profile.id === activeProfileId;

            return (
              <Pressable
                key={profile.id}
                onPress={() => handleSelectProfile(profile.id)}
                style={[
                  styles.profileCard,
                  isActive && styles.profileCardActive,
                ]}
              >
                <View style={styles.profileTopRow}>
                  <Text style={styles.profileName}>{profile.name}</Text>

                  {isActive && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.profileMeta}>
                  Watching {profile.avoidIds.length} item
                  {profile.avoidIds.length === 1 ? "" : "s"}
                </Text>

                <Text style={styles.profileHint}>Tap to use this profile</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable style={styles.primaryButton} onPress={handleNewProfile}>
        <Text style={styles.primaryButtonText}>Create New Profile</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={handleSignOut}>
        <Text style={styles.secondaryButtonText}>Sign Out</Text>
      </Pressable>

      <Pressable style={styles.linkButton} onPress={() => router.replace("/")}>
        <Text style={styles.linkButtonText}>Back to Welcome</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
    paddingTop: 70,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.muted,
    marginBottom: SPACING.xl,
  },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
  },

  profileList: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },

  profileCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },

  profileCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(15, 118, 110, 0.08)",
  },

  profileTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.md,
  },

  profileName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
  },

  activeBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },

  activeBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  profileMeta: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 8,
  },

  profileHint: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "800",
    marginTop: 10,
  },

  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: SPACING.md,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  secondaryButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: SPACING.md,
  },

  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },

  linkButton: {
    alignItems: "center",
    paddingVertical: 10,
  },

  linkButtonText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "800",
  },
});