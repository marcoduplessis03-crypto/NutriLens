import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton, GlassPanel, PageHeader, V21Screen } from "../components/NutriLensV21";
import { COLORS, SPACING } from "../theme";

export default function TermsOfUseScreen() {
  return (
    <V21Screen>
      <PageHeader title="Terms of Use" subtitle="SUBTerms of Use" />
      <GlassPanel strong style={styles.panel}>
        <Text style={styles.heading}>Use of the app</Text>
        <Text style={styles.body}>NutriLens is provided as an ingredient flagging and nutrient awareness helper. You agree to use it responsibly and to verify product labels yourself.</Text>
        <Text style={styles.heading}>No guarantees</Text>
        <Text style={styles.body}>NutriLens cannot guarantee that third-party product data is complete, current, or accurate. Product packaging should always be treated as the final reference.</Text>
        <Text style={styles.heading}>No medical advice</Text>
        <Text style={styles.body}>NutriLens does not provide medical advice, diagnosis, treatment, prevention, or safety guarantees.</Text>
        <Text style={styles.heading}>Availability</Text>
        <Text style={styles.body}>Barcode lookup results depend on network availability and third-party database coverage.</Text>
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
