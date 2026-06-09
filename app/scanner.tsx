import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Button, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchProductByBarcode } from "../src/api/openFoodFacts";
import { checkIngredientKnowledge } from "../src/checkIngredientKnowledge";
import CollapsibleSection from "../src/components/CollapsibleSection";
import { evaluateProduct } from "../src/evaluateProduct";
import { calculateRisk } from "../src/riskEngine";
import { COLORS, RADIUS } from "../src/theme";

export default function ScannerScreen() {
  const { conditions } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [ingredientInsights, setIngredientInsights] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(null);
  const [resultText, setResultText] = useState("Waiting for scan...");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [risk, setRisk] = useState({ score: 0, reasons: [] as string[] });

  const selectedConditions = String(conditions || "")
    .split(",")
    .filter(Boolean);

  async function handleScan(result: any) {
    if (scanned) return;

    setScanned(true);
    setBarcode(result.data);
    setResultText("Looking up product...");
    setProduct(null);
    setProductImage(null);
    setRisk({ score: 0, reasons: [] });

    try {
      const foundProduct = await fetchProductByBarcode(result.data);

      if (!foundProduct) {
        setResultText("Product not found in Open Food Facts.");
        return;
      }

      setProduct(foundProduct);

      const productForRules = {
        product_name: foundProduct.name,
        ingredients_text: foundProduct.ingredients,
        nutriments: foundProduct.nutriments,
      };
      

      const warnings = evaluateProduct(productForRules, selectedConditions);
      const calculatedRisk = calculateRisk(productForRules, selectedConditions);
      const insights = checkIngredientKnowledge(productForRules, selectedConditions);
setIngredientInsights(insights);

      setRisk(calculatedRisk);
      setProductImage(foundProduct.image);

      setResultText(
        `${foundProduct.name}\n${foundProduct.brand || ""}\n\n${
          warnings.length > 0
            ? warnings.join("\n\n")
            : "No major warnings found for your selected conditions."
        }`
      );
    } catch (error) {
      console.error(error);
      setResultText(
        "Could not connect to Open Food Facts. Please check your internet connection and try again."
      );
    }
  }

  function loadTestProduct() {
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

    const warnings = evaluateProduct(testProductForRules, selectedConditions);
    const calculatedRisk = calculateRisk(testProductForRules, selectedConditions);
    const insights = checkIngredientKnowledge(testProductForRules, selectedConditions);
setIngredientInsights(insights);

    setProduct(displayProduct);
    setRisk(calculatedRisk);
    setScanned(true);
    setBarcode("TEST-001");
    setProductImage(null);
    setResultText(
      `${testProductForRules.product_name}\n\n${
        warnings.length > 0
          ? warnings.join("\n\n")
          : "No major warnings found for your selected conditions."
      }`
    );
  }

  const getScoreCardStyle = () => {
    if (risk.score >= 70) return styles.scoreCardHigh;
    if (risk.score >= 40) return styles.scoreCardModerate;
    if (risk.score > 0) return styles.scoreCardLow;
    return styles.scoreCardSafe;
  };

  if (!permission) return <Text>Loading camera...</Text>;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>Camera permission required</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
        <Button title="Load Test Product" onPress={loadTestProduct} />
      </View>
    );
  }

  if (scanned) {
    return (
      <ScrollView contentContainerStyle={styles.resultContainer}>
        <Text style={styles.title}>NutriLens</Text>

        <Text style={styles.disclaimer}>
          Informational tool only. NutriLens does not replace professional
          medical advice.
        </Text>

        {productImage && (
          <Image source={{ uri: productImage }} style={styles.productImage} />
        )}

        <View style={[styles.scoreCard, getScoreCardStyle()]}>
          <Text style={styles.scoreTitle}>NutriLens Score</Text>
          <Text style={styles.scoreNumber}>{risk.score} / 100</Text>
          <Text style={styles.scoreLabel}>
            {risk.score >= 70
              ? "HIGH RISK"
              : risk.score >= 40
              ? "MODERATE RISK"
              : risk.score > 0
              ? "LOW RISK"
              : "LOW CONCERN"}
          </Text>
        </View>

        {risk.reasons.map((reason, index) => (
          <Text key={index} style={styles.riskReason}>
            ⚠️ {reason}
          </Text>
        ))}

        <Text style={styles.label}>Selected Conditions:</Text>
        <Text style={styles.result}>{String(conditions || "None")}</Text>

        <Text style={styles.label}>Barcode:</Text>
        <Text style={styles.barcode}>{barcode}</Text>

        <Text style={styles.label}>Result:</Text>
        <Text style={styles.result}>{resultText}</Text>

        <CollapsibleSection title="Ingredients">
          <Text style={styles.result}>
            {product?.ingredients ||
              "No ingredient information available for this product."}
          </Text>
        </CollapsibleSection>

        <CollapsibleSection title="Nutrition / Contents">
          <Text style={styles.nutritionText}>
            Sodium: {product?.nutriments?.sodium_100g ?? "Not listed"} per 100g
          </Text>
          <Text style={styles.nutritionText}>
            Sugar: {product?.nutriments?.sugars_100g ?? "Not listed"} per 100g
          </Text>
          <Text style={styles.nutritionText}>
            Carbohydrates:{" "}
            {product?.nutriments?.carbohydrates_100g ?? "Not listed"} per 100g
          </Text>
          <Text style={styles.nutritionText}>
            Protein: {product?.nutriments?.proteins_100g ?? "Not listed"} per
            100g
          </Text>
          <Text style={styles.nutritionText}>
            Fat: {product?.nutriments?.fat_100g ?? "Not listed"} per 100g
          </Text>
        </CollapsibleSection>

        <CollapsibleSection title="Ingredient Intelligence">
  {ingredientInsights.length > 0 ? (
    ingredientInsights.map((item, index) => (
      <View key={index} style={styles.insightCard}>
        <Text style={styles.insightTitle}>
          {item.ingredient} detected
        </Text>
        <Text style={styles.nutritionText}>
          Risk type: {item.riskType}
        </Text>
        <Text style={styles.nutritionText}>
          Severity: {item.severity}
        </Text>
        <Text style={styles.nutritionText}>
          {item.message}
        </Text>
      </View>
    ))
  ) : (
    <Text style={styles.result}>
      No ingredient intelligence warnings found.
    </Text>
  )}
</CollapsibleSection>

        <CollapsibleSection title="Why this product may be harmful">
          <Text style={styles.result}>
            {risk.reasons.length > 0
              ? `This product may be concerning because: ${risk.reasons.join(
                  ", "
                )}. These ingredients or nutrition values may affect your selected health conditions.`
              : "NutriLens did not find major concerns based on the available product data and your selected conditions."}
          </Text>
        </CollapsibleSection>

        <Text style={styles.bottomDisclaimer}>
          ⚠ Results are generated automatically from product information and may
          be incomplete or inaccurate. Always verify the label and consult your
          doctor, dietitian, or medical team before making dietary decisions.
        </Text>

        <Button title="Load Test Product" onPress={loadTestProduct} />

        <Button
          title="Scan Another"
          onPress={() => {
            setScanned(false);
            setBarcode("");
            setProduct(null);
            setProductImage(null);
            setIngredientInsights([]);
            setResultText("Waiting for scan...");
            setRisk({ score: 0, reasons: [] });
          }}
        />
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
        }}
        onBarcodeScanned={handleScan}
      />

      <View style={styles.testButton}>
        <Button title="Load Test Product" onPress={loadTestProduct} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.background,
  },
  resultContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    padding: 24,
    paddingBottom: 60,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 8,
    color: COLORS.primary,
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 20,
    maxWidth: 320,
  },
  bottomDisclaimer: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
    marginVertical: 20,
    maxWidth: 340,
  },
  productImage: {
    width: 180,
    height: 180,
    borderRadius: 20,
    resizeMode: "contain",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
    color: COLORS.text,
  },
  barcode: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
    color: COLORS.text,
  },
  result: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: "center",
    marginVertical: 12,
  },
  nutritionText: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 6,
  },
  testButton: {
    position: "absolute",
    top: 60,
    left: 30,
    right: 30,
  },
  scoreCard: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: RADIUS.lg,
    marginVertical: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  scoreCardSafe: {
    backgroundColor: "#DCFCE7",
  },
  scoreCardLow: {
    backgroundColor: "#FEF9C3",
  },
  scoreCardModerate: {
    backgroundColor: "#FFEDD5",
  },
  scoreCardHigh: {
    backgroundColor: "#FEE2E2",
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 8,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
  },
  riskReason: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 4,
  },
  insightCard: {
  backgroundColor: COLORS.background,
  padding: 12,
  borderRadius: RADIUS.md,
  marginBottom: 10,
},
insightTitle: {
  fontSize: 15,
  fontWeight: "bold",
  color: COLORS.text,
  marginBottom: 4,
},
});