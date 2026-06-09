import { ingredientKnowledgeBase } from "./data/ingredientKnowledgeBase";

type ProductInput = {
  product_name?: string;
  ingredients_text?: string;
};

export function checkIngredientKnowledge(
  product: ProductInput,
  selectedConditions: string[]
) {
  const textToCheck = `${product.product_name || ""} ${
    product.ingredients_text || ""
  }`.toLowerCase();

  return ingredientKnowledgeBase
    .map((item) => {
      const appliesToCondition = item.conditions.some((condition) =>
        selectedConditions.includes(condition)
      );

      const matchedKeyword = item.keywords.find((keyword) =>
        textToCheck.includes(keyword.toLowerCase())
      );

      if (!appliesToCondition || !matchedKeyword) return null;

      return {
        ingredient: matchedKeyword,
        riskType: item.riskType,
        severity: item.severity,
        message: item.message,
      };
    })
    .filter(Boolean);
}