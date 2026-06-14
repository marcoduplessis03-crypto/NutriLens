import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  deleteProfile,
  getUserProfile,
  updateUserProfile,
  UserProfile,
} from "../src/storage/profileStorage";
import { getScanHistory, ScanHistoryItem } from "../src/storage/scanHistory";
import { COLORS, RADIUS, SPACING } from "../src/theme";

const AVOID_OPTIONS = [
  {
    id: "phosphates",
    label: "Phosphate additives",
    description: "Looks for phosphate-based ingredient terms.",
  },
  {
    id: "potassiumAdditives",
    label: "Potassium additives",
    description: "Looks for potassium-based ingredient terms.",
  },
  {
    id: "sodium",
    label: "Sodium / salt",
    description: "Highlights sodium or salt-related label terms.",
  },
  {
    id: "addedSugars",
    label: "Added sugars",
    description: "Looks for sugar, syrup, glucose, fructose and similar terms.",
  },
  {
    id: "gluten",
    label: "Gluten / wheat",
    description: "Looks for wheat, barley, rye, malt and gluten terms.",
  },
  {
    id: "dairy",
    label: "Dairy",
    description: "Looks for milk, lactose, whey, casein and cream terms.",
  },
  {
    id: "nuts",
    label: "Nuts",
    description: "Looks for peanut and tree nut ingredient terms.",
  },
  {
    id: "caffeine",
    label: "Caffeine",
    description: "Looks for caffeine, coffee extract and stimulant terms.",
  },
  {
    id: "yeastExtract",
    label: "Yeast extract",
    description: "Looks for yeast extract and related flavouring terms.",
  },
  {
    id: "msg",
    label: "MSG / glutamate",
    description: "Looks for MSG and glutamate-based ingredient terms.",
  },
];

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getMatchCount(item: ScanHistoryItem) {
  return item.matchCount ?? item.ingredientMatches?.length ?? 0;
}

