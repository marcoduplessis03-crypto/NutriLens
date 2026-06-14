import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

import { COLORS, RADIUS, SPACING } from "../theme";

export default function DisclaimerAboutScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Disclaimer / About NutriLens</Text>

      <Text style={styles.text}>
        NutriLens is an ingredient awareness scanner. It lets users create local
        profiles and flag ingredients, additives, allergens, or nutrients they
        personally want to notice.
      </Text>

      <Text style={styles.text}>
        NutriLens does not diagnose, treat, prevent, or manage any medical
        condition. It does not provide risk scores or medical recommendations.
      </Text>

      <Text style={styles.text}>
        Product information comes from available food database sources and may
        not always match the item in your hand.
      </Text>

      <Text style={styles.text}>
        Always read the product label. If a food choice could affect your
        health, allergies, medication, or diet plan, ask a qualified healthcare
        professional.
      </Text>

     <TouchableOpacity
  style={styles.button}
  onPress={() => router.replace("/terms-disclaimer")}
>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl * 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.muted,
    marginBottom: SPACING.md,
  },
  button: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});