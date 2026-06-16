import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton, GlassPanel, PageHeader, V21Screen } from "../components/NutriLensV21";
import { COLORS, SPACING } from "../theme";

export default function PrivacyPolicyScreen() {
  return (
    <V21Screen>
      <PageHeader title="Privacy Policy" subtitle="SUBPrivacy Policy" />
      <GlassPanel strong style={styles.panel}>
        <Text style={styles.heading}>Local profile storage</Text>
        <Text style={styles.body}>NutriLens stores your profiles, avoid lists, scan history, favorites, and terms acceptance locally on this device using app storage.</Text>
        <Text style={styles.heading}>Product lookups</Text>
        <Text style={styles.body}>When you scan a barcode, NutriLens may request product information from third-party product databases such as Open Food Facts. The barcode is sent as part of that lookup request.</Text>
        <Text style={styles.heading}>No account required</Text>
        <Text style={styles.body}>NutriLens does not require Google, Apple, email, or password sign-in for the local profile experience.</Text>
        <Text style={styles.heading}>Data control</Text>
        <Text style={styles.body}>You can edit or delete local profiles, clear scan history, and remove favorites inside the app.</Text>
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
