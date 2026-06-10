import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { lookupProduct, LookupStage } from "../src/api/productLookup";
import { calculateRisk } from "../src/riskEngine";
import { saveScanToHistory } from "../src/storage/scanHistory";
import { COLORS, RADIUS } from "../src/theme";
import {
  NormalizedProduct,
  RiskResult,
  RiskVerdict,
} from "../src/types/product";

const EMPTY_RISK: RiskResult = {
  score: 0,
  verdict: "Recommended",
  findings: [],
  reasons: [],
  redFlags: [],
};

const BARCODE_CONFIRMATION_MS = 1200;

type ScannerPhase =
  | "camera"
  | "barcode-detected"
  | "looking-up"
  | "results"
  | "not-found"
  | "error";

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function buildWarnings(risk: RiskResult): string[] {
  if (!risk.findings.length) {
    return [
      "🟢 No major concerns were detected for the selected conditions based on the available product data.",
    ];
  }

  return risk.findings.map((finding) => {
    const icon =
      finding.severity === "critical" || finding.severity === "high"
        ? "🔴"
        : finding.severity === "moderate"
        ? "🟠"
        : "🟡";

    const value = finding.detectedValue
      ? ` ${finding.detectedValue}.`
      : "";

    const matches =
      finding.matchedIngredients?.length
        ? ` Detected: ${finding.matchedIngredients.slice(0, 5).join(", ")}.`
        : "";

    return `${icon} ${finding.condition}: ${finding.title}.${value} ${finding.explanation}${matches}`;
  });
}

