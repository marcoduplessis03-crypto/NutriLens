import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getHistoryItemById, ScanHistoryItem } from "../src/storage/scanHistory";
import { COLORS, RADIUS, riskScoreColor } from "../src/theme";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNutritionValue(value: unknown, suffix = "g per 100g"): string {
  if (value === null || value === undefined || value === "") return "Not listed";
  const num = Number(value);
  return Number.isNaN(num) ? String(value) : `${num} ${suffix}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function NutritionRow({ label, value, suffix }: { label: string; value: unknown; suffix?: string }) {
  return (
    <View style={styles.nutritionRow}>
      <Text style={styles.nutritionLabel}>{label}</Text>
      <Text style={styles.nutritionValue}>{formatNutritionValue(value, suffix)}</Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [item, setItem] = useState<ScanHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (id) setItem(await getHistoryItemById(String(id)));
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading saved result…</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundTitle}>Saved result not found</Text>
        <Text style={styles.mutedText}>
          This scan may have been deleted from your history.
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Return to History</Text>
        </Pressable>
      </View>
    );
  }

  const riskColor = riskScoreColor(item.riskScore);
  const nutriments = item.nutriments ?? {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top bar ─────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Saved Result</Text>
        <View style={styles.topBarSpacer} />
      </View>

      {/* ── Product image ───────────────────────────────── */}
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.productImage}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="fast-food-outline" size={52} color={COLORS.muted} />
        </View>
      )}

      {/* ── Identity ────────────────────────────────────── */}
      <Text style={styles.productName}>{item.productName}</Text>
      {!!item.brand && <Text style={styles.brand}>{item.brand}</Text>}
      <Text style={styles.meta}>Barcode: {item.barcode}</Text>
      <Text style={styles.meta}>Scanned {formatDate(item.scannedAt)}</Text>

      {/* ── Score card ──────────────────────────────────── */}
      <View style={[styles.scoreCard, { borderColor: riskColor }]}>
        <Text style={styles.scoreLabel}>NutriLens Score</Text>
        <Text style={[styles.scoreNumber, { color: riskColor }]}>
          {item.riskScore}/100
        </Text>
        <View
          style={[
            styles.riskBadge,
            { borderColor: riskColor, backgroundColor: `${riskColor}18` },
          ]}
        >
          <Text style={[styles.riskBadgeText, { color: riskColor }]}>
            {item.riskLevel}
          </Text>
        </View>
      </View>

      {/* ── Conditions ──────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selected Conditions</Text>
        {item.conditions.length > 0 ? (
          <View style={styles.chipRow}>
            {item.conditions.map((c) => (
              <View key={c} style={styles.chip}>
                <Text style={styles.chipText}>{c}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.bodyText}>No conditions were selected.</Text>
        )}
      </View>

      {/* ── Warnings ────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Warnings</Text>
        {item.warnings.length > 0 ? (
          item.warnings.map((warning, i) => (
            <View key={`${warning}-${i}`} style={styles.warningRow}>
              <Ionicons name="warning-outline" size={18} color={COLORS.high} />
              <Text style={styles.warningText}>{warning}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.bodyText}>
            No major warnings detected for the selected conditions.
          </Text>
        )}
      </View>

      {/* ── Risk reasons ────────────────────────────────── */}
      {!!item.riskReasons?.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why This Score</Text>
          {item.riskReasons.map((reason, i) => (
            <View key={`${reason}-${i}`} style={styles.reasonRow}>
              <View style={styles.reasonDot} />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Ingredients ─────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        <Text style={styles.bodyText}>
          {item.ingredients || "Ingredient information was not saved for this scan."}
        </Text>
      </View>

      {/* ── Nutrition ───────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nutrition per 100 g</Text>
        <NutritionRow label="Sodium" value={nutriments.sodium_100g} />
        <NutritionRow label="Salt" value={nutriments.salt_100g} />
        <NutritionRow label="Sugar" value={nutriments.sugars_100g} />
        <NutritionRow label="Saturated fat" value={nutriments["saturated-fat_100g"]} />
        <NutritionRow label="Protein" value={nutriments.proteins_100g} />
        <NutritionRow label="Carbohydrates" value={nutriments.carbohydrates_100g} />
        <NutritionRow label="Potassium" value={nutriments.potassium_100g} />
      </View>

      <Text style={styles.disclaimer}>
        NutriLens provides automated informational guidance based on available product data.
        Product information may be incomplete or inaccurate. Always verify the packaging and
        consult your doctor or dietitian before making medical dietary decisions.
      </Text>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 60,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    padding: 24,
    gap: 8,
  },
  loadingText: {
    marginTop: 4,
    color: COLORS.muted,
  },
  notFoundTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  mutedText: {
    color: COLORS.muted,
    fontSize: 15,
    textAlign: "center",
  },

  // ── Top bar ───────────────────────────────────────────
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },
  topBarSpacer: {
    width: 40,
  },

  // ── Product ───────────────────────────────────────────
  productImage: {
    width: 180,
    height: 180,
    alignSelf: "center",
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
    marginBottom: 18,
  },
  imagePlaceholder: {
    width: 180,
    height: 180,
    alignSelf: "center",
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  productName: {
    color: COLORS.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  brand: {
    color: COLORS.muted,
    fontSize: 15,
    textAlign: "center",
    marginTop: 4,
  },
  meta: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },

  // ── Score card ────────────────────────────────────────
  scoreCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 20,
    alignItems: "center",
    marginTop: 20,
  },
  scoreLabel: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  scoreNumber: {
    fontSize: 38,
    fontWeight: "900",
    marginTop: 4,
  },
  riskBadge: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 8,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },

  // ── Sections ──────────────────────────────────────────
  section: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginTop: 14,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  bodyText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
  },

  // ── Chips ─────────────────────────────────────────────
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  chip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  chipText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Warnings ──────────────────────────────────────────
  warningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
  },
  warningText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },

  // ── Reasons ───────────────────────────────────────────
  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  reasonDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 7,
  },
  reasonText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
  },

  // ── Nutrition ─────────────────────────────────────────
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  nutritionLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  nutritionValue: {
    color: COLORS.muted,
    fontSize: 14,
    maxWidth: "52%",
    textAlign: "right",
  },

  // ── CTAs ──────────────────────────────────────────────
  primaryButton: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  // ── Disclaimer ────────────────────────────────────────
  disclaimer: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 22,
    paddingHorizontal: 10,
  },
});
