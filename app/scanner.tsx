import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Button, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchProductByBarcode } from "../src/api/openFoodFacts";
import { evaluateProduct } from "../src/evaluateProduct";
import { calculateRisk } from "../src/riskEngine";
import { COLORS, RADIUS } from "../src/theme";

export default function ScannerScreen() {
  const { conditions } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState("");
const [resultText, setResultText] = useState("Waiting for scan...");
const [productImage, setProductImage] = useState(null);
const [risk, setRisk] = useState({ score: 0, reasons: [] });


  const selectedConditions = String(conditions || "")
    .split(",")
    .filter(Boolean);
console.log("SCANNER CONDITIONS PARAM:", conditions);
console.log("SCANNER SELECTED CONDITIONS:", selectedConditions);
  async function handleScan(result: any) {
  if (scanned) return;

  setScanned(true);
  setBarcode(result.data);
  setResultText("Looking up product...");
setProductImage(null);
setRisk({ score: 0, reasons: [] });

    try {
      const product = await fetchProductByBarcode(result.data);

      if (!product) {
        setResultText("Product not found in Open Food Facts.");
        return;
      }

      const productForRules = {
        product_name: product.name,
        ingredients_text: product.ingredients,
        nutriments: product.nutriments,
      };
console.log("SELECTED CONDITIONS:", selectedConditions);
console.log("PRODUCT FOR RULES:", productForRules);
      const warnings = evaluateProduct(productForRules, selectedConditions);
      setRisk(calculateRisk(productForRules, selectedConditions));

      setProductImage(product.image);
      setResultText(
        `${product.name}\n${product.brand}\n\n${
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
    const testProduct = {
      product_name: "Test Cola",
      ingredients_text: "Water, sugar, phosphoric acid",
      nutriments: {
        sugars_100g: 12,
        sodium_100g: 0.5,
      },
    };
console.log("TEST SELECTED CONDITIONS:", selectedConditions);
    const warnings = evaluateProduct(testProduct, selectedConditions);
    setRisk(calculateRisk(testProduct, selectedConditions));

    setScanned(true);
    setBarcode("TEST-001");
    setProductImage(null);
    setResultText(`${testProduct.product_name}\n\n${warnings.join("\n\n")}`);
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

        <Button title="Load Test Product" onPress={loadTestProduct} />

        <Button
          title="Scan Another"
          onPress={() => {
            setScanned(false);
            setBarcode("");
            setProductImage(null);
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
  marginBottom: 20,
  color: COLORS.primary,
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
    fontSize: 18,
    color: COLORS.text,
    textAlign: "center",
    marginVertical: 12,
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
});