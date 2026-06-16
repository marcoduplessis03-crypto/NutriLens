import { lookupOpenFoodFactsProduct } from "./openFoodFacts";

export type ProductSource = "Open Food Facts";

export type LookupStage = "open-food-facts";

export type NormalizedProduct = {
  barcode: string;
  name: string;
  brand: string;
  ingredients: string;
  image: string | null;
  source: ProductSource;
  nutriments: {
    sodium_100g?: number;
    salt_100g?: number;
    potassium_100g?: number;
    sugars_100g?: number;
    carbohydrates_100g?: number;
    proteins_100g?: number;
    fat_100g?: number;
    "saturated-fat_100g"?: number;
    energy_kcal_100g?: number;
  };
};

export type ProductLookupResult = {
  product: NormalizedProduct | null;
  attemptedSources: ProductSource[];
};

export type LookupStageHandler = (stage: LookupStage) => void;

export async function lookupProduct(
  barcode: string,
  onStageChange?: LookupStageHandler
): Promise<ProductLookupResult> {
  onStageChange?.("open-food-facts");

  const product = await lookupOpenFoodFactsProduct(barcode);

  return {
    product,
    attemptedSources: ["Open Food Facts"],
  };
}
