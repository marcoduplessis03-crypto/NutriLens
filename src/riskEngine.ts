export function calculateRisk(product: any, conditions: string[]) {
  let score = 0;
  const reasons: string[] = [];

  const nutriments = product?.nutriments || {};
  const ingredientsText = (product?.ingredients_text || "").toLowerCase();

  const sodium = nutriments["sodium_100g"] || 0;
  const salt = nutriments["salt_100g"] || 0;
  const potassium = nutriments["potassium_100g"] || 0;

  const hasKidney = conditions.some((condition) =>
  condition.toLowerCase().includes("kidney")
);

if (hasKidney) {
    if (sodium > 0.6 || salt > 1.5) {
      score += 30;
      reasons.push("High sodium / salt content");
    }

    if (potassium > 0.3) {
      score += 25;
      reasons.push("Elevated potassium");
    }

    if (
      ingredientsText.includes("phosphate") ||
      ingredientsText.includes("phosphoric")
    ) {
      score += 25;
      reasons.push("Phosphate additives detected");
    }
  }

  if (score > 100) score = 100;

  return {
    score,
    reasons,
  };
}