export default function ProfileManageScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileName, setProfileName] = useState("");
  const [selectedAvoidIds, setSelectedAvoidIds] = useState<string[]>([]);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProfileManagement();
    }, [])
  );

  async function loadProfileManagement() {
    const activeProfile = await getUserProfile();
    const savedHistory = await getScanHistory();

    if (!activeProfile) {
      setProfile(null);
      setProfileName("");
      setSelectedAvoidIds([]);
      setHistory([]);
      return;
    }

    setProfile(activeProfile);
    setProfileName(activeProfile.name);
    setSelectedAvoidIds(activeProfile.avoidIds);

    const relatedHistory = savedHistory.filter((item) => {
      if (!item.profileName) {
        return false;
      }

      return item.profileName.toLowerCase() === activeProfile.name.toLowerCase();
    });

    setHistory(relatedHistory);
  }

  function toggleAvoidId(id: string) {
    setSelectedAvoidIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  }

  async function handleSaveChanges() {
    if (!profile) {
      return;
    }

    const cleanName = profileName.trim();

    if (!cleanName) {
      Alert.alert("Profile name needed", "Please enter a profile name.");
      return;
    }

    if (selectedAvoidIds.length === 0) {
      Alert.alert(
        "Choose at least one item",
        "Select at least one ingredient or nutrient to check."
      );
      return;
    }

    setSaving(true);

    const updatedProfile = await updateUserProfile(profile.id, {
      name: cleanName,
      avoidIds: selectedAvoidIds,
    });

    setSaving(false);

    if (updatedProfile) {
      setProfile(updatedProfile);
      Alert.alert("Profile updated", "Your profile preferences were saved.");
    }
  }

  function handleDeleteProfile() {
    if (!profile) {
      return;
    }

    Alert.alert(
      "Delete this profile?",
      `This will permanently delete "${profile.name}" from this phone. Your scan history will stay saved.`,
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
            router.replace("/profile-select");
          },
        },
      ]
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No active profile</Text>

        <Text style={styles.emptyText}>
          Choose or create a profile before managing preferences.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace("/profile-select")}
        >
          <Text style={styles.primaryButtonText}>Choose Profile</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>

        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Profile Management</Text>
          <Text style={styles.subtitle}>Edit your local scan profile</Text>
        </View>

        <Pressable
          style={styles.historyShortcut}
          onPress={() => router.push("/(tabs)/history")}
        >
          <Text style={styles.historyShortcutText}>History</Text>
        </Pressable>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {profileName.trim().charAt(0).toUpperCase() || "N"}
          </Text>
        </View>

        <View style={styles.profileCardText}>
          <Text style={styles.cardLabel}>Active profile</Text>
          <Text style={styles.cardTitle}>{profile.name}</Text>

          <Text style={styles.cardMeta}>
            {selectedAvoidIds.length} selected item
            {selectedAvoidIds.length === 1 ? "" : "s"}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile name</Text>

        <TextInput
          value={profileName}
          onChangeText={setProfileName}
          placeholder="Enter profile name"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avoid list</Text>

        <Text style={styles.sectionDescription}>
          Choose the ingredients and nutrients you want NutriLens to flag when
          scanning products.
        </Text>

        {AVOID_OPTIONS.map((option) => {
          const selected = selectedAvoidIds.includes(option.id);

          return (
            <Pressable
              key={option.id}
              onPress={() => toggleAvoidId(option.id)}
              style={[
                styles.optionCard,
                selected && styles.optionCardSelected,
              ]}
            >
              <View style={styles.optionTopRow}>
                <View
                  style={[
                    styles.checkbox,
                    selected && styles.checkboxSelected,
                  ]}
                >
                  {selected && <Text style={styles.checkboxTick}>✓</Text>}
                </View>

                <Text style={styles.optionLabel}>{option.label}</Text>
              </View>

              <Text style={styles.optionDescription}>
                {option.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.saveButton, saving && styles.disabledButton]}
        onPress={handleSaveChanges}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : "Save Profile Changes"}
        </Text>
      </Pressable>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent scans</Text>

          <Pressable onPress={() => router.push("/(tabs)/history")}>
            <Text style={styles.viewAllText}>View all</Text>
          </Pressable>
        </View>

        {history.length === 0 ? (
          <Text style={styles.emptyHistoryText}>
            No saved scans found for this profile yet.
          </Text>
        ) : (
          <FlatList
            data={history.slice(0, 5)}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const matchCount = getMatchCount(item);

              return (
                <Pressable
                  style={styles.historyCard}
                  onPress={() =>
                    router.push({
                      pathname: "/history-detail",
                      params: {
                        id: item.id,
                      },
                    })
                  }
                >
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.historyImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.historyImagePlaceholder}>
                      <Text style={styles.historyImageText}>NL</Text>
                    </View>
                  )}

                  <View style={styles.historyTextWrap}>
                    <Text style={styles.historyProductName} numberOfLines={1}>
                      {item.productName}
                    </Text>

                    <Text style={styles.historyMeta}>
                      {matchCount === 0
                        ? "No selected ingredients found"
                        : `${matchCount} selected ingredient${
                            matchCount === 1 ? "" : "s"
                          } found`}
                    </Text>

                    <Text style={styles.historyDate}>
                      {formatDate(item.scannedAt)}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>

      <Pressable style={styles.deleteButton} onPress={handleDeleteProfile}>
        <Text style={styles.deleteButtonText}>Delete This Profile</Text>
      </Pressable>

      <Text style={styles.disclaimer}>
        Profile preferences are stored locally on this device. NutriLens flags
        selected ingredients using available third-party product data and does
        not provide medical advice.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: SPACING.lg,
    paddingTop: 58,
    paddingBottom: 70,
  },

  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  backButtonText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
  },

  headerTextWrap: {
    flex: 1,
  },

  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 3,
  },

  historyShortcut: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },

  historyShortcutText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },

  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },

  profileCardText: {
    flex: 1,
  },

  cardLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 3,
  },

  cardTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
  },

  cardMeta: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 4,
  },

  section: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: SPACING.sm,
  },

  sectionDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: SPACING.md,
  },

  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 50,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },

  optionCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },

  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(15, 118, 110, 0.08)",
  },

  optionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
    backgroundColor: COLORS.card,
  },

  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  checkboxTick: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  optionLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    flex: 1,
  },

  optionDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    paddingLeft: 34,
  },

  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: SPACING.lg,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.6,
  },

  viewAllText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "900",
  },

  emptyHistoryText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
  },

  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },

  historyImage: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.card,
  },

  historyImagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },

  historyImageText: {
    color: COLORS.primary,
    fontWeight: "900",
  },

  historyTextWrap: {
    flex: 1,
    marginLeft: SPACING.sm,
  },

  historyProductName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },

  historyMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  historyDate: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },

  deleteButton: {
    backgroundColor: "rgba(220, 38, 38, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.2)",
    borderRadius: RADIUS.lg,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: SPACING.lg,
  },

  deleteButtonText: {
    color: COLORS.high,
    fontSize: 15,
    fontWeight: "900",
  },

  disclaimer: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: SPACING.sm,
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: SPACING.lg,
  },

  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 22,
    paddingVertical: 15,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});