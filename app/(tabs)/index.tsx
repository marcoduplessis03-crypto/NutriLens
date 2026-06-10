import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getHealthProfile,
  saveHealthProfile,
} from "../../src/storage/healthProfile";
import { COLORS, RADIUS, SPACING } from "../../src/theme";

const conditions = [
  { name: "Kidney Disease", icon: "🫘", note: "Phosphate, potassium & sodium alerts" },
  { name: "Heart Disease", icon: "❤️", note: "Saturated fat & sodium warnings" },
  { name: "Diabetes", icon: "🩸", note: "Sugar and carb-related flags" },
  { name: "Hypertension", icon: "🧂", note: "High sodium and stimulant alerts" },
  { name: "Gout", icon: "🦶", note: "Purine-related ingredient warnings" },
  { name: "Gluten Allergy", icon: "🌾", note: "Wheat and gluten ingredient checks" },
  { name: "Nut Allergy", icon: "🥜", note: "Nut and trace allergen alerts" },
  { name: "Dairy Allergy", icon: "🥛", note: "Milk, lactose and dairy checks" },
];

export default function HomeScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function loadProfile() {
        const savedConditions = await getHealthProfile();
        setSelected(savedConditions);
        setProfileLoaded(true);
      }

      loadProfile();
    }, [])
  );

  const toggleCondition = (condition: string) => {
    if (selected.includes(condition)) {
      setSelected(selected.filter((c) => c !== condition));
    } else {
      setSelected([...selected, condition]);
    }
  };

  const continueToScanner = async () => {
    await saveHealthProfile(selected);

    router.push({
      pathname: "/scanner",
      params: {
        conditions: selected.join(","),
      },
    });
  };

  const canContinue = selected.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>NL</Text>
        </View>

        <Text style={styles.title}>NutriLens</Text>

        <Text style={styles.subtitle}>
          Your saved health profile helps NutriLens scan food labels for the risks
          that matter to you.
        </Text>
      </View>

      {profileLoaded && selected.length > 0 && (
        <View style={styles.savedProfileCard}>
          <Text style={styles.savedProfileTitle}>Saved profile active</Text>
          <Text style={styles.savedProfileText}>
            {selected.length} condition{selected.length === 1 ? "" : "s"} selected
          </Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Health profile</Text>
        <Text style={styles.sectionText}>
          Select your conditions once. NutriLens will remember them for future scans.
        </Text>
      </View>

      {conditions.map((condition) => {
        const isSelected = selected.includes(condition.name);

        return (
          <TouchableOpacity
            key={condition.name}
            style={[styles.card, isSelected && styles.selectedCard]}
            onPress={() => toggleCondition(condition.name)}
            activeOpacity={0.85}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.icon}>{condition.icon}</Text>

              <View style={styles.cardTextWrap}>
                <Text style={[styles.cardTitle, isSelected && styles.selectedText]}>
                  {condition.name}
                </Text>
                <Text style={[styles.cardNote, isSelected && styles.selectedNote]}>
                  {condition.note}
                </Text>
              </View>
            </View>

            <View style={[styles.checkCircle, isSelected && styles.checkedCircle]}>
              <Text style={styles.checkText}>{isSelected ? "✓" : ""}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[styles.button, !canContinue && styles.disabledButton]}
        disabled={!canContinue}
        onPress={continueToScanner}
        activeOpacity={0.9}
      >
        <Text style={styles.buttonText}>
          {canContinue
            ? `Save Profile & Scan`
            : "Select at least one condition"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        NutriLens provides ingredient-based guidance only and does not replace medical advice.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    paddingTop: 64,
    backgroundColor: COLORS.background,
  },
  hero: {
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  title: {
    fontSize: 40,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: COLORS.muted,
  },
  savedProfileCard: {
    backgroundColor: "#E0F2F1",
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  savedProfileTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 4,
  },
  savedProfileText: {
    fontSize: 14,
    color: COLORS.text,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.muted,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    fontSize: 28,
    marginRight: 14,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 3,
  },
  cardNote: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.muted,
  },
  selectedText: {
    color: "#FFFFFF",
  },
  selectedNote: {
    color: "#DFF7F3",
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  checkedCircle: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  checkText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "900",
  },
  button: {
    backgroundColor: COLORS.text,
    padding: 18,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.lg,
  },
  disabledButton: {
    backgroundColor: COLORS.muted,
  },
  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
  },
  disclaimer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
    textAlign: "center",
  },
});