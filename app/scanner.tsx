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
import { buildWarningStrings } from "../src/evaluateProduct";
import { calculateRisk } from "../src/riskEngine";
import { saveScanToHistory } from "../src/storage/scanHistory";
import {
  COLORS,
  RADIUS,
  verdictBackground,
  verdictColor,
} from "../src/theme";
import { NormalizedProduct, RiskResult, RiskVerdict } from "../src/types/product";

// ─── Constants ───────────────────────────────────────────────────────────────

const BARCODE_CONFIRMATION_MS = 1200;

const EMPTY_RISK: RiskResult = {
  score: 0,
  verdict: "Recommended",
  findings: [],
  reasons: [],
  redFlags: [],
};

// ─── Types ───────────────────────────────────────────────────────────────────

type ScannerPhase =
  | "camera"
  | "barcode-detected"
  | "looking-up"
  | "results"
  | "not-found"
  | "error";

// ─── Utilities ───────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function verdictGuidance(verdict: RiskVerdict): string {
  switch (verdict) {
    case "Not Recommended":
      return "One or more significant concerns were detected for your selected health profile. Review the product label and seek personalised medical or dietetic advice.";
    case "Use With Caution":
      return "This product contains nutritional characteristics that may require moderation. Consider portion size, frequency and your individual dietary limits.";
    case "Low Risk":
      return "Only minor concerns were detected based on the available product information.";
    default:
      return "No major concerns were detected for your selected health profile using the available data.";
  }
}

type NutrientLevel = "High" | "Moderate" | "Low" | "Unknown";

function nutrientLevel(value: number | null, moderate: number, high: number): NutrientLevel {
  if (value == null) return "Unknown";
  if (value >= high) return "High";
  if (value >= moderate) return "Moderate";
  return "Low";
}

