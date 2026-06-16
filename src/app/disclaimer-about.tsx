import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton, GlassPanel, PageHeader, V21Screen } from "../components/NutriLensV21";
import { COLORS, SPACING } from "../theme";

export default function DisclaimerAboutScreen() {
  return (
    <V21Screen>
      <PageHeader title="About NutriLens" subtitle="SUBAbout NutriLens" />
      <GlassPanel strong style={styles.panel}>
        <Text style={styles.heading}>About</Text>
        <Text style={styles.body}>NutriLens helps users scan product barcodes, review available ingredients, and flag selected ingredients from their personal avoid list.</Text>
        <Text style={styles.heading}>Disclaimer</Text>
        <Text style={styles.body}>NutriLens is not a medical device and does not determine whether a food is safe or suitable for you.</Text>
        <Text style={styles.heading}>Product labels matter</Text>
        <Text style={styles.body}>Always check the physical product packaging, allergen statements, and nutrition panel before making decisions.</Text>
        <Text style={styles.heading}>Best use</Text>
        <Text style={styles.body}>Use NutriLens as a faster first-pass label helper, not as a replacement for professional advice or label verification.</Text>
      </GlassPanel>
      <View style={styles.buttonWrap}>
        <ActionButton title="Back" subtitle="Return to previous screen" icon="‹" onPress={() => router.back()} />
      </View>
    </V21Screen>
  );
}

const styles = StyleSheet.create({
  panel: { gap: SPACING.md },
  heading: { color: COLORS.ink, fontSize: 16, fontWeight: "900", marginTop: SPACING.sm },
  body: { color: COLORS.text, fontSize: 14, lineHeight: 22, fontWeight: "600" },
  buttonWrap: { marginTop: SPACING.md },
});
