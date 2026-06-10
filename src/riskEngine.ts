export function calculateRisk(product: any, conditions: string[]) {
  let score = 0;
  const reasons: string[] = [];

  const nutriments = product?.nutriments || {};
  const ingredientsText = String(
    product?.ingredients_text || product?.ingredients || ""
  ).toLowerCase();

  const sodium = Number(nutriments["sodium_100g"]) || 0;
  const salt = Number(nutriments["salt_100g"]) || 0;
  const potassium = Number(nutriments["potassium_100g"]) || 0;
  const sugars = Number(nutriments["sugars_100g"]) || 0;
  const saturatedFat =
    Number(nutriments["saturated-fat_100g"]) || 0;

  const normalisedConditions = conditions.map((condition) =>
    condition.toLowerCase().trim()
  );

  const hasKidney = normalisedConditions.some((condition) =>
    condition.includes("kidney")
  );

  const hasHypertension = normalisedConditions.some((condition) =>
    condition.includes("hypertension")
  );

  const hasDiabetes = normalisedConditions.some((condition) =>
    condition.includes("diabetes")
  );

  const hasHeartDisease = normalisedConditions.some(
    (condition) =>
      condition.includes("heart") ||
      condition.includes("cardiovascular")
  );

  const hasGout = normalisedConditions.some((condition) =>
    condition.includes("gout")
  );

  const containsSalt =
    ingredientsText.includes("salt") ||
    ingredientsText.includes("sodium chloride") ||
    ingredientsText.includes("sea salt");

  const containsPhosphate =
    ingredientsText.includes("phosphate") ||
    ingredientsText.includes("phosphoric");

  const containsCaffeine =
    ingredientsText.includes("caffeine") ||
    ingredientsText.includes("coffee extract") ||
    ingredientsText.includes("guarana");

  const containsHighPurineIngredient =
    ingredientsText.includes("yeast extract") ||
    ingredientsText.includes("liver") ||
    ingredientsText.includes("kidney") ||
    ingredientsText.includes("anchovy") ||
    ingredientsText.includes("sardine") ||
    ingredientsText.includes("mackerel");

  // Kidney disease
  if (hasKidney) {
    if (sodium > 0.6 || salt > 1.5 || containsSalt) {
      score += 30;
      reasons.push("High sodium / salt content");
    }

    if (potassium > 0.3) {
      score += 25;
      reasons.push("Elevated potassium");
    }

    if (containsPhosphate) {
      score += 25;
      reasons.push("Phosphate additives detected");
    }
  }

  // Hypertension
  if (hasHypertension) {
    if (sodium > 0.4 || salt > 1 || containsSalt) {
      score += 35;
      reasons.push(
        "High sodium / salt may increase blood pressure"
      );
    }

    if (containsCaffeine) {
      score += 15;
      reasons.push(
        "Caffeine may temporarily raise blood pressure"
      );
    }
  }

  // Diabetes
  if (hasDiabetes) {
    if (sugars > 10) {
      score += 30;
      reasons.push("High sugar content");
    }

    if (
      ingredientsText.includes("glucose syrup") ||
      ingredientsText.includes("corn syrup") ||
      ingredientsText.includes("fructose syrup")
    ) {
      score += 20;
      reasons.push("Added sugar syrup detected");
    }
  }

  // Heart disease
  if (hasHeartDisease) {
    if (saturatedFat > 5) {
      score += 30;
      reasons.push("High saturated fat content");
    }

    if (sodium > 0.4 || salt > 1 || containsSalt) {
      score += 25;
      reasons.push(
        "High sodium / salt may increase cardiovascular risk"
      );
    }
  }

  // Gout
  if (hasGout && containsHighPurineIngredient) {
    score += 30;
    reasons.push("High-purine ingredient detected");
  }

  if (score > 100) {
    score = 100;
  }

  return {
    score,
    reasons: [...new Set(reasons)],
  };
}