import { NormalizedProduct } from "../types/product";
import { fetchFromOpenFoodFacts } from "./openFoodFacts";
import { fetchFromUsda } from "./usdaFoodData";

export type LookupStage =
  | "open-food-facts"
  | "usda"
  | "complete";

export type LookupResult = {
  product: NormalizedProduct | null;
  attemptedSources: string[];
};

export async function lookupProduct(
  barcode: string,
  onStageChange?: (stage: LookupStage) => void
): Promise<LookupResult> {
  const attemptedSources: string[] = [];

  try {
    onStageChange?.("open-food-facts");
    attemptedSources.push("Open Food Facts");

    const openFoodFactsProduct =
      await fetchFromOpenFoodFacts(barcode);

    if (isUsableProduct(openFoodFactsProduct)) {
      onStageChange?.("complete");

      return {
        product: openFoodFactsProduct,
        attemptedSources,
      };
    }
  } catch (error) {
    console.warn("Open Food Facts lookup failed:", error);
  }

  try {
    onStageChange?.("usda");
    attemptedSources.push("USDA FoodData Central");

    const usdaProduct = await fetchFromUsda(barcode);

    if (isUsableProduct(usdaProduct)) {
      onStageChange?.("complete");

      return {
        product: usdaProduct,
        attemptedSources,
      };
    }
  } catch (error) {
    console.warn("USDA lookup failed:", error);
  }

  onStageChange?.("complete");

  return {
    product: null,
    attemptedSources,
  };
}

function isUsableProduct(
  product: NormalizedProduct | null
): product is NormalizedProduct {
  if (!product) return false;

  const hasName =
    product.name &&
    product.name.toLowerCase() !== "unknown product";

  const hasIngredients = Boolean(product.ingredients);

  const hasNutrition =
    Object.values(product.nutriments || {}).filter(
      (value) => value != null
    ).length > 0;

  return Boolean(hasName || hasIngredients || hasNutrition);
}