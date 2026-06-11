import {
  Cinzel_400Regular,
  Cinzel_700Bold,
  useFonts,
} from "@expo-google-fonts/cinzel";
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

const AVOID_OPTIONS = [
  {
    id: "phosphates",
    label: "Phosphates",
    description: "Common in some processed foods, colas, meats, and baked goods.",
  },
  {
    id: "potassiumAdditives",
    label: "Potassium additives",
    description: "Looks for potassium-based additives in ingredient lists.",
  },
  {
    id: "sodium",
    label: "Sodium / salt",
    description: "Helps you notice salt and sodium-related ingredients.",
  },
  {
    id: "addedSugars",
    label: "Added sugars",
    description: "Looks for sugar, syrup, glucose, fructose, and similar terms.",
  },
  {
    id: "gluten",
    label: "Gluten / wheat",
    description: "Looks for wheat, gluten, barley, rye, and malt.",
  },
  {
    id: "dairy",
    label: "Milk / dairy",
    description: "Looks for milk, whey, lactose, casein, butter, and cream.",
  },
  {
    id: "nuts",
    label: "Nuts",
    description: "Looks for peanuts and common tree nuts.",
  },
  {
    id: "caffeine",
    label: "Caffeine",
    description: "Looks for caffeine, guarana, coffee extract, and similar terms.",
  },
  {
    id: "yeastExtract",
    label: "Yeast extract",
    description: "Looks for yeast extract and similar savoury flavouring terms.",
  },
  {
    id: "msg",
    label: "MSG",
    description: "Looks for monosodium glutamate and MSG.",
  },
];

export default function ProfileSetupScreen() {
  const [fontsLoaded] = useFonts({
    CinzelRegular: Cinzel_400Regular,
    CinzelBold: Cinzel_700Bold,
  });

  const [name, setName] = useState("");
  const [selectedAvoidIds, setSelectedAvoidIds] = useState<string[]>([]);

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  function toggleAvoidItem(itemId: string) {
    if (selectedAvoidIds.includes(itemId)) {
      setSelectedAvoidIds(selectedAvoidIds.filter((item) => item !== itemId));
    } else {
      setSelectedAvoidIds([...selectedAvoidIds, itemId]);
    }
  }

  async function handleSaveProfile() {
    const cleanName = name.trim();

    if (!cleanName) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }

    if (selectedAvoidIds.length === 0) {
      Alert.alert(
        "Select at least one item",
        "Please choose at least one ingredient or nutrient to watch."
      );
      return;
    }

    await saveUserProfile({
  name: cleanName,
  avoidIds: selectedAvoidIds,
  createdAt: new Date().toISOString(),
});

router.replace("/profile-select");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Scan Profile</Text>

      <Text style={styles.subtitle}>
        Choose ingredients and nutrients you want NutriLens to help you watch
        for when scanning products. This is saved offline on your phone. No
        email, no account, no sign-in.
      </Text>

      <Text style={styles.label}>Name</Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
        placeholderTextColor={COLORS.muted}
        style={styles.input}
      />

      <Text style={styles.label}>Ingredients and nutrients to watch</Text>

      <View style={styles.options}>
        {AVOID_OPTIONS.map((item) => {
          const selected = selectedAvoidIds.includes(item.id);

          return (
            <Pressable
              key={item.id}
              onPress={() => toggleAvoidItem(item.id)}
              style={[
                styles.optionCard,
                selected && styles.optionCardSelected,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  selected && styles.optionTextSelected,
                ]}
              >
                {item.label}
              </Text>

              <Text style={styles.optionDescription}>
                {item.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.disclaimer}>
        NutriLens helps identify selected ingredients and nutrient information
        from available product data. It does not provide medical advice,
        diagnosis, treatment, or personalised dietary recommendations. Always
        check the product packaging.
      </Text>

      <Pressable style={styles.button} onPress={handleSaveProfile}>
        <Text style={styles.buttonText}>Save Profile and Start Scanning</Text>
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

  options: {
  gap: SPACING.md,
  marginBottom: SPACING.xl,
},

  optionCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },

  optionCardSelected: {
    backgroundColor: "rgba(15, 118, 110, 0.1)",
    borderColor: COLORS.primary,
  },

  optionText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },

  optionTextSelected: {
    color: COLORS.primary,
  },

  optionDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.muted,
  },

  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
    marginBottom: SPACING.lg,
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