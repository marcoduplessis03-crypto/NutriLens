import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

import { COLORS, RADIUS, SPACING } from "../theme";
export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Privacy Policy</Text>

      <Text style={styles.text}>
        NutriLens stores your scan profiles, avoid lists, and scan history
        locally on your device using app storage.
      </Text>

      <Text style={styles.text}>
        NutriLens does not require account sign-in. Your local profiles are not
        sold or used for advertising.
      </Text>

      <Text style={styles.text}>
        When you scan a barcode, NutriLens may connect to third-party food
        product databases to retrieve product, ingredient, and nutrient
        information. These services may receive the barcode being searched.
      </Text>

      <Text style={styles.text}>
        You are responsible for managing your device and app data. Deleting the
        app may remove locally stored profiles and scan history.
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