import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { saveUserProfile } from "../src/storage/profileStorage";
import { COLORS, RADIUS, SPACING } from "../src/theme";

const CONDITIONS = [
  "Kidney Disease",
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "Gout",
  "Gluten Allergy",
  "Nut Allergy",
  "Dairy Allergy",
];

export default function ProfileSetupScreen() {
  const [name, setName] = useState("");
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

  function toggleCondition(condition: string) {
    if (selectedConditions.includes(condition)) {
      setSelectedConditions(selectedConditions.filter((item) => item !== condition));
    } else {
      setSelectedConditions([...selectedConditions, condition]);
    }
  }

  async function handleSaveProfile() {
    const cleanName = name.trim();

    if (!cleanName) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }

    if (selectedConditions.length === 0) {
      Alert.alert("Select a condition", "Please choose at least one condition.");
      return;
    }

    await saveUserProfile({
      name: cleanName,
      conditions: selectedConditions,
      createdAt: new Date().toISOString(),
    });

    router.replace("/scanner");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Profile</Text>

      <Text style={styles.subtitle}>
        This is saved offline on your phone. No email, no account, no sign-in.
      </Text>

      <Text style={styles.label}>Name</Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
        placeholderTextColor={COLORS.muted}
        style={styles.input}
      />

      <Text style={styles.label}>Select your conditions</Text>

      <View style={styles.conditions}>
        {CONDITIONS.map((condition) => {
          const selected = selectedConditions.includes(condition);

          return (
            <Pressable
              key={condition}
              onPress={() => toggleCondition(condition)}
              style={[styles.conditionCard, selected && styles.conditionCardSelected]}
            >
              <Text style={[styles.conditionText, selected && styles.conditionTextSelected]}>
                {condition}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.button} onPress={handleSaveProfile}>
        <Text style={styles.buttonText}>Save Profile</Text>
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
    fontFamily: "CinzelBold",
    fontSize: 34,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.muted,
    marginBottom: SPACING.xl,
  },

  label: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: SPACING.xl,
  },

  conditions: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },

  conditionCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },

  conditionCardSelected: {
    backgroundColor: "rgba(15, 118, 110, 0.1)",
    borderColor: COLORS.primary,
  },

  conditionText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  conditionTextSelected: {
    color: COLORS.primary,
  },

  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 17,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});