import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  ActionButton,
  GlassPanel,
  LegalLink,
  PageHeader,
  V21Screen,
} from "../components/NutriLensV21";
import { acceptTerms } from "../storage/termsAcceptance";
import { COLORS, RADIUS, SPACING } from "../theme";

export default function TermsDisclaimerScreen() {
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    if (!agreeChecked || saving) return;

    try {
      setSaving(true);
      await acceptTerms();
      router.replace("/home");
    } catch (error) {
      console.log("Failed to accept terms:", error);
      setSaving(false);
    }
  }

  return (
    <V21Screen scroll={false} contentStyle={styles.content}>
      <PageHeader
        title="Terms & Disclaimer"
        subtitle="Please review and accept before using NutriLens."
      />

      <GlassPanel strong style={styles.panel}>
        <ScrollView style={styles.scrollBox} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>What NutriLens does</Text>
          <Text style={styles.body}>
            NutriLens is a barcode scanner and product label helper. It compares
            available product ingredient text against your selected avoid list and
            displays basic nutrient awareness information when product data is
            available.
          </Text>

          <Text style={styles.sectionTitle}>Not medical advice</Text>
          <Text style={styles.body}>
            NutriLens is not a medical device and does not provide medical advice,
            diagnosis, treatment, prevention, or safety guarantees. Always check
            the physical product label and speak with a qualified healthcare
            professional for medical or dietary advice.
          </Text>

          <Text style={styles.sectionTitle}>Product data can be incomplete</Text>
          <Text style={styles.body}>
            Product information may be incomplete, outdated, unavailable, or
            provided by third-party databases. A result may show no selected
            ingredients found simply because the database does not include a full
            ingredient list.
          </Text>

          <Text style={styles.sectionTitle}>Your responsibility</Text>
          <Text style={styles.body}>
            You are responsible for checking packaging, allergen statements,
            ingredient lists, and nutrition labels before making purchase or
            eating decisions.
          </Text>
        </ScrollView>

        <Pressable
          style={styles.checkRow}
          onPress={() => setAgreeChecked((value) => !value)}
        >
          <View style={[styles.checkbox, agreeChecked && styles.checkboxChecked]}>
            {agreeChecked ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.checkText}>
            I understand and agree to the Terms, Privacy Policy, and Disclaimer.
          </Text>
        </Pressable>

        <ActionButton
          title={saving ? "Saving..." : "I Understand and Agree"}
          subtitle="Continue to NutriLens Home"
          icon="✓"
          onPress={handleContinue}
          disabled={!agreeChecked || saving}
          variant="primary"
        />
      </GlassPanel>

      <View style={styles.links}>
        <LegalLink
          title="Privacy Policy"
          onPress={() => router.push("/privacy-policy")}
        />
        <LegalLink
          title="Terms of Use"
          onPress={() => router.push("/terms-of-use")}
        />
        <LegalLink
          title="Disclaimer / About NutriLens"
          onPress={() => router.push("/disclaimer-about")}
        />
      </View>
    </V21Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  panel: {
    gap: SPACING.md,
  },
  scrollBox: {
    maxHeight: 360,
  },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: "900",
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  body: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(5,123,117,0.06)",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  checkText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  links: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
});
