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

import {
    getHistoryItemById,
    ScanHistoryItem,
} from "../src/storage/scanHistory";
import { COLORS, RADIUS } from "../src/theme";

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [item, setItem] = useState<ScanHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadItem() {
      if (!id) {
        setLoading(false);
        return;
      }

      const savedItem = await getHistoryItemById(String(id));

      setItem(savedItem);
      setLoading(false);
    }

    loadItem();
  }, [id]);

  function getRiskColor(score: number) {
    if (score >= 70) return COLORS.high;
    if (score >= 40) return COLORS.moderate;
    if (score > 0) return COLORS.low;

    return COLORS.safe;
  }

  function formatDate(value: string) {
    const date = new Date(value);

    return date.toLocaleString("en-ZA", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatNutritionValue(
    value: unknown,
    suffix = "g per 100g"
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "Not listed";
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return String(value);
    }

    return `${numericValue} ${suffix}`;
  }

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loadingText}>
          Loading saved result...
        </Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.notFoundTitle}>
          Saved result not found
        </Text>

        <Text style={styles.notFoundText}>
          This scan may have been deleted from your history.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>
            Return to History
          </Text>
        </Pressable>
      </View>
    );
  }

  const riskColor = getRiskColor(item.riskScore);
  const nutriments = item.nutriments || {};

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
          <Ionicons
            name="arrow-back"
            size={24}
            color={COLORS.text}
          />
        </Pressable>

        <Text style={styles.topBarTitle}>Saved Result</Text>

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
          <Ionicons
            name="fast-food-outline"
            size={52}
            color={COLORS.muted}
          />
        </View>
      )}

      <Text style={styles.productName}>
        {item.productName}
      </Text>

      {!!item.brand && (
        <Text style={styles.brand}>{item.brand}</Text>
      )}

      <Text style={styles.barcode}>
        Barcode: {item.barcode}
      </Text>

      <Text style={styles.scanDate}>
        Scanned {formatDate(item.scannedAt)}
      </Text>

      <View
        style={[
          styles.scoreCard,
          {
            borderColor: riskColor,
          },
        ]}
      >
        <Text style={styles.scoreCardLabel}>
          NutriLens Score
        </Text>

        <Text
          style={[
            styles.scoreNumber,
            {
              color: riskColor,
            },
          ]}
        >
          {item.riskScore}/100
        </Text>

        <View
          style={[
            styles.riskBadge,
            {
              borderColor: riskColor,
              backgroundColor: `${riskColor}15`,
            },
          ]}
        >
          <Text
            style={[
              styles.riskBadgeText,
              {
                color: riskColor,
              },
            ]}
          >
            {item.riskLevel}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Selected Conditions
        </Text>

        {item.conditions.length > 0 ? (
          <View style={styles.conditionContainer}>
            {item.conditions.map((condition) => (
              <View
                key={condition}
                style={styles.conditionChip}
              >
                <Text style={styles.conditionText}>
                  {condition}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.bodyText}>
            No conditions were selected.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Warnings
        </Text>

        {item.warnings.length > 0 ? (
          item.warnings.map((warning, index) => (
            <View
              key={`${warning}-${index}`}
              style={styles.warningCard}
            >
              <Ionicons
                name="warning-outline"
                size={20}
                color={COLORS.high}
              />

              <Text style={styles.warningText}>
                {warning}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.bodyText}>
            No major warnings were detected for the selected
            conditions.
          </Text>
        )}
      </View>

      {!!item.riskReasons?.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Why This Score Was Given
          </Text>

          {item.riskReasons.map((reason, index) => (
            <View
              key={`${reason}-${index}`}
              style={styles.reasonRow}
            >
              <View style={styles.reasonDot} />

              <Text style={styles.reasonText}>
                {reason}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Ingredients
        </Text>

        <Text style={styles.bodyText}>
          {item.ingredients ||
            "Ingredient information was not saved for this scan."}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Nutrition per 100g
        </Text>

        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Sodium</Text>

          <Text style={styles.nutritionValue}>
            {formatNutritionValue(
              nutriments.sodium_100g,
              "g per 100g"
            )}
          </Text>
        </View>

        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Salt</Text>

          <Text style={styles.nutritionValue}>
            {formatNutritionValue(nutriments.salt_100g)}
          </Text>
        </View>

        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Sugar</Text>

          <Text style={styles.nutritionValue}>
            {formatNutritionValue(nutriments.sugars_100g)}
          </Text>
        </View>

        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>
            Saturated fat
          </Text>

          <Text style={styles.nutritionValue}>
            {formatNutritionValue(
              nutriments["saturated-fat_100g"]
            )}
          </Text>
        </View>

        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Protein</Text>

          <Text style={styles.nutritionValue}>
            {formatNutritionValue(nutriments.proteins_100g)}
          </Text>
        </View>

        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>
            Carbohydrates
          </Text>

          <Text style={styles.nutritionValue}>
            {formatNutritionValue(
              nutriments.carbohydrates_100g
            )}
          </Text>
        </View>

        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Potassium</Text>

          <Text style={styles.nutritionValue}>
            {formatNutritionValue(
              nutriments.potassium_100g
            )}
          </Text>
        </View>
      </View>

      <Text style={styles.disclaimer}>
        NutriLens provides automated informational guidance based
        on available product data. Product information may be
        incomplete or inaccurate. Always verify the packaging and
        consult your doctor or dietitian before making medical
        dietary decisions.
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

  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
  },

  notFoundTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },

  notFoundText: {
    color: COLORS.muted,
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  topBarTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },

  topBarSpacer: {
    width: 42,
  },

  productImage: {
    width: 190,
    height: 190,
    alignSelf: "center",
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
    marginBottom: 18,
  },

  imagePlaceholder: {
    width: 190,
    height: 190,
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
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "800",
    textAlign: "center",
  },

  brand: {
    color: COLORS.muted,
    fontSize: 15,
    textAlign: "center",
    marginTop: 5,
  },

  barcode: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 9,
  },

  scanDate: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },

  scoreCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 20,
    alignItems: "center",
    marginTop: 22,
  },

  scoreCardLabel: {
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
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 8,
  },

  riskBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },

  section: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 17,
    marginTop: 16,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
  },

  bodyText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
  },

  conditionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  conditionChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },

  conditionText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
  },

  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 9,
  },

  warningText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 9,
  },

  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 9,
  },

  reasonDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 7,
    marginRight: 10,
  },

  reasonText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
  },

  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
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