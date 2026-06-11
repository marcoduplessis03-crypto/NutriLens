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
import { COLORS, RADIUS } from "../src/theme";

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
  if (value === null || value === undefined || value === "") {
    return "Not listed";
  }

  const num = Number(value);

  return Number.isNaN(num) ? String(value) : `${num} ${suffix}`;
}

function getMatchCount(item: ScanHistoryItem): number {
  return (
    item.matchCount ??
    item.ingredientMatches?.length ??
    item.warningCount ??
    0
  );
}

function NutritionRow({
  label,
  value,
  suffix,
}: {
  label: string;
  value: unknown;
  suffix?: string;
}) {
  return (
    <View style={styles.nutritionRow}>
      <Text style={styles.nutritionLabel}>{label}</Text>
      <Text style={styles.nutritionValue}>
        {formatNutritionValue(value, suffix)}
      </Text>
    </View>
  );
}

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [item, setItem] = useState<ScanHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (id) {
        setItem(await getHistoryItemById(String(id)));
      }

      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading saved scan…</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundTitle}>Saved scan not found</Text>

        <Text style={styles.mutedText}>
          This scan may have been deleted from your history.
        </Text>

        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Return to History</Text>
        </Pressable>
      </View>
    );
  }

  const nutriments = item.nutriments ?? {};
  const ingredientMatches = item.ingredientMatches ?? [];
  const nutrientNotices = item.nutrientNotices ?? [];
  const matchCount = getMatchCount(item);
  const hasMatches = matchCount > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </Pressable>

        <Text style={styles.topBarTitle}>Saved Scan</Text>

        <View style={styles.topBarSpacer} />
      </View>

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

      <Text style={styles.productName}>{item.productName}</Text>

      {!!item.brand && <Text style={styles.brand}>{item.brand}</Text>}

      <Text style={styles.meta}>Barcode: {item.barcode}</Text>
      <Text style={styles.meta}>Scanned {formatDate(item.scannedAt)}</Text>

      {!!item.profileName && (
        <View style={styles.profileBadge}>
          <Text style={styles.profileBadgeText}>
            Profile: {item.profileName}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.summaryCard,
          hasMatches ? styles.summaryCardWarning : styles.summaryCardOk,
        ]}
      >
        <Text style={styles.summaryLabel}>Ingredient check</Text>

        <Text
          style={[
            styles.summaryTitle,
            hasMatches ? styles.summaryTitleWarning : styles.summaryTitleOk,
          ]}
        >
          {hasMatches
            ? `${matchCount} selected ingredient${
                matchCount === 1 ? "" : "s"
              } found`
            : "No selected ingredients found"}
        </Text>

        <Text style={styles.summaryText}>
          NutriLens compared the available ingredient text against the avoid list
          saved in your local scan profile.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredient matches</Text>

        {ingredientMatches.length > 0 ? (
          ingredientMatches.map((match, index) => (
            <View key={`${match.avoidId}-${index}`} style={styles.matchRow}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={COLORS.moderate}
              />

              <View style={styles.matchTextWrap}>
                <Text style={styles.matchTitle}>{match.label}</Text>

                <Text style={styles.matchKeywords}>
                  Matched: {match.matchedKeywords.join(", ")}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.bodyText}>
            No selected ingredients were found in the available ingredient text.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nutrient awareness</Text>

        {nutrientNotices.length > 0 ? (
          nutrientNotices.map((notice) => (
            <View key={notice.id} style={styles.noticeRow}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={COLORS.primary}
              />

              <View style={styles.noticeTextWrap}>
                <Text style={styles.noticeTitle}>
                  {notice.label}: {notice.value}
                </Text>

                <Text style={styles.noticeText}>{notice.note}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.bodyText}>
            No nutrient notices were saved for this scan.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>

        <Text style={styles.bodyText}>
          {item.ingredients ||
            "Ingredient information was not saved for this scan."}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nutrition per 100 g</Text>

        <NutritionRow
          label="Sodium"
          value={nutriments.sodium_100g}
          suffix="g per 100g"
        />

        <NutritionRow
          label="Salt"
          value={nutriments.salt_100g}
          suffix="g per 100g"
        />

        <NutritionRow
          label="Sugar"
          value={nutriments.sugars_100g}
          suffix="g per 100g"
        />

        <NutritionRow
          label="Saturated fat"
          value={nutriments["saturated-fat_100g"]}
          suffix="g per 100g"
        />

        <NutritionRow
          label="Protein"
          value={nutriments.proteins_100g}
          suffix="g per 100g"
        />

        <NutritionRow
          label="Carbohydrates"
          value={nutriments.carbohydrates_100g}
          suffix="g per 100g"
        />

        <NutritionRow
          label="Potassium"
          value={nutriments.potassium_100g}
          suffix="g per 100g"
        />
      </View>

      <Text style={styles.disclaimer}>
        NutriLens uses available third-party product data to flag selected
        ingredients and show basic nutrient information. Product data may be
        incomplete or inaccurate. Always check the physical product packaging.
        NutriLens does not provide medical advice, diagnosis, treatment, or
        personalised dietary recommendations.
      </Text>
    </ScrollView>
  );
}

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

  profileBadge: {
    alignSelf: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
  },

  profileBadgeText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
  },

  summaryCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 20,
    marginTop: 20,
  },

  summaryCardOk: {
    borderColor: COLORS.safe,
  },

  summaryCardWarning: {
    borderColor: COLORS.moderate,
  },

  summaryLabel: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },

  summaryTitle: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "900",
  },

  summaryTitleOk: {
    color: COLORS.safe,
  },

  summaryTitleWarning: {
    color: COLORS.moderate,
  },

  summaryText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },

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

  matchRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
  },

  matchTextWrap: {
    flex: 1,
  },

  matchTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 3,
  },

  matchKeywords: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },

  noticeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
  },

  noticeTextWrap: {
    flex: 1,
  },

  noticeTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 3,
  },

  noticeText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },

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

  disclaimer: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 22,
    paddingHorizontal: 10,
  },
});