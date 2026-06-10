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

import { fetchProductByBarcode } from "../src/api/openFoodFacts";
import { checkIngredientKnowledge } from "../src/checkIngredientKnowledge";
import CollapsibleSection from "../src/components/CollapsibleSection";
import { evaluateProduct } from "../src/evaluateProduct";
import { calculateRisk } from "../src/riskEngine";
import { saveScanToHistory } from "../src/storage/scanHistory";
import { COLORS, RADIUS } from "../src/theme";

export default function ScannerScreen() {
  const { conditions } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();

  const scanLock = useRef(false);

  const [scanned, setScanned] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [scannerActive, setScannerActive] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const [barcode, setBarcode] = useState("");
  const [ingredientInsights, setIngredientInsights] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [resultText, setResultText] = useState("Waiting for scan...");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [risk, setRisk] = useState({
    score: 0,
    reasons: [] as string[],
  });

  const selectedConditions = String(conditions || "")
    .split(",")
    .map((condition) => condition.trim())
    .filter(Boolean);

  function resetProductState() {
    setBarcode("");
    setProduct(null);
    setProductImage(null);
    setIngredientInsights([]);
    setWarnings([]);
    setResultText("Waiting for scan...");
    setRisk({ score: 0, reasons: [] });
  }

  function startFreshScanner(delay = 250) {
    scanLock.current = true;
    setScannerActive(false);
    setCameraReady(false);

    setTimeout(() => {
      setCameraKey((currentKey) => currentKey + 1);
      setScannerActive(true);
      scanLock.current = false;
    }, delay);
  }

  useFocusEffect(
    useCallback(() => {
      resetProductState();
      setScanned(false);
      setLoadingProduct(false);
      startFreshScanner(250);

      return () => {
        scanLock.current = true;
        setScannerActive(false);
        setCameraReady(false);
      };
    }, [])
  );

  function scanAnotherProduct() {
    resetProductState();
    setScanned(false);
    setLoadingProduct(false);
    startFreshScanner(150);
  }

  function getRiskLabelFromScore(score: number) {
    if (score >= 70) return "HIGH RISK";
    if (score >= 40) return "MODERATE RISK";
    if (score > 0) return "LOW RISK";
    return "LOW CONCERN";
  }

  function getRiskColor() {
    if (risk.score >= 70) return "#DC2626";
    if (risk.score >= 40) return "#F97316";
    if (risk.score > 0) return "#EAB308";
    return "#16A34A";
  }

  function getRiskBackground() {
    if (risk.score >= 70) return "#FEE2E2";
    if (risk.score >= 40) return "#FFEDD5";
    if (risk.score > 0) return "#FEF9C3";
    return "#DCFCE7";
  }

  async function handleScan(result: { data?: string }) {
    if (scanned || scanLock.current || loadingProduct) return;

    const scannedBarcode = String(result?.data || "").trim();
    if (!scannedBarcode) return;

    scanLock.current = true;
    setScanned(true);
    setLoadingProduct(true);
    setBarcode(scannedBarcode);
    setResultText("Looking up product...");
    setProduct(null);
    setProductImage(null);
    setIngredientInsights([]);
    setWarnings([]);
    setRisk({ score: 0, reasons: [] });

    try {
      const foundProduct = await fetchProductByBarcode(scannedBarcode);

      if (!foundProduct) {
        setResultText("Product not found in Open Food Facts.");
        return;
      }

      const productForRules = {
        product_name: foundProduct.name,
        ingredients_text: foundProduct.ingredients,
        nutriments: foundProduct.nutriments,
      };

      const productWarnings = evaluateProduct(productForRules, selectedConditions);
      const calculatedRisk = calculateRisk(productForRules, selectedConditions);
      const insights = checkIngredientKnowledge(productForRules, selectedConditions);

      setProduct(foundProduct);
      setWarnings(productWarnings);
      setRisk(calculatedRisk);
      setIngredientInsights(insights);
      setProductImage(foundProduct.image || null);

      setResultText(
        productWarnings.length > 0
          ? productWarnings.join("\n\n")
          : "No major warnings found for your selected conditions."
      );

      await saveScanToHistory({
        barcode: scannedBarcode,
        productName: foundProduct.name || "Unknown product",
        brand: foundProduct.brand || "",
        imageUrl: foundProduct.image || undefined,
        riskScore: calculatedRisk.score,
        riskLevel: getRiskLabelFromScore(calculatedRisk.score),
        warningCount: productWarnings.length,
        warnings: productWarnings,
        conditions: selectedConditions,
        ingredients: foundProduct.ingredients || "",
        nutriments: foundProduct.nutriments || {},
        riskReasons: calculatedRisk.reasons || [],
      });
    } catch (error) {
      console.error("Product scan failed:", error);
      setResultText(
        "Could not connect to Open Food Facts. Please check your internet connection and try again."
      );
    } finally {
      setLoadingProduct(false);
    }
  }
function getVerdictTitle() {
  if (risk.score >= 70) return "Not Recommended";
  if (risk.score >= 40) return "Use With Caution";
  if (risk.score > 0) return "Low Risk";
  return "Recommended";
}

function getVerdictEmoji() {
  if (risk.score >= 70) return "🔴";
  if (risk.score >= 40) return "🟠";
  if (risk.score > 0) return "🟡";
  return "🟢";
}

function getVerdictText() {
  if (risk.score >= 70) {
    return "This product may contain ingredients or nutrition values that are risky for your health profile.";
  }

  if (risk.score >= 40) {
    return "This product has some concerns. Read the warnings before deciding.";
  }

  if (risk.score > 0) {
    return "This product has minor concerns based on your selected conditions.";
  }

  return "No major concerns were detected for your selected health profile.";
}

function getVerdictBackground() {
  if (risk.score >= 70) return "#FEE2E2";
  if (risk.score >= 40) return "#FFEDD5";
  if (risk.score > 0) return "#FEF9C3";
  return "#DCFCE7";
}
  function loadTestProduct() {
    scanLock.current = true;
    setScannerActive(false);

    const testProductForRules = {
      product_name: "Test Cola",
      ingredients_text: "Water, sugar, phosphoric acid",
      nutriments: {
        sugars_100g: 12,
        sodium_100g: 0.5,
      },
    };

    const displayProduct = {
      name: "Test Cola",
      brand: "Test Brand",
      ingredients: "Water, sugar, phosphoric acid",
      nutriments: {
        sugars_100g: 12,
        sodium_100g: 0.5,
      },
      image: null,
    };

    const productWarnings = evaluateProduct(testProductForRules, selectedConditions);
    const calculatedRisk = calculateRisk(testProductForRules, selectedConditions);
    const insights = checkIngredientKnowledge(testProductForRules, selectedConditions);

    setProduct(displayProduct);
    setWarnings(productWarnings);
    setRisk(calculatedRisk);
    setIngredientInsights(insights);
    setScanned(true);
    setLoadingProduct(false);
    setBarcode("TEST-001");
    setProductImage(null);

    setResultText(
      productWarnings.length > 0
        ? productWarnings.join("\n\n")
        : "No major warnings found for your selected conditions."
    );
  }

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionTitle}>Camera access needed</Text>

        <Text style={styles.permissionText}>
          NutriLens needs camera access to scan food barcodes.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Grant Permission</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={loadTestProduct}>
          <Text style={styles.secondaryButtonText}>Load Test Product</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (scanned) {
    return (
      <ScrollView contentContainerStyle={styles.resultContainer}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>NutriLens</Text>
          <Text style={styles.headerSubtitle}>Personalised food safety scan</Text>
        </View>

        {loadingProduct ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Looking up product...</Text>
          </View>
        ) : (
          <>
            <View style={styles.productCard}>
              {productImage ? (
                <Image source={{ uri: productImage }} style={styles.productImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>🥫</Text>
                </View>
              )}

              <View style={styles.productInfo}>
                <Text style={styles.productName}>
                  {product?.name || "Unknown product"}
                </Text>

                <Text style={styles.productBrand}>
                  {product?.brand || "Brand not listed"}
                </Text>

                <Text style={styles.productBarcode}>Barcode: {barcode}</Text>
              </View>
            </View>
<View
  style={[
    styles.verdictCard,
    {
      backgroundColor: getVerdictBackground(),
      borderColor: getRiskColor(),
    },
  ]}
>
  <Text style={styles.verdictEmoji}>{getVerdictEmoji()}</Text>
  <Text style={[styles.verdictTitle, { color: getRiskColor() }]}>
    {getVerdictTitle()}
  </Text>
  <Text style={styles.verdictText}>{getVerdictText()}</Text>
</View>

            <View
              style={[
                styles.scoreCard,
                { backgroundColor: getRiskBackground(), borderColor: getRiskColor() },
              ]}
            >
              <Text style={styles.scoreTitle}>NutriLens Risk Score</Text>

              <Text style={[styles.scoreNumber, { color: getRiskColor() }]}>
                {risk.score} / 100
              </Text>

              <View style={[styles.riskBadge, { backgroundColor: getRiskColor() }]}>
                <Text style={styles.riskBadgeText}>
                  {getRiskLabelFromScore(risk.score)}
                </Text>
              </View>

              <Text style={styles.scoreHelper}>
                Based on your selected health profile.
              </Text>
            </View>

            <View style={styles.conditionsCard}>
              <Text style={styles.cardSectionTitle}>Selected conditions</Text>

              <View style={styles.chipWrap}>
                {selectedConditions.length > 0 ? (
                  selectedConditions.map((condition) => (
                    <View key={condition} style={styles.conditionChip}>
                      <Text style={styles.conditionChipText}>{condition}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No conditions selected.</Text>
                )}
              </View>
            </View>

            <View style={styles.warningCard}>
              <Text style={styles.cardSectionTitle}>Warnings</Text>

              {warnings.length > 0 ? (
                warnings.map((warning, index) => (
                  <View key={`${warning}-${index}`} style={styles.warningItem}>
                    <Text style={styles.warningIcon}>⚠️</Text>
                    <Text style={styles.warningText}>{warning}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.safeItem}>
                  <Text style={styles.warningIcon}>✅</Text>
                  <Text style={styles.warningText}>
                    No major warnings found for your selected conditions.
                  </Text>
                </View>
              )}
            </View>

            {risk.reasons.length > 0 && (
              <View style={styles.warningCard}>
                <Text style={styles.cardSectionTitle}>Why this score?</Text>

                {risk.reasons.map((reason, index) => (
                  <View key={`${reason}-${index}`} style={styles.reasonItem}>
                    <Text style={styles.reasonBullet}>•</Text>
                    <Text style={styles.reasonText}>{reason}</Text>
                  </View>
                ))}
              </View>
            )}

            <CollapsibleSection title="Ingredients">
              <Text style={styles.sectionText}>
                {product?.ingredients ||
                  "No ingredient information available for this product."}
              </Text>
            </CollapsibleSection>

            <CollapsibleSection title="Nutrition / Contents">
              <Text style={styles.nutritionText}>
                Sodium: {product?.nutriments?.sodium_100g ?? "Not listed"} per 100g
              </Text>
              <Text style={styles.nutritionText}>
                Salt: {product?.nutriments?.salt_100g ?? "Not listed"} per 100g
              </Text>
              <Text style={styles.nutritionText}>
                Sugar: {product?.nutriments?.sugars_100g ?? "Not listed"} per 100g
              </Text>
              <Text style={styles.nutritionText}>
                Carbohydrates:{" "}
                {product?.nutriments?.carbohydrates_100g ?? "Not listed"} per 100g
              </Text>
              <Text style={styles.nutritionText}>
                Protein: {product?.nutriments?.proteins_100g ?? "Not listed"} per 100g
              </Text>
              <Text style={styles.nutritionText}>
                Fat: {product?.nutriments?.fat_100g ?? "Not listed"} per 100g
              </Text>
            </CollapsibleSection>

            <CollapsibleSection title="Ingredient Intelligence">
              {ingredientInsights.length > 0 ? (
                ingredientInsights.map((item, index) => (
                  <View key={`${item.ingredient}-${index}`} style={styles.insightCard}>
                    <Text style={styles.insightTitle}>
                      {item.ingredient} detected
                    </Text>

                    <Text style={styles.insightMeta}>Risk type: {item.riskType}</Text>
                    <Text style={styles.insightMeta}>Severity: {item.severity}</Text>
                    <Text style={styles.sectionText}>{item.message}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.sectionText}>
                  No ingredient intelligence warnings found.
                </Text>
              )}
            </CollapsibleSection>

            <Text style={styles.bottomDisclaimer}>
              ⚠ Results are generated automatically from product information and may be
              incomplete or inaccurate. Always verify the label and consult your doctor,
              dietitian, or medical team before making dietary decisions.
            </Text>

            <TouchableOpacity style={styles.primaryButton} onPress={scanAnotherProduct}>
              <Text style={styles.primaryButtonText}>📷 Scan Another Product</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={loadTestProduct}>
              <Text style={styles.secondaryButtonText}>Load Test Product</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      {scannerActive && (
        <CameraView
          key={cameraKey}
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onCameraReady={() => {
            scanLock.current = false;
            setCameraReady(true);
          }}
          onMountError={(error) => {
            console.error("Camera failed to start:", error);
            setCameraReady(false);
          }}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
          }}
          onBarcodeScanned={handleScan}
        />
      )}

      <View style={styles.cameraOverlay}>
        <View style={styles.cameraTopCard}>
          <Text style={styles.cameraTitle}>Scan barcode</Text>
          <Text style={styles.cameraSubtitle}>
            Hold the product barcode inside the frame.
          </Text>
        </View>

        <View style={styles.scanFrame}>
          <View style={styles.scanCornerTopLeft} />
          <View style={styles.scanCornerTopRight} />
          <View style={styles.scanCornerBottomLeft} />
          <View style={styles.scanCornerBottomRight} />
        </View>
      </View>

      {(!scannerActive || !cameraReady) && (
        <View style={styles.cameraLoadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.cameraLoadingText}>Starting camera...</Text>
        </View>
      )}

      <View style={styles.testButton}>
        <TouchableOpacity style={styles.cameraTestButton} onPress={loadTestProduct}>
          <Text style={styles.cameraTestButtonText}>Load Test Product</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.background,
  },

  resultContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 60,
  },

  header: {
    marginBottom: 20,
  },

  appTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.text,
  },

  headerSubtitle: {
    fontSize: 15,
    color: COLORS.muted,
    marginTop: 4,
  },

  permissionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 10,
  },

  permissionText: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },

  loadingCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loadingText: {
    marginTop: 14,
    color: COLORS.muted,
    fontSize: 15,
  },

  productCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  productImage: {
    width: 92,
    height: 92,
    borderRadius: 18,
    resizeMode: "contain",
    backgroundColor: COLORS.background,
  },

  imagePlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  imagePlaceholderText: {
    fontSize: 36,
  },

  productInfo: {
    flex: 1,
    marginLeft: 14,
  },

  productName: {
    fontSize: 19,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 4,
  },

  productBrand: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 8,
  },

  productBarcode: {
    fontSize: 12,
    color: COLORS.muted,
  },

  scoreCard: {
    borderRadius: RADIUS.lg,
    padding: 22,
    marginBottom: 14,
    alignItems: "center",
    borderWidth: 1,
  },

  scoreTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  scoreNumber: {
    fontSize: 42,
    fontWeight: "900",
    marginTop: 8,
  },

  riskBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    marginTop: 8,
  },

  riskBadgeText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
  },

  scoreHelper: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },

  conditionsCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },

  cardSectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 12,
  },

  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  conditionChip: {
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  conditionChipText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },

  warningCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },

  warningItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF7ED",
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 10,
  },

  safeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#DCFCE7",
    borderRadius: RADIUS.md,
    padding: 12,
  },

  warningIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
    fontWeight: "600",
  },

  reasonItem: {
    flexDirection: "row",
    marginBottom: 8,
  },

  reasonBullet: {
    fontSize: 20,
    color: COLORS.primary,
    marginRight: 8,
    lineHeight: 22,
  },

  reasonText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
  },

  sectionText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },

  nutritionText: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 8,
  },

  insightCard: {
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: RADIUS.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  insightTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 6,
  },

  insightMeta: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 4,
  },

  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
  },

  bottomDisclaimer: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
    marginVertical: 20,
    lineHeight: 18,
  },

  primaryButton: {
    backgroundColor: COLORS.text,
    padding: 17,
    borderRadius: RADIUS.lg,
    marginTop: 10,
    width: "100%",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "900",
  },

  secondaryButton: {
    backgroundColor: COLORS.card,
    padding: 17,
    borderRadius: RADIUS.lg,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: "100%",
  },

  secondaryButtonText: {
    color: COLORS.text,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
  },

  cameraContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },

  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    paddingTop: 70,
  },

  cameraTopCard: {
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
  },

  cameraTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
  },

  cameraSubtitle: {
    color: "#E5E7EB",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },

  scanFrame: {
    width: 292,
    height: 190,
    marginTop: 120,
    position: "relative",
  },

  scanCornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 52,
    height: 52,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#FFFFFF",
    borderTopLeftRadius: 20,
  },

  scanCornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 52,
    height: 52,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#FFFFFF",
    borderTopRightRadius: 20,
  },

  scanCornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 52,
    height: 52,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#FFFFFF",
    borderBottomLeftRadius: 20,
  },

  scanCornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 52,
    height: 52,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#FFFFFF",
    borderBottomRightRadius: 20,
  },

  cameraLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraLoadingText: {
    color: "#FFFFFF",
    fontSize: 15,
    marginTop: 12,
  },

  testButton: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 42,
  },

  cameraTestButton: {
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 16,
    borderRadius: RADIUS.lg,
  },

  cameraTestButtonText: {
    color: COLORS.text,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "900",
  },
  verdictCard: {
  borderRadius: RADIUS.lg,
  padding: 20,
  borderWidth: 1,
  marginBottom: 14,
  alignItems: "center",
},

verdictEmoji: {
  fontSize: 34,
  marginBottom: 8,
},

verdictTitle: {
  fontSize: 26,
  fontWeight: "900",
  marginBottom: 8,
},

verdictText: {
  fontSize: 14,
  color: COLORS.text,
  textAlign: "center",
  lineHeight: 21,
},
});