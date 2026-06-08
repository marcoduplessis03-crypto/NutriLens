import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { evaluateProduct } from "./src/evaluateProduct";

export default function ScannerScreen() {
  const { conditions } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [resultText, setResultText] = useState("Waiting for scan...");

  const selectedConditions = String(conditions || "")
    .split(",")
    .filter(Boolean);

  function handleScan(result: any) {
    setScanned(true);
    setBarcode(result.data);
    setResultText("Barcode scanned successfully.");
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

    const warnings = evaluateProduct(testProduct, selectedConditions);

    setScanned(true);
    setBarcode("TEST-001");
    setResultText(
      `${testProduct.product_name}\n\n${warnings.join("\n\n")}`
    );
  }

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
      <View style={styles.resultContainer}>
        <Text style={styles.title}>NutriLens</Text>

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
            setResultText("Waiting for scan...");
          }}
        />
      </View>
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
    backgroundColor: "white",
  },
  resultContainer: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
    color: "black",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
    color: "black",
  },
  barcode: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
    color: "black",
  },
  result: {
    fontSize: 18,
    color: "black",
    textAlign: "center",
    marginVertical: 20,
  },
  testButton: {
    position: "absolute",
    top: 60,
    left: 30,
    right: 30,
  },
});