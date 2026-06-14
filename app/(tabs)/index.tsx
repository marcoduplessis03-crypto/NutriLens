import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getActiveProfileId,
  getUserProfiles,
  signOutUser,
  UserProfile,
} from "../../src/storage/profileStorage";
import { COLORS, RADIUS, SPACING } from "../../src/theme";

export default function HomeScreen() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProfiles();
    }, [])
  );

  async function loadProfiles() {
    const savedProfiles = await getUserProfiles();
    const activeId = await getActiveProfileId();

    const active =
      savedProfiles.find((profile) => profile.id === activeId) || null;

    setProfiles(savedProfiles);
    setActiveProfileId(activeId);
    setActiveProfile(active);
    setLoaded(true);
  }

  function continueToProfileSelect() {
    router.push("/profile-select");
  }

  function createNewProfile() {
    router.push("/profile-setup");
  }

  async function handleSignOut() {
    await signOutUser();
    setActiveProfileId(null);
    setActiveProfile(null);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>NL</Text>
        </View>

        <Text style={styles.title}>NutriLens</Text>

        <Text style={styles.subtitle}>
          Scan food barcodes, check available label data, and flag ingredients
          you personally choose to avoid.
        </Text>
      </View>

      {loaded && activeProfile && (
        <View style={styles.savedProfileCard}>
          <Text style={styles.savedProfileTitle}>Active scan profile</Text>
          <Text style={styles.savedProfileText}>{activeProfile.name}</Text>
          <Text style={styles.savedProfileSubtext}>
            {activeProfile.avoidIds.length} selected item
            {activeProfile.avoidIds.length === 1 ? "" : "s"}
          </Text>
        </View>
      )}

      {loaded && !activeProfile && profiles.length > 0 && (
        <View style={styles.savedProfileCard}>
          <Text style={styles.savedProfileTitle}>No profile selected</Text>
          <Text style={styles.savedProfileText}>
            Choose one of your saved local profiles before scanning.
          </Text>
        </View>
      )}

      {loaded && profiles.length === 0 && (
        <View style={styles.savedProfileCard}>
          <Text style={styles.savedProfileTitle}>No profiles yet</Text>
          <Text style={styles.savedProfileText}>
            Create a local scan profile to choose ingredients and nutrients to
            check.
          </Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>How NutriLens works</Text>

        <Text style={styles.sectionText}>
  NutriLens is for general ingredient and nutrient awareness only. It does not
  provide medical advice, diagnosis, treatment, or dietary recommendations.
  Product data may be incomplete, so always check the product packaging.
</Text>
</View>

      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>🔎</Text>
        <View style={styles.infoTextWrap}>
          <Text style={styles.infoTitle}>Scan a barcode</Text>
          <Text style={styles.infoText}>
            Look up food label data from available product databases.
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>🏷️</Text>
        <View style={styles.infoTextWrap}>
          <Text style={styles.infoTitle}>Flag selected ingredients</Text>
          <Text style={styles.infoText}>
            NutriLens checks for ingredients you added to your personal avoid
            list.
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>📊</Text>
        <View style={styles.infoTextWrap}>
          <Text style={styles.infoTitle}>View nutrient awareness</Text>
          <Text style={styles.infoText}>
            See available values such as sodium, sugar, salt, and saturated fat.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={continueToProfileSelect}
        activeOpacity={0.9}
      >
        <Text style={styles.buttonText}>Continue to Profiles</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={createNewProfile}
        activeOpacity={0.9}
      >
        <Text style={styles.secondaryButtonText}>Create New Profile</Text>
      </TouchableOpacity>

      {activeProfileId && (
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.9}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.disclaimer}>
        NutriLens helps identify selected ingredients and nutrient information
        from available third-party product data. It does not provide medical
        advice, diagnosis, treatment, or personalised dietary recommendations.
        Always check the physical product packaging.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingTop: 64,
    backgroundColor: COLORS.background,
  },

  hero: {
    marginBottom: SPACING.xl,
  },

  logoCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  title: {
    fontSize: 40,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: COLORS.muted,
  },

  savedProfileCard: {
    backgroundColor: "#E0F2F1",
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },

  savedProfileTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 4,
  },

  savedProfileText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "800",
  },

  savedProfileSubtext: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
  },

  sectionHeader: {
    marginBottom: SPACING.md,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
  },

  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.muted,
  },

  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    fontSize: 28,
    marginRight: 14,
  },

  infoTextWrap: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 3,
  },

  infoText: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.muted,
  },

  button: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.lg,
  },

  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
  },

  secondaryButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 17,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
  },

  secondaryButtonText: {
    color: COLORS.primary,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "900",
  },

  signOutButton: {
    backgroundColor: "#F1F5F9",
    padding: 16,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
  },

  signOutButtonText: {
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "900",
  },

  disclaimer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
    textAlign: "center",
  },
});