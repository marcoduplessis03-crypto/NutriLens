import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { COLORS, RADIUS, SPACING } from "../theme";

export default function TermsDisclaimerScreen() {
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    if (!agreeChecked || saving) return;

    setSaving(true);
    router.replace("/profile-select");
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>NutriLens</Text>
        <Text style={styles.title}>Before you continue</Text>

        <Text style={styles.body}>
          NutriLens helps you scan food products, view ingredient and nutrient
          information, and flag items based on your own selected avoid list.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Important disclaimer</Text>

          <Text style={styles.cardText}>
            NutriLens is for general ingredient awareness and nutrient
            information only. It does not provide medical advice, diagnosis,
            treatment, risk scoring, or product safety guarantees.
          </Text>

          <Text style={styles.cardText}>
            Food product data may be incomplete, outdated, incorrect, or missing.
            Always check the physical product label before consuming anything.
          </Text>

          <Text style={styles.cardText}>
            If you have allergies, dietary restrictions, a medical condition, or
            specific nutritional needs, speak to a qualified healthcare
            professional before making decisions.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push("/privacy-policy")}
        >
          <Text style={styles.linkText}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push("/terms-of-use")}
        >
          <Text style={styles.linkText}>Terms of Use</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push("/disclaimer-about")}
        >
          <Text style={styles.linkText}>Disclaimer / About NutriLens</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreeChecked((current) => !current)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreeChecked && styles.checkboxActive]}>
            {agreeChecked ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>

          <Text style={styles.checkboxText}>
            I have read and agree to the Terms of Use, Privacy Policy, and
            Disclaimer.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueButton,
            (!agreeChecked || saving) && styles.continueButtonDisabled,
          ]}
          disabled={!agreeChecked || saving}
          onPress={handleContinue}
        >
          <Text style={styles.continueText}>
            {saving ? "Continuing..." : "Agree and Continue"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  logo: {
    fontSize: 34,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.muted,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.muted,
    marginBottom: SPACING.sm,
  },
  linkButton: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    color: "#fff",
    fontWeight: "700",
  },
  checkboxText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: "center",
  },
  continueButtonDisabled: {
    opacity: 0.45,
  },
  continueText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});