export default function ScannerScreen() {
  const { conditions } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();

  const scanLock = useRef(false);

  const [phase, setPhase] = useState<ScannerPhase>("camera");
  const [cameraKey, setCameraKey] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [lookupText, setLookupText] = useState("");
  const [attemptedSources, setAttemptedSources] = useState<string[]>([]);
  const [product, setProduct] = useState<NormalizedProduct | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [risk, setRisk] = useState<RiskResult>(EMPTY_RISK);

  const selectedConditions = String(conditions || "")
    .split(",")
    .map((condition) => condition.trim())
    .filter(Boolean);

  useFocusEffect(
    useCallback(() => {
      resetScanner();

      return () => {
        scanLock.current = true;
      };
    }, [])
  );

  function resetScanner() {
    scanLock.current = false;
    setPhase("camera");
    setCameraReady(false);
    setBarcode("");
    setLookupText("");
    setAttemptedSources([]);
    setProduct(null);
    setWarnings([]);
    setRisk(EMPTY_RISK);
    setCameraKey((current) => current + 1);
  }

  function handleLookupStage(stage: LookupStage) {
    if (stage === "open-food-facts") {
      setLookupText("Checking Open Food Facts...");
      return;
    }

    if (stage === "usda") {
      setLookupText("Not found there. Checking USDA FoodData Central...");
      return;
    }

    setLookupText("Finishing product analysis...");
  }

  async function handleBarcodeScanned(result: { data?: string }) {
    if (scanLock.current) return;

    const detectedBarcode = String(result?.data || "").trim();
    if (!detectedBarcode) return;

    scanLock.current = true;
    setBarcode(detectedBarcode);
    setPhase("barcode-detected");
    setLookupText("Barcode detected");

    await delay(BARCODE_CONFIRMATION_MS);

    setPhase("looking-up");
    setLookupText("Preparing product lookup...");

    try {
      const lookup = await lookupProduct(
        detectedBarcode,
        handleLookupStage
      );

      setAttemptedSources(lookup.attemptedSources);

      if (!lookup.product) {
        setPhase("not-found");
        return;
      }

      const normalizedProduct = lookup.product;

      const productForRules = {
        product_name: normalizedProduct.name,
        ingredients_text: normalizedProduct.ingredients,
        nutriments: normalizedProduct.nutriments,
      };

      const calculatedRisk = calculateRisk(
        productForRules,
        selectedConditions
      );

      const productWarnings = buildWarnings(calculatedRisk);

      setProduct(normalizedProduct);
      setRisk(calculatedRisk);
      setWarnings(productWarnings);
      setPhase("results");

      try {
        await saveScanToHistory({
          barcode: normalizedProduct.barcode,
          productName: normalizedProduct.name || "Unknown product",
          brand: normalizedProduct.brand || "",
          imageUrl: normalizedProduct.image || undefined,
          riskScore: calculatedRisk.score,
          riskLevel: calculatedRisk.verdict,
          warningCount: calculatedRisk.findings.length,
          warnings: productWarnings,
          conditions: selectedConditions,
          ingredients: normalizedProduct.ingredients || "",
          nutriments: normalizedProduct.nutriments || {},
          riskReasons: calculatedRisk.reasons,
        });
      } catch (historyError) {
        console.warn("Could not save scan history:", historyError);
      }
    } catch (error) {
      console.error("Product lookup failed:", error);
      setPhase("error");
    }
  }

  function riskColor(verdict: RiskVerdict) {
    if (verdict === "Not Recommended") return "#DC2626";
    if (verdict === "Use With Caution") return "#F97316";
    if (verdict === "Low Risk") return "#EAB308";
    return "#16A34A";
  }

  function riskBackground(verdict: RiskVerdict) {
    if (verdict === "Not Recommended") return "#FEE2E2";
    if (verdict === "Use With Caution") return "#FFEDD5";
    if (verdict === "Low Risk") return "#FEF9C3";
    return "#DCFCE7";
  }

  function verdictGuidance(verdict: RiskVerdict) {
    if (verdict === "Not Recommended") {
      return "One or more significant concerns were detected for your selected health profile. Review the product label and seek personalised medical or dietetic advice.";
    }

    if (verdict === "Use With Caution") {
      return "This product contains nutritional characteristics that may require moderation. Consider portion size, frequency and your individual dietary limits.";
    }

    if (verdict === "Low Risk") {
      return "Only minor concerns were detected based on the available product information.";
    }

    return "No major concerns were detected for your selected health profile using the available data.";
  }

  function nutrientLevel(
    value: number | null,
    moderate: number,
    high: number
  ) {
    if (value == null) return "Unknown";
    if (value >= high) return "High";
    if (value >= moderate) return "Moderate";
    return "Low";
  }

  function nutrientBadgeColor(level: string) {
    if (level === "High") {
      return {
        background: "#FEE2E2",
        foreground: "#DC2626",
      };
    }

    if (level === "Moderate") {
      return {
        background: "#FFEDD5",
        foreground: "#F97316",
      };
    }

    if (level === "Low") {
      return {
        background: "#DCFCE7",
        foreground: "#16A34A",
      };
    }

    return {
      background: "#F1F5F9",
      foreground: "#64748B",
    };
  }

  function renderNutrientRow(
    label: string,
    value: number | null,
    unit: string,
    moderate: number,
    high: number
  ) {
    const level = nutrientLevel(value, moderate, high);
    const badge = nutrientBadgeColor(level);

    return (
      <View style={styles.nutrientRow}>
        <View style={styles.nutrientTextWrap}>
          <Text style={styles.nutrientLabel}>{label}</Text>
          <Text style={styles.nutrientValue}>
            {value == null ? "Not available" : `${value} ${unit}`}
          </Text>
        </View>

        <View
          style={[
            styles.nutrientBadge,
            { backgroundColor: badge.background },
          ]}
        >
          <Text
            style={[
              styles.nutrientBadgeText,
              { color: badge.foreground },
            ]}
          >
            {level}
          </Text>
        </View>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.centerText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionTitle}>
          Camera permission needed
        </Text>

        <Text style={styles.centerText}>
          NutriLens uses your camera to scan food barcodes.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={requestPermission}
        >
          <Text style={styles.primaryButtonText}>
            Grant camera permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (
    phase === "camera" ||
    phase === "barcode-detected" ||
    phase === "looking-up"
  ) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          key={cameraKey}
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
          onMountError={(error) => {
            console.error("Camera mount error:", error);
            setPhase("error");
          }}
          barcodeScannerSettings={{
            barcodeTypes: [
              "ean13",
              "ean8",
              "upc_a",
              "upc_e",
              "code128",
            ],
          }}
          onBarcodeScanned={
            phase === "camera"
              ? handleBarcodeScanned
              : undefined
          }
        />

        <View style={styles.cameraShade}>
          <View style={styles.cameraHeader}>
            <Text style={styles.cameraTitle}>
              Scan a food barcode
            </Text>
            <Text style={styles.cameraSubtitle}>
              Keep the full barcode inside the frame
            </Text>
          </View>

          <View style={styles.scanFrame} />

          {!cameraReady && (
            <View style={styles.cameraStatusCard}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.cameraStatusText}>
                Starting camera...
              </Text>
            </View>
          )}

          {phase === "barcode-detected" && (
            <View style={styles.detectedCard}>
              <Text style={styles.detectedIcon}>✓</Text>

              <View style={styles.detectedTextWrap}>
                <Text style={styles.detectedTitle}>
                  Barcode detected
                </Text>

                <Text style={styles.detectedBarcode}>
                  {barcode}
                </Text>
              </View>
            </View>
          )}

          {phase === "looking-up" && (
            <View style={styles.detectedCard}>
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
              />

              <View style={styles.detectedTextWrap}>
                <Text style={styles.detectedTitle}>
                  {barcode}
                </Text>

                <Text style={styles.lookupText}>
                  {lookupText}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }

  if (phase === "not-found") {
    return (
      <ScrollView contentContainerStyle={styles.center}>
        <Text style={styles.notFoundIcon}>🔎</Text>

        <Text style={styles.permissionTitle}>
          Product not found
        </Text>

        <Text style={styles.barcodeDisplay}>
          Barcode: {barcode}
        </Text>

        <Text style={styles.centerText}>
          NutriLens checked{" "}
          {attemptedSources.join(" and ") ||
            "the available databases"}
          , but could not find usable product information.
          This does not mean the product is safe or unsafe.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={resetScanner}
        >
          <Text style={styles.primaryButtonText}>
            Scan again
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (phase === "error") {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundIcon}>⚠️</Text>

        <Text style={styles.permissionTitle}>
          Something went wrong
        </Text>

        <Text style={styles.centerText}>
          NutriLens could not complete the lookup.
          Check your internet connection and try again.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={resetScanner}
        >
          <Text style={styles.primaryButtonText}>
            Try again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sodiumMg =
    product?.nutriments.sodium_100g == null
      ? null
      : Math.round(product.nutriments.sodium_100g * 1000);

  const saltG =
    product?.nutriments.salt_100g == null
      ? null
      : Math.round(product.nutriments.salt_100g * 100) / 100;

  const sugarsG =
    product?.nutriments.sugars_100g == null
      ? null
      : Math.round(product.nutriments.sugars_100g * 10) / 10;

  const saturatedFatG =
    product?.nutriments["saturated-fat_100g"] == null
      ? null
      : Math.round(
          product.nutriments["saturated-fat_100g"]! * 10
        ) / 10;

  return (
    <ScrollView contentContainerStyle={styles.resultsContainer}>
      <View style={styles.resultsHeader}>
        <Text style={styles.appTitle}>NutriLens</Text>
        <Text style={styles.resultsSubtitle}>
          Personalised product analysis
        </Text>
      </View>

      <View style={styles.productCard}>
        {product?.image ? (
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.placeholderIcon}>🥫</Text>
          </View>
        )}

        <View style={styles.productDetails}>
          <Text style={styles.productName}>
            {product?.name || "Unknown product"}
          </Text>

          <Text style={styles.productBrand}>
            {product?.brand || "Brand not listed"}
          </Text>

          <Text style={styles.productMeta}>
            Barcode: {barcode}
          </Text>

          <Text style={styles.productSource}>
            Source: {product?.source}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.verdictCard,
          {
            backgroundColor: riskBackground(risk.verdict),
            borderColor: riskColor(risk.verdict),
          },
        ]}
      >
        <Text
          style={[
            styles.verdictTitle,
            { color: riskColor(risk.verdict) },
          ]}
        >
          {risk.verdict}
        </Text>

        <Text
          style={[
            styles.score,
            { color: riskColor(risk.verdict) },
          ]}
        >
          {risk.score}/100
        </Text>

        <Text style={styles.verdictGuidance}>
          {verdictGuidance(risk.verdict)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Nutrition summary
        </Text>

        <Text style={styles.sectionSubtitle}>
          Values per 100 g/ml where available
        </Text>

        {renderNutrientRow(
          "🧂 Sodium",
          sodiumMg,
          "mg",
          120,
          600
        )}

        {renderNutrientRow(
          "🧂 Salt",
          saltG,
          "g",
          0.3,
          1.5
        )}

        {renderNutrientRow(
          "🍬 Sugar",
          sugarsG,
          "g",
          5,
          22.5
        )}

        {renderNutrientRow(
          "🥓 Saturated fat",
          saturatedFatG,
          "g",
          1.5,
          5
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Your health profile
        </Text>

        <View style={styles.conditionWrap}>
          {selectedConditions.length > 0 ? (
            selectedConditions.map((condition) => (
              <View
                key={condition}
                style={styles.conditionChip}
              >
                <Text style={styles.conditionChipText}>
                  {condition}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              No health conditions selected.
            </Text>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Personalised findings
        </Text>

        {risk.findings.length === 0 ? (
          <View style={styles.safeFinding}>
            <Text style={styles.findingIcon}>✓</Text>
            <Text style={styles.findingText}>
              No major concerns were detected using
              the available product data.
            </Text>
          </View>
        ) : (
          risk.findings.map((finding) => (
            <View
              key={finding.id}
              style={[
                styles.findingCard,
                finding.redFlag && styles.redFlagFinding,
              ]}
            >
              <View style={styles.findingHeading}>
                <Text style={styles.findingIcon}>
                  {finding.redFlag ? "🚩" : "⚠️"}
                </Text>

                <View style={styles.findingHeadingText}>
                  <Text style={styles.findingCondition}>
                    {finding.condition}
                  </Text>

                  <Text style={styles.findingTitle}>
                    {finding.title}
                  </Text>
                </View>
              </View>

              {finding.detectedValue && (
                <Text style={styles.detectedValue}>
                  {finding.detectedValue}
                </Text>
              )}

              <Text style={styles.findingExplanation}>
                {finding.explanation}
              </Text>

              {finding.matchedIngredients?.length ? (
                <Text style={styles.matchedText}>
                  Detected:{" "}
                  {finding.matchedIngredients
                    .slice(0, 6)
                    .join(", ")}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Ingredients
        </Text>

        <Text style={styles.ingredientsText}>
          {product?.ingredients ||
            "No ingredient information was supplied by the database."}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Warning summary
        </Text>

        {warnings.map((warning, index) => (
          <View
            key={`${warning}-${index}`}
            style={styles.warningRow}
          >
            <Text style={styles.warningText}>{warning}</Text>
          </View>
        ))}
      </View>

      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerText}>
          NutriLens provides informational guidance
          based on third-party product data. Product
          information may be incomplete or inaccurate.
          Always check the packaging and follow advice
          from your doctor, renal team, allergist or
          dietitian.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={resetScanner}
      >
        <Text style={styles.primaryButtonText}>
          Scan another product
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 24,
  },

  centerText: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 420,
  },

  permissionTitle: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
  },

  primaryButton: {
    width: "100%",
    marginTop: 20,
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },

  cameraContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },

  cameraShade: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 70,
    paddingBottom: 45,
    paddingHorizontal: 24,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  cameraHeader: {
    backgroundColor: "rgba(0,0,0,0.62)",
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderRadius: 22,
    alignItems: "center",
  },

  cameraTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },

  cameraSubtitle: {
    color: "#E2E8F0",
    fontSize: 14,
    marginTop: 6,
  },

  scanFrame: {
    width: "90%",
    maxWidth: 330,
    height: 200,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: "transparent",
  },

  cameraStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.68)",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
  },

  cameraStatusText: {
    color: "#FFFFFF",
    marginLeft: 10,
    fontWeight: "700",
  },

  detectedCard: {
    width: "100%",
    maxWidth: 440,
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.97)",
    padding: 17,
    borderRadius: 22,
  },

  detectedIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DCFCE7",
    color: "#16A34A",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 25,
    fontWeight: "900",
  },

  detectedTextWrap: {
    flex: 1,
    marginLeft: 14,
  },

  detectedTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },

  detectedBarcode: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
    letterSpacing: 1,
  },

  lookupText: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 5,
  },

  resultsContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: 55,
    paddingBottom: 55,
  },

  resultsHeader: {
    marginBottom: 18,
  },

  appTitle: {
    color: COLORS.text,
    fontSize: 35,
    fontWeight: "900",
  },

  resultsSubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 3,
  },

  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 15,
    marginBottom: 14,
  },

  productImage: {
    width: 92,
    height: 92,
    resizeMode: "contain",
    borderRadius: 18,
    backgroundColor: COLORS.background,
  },

  productImagePlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderIcon: {
    fontSize: 38,
  },

  productDetails: {
    flex: 1,
    marginLeft: 14,
  },

  productName: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
  },

  productBrand: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 4,
  },

  productMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 8,
  },

  productSource: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },

  verdictCard: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 22,
    marginBottom: 14,
  },

  verdictTitle: {
    fontSize: 26,
    fontWeight: "900",
  },

  score: {
    fontSize: 43,
    fontWeight: "900",
    marginTop: 4,
  },

  verdictGuidance: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 9,
  },

  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 14,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
    marginBottom: 12,
  },

  nutrientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 9,
  },

  nutrientTextWrap: {
    flex: 1,
  },

  nutrientLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },

  nutrientValue: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 3,
  },

  nutrientBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },

  nutrientBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },

  conditionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },

  conditionChip: {
    backgroundColor: "#E0F2F1",
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
    marginRight: 7,
    marginBottom: 7,
  },

  conditionChipText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 10,
  },

  safeFinding: {
    flexDirection: "row",
    backgroundColor: "#DCFCE7",
    borderRadius: RADIUS.md,
    padding: 13,
    marginTop: 12,
  },

  findingCard: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: RADIUS.md,
    padding: 14,
    marginTop: 12,
  },

  redFlagFinding: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },

  findingHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  findingHeadingText: {
    flex: 1,
    marginLeft: 9,
  },

  findingIcon: {
    fontSize: 19,
  },

  findingCondition: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  findingTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },

  detectedValue: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 10,
  },

  findingExplanation: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },

  findingText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 9,
  },

  matchedText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 9,
  },

  ingredientsText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 11,
  },

  warningRow: {
    backgroundColor: "#FFF7ED",
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 10,
  },

  warningText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
  },

  disclaimerCard: {
    backgroundColor: "#F1F5F9",
    borderRadius: RADIUS.lg,
    padding: 15,
  },

  disclaimerText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  notFoundIcon: {
    fontSize: 46,
    marginBottom: 12,
  },

  barcodeDisplay: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 10,
  },
});
