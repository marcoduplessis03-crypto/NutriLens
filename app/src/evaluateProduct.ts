export function evaluateProduct(
  product: any,
  selectedConditions: string[] = []
) {
  const warnings: string[] = [];

  const ingredients = (product.ingredients_text || "").toLowerCase();
  const nutriments = product.nutriments || {};

  const sodium = nutriments.sodium_100g
    ? nutriments.sodium_100g * 1000
    : 0;

  const sugar = nutriments.sugars_100g || 0;

  const saturatedFat = nutriments["saturated-fat_100g"] || 0;

  // Kidney Disease
  if (selectedConditions.includes("Kidney Disease")) {
    if (sodium > 400) {
      warnings.push("🔴 Kidney Disease: High sodium");
    }

    if (
      ingredients.includes("phosphate") ||
      ingredients.includes("phosphoric")
    ) {
      warnings.push(
        "🔴 Kidney Disease: Contains phosphate additives"
      );
    }
  }

  // Diabetes
  if (selectedConditions.includes("Diabetes")) {
    if (sugar > 10) {
      warnings.push("🔴 Diabetes: High sugar");
    }
  }

  // Heart Disease
  if (selectedConditions.includes("Heart Disease")) {
    if (sodium > 400) {
      warnings.push("🟡 Heart Disease: High sodium");
    }

    if (saturatedFat > 5) {
      warnings.push(
        "🔴 Heart Disease: High saturated fat"
      );
    }
  }

  // Hypertension
  if (selectedConditions.includes("Hypertension")) {
    if (sodium > 400) {
      warnings.push(
        "🔴 Hypertension: High sodium"
      );
    }
  }

  // Gout
  if (selectedConditions.includes("Gout")) {
    if (
      ingredients.includes("yeast extract") ||
      ingredients.includes("anchovy") ||
      ingredients.includes("sardine")
    ) {
      warnings.push(
        "🔴 Gout: High purine ingredients"
      );
    }
  }

  // Gluten Allergy
  if (selectedConditions.includes("Gluten Allergy")) {
    if (
      ingredients.includes("wheat") ||
      ingredients.includes("gluten") ||
      ingredients.includes("barley") ||
      ingredients.includes("rye")
    ) {
      warnings.push(
        "🔴 Gluten Allergy: Gluten detected"
      );
    }
  }

  // Dairy Allergy
  if (selectedConditions.includes("Dairy Allergy")) {
    if (
      ingredients.includes("milk") ||
      ingredients.includes("whey") ||
      ingredients.includes("casein")
    ) {
      warnings.push(
        "🔴 Dairy Allergy: Dairy detected"
      );
    }
  }

  // Nut Allergy
  if (selectedConditions.includes("Nut Allergy")) {
    if (
      ingredients.includes("peanut") ||
      ingredients.includes("almond") ||
      ingredients.includes("cashew") ||
      ingredients.includes("hazelnut")
    ) {
      warnings.push(
        "🔴 Nut Allergy: Nut ingredient detected"
      );
    }
  }

  if (warnings.length === 0) {
    warnings.push(
      "🟢 No major concerns found for selected conditions."
    );
  }

  return warnings;
}