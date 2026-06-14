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
  deleteProfile,
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
    router.replace("/scanner");
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

  function confirmDeleteProfile(profile: UserProfile) {
    const isActive = profile.id === activeProfileId;

    Alert.alert(
      "Delete profile?",
      `Hold up — this will permanently delete "${profile.name}" from this phone.${
        isActive
          ? " This is your active profile, so you will need to choose or create another one before scanning."
          : ""
      } Scan history will stay saved.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Profile",
          style: "destructive",
          onPress: async () => {
            await deleteProfile(profile.id);
            await loadProfiles();
          },
        },
      ]
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
            NutriLens to check for.
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
                onLongPress={() => confirmDeleteProfile(profile)}
                delayLongPress={500}
                style={({ pressed }) => [
                  styles.profileCard,
                  isActive && styles.profileCardActive,
                  pressed && styles.profileCardPressed,
                ]}
              >
                <View style={styles.profileTopRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {profile.name.trim().charAt(0).toUpperCase() || "N"}
                    </Text>
                  </View>

                  <View style={styles.profileTextWrap}>
                    <Text style={styles.profileName}>{profile.name}</Text>

                    <Text style={styles.profileMeta}>
                      {profile.avoidIds.length} selected item
                      {profile.avoidIds.length === 1 ? "" : "s"}
                    </Text>
                  </View>

                  {isActive && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  )}
                </View>

                <View style={styles.profileFooter}>
                  <Text style={styles.profileHint}>
                    Tap to use • Hold to delete
                  </Text>

                  <Text style={styles.deleteHint}>🗑️</Text>
                </View>
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

  profileCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  profileTextWrap: {
    flex: 1,
  },

  profileName: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
  },

  profileMeta: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
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

  profileFooter: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  profileHint: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "800",
  },

  deleteHint: {
    fontSize: 16,
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