function nutrientBadgeColors(level: NutrientLevel): { bg: string; fg: string } {
  switch (level) {
    case "High":     return { bg: COLORS.highSubtle,     fg: COLORS.high };
    case "Moderate": return { bg: COLORS.moderateSubtle, fg: COLORS.moderate };
    case "Low":      return { bg: COLORS.safeSubtle,     fg: COLORS.safe };
    default:         return { bg: "#F1F5F9",              fg: COLORS.muted };
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function NutrientRow({
  label,
  value,
  unit,
  moderate,
  high,
}: {
  label: string;
  value: number | null;
  unit: string;
  moderate: number;
  high: number;
}) {
  const level = nutrientLevel(value, moderate, high);
  const { bg, fg } = nutrientBadgeColors(level);

  return (
    <View style={styles.nutrientRow}>
      <View style={styles.nutrientTextWrap}>
        <Text style={styles.nutrientLabel}>{label}</Text>
        <Text style={styles.nutrientValue}>
          {value == null ? "Not available" : `${value} ${unit}`}
        </Text>
      </View>
      <View style={[styles.nutrientBadge, { backgroundColor: bg }]}>
        <Text style={[styles.nutrientBadgeText, { color: fg }]}>{level}</Text>
      </View>
    </View>
  );
}

/** Corner-bracket scan frame — more polished than a plain border box */
function ScanFrame() {
  const SIZE = 260;
  const ARM = 36;
  const THICKNESS = 4;
  const COLOR = "#FFFFFF";

  const corner = (position: {
    top?: number; bottom?: number; left?: number; right?: number;
    borderTopWidth?: number; borderBottomWidth?: number;
    borderLeftWidth?: number; borderRightWidth?: number;
    borderTopLeftRadius?: number; borderTopRightRadius?: number;
    borderBottomLeftRadius?: number; borderBottomRightRadius?: number;
  }) => ({
    position: "absolute" as const,
    width: ARM,
    height: ARM,
    borderColor: COLOR,
    borderWidth: 0,
    ...position,
  });

  return (
    <View style={{ width: SIZE, height: SIZE / 2, position: "relative" }}>
      {/* top-left */}
      <View style={corner({ top: 0, left: 0, borderTopWidth: THICKNESS, borderLeftWidth: THICKNESS, borderTopLeftRadius: 8 })} />
      {/* top-right */}
      <View style={corner({ top: 0, right: 0, borderTopWidth: THICKNESS, borderRightWidth: THICKNESS, borderTopRightRadius: 8 })} />
      {/* bottom-left */}
      <View style={corner({ bottom: 0, left: 0, borderBottomWidth: THICKNESS, borderLeftWidth: THICKNESS, borderBottomLeftRadius: 8 })} />
      {/* bottom-right */}
      <View style={corner({ bottom: 0, right: 0, borderBottomWidth: THICKNESS, borderRightWidth: THICKNESS, borderBottomRightRadius: 8 })} />
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

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
    .map((c) => c.trim())
    .filter(Boolean);

  useFocusEffect(
    useCallback(() => {
      resetScanner();
      return () => { scanLock.current = true; };
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
    setCameraKey((k) => k + 1);
  }

  function handleLookupStage(stage: LookupStage) {
    if (stage === "open-food-facts") {
      setLookupText("Checking Open Food Facts…");
    } else if (stage === "usda") {
      setLookupText("Checking USDA FoodData Central…");
    } else {
      setLookupText("Finishing product analysis…");
    }
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
    setLookupText("Preparing product lookup…");

    try {
      const lookup = await lookupProduct(detectedBarcode, handleLookupStage);
      setAttemptedSources(lookup.attemptedSources);

      if (!lookup.product) {
        setPhase("not-found");
        return;
      }

      const p = lookup.product;
      const productForRules = {
        product_name: p.name,
        ingredients_text: p.ingredients,
        nutriments: p.nutriments,
      };

      const calculatedRisk = calculateRisk(productForRules, selectedConditions);
      const productWarnings = buildWarningStrings(calculatedRisk.findings);

      setProduct(p);
      setRisk(calculatedRisk);
      setWarnings(productWarnings);
      setPhase("results");

      try {
        await saveScanToHistory({
          barcode: p.barcode,
          productName: p.name || "Unknown product",
          brand: p.brand || "",
          imageUrl: p.image || undefined,
          riskScore: calculatedRisk.score,
          riskLevel: calculatedRisk.verdict,
          warningCount: calculatedRisk.findings.length,
          warnings: productWarnings,
          conditions: selectedConditions,
          ingredients: p.ingredients || "",
          nutriments: p.nutriments || {},
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

  // ── Permission gates ────────────────────────────────────────────────────

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.centerText}>Loading camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.stateTitle}>Camera permission needed</Text>
        <Text style={styles.centerText}>
          NutriLens uses your camera to scan food barcodes.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Grant camera permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Camera view ─────────────────────────────────────────────────────────

  if (phase === "camera" || phase === "barcode-detected" || phase === "looking-up") {
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
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
          }}
          onBarcodeScanned={phase === "camera" ? handleBarcodeScanned : undefined}
        />

        <View style={styles.cameraShade}>
          <View style={styles.cameraHeader}>
            <Text style={styles.cameraTitle}>Scan a food barcode</Text>
            <Text style={styles.cameraSubtitle}>
              Align the barcode within the frame
            </Text>
          </View>

          <ScanFrame />

          {!cameraReady && (
            <View style={styles.cameraStatusCard}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.cameraStatusText}>Starting camera…</Text>
            </View>
          )}

          {phase === "barcode-detected" && (
            <View style={styles.detectedCard}>
              <View style={styles.detectedIconWrap}>
                <Text style={styles.detectedIconText}>✓</Text>
              </View>
              <View style={styles.detectedTextWrap}>
                <Text style={styles.detectedTitle}>Barcode detected</Text>
                <Text style={styles.detectedBarcode}>{barcode}</Text>
              </View>
            </View>
          )}

          {phase === "looking-up" && (
            <View style={styles.detectedCard}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <View style={styles.detectedTextWrap}>
                <Text style={styles.detectedTitle}>{barcode}</Text>
                <Text style={styles.lookupText}>{lookupText}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────

  if (phase === "not-found") {
    return (
      <ScrollView contentContainerStyle={styles.center}>
        <Text style={styles.stateEmoji}>🔎</Text>
        <Text style={styles.stateTitle}>Product not found</Text>
        <Text style={styles.barcodeDisplay}>Barcode: {barcode}</Text>
        <Text style={styles.centerText}>
          NutriLens checked{" "}
          {attemptedSources.join(" and ") || "the available databases"}, but
          could not find usable product information. This does not mean the
          product is safe or unsafe.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={resetScanner}>
          <Text style={styles.primaryButtonText}>Scan again</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────

  if (phase === "error") {
    return (
      <View style={styles.center}>
        <Text style={styles.stateEmoji}>⚠️</Text>
        <Text style={styles.stateTitle}>Something went wrong</Text>
        <Text style={styles.centerText}>
          NutriLens could not complete the lookup. Check your internet
          connection and try again.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={resetScanner}>
          <Text style={styles.primaryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────

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
      : Math.round(product.nutriments["saturated-fat_100g"]! * 10) / 10;

  const vColor = verdictColor(risk.verdict);
  const vBg = verdictBackground(risk.verdict);

  return (
    <ScrollView contentContainerStyle={styles.resultsContainer}>
      {/* ── Header ──────────────────────────────────────── */}
      <View style={styles.resultsHeader}>
        <Text style={styles.appTitle}>NutriLens</Text>
        <Text style={styles.resultsSubtitle}>Personalised product analysis</Text>
      </View>

      {/* ── Product card ────────────────────────────────── */}
      <View style={styles.productCard}>
        {product?.image ? (
          <Image source={{ uri: product.image }} style={styles.productImage} />
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
          <Text style={styles.productMeta}>Barcode: {barcode}</Text>
          <Text style={styles.productSource}>Source: {product?.source}</Text>
        </View>
      </View>

      {/* ── Verdict card ────────────────────────────────── */}
      <View
        style={[
          styles.verdictCard,
          { backgroundColor: vBg, borderColor: vColor },
        ]}
      >
        <Text style={[styles.verdictTitle, { color: vColor }]}>
          {risk.verdict}
        </Text>
        <Text style={[styles.score, { color: vColor }]}>
          {risk.score}/100
        </Text>
        <Text style={styles.verdictGuidance}>
          {verdictGuidance(risk.verdict)}
        </Text>
      </View>

      {/* ── Nutrition summary ───────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nutrition summary</Text>
        <Text style={styles.sectionSubtitle}>Values per 100 g/ml where available</Text>

        <NutrientRow label="🧂 Sodium" value={sodiumMg} unit="mg" moderate={120} high={600} />
        <NutrientRow label="🧂 Salt" value={saltG} unit="g" moderate={0.3} high={1.5} />
        <NutrientRow label="🍬 Sugar" value={sugarsG} unit="g" moderate={5} high={22.5} />
        <NutrientRow label="🥓 Saturated fat" value={saturatedFatG} unit="g" moderate={1.5} high={5} />
      </View>

      {/* ── Health profile ──────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your health profile</Text>
        <View style={styles.conditionWrap}>
          {selectedConditions.length > 0 ? (
            selectedConditions.map((condition) => (
              <View key={condition} style={styles.conditionChip}>
                <Text style={styles.conditionChipText}>{condition}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No health conditions selected.</Text>
          )}
        </View>
      </View>

      {/* ── Personalised findings ───────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Personalised findings</Text>

        {risk.findings.length === 0 ? (
          <View style={styles.safeFinding}>
            <Text style={styles.findingIcon}>✓</Text>
            <Text style={styles.findingText}>
              No major concerns were detected using the available product data.
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
                  <Text style={styles.findingCondition}>{finding.condition}</Text>
                  <Text style={styles.findingTitle}>{finding.title}</Text>
                </View>
              </View>

              {finding.detectedValue && (
                <Text style={styles.detectedValue}>{finding.detectedValue}</Text>
              )}

              <Text style={styles.findingExplanation}>{finding.explanation}</Text>

              {finding.matchedIngredients && finding.matchedIngredients.length > 0 && (
                <Text style={styles.matchedText}>
                  Detected: {finding.matchedIngredients.slice(0, 6).join(", ")}
                </Text>
              )}
            </View>
          ))
        )}
      </View>

      {/* ── Ingredients ─────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        <Text style={styles.ingredientsText}>
          {product?.ingredients ||
            "No ingredient information was supplied by the database."}
        </Text>
      </View>

      {/* ── Warning summary ─────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Warning summary</Text>
        {warnings.map((warning, index) => (
          <View key={`${warning}-${index}`} style={styles.warningRow}>
            <Text style={styles.warningText}>{warning}</Text>
          </View>
        ))}
      </View>

      {/* ── Disclaimer ──────────────────────────────────── */}
      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerText}>
          NutriLens provides informational guidance based on third-party product
          data. Product information may be incomplete or inaccurate. Always check
          the packaging and follow advice from your doctor, renal team, allergist
          or dietitian.
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={resetScanner}>
        <Text style={styles.primaryButtonText}>Scan another product</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Generic states ────────────────────────────────────
  center: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 24,
    gap: 8,
  },
  centerText: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    maxWidth: 420,
  },
  stateTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  stateEmoji: {
    fontSize: 46,
    marginBottom: 4,
  },
  barcodeDisplay: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "900",
  },

  // ── Primary button ────────────────────────────────────
  primaryButton: {
    width: "100%",
    marginTop: 16,
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

  // ── Camera ────────────────────────────────────────────
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraShade: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 70,
    paddingBottom: 45,
    paddingHorizontal: 24,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  cameraHeader: {
    backgroundColor: COLORS.overlayDark,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 22,
    alignItems: "center",
  },
  cameraTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  cameraSubtitle: {
    color: "#E2E8F0",
    fontSize: 13,
    marginTop: 5,
  },
  cameraStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.68)",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
  },
  cameraStatusText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // ── Detected / lookup card ────────────────────────────
  detectedCard: {
    width: "100%",
    maxWidth: 440,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.overlayLight,
    padding: 16,
    borderRadius: 22,
    minHeight: 80,
  },
  detectedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.safeSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  detectedIconText: {
    color: COLORS.safe,
    fontSize: 22,
    fontWeight: "900",
  },
  detectedTextWrap: {
    flex: 1,
  },
  detectedTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
  detectedBarcode: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 3,
    letterSpacing: 1,
  },
  lookupText: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 4,
  },

  // ── Results ───────────────────────────────────────────
  resultsContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: 55,
    paddingBottom: 55,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  appTitle: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "900",
  },
  resultsSubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 2,
  },

  // ── Product card ──────────────────────────────────────
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 12,
    gap: 14,
  },
  productImage: {
    width: 88,
    height: 88,
    resizeMode: "contain",
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  productImagePlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    fontSize: 36,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
  productBrand: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 4,
  },
  productMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
  },
  productSource: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },

  // ── Verdict ───────────────────────────────────────────
  verdictCard: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 22,
    marginBottom: 12,
  },
  verdictTitle: {
    fontSize: 24,
    fontWeight: "900",
  },
  score: {
    fontSize: 42,
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

  // ── Generic card ──────────────────────────────────────
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
  },

  // ── Nutrient row ──────────────────────────────────────
  nutrientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 8,
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
    marginTop: 2,
  },
  nutrientBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  nutrientBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },

  // ── Conditions ────────────────────────────────────────
  conditionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
  },
  conditionChip: {
    backgroundColor: "#E0F2F1",
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: RADIUS.full,
  },
  conditionChipText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 8,
  },

  // ── Findings ──────────────────────────────────────────
  safeFinding: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.safeSubtle,
    borderRadius: RADIUS.md,
    padding: 13,
    marginTop: 10,
  },
  findingCard: {
    backgroundColor: COLORS.moderateSubtle,
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: RADIUS.md,
    padding: 14,
    marginTop: 10,
  },
  redFlagFinding: {
    backgroundColor: COLORS.highSubtle,
    borderColor: "#FCA5A5",
  },
  findingHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  findingHeadingText: {
    flex: 1,
  },
  findingIcon: {
    fontSize: 18,
  },
  findingCondition: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  findingTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },
  detectedValue: {
    color: COLORS.high,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 8,
  },
  findingExplanation: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  findingText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  matchedText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },

  // ── Ingredients ───────────────────────────────────────
  ingredientsText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },

  // ── Warning summary ───────────────────────────────────
  warningRow: {
    backgroundColor: COLORS.moderateSubtle,
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 8,
  },
  warningText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
  },

  // ── Disclaimer ────────────────────────────────────────
  disclaimerCard: {
    backgroundColor: "#F1F5F9",
    borderRadius: RADIUS.lg,
    padding: 15,
    marginBottom: 4,
  },
  disclaimerText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
