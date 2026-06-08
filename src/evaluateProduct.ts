export function evaluateProduct(
  product: any,
  selectedConditions: string[] = []
) {
  const warnings: string[] = [];

  const productName = (product.product_name || "").toLowerCase();
const ingredients = (product.ingredients_text || "").toLowerCase();
const searchableText = `${productName} ${ingredients}`;
  const nutriments = product.nutriments || {};
  const conditions = selectedConditions.map((c) => c.toLowerCase());

  const sodium =
    nutriments.sodium_100g !== undefined
      ? nutriments.sodium_100g * 1000
      : nutriments.salt_100g !== undefined
      ? nutriments.salt_100g * 400
      : 0;

  const sugar = nutriments.sugars_100g || 0;
  const saturatedFat = nutriments["saturated-fat_100g"] || 0;

  const containsSalt =
  searchableText.includes("salt") ||
  searchableText.includes("sodium chloride") ||
  searchableText.includes("sea salt");

  if (conditions.includes("kidney") || conditions.includes("kidney disease")) {
    if (sodium > 400 || containsSalt) {
      warnings.push("🔴 Kidney Disease: High sodium / salt detected");
    }

    if (ingredients.includes("phosphate") || ingredients.includes("phosphoric")) {
      warnings.push("🔴 Kidney Disease: Contains phosphate additives");
    }
  }

  if (conditions.includes("diabetes")) {
    if (sugar > 10) {
      warnings.push("🔴 Diabetes: High sugar");
    }
  }

  if (conditions.includes("heart") || conditions.includes("heart disease")) {
    if (sodium > 400 || containsSalt) {
      warnings.push("🟡 Heart Disease: High sodium / salt detected");
    }

    if (saturatedFat > 5) {
      warnings.push("🔴 Heart Disease: High saturated fat");
    }
  }

  if (conditions.includes("hypertension")) {
    if (sodium > 400 || containsSalt) {
      warnings.push("🔴 Hypertension: High sodium / salt detected");
    }
  }

  if (conditions.includes("gout")) {
    if (
      ingredients.includes("yeast extract") ||
      ingredients.includes("anchovy") ||
      ingredients.includes("sardine")
    ) {
      warnings.push("🔴 Gout: High purine ingredients");
    }
  }

  if (conditions.includes("gluten allergy")) {
    if (
      ingredients.includes("wheat") ||
      ingredients.includes("gluten") ||
      ingredients.includes("barley") ||
      ingredients.includes("rye")
    ) {
      warnings.push("🔴 Gluten Allergy: Gluten detected");
    }
  }

  if (conditions.includes("dairy allergy")) {
    if (
      ingredients.includes("milk") ||
      ingredients.includes("whey") ||
      ingredients.includes("casein")
    ) {
      warnings.push("🔴 Dairy Allergy: Dairy detected");
    }
  }

  if (conditions.includes("nut allergy")) {
    if (
      ingredients.includes("peanut") ||
      ingredients.includes("almond") ||
      ingredients.includes("cashew") ||
      ingredients.includes("hazelnut")
    ) {
      warnings.push("🔴 Nut Allergy: Nut ingredient detected");
    }
  }

  if (warnings.length === 0) {
    warnings.push("🟢 No major concerns found for selected conditions.");
  }

  return warnings;
}