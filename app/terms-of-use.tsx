import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

import { COLORS, RADIUS, SPACING } from "../src/theme";

export default function TermsOfUseScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Terms of Use</Text>

      <Text style={styles.text}>
        By using NutriLens, you agree to use the app for general ingredient
        awareness and nutrient information only.
      </Text>

      <Text style={styles.text}>
        NutriLens does not guarantee that product data, ingredient lists, or
        nutrient values are complete, accurate, or up to date.
      </Text>

      <Text style={styles.text}>
        You agree to check physical product packaging before consuming any item.
      </Text>

      <Text style={styles.text}>
        NutriLens must not be used as a replacement for medical, nutritional, or
        allergy advice from a qualified professional.
      </Text>

      <Text style={styles.text}>
        We may update the app, wording, features, or data sources over time